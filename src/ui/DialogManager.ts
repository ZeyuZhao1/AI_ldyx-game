import { WARHEAD_CONFIGS } from '../data/gameConfig';
import { LevelDefinition, ResultState, WarheadType } from '../types/game';

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
      normal: '🚀',
      atomic: '☢',
      hydro: '⚛',
      bunker: '⚡',
      deploy: '📦',
    };

    let arsenalItemsHtml = '';
    for (const key of warheadOrder) {
      const count = level.warheads[key] || 0;
      if (count > 0) {
        const cfg = WARHEAD_CONFIGS[key];
        arsenalItemsHtml += `
          <div class="modal-arsenal-item">
            <span class="a-icon">${warheadIcons[key]}</span>
            <span class="a-name">${cfg.name}</span>
            <span class="a-count">×${count}枚</span>
            <span class="a-desc">${cfg.description}</span>
          </div>
        `;
      }
    }

    // Special perks summary
    const perks: string[] = [];
    if (unlockedScientists.includes('qian')) {
      perks.push('★ 【钱学森弹道】中途轻触屏幕激活高超音速滑翔增程');
    }
    if (hasAimScope || unlockedScientists.includes('sun') || unlockedScientists.includes('scope')) {
      perks.push('★ 【孙家栋雷达】瞄准镜已就位，发射前清晰预测完整飞行弹道');
    }
    if (unlockedScientists.includes('guo')) {
      perks.push('★ 【郭永怀数据护盾】首发若脱靶自动回收该枚弹药');
    }
    if (unlockedScientists.includes('sub') || level.biome === 'ocean') {
      perks.push('★ 【巨浪潜射阵地】潜艇水下前出，可向双向发射');
    }

    const perksHtml = perks.length > 0
      ? `<div class="modal-special-perk">${perks.join(' · ')}</div>`
      : '';

    const html = `
      <h2>${level.year} · ${level.name}</h2>
      <div class="level-intro-text">${level.intro}</div>

      <!-- Detailed Weapon Equipment Briefing -->
      <div class="modal-arsenal-box">
        <div class="modal-arsenal-title">【本关战备武器与装备配置】</div>
        <div class="modal-arsenal-list">
          ${arsenalItemsHtml}
        </div>
        ${perksHtml}
      </div>

      <div class="modal-buttons">
        <button class="mbtn" id="btn-modal-start">开始试验</button>
        <button class="mbtn ghost" id="btn-modal-back">返回关卡</button>
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
            <div class="sci-name">★ 功勋科学家归队：${result.newScientist.name} · ${result.newScientist.title}</div>
            <div class="quote">${result.newScientist.quote}</div>
            <div class="sci-desc">${result.newScientist.desc}</div>
          </div>
        `
            : ''
        }
        <div class="modal-buttons">
          ${
            result.hasNextLevel
              ? '<button class="mbtn" id="btn-modal-next">下一关</button>'
              : '<button class="mbtn" id="btn-modal-home">通关全篇 · 返回首页</button>'
          }
          <button class="mbtn ghost" id="btn-modal-home-ghost">首页</button>
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
            <div class="sci-name">★ 功勋科学家归队：${result.newScientist.name} · ${result.newScientist.title}</div>
            <div class="quote">${result.newScientist.quote}</div>
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
          <button class="mbtn ghost" id="btn-modal-home-ghost">首页</button>
        </div>
      `;
    } else if (result.outcome === 'lose') {
      content += `
        <h2 style="color:#f87171">试验未达到预期</h2>
        <p>弹药耗尽，仍有目标未被摧毁。<br>戈壁滩上，千锤百炼方得真功 —— 调整发射仰角与拉弓力度，再次试验！</p>
        <div class="modal-buttons">
          <button class="mbtn" id="btn-modal-retry">再试一次</button>
          <button class="mbtn ghost" id="btn-modal-home-ghost">返回首页</button>
        </div>
      `;
    } else if (result.outcome === 'endless_over') {
      content += `
        <h2 style="color:#eec278">无尽挑战演练结束</h2>
        <p>你坚持到了第 <b style="color:#eec278;font-size:18px">${result.endlessStats?.wave || 1}</b> 波，共摧毁核心 <b style="color:#eec278;font-size:18px">${result.endlessStats?.score || 0}</b> 处。<br>戈壁无言，星辰为证 —— 再发起一次战术冲击？</p>
        <div class="modal-buttons">
          <button class="mbtn" id="btn-modal-retry">再来一次</button>
          <button class="mbtn ghost" id="btn-modal-home-ghost">返回首页</button>
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
