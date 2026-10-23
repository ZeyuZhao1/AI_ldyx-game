import { GAME_CONFIG, WARHEAD_CONFIGS } from '../data/gameConfig';
import { ActiveBlock, DeployedDevice, WarheadType } from '../types/game';

export interface ExplosionResult {
  x: number;
  y: number;
  type: WarheadType;
  radius: number;
  shakeMagnitude: number;
  shakeDuration: number;
  damagedBlocks: Array<{ block: ActiveBlock; hpRemoved: number; destroyed: boolean }>;
  chainedDevices: DeployedDevice[];
}

export class ExplosionSystem {
  /**
   * Evaluates explosion impact against blocks and deployed devices.
   */
  public static trigger(
    x: number,
    y: number,
    type: WarheadType,
    blocks: ActiveBlock[],
    deployedDevices: DeployedDevice[],
    hasEnrichment: boolean
  ): ExplosionResult {
    const info = WARHEAD_CONFIGS[type];
    const isNuclear = type !== 'normal' && type !== 'bunker';
    const effectiveRadius = (hasEnrichment && isNuclear)
      ? info.r * GAME_CONFIG.ENRICHMENT_BLAST_MULTIPLIER
      : info.r;

    const shakeMagnitude =
      type === 'hydro' ? 16 : type === 'deploy' ? 12 : type === 'atomic' ? 9 : 4;
    const shakeDuration = type === 'hydro' ? 0.7 : 0.35;

    const damagedBlocks: Array<{ block: ActiveBlock; hpRemoved: number; destroyed: boolean }> = [];

    for (const b of blocks) {
      if (b.hp <= 0) continue;

      // Closest point on AABB to explosion origin
      const cx = Math.max(b.x, Math.min(x, b.x + b.w));
      const cy = Math.max(b.y, Math.min(y, b.y + b.h));
      const dist = Math.hypot(cx - x, cy - y);

      if (dist < effectiveRadius) {
        // Inner core of explosion does maximum damage, outer rim does 1 HP
        const damage = dist < effectiveRadius * 0.55 ? info.dmg : 1;
        b.hp -= damage;
        const destroyed = b.hp <= 0;
        damagedBlocks.push({ block: b, hpRemoved: damage, destroyed });
      }
    }

    // Check chain reactions against deployed nuclear towers within blast zone
    const chainedDevices: DeployedDevice[] = [];
    const triggerThreshold = effectiveRadius + 15;

    for (const dev of deployedDevices) {
      if (Math.hypot(dev.x - x, dev.y - y) < triggerThreshold) {
        chainedDevices.push(dev);
      }
    }

    return {
      x,
      y,
      type,
      radius: effectiveRadius,
      shakeMagnitude,
      shakeDuration,
      damagedBlocks,
      chainedDevices,
    };
  }
}
