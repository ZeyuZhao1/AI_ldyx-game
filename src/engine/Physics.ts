import { GAME_CONFIG } from '../data/gameConfig';
import { ActiveBlock, AimVector } from '../types/game';
import { Collision } from './Collision';

export class Physics {
  /**
   * Clamps drag vector to the effective power cap.
   */
  public static calculatePull(
    startX: number,
    startY: number,
    currentX: number,
    currentY: number,
    powerCap: number
  ): { dx: number; dy: number; len: number } {
    let dx = currentX - startX;
    let dy = currentY - startY;
    const len = Math.hypot(dx, dy);

    if (len > powerCap && len > 0) {
      const scale = powerCap / len;
      dx *= scale;
      dy *= scale;
    }

    return { dx, dy, len: Math.min(len, powerCap) };
  }

  /**
   * Converts pull vector to initial firing velocity.
   * For land-based launcher: dx must be negative (pulled to the left, shoots right).
   * For submarine launcher: dx can be negative (shoots right) or positive (shoots left).
   */
  public static calculateAim(
    pullDx: number,
    pullDy: number,
    powerCap: number,
    isSubmarine: boolean
  ): AimVector | null {
    const minPull = 10;
    if (isSubmarine) {
      if (Math.abs(pullDx) < minPull) return null;
    } else {
      if (-pullDx < minPull) return null; // Land-based launcher can only pull left to fire right
    }

    const pullLen = Math.hypot(pullDx, pullDy);
    const power = Math.min(1.0, pullLen / Math.max(1, powerCap));

    return {
      vx: -pullDx * GAME_CONFIG.POWER_SCALE,
      vy: -pullDy * GAME_CONFIG.POWER_SCALE,
      power,
    };
  }

  /**
   * Pre-calculates trajectory points for the predictive aiming scope.
   */
  public static simulateTrajectory(
    originX: number,
    originY: number,
    vx0: number,
    vy0: number,
    wind: number,
    groundY: number = GAME_CONFIG.GROUND_Y,
    maxPoints: number = 120,
    stepDt: number = 0.05
  ): Array<{ x: number; y: number }> {
    const points: Array<{ x: number; y: number }> = [];
    let x = originX;
    let y = originY;
    let vx = vx0;
    let vy = vy0;

    for (let i = 0; i < maxPoints; i++) {
      vx += wind * stepDt;
      vy += GAME_CONFIG.GRAVITY * stepDt;
      x += vx * stepDt;
      y += vy * stepDt;

      if (y > groundY || x < -50 || x > GAME_CONFIG.WORLD_WIDTH + 50) {
        break;
      }

      if (i % 2 === 0) {
        points.push({ x, y });
      }
    }

    return points;
  }

  /**
   * Settles unsupported blocks downward under gravity.
   * Returns true if any block moved.
   */
  public static settleBlocks(
    blocks: ActiveBlock[],
    dt: number,
    groundY: number = GAME_CONFIG.GROUND_Y,
    onBlockLand?: (x: number, y: number) => void
  ): boolean {
    // Sort bottom-to-top so supports are evaluated in physical sequence
    blocks.sort((a, b) => b.y + b.h - (a.y + a.h));
    let moved = false;

    for (const b of blocks) {
      if (b.hp <= 0) continue;

      if (Collision.isBlockSupported(b, blocks, groundY)) {
        b.vy = 0;
        continue;
      }

      moved = true;
      b.vy = (b.vy || 0) + GAME_CONFIG.GRAVITY * dt;
      b.y += b.vy * dt;

      if (b.y + b.h >= groundY) {
        b.y = groundY - b.h;
        b.vy = 0;
        onBlockLand?.(b.x + b.w / 2, groundY);
      } else {
        // Check collision with blocks underneath
        const landingSurface = blocks.find(
          (o) =>
            o.id !== b.id &&
            o.hp > 0 &&
            o.y >= b.y + b.h &&
            b.x < o.x + o.w &&
            b.x + b.w > o.x
        );

        if (landingSurface && b.y + b.h >= landingSurface.y) {
          b.y = landingSurface.y - b.h;
          b.vy = 0;
          onBlockLand?.(b.x + b.w / 2, b.y + b.h);
        }
      }
    }

    return moved;
  }
}
