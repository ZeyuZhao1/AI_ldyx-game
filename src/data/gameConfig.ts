import { WarheadConfig, WarheadType } from '../types/game';

export const GAME_CONFIG = {
  WORLD_WIDTH: 960,
  WORLD_HEIGHT: 540,
  GROUND_Y: 482,
  GRAVITY: 620,

  BASE_POWER_CAP: 135,
  POWER_PER_SCIENTIST: 6,
  POWER_SCALE: 4.2,
  SUB_POWER_MULTIPLIER: 0.72,

  LAUNCH_POS: { x: 95, y: 482 - 50 },
  SUB_POS: { x: 640, y: 482 - 8 },
  RAIL_CONFIG: { len: 46, gap: 14, defAng: -0.7 },

  FIXED_DELTA: 1 / 120, // 120Hz fixed physics step
  MAX_STEPS_PER_FRAME: 5,

  GLIDE_GRAVITY_RATIO: 0.14,
  GLIDE_DURATION: 1.5,
  GLIDE_VX_SCALE: 1.25,
  GLIDE_VX_ADD: 130,
  GLIDE_VY_SCALE: 0.15,

  STAGE2_VX_SCALE: 1.3,
  STAGE2_VX_ADD: 120,
  STAGE2_VY_IMPULSE: -170,

  BUNKER_MAX_PENETRATION: 2,
  BUNKER_VELOCITY_RETENTION: 0.82,

  ENRICHMENT_BLAST_MULTIPLIER: 1.3,

  DEMO_PULL: { sx: 430, sy: 250, dx: -100, dy: 92 },
} as const;

export const WARHEAD_CONFIGS: Record<WarheadType, WarheadConfig> = {
  normal: {
    id: 'normal',
    name: '常规',
    r: 62,
    dmg: 2,
    color: '#d8d8d8',
    description: '基础高爆弹头，适合摧毁轻度防护与暴露核心。',
  },
  atomic: {
    id: 'atomic',
    name: '原子弹',
    r: 135,
    dmg: 2,
    color: '#ffd27b',
    description: '战术核弹头，造成中等大范围核爆冲击波。',
  },
  hydro: {
    id: 'hydro',
    name: '氢弹',
    r: 290,
    dmg: 3,
    color: '#ffb3ff',
    description: '于敏构型热核弹头，拥有毁灭性的超广域起爆半径。',
  },
  bunker: {
    id: 'bunker',
    name: '钻地弹',
    r: 95,
    dmg: 3,
    color: '#c9a86a',
    description: '强化贯穿弹头，可连续击穿2层重型钢甲后起爆，专克地下目标。',
  },
  deploy: {
    id: 'deploy',
    name: '核装置',
    r: 235,
    dmg: 3,
    color: '#ff9b4d',
    description: '地面架设试爆装置，可布置于目标腹地并在适当时机遥控起爆。',
  },
};
