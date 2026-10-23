export class SoundEffects {
  private ctx: AudioContext | null = null;
  private enabled: boolean = true;

  constructor(initialEnabled: boolean = true) {
    this.enabled = initialEnabled;
  }

  public setEnabled(enabled: boolean): void {
    this.enabled = enabled;
  }

  public isEnabled(): boolean {
    return this.enabled;
  }

  private initContext(): AudioContext | null {
    if (!this.enabled || typeof window === 'undefined') return null;

    if (!this.ctx) {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }

    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }

    return this.ctx;
  }

  private triggerHaptic(pattern: number | number[]): void {
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      try {
        navigator.vibrate(pattern);
      } catch {}
    }
  }

  /**
   * Helper to generate a multi-sample noise buffer
   */
  private createNoiseBuffer(ctx: AudioContext, duration: number, type: 'white' | 'pink' | 'brown' = 'brown'): AudioBuffer {
    const bufferSize = Math.max(1, Math.floor(ctx.sampleRate * duration));
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);

    let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
    let lastOut = 0.0;

    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;

      if (type === 'white') {
        data[i] = white;
      } else if (type === 'pink') {
        b0 = 0.99886 * b0 + white * 0.0555179;
        b1 = 0.99332 * b1 + white * 0.0750759;
        b2 = 0.96900 * b2 + white * 0.1538520;
        b3 = 0.86650 * b3 + white * 0.3104856;
        b4 = 0.55000 * b4 + white * 0.5329522;
        b5 = -0.7616 * b5 - white * 0.0168980;
        data[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362) * 0.11;
        b6 = white * 0.115926;
      } else {
        // Brown noise: integrates white noise for deep rumble
        lastOut = (lastOut + 0.02 * white) / 1.02;
        data[i] = lastOut * 3.5;
      }
    }
    return buffer;
  }

  /**
   * Realistic Rocket Engine Ignition & Launch Roar
   */
  public playLaunch(type: string = 'normal'): void {
    this.triggerHaptic(type === 'hydro' ? [50, 40, 80] : 45);

    const ctx = this.initContext();
    if (!ctx) return;

    try {
      const t = ctx.currentTime;
      const duration = type === 'hydro' ? 0.75 : 0.55;

      // Layer 1: Deep combustion rumble (Low Brown Noise with resonant lowpass)
      const noiseBuffer = this.createNoiseBuffer(ctx, duration, 'brown');
      const noiseSource = ctx.createBufferSource();
      noiseSource.buffer = noiseBuffer;

      const noiseFilter = ctx.createBiquadFilter();
      noiseFilter.type = 'lowpass';
      noiseFilter.frequency.setValueAtTime(140, t);
      noiseFilter.frequency.exponentialRampToValueAtTime(type === 'hydro' ? 380 : 520, t + 0.25);
      noiseFilter.frequency.exponentialRampToValueAtTime(160, t + duration);
      noiseFilter.Q.setValueAtTime(2.5, t);

      const noiseGain = ctx.createGain();
      noiseGain.gain.setValueAtTime(0.01, t);
      noiseGain.gain.linearRampToValueAtTime(0.38, t + 0.08);
      noiseGain.gain.exponentialRampToValueAtTime(0.01, t + duration);

      noiseSource.connect(noiseFilter);
      noiseFilter.connect(noiseGain);
      noiseGain.connect(ctx.destination);
      noiseSource.start(t);

      // Layer 2: Sub-bass rocket chamber acoustic resonance
      const subOsc = ctx.createOscillator();
      const subGain = ctx.createGain();
      subOsc.type = 'sine';
      subOsc.frequency.setValueAtTime(type === 'hydro' ? 85 : 110, t);
      subOsc.frequency.exponentialRampToValueAtTime(45, t + duration);

      subGain.gain.setValueAtTime(0.3, t);
      subGain.gain.exponentialRampToValueAtTime(0.01, t + duration);

      subOsc.connect(subGain);
      subGain.connect(ctx.destination);
      subOsc.start(t);
      subOsc.stop(t + duration);
    } catch {}
  }

  /**
   * Hypersonic Glide - Qian Xuesen Trajectory Shockwave
   */
  public playGlide(): void {
    this.triggerHaptic([35, 30, 45]);

    const ctx = this.initContext();
    if (!ctx) return;

    try {
      const t = ctx.currentTime;
      const duration = 0.5;

      // Resonant aerodynamic wave whoosh
      const noiseBuffer = this.createNoiseBuffer(ctx, duration, 'pink');
      const noise = ctx.createBufferSource();
      noise.buffer = noiseBuffer;

      const bandpass = ctx.createBiquadFilter();
      bandpass.type = 'bandpass';
      bandpass.frequency.setValueAtTime(1200, t);
      bandpass.frequency.exponentialRampToValueAtTime(320, t + duration);
      bandpass.Q.setValueAtTime(5.5, t);

      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0.01, t);
      gain.gain.linearRampToValueAtTime(0.3, t + 0.08);
      gain.gain.exponentialRampToValueAtTime(0.005, t + duration);

      noise.connect(bandpass);
      bandpass.connect(gain);
      gain.connect(ctx.destination);
      noise.start(t);
    } catch {}
  }

  /**
   * Solid Propellant Second-Stage Staging Ignition
   */
  public playStage2(): void {
    this.triggerHaptic([40, 25, 70]);

    const ctx = this.initContext();
    if (!ctx) return;

    try {
      const t = ctx.currentTime;
      const duration = 0.55;

      // Staging separation crack
      const crackBuffer = this.createNoiseBuffer(ctx, 0.08, 'white');
      const crack = ctx.createBufferSource();
      crack.buffer = crackBuffer;
      const crackGain = ctx.createGain();
      crackGain.gain.setValueAtTime(0.35, t);
      crackGain.gain.exponentialRampToValueAtTime(0.01, t + 0.08);
      crack.connect(crackGain);
      crackGain.connect(ctx.destination);
      crack.start(t);

      // Rocket flare roar
      const roarBuffer = this.createNoiseBuffer(ctx, duration, 'brown');
      const roar = ctx.createBufferSource();
      roar.buffer = roarBuffer;

      const filter = ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(260, t);
      filter.frequency.exponentialRampToValueAtTime(800, t + 0.15);
      filter.frequency.exponentialRampToValueAtTime(120, t + duration);

      const roarGain = ctx.createGain();
      roarGain.gain.setValueAtTime(0.01, t);
      roarGain.gain.linearRampToValueAtTime(0.32, t + 0.1);
      roarGain.gain.exponentialRampToValueAtTime(0.01, t + duration);

      roar.connect(filter);
      filter.connect(roarGain);
      roarGain.connect(ctx.destination);
      roar.start(t);
    } catch {}
  }

  /**
   * Cinema-Grade Multilayer Explosions (Normal, Atomic, Hydrogen Bomb)
   */
  public playExplosion(type: string = 'normal'): void {
    const isHydro = type === 'hydro';
    const isAtomic = type === 'atomic';
    const isDeploy = type === 'deploy';

    if (isHydro) {
      this.triggerHaptic([100, 50, 200, 60, 300]);
    } else if (isAtomic || isDeploy) {
      this.triggerHaptic([80, 40, 160]);
    } else {
      this.triggerHaptic([50, 30, 80]);
    }

    const ctx = this.initContext();
    if (!ctx) return;

    try {
      const t = ctx.currentTime;
      const dur = isHydro ? 2.2 : isAtomic ? 1.5 : isDeploy ? 1.1 : 0.65;

      // 1. Initial Shockwave Crack (High-energy blast front)
      const crackBuffer = this.createNoiseBuffer(ctx, 0.12, 'white');
      const crack = ctx.createBufferSource();
      crack.buffer = crackBuffer;
      const crackFilter = ctx.createBiquadFilter();
      crackFilter.type = 'bandpass';
      crackFilter.frequency.setValueAtTime(isHydro ? 1400 : 900, t);
      crackFilter.Q.setValueAtTime(2.0, t);

      const crackGain = ctx.createGain();
      crackGain.gain.setValueAtTime(isHydro ? 0.45 : 0.32, t);
      crackGain.gain.exponentialRampToValueAtTime(0.005, t + 0.12);

      crack.connect(crackFilter);
      crackFilter.connect(crackGain);
      crackGain.connect(ctx.destination);
      crack.start(t);

      // 2. Sub-bass Ground Punch
      const sub = ctx.createOscillator();
      const subGain = ctx.createGain();
      sub.type = 'sine';
      sub.frequency.setValueAtTime(isHydro ? 140 : 110, t);
      sub.frequency.exponentialRampToValueAtTime(isHydro ? 28 : 38, t + (isHydro ? 1.2 : 0.5));

      subGain.gain.setValueAtTime(isHydro ? 0.42 : 0.3, t);
      subGain.gain.exponentialRampToValueAtTime(0.005, t + (isHydro ? 1.2 : 0.5));

      sub.connect(subGain);
      subGain.connect(ctx.destination);
      sub.start(t);
      sub.stop(t + (isHydro ? 1.2 : 0.5));

      // 3. Reverberant Debris & Thunder Decay
      const rumbleBuffer = this.createNoiseBuffer(ctx, dur, 'brown');
      const rumble = ctx.createBufferSource();
      rumble.buffer = rumbleBuffer;

      const rumbleFilter = ctx.createBiquadFilter();
      rumbleFilter.type = 'lowpass';
      rumbleFilter.frequency.setValueAtTime(isHydro ? 400 : 320, t);
      rumbleFilter.frequency.exponentialRampToValueAtTime(50, t + dur);

      const rumbleGain = ctx.createGain();
      rumbleGain.gain.setValueAtTime(0.01, t);
      rumbleGain.gain.linearRampToValueAtTime(isHydro ? 0.4 : 0.28, t + 0.05);
      rumbleGain.gain.exponentialRampToValueAtTime(0.002, t + dur);

      rumble.connect(rumbleFilter);
      rumbleFilter.connect(rumbleGain);
      rumbleGain.connect(ctx.destination);
      rumble.start(t);
    } catch {}
  }

  /**
   * Solid Kinetic Impact
   */
  public playHit(): void {
    this.triggerHaptic(30);

    const ctx = this.initContext();
    if (!ctx) return;

    try {
      const t = ctx.currentTime;

      // Surface clank
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(380, t);
      osc.frequency.exponentialRampToValueAtTime(70, t + 0.1);

      gain.gain.setValueAtTime(0.25, t);
      gain.gain.exponentialRampToValueAtTime(0.005, t + 0.1);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(t);
      osc.stop(t + 0.1);

      // Thud noise
      const nBuffer = this.createNoiseBuffer(ctx, 0.08, 'brown');
      const nSrc = ctx.createBufferSource();
      nSrc.buffer = nBuffer;
      const nGain = ctx.createGain();
      nGain.gain.setValueAtTime(0.2, t);
      nGain.gain.exponentialRampToValueAtTime(0.01, t + 0.08);
      nSrc.connect(nGain);
      nGain.connect(ctx.destination);
      nSrc.start(t);
    } catch {}
  }

  /**
   * Majestic Military/Aerospace Triumph Fanfare
   */
  public playWin(): void {
    this.triggerHaptic([60, 50, 60, 50, 140]);

    const ctx = this.initContext();
    if (!ctx) return;

    try {
      // Solemn trumpet triad: C4, G4, C5, E5, G5
      const chords = [
        { f: 261.63, delay: 0, dur: 0.25 },
        { f: 392.00, delay: 0.14, dur: 0.25 },
        { f: 523.25, delay: 0.28, dur: 0.35 },
        { f: 659.25, delay: 0.44, dur: 0.35 },
        { f: 783.99, delay: 0.62, dur: 0.8 },
      ];

      chords.forEach(({ f, delay, dur }) => {
        if (!ctx) return;
        const t = ctx.currentTime + delay;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(f, t);

        const filter = ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(f * 2.8, t);

        gain.gain.setValueAtTime(0.01, t);
        gain.gain.linearRampToValueAtTime(0.18, t + 0.03);
        gain.gain.exponentialRampToValueAtTime(0.002, t + dur);

        osc.connect(filter);
        filter.connect(gain);
        gain.connect(ctx.destination);

        osc.start(t);
        osc.stop(t + dur);
      });
    } catch {}
  }

  /**
   * Crisp Aerospace Console Push-Button Micro-Click
   */
  public playClick(): void {
    this.triggerHaptic(15);

    const ctx = this.initContext();
    if (!ctx) return;

    try {
      const t = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(1400, t);
      osc.frequency.exponentialRampToValueAtTime(600, t + 0.025);

      gain.gain.setValueAtTime(0.1, t);
      gain.gain.exponentialRampToValueAtTime(0.005, t + 0.025);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(t);
      osc.stop(t + 0.025);
    } catch {}
  }
}
