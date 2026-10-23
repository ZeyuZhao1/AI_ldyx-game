import { GAME_CONFIG } from '../data/gameConfig';
import { SCIENTISTS } from '../data/scientists';
import { ActiveBlock, WarheadType } from '../types/game';

export class ProgressionSystem {
  public static isScientistUnlocked(
    scientistId: string,
    unlockedList: readonly string[]
  ): boolean {
    return unlockedList.includes(scientistId);
  }

  public static isSubmarineAvailable(
    levelIndex: number,
    unlockedList: readonly string[]
  ): boolean {
    return unlockedList.includes('sub') || levelIndex >= 11;
  }

  public static isStage2Available(
    levelIndex: number,
    unlockedList: readonly string[]
  ): boolean {
    return unlockedList.includes('stage2') || levelIndex >= 9;
  }

  public static isEnrichmentAvailable(
    levelIndex: number,
    unlockedList: readonly string[]
  ): boolean {
    return unlockedList.includes('enrich') || levelIndex >= 1;
  }

  public static isWarheadLocked(
    type: WarheadType,
    levelIndex: number,
    unlockedList: readonly string[]
  ): boolean {
    if (type === 'atomic') return !unlockedList.includes('atomic') && levelIndex < 4;
    if (type === 'hydro') return !unlockedList.includes('yu') && levelIndex < 5;
    if (type === 'bunker') return !unlockedList.includes('bunker') && levelIndex < 6;
    return false;
  }

  public static isDeployLocked(
    levelIndex: number,
    unlockedList: readonly string[]
  ): boolean {
    return !unlockedList.includes('deng') && levelIndex < 3;
  }

  public static calculatePowerCap(
    unlockedList: readonly string[],
    isSubmarine: boolean
  ): number {
    let cap = GAME_CONFIG.BASE_POWER_CAP + unlockedList.length * GAME_CONFIG.POWER_PER_SCIENTIST;
    for (const sc of SCIENTISTS) {
      if (sc.pow && unlockedList.includes(sc.id)) {
        cap += sc.pow;
      }
    }
    if (isSubmarine) {
      cap *= GAME_CONFIG.SUB_POWER_MULTIPLIER;
    }
    return cap;
  }

  /**
   * Generates procedural defensive targets for Endless Mode waves.
   * Ensures structures do not obstruct submarine launch bay at x=640.
   */
  public static generateEndlessWaveBlocks(
    wave: number,
    rng: () => number = Math.random
  ): ActiveBlock[] {
    const blocks: ActiveBlock[] = [];
    const nCore = 2 + Math.min(wave, 4);
    const subX = GAME_CONFIG.SUB_POS.x;
    const groundY = GAME_CONFIG.GROUND_Y;

    const clearOfSub = (bx: number, fw: number) =>
      bx + fw <= subX - 56 || bx >= subX + 56;

    let tries = 0;
    let blockIdCounter = 1;

    while (blocks.filter((b) => b.type === 'core').length < nCore && tries++ < 60) {
      const bx = 480 + Math.floor(rng() * 10) * 48;
      const kind = rng();

      if (kind < 0.3) {
        // Single pillar tower
        if (!clearOfSub(bx, 48)) continue;
        const sup = rng() < 0.5 ? 'steel' : 'concrete';
        blocks.push({
          id: `endless_blk_${blockIdCounter++}`,
          x: bx,
          y: groundY - 40,
          w: 48,
          h: 40,
          type: sup,
          hp: sup === 'steel' ? 2 : 1,
          vy: 0,
        });
        blocks.push({
          id: `endless_blk_${blockIdCounter++}`,
          x: bx + 4,
          y: groundY - 80,
          w: 40,
          h: 40,
          type: 'core',
          hp: 1,
          vy: 0,
        });
      } else if (kind < 0.55) {
        // Three-level tower
        if (!clearOfSub(bx, 40)) continue;
        blocks.push({
          id: `endless_blk_${blockIdCounter++}`,
          x: bx,
          y: groundY - 40,
          w: 40,
          h: 40,
          type: 'concrete',
          hp: 1,
          vy: 0,
        });
        blocks.push({
          id: `endless_blk_${blockIdCounter++}`,
          x: bx,
          y: groundY - 80,
          w: 40,
          h: 40,
          type: 'steel',
          hp: 2,
          vy: 0,
        });
        blocks.push({
          id: `endless_blk_${blockIdCounter++}`,
          x: bx,
          y: groundY - 120,
          w: 40,
          h: 40,
          type: 'core',
          hp: 1,
          vy: 0,
        });
      } else if (kind < 0.8) {
        // Bunker: dual steel wall shielding core
        if (!clearOfSub(bx, 94)) continue;
        blocks.push({
          id: `endless_blk_${blockIdCounter++}`,
          x: bx,
          y: groundY - 40,
          w: 22,
          h: 40,
          type: 'steel',
          hp: 2,
          vy: 0,
        });
        blocks.push({
          id: `endless_blk_${blockIdCounter++}`,
          x: bx + 22,
          y: groundY - 40,
          w: 22,
          h: 40,
          type: 'steel',
          hp: 2,
          vy: 0,
        });
        blocks.push({
          id: `endless_blk_${blockIdCounter++}`,
          x: bx + 54,
          y: groundY - 40,
          w: 40,
          h: 40,
          type: 'core',
          hp: 1,
          vy: 0,
        });
      } else {
        // Stepped pyramid
        if (!clearOfSub(bx, 100)) continue;
        blocks.push({
          id: `endless_blk_${blockIdCounter++}`,
          x: bx,
          y: groundY - 40,
          w: 100,
          h: 40,
          type: 'concrete',
          hp: 1,
          vy: 0,
        });
        blocks.push({
          id: `endless_blk_${blockIdCounter++}`,
          x: bx + 30,
          y: groundY - 80,
          w: 40,
          h: 40,
          type: 'steel',
          hp: 2,
          vy: 0,
        });
        blocks.push({
          id: `endless_blk_${blockIdCounter++}`,
          x: bx + 30,
          y: groundY - 120,
          w: 40,
          h: 40,
          type: 'core',
          hp: 1,
          vy: 0,
        });
      }
    }

    // Outer shielding walls
    const walls = Math.min(wave, 3);
    for (let i = 0; i < walls; i++) {
      const wx = 480 + Math.floor(rng() * 10) * 48;
      if (!clearOfSub(wx, 24)) continue;
      blocks.push({
        id: `endless_blk_${blockIdCounter++}`,
        x: wx,
        y: groundY - 120,
        w: 24,
        h: 120,
        type: 'steel',
        hp: 2,
        vy: 0,
      });
    }

    return blocks;
  }
}
