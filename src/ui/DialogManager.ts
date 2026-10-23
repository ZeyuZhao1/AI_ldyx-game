import { WARHEAD_CONFIGS } from '../data/gameConfig';
import { LevelDefinition, ResultState, ScientistDefinition, WarheadType } from '../types/game';
import { ICONS } from './Icons';
import { renderScientistPortraitHtml } from './ScientistPortraits';

export class DialogManager {
  private container: HTMLElement;
  private toastElement: HTMLElement;
  private toastTimer: number | null = null;

  constructor(container: HTMLElement) {
    this.container = container;

    // Toast element
    const toast = document.createElement('div');
    toast.id = 'game-toast';
    toast.className = 'game-toast hidden';
    document.body.appendChild(toast);
    this.toastElement = toast;
  }

  public showToast(message: string): void {
    if (this.toastTimer) {
      window.clearTimeout(this.toastTimer);
    }
    this.toastElement.textContent = message;
    this.toastElement.classList.remove('hidden');
    this.toastElement.style.opacity = '1';

    this.toastTimer = window.setTimeout(() => {
      this.toastElement.style.opacity = '0';
      setTimeout(() => {
        this.toastElement.classList.add('hidden');
      }, 300);
    }, 2400);
  }

  public showModal(htmlContent: string): void {
    this.container.innerHTML = `<div class="modalBox">${htmlContent}</div>`;
    this.container.classList.remove('hidden');
  }

  public hideModal(): void {
    this.container.classList.add('hidden');
    this.container.innerHTML = '';
  }

  public showLevelIntro(
    level: LevelDefinition,
    hasAimScope: boolean,
    onStart: () => void,
    onBack: () => void,
    unlockedScientists: string[] = []
  ): void {
    const warheadOrder: WarheadType[] = ['normal', 'atomic', 'hydro', 'bunker', 'deploy'];
    const warheadIcons: Record<WarheadType, string> = {
      normal: ICONS.rocket('warhead-sym-svg'),
      atomic: ICONS.atomic('warhead-sym-svg'),
      hydro: ICONS.hydro('warhead-sym-svg'),
      bunker: ICONS.bunker('warhead-sym-svg'),
      deploy: ICONS.deploy('warhead-sym-svg'),
    };

    let arsenalBadgesHtml = '';
    for (const key of warheadOrder) {
      const count = level.warheads[key] || 0;
      if (count > 0) {
        const cfg = WARHEAD_CONFIGS[key];
        arsenalBadgesHtml += `
          <span class="intro-ammo-chip" title="${cfg.description}">
            <span class="chip-sym">${warheadIcons[key]}</span>
            <span class="chip-name">${cfg.name}</span>
            <span class="chip-count">×${count}</span>
          </span>
        `;
      }
    }

    // Special perks summary (concise vector icons)
    const perks: string[] = [];
    if (unlockedScientists.includes('qian')) {
      perks.push(`${ICONS.glide('hud-icon-xs inline-icon')} 钱学森弹道 (飞行中轻触滑翔)`);
    }
    if (hasAimScope || unlockedScientists.includes('sun') || unlockedScientists.includes('scope')) {
      perks.push(`${ICONS.radar('hud-icon-xs inline-icon')} 孙家栋雷达 (预测瞄准线)`);
    }
    if (unlockedScientists.includes('guo')) {
      perks.push(`${ICONS.shield('hud-icon-xs inline-icon')} 郭永怀护盾 (首发脱靶回收)`);
    }
    if (unlockedScientists.includes('sub') || level.biome === 'ocean') {
      perks.push(`${ICONS.submarine('hud-icon-xs inline-icon')} 潜射阵地 (可切换潜艇水下发射)`);
    }

    const perksHtml = perks.length > 0
      ? `<div class="intro-perks-row">${perks.join(' · ')}</div>`
      : '';

    const html = `
      <h2>${level.year} · ${level.name}</h2>
      <div class="level-intro-brief">${level.intro}</div>

      <div class="intro-tactical-shelf">
        <div class="intro-shelf-label">【本关弹药配置】</div>
        <div class="intro-chips-wrap">
          ${arsenalBadgesHtml}
        </div>
        ${perksHtml}
      </div>

      <div class="modal-buttons">
        <button class="mbtn" id="btn-modal-start">开始试验</button>
        <button class="mbtn ghost" id="btn-modal-back">返回</button>
      </div>
    `;

    this.showModal(html);

    document.getElementById('btn-modal-start')?.addEventListener('click', () => {
      this.hideModal();
      onStart();
    });
    document.getElementById('btn-modal-back')?.addEventListener('click', () => {
      this.hideModal();
      onBack();
    });
  }

  /**
   * Collectible Character Card Unlock Modal (集卡抽卡式功勋人物卡)
   * Displays realistic portrait with spinner, patriotic quote, unlocked capabilities, and smooth fade-out "归队" button
   */
  public showScientistUnlockCard(
    scientist: ScientistDefinition,
    onDismiss: () => void,
    options?: {
      fact?: string;
      levelNumber?: number;
      continueHint?: string;
      onHome?: () => void;
    }
  ): void {
    const portraitHtml = renderScientistPortraitHtml(scientist.id, scientist.name, { size: 'card' });
    const factHtml = options?.fact ? `<div class="gacha-level-fact">“${options.fact}”</div>` : '';
    const homeBtnHtml = options?.onHome
      ? `<button class="mbtn ghost btn-return-home" id="btn-sci-home">返回主页</button>`
      : '';
    const hintText = options?.continueHint || '点击【归队】即刻继续下一攻坚阶段';

    const html = `
      <div class="gacha-card-wrapper" id="gacha-card-wrap">
        <div class="gacha-glory-header">
          <div class="gacha-glory-tag">${ICONS.star('gacha-star-icon')} 共和国两弹一星功勋元勋 ${ICONS.star('gacha-star-icon')}</div>
          <h2 class="gacha-glory-title">功勋科学家荣耀归队</h2>
          ${factHtml}
        </div>

        <div class="gacha-card-entity">
          <div class="gacha-portrait-frame">
            ${portraitHtml}
            <div class="gacha-portrait-glow"></div>
          </div>

          <div class="gacha-info-panel">
            <div class="gacha-name-group">
              <span class="gacha-name">${scientist.name}</span>
              <span class="gacha-title-badge">${scientist.title}</span>
            </div>

            <div class="gacha-quote-bubble">
              ${scientist.quote.trim().startsWith('“') ? scientist.quote : `“${scientist.quote}”`}
            </div>

            <div class="gacha-tactical-block">
              <div class="gacha-tactical-badge">
                ${ICONS.rocket('gacha-tac-icon')} 解锁战术能力：${scientist.unlock}
              </div>
              <div class="gacha-tactical-desc">
                ${scientist.desc}
              </div>
              ${scientist.pow ? `<div class="gacha-power-badge">发射架倾力加成：最大力度 +${scientist.pow}</div>` : ''}
            </div>
          </div>
        </div>

        <div class="gacha-actions-row">
          <button class="mbtn primary btn-return-team" id="btn-sci-return">
            归队
          </button>
          ${homeBtnHtml}
        </div>
        <div class="gacha-return-hint">${hintText}</div>
      </div>
    `;

    this.showModal(html);

    const btnReturn = document.getElementById('btn-sci-return');
    const btnHome = document.getElementById('btn-sci-home');
    const wrap = document.getElementById('gacha-card-wrap');

    btnReturn?.focus();

    btnReturn?.addEventListener('click', () => {
      wrap?.classList.add('fade-out-scale');
      window.setTimeout(() => {
        this.hideModal();
        onDismiss();
      }, 320);
    });

    btnHome?.addEventListener('click', () => {
      wrap?.classList.add('fade-out-scale');
      window.setTimeout(() => {
        this.hideModal();
        options?.onHome?.();
      }, 320);
    });
  }

  public showResult(
    result: ResultState,
    onNext: () => void,
    onRetry: () => void,
    onHome: () => void
  ): void {
    let content = '';

    if (result.outcome === 'win') {
      content += `
        <h2 style="color:#eec278">试验成功！</h2>
        ${result.fact ? `<div class="quote">“${result.fact}”</div>` : ''}
        ${result.milestone ? `<div class="milestone-box">${result.milestone}</div>` : ''}
        ${
          result.newScientist
            ? `
          <div class="scientist-unlock-box">
            <div class="sci-name">${ICONS.star('sci-star-icon')} 功勋科学家归队：${result.newScientist.name} · ${result.newScientist.title}</div>
            <div class="quote">${result.newScientist.quote.trim().startsWith('“') ? result.newScientist.quote : `“${result.newScientist.quote}”`}</div>
            <div class="sci-desc">${result.newScientist.desc}</div>
          </div>
        `
            : ''
        }
        <div class="modal-buttons">
          ${
            result.hasNextLevel
              ? '<button class="mbtn" id="btn-modal-next">下一关</button><button class="mbtn ghost" id="btn-modal-home-ghost">返回主页</button>'
              : '<button class="mbtn" id="btn-modal-home">通关全篇 · 返回主页</button>'
          }
        </div>
      `;
    } else if (result.outcome === 'orbit_win') {
      content += `
        <h2 style="color:#38bdf8">卫星成功入轨！</h2>
        ${result.fact ? `<div class="quote">“${result.fact}”</div>` : ''}
        ${
          result.newScientist
            ? `
          <div class="scientist-unlock-box">
            <div class="sci-name">${ICONS.star('sci-star-icon')} 功勋科学家归队：${result.newScientist.name} · ${result.newScientist.title}</div>
            <div class="quote">${result.newScientist.quote.trim().startsWith('“') ? result.newScientist.quote : `“${result.newScientist.quote}”`}</div>
            <div class="sci-desc">${result.newScientist.desc}</div>
          </div>
        `
            : ''
        }
        <div class="spirit-box">
          <p class="spirit-text">热爱祖国、无私奉献，自力更生、艰苦奋斗，大力协同、勇于登攀。</p>
          <p class="spirit-sub">—— “两弹一星”精神，星辰为证 ——</p>
        </div>
        <div class="modal-buttons">
          <button class="mbtn" id="btn-modal-next">下一关</button>
          <button class="mbtn ghost" id="btn-modal-home-ghost">返回主页</button>
        </div>
      `;
    } else if (result.outcome === 'lose') {
      content += `
        <h2 style="color:#f87171">试验未达到预期</h2>
        <p>弹药耗尽，仍有目标未被摧毁。<br>戈壁滩上，千锤百炼方得真功 —— 调整发射仰角与拉弓力度，再次试验！</p>
        <div class="modal-buttons">
          <button class="mbtn" id="btn-modal-retry">再试一次</button>
          <button class="mbtn ghost" id="btn-modal-home-ghost">返回主页</button>
        </div>
      `;
    } else if (result.outcome === 'endless_over') {
      content += `
        <h2 style="color:#eec278">无尽挑战演练结束</h2>
        <p>你坚持到了第 <b style="color:#eec278;font-size:18px">${result.endlessStats?.wave || 1}</b> 波，共摧毁核心 <b style="color:#eec278;font-size:18px">${result.endlessStats?.score || 0}</b> 处。<br>戈壁无言，星辰为证 —— 再发起一次战术冲击？</p>
        <div class="modal-buttons">
          <button class="mbtn" id="btn-modal-retry">再来一次</button>
          <button class="mbtn ghost" id="btn-modal-home-ghost">返回主页</button>
        </div>
      `;
    }

    this.showModal(content);

    document.getElementById('btn-modal-next')?.addEventListener('click', () => {
      this.hideModal();
      onNext();
    });
    document.getElementById('btn-modal-retry')?.addEventListener('click', () => {
      this.hideModal();
      onRetry();
    });
    document.getElementById('btn-modal-home')?.addEventListener('click', () => {
      this.hideModal();
      onHome();
    });
    document.getElementById('btn-modal-home-ghost')?.addEventListener('click', () => {
      this.hideModal();
      onHome();
    });
  }
}
