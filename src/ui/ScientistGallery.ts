import { SCIENTISTS } from '../data/scientists';
import { ICONS } from './Icons';
import { renderScientistPortraitHtml } from './ScientistPortraits';

export class ScientistGallery {
  private static selectedScientistId: string = 'qian';

  public static render(
    container: HTMLElement,
    unlockedList: readonly string[],
    onBack: () => void,
    onViewCard?: (scientist: (typeof import('../data/scientists').SCIENTISTS)[number]) => void
  ): void {
    // Add helper class to parent overlay to enforce scroll-from-top on mobile
    container.classList.add('has-hof-view');

    const handleBack = () => {
      container.classList.remove('has-hof-view');
      onBack();
    };

    // If current selected is not unlocked, default to first unlocked or first available
    const unlockedFirst = SCIENTISTS.find((s) => unlockedList.includes(s.id));
    if (!unlockedList.includes(this.selectedScientistId) && unlockedFirst) {
      this.selectedScientistId = unlockedFirst.id;
    }

    const renderView = () => {
      const unlockedCount = SCIENTISTS.filter((s) => unlockedList.includes(s.id)).length;
      const totalCount = SCIENTISTS.length;
      const current = SCIENTISTS.find((s) => s.id === this.selectedScientistId) || SCIENTISTS[0];
      const isCurrentUnlocked = unlockedList.includes(current.id);

      // 1. Build Master Curated Roster List (Sidebar on desktop, horizontal scroller on mobile)
      let rosterItemsHtml = '';
      SCIENTISTS.forEach((sc, idx) => {
        const isUnlocked = unlockedList.includes(sc.id);
        const isSelected = sc.id === this.selectedScientistId;
        const indexStr = String(idx + 1).padStart(2, '0');

        rosterItemsHtml += `
          <button 
            type="button"
            class="hof-roster-item ${isSelected ? 'is-active' : ''} ${isUnlocked ? 'is-unlocked' : 'is-locked'}"
            data-sc-id="${sc.id}"
            aria-label="${sc.name} 功勋档案"
          >
            <div class="hof-item-index">${indexStr}</div>
            <div class="hof-item-avatar">
              ${
                isUnlocked
                  ? renderScientistPortraitHtml(sc.id, sc.name, { size: 'thumb' })
                  : `<div class="hof-avatar-locked">${ICONS.lock('hof-lock-mini')}</div>`
              }
            </div>
            <div class="hof-item-text">
              <div class="hof-item-name-row">
                <span class="hof-item-name">${isUnlocked ? sc.name : '隐姓埋名'}</span>
                ${
                  isUnlocked
                    ? `<span class="hof-item-badge">已归队</span>`
                    : `<span class="hof-item-badge locked">第${sc.after}关</span>`
                }
              </div>
              <div class="hof-item-title">${sc.title}</div>
            </div>
          </button>
        `;
      });

      // 2. Build Monument Showcase Stage (Desktop 2-column, Mobile split-header + tactical block)
      const stageHtml = `
        <div class="hof-stage-card ${isCurrentUnlocked ? 'unlocked-stage' : 'locked-stage'}">
          <!-- Main Hero Zone: Portrait Visual + Headline Summary & Quote -->
          <div class="hof-stage-hero-row">
            <div class="hof-stage-visual">
              <div class="hof-portrait-wrapper ${isCurrentUnlocked ? '' : 'is-classified'}">
                ${
                  isCurrentUnlocked
                    ? renderScientistPortraitHtml(current.id, current.name, { size: 'stage' })
                    : `
                      <div class="hof-classified-box">
                        ${ICONS.lock('hof-lock-huge')}
                        <span class="hof-classified-stamp">绝密档案</span>
                        <span class="hof-classified-hint">待攻坚试验解密</span>
                      </div>
                    `
                }
              </div>
              <div class="hof-seal-badge">
                ${ICONS.star('hof-star-svg')} 两弹一星功勋元勋
              </div>
            </div>

            <div class="hof-stage-lead-info">
              <div class="hof-header-cluster">
                <div class="hof-hero-name ${isCurrentUnlocked ? '' : 'locked-text'}">
                  ${isCurrentUnlocked ? current.name : '隐姓埋名 · 待解密'}
                </div>
                <div class="hof-hero-title">· ${current.title} ·</div>
                ${
                  isCurrentUnlocked
                    ? `<div class="hof-hero-state-ribbon">已荣膺归队 · 专属战术特权已激活</div>`
                    : `<div class="hof-lock-condition-tag">${ICONS.lock('hof-lock-inline')} 需攻克第 ${current.after} 关历史试验解密</div>`
                }
              </div>

              <div class="hof-quote-panel ${isCurrentUnlocked ? '' : 'locked-quote'}">
                <div class="hof-quote-text">
                  ${isCurrentUnlocked ? (current.quote.trim().startsWith('“') ? current.quote : `“${current.quote}”`) : '“干惊天动地事，做隐姓埋名人。”'}
                </div>
              </div>
            </div>
          </div>

          <!-- Tactical Capabilities & Historic Details -->
          <div class="hof-tactical-block ${isCurrentUnlocked ? '' : 'locked-block'}">
            <div class="hof-tactical-title">
              ${isCurrentUnlocked ? ICONS.rocket('hof-tac-icon') : ICONS.lock('hof-tac-icon')}
              ${isCurrentUnlocked ? `战术特权：${current.unlock}` : `待解密专属能力：${current.unlock}`}
            </div>
            <div class="hof-tactical-desc">
              ${
                isCurrentUnlocked
                  ? current.desc
                  : `攻克第 ${current.after} 关历史攻坚试验后解密档案，功勋元勋即刻归队并赋予专属发射架强化与战术支持。`
              }
            </div>
            ${
              isCurrentUnlocked && current.pow
                ? `<div class="hof-power-bonus">发射架倾力加成：最大力度 +${current.pow}</div>`
                : ''
            }
          </div>

          ${
            isCurrentUnlocked && onViewCard
              ? `
            <div class="hof-card-preview-action">
              <button type="button" class="mbtn secondary hof-inspect-btn" id="btn-hof-inspect-card">
                ${ICONS.star('gacha-star-icon')} 检阅功勋人物卡
              </button>
            </div>
          `
              : ''
          }
        </div>
      `;

      container.innerHTML = `
        <div id="viewSci" class="menu-view hof-view">
          <div class="hof-top-bar">
            <div class="hof-top-titles">
              <div class="hof-title-row">
                <h2 class="vtitle">功勋科学家名录</h2>
                <span class="hof-pill-counter">${unlockedCount} / ${totalCount} 位已归队</span>
              </div>
              <div class="hof-sub-counter">
                两弹一星功勋元勋纪念展馆 · 攻坚试验解密
              </div>
            </div>
            <button class="mbtn ghost hof-back-btn" id="btn-sci-back">返回主页</button>
          </div>

          <div class="hof-main-showcase">
            <!-- Master Curated Roster (Left sidebar on desktop / Top horizontal rail on mobile) -->
            <div class="hof-sidebar-roster">
              <div class="hof-sidebar-heading">元勋谱系目录</div>
              <div class="hof-roster-scroller" id="hof-roster-scroller">
                ${rosterItemsHtml}
              </div>
            </div>

            <!-- Detail Monument Stage -->
            <div class="hof-monument-stage">
              ${stageHtml}
            </div>
          </div>
        </div>
      `;

      // Attach event listeners
      document.getElementById('btn-sci-back')?.addEventListener('click', handleBack);

      document.getElementById('btn-hof-inspect-card')?.addEventListener('click', () => {
        onViewCard?.(current);
      });

      const rosterButtons = container.querySelectorAll<HTMLButtonElement>('.hof-roster-item');
      rosterButtons.forEach((btn) => {
        btn.addEventListener('click', () => {
          const scId = btn.getAttribute('data-sc-id');
          if (scId && scId !== this.selectedScientistId) {
            this.selectedScientistId = scId;
            renderView();

            // Auto-center active item on mobile horizontal rail
            window.requestAnimationFrame(() => {
              const activeBtn = container.querySelector<HTMLButtonElement>('.hof-roster-item.is-active');
              activeBtn?.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
            });
          }
        });
      });

      // Initial auto-scroll active item into view
      window.requestAnimationFrame(() => {
        const activeBtn = container.querySelector<HTMLButtonElement>('.hof-roster-item.is-active');
        activeBtn?.scrollIntoView({ behavior: 'auto', inline: 'center', block: 'nearest' });
      });
    };

    renderView();
  }
}
