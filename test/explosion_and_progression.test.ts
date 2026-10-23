import { describe, it, expect } from 'vitest';
import { ExplosionSystem } from '../src/systems/ExplosionSystem';
import { ProgressionSystem } from '../src/systems/ProgressionSystem';
import { ActiveBlock, DeployedDevice } from '../src/types/game';
import { GAME_CONFIG } from '../src/data/gameConfig';

describe('Explosion System', () => {
  it('applies radial damage and destroys core targets within inner radius', () => {
    const blocks: ActiveBlock[] = [
      {
        id: 'target_core',
        x: 600,
        y: 400,
        w: 40,
        h: 40,
        type: 'core',
        hp: 1,
        vy: 0,
      },
      {
        id: 'steel_wall',
        x: 600,
        y: 442,
        w: 50,
        h: 40,
        type: 'steel',
        hp: 2,
        vy: 0,
      },
    ];

    const res = ExplosionSystem.trigger(620, 420, 'atomic', blocks, [], false);
    expect(res.radius).toBe(135);
    expect(res.damagedBlocks.length).toBe(2);

    const targetCore = blocks.find((b) => b.id === 'target_core');
    expect(targetCore?.hp).toBeLessThanOrEqual(0);
  });

  it('boosts nuclear blast radius by 30% when Uranium enrichment is unlocked', () => {
    const blocks: ActiveBlock[] = [];
    const baseRes = ExplosionSystem.trigger(500, 400, 'atomic', blocks, [], false);
    const enrichedRes = ExplosionSystem.trigger(500, 400, 'atomic', blocks, [], true);

    expect(enrichedRes.radius).toBeCloseTo(baseRes.radius * 1.3, 1);
  });

  it('detects chain detonation with nearby deployed nuclear towers', () => {
    const deployedDevices: DeployedDevice[] = [
      { id: 'd1', x: 650, y: 400 }, // within radius 135 + 15
      { id: 'd2', x: 900, y: 400 }, // far outside
    ];

    const res = ExplosionSystem.trigger(600, 400, 'atomic', [], deployedDevices, false);
    expect(res.chainedDevices.length).toBe(1);
    expect(res.chainedDevices[0].id).toBe('d1');
  });
});

describe('Progression System', () => {
  it('calculates power cap based on unlocked scientists and launcher type', () => {
    // Base cap is 135
    const baseCap = ProgressionSystem.calculatePowerCap([], false);
    expect(baseCap).toBe(135);

    // With Guo Yonghuai (id: 'guo', bonus +45 + 6 = 51)
    const withGuo = ProgressionSystem.calculatePowerCap(['guo'], false);
    expect(withGuo).toBe(135 + 6 + 45);

    // Submarine power reduction by 28% (multiplier 0.72)
    const subCap = ProgressionSystem.calculatePowerCap([], true);
    expect(subCap).toBeCloseTo(135 * 0.72);
  });

  it('enforces warhead unlocks based on level progress and scientist roster', () => {
    // Normal is never locked
    expect(ProgressionSystem.isWarheadLocked('normal', 0, [])).toBe(false);

    // Atomic unlocked at level 4 or with milestone
    expect(ProgressionSystem.isWarheadLocked('atomic', 2, [])).toBe(true);
    expect(ProgressionSystem.isWarheadLocked('atomic', 4, [])).toBe(false);
    expect(ProgressionSystem.isWarheadLocked('atomic', 1, ['atomic'])).toBe(false);

    // Hydro unlocked at level 5 or with Yu Min
    expect(ProgressionSystem.isWarheadLocked('hydro', 3, [])).toBe(true);
    expect(ProgressionSystem.isWarheadLocked('hydro', 5, [])).toBe(false);
    expect(ProgressionSystem.isWarheadLocked('hydro', 2, ['yu'])).toBe(false);
  });

  it('generates procedural endless blocks without obstructing the submarine bay', () => {
    // Pseudo-random deterministic generator for testing
    let seed = 123456789;
    const testRng = () => {
      seed = (seed * 1664525 + 1013904223) % 4294967296;
      return seed / 4294967296;
    };

    const blocks = ProgressionSystem.generateEndlessWaveBlocks(3, testRng);
    expect(blocks.length).toBeGreaterThan(3);

    const subX = GAME_CONFIG.SUB_POS.x;
    for (const b of blocks) {
      // Must not collide with submarine bounding zone
      const overlapsSub = b.x < subX + 56 && b.x + b.w > subX - 56;
      expect(overlapsSub).toBe(false);
    }

    const cores = blocks.filter((b) => b.type === 'core');
    expect(cores.length).toBeGreaterThanOrEqual(2);
  });
});
