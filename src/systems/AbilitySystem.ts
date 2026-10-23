import { GAME_CONFIG } from '../data/gameConfig';
import { Missile } from '../types/game';

export interface AbilityActivationResult {
  success: boolean;
  message?: string;
  type?: 'glide' | 'stage2' | 'shield' | 'deploy';
}

export class AbilitySystem {
  /**
   * Activates Qian Xuesen trajectory glide.
   * Properly supports both rightward and leftward firing trajectories!
   */
  public static triggerGlide(
    missile: Missile,
    isQianUnlocked: boolean
  ): AbilityActivationResult {
    if (!isQianUnlocked) {
      return { success: false };
    }

    if (missile.glideUsed) {
      return { success: false };
    }

    // Direction sign preserves leftward / rightward firing direction
    const direction = Math.sign(missile.vx) || 1;

    missile.glideUsed = true;
    missile.glideTimer = GAME_CONFIG.GLIDE_DURATION;

    // Flatten vertical trajectory and surge horizontal velocity along missile heading
    missile.vy *= GAME_CONFIG.GLIDE_VY_SCALE;
    missile.vx = missile.vx * GAME_CONFIG.GLIDE_VX_SCALE + direction * GAME_CONFIG.GLIDE_VX_ADD;

    return {
      success: true,
      type: 'glide',
      message: '钱学森弹道发动：进入高超音速滑翔段！',
    };
  }

  /**
   * Activates second-stage rocket engine ignition (Tu Shoue).
   * Accelerates in the active flight heading and provides climb impulse.
   */
  public static triggerStage2(
    missile: Missile,
    isStage2Available: boolean
  ): AbilityActivationResult {
    if (!isStage2Available) {
      return { success: false };
    }

    if (!missile.glideUsed || missile.stage2Used) {
      return { success: false };
    }

    const direction = Math.sign(missile.vx) || 1;

    missile.stage2Used = true;
    missile.vx = missile.vx * GAME_CONFIG.STAGE2_VX_SCALE + direction * GAME_CONFIG.STAGE2_VX_ADD;
    missile.vy = Math.min(missile.vy, 0) + GAME_CONFIG.STAGE2_VY_IMPULSE;

    return {
      success: true,
      type: 'stage2',
      message: '二级点火！火箭发动机再次启动！',
    };
  }

  /**
   * Validates if a deployable nuclear device can be positioned at (x, y).
   */
  public static isValidDeployLocation(x: number, y: number): boolean {
    return (
      x >= 380 &&
      x <= GAME_CONFIG.WORLD_WIDTH - 20 &&
      y >= 60 &&
      y <= GAME_CONFIG.GROUND_Y - 12
    );
  }
}
