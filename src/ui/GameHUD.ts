import { WARHEAD_CONFIGS } from '../data/gameConfig';
import { GameEngine } from '../engine/GameEngine';
import { ProgressionSystem } from '../systems/ProgressionSystem';
import { WarheadType } from '../types/game';
import { ICONS } from './Icons';

export interface HUDCallbacks {
  onSelectWarhead: (type: WarheadType) => void;
  onToggleDeploy: () => void;
  onDetonate: () => void;
  onToggleSite: () => void;
  onRestart: () => void;
  onMenu: () => void;
  onToggleSound: () => void;
  onToggleFullscreen?: () => void;
  onOpenPresentation?: () => void;
  onTriggerInFlightAbility?: () => void;
  onDeckAimStart?: (dx: number, dy: number) => void;
  onDeckAimMove?: (dx: number, dy: number) => void;
  onDeckAimEnd?: () => void;
}

export class GameHUD {
  private container: HTMLElement;
  private deckContainer: HTMLElement | null = null;
  private callbacks: HUDCallbacks;

  // Deck touch pad drag state
  private isDeckDragging: boolean = false;
  private deckTouchOrigin: { x: number; y: number } | null = null;

  constructor(container: HTMLElement, callbacks: HUDCallbacks, deckContainer?: HTMLElement | null) {
    this.container = container;
    this.callbacks = callbacks;
    this.deckContainer = deckContainer || document.getElementById('command-deck');
  }

  public update(engine: GameEngine, soundEnabled: boolean, isPortrait: boolean = false): void {
    const warheadKeys: WarheadType[] = ['normal', 'atomic', 'hydro', 'bunker'];
    const wind = engine.level?.wind || 0;
    const windHtml =
      wind !== 0
        ? `<span class="hud-pill wind-pill" title="气象风速">
            <svg viewBox="0 0 24 24" class="hud-icon-xs"><path fill="currentColor" d="M14.5 17c0 1.66-1.34 3-3 3s-3-1.34-3-3 1.34-3 3-3h10v2h-10c-.55 0-1 .45-1 1s.45 1 1 1 1-.45 1-1h2zm4-6c0-1.66-1.34-3-3-3s-3 1.34-3 3 1.34 3 3 3h7v-2h-7c-.55 0-1-.45-1-1s.45-1 1-1 1 .45 1 1h2zm-8-4c0-1.66-1.34-3-3-3s-3 1.34-3 3 1.34 3 3 3h13V8H4.5c-.55 0-1-.45-1-1s.45-1 1-1 1 .45 1 1h2z"/></svg>
            ${wind > 0 ? '→' : '←'} ${Math.abs(wind)}m/s
          </span>`
        : '';

    const title = engine.isEndless
      ? `无尽战略演习 · 第${engine.endlessWave}波 · ${engine.endlessScore}分`
      : engine.level
      ? `${engine.level.year} ${engine.level.name}`
      : '两弹一星';

    const warheadIcons: Record<WarheadType, string> = {
      normal: ICONS.rocket('warhead-sym-svg'),
      atomic: ICONS.atomic('warhead-sym-svg'),
      hydro: ICONS.hydro('warhead-sym-svg'),
      bunker: ICONS.bunker('warhead-sym-svg'),
      deploy: ICONS.deploy('warhead-sym-svg'),
    };

    // Build Landscape Top-Dock Warheads Html: ONLY show warheads that are part of this level or currently have ammo
    let warheadsHtml = '';
    for (const k of warheadKeys) {
      const count = engine.warheads[k] || 0;
      const locked = ProgressionSystem.isWarheadLocked(
        k,
        engine.levelIndex,
        engine.unlockedScientists
      );
      const initialLevelAmmo = engine.level?.warheads[k] || 0;

      // Do NOT show unprovided/locked zero-ammo weapons in the top dock
      if (!engine.isEndless && initialLevelAmmo <= 0 && count <= 0) {
        continue;
      }

      const isSelected = engine.selectedWarhead === k;
      const disabled = count <= 0 || locked;

      const classes = [
        'hud-warhead-btn',
        isSelected ? 'active' : '',
        disabled ? 'disabled' : '',
      ]
        .filter(Boolean)
        .join(' ');

      warheadsHtml += `
        <button class="${classes}" data-warhead="${k}" ${disabled ? 'disabled' : ''} title="${WARHEAD_CONFIGS[k].name}: ${WARHEAD_CONFIGS[k].description}">
          <span class="warhead-sym">${warheadIcons[k]}</span>
          <span class="warhead-name">${WARHEAD_CONFIGS[k].name}</span>
          <span class="warhead-count">${count}</span>
        </button>
      `;
    }

    // Deployable device button
    if ((engine.warheads.deploy || 0) > 0 || engine.deployedDevices.length > 0) {
      const isDeployLocked = ProgressionSystem.isDeployLocked(
        engine.levelIndex,
        engine.unlockedScientists
      );
      if (!isDeployLocked || (engine.warheads.deploy || 0) > 0) {
        const classes = [
          'hud-warhead-btn',
          'deploy-btn',
          engine.deployMode ? 'active deploy-active' : '',
          (engine.warheads.deploy || 0) <= 0 ? 'disabled' : '',
        ]
          .filter(Boolean)
          .join(' ');

        warheadsHtml += `
          <button class="${classes}" id="btn-deploy" ${(engine.warheads.deploy || 0) <= 0 ? 'disabled' : ''} title="定点核装置架设">
            <span class="warhead-sym">${ICONS.deploy('warhead-sym-svg')}</span>
            <span class="warhead-name">装置</span>
            <span class="warhead-count">${engine.warheads.deploy || 0}</span>
          </button>
        `;
      }
    }

    // Detonate button if devices on field
    if (engine.deployedDevices.length > 0) {
      warheadsHtml += `
        <button class="hud-warhead-btn detonate-btn active" id="btn-detonate" title="立即起爆地面核装置">
          <span class="warhead-sym">${ICONS.detonate('warhead-sym-svg')}</span>
          <span class="warhead-name">起爆</span>
          <span class="warhead-count">${engine.deployedDevices.length}</span>
        </button>
      `;
    }

    // Submarine site button
    const isSubAvailable = ProgressionSystem.isSubmarineAvailable(
      engine.levelIndex,
      engine.unlockedScientists
    );
    const siteBtnHtml = isSubAvailable
      ? `<button class="hud-warhead-btn sub-btn ${engine.useSub ? 'active sub-active' : ''}" id="btn-site" title="${engine.useSub ? '切换陆基发射' : '切换巨浪潜射'}">
          <span class="warhead-sym">${engine.useSub ? ICONS.submarine('warhead-sym-svg') : ICONS.rocket('warhead-sym-svg')}</span>
          <span class="warhead-name">${engine.useSub ? '潜射' : '陆基'}</span>
        </button>`
      : '';

    const presBadge = engine.isPresentationMode
      ? '<span class="hud-pill pres-pill">演示</span>'
      : '';

    // In-flight ability trigger button: in landscape, float near bottom center; in portrait, placed in Command Deck
    let inFlightAbilityHtml = '';
    if (engine.missile && !isPortrait) {
      const hasQian = engine.unlockedScientists.includes('qian');
      const isStage2 = engine.unlockedScientists.includes('stage2') || engine.levelIndex >= 9;

      if (!engine.missile.glideUsed && hasQian) {
        inFlightAbilityHtml = `
          <button class="hud-ability-badge ability-glide" id="btn-ability-trigger">
            <span>${ICONS.glide('hud-icon-xs inline-icon')} 钱学森弹道 (轻触滑翔)</span>
          </button>
        `;
      } else if (engine.missile.glideUsed && isStage2 && !engine.missile.stage2Used) {
        inFlightAbilityHtml = `
          <button class="hud-ability-badge ability-stage2" id="btn-ability-trigger">
            <span>${ICONS.flame('hud-icon-xs inline-icon')} 二级点火 (冲刺加速)</span>
          </button>
        `;
      }
    }

    // Floating HUD: Right controls are flex-shrink: 0 and margin-left: auto so they are NEVER pushed off screen
    this.container.innerHTML = `
      <!-- Top Row: Mission Left, Weapon Selector Center (Landscape), Pinned Actions Right -->
      <div class="hud-top-row">
        <div class="hud-zone-left">
          <span class="hud-pill mission-pill" title="${title}">${title}</span>
          ${presBadge}
          ${!isPortrait ? windHtml : ''}
        </div>

        ${
          !isPortrait && (warheadsHtml || siteBtnHtml)
            ? `<div class="hud-zone-center">
                <div class="hud-dock">
                  ${siteBtnHtml}
                  ${warheadsHtml}
                </div>
              </div>`
            : ''
        }

        <div class="hud-zone-right">
          <button class="hud-icon-btn" id="btn-sound" title="${soundEnabled ? '音效开启' : '音效静音'}" aria-label="音效">
            ${
              soundEnabled
                ? `<svg viewBox="0 0 24 24" class="hud-icon"><path fill="currentColor" d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"/></svg>`
                : `<svg viewBox="0 0 24 24" class="hud-icon"><path fill="currentColor" d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51C20.63 14.91 21 13.5 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06c1.38-.31 2.63-.95 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4L9.91 6.09 12 8.18V4z"/></svg>`
            }
          </button>

          <button class="hud-icon-btn" id="btn-fullscreen" title="全屏切换" aria-label="全屏">
            <svg viewBox="0 0 24 24" class="hud-icon"><path fill="currentColor" d="M7 14H5v5h5v-2H7v-3zm-2-4h2V7h3V5H5v5zm12 7h-3v2h5v-5h-2v3zM14 5v2h3v3h2V5h-5z"/></svg>
          </button>

          <button class="hud-icon-btn" id="btn-restart" title="重新开始" aria-label="重新开始">
            <svg viewBox="0 0 24 24" class="hud-icon"><path fill="currentColor" d="M17.65 6.35A7.958 7.958 0 0012 4c-4.42 0-7.99 3.58-7.99 8s3.57 8 7.99 8c3.73 0 6.84-2.55 7.73-6h-2.08A5.99 5.99 0 0112 18c-3.31 0-6-2.69-6-6s2.69-6 6-6c1.66 0 3.14.69 4.22 1.78L13 11h7V4l-2.35 2.35z"/></svg>
          </button>

          <button class="hud-icon-btn" id="btn-menu" title="返回主页" aria-label="主页">
            <svg viewBox="0 0 24 24" class="hud-icon"><path fill="currentColor" d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z"/></svg>
          </button>
        </div>
      </div>

      <!-- Center Floating Ability Action -->
      ${inFlightAbilityHtml}

      <!-- Bottom Row: Left is 100% CLEAR for the launcher! Ammo count is at bottom right -->
      <div class="hud-bottom-row">
        <div class="hud-ammo-badge" title="剩余弹药">
          <svg viewBox="0 0 24 24" class="hud-icon-sm">
            <circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" stroke-width="2"/>
            <circle cx="12" cy="12" r="3.5" fill="currentColor"/>
            <path d="M12 2v3m0 14v3M2 12h3m14 0h3" stroke="currentColor" stroke-width="2"/>
          </svg>
          <span class="ammo-val">${engine.getTotalAmmo()} 枚</span>
        </div>
      </div>
    `;

    // Render Portrait Command Deck if in portrait mode
    if (this.deckContainer) {
      if (isPortrait) {
        this.deckContainer.classList.remove('hidden');
        this.renderPortraitDeck(engine);
      } else {
        this.deckContainer.classList.add('hidden');
        this.deckContainer.innerHTML = '';
      }
    }

    this.attachEvents();
  }

  private renderPortraitDeck(engine: GameEngine): void {
    if (!this.deckContainer) return;

    const warheadKeys: WarheadType[] = ['normal', 'atomic', 'hydro', 'bunker'];
    const warheadIcons: Record<WarheadType, string> = {
      normal: ICONS.rocket('warhead-sym-svg'),
      atomic: ICONS.atomic('warhead-sym-svg'),
      hydro: ICONS.hydro('warhead-sym-svg'),
      bunker: ICONS.bunker('warhead-sym-svg'),
      deploy: ICONS.deploy('warhead-sym-svg'),
    };

    let cardsHtml = '';
    for (const k of warheadKeys) {
      const count = engine.warheads[k] || 0;
      const locked = ProgressionSystem.isWarheadLocked(
        k,
        engine.levelIndex,
        engine.unlockedScientists
      );
      const initialLevelAmmo = engine.level?.warheads[k] || 0;

      // Filter out weapons not in this level
      if (!engine.isEndless && initialLevelAmmo <= 0 && count <= 0) {
        continue;
      }

      const isSelected = engine.selectedWarhead === k;
      const disabled = count <= 0 || locked;

      cardsHtml += `
        <div class="deck-weapon-card ${isSelected ? 'active' : ''} ${disabled ? 'disabled' : ''}" data-warhead="${k}">
          <span class="w-icon">${warheadIcons[k]}</span>
          <span class="w-name">${WARHEAD_CONFIGS[k].name}</span>
          <span class="w-count">${count}枚</span>
        </div>
      `;
    }

    if ((engine.warheads.deploy || 0) > 0 || engine.deployedDevices.length > 0) {
      cardsHtml += `
        <div class="deck-weapon-card ${engine.deployMode ? 'active' : ''} ${(engine.warheads.deploy || 0) <= 0 ? 'disabled' : ''}" id="deck-btn-deploy">
          <span class="w-icon">${ICONS.deploy('warhead-sym-svg')}</span>
          <span class="w-name">核装置</span>
          <span class="w-count">${engine.warheads.deploy || 0}套</span>
        </div>
      `;
    }

    const coresRemaining = engine.blocks.filter((b) => b.type === 'core').length;
    const isSubAvailable = ProgressionSystem.isSubmarineAvailable(
      engine.levelIndex,
      engine.unlockedScientists
    );

    let abilityBtnHtml = '';
    if (engine.missile) {
      const hasQian = engine.unlockedScientists.includes('qian');
      const isStage2 = engine.unlockedScientists.includes('stage2') || engine.levelIndex >= 9;

      if (!engine.missile.glideUsed && hasQian) {
        abilityBtnHtml = `
          <button class="deck-act-btn ability" id="deck-btn-ability">
            ${ICONS.glide('hud-icon-xs inline-icon')} 钱学森弹道 (滑翔增程)
          </button>
        `;
      } else if (engine.missile.glideUsed && isStage2 && !engine.missile.stage2Used) {
        abilityBtnHtml = `
          <button class="deck-act-btn ability" id="deck-btn-ability">
            ${ICONS.flame('hud-icon-xs inline-icon')} 二级点火 (冲刺加速)
          </button>
        `;
      }
    }

    this.deckContainer.innerHTML = `
      <!-- Telemetry Status Bar -->
      <div class="deck-telemetry-row">
        <div class="deck-telemetry-item">
          <span>核心目标:</span>
          <b>${coresRemaining} 处</b>
        </div>
        <div class="deck-telemetry-item">
          <span>可用弹药:</span>
          <b>${engine.getTotalAmmo()} 枚</b>
        </div>
        <div class="deck-telemetry-item">
          <span>风向风速:</span>
          <b>${(engine.level?.wind || 0) !== 0 ? (engine.level!.wind > 0 ? `→ ${engine.level!.wind}m/s` : `← ${Math.abs(engine.level!.wind)}m/s`) : '微风 0m/s'}</b>
        </div>
      </div>

      <!-- Arsenal Weapon Drawer -->
      <div class="deck-arsenal-section">
        <div class="deck-section-label">
          <span>战备武器库 (轻触选择弹种)</span>
          ${isSubAvailable ? `<span style="color:var(--accent-cyan)">可切换潜射</span>` : ''}
        </div>
        <div class="deck-weapon-grid">
          ${cardsHtml}
        </div>
      </div>

      <!-- Quick Tactical Actions Row (Strictly ABOVE launchpad to prevent accidental touches) -->
      ${
        isSubAvailable || engine.deployedDevices.length > 0 || abilityBtnHtml
          ? `<div class="deck-action-row">
              ${
                isSubAvailable
                  ? `<button class="deck-act-btn ${engine.useSub ? 'primary' : ''}" id="deck-btn-site">
                      ${engine.useSub ? `${ICONS.submarine('hud-icon-xs inline-icon')} 潜艇水下前出阵地` : `${ICONS.rocket('hud-icon-xs inline-icon')} 切换巨浪潜射阵地`}
                    </button>`
                  : ''
              }
              ${
                engine.deployedDevices.length > 0
                  ? `<button class="deck-act-btn primary" id="deck-btn-detonate">
                      ${ICONS.detonate('hud-icon-xs inline-icon')} 立即起爆已架设核装置 (${engine.deployedDevices.length})
                    </button>`
                  : ''
              }
              ${abilityBtnHtml}
            </div>`
          : ''
      }

      <!-- Touch Slingshot Aiming & Launch Pad (Placed at bottom-most edge for broad touch area) -->
      <div class="deck-launch-zone" id="deck-launch-pad">
        <div class="deck-pad-crosshair"></div>
        <div class="deck-pad-reticle"></div>
        <div class="deck-pad-knob" id="deck-pad-knob">${ICONS.rocket('deck-knob-svg')}</div>
        <div class="deck-pad-readout" id="deck-pad-readout">
          ${engine.isAiming ? '已捕获瞄准坐标' : '战术手势瞄准发射盘'}
        </div>
        <div class="deck-pad-hint">向左下方拖曳拉弓 · 松开即发射</div>
      </div>
    `;

    this.attachDeckEvents();
  }

  private attachEvents(): void {
    this.container.querySelectorAll('[data-warhead]').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        const type = (e.currentTarget as HTMLElement).getAttribute('data-warhead') as WarheadType;
        if (type) this.callbacks.onSelectWarhead(type);
      });
    });

    document.getElementById('btn-deploy')?.addEventListener('click', () => {
      this.callbacks.onToggleDeploy();
    });

    document.getElementById('btn-detonate')?.addEventListener('click', () => {
      this.callbacks.onDetonate();
    });

    document.getElementById('btn-site')?.addEventListener('click', () => {
      this.callbacks.onToggleSite();
    });

    document.getElementById('btn-restart')?.addEventListener('click', () => {
      this.callbacks.onRestart();
    });

    document.getElementById('btn-sound')?.addEventListener('click', () => {
      this.callbacks.onToggleSound();
    });

    document.getElementById('btn-fullscreen')?.addEventListener('click', () => {
      this.callbacks.onToggleFullscreen?.();
    });

    document.getElementById('btn-menu')?.addEventListener('click', () => {
      this.callbacks.onMenu();
    });

    document.getElementById('btn-ability-trigger')?.addEventListener('click', () => {
      this.callbacks.onTriggerInFlightAbility?.();
    });
  }

  private attachDeckEvents(): void {
    if (!this.deckContainer) return;

    this.deckContainer.querySelectorAll('[data-warhead]').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        const type = (e.currentTarget as HTMLElement).getAttribute('data-warhead') as WarheadType;
        if (type) this.callbacks.onSelectWarhead(type);
      });
    });

    document.getElementById('deck-btn-deploy')?.addEventListener('click', () => {
      this.callbacks.onToggleDeploy();
    });

    document.getElementById('deck-btn-detonate')?.addEventListener('click', () => {
      this.callbacks.onDetonate();
    });

    document.getElementById('deck-btn-site')?.addEventListener('click', () => {
      this.callbacks.onToggleSite();
    });

    document.getElementById('deck-btn-ability')?.addEventListener('click', () => {
      this.callbacks.onTriggerInFlightAbility?.();
    });

    const pad = document.getElementById('deck-launch-pad');
    const knob = document.getElementById('deck-pad-knob');
    const readout = document.getElementById('deck-pad-readout');

    if (pad) {
      const onPadDown = (e: PointerEvent) => {
        e.preventDefault();
        try {
          pad.setPointerCapture(e.pointerId);
        } catch {}
        this.isDeckDragging = true;
        this.deckTouchOrigin = { x: e.clientX, y: e.clientY };
        this.callbacks.onDeckAimStart?.(0, 0);
      };

      const onPadMove = (e: PointerEvent) => {
        if (!this.isDeckDragging || !this.deckTouchOrigin) return;
        e.preventDefault();
        const dx = e.clientX - this.deckTouchOrigin.x;
        const dy = e.clientY - this.deckTouchOrigin.y;

        if (knob) {
          const clampedX = Math.max(-56, Math.min(56, dx * 0.85));
          const clampedY = Math.max(-56, Math.min(56, dy * 0.85));
          knob.style.transform = `translate(${clampedX}px, ${clampedY}px)`;
        }

        if (readout) {
          const power = Math.min(100, Math.round(Math.hypot(dx, dy) * 1.05));
          const deg = Math.round(Math.atan2(-dy, Math.abs(dx || 1)) * (180 / Math.PI));
          readout.textContent = `仰角 ${deg}° · 力度 ${power}%`;
        }

        this.callbacks.onDeckAimMove?.(dx, dy);
      };

      const onPadUp = (e: PointerEvent) => {
        if (!this.isDeckDragging) return;
        this.isDeckDragging = false;
        this.deckTouchOrigin = null;

        if (knob) {
          knob.style.transform = 'translate(0, 0)';
        }
        if (readout) {
          readout.textContent = '战术手势瞄准发射盘';
        }

        try {
          if (pad.hasPointerCapture(e.pointerId)) {
            pad.releasePointerCapture(e.pointerId);
          }
        } catch {}

        this.callbacks.onDeckAimEnd?.();
      };

      pad.addEventListener('pointerdown', onPadDown);
      pad.addEventListener('pointermove', onPadMove);
      pad.addEventListener('pointerup', onPadUp);
      pad.addEventListener('pointercancel', onPadUp);
    }
  }
}
