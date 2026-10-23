import { GAME_CONFIG, WARHEAD_CONFIGS } from '../data/gameConfig';
import { GameEngine } from '../engine/GameEngine';
import { Physics } from '../engine/Physics';
import { ActiveBlock, DeployedDevice } from '../types/game';

export interface ViewportTransform {
  offsetX: number;
  offsetY: number;
  scale: number;
  width: number;
  height: number;
}

export class CanvasRenderer {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private dpr: number = 1;
  private resizeObserver: ResizeObserver | null = null;

  public width: number = 960;
  public height: number = 540;
  public scale: number = 1;
  public offsetX: number = 0;
  public offsetY: number = 0;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    const context = canvas.getContext('2d');
    if (!context) {
      throw new Error('Canvas 2D context not supported');
    }
    this.ctx = context;
    this.handleResize();

    // Bind ResizeObserver to the parent container so canvas buffer never distorts or lags during rotation
    if (typeof ResizeObserver !== 'undefined') {
      const container = canvas.parentElement || canvas;
      this.resizeObserver = new ResizeObserver(() => {
        this.handleResize();
      });
      this.resizeObserver.observe(container);
    }
  }

  public getTransform(): ViewportTransform {
    return {
      offsetX: this.offsetX,
      offsetY: this.offsetY,
      scale: this.scale,
      width: this.width,
      height: this.height,
    };
  }

  public handleResize(): void {
    this.dpr = typeof window !== 'undefined' ? Math.max(1, Math.min(2.5, window.devicePixelRatio || 1)) : 1;
    const container = this.canvas.parentElement;
    const rect = container ? container.getBoundingClientRect() : this.canvas.getBoundingClientRect();

    const w = Math.max(320, Math.floor(rect.width || window.innerWidth));
    const h = Math.max(180, Math.floor(rect.height || window.innerHeight));

    this.width = w;
    this.height = h;

    const targetWidth = Math.round(w * this.dpr);
    const targetHeight = Math.round(h * this.dpr);

    if (this.canvas.width !== targetWidth || this.canvas.height !== targetHeight) {
      this.canvas.width = targetWidth;
      this.canvas.height = targetHeight;
    }

    const isPortrait = this.height > this.width;
    if (isPortrait) {
      // In portrait mode, fit the 960 width with comfortable room, anchoring ground near bottom
      this.scale = Math.min(this.width / GAME_CONFIG.WORLD_WIDTH, this.height / 450);
      this.offsetX = Math.round((this.width - GAME_CONFIG.WORLD_WIDTH * this.scale) / 2);
      this.offsetY = Math.round(this.height - 495 * this.scale);
    } else {
      // In landscape, scale so world height 540 fits comfortably with strictly uniform aspect ratio
      this.scale = Math.min(this.width / GAME_CONFIG.WORLD_WIDTH, this.height / GAME_CONFIG.WORLD_HEIGHT);
      this.offsetX = Math.round((this.width - GAME_CONFIG.WORLD_WIDTH * this.scale) / 2);
      this.offsetY = Math.round((this.height - GAME_CONFIG.WORLD_HEIGHT * this.scale) / 2);
    }
  }

  public render(engine: GameEngine, reducedMotion: boolean = false): void {
    const ctx = this.ctx;
    ctx.save();
    ctx.scale(this.dpr, this.dpr);

    // 1. Edge-to-Edge Sky Gradient & Atmospheric Stars (Fills 100% of canvas without black bars)
    this.drawSky(ctx, engine);

    // 2. Dunes, Mountains & Installations (Extended full-screen horizon)
    this.drawLandscape(ctx, engine);

    // World coordinate transform for interactive entities (strictly uniform 1:1 scaleX === scaleY)
    ctx.save();
    // Screen Shake
    if (engine.shakeMagnitude > 0 && !reducedMotion) {
      const sm = engine.shakeMagnitude;
      ctx.translate((Math.random() - 0.5) * sm, (Math.random() - 0.5) * sm);
    }
    ctx.translate(this.offsetX, this.offsetY);
    ctx.scale(this.scale, this.scale);

    // 3. Launch Platforms
    this.drawPlatforms(ctx, engine);

    // 4. Satellite Orbit Window (Dongfanghong 1)
    if (engine.level?.orbit) {
      this.drawOrbitWindow(ctx, engine.level.orbit);
    }

    // 5. Destructible Blocks & Custom Core Targets
    for (const b of engine.blocks) {
      this.drawBlock(ctx, b, engine);
    }

    // 6. Deployed Nuclear Towers
    for (const dev of engine.deployedDevices) {
      this.drawDevice(ctx, dev);
    }

    // 7. Aiming & Trajectory Preview
    if (engine.isAiming && engine.aimStart && engine.aimCurrent) {
      this.drawAiming(ctx, engine);
    }

    // 8. Tutorial Demo Animation
    if (engine.demo) {
      this.drawDemo(ctx, engine);
    }

    // 9. Missile in Flight
    if (engine.missile) {
      this.drawMissile(ctx, engine);
    }

    // 10. Particles & Flame Debris
    this.drawParticles(ctx, engine);

    // 11. In-Canvas Tactical Prompts
    this.drawTacticalPrompts(ctx, engine);

    ctx.restore(); // restore world transform
    ctx.restore(); // restore dpr
  }

  /**
   * Biome-Specific Atmosphere and Skybox (Spans full canvas width and height)
   */
  private drawSky(ctx: CanvasRenderingContext2D, engine: GameEngine): void {
    const biome = engine.level?.biome || 'desert';
    const W = this.width;
    const H = this.height;

    const sky = ctx.createLinearGradient(0, 0, 0, H);

    if (biome === 'industrial') {
      // Smoggy twilight industrial atmosphere (Lanzhou Enrichment Plant)
      sky.addColorStop(0, '#0a0d16');
      sky.addColorStop(0.5, '#1b1724');
      sky.addColorStop(0.85, '#2e221d');
      sky.addColorStop(1, '#453026');
      ctx.fillStyle = sky;
      ctx.fillRect(0, 0, W, H);

      // Low factory ground illumination
      const glow = ctx.createRadialGradient(W * 0.75, H * 0.85, 20, W * 0.75, H * 0.85, 300);
      glow.addColorStop(0, 'rgba(230, 140, 50, 0.15)');
      glow.addColorStop(1, 'rgba(230, 140, 50, 0)');
      ctx.fillStyle = glow;
      ctx.fillRect(0, 0, W, H);

      // Faint industrial stars
      ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
      for (let i = 0; i < 25; i++) {
        ctx.fillRect((i * 179) % W, (i * 59) % (H * 0.6), 1.5, 1.5);
      }
    } else if (biome === 'plateau') {
      // High-altitude cold plateau slate twilight (Northwest Highlands)
      sky.addColorStop(0, '#050814');
      sky.addColorStop(0.45, '#111728');
      sky.addColorStop(0.8, '#1e2638');
      sky.addColorStop(1, '#2c374d');
      ctx.fillStyle = sky;
      ctx.fillRect(0, 0, W, H);

      // Crisp high-elevation stars
      ctx.fillStyle = 'rgba(255, 255, 255, 0.65)';
      for (let i = 0; i < 55; i++) {
        ctx.fillRect((i * 137) % W, (i * 53) % (H * 0.65), i % 3 === 0 ? 2 : 1.5, i % 3 === 0 ? 2 : 1.5);
      }
    } else if (biome === 'space') {
      // Deep cosmic space void (Dongfanghong 1, Satellites, High-Altitude Burst)
      sky.addColorStop(0, '#010206');
      sky.addColorStop(0.65, '#040711');
      sky.addColorStop(1, '#081122');
      ctx.fillStyle = sky;
      ctx.fillRect(0, 0, W, H);

      // Shimmering cosmic nebulae
      const neb1 = ctx.createRadialGradient(W * 0.3, H * 0.25, 10, W * 0.3, H * 0.25, 260);
      neb1.addColorStop(0, 'rgba(110, 75, 180, 0.1)');
      neb1.addColorStop(0.6, 'rgba(38, 198, 218, 0.04)');
      neb1.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = neb1;
      ctx.fillRect(0, 0, W, H);

      // Dense sparkling starfield
      ctx.fillStyle = '#ffffff';
      for (let i = 0; i < 80; i++) {
        const x = (i * 113) % W;
        const y = (i * 71) % (H * 0.75);
        const s = i % 5 === 0 ? 2.5 : i % 2 === 0 ? 1.5 : 1;
        ctx.globalAlpha = 0.4 + (Math.sin(i + Date.now() / 600) * 0.3 + 0.3);
        ctx.fillRect(x, y, s, s);
      }
      ctx.globalAlpha = 1.0;
    } else if (biome === 'ocean') {
      // South Pacific and Submarine Open Ocean Seascape
      sky.addColorStop(0, '#050a16');
      sky.addColorStop(0.5, '#0e182e');
      sky.addColorStop(0.82, '#202235');
      sky.addColorStop(1, '#3a2b34');
      ctx.fillStyle = sky;
      ctx.fillRect(0, 0, W, H);

      // Ocean horizon twilight glow
      const oceanGlow = ctx.createLinearGradient(0, H * 0.6, 0, H * 0.9);
      oceanGlow.addColorStop(0, 'rgba(235, 130, 90, 0.12)');
      oceanGlow.addColorStop(1, 'rgba(80, 140, 200, 0.04)');
      ctx.fillStyle = oceanGlow;
      ctx.fillRect(0, H * 0.6, W, H * 0.3);

      // Twilight ocean stars
      ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
      for (let i = 0; i < 35; i++) {
        ctx.fillRect((i * 149) % W, (i * 67) % (H * 0.6), 1.5, 1.5);
      }
    } else {
      // Default Lop Nur Gobi Desert sunset/twilight
      sky.addColorStop(0, '#070a14');
      sky.addColorStop(0.5, '#161a27');
      sky.addColorStop(0.8, '#35241b');
      sky.addColorStop(1, '#4d3323');
      ctx.fillStyle = sky;
      ctx.fillRect(0, 0, W, H);

      // Warm desert horizon glow
      const desertGlow = ctx.createLinearGradient(0, H * 0.5, 0, H);
      desertGlow.addColorStop(0, 'rgba(212, 163, 89, 0)');
      desertGlow.addColorStop(0.8, 'rgba(212, 163, 89, 0.08)');
      desertGlow.addColorStop(1, 'rgba(180, 80, 40, 0.15)');
      ctx.fillStyle = desertGlow;
      ctx.fillRect(0, 0, W, H);

      ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
      for (let i = 0; i < 45; i++) {
        ctx.fillRect((i * 137) % W, (i * 61) % (H * 0.65), 1.5, 1.5);
      }
    }
  }

  /**
   * Biome-Specific Foreground Landscape & Horizon Structures (Spans full canvas width)
   */
  private drawLandscape(ctx: CanvasRenderingContext2D, engine: GameEngine): void {
    const biome = engine.level?.biome || 'desert';
    const W = this.width;
    const H = this.height;
    const gY = this.offsetY + GAME_CONFIG.GROUND_Y * this.scale;
    const sc = this.scale;
    const ox = this.offsetX;

    if (biome === 'industrial') {
      // Lanzhou Uranium Enrichment Plant Silhouette
      ctx.fillStyle = '#17151e';
      // Cooling towers & diffusion facility silhouettes
      ctx.beginPath();
      ctx.moveTo(ox + 560 * sc, gY);
      ctx.bezierCurveTo(ox + 570 * sc, gY - 60 * sc, ox + 580 * sc, gY - 70 * sc, ox + 585 * sc, gY - 95 * sc);
      ctx.lineTo(ox + 615 * sc, gY - 95 * sc);
      ctx.bezierCurveTo(ox + 620 * sc, gY - 70 * sc, ox + 630 * sc, gY - 60 * sc, ox + 640 * sc, gY);
      ctx.fill();

      ctx.beginPath();
      ctx.moveTo(ox + 655 * sc, gY);
      ctx.bezierCurveTo(ox + 665 * sc, gY - 55 * sc, ox + 675 * sc, gY - 65 * sc, ox + 680 * sc, gY - 85 * sc);
      ctx.lineTo(ox + 705 * sc, gY - 85 * sc);
      ctx.bezierCurveTo(ox + 710 * sc, gY - 65 * sc, ox + 720 * sc, gY - 55 * sc, ox + 730 * sc, gY);
      ctx.fill();

      // Plant building blocks & stacks
      ctx.fillStyle = '#1e1c26';
      ctx.fillRect(ox + 730 * sc, gY - 75 * sc, 140 * sc, 75 * sc);
      ctx.fillRect(ox + 870 * sc, gY - 55 * sc, 70 * sc, 55 * sc);

      // Extended pipeline
      ctx.strokeStyle = '#2d2736';
      ctx.lineWidth = Math.max(2, 4 * sc);
      ctx.beginPath();
      ctx.moveTo(0, gY - 20 * sc);
      ctx.lineTo(W, gY - 20 * sc);
      ctx.stroke();

      // Yellow facility lights
      ctx.fillStyle = '#ffcc44';
      for (let x = ox + 740 * sc; x < ox + 860 * sc; x += 18 * sc) {
        ctx.fillRect(x, gY - 60 * sc, 8 * sc, 4 * sc);
        ctx.fillRect(x, gY - 40 * sc, 8 * sc, 4 * sc);
      }

      // Concrete factory apron ground extending to bottom of canvas
      ctx.fillStyle = '#26242b';
      ctx.fillRect(0, gY, W, Math.max(20, H - gY + 40));
      ctx.fillStyle = '#d49b38';
      ctx.fillRect(0, gY, W, Math.max(2, 4 * sc));
    } else if (biome === 'plateau') {
      // Jagged Alpine Mountain Range (Qilian & Kunlun Snow Peaks)
      ctx.fillStyle = '#141a2c';
      ctx.beginPath();
      ctx.moveTo(0, gY);
      ctx.lineTo(W * 0.12, gY - 85 * sc);
      ctx.lineTo(W * 0.26, gY - 50 * sc);
      ctx.lineTo(W * 0.42, gY - 110 * sc);
      ctx.lineTo(W * 0.56, gY - 40 * sc);
      ctx.lineTo(W * 0.72, gY - 125 * sc);
      ctx.lineTo(W * 0.86, gY - 70 * sc);
      ctx.lineTo(W, gY - 100 * sc);
      ctx.lineTo(W, gY);
      ctx.fill();

      // Front snow-capped mountain peaks
      ctx.fillStyle = '#1f283e';
      ctx.beginPath();
      ctx.moveTo(W * 0.18, gY);
      ctx.lineTo(W * 0.35, gY - 105 * sc);
      ctx.lineTo(W * 0.48, gY - 55 * sc);
      ctx.lineTo(W * 0.63, gY - 115 * sc);
      ctx.lineTo(W * 0.78, gY - 45 * sc);
      ctx.lineTo(W * 0.92, gY - 95 * sc);
      ctx.lineTo(W, gY);
      ctx.fill();

      // Snow highlights
      ctx.fillStyle = '#b8cce6';
      ctx.beginPath();
      ctx.moveTo(W * 0.35, gY - 105 * sc);
      ctx.lineTo(W * 0.33, gY - 70 * sc);
      ctx.lineTo(W * 0.37, gY - 70 * sc);
      ctx.fill();

      // Telemetry dome station on peak
      ctx.fillStyle = '#89a2cc';
      ctx.beginPath();
      ctx.arc(W * 0.9, gY - 95 * sc, 9 * sc, Math.PI, 0);
      ctx.fill();

      // Mountain plateau ground
      ctx.fillStyle = '#222935';
      ctx.fillRect(0, gY, W, Math.max(20, H - gY + 40));
      ctx.fillStyle = '#3c4759';
      ctx.fillRect(0, gY, W, Math.max(2, 5 * sc));
    } else if (biome === 'space') {
      // Low Earth Orbit Horizon (Curvature of Blue Earth below)
      ctx.save();
      const earthRadius = 1400 * sc;
      const earthCenterX = W / 2;
      const earthCenterY = gY + earthRadius - 25 * sc;

      // Glow halo
      const atmoGlow = ctx.createRadialGradient(
        earthCenterX,
        earthCenterY,
        earthRadius - 10 * sc,
        earthCenterX,
        earthCenterY,
        earthRadius + 28 * sc
      );
      atmoGlow.addColorStop(0, 'rgba(56, 189, 248, 0.45)');
      atmoGlow.addColorStop(0.5, 'rgba(30, 64, 175, 0.2)');
      atmoGlow.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = atmoGlow;
      ctx.beginPath();
      ctx.arc(earthCenterX, earthCenterY, earthRadius + 28 * sc, 0, Math.PI * 2);
      ctx.fill();

      // Earth Globe Surface
      const earthGrad = ctx.createLinearGradient(0, gY - 30 * sc, 0, H);
      earthGrad.addColorStop(0, '#172554');
      earthGrad.addColorStop(0.35, '#0f172a');
      earthGrad.addColorStop(1, '#020617');
      ctx.fillStyle = earthGrad;
      ctx.beginPath();
      ctx.arc(earthCenterX, earthCenterY, earthRadius, 0, Math.PI * 2);
      ctx.fill();

      // Space Platform Girder / Ground Truss spanning full width
      ctx.fillStyle = '#141d2b';
      ctx.fillRect(0, gY, W, Math.max(20, H - gY + 40));
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = Math.max(1, 2 * sc);
      ctx.beginPath();
      ctx.moveTo(0, gY);
      ctx.lineTo(W, gY);
      ctx.stroke();

      ctx.strokeStyle = '#1e3a8a';
      for (let x = 0; x < W; x += 40 * sc) {
        ctx.strokeRect(x, gY + 6 * sc, 32 * sc, 28 * sc);
      }
      ctx.restore();
    } else if (biome === 'ocean') {
      // South Pacific Ocean Swells & Naval Fleet Horizon
      ctx.save();
      ctx.fillStyle = '#131e33';
      ctx.beginPath();
      ctx.moveTo(ox + 660 * sc, gY);
      ctx.lineTo(ox + 670 * sc, gY - 14 * sc);
      ctx.lineTo(ox + 770 * sc, gY - 14 * sc);
      ctx.lineTo(ox + 780 * sc, gY);
      ctx.fill();
      ctx.fillRect(ox + 690 * sc, gY - 32 * sc, 50 * sc, 18 * sc);

      // Waves across full width
      const time = Date.now() / 800;
      ctx.fillStyle = '#122642';
      ctx.beginPath();
      ctx.moveTo(0, gY);
      for (let x = 0; x <= W; x += 30) {
        const y = gY - 5 * sc + Math.sin(x * 0.02 + time) * 3 * sc;
        ctx.lineTo(x, y);
      }
      ctx.lineTo(W, gY);
      ctx.fill();

      // Deep ocean water to bottom
      const waterGrad = ctx.createLinearGradient(0, gY, 0, H);
      waterGrad.addColorStop(0, '#0d2038');
      waterGrad.addColorStop(0.5, '#071324');
      waterGrad.addColorStop(1, '#030812');
      ctx.fillStyle = waterGrad;
      ctx.fillRect(0, gY, W, Math.max(20, H - gY + 40));
      ctx.restore();
    } else {
      // Lop Nur Gobi Desert Dunes & Horizon
      ctx.fillStyle = '#261b1e';
      ctx.beginPath();
      ctx.moveTo(0, gY);
      ctx.quadraticCurveTo(W * 0.25, gY - 80 * sc, W * 0.5, gY);
      ctx.fill();

      ctx.fillStyle = '#33231f';
      ctx.beginPath();
      ctx.moveTo(W * 0.3, gY);
      ctx.quadraticCurveTo(W * 0.65, gY - 100 * sc, W, gY);
      ctx.fill();

      // Distant Lop Nur radio mast
      const mastX = ox + 780 * sc;
      ctx.strokeStyle = '#4a3429';
      ctx.lineWidth = Math.max(1, 1.5 * sc);
      ctx.beginPath();
      ctx.moveTo(mastX, gY);
      ctx.lineTo(mastX, gY - 70 * sc);
      ctx.lineTo(mastX - 15 * sc, gY);
      ctx.moveTo(mastX, gY - 70 * sc);
      ctx.lineTo(mastX + 15 * sc, gY);
      ctx.stroke();

      // Red flashing beacon
      ctx.fillStyle = Math.sin(Date.now() / 300) > 0 ? '#ff4d4d' : '#882222';
      ctx.beginPath();
      ctx.arc(mastX, gY - 72 * sc, 2.5 * sc, 0, Math.PI * 2);
      ctx.fill();

      // Gobi Desert Ground Bedrock extending to bottom of canvas
      ctx.fillStyle = '#4a3322';
      ctx.fillRect(0, gY, W, Math.max(20, H - gY + 40));
      ctx.fillStyle = '#5c402b';
      ctx.fillRect(0, gY, W, Math.max(2, 6 * sc));
    }
  }

  private drawPlatforms(ctx: CanvasRenderingContext2D, engine: GameEngine): void {
    const gY = GAME_CONFIG.GROUND_Y;
    const L = GAME_CONFIG.LAUNCH_POS;
    const S = GAME_CONFIG.SUB_POS;

    // Land-based launch platform
    ctx.fillStyle = '#283144';
    ctx.fillRect(L.x - 38, gY - 14, 76, 14);
    ctx.fillStyle = '#3a4660';
    ctx.fillRect(L.x - 5, L.y, 10, gY - 14 - L.y);

    const isDemoActive = engine.demo && engine.demo.t > 0.7 && !engine.demo.flying;
    if (!engine.isAiming && !isDemoActive && !engine.useSub) {
      this.drawRails(ctx, GAME_CONFIG.RAIL_CONFIG.defAng, 0, false, L);
    }

    ctx.fillStyle = '#d4a359';
    ctx.beginPath();
    ctx.arc(L.x, L.y, 7, 0, 6.283);
    ctx.fill();
    ctx.fillStyle = '#9aa2b4';
    ctx.font = 'bold 12px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('发射阵地', L.x, gY + 24);

    // Submarine (available in level 11 or when unlocked)
    if (engine.unlockedScientists.includes('sub') || engine.levelIndex >= 11) {
      ctx.fillStyle = '#1c2e3b';
      ctx.beginPath();
      ctx.ellipse(S.x, S.y + 14, 48, 14, 0, 0, 6.283);
      ctx.fill();

      ctx.fillStyle = '#2d4557';
      ctx.fillRect(S.x - 12, S.y - 6, 24, 14);
      ctx.fillStyle = 'rgba(56, 189, 248, 0.4)';
      ctx.fillRect(S.x - 56, S.y + 24, 112, 3);

      if (!engine.isAiming && !isDemoActive && engine.useSub) {
        this.drawRails(ctx, GAME_CONFIG.RAIL_CONFIG.defAng, 0, false, S);
      }

      ctx.fillStyle = '#38bdf8';
      ctx.beginPath();
      ctx.arc(S.x, S.y, 6, 0, 6.283);
      ctx.fill();
      ctx.fillStyle = '#38bdf8';
      ctx.font = 'bold 12px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('潜射阵地', S.x, gY + 24);
    }
  }

  private drawRails(
    ctx: CanvasRenderingContext2D,
    ang: number,
    ratio: number = 0,
    showForward: boolean = false,
    origin: { x: number; y: number } = GAME_CONFIG.LAUNCH_POS
  ): void {
    const px = Math.cos(ang + Math.PI / 2);
    const py = Math.sin(ang + Math.PI / 2);
    const half = 24 + ratio * 36;
    const ax = Math.cos(ang);
    const ay = Math.sin(ang);

    ctx.strokeStyle = '#d4a359';
    ctx.lineWidth = 2;
    ctx.setLineDash([6, 6]);

    ctx.beginPath();
    ctx.moveTo(origin.x - px * half, origin.y - py * half);
    ctx.lineTo(origin.x + px * half, origin.y + py * half);
    ctx.stroke();

    if (showForward) {
      ctx.beginPath();
      ctx.moveTo(origin.x, origin.y);
      ctx.lineTo(origin.x - ax * 80, origin.y - ay * 80);
      ctx.stroke();
    }
    ctx.setLineDash([]);

    const t = 9;
    ctx.lineCap = 'round';
    for (const s of [1, -1]) {
      const ex = origin.x + px * half * s;
      const ey = origin.y + py * half * s;
      ctx.strokeStyle = '#323c52';
      ctx.lineWidth = 5;
      ctx.beginPath();
      ctx.moveTo(ex - ax * t, ey - ay * t);
      ctx.lineTo(ex + ax * t, ey + ay * t);
      ctx.stroke();

      ctx.strokeStyle = '#d4a359';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(ex - ax * t, ey - ay * t);
      ctx.lineTo(ex + ax * t, ey + ay * t);
      ctx.stroke();
    }
    ctx.lineCap = 'butt';
    ctx.lineWidth = 1;
  }

  private drawOrbitWindow(
    ctx: CanvasRenderingContext2D,
    orbit: { x: number; y: number; r: number }
  ): void {
    ctx.save();
    ctx.strokeStyle = '#38bdf8';
    ctx.setLineDash([8, 6]);
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.arc(orbit.x, orbit.y, orbit.r, 0, 6.283);
    ctx.stroke();
    ctx.setLineDash([]);

    // Rotating orbital satellite beacon
    const time = Date.now() / 1000;
    const satX = orbit.x + Math.cos(time) * orbit.r;
    const satY = orbit.y + Math.sin(time) * orbit.r;
    ctx.fillStyle = '#eec278';
    ctx.beginPath();
    ctx.arc(satX, satY, 5, 0, 6.283);
    ctx.fill();

    ctx.fillStyle = 'rgba(56, 189, 248, 0.16)';
    ctx.fill();
    ctx.fillStyle = '#38bdf8';
    ctx.font = 'bold 13px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('轨道入轨窗口', orbit.x, orbit.y - orbit.r - 8);
    ctx.restore();
  }

  private drawBlock(ctx: CanvasRenderingContext2D, b: ActiveBlock, engine: GameEngine): void {
    const biome = engine.level?.biome || 'desert';
    const cx = b.x + b.w / 2;
    const cy = b.y + b.h / 2;

    if (b.type === 'concrete') {
      ctx.fillStyle = '#555d70';
      ctx.fillRect(b.x, b.y, b.w, b.h);
      ctx.strokeStyle = '#6f7991';
      ctx.lineWidth = 1.5;
      ctx.strokeRect(b.x, b.y, b.w, b.h);

      ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
      ctx.beginPath();
      ctx.moveTo(b.x + 4, b.y + 4);
      ctx.lineTo(b.x + b.w - 4, b.y + b.h - 4);
      ctx.stroke();
    } else if (b.type === 'steel') {
      ctx.fillStyle = '#3b4356';
      ctx.fillRect(b.x, b.y, b.w, b.h);
      ctx.strokeStyle = '#7c8ca5';
      ctx.lineWidth = 2;
      ctx.strokeRect(b.x, b.y, b.w, b.h);

      // Steel rivets
      ctx.fillStyle = '#a2b1cb';
      const r = 2;
      ctx.beginPath();
      ctx.arc(b.x + 5, b.y + 5, r, 0, 6.283);
      ctx.arc(b.x + b.w - 5, b.y + 5, r, 0, 6.283);
      ctx.arc(b.x + 5, b.y + b.h - 5, r, 0, 6.283);
      ctx.arc(b.x + b.w - 5, b.y + b.h - 5, r, 0, 6.283);
      ctx.fill();
    } else if (b.type === 'core') {
      const pulse = 0.5 + Math.sin(Date.now() / 200) * 0.5;

      if (biome === 'industrial') {
        ctx.fillStyle = '#7a2222';
        ctx.fillRect(b.x, b.y, b.w, b.h);
        ctx.strokeStyle = pulse > 0.6 ? '#f87171' : '#dc2626';
        ctx.lineWidth = 2;
        ctx.strokeRect(b.x, b.y, b.w, b.h);

        this.drawRadiationEmblem(ctx, cx, cy, 9, '#fbbf24');
      } else if (biome === 'space') {
        ctx.fillStyle = '#b45309';
        ctx.fillRect(b.x, b.y, b.w, b.h);

        ctx.fillStyle = '#0284c7';
        ctx.fillRect(b.x - 8, b.y + 6, 8, b.h - 12);
        ctx.fillRect(b.x + b.w, b.y + 6, 8, b.h - 12);

        ctx.fillStyle = pulse > 0.7 ? '#ef4444' : '#10b981';
        ctx.beginPath();
        ctx.arc(cx, b.y + 8, 3.5, 0, Math.PI * 2);
        ctx.fill();

        this.drawCrosshairTarget(ctx, cx, cy, 7, '#38bdf8');
      } else if (biome === 'ocean') {
        ctx.fillStyle = '#991b1b';
        ctx.fillRect(b.x, b.y, b.w, b.h);
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(b.x, b.y + b.h * 0.35, b.w, b.h * 0.3);

        this.drawCrosshairTarget(ctx, cx, cy, 9, '#ffffff');
      } else {
        ctx.fillStyle = '#991b1b';
        ctx.fillRect(b.x, b.y, b.w, b.h);
        ctx.strokeStyle = '#f87171';
        ctx.lineWidth = 2;
        ctx.strokeRect(b.x, b.y, b.w, b.h);

        ctx.strokeStyle = '#fca5a5';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(cx, cy, Math.min(b.w, b.h) * 0.32, 0, Math.PI * 2);
        ctx.stroke();

        this.drawStar(ctx, cx, cy, 5, 8, 4, '#fef2f2');
      }
    }
  }

  private drawStar(
    ctx: CanvasRenderingContext2D,
    cx: number,
    cy: number,
    spikes: number,
    outerRadius: number,
    innerRadius: number,
    color: string
  ): void {
    let rot = (Math.PI / 2) * 3;
    let x = cx;
    let y = cy;
    const step = Math.PI / spikes;

    ctx.save();
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(cx, cy - outerRadius);
    for (let i = 0; i < spikes; i++) {
      x = cx + Math.cos(rot) * outerRadius;
      y = cy + Math.sin(rot) * outerRadius;
      ctx.lineTo(x, y);
      rot += step;

      x = cx + Math.cos(rot) * innerRadius;
      y = cy + Math.sin(rot) * innerRadius;
      ctx.lineTo(x, y);
      rot += step;
    }
    ctx.lineTo(cx, cy - outerRadius);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }

  private drawRadiationEmblem(
    ctx: CanvasRenderingContext2D,
    cx: number,
    cy: number,
    r: number,
    color: string
  ): void {
    ctx.save();
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(cx, cy, r * 0.28, 0, Math.PI * 2);
    ctx.fill();

    for (let i = 0; i < 3; i++) {
      const startAng = (i * 2 * Math.PI) / 3 - Math.PI / 6;
      const endAng = startAng + Math.PI / 3;
      ctx.beginPath();
      ctx.arc(cx, cy, r, startAng, endAng);
      ctx.arc(cx, cy, r * 0.45, endAng, startAng, true);
      ctx.closePath();
      ctx.fill();
    }
    ctx.restore();
  }

  private drawCrosshairTarget(
    ctx: CanvasRenderingContext2D,
    cx: number,
    cy: number,
    r: number,
    color: string
  ): void {
    ctx.save();
    ctx.strokeStyle = color;
    ctx.lineWidth = 1.8;
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.arc(cx, cy, r * 0.45, 0, Math.PI * 2);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(cx - r * 1.3, cy);
    ctx.lineTo(cx + r * 1.3, cy);
    ctx.moveTo(cx, cy - r * 1.3);
    ctx.lineTo(cx, cy + r * 1.3);
    ctx.stroke();

    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(cx, cy, 2, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  private drawDevice(ctx: CanvasRenderingContext2D, dev: DeployedDevice): void {
    const gY = GAME_CONFIG.GROUND_Y;
    ctx.strokeStyle = '#8d8272';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(dev.x - 16, gY);
    ctx.lineTo(dev.x, dev.y);
    ctx.lineTo(dev.x + 16, gY);
    ctx.stroke();
    ctx.lineWidth = 1;

    for (let y = dev.y + 14; y < gY - 4; y += 14) {
      const t = (y - dev.y) / (gY - dev.y);
      ctx.beginPath();
      ctx.moveTo(dev.x - 16 * t, y);
      ctx.lineTo(dev.x + 16 * t, y);
      ctx.stroke();
    }

    ctx.fillStyle = Math.sin(Date.now() / 180) > 0 ? '#ff5b4d' : '#c0392b';
    ctx.beginPath();
    ctx.arc(dev.x, dev.y, 10, 0, 6.283);
    ctx.fill();
    ctx.strokeStyle = '#ffd27b';
    ctx.stroke();
  }

  private drawAiming(ctx: CanvasRenderingContext2D, engine: GameEngine): void {
    if (!engine.aimStart || !engine.aimCurrent) return;

    const pull = Physics.calculatePull(
      engine.aimStart.x,
      engine.aimStart.y,
      engine.aimCurrent.x,
      engine.aimCurrent.y,
      engine.getPowerCap()
    );

    const aim = Physics.calculateAim(pull.dx, pull.dy, engine.getPowerCap(), engine.useSub);
    const origin = engine.getLaunchOrigin();

    const px = origin.x + pull.dx;
    const py = origin.y + pull.dy;
    const pl = Math.hypot(pull.dx, pull.dy) || 1;
    const ux = pull.dx / pl;
    const uy = pull.dy / pl;

    this.drawRails(
      ctx,
      Math.atan2(pull.dy, pull.dx),
      aim ? aim.power : 0,
      true,
      origin
    );

    // Warhead ball at pulled point
    const warheadCfg = WARHEAD_CONFIGS[engine.selectedWarhead];
    ctx.fillStyle = warheadCfg.color;
    ctx.beginPath();
    ctx.arc(px, py, 9, 0, 6.283);
    ctx.fill();
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.6)';
    ctx.stroke();

    // Direction arrow inside projectile
    ctx.strokeStyle = '#222';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(px + ux * 4, py + uy * 4);
    ctx.lineTo(px - ux * 5, py - uy * 5);
    ctx.stroke();

    ctx.fillStyle = '#222';
    ctx.beginPath();
    ctx.moveTo(px - ux * 10, py - uy * 10);
    ctx.lineTo(px - ux * 5 + uy * 4, py - uy * 5 - ux * 4);
    ctx.lineTo(px - ux * 5 - uy * 4, py - uy * 5 + ux * 4);
    ctx.closePath();
    ctx.fill();
    ctx.lineWidth = 1;

    // Angle and power tactical readout near aim point
    if (aim) {
      const angleDeg = Math.round(Math.atan2(-aim.vy, Math.abs(aim.vx)) * (180 / Math.PI));
      const powerPct = Math.round(aim.power * 100);
      ctx.fillStyle = '#eec278';
      ctx.font = 'bold 11px sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText(`仰角 ${angleDeg}° · 力度 ${powerPct}%`, px + 14, py - 4);
    }

    // Trajectory prediction when telescope/radar scientist is unlocked (Sun Jiadong or 'scope')
    const hasScope = engine.unlockedScientists.includes('sun') || engine.unlockedScientists.includes('scope');
    if (aim) {
      const wind = engine.level?.wind || 0;
      const points = Physics.simulateTrajectory(
        origin.x,
        origin.y,
        aim.vx,
        aim.vy,
        wind,
        GAME_CONFIG.GROUND_Y,
        hasScope ? 140 : 16
      );

      if (hasScope) {
        // High-tech radar dashed telemetry curve
        ctx.strokeStyle = 'rgba(212, 163, 89, 0.45)';
        ctx.lineWidth = 1.5;
        ctx.setLineDash([4, 6]);
        ctx.beginPath();
        points.forEach((p, i) => {
          if (i === 0) ctx.moveTo(p.x, p.y);
          else ctx.lineTo(p.x, p.y);
        });
        ctx.stroke();
        ctx.setLineDash([]);

        // Glowing telemetry dots
        for (let i = 0; i < points.length; i += 2) {
          const p = points[i];
          ctx.fillStyle = i % 4 === 0 ? '#eec278' : 'rgba(238, 194, 120, 0.4)';
          ctx.beginPath();
          ctx.arc(p.x, p.y, i % 4 === 0 ? 2.5 : 1.5, 0, 6.283);
          ctx.fill();
        }

        // Target impact marker at trajectory end
        if (points.length > 0) {
          const endP = points[points.length - 1];
          ctx.strokeStyle = 'rgba(239, 68, 68, 0.85)';
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          ctx.arc(endP.x, endP.y, 6, 0, 6.283);
          ctx.stroke();
        }
      } else {
        // Subtle short guidance dots for natural touch feedback
        ctx.fillStyle = 'rgba(255, 255, 255, 0.35)';
        for (let i = 0; i < Math.min(6, points.length); i += 2) {
          const p = points[i];
          ctx.beginPath();
          ctx.arc(p.x, p.y, 2, 0, 6.283);
          ctx.fill();
        }
      }
    }
  }

  private drawDemo(ctx: CanvasRenderingContext2D, engine: GameEngine): void {
    const demo = engine.demo;
    if (!demo || engine.isAiming) return;

    const D = {
      sx: GAME_CONFIG.DEMO_PULL.sx,
      sy: GAME_CONFIG.DEMO_PULL.sy,
      ex: GAME_CONFIG.DEMO_PULL.sx + GAME_CONFIG.DEMO_PULL.dx,
      ey: GAME_CONFIG.DEMO_PULL.sy + GAME_CONFIG.DEMO_PULL.dy,
    };
    ctx.save();

    if (!demo.flying) {
      const dragT = Math.min(1, Math.max(0, (demo.t - 0.7) / (2.6 - 0.7)));
      const fx = D.sx + (D.ex - D.sx) * dragT;
      const fy = D.sy + (D.ey - D.sy) * dragT;

      ctx.strokeStyle = '#d4a359';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(D.sx, D.sy);
      ctx.lineTo(fx, fy);
      ctx.stroke();

      ctx.fillStyle = '#eec278';
      ctx.beginPath();
      ctx.arc(fx, fy, 10, 0, 6.283);
      ctx.fill();
      ctx.strokeStyle = '#fff';
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.lineWidth = 1;

      ctx.fillStyle = '#fff';
      ctx.font = 'bold 15px sans-serif';
      ctx.fillText(
        dragT === 0 ? '① 从画面任意位置按住' : '② 向左下方拖拽拉弓',
        D.sx,
        D.sy - 24
      );
    } else {
      ctx.fillStyle = '#fff';
      ctx.font = 'bold 15px sans-serif';
      ctx.fillText('③ 松开发射！', GAME_CONFIG.WORLD_WIDTH / 2, 100);

      ctx.strokeStyle = 'rgba(238, 194, 120, 0.25)';
      ctx.lineWidth = 3;
      ctx.beginPath();
      demo.trail.forEach((p, i) => (i ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y)));
      ctx.stroke();
      ctx.lineWidth = 1;

      const a = Math.atan2(demo.vy, demo.vx);
      ctx.translate(demo.x, demo.y);
      ctx.rotate(a);
      ctx.fillStyle = '#d8d8d8';
      ctx.beginPath();
      ctx.moveTo(10, 0);
      ctx.lineTo(-8, -5);
      ctx.lineTo(-8, 5);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = '#ff8833';
      ctx.beginPath();
      ctx.moveTo(-8, 0);
      ctx.lineTo(-14 - Math.random() * 6, -3);
      ctx.lineTo(-14 - Math.random() * 6, 3);
      ctx.closePath();
      ctx.fill();
    }

    ctx.restore();
  }

  private drawMissile(ctx: CanvasRenderingContext2D, engine: GameEngine): void {
    const m = engine.missile;
    if (!m) return;

    // Trail
    ctx.strokeStyle = m.glideTimer > 0 ? 'rgba(56, 189, 248, 0.6)' : 'rgba(238, 194, 120, 0.3)';
    ctx.lineWidth = 3;
    ctx.beginPath();
    m.trail.forEach((p, i) => (i ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y)));
    ctx.stroke();
    ctx.lineWidth = 1;

    // Missile body rotated along velocity vector
    const a = Math.atan2(m.vy, m.vx);
    ctx.save();
    ctx.translate(m.x, m.y);
    ctx.rotate(a);
    ctx.fillStyle = WARHEAD_CONFIGS[m.type].color;
    ctx.beginPath();
    ctx.moveTo(10, 0);
    ctx.lineTo(-8, -5);
    ctx.lineTo(-8, 5);
    ctx.closePath();
    ctx.fill();

    // Rocket exhaust flame
    ctx.fillStyle = '#ff8833';
    ctx.beginPath();
    ctx.moveTo(-8, 0);
    ctx.lineTo(-14 - Math.random() * 6, -3);
    ctx.lineTo(-14 - Math.random() * 6, 3);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }

  private drawParticles(ctx: CanvasRenderingContext2D, engine: GameEngine): void {
    for (const p of engine.particles) {
      ctx.globalAlpha = Math.max(0, p.life / p.maxLife);
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, 6.283);
      ctx.fill();
    }
    ctx.globalAlpha = 1.0;
  }

  private drawTacticalPrompts(ctx: CanvasRenderingContext2D, engine: GameEngine): void {
    const W = GAME_CONFIG.WORLD_WIDTH;
    const hasQian = engine.unlockedScientists.includes('qian');
    const isStage2Avail = engine.unlockedScientists.includes('stage2') || engine.levelIndex >= 9;

    if (engine.missile && hasQian && !engine.missile.glideUsed) {
      ctx.fillStyle = '#38bdf8';
      ctx.font = 'bold 15px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('按【空格】或轻触屏幕 发动钱学森弹道！', W / 2, 48);
    } else if (engine.missile && engine.missile.glideUsed && isStage2Avail && !engine.missile.stage2Used) {
      ctx.fillStyle = '#fbbf24';
      ctx.font = 'bold 15px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('再按【空格】或轻触屏幕 二级点火冲刺！', W / 2, 48);
    } else if (engine.deployMode) {
      ctx.fillStyle = '#eec278';
      ctx.font = 'bold 14px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('部署模式：点击右侧靶场地面架设核装置', W / 2, 48);
    }
  }
}
