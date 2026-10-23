/**
 * Core type definitions for 两弹一星 (Two Bombs, One Satellite)
 */

export type WarheadType = 'normal' | 'atomic' | 'hydro' | 'bunker' | 'deploy';

export type BlockType = 'concrete' | 'steel' | 'core';

export interface WarheadConfig {
  readonly id: WarheadType;
  readonly name: string;
  readonly r: number;
  readonly dmg: number;
  readonly color: string;
  readonly description: string;
}

export interface ScientistDefinition {
  readonly id: string;
  readonly name: string;
  readonly after: number; // Unlocks after completing level index (1-based index)
  readonly title: string;
  readonly unlock: string;
  readonly quote: string;
  readonly desc: string;
  readonly pow?: number; // Power cap bonus
  readonly quoteNeedsVerification?: boolean;
}

export interface LevelBlockDef {
  readonly x: number;
  readonly y: number;
  readonly w: number;
  readonly h: number;
  readonly type: BlockType;
}

export interface LevelDefinition {
  readonly id: string;
  readonly year: string;
  readonly name: string;
  readonly wind: number;
  readonly intro: string;
  readonly fact: string;
  readonly milestoneId?: string;
  readonly milestone?: string;
  readonly orbit?: { readonly x: number; readonly y: number; readonly r: number };
  readonly warheads: Partial<Record<WarheadType, number>> & { readonly normal: number };
  readonly blocks: readonly [number, number, number, number, BlockType][];
  readonly biome?: 'desert' | 'industrial' | 'plateau' | 'ocean' | 'space';
}

export interface ActiveBlock {
  id: string;
  x: number;
  y: number;
  w: number;
  h: number;
  type: BlockType;
  hp: number;
  vy: number;
}

export interface Missile {
  id: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  type: WarheadType;
  trail: Array<{ x: number; y: number }>;
  pen: number; // Penetration counter for bunker buster
  glideUsed: boolean;
  glideTimer: number;
  stage2Used: boolean;
  flightTimer: number;
}

export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  color: string;
  r: number;
}

export interface DeployedDevice {
  id: string;
  x: number;
  y: number;
}

export interface DemoState {
  t: number;
  flying: boolean;
  x: number;
  y: number;
  vx: number;
  vy: number;
  trail: Array<{ x: number; y: number }>;
}

export type GameLifecycleState =
  | 'MENU'
  | 'LEVEL_INTRO'
  | 'READY'
  | 'PLAYING'
  | 'PAUSED'
  | 'RESULT';

export type ResultOutcome = 'win' | 'orbit_win' | 'lose' | 'endless_over';

export interface ResultState {
  outcome: ResultOutcome;
  fact?: string;
  milestone?: string;
  newScientist?: ScientistDefinition;
  hasNextLevel: boolean;
  endlessStats?: {
    wave: number;
    score: number;
  };
}

export interface SaveDataV2 {
  version: 2;
  progress: number; // Highest level unlocked (0..14)
  unlockedScientists: string[];
  soundEnabled: boolean;
  reducedMotion: boolean;
  highScoreEndless: number;
  lastUpdated: number;
}

export interface GameEventMap {
  PROJECTILE_FIRED: { type: WarheadType; x: number; y: number; vx: number; vy: number };
  PROJECTILE_IMPACT: { x: number; y: number; type: WarheadType; hitBlockId?: string };
  EXPLOSION: { x: number; y: number; type: WarheadType; radius: number };
  STRUCTURE_DAMAGED: { blockId: string; remainingHp: number };
  STRUCTURE_DESTROYED: { blockId: string; type: BlockType };
  ABILITY_ACTIVATED: { ability: 'glide' | 'stage2' | 'shield' | 'deploy' | 'detonate' };
  OBJECTIVE_COMPLETED: { type: 'core' | 'orbit'; remainingCores: number };
  LEVEL_COMPLETED: { levelIndex: number; isOrbit: boolean };
  LEVEL_FAILED: { levelIndex: number; reason: 'out_of_ammo' };
  STATE_CHANGED: { from: GameLifecycleState; to: GameLifecycleState };
}

export type GameEventType = keyof GameEventMap;

export interface AimVector {
  vx: number;
  vy: number;
  power: number; // 0..1
}
