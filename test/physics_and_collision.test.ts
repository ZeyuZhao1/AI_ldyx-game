import { describe, it, expect } from 'vitest';
import { Physics } from '../src/engine/Physics';
import { Collision } from '../src/engine/Collision';
import { ActiveBlock } from '../src/types/game';
import { GAME_CONFIG } from '../src/data/gameConfig';

describe('Physics and Trajectory', () => {
  it('calculates pull vector and clamps to powerCap', () => {
    const powerCap = 100;
    // Pulling 150 px away
    const pull = Physics.calculatePull(200, 200, 50, 200, powerCap);
    expect(pull.len).toBeCloseTo(100, 1);
    expect(pull.dx).toBeCloseTo(-100, 1);
    expect(pull.dy).toBeCloseTo(0, 1);
  });

  it('rejects forward pull for land-based launcher (must pull left to shoot right)', () => {
    const powerCap = 135;
    // Pulled to right (dx = +30)
    const aim = Physics.calculateAim(30, 20, powerCap, false);
    expect(aim).toBeNull();

    // Pulled to left (dx = -50)
    const validAim = Physics.calculateAim(-50, -20, powerCap, false);
    expect(validAim).not.toBeNull();
    expect(validAim?.vx).toBeGreaterThan(0);
  });

  it('allows both leftward and rightward aim for submarine launcher', () => {
    const powerCap = 100;
    // Pulled to right -> shoots left
    const aimLeft = Physics.calculateAim(40, -10, powerCap, true);
    expect(aimLeft).not.toBeNull();
    expect(aimLeft?.vx).toBeLessThan(0);

    // Pulled to left -> shoots right
    const aimRight = Physics.calculateAim(-40, -10, powerCap, true);
    expect(aimRight).not.toBeNull();
    expect(aimRight?.vx).toBeGreaterThan(0);
  });

  it('simulates trajectory cleanly stopping at ground level', () => {
    const points = Physics.simulateTrajectory(95, 432, 200, -200, 0, GAME_CONFIG.GROUND_Y);
    expect(points.length).toBeGreaterThan(5);
    for (const pt of points) {
      expect(pt.y).toBeLessThanOrEqual(GAME_CONFIG.GROUND_Y);
    }
  });
});

describe('Continuous Collision Detection', () => {
  it('detects high-speed projectile sweeping through thin obstacle (no tunneling)', () => {
    const blocks: ActiveBlock[] = [
      {
        id: 'thin_wall',
        x: 500,
        y: 400,
        w: 10,
        h: 50,
        type: 'steel',
        hp: 2,
        vy: 0,
      },
    ];

    // Projectile moves from x=450 to x=550 in a single frame (sweeps through x=500)
    const hit = Collision.sweepSegmentAgainstBlocks(450, 420, 550, 420, blocks, 4);
    expect(hit.hit).toBe(true);
    expect(hit.block?.id).toBe('thin_wall');
    expect(hit.contactX).toBeLessThanOrEqual(505);
  });

  it('detects ground collision correctly', () => {
    const groundY = 482;
    // Moving from y=450 to y=520
    const hit = Collision.sweepSegmentAgainstGround(450, 520, 300, 350, groundY);
    expect(hit).not.toBeNull();
    expect(hit?.hit).toBe(true);
    expect(hit?.contactY).toBe(groundY);
    expect(hit?.contactX).toBeGreaterThan(300);
    expect(hit?.contactX).toBeLessThan(350);
  });

  it('detects orbit circle entry', () => {
    // Circle at (730, 150) with radius 46
    const intersects = Collision.segmentIntersectsCircle(700, 150, 760, 150, 730, 150, 46);
    expect(intersects).toBe(true);

    const misses = Collision.segmentIntersectsCircle(700, 50, 760, 50, 730, 150, 46);
    expect(misses).toBe(false);
  });

  it('correctly checks block ground and vertical support', () => {
    const groundY = 482;
    const baseBlock: ActiveBlock = {
      id: 'base',
      x: 600,
      y: groundY - 40,
      w: 60,
      h: 40,
      type: 'concrete',
      hp: 1,
      vy: 0,
    };

    const topBlock: ActiveBlock = {
      id: 'top',
      x: 610,
      y: groundY - 80,
      w: 40,
      h: 40,
      type: 'core',
      hp: 1,
      vy: 0,
    };

    const floatingBlock: ActiveBlock = {
      id: 'float',
      x: 750,
      y: 200,
      w: 40,
      h: 40,
      type: 'core',
      hp: 1,
      vy: 0,
    };

    const all = [baseBlock, topBlock, floatingBlock];

    expect(Collision.isBlockSupported(baseBlock, all, groundY)).toBe(true);
    expect(Collision.isBlockSupported(topBlock, all, groundY)).toBe(true);
    expect(Collision.isBlockSupported(floatingBlock, all, groundY)).toBe(false);
  });
});
