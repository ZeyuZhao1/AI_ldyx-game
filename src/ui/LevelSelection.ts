import { LEVELS } from '../data/levels';
import { ICONS } from './Icons';

export interface LevelSelectionCallbacks {
  onSelectLevel: (index: number) => void;
  onStartEndless: () => void;
  onBack: () => void;
}

const MILESTONE_SHORT_TAGS = [
  '近程地地导弹',
  '浓缩铀提纯突破',
  '中程弹道导弹',
  '首颗原子弹爆炸',
  '两弹结合实弹发射',
  '首颗全当量氢弹',
  '地下平洞核试验',
  '首颗人造地球卫星',
  '返回式卫星回收',
  '洲际导弹全射程',
  '一箭三星空间试验',
  '巨浪一号水下潜射',
];

export class LevelSelection {
  private static scrollListener: (() => void) | null = null;
  private static resizeListener: (() => void) | null = null;

  public static render(
    container: HTMLElement,
    progress: number,
    callbacks: LevelSelectionCallbacks
  ): void {
    // Clean up any previous listeners
    if (LevelSelection.scrollListener) {
      window.removeEventListener('scroll', LevelSelection.scrollListener);
    }
    if (LevelSelection.resizeListener) {
      window.removeEventListener('resize', LevelSelection.resizeListener);
    }

    let nodesHtml = '';

    // Render 12 Milestones
    LEVELS.forEach((lvl, i) => {
      const isLocked = i > progress;
      const isDone = i < progress;
      const isCurrent = i === progress;
      const shortTag = MILESTONE_SHORT_TAGS[i] || '国防攻坚阶段';

      const stateClass = isLocked ? 'locked' : isDone ? 'done' : 'current';
      const vectorGraphic = LevelSelection.getMilestoneSvg(i, lvl.name);

      nodesHtml += `
        <div class="timeline-card-node ${stateClass} ${isCurrent ? 'is-center' : ''}" data-index="${i}">
          <!-- Timeline Chrono Pin Node on the Axis -->
          <div class="node-chrono-pin">
            <div class="pin-dot"></div>
            <div class="pin-year">${lvl.year}</div>
          </div>

          <!-- Spring-Elastic Art Card (Bouncy Q-弹 Center Focus) -->
          <div class="node-art-card">
            <div class="node-img-box">
              <img 
                src="/assets/images/milestone_${i}.png" 
                alt="${lvl.name}" 
                class="node-bitmap-img" 
                loading="lazy"
                onerror="this.style.display='none';var fb=this.nextElementSibling;if(fb)fb.style.display='flex';"
              />
              <div class="node-art-fallback" style="display:none">
                ${vectorGraphic}
              </div>
              <div class="node-img-overlay"></div>
              ${isLocked ? `<div class="lock-shield"><span class="lock-icon">${ICONS.lock('lock-icon-svg')}</span></div>` : ''}
            </div>

            <!-- Concise Metadata (Zero Clutter) -->
            <div class="node-meta-body">
              <div class="node-year-label">${lvl.year}</div>
              <h3 class="node-title">${isLocked ? '绝密档案' : lvl.name}</h3>
              <div class="node-sub-tag">${isLocked ? '攻克前续关卡解锁' : shortTag}</div>
            </div>

            <!-- Direct Launch Button -->
            <div class="node-btn-wrap">
              ${
                isLocked
                  ? '<button class="node-action-btn locked" disabled>待解锁</button>'
                  : `<button class="node-action-btn ${isDone ? 'done' : 'primary'}">
                      ${isDone ? '再次试验' : '发射试验'} →
                    </button>`
              }
            </div>
          </div>
        </div>
      `;
    });

    // Endless Mode Milestone (if unlocked)
    if (progress >= LEVELS.length) {
      nodesHtml += `
        <div class="timeline-card-node current endless-node" data-index="endless">
          <div class="node-chrono-pin">
            <div class="pin-dot" style="background:#10b981;box-shadow:0 0 10px #10b981;"></div>
            <div class="pin-year" style="color:#6ee7b7;">1982+</div>
          </div>

          <div class="node-art-card endless-art-card">
            <div class="node-img-box">
              ${LevelSelection.getEndlessSvg()}
              <div class="node-img-overlay"></div>
            </div>

            <div class="node-meta-body">
              <div class="node-year-label" style="color:#6ee7b7;">1982+</div>
              <h3 class="node-title" style="color:#a7f3d0;">无尽战略演习</h3>
              <div class="node-sub-tag" style="color:#6ee7b7;">极限制导·连续阻击</div>
            </div>

            <div class="node-btn-wrap">
              <button class="node-action-btn endless-btn">开始演练 →</button>
            </div>
          </div>
        </div>
      `;
    }

    container.innerHTML = `
      <div id="viewLevels" class="timeline-voyage-container">
        <!-- Minimalist Top Navigation Header -->
        <header class="timeline-voyage-header">
          <div class="timeline-title-wrap">
            <h2 class="voyage-title">共和国国防长卷</h2>
            <span class="voyage-date-range">1960 — 1982 历史突破时间轴</span>
          </div>

          <button class="mbtn ghost voyage-back-btn" id="btn-levels-back">返回主页</button>
        </header>

        <!-- Continuous Timeline Track with Elastic Snap Carousel -->
        <div class="timeline-carousel-wrap">
          <!-- Continuous Glowing Timeline Axis Line -->
          <div class="timeline-continuous-axis"></div>

          <!-- Carousel Quick Sliding Navigation Arrows -->
          <button class="carousel-arrow arrow-left" id="btn-carousel-prev" aria-label="上一关">‹</button>
          <button class="carousel-arrow arrow-right" id="btn-carousel-next" aria-label="下一关">›</button>

          <!-- Horizontal Smooth Snap Carousel Stream -->
          <div class="timeline-carousel-stream" id="timeline-stream">
            ${nodesHtml}
          </div>
        </div>

        <!-- Bottom Minimal Status Indicator -->
        <footer class="timeline-voyage-footer">
          <div class="timeline-track-indicator">
            <span class="indicator-cur-year" id="indicator-year">1960.11</span>
            <span class="indicator-divider">·</span>
            <span class="indicator-cur-name" id="indicator-name">东风一号</span>
            <span class="indicator-counter" id="indicator-counter">1 / ${LEVELS.length}</span>
          </div>
          <div class="timeline-swipe-hint">左右滑动时间轴探索历史关卡</div>
        </footer>
      </div>
    `;

    const stream = document.getElementById('timeline-stream') as HTMLElement | null;
    if (!stream) return;

    // Helper: update which card is currently in the center of the viewport
    const updateCenterCard = () => {
      if (!stream) return;
      const streamRect = stream.getBoundingClientRect();
      const centerX = streamRect.left + streamRect.width / 2;

      const nodes = Array.from(stream.querySelectorAll<HTMLElement>('.timeline-card-node'));
      let closestNode: HTMLElement | null = null;
      let closestDist = Infinity;

      nodes.forEach((node) => {
        const rect = node.getBoundingClientRect();
        const nodeCenterX = rect.left + rect.width / 2;
        const dist = Math.abs(centerX - nodeCenterX);
        if (dist < closestDist) {
          closestDist = dist;
          closestNode = node;
        }
      });

      if (closestNode) {
        nodes.forEach((n) => n.classList.remove('is-center'));
        (closestNode as HTMLElement).classList.add('is-center');

        const idxAttr = (closestNode as HTMLElement).getAttribute('data-index');
        const yearEl = document.getElementById('indicator-year');
        const nameEl = document.getElementById('indicator-name');
        const counterEl = document.getElementById('indicator-counter');

        if (idxAttr === 'endless') {
          if (yearEl) yearEl.textContent = '1982+';
          if (nameEl) nameEl.textContent = '无尽战略演习';
          if (counterEl) counterEl.textContent = '∞';
        } else {
          const idx = parseInt(idxAttr || '0', 10);
          const lvl = LEVELS[idx];
          if (lvl) {
            if (yearEl) yearEl.textContent = lvl.year;
            if (nameEl) nameEl.textContent = idx > progress ? '绝密档案' : lvl.name;
            if (counterEl) counterEl.textContent = `${idx + 1} / ${LEVELS.length}`;
          }
        }
      }
    };

    let scrollTicking = false;
    const onScroll = () => {
      if (!scrollTicking) {
        requestAnimationFrame(() => {
          updateCenterCard();
          scrollTicking = false;
        });
        scrollTicking = true;
      }
    };

    stream.addEventListener('scroll', onScroll, { passive: true });
    LevelSelection.scrollListener = onScroll;

    // Arrow navigation
    document.getElementById('btn-carousel-prev')?.addEventListener('click', () => {
      stream.scrollBy({ left: -260, behavior: 'smooth' });
    });

    document.getElementById('btn-carousel-next')?.addEventListener('click', () => {
      stream.scrollBy({ left: 260, behavior: 'smooth' });
    });

    // Card click: if not center, scroll to center; if center and unlocked, launch!
    stream.querySelectorAll<HTMLElement>('.timeline-card-node').forEach((node) => {
      node.addEventListener('click', (e) => {
        const isCenter = node.classList.contains('is-center');
        const idxAttr = node.getAttribute('data-index');

        if (!isCenter) {
          e.preventDefault();
          node.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
          return;
        }

        // Click on center card action
        if (idxAttr === 'endless') {
          callbacks.onStartEndless();
        } else {
          const idx = parseInt(idxAttr || '0', 10);
          if (idx <= progress) {
            callbacks.onSelectLevel(idx);
          }
        }
      });
    });

    document.getElementById('btn-levels-back')?.addEventListener('click', callbacks.onBack);

    // Initial positioning: scroll smoothly to player's current progression level
    const targetIdx = Math.min(progress, LEVELS.length - 1);
    const initialTargetNode = stream.querySelector<HTMLElement>(`[data-index="${targetIdx}"]`);

    const centerInitial = () => {
      if (initialTargetNode) {
        initialTargetNode.scrollIntoView({ behavior: 'auto', inline: 'center', block: 'nearest' });
        updateCenterCard();
      }
    };

    requestAnimationFrame(() => {
      centerInitial();
      setTimeout(centerInitial, 60);
      setTimeout(centerInitial, 200);
    });
  }

  /**
   * Generates authentic SVG badges as reliable fallback for historical milestones
   */
  private static getMilestoneSvg(index: number, name: string): string {
    const isSpecial = [3, 4, 5, 7, 11].includes(index);
    const borderColor = isSpecial ? '#d4a359' : '#3c4b66';

    switch (index) {
      case 0:
        return `
          <svg viewBox="0 0 100 80" class="milestone-svg">
            <rect width="100" height="80" fill="#141a24" rx="8" stroke="${borderColor}" stroke-width="1"/>
            <path d="M0 65 Q 40 50, 100 65 L 100 80 L 0 80 Z" fill="#2d2218"/>
            <rect x="25" y="32" width="6" height="36" fill="#4b5563"/>
            <line x1="28" y1="36" x2="38" y2="44" stroke="#d4a359" stroke-width="1.5"/>
            <path d="M42 20 C 43 28, 44 45, 45 64 L 39 64 C 40 45, 41 28, 42 20 Z" fill="#e5e7eb"/>
            <polygon points="39,58 35,66 39,64" fill="#dc2626"/>
            <polygon points="45,58 49,66 45,64" fill="#dc2626"/>
            <polygon points="42,65 40,75 42,71 44,75" fill="#f59e0b"/>
            <circle cx="75" cy="18" r="1.5" fill="#eec278"/>
          </svg>
        `;

      case 3:
        return `
          <svg viewBox="0 0 100 80" class="milestone-svg">
            <rect width="100" height="80" fill="#181313" rx="8" stroke="#d4a359" stroke-width="1.5"/>
            <circle cx="50" cy="30" r="18" fill="rgba(239, 68, 68, 0.45)"/>
            <circle cx="50" cy="30" r="12" fill="rgba(245, 158, 11, 0.8)"/>
            <circle cx="50" cy="30" r="6" fill="#fff"/>
            <ellipse cx="50" cy="38" rx="28" ry="7" fill="none" stroke="#eec278" stroke-width="1.2"/>
          </svg>
        `;

      case 5:
        return `
          <svg viewBox="0 0 100 80" class="milestone-svg">
            <rect width="100" height="80" fill="#1b1220" rx="8" stroke="#d4a359" stroke-width="1.5"/>
            <circle cx="50" cy="36" r="22" fill="rgba(236, 72, 153, 0.3)"/>
            <circle cx="50" cy="36" r="14" fill="rgba(245, 158, 11, 0.8)"/>
            <circle cx="50" cy="36" r="7" fill="#fff"/>
          </svg>
        `;

      case 7:
        return `
          <svg viewBox="0 0 100 80" class="milestone-svg">
            <rect width="100" height="80" fill="#091224" rx="8" stroke="#d4a359" stroke-width="1.5"/>
            <path d="M0 80 Q 50 55, 100 80 Z" fill="#1e3a8a"/>
            <circle cx="50" cy="34" r="11" fill="#eec278" stroke="#d4a359" stroke-width="1"/>
            <line x1="42" y1="26" x2="22" y2="12" stroke="#eec278" stroke-width="1.5"/>
            <line x1="58" y1="26" x2="78" y2="12" stroke="#eec278" stroke-width="1.5"/>
          </svg>
        `;

      case 11:
        return `
          <svg viewBox="0 0 100 80" class="milestone-svg">
            <rect width="100" height="80" fill="#0c1828" rx="8" stroke="#d4a359" stroke-width="1.5"/>
            <path d="M0 50 Q 25 46, 50 50 T 100 50 L 100 80 L 0 80 Z" fill="#0f2942"/>
            <path d="M60 18 C 61 24, 62 38, 62 48 L 56 48 C 56 38, 57 24, 58 18 Z" fill="#e5e7eb"/>
            <path d="M50 52 Q 59 36, 68 52 Z" fill="rgba(255, 255, 255, 0.4)"/>
          </svg>
        `;

      default:
        return `
          <svg viewBox="0 0 100 80" class="milestone-svg">
            <rect width="100" height="80" fill="#141a24" rx="8" stroke="${borderColor}" stroke-width="1"/>
            <circle cx="50" cy="36" r="16" fill="rgba(212, 163, 89, 0.15)"/>
            <polygon points="50,26 53,33 60,34 55,39 56,46 50,42 44,46 45,39 40,34 47,33" fill="#eec278"/>
            <text x="50" y="66" font-size="9" fill="#9aa2b4" text-anchor="middle">${name}</text>
          </svg>
        `;
    }
  }

  private static getEndlessSvg(): string {
    return `
      <svg viewBox="0 0 100 80" class="milestone-svg">
        <rect width="100" height="80" fill="#0d2117" rx="8" stroke="#10b981" stroke-width="1.5"/>
        <text x="50" y="45" font-size="30" fill="#6ee7b7" text-anchor="middle" font-weight="bold">∞</text>
        <text x="50" y="68" font-size="9" fill="#6ee7b7" text-anchor="middle">无尽极限制导</text>
      </svg>
    `;
  }
}
