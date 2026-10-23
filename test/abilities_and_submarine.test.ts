import { describe, it, expect } from 'vitest';
import { AbilitySystem } from '../src/systems/AbilitySystem';
import { Missile } from '../src/types/game';

describe('Ability System and Submarine Bidirectional Flight', () => {
  it('activates Qian Xuesen glide in rightward flight (positive vx)', () => {
    const missile: Missile = {
      id: 'm1',
      x: 100,
      y: 400,
      vx: 300,
      vy: -150,
      type: 'normal',
      trail: [],
      pen: 0,
      glideUsed: false,
      glideTimer: 0,
      stage2Used: false,
      flightTimer: 1.0,
    };

    const res = AbilitySystem.triggerGlide(missile, true);
    expect(res.success).toBe(true);
    expect(missile.glideUsed).toBe(true);
    expect(missile.glideTimer).toBe(1.5);
    // vx surges forward to the right
    expect(missile.vx).toBe(300 * 1.25 + 130); // 375 + 130 = 505
    // vy is flattened
    expect(missile.vy).toBeCloseTo(-150 * 0.15);
  });

  it('correctly activates Qian Xuesen glide in LEFTWARD flight (submarine firing left, negative vx)', () => {
    const missile: Missile = {
      id: 'm2',
      x: 640,
      y: 474,
      vx: -250, // Travelling leftward towards distant target
      vy: -120,
      type: 'normal',
      trail: [],
      pen: 0,
      glideUsed: false,
      glideTimer: 0,
      stage2Used: false,
      flightTimer: 0.8,
    };

    const res = AbilitySystem.triggerGlide(missile, true);
    expect(res.success).toBe(true);
    expect(missile.glideUsed).toBe(true);
    // Crucial bug fix check: vx must surge further to the LEFT (more negative), NOT to the right!
    expect(missile.vx).toBe(-250 * 1.25 - 130); // -312.5 - 130 = -442.5
    expect(missile.vx).toBeLessThan(-250);
    expect(missile.vy).toBeCloseTo(-120 * 0.15);
  });

  it('activates second-stage propulsion in leftward and rightward flight', () => {
    const missileRight: Missile = {
      id: 'm3',
      x: 500,
      y: 300,
      vx: 400,
      vy: 10,
      type: 'normal',
      trail: [],
      pen: 0,
      glideUsed: true,
      glideTimer: 0.5,
      stage2Used: false,
      flightTimer: 2.0,
    };

    const resRight = AbilitySystem.triggerStage2(missileRight, true);
    expect(resRight.success).toBe(true);
    expect(missileRight.stage2Used).toBe(true);
    expect(missileRight.vx).toBeGreaterThan(400);
    expect(missileRight.vy).toBeLessThan(0); // Upward boost

    const missileLeft: Missile = {
      id: 'm4',
      x: 500,
      y: 300,
      vx: -400,
      vy: 10,
      type: 'normal',
      trail: [],
      pen: 0,
      glideUsed: true,
      glideTimer: 0.5,
      stage2Used: false,
      flightTimer: 2.0,
    };

    const resLeft = AbilitySystem.triggerStage2(missileLeft, true);
    expect(resLeft.success).toBe(true);
    expect(missileLeft.stage2Used).toBe(true);
    expect(missileLeft.vx).toBeLessThan(-400); // Accelerated further left
    expect(missileLeft.vy).toBeLessThan(0);
  });

  it('validates deployable nuclear tower placement zone', () => {
    // Valid location in right target field
    expect(AbilitySystem.isValidDeployLocation(600, 350)).toBe(true);
    // Invalid location too close to launcher on left
    expect(AbilitySystem.isValidDeployLocation(200, 350)).toBe(false);
    // Invalid location in deep underground
    expect(AbilitySystem.isValidDeployLocation(600, 500)).toBe(false);
  });
});
