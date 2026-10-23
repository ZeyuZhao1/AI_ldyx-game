import { ActiveBlock } from '../types/game';

export interface HitResult {
  hit: boolean;
  t: number; // 0..1 along line segment
  contactX: number;
  contactY: number;
  block?: ActiveBlock;
  isGround?: boolean;
}

export class Collision {
  /**
   * Swept segment intersection test against a collection of blocks.
   * Finds the earliest collision along segment (x0, y0) -> (x1, y1).
   */
  public static sweepSegmentAgainstBlocks(
    x0: number,
    y0: number,
    x1: number,
    y1: number,
    blocks: readonly ActiveBlock[],
    radius: number = 4
  ): HitResult {
    let earliestT = 1.0;
    let bestHit: HitResult = {
      hit: false,
      t: 1.0,
      contactX: x1,
      contactY: y1,
    };

    for (const b of blocks) {
      if (b.hp <= 0) continue;

      // Expand block AABB by projectile radius for swept circle vs AABB
      const minX = b.x - radius;
      const maxX = b.x + b.w + radius;
      const minY = b.y - radius;
      const maxY = b.y + b.h + radius;

      const hitT = this.segmentAABB(x0, y0, x1, y1, minX, minY, maxX, maxY);
      if (hitT !== null && hitT >= 0 && hitT < earliestT) {
        earliestT = hitT;
        bestHit = {
          hit: true,
          t: hitT,
          contactX: x0 + (x1 - x0) * hitT,
          contactY: y0 + (y1 - y0) * hitT,
          block: b,
        };
      }
    }

    return bestHit;
  }

  /**
   * Continuous test against ground line y = groundY.
   */
  public static sweepSegmentAgainstGround(
    y0: number,
    y1: number,
    x0: number,
    x1: number,
    groundY: number
  ): HitResult | null {
    if (y0 < groundY && y1 >= groundY) {
      const t = (groundY - y0) / (y1 - y0);
      return {
        hit: true,
        t: Math.max(0, Math.min(1, t)),
        contactX: x0 + (x1 - x0) * t,
        contactY: groundY,
        isGround: true,
      };
    }
    if (y0 >= groundY) {
      return {
        hit: true,
        t: 0,
        contactX: x0,
        contactY: groundY,
        isGround: true,
      };
    }
    return null;
  }

  /**
   * Tests if segment intersects circular orbit window.
   */
  public static segmentIntersectsCircle(
    x0: number,
    y0: number,
    x1: number,
    y1: number,
    cx: number,
    cy: number,
    r: number
  ): boolean {
    const dx = x1 - x0;
    const dy = y1 - y0;
    const lenSq = dx * dx + dy * dy;

    if (lenSq === 0) {
      return Math.hypot(x0 - cx, y0 - cy) <= r;
    }

    // Projection fraction t along segment
    const t = Math.max(0, Math.min(1, ((cx - x0) * dx + (cy - y0) * dy) / lenSq));
    const closestX = x0 + t * dx;
    const closestY = y0 + t * dy;

    return Math.hypot(closestX - cx, closestY - cy) <= r;
  }

  /**
   * Determines if a block is supported by the ground or another block beneath it.
   */
  public static isBlockSupported(
    block: ActiveBlock,
    allBlocks: readonly ActiveBlock[],
    groundY: number
  ): boolean {
    if (block.y + block.h >= groundY - 0.5) {
      return true;
    }

    for (const other of allBlocks) {
      if (other.id === block.id || other.hp <= 0) continue;
      // Is 'other' directly underneath 'block' with horizontal overlap?
      const verticallyAdjacent = Math.abs(other.y - (block.y + block.h)) <= 3;
      const horizontallyOverlaps = block.x < other.x + other.w && block.x + block.w > other.x;
      if (verticallyAdjacent && horizontallyOverlaps) {
        return true;
      }
    }

    return false;
  }

  /**
   * Line segment (x0, y0) to (x1, y1) vs Axis-Aligned Bounding Box.
   * Returns entry fraction t in [0, 1], or null if no intersection.
   */
  private static segmentAABB(
    x0: number,
    y0: number,
    x1: number,
    y1: number,
    minX: number,
    minY: number,
    maxX: number,
    maxY: number
  ): number | null {
    const dx = x1 - x0;
    const dy = y1 - y0;

    let tMin = 0.0;
    let tMax = 1.0;

    // X axis
    if (Math.abs(dx) < 1e-8) {
      if (x0 < minX || x0 > maxX) return null;
    } else {
      const invD = 1.0 / dx;
      let t1 = (minX - x0) * invD;
      let t2 = (maxX - x0) * invD;
      if (t1 > t2) {
        const tmp = t1;
        t1 = t2;
        t2 = tmp;
      }
      tMin = Math.max(tMin, t1);
      tMax = Math.min(tMax, t2);
      if (tMin > tMax) return null;
    }

    // Y axis
    if (Math.abs(dy) < 1e-8) {
      if (y0 < minY || y0 > maxY) return null;
    } else {
      const invD = 1.0 / dy;
      let t1 = (minY - y0) * invD;
      let t2 = (maxY - y0) * invD;
      if (t1 > t2) {
        const tmp = t1;
        t1 = t2;
        t2 = tmp;
      }
      tMin = Math.max(tMin, t1);
      tMax = Math.min(tMax, t2);
      if (tMin > tMax) return null;
    }

    return tMin >= 0 && tMin <= 1.0 ? tMin : null;
  }
}
