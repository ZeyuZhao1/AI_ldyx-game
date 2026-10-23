import { GAME_CONFIG, WARHEAD_CONFIGS } from '../data/gameConfig';
import {
  ActiveBlock,
  AimVector,
  DemoState,
  DeployedDevice,
  GameEventMap,
  GameEventType,
  LevelDefinition,
  Missile,
  Particle,
  WarheadType,
} from '../types/game';
import { Collision } from './Collision';
import { Physics } from './Physics';
import { Scheduler } from './Scheduler';
import { ExplosionSystem } from '../systems/ExplosionSystem';
import { AbilitySystem } from '../systems/AbilitySystem';
import { ProgressionSystem } from '../systems/ProgressionSystem';

export class GameEngine {
  public sessionId: number = 0;
  public readonly scheduler = new Scheduler();

  // Level State
  public level: LevelDefinition | null = null;
  public levelIndex: number = 0;
  public isEndless: boolean = false;
  public endlessWave: number = 0;
  public endlessScore: number = 0;
  public isPresentationMode: boolean = false;

  // Progression & Capabilities
  public unlockedScientists: string[] = [];

  // Entities
  public blocks: ActiveBlock[] = [];
  public missile: Missile | null = null;
  public warheads: Record<WarheadType, number> = {
    normal: 4,
    atomic: 0,
    hydro: 0,
    bunker: 0,
    deploy: 0,
  };
  public selectedWarhead: WarheadType = 'normal';
  public useSub: boolean = false;
  public deployMode: boolean = false;
  public deployedDevices: DeployedDevice[] = [];
  public particles: Particle[] = [];
  public demo: DemoState | null = null;

  // Shot Tracking
  public shieldUsed: boolean = false;
  public destroyedThisShot: number = 0;
  public lastFiredType: WarheadType = 'normal';

  // Screen Shake
  public shakeMagnitude: number = 0;
  public shakeTimer: number = 0;

  // Aiming Interaction State
  public isAiming: boolean = false;
  public aimStart: { x: number; y: number } | null = null;
  public aimCurrent: { x: number; y: number } | null = null;

  // Event System
  private eventListeners: {
    [K in GameEventType]?: Array<(data: GameEventMap[K]) => void>;
  } = {};

  // Lifecycle Callbacks
  public onLevelWon?: (isOrbit: boolean) => void;
  public onLevelLost?: () => void;
  public onEndlessWaveWon?: () => void;
  public onEndlessOver?: () => void;
  public onToastMessage?: (msg: string) => void;
  public onPlaySound?: (sound: string, arg?: string) => void;

  public on<K extends GameEventType>(event: K, handler: (data: GameEventMap[K]) => void): void {
    if (!this.eventListeners[event]) {
      this.eventListeners[event] = [];
    }
    this.eventListeners[event]?.push(handler);
  }

  public emit<K extends GameEventType>(event: K, data: GameEventMap[K]): void {
    const list = this.eventListeners[event];
    if (list) {
      for (const fn of list) {
        fn(data);
      }
    }
  }

  public startLevel(
    level: LevelDefinition,
    levelIndex: number,
    unlockedScientists: string[],
    isPresentation: boolean = false
  ): void {
    this.sessionId++;
    this.scheduler.cancelAllForSession(this.sessionId - 1);

    this.level = level;
    this.levelIndex = levelIndex;
    this.isEndless = false;
    this.isPresentationMode = isPresentation;
    this.unlockedScientists = [...unlockedScientists];

    this.useSub = false;
    this.deployMode = false;
    this.deployedDevices = [];
    this.particles = [];
    this.missile = null;
    this.shieldUsed = false;
    this.destroyedThisShot = 0;
    this.shakeMagnitude = 0;
    this.shakeTimer = 0;
    this.isAiming = false;
    this.aimStart = null;
    this.aimCurrent = null;

    // Load blocks
    let blkCount = 1;
    this.blocks = level.blocks.map((b) => ({
      id: `blk_${levelIndex}_${blkCount++}`,
      x: b[0],
      y: b[1],
      w: b[2],
      h: b[3],
      type: b[4],
      hp: b[4] === 'steel' ? 2 : 1,
      vy: 0,
    }));

    // Load warheads
    this.warheads = {
      normal: level.warheads.normal || 0,
      atomic: level.warheads.atomic || 0,
      hydro: level.warheads.hydro || 0,
      bunker: level.warheads.bunker || 0,
      deploy: level.warheads.deploy || 0,
    };
    this.selectedWarhead = 'normal';
    this.autoSelectWarhead();

    // Tutorial demo in level 0 (skip in presentation mode if desired)
    if (levelIndex === 0 && !isPresentation) {
      this.demo = { t: 0, flying: false, x: 0, y: 0, vx: 0, vy: 0, trail: [] };
    } else {
      this.demo = null;
    }
  }

  public startEndless(unlockedScientists: string[]): void {
    this.sessionId++;
    this.scheduler.clearAll();

    this.isEndless = true;
    this.endlessWave = 1;
    this.endlessScore = 0;
    this.levelIndex = 14;
    this.unlockedScientists = [...unlockedScientists];

    this.useSub = false;
    this.deployMode = false;
    this.deployedDevices = [];
    this.particles = [];
    this.missile = null;
    this.shieldUsed = false;
    this.destroyedThisShot = 0;
    this.demo = null;
    this.shakeMagnitude = 0;
    this.shakeTimer = 0;

    this.warheads = {
      normal: 5,
      atomic: 1,
      hydro: 0,
      bunker: 1,
      deploy: 0,
    };
    this.selectedWarhead = 'normal';

    this.loadEndlessWave(1);
  }

  public loadEndlessWave(wave: number): void {
    this.endlessWave = wave;
    const wind = Math.round((Math.random() * 2 - 1) * 22);

    this.level = {
      id: `endless_wave_${wave}`,
      year: '∞',
      name: '无尽挑战',
      wind,
      intro: '',
      fact: '',
      warheads: { normal: 0 },
      blocks: [],
    };

    this.blocks = ProgressionSystem.generateEndlessWaveBlocks(wave);
  }

  public getPowerCap(): number {
    return ProgressionSystem.calculatePowerCap(this.unlockedScientists, this.useSub);
  }

  public getLaunchOrigin(): { x: number; y: number } {
    return this.useSub ? GAME_CONFIG.SUB_POS : GAME_CONFIG.LAUNCH_POS;
  }

  public getTotalAmmo(): number {
    return (
      (this.warheads.normal || 0) +
      (this.warheads.atomic || 0) +
      (this.warheads.hydro || 0) +
      (this.warheads.bunker || 0)
    );
  }

  public autoSelectWarhead(): void {
    if (
      !ProgressionSystem.isWarheadLocked(this.selectedWarhead, this.levelIndex, this.unlockedScientists) &&
      (this.warheads[this.selectedWarhead] || 0) > 0
    ) {
      return;
    }

    const order: WarheadType[] = ['normal', 'atomic', 'hydro', 'bunker'];
    for (const k of order) {
      if (
        !ProgressionSystem.isWarheadLocked(k, this.levelIndex, this.unlockedScientists) &&
        (this.warheads[k] || 0) > 0
      ) {
        if (k !== this.selectedWarhead) {
          this.onToastMessage?.(
            `「${WARHEAD_CONFIGS[this.selectedWarhead].name}」耗尽，切换至：${WARHEAD_CONFIGS[k].name}`
          );
        }
        this.selectedWarhead = k;
        return;
      }
    }
  }

  public handlePointerDown(pos: { x: number; y: number }): void {
    if (this.demo) {
      this.demo = null;
      this.onToastMessage?.('轮到你了！');
      return;
    }

    if (this.deployMode) {
      this.tryDeploy(pos);
      return;
    }

    if (this.missile) {
      this.tryActivateInFlightAbility();
      return;
    }

    if (this.getTotalAmmo() <= 0) return;

    this.isAiming = true;
    this.aimStart = pos;
    this.aimCurrent = pos;
  }

  public handlePointerMove(pos: { x: number; y: number }): void {
    if (this.isAiming) {
      this.aimCurrent = pos;
    }
  }

  public handlePointerUp(): void {
    if (!this.isAiming || !this.aimStart || !this.aimCurrent) {
      this.isAiming = false;
      return;
    }

    this.isAiming = false;
    const pull = Physics.calculatePull(
      this.aimStart.x,
      this.aimStart.y,
      this.aimCurrent.x,
      this.aimCurrent.y,
      this.getPowerCap()
    );

    const aim = Physics.calculateAim(pull.dx, pull.dy, this.getPowerCap(), this.useSub);
    if (!aim) return;

    this.fire(aim);
  }

  public handlePointerCancel(): void {
    this.isAiming = false;
    this.aimStart = null;
    this.aimCurrent = null;
  }

  public fire(aim: AimVector): void {
    this.autoSelectWarhead();
    if ((this.warheads[this.selectedWarhead] || 0) <= 0) return;

    this.warheads[this.selectedWarhead]--;
    this.lastFiredType = this.selectedWarhead;

    const origin = this.getLaunchOrigin();
    this.missile = {
      id: `msl_${Date.now()}`,
      x: origin.x,
      y: origin.y,
      vx: aim.vx,
      vy: aim.vy,
      type: this.selectedWarhead,
      trail: [],
      pen: 0,
      glideUsed: false,
      glideTimer: 0,
      stage2Used: false,
      flightTimer: 0,
    };

    this.destroyedThisShot = 0;
    this.onPlaySound?.('launch', this.selectedWarhead);
    this.emit('PROJECTILE_FIRED', {
      type: this.selectedWarhead,
      x: origin.x,
      y: origin.y,
      vx: aim.vx,
      vy: aim.vy,
    });
  }

  public tryActivateInFlightAbility(): void {
    if (!this.missile) return;

    const isQian = ProgressionSystem.isScientistUnlocked('qian', this.unlockedScientists);
    const isStage2 = ProgressionSystem.isStage2Available(this.levelIndex, this.unlockedScientists);

    if (!this.missile.glideUsed) {
      const res = AbilitySystem.triggerGlide(this.missile, isQian);
      if (res.success) {
        this.onPlaySound?.('glide');
        this.onToastMessage?.(res.message || '');
        this.spawnParticles(this.missile.x, this.missile.y, 12, '#8be0ff');
        this.emit('ABILITY_ACTIVATED', { ability: 'glide' });
      }
      return;
    }

    if (isStage2 && !this.missile.stage2Used) {
      const res = AbilitySystem.triggerStage2(this.missile, isStage2);
      if (res.success) {
        this.onPlaySound?.('stage2');
        this.onToastMessage?.(res.message || '');
        this.spawnParticles(this.missile.x, this.missile.y, 16, '#ffb366');
        this.emit('ABILITY_ACTIVATED', { ability: 'stage2' });
      }
    }
  }

  public tryDeploy(pt: { x: number; y: number }): void {
    if ((this.warheads.deploy || 0) <= 0) return;

    if (!AbilitySystem.isValidDeployLocation(pt.x, pt.y)) {
      this.onToastMessage?.('核装置要部署在右侧场地区域');
      return;
    }

    this.warheads.deploy--;
    this.deployedDevices.push({
      id: `dev_${Date.now()}_${Math.random()}`,
      x: pt.x,
      y: pt.y,
    });

    this.spawnParticles(pt.x, pt.y, 8, '#ff9b4d');
    this.onPlaySound?.('click');
    this.emit('ABILITY_ACTIVATED', { ability: 'deploy' });

    if ((this.warheads.deploy || 0) <= 0) {
      this.deployMode = false;
    }
  }

  public detonateDevices(): void {
    if (this.deployedDevices.length === 0) return;
    const list = [...this.deployedDevices];
    this.deployedDevices = [];
    this.deployMode = false;

    const currentSession = this.sessionId;
    list.forEach((dev, i) => {
      this.scheduler.schedule(i * 0.15, currentSession, () => {
        this.explodeAt(dev.x, dev.y, 'deploy');
      });
    });

    this.emit('ABILITY_ACTIVATED', { ability: 'detonate' });
  }

  public explodeAt(x: number, y: number, type: WarheadType): void {
    const hasEnrich = ProgressionSystem.isEnrichmentAvailable(
      this.levelIndex,
      this.unlockedScientists
    );

    const res = ExplosionSystem.trigger(
      x,
      y,
      type,
      this.blocks,
      this.deployedDevices,
      hasEnrich
    );

    this.shakeMagnitude = res.shakeMagnitude;
    this.shakeTimer = res.shakeDuration;
    this.onPlaySound?.('explosion', type);

    this.spawnParticles(
      x,
      y,
      type === 'hydro' ? 60 : type === 'deploy' ? 44 : type === 'atomic' ? 36 : 20,
      WARHEAD_CONFIGS[type].color
    );
    if (type === 'hydro' || type === 'deploy') {
      this.spawnParticles(x, y, 40, '#ffffff');
    }

    for (const damaged of res.damagedBlocks) {
      if (damaged.destroyed) {
        this.spawnParticles(
          damaged.block.x + damaged.block.w / 2,
          damaged.block.y + damaged.block.h / 2,
          14,
          damaged.block.type === 'core' ? '#ff6b6b' : '#b0a08a'
        );
        this.emit('STRUCTURE_DESTROYED', {
          blockId: damaged.block.id,
          type: damaged.block.type,
        });
        if (damaged.block.type === 'core') {
          this.destroyedThisShot++;
          if (this.isEndless) {
            this.endlessScore++;
          }
        }
      } else {
        this.emit('STRUCTURE_DAMAGED', {
          blockId: damaged.block.id,
          remainingHp: damaged.block.hp,
        });
      }
    }

    this.blocks = this.blocks.filter((b) => b.hp > 0);
    this.emit('EXPLOSION', { x, y, type, radius: res.radius });

    // Handle chained detonations
    if (res.chainedDevices.length > 0) {
      this.deployedDevices = this.deployedDevices.filter(
        (d) => !res.chainedDevices.includes(d)
      );
      const currentSession = this.sessionId;
      res.chainedDevices.forEach((d, idx) => {
        this.scheduler.schedule(0.18 + idx * 0.14, currentSession, () => {
          this.explodeAt(d.x, d.y, 'deploy');
        });
      });
    }

    this.checkObjectives();
  }

  public endShot(): void {
    this.missile = null;

    // Guo Yonghuai data shield: refunds round if zero targets hit
    const hasGuo = ProgressionSystem.isScientistUnlocked('guo', this.unlockedScientists);
    if (this.destroyedThisShot === 0 && hasGuo && !this.shieldUsed && !this.level?.orbit) {
      this.shieldUsed = true;
      this.warheads[this.lastFiredType] = (this.warheads[this.lastFiredType] || 0) + 1;
      this.onToastMessage?.('数据护盾发动：郭永怀护住了绝密数据，弹药返还！');
      this.emit('ABILITY_ACTIVATED', { ability: 'shield' });
    }

    this.checkObjectives();
  }

  public checkObjectives(): void {
    const coresRemaining = this.blocks.filter((b) => b.type === 'core').length;

    if (this.isEndless) {
      if (coresRemaining === 0) {
        const curSession = this.sessionId;
        this.scheduler.schedule(0.4, curSession, () => {
          this.onEndlessWaveWon?.();
        });
        return;
      }
      if (
        !this.missile &&
        this.getTotalAmmo() <= 0 &&
        this.deployedDevices.length === 0 &&
        (this.warheads.deploy || 0) <= 0
      ) {
        const curSession = this.sessionId;
        this.scheduler.schedule(0.6, curSession, () => {
          this.onEndlessOver?.();
        });
      }
      return;
    }

    // Story level objectives
    if (coresRemaining === 0 && !this.level?.orbit) {
      const curSession = this.sessionId;
      this.scheduler.schedule(0.5, curSession, () => {
        this.onLevelWon?.(false);
      });
      return;
    }

    if (
      !this.missile &&
      this.getTotalAmmo() <= 0 &&
      this.deployedDevices.length === 0 &&
      (this.warheads.deploy || 0) <= 0
    ) {
      const curSession = this.sessionId;
      this.scheduler.schedule(0.6, curSession, () => {
        this.onLevelLost?.();
      });
    }
  }

  public spawnParticles(x: number, y: number, count: number, color: string): void {
    for (let i = 0; i < count; i++) {
      const a = Math.random() * 6.283;
      const s = 40 + Math.random() * 220;
      const life = 0.5 + Math.random() * 0.6;
      this.particles.push({
        x,
        y,
        vx: Math.cos(a) * s,
        vy: Math.sin(a) * s - 60,
        life,
        maxLife: life,
        color,
        r: 2 + Math.random() * 4,
      });
    }
  }

  /**
   * Fixed-timestep physics simulation step.
   */
  public tick(dt: number): void {
    // 1. Shake timer
    if (this.shakeTimer > 0) {
      this.shakeTimer -= dt;
      if (this.shakeTimer <= 0) {
        this.shakeMagnitude = 0;
      }
    }

    // 2. Block settling physics
    Physics.settleBlocks(this.blocks, dt, GAME_CONFIG.GROUND_Y, (x, y) => {
      this.spawnParticles(x, y, 4, '#b0a08a');
    });

    // 3. Particles
    for (const p of this.particles) {
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vy += GAME_CONFIG.GRAVITY * 0.6 * dt;
      p.life -= dt;
    }
    this.particles = this.particles.filter((p) => p.life > 0);

    // 4. Tutorial demo in level 0
    if (this.demo) {
      this.demo.t += dt;
      const D = GAME_CONFIG.DEMO_PULL;
      if (!this.demo.flying && this.demo.t >= 1.9) {
        this.demo.flying = true;
        this.demo.x = GAME_CONFIG.LAUNCH_POS.x;
        this.demo.y = GAME_CONFIG.LAUNCH_POS.y;
        this.demo.vx = -D.dx * GAME_CONFIG.POWER_SCALE;
        this.demo.vy = -D.dy * GAME_CONFIG.POWER_SCALE;
        this.onPlaySound?.('launch', 'normal');
      }
      if (this.demo.flying) {
        this.demo.vy += GAME_CONFIG.GRAVITY * dt;
        this.demo.x += this.demo.vx * dt;
        this.demo.y += this.demo.vy * dt;
        this.demo.trail.push({ x: this.demo.x, y: this.demo.y });
        if (this.demo.trail.length > 40) this.demo.trail.shift();
        if (this.demo.y >= GAME_CONFIG.GROUND_Y) {
          this.spawnParticles(this.demo.x, GAME_CONFIG.GROUND_Y, 20, '#d8d8d8');
          this.onPlaySound?.('hit');
          this.demo = null;
          this.onToastMessage?.('轮到你了！');
        }
      }
      if (this.demo && this.demo.t > 8) {
        this.demo = null;
      }
      return;
    }

    // 5. Active missile flight & continuous collision detection
    const m = this.missile;
    if (m) {
      m.flightTimer += dt;
      const effGravity =
        m.glideTimer > 0
          ? GAME_CONFIG.GRAVITY * GAME_CONFIG.GLIDE_GRAVITY_RATIO
          : GAME_CONFIG.GRAVITY;

      if (m.glideTimer > 0) {
        m.glideTimer -= dt;
      }

      const wind = this.level?.wind || 0;
      m.vx += wind * dt;
      m.vy += effGravity * dt;

      const x0 = m.x;
      const y0 = m.y;
      const x1 = x0 + m.vx * dt;
      const y1 = y0 + m.vy * dt;

      // Trail recording
      m.trail.push({ x: x1, y: y1 });
      if (m.trail.length > 40) m.trail.shift();

      // Check satellite orbit window (Dongfanghong 1)
      if (this.level?.orbit) {
        const orb = this.level.orbit;
        if (Collision.segmentIntersectsCircle(x0, y0, x1, y1, orb.x, orb.y, orb.r)) {
          this.missile = null;
          this.onPlaySound?.('win');
          this.spawnParticles(orb.x, orb.y, 50, '#8be0ff');
          this.emit('OBJECTIVE_COMPLETED', { type: 'orbit', remainingCores: 0 });
          this.onLevelWon?.(true);
          return;
        }
      }

      // Swept collision against blocks
      const blockHit = Collision.sweepSegmentAgainstBlocks(x0, y0, x1, y1, this.blocks, 4);
      const groundHit = Collision.sweepSegmentAgainstGround(y0, y1, x0, x1, GAME_CONFIG.GROUND_Y);

      // Determine earliest contact
      let contactX = x1;
      let contactY = y1;
      let hitGround = false;
      let hitBlock = blockHit.block;

      if (groundHit && (!blockHit.hit || groundHit.t <= blockHit.t)) {
        contactX = groundHit.contactX;
        contactY = groundHit.contactY;
        hitGround = true;
        hitBlock = undefined;
      } else if (blockHit.hit) {
        contactX = blockHit.contactX;
        contactY = blockHit.contactY;
      }

      if (hitBlock && m.type === 'bunker' && m.pen < GAME_CONFIG.BUNKER_MAX_PENETRATION) {
        // Bunker penetrator pierces through block
        this.onPlaySound?.('hit');
        this.spawnParticles(
          hitBlock.x + hitBlock.w / 2,
          hitBlock.y + hitBlock.h / 2,
          12,
          hitBlock.type === 'core' ? '#ff6b6b' : '#b0a08a'
        );
        if (hitBlock.type === 'core') {
          this.destroyedThisShot++;
          if (this.isEndless) this.endlessScore++;
        }

        this.blocks = this.blocks.filter((b) => b.id !== hitBlock.id);
        m.pen++;
        m.vx *= GAME_CONFIG.BUNKER_VELOCITY_RETENTION;
        m.vy *= GAME_CONFIG.BUNKER_VELOCITY_RETENTION;
        m.x = contactX;
        m.y = contactY;
        this.spawnParticles(m.x, m.y, 6, '#c9a86a');
      } else if (hitBlock || hitGround) {
        // Impact explosion
        this.explodeAt(contactX, Math.min(contactY, GAME_CONFIG.GROUND_Y), m.type);
        this.endShot();
        return;
      } else {
        m.x = x1;
        m.y = y1;
      }

      // Boundary / Timeout checks
      if (
        m.x > GAME_CONFIG.WORLD_WIDTH + 60 ||
        m.x < -60 ||
        m.y > GAME_CONFIG.WORLD_HEIGHT + 80 ||
        m.flightTimer > 14
      ) {
        this.endShot();
      }
    }

    // 6. Scheduler tick
    this.scheduler.tick(dt, this.sessionId);
  }
}
