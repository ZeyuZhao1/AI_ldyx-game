export interface MainMenuCallbacks {
  onStartCareer: () => void;
  onOpenPresentation: () => void;
  onOpenScientists: () => void;
  onOpenSettings: () => void;
  onStartEndless?: () => void;
}

export class MainMenu {
  public static render(
    container: HTMLElement,
    callbacks: MainMenuCallbacks,
    isEndlessUnlocked: boolean
  ): void {
    // Magnificent Commemorative Aerospace Insignia (Two Bombs, One Satellite Seal)
    const insigniaSvg = `
      <svg viewBox="0 0 120 120" class="menu-insignia" aria-hidden="true">
        <defs>
          <radialGradient id="sealGlow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stop-color="#f0c869" stop-opacity="0.25"/>
            <stop offset="100%" stop-color="#d4a359" stop-opacity="0"/>
          </radialGradient>
          <linearGradient id="goldGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="#fff0c2"/>
            <stop offset="50%" stop-color="#eec278"/>
            <stop offset="100%" stop-color="#b88636"/>
          </linearGradient>
          <linearGradient id="rocketGrad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stop-color="#ffffff"/>
            <stop offset="50%" stop-color="#d1d5db"/>
            <stop offset="100%" stop-color="#9ca3af"/>
          </linearGradient>
        </defs>

        <!-- Outer Atmospheric Orbit Rings -->
        <circle cx="60" cy="60" r="54" fill="url(#sealGlow)"/>
        <circle cx="60" cy="60" r="52" fill="none" stroke="rgba(212, 163, 89, 0.28)" stroke-width="1.5" stroke-dasharray="3 3"/>
        <circle cx="60" cy="60" r="46" fill="none" stroke="url(#goldGradient)" stroke-width="1.5"/>

        <!-- Orbit Ellipses (Dongfanghong 1 & Atomic Electrons) -->
        <ellipse cx="60" cy="60" rx="42" ry="16" fill="none" stroke="rgba(56, 189, 248, 0.45)" stroke-width="1.2" transform="rotate(-28 60 60)"/>
        <ellipse cx="60" cy="60" rx="42" ry="16" fill="none" stroke="rgba(212, 163, 89, 0.4)" stroke-width="1.2" transform="rotate(28 60 60)"/>

        <!-- Orbiting Satellite Dot -->
        <circle cx="94" cy="44" r="3" fill="#eec278"/>
        <circle cx="94" cy="44" r="6" fill="none" stroke="#eec278" stroke-width="0.8" opacity="0.6"/>

        <!-- Central Red Starburst Shield -->
        <polygon points="60,25 68,48 92,48 72,62 80,85 60,71 40,85 48,62 28,48 52,48" fill="rgba(158, 42, 43, 0.85)" stroke="url(#goldGradient)" stroke-width="1.2"/>

        <!-- Soaring Rocket Vector -->
        <path d="M60 22 C61.5 32 63.5 45 64 62 L56 62 C56.5 45 58.5 32 60 22 Z" fill="url(#rocketGrad)"/>
        <!-- Rocket Fins -->
        <path d="M56 55 L50 64 L56 62 Z" fill="#9e2a2b"/>
        <path d="M64 55 L70 64 L64 62 Z" fill="#9e2a2b"/>
        <!-- Rocket Flame -->
        <polygon points="60,63 58,74 60,71 62,74" fill="#f59e0b"/>
        <polygon points="60,63 59,69 60,67 61,69" fill="#ef4444"/>

        <!-- Atomic Core Nucleus -->
        <circle cx="60" cy="52" r="2.5" fill="#fef08a"/>
      </svg>
    `;

    container.innerHTML = `
      <div id="viewHome" class="menu-view home-layout-grid">
        <!-- Left Brand & Chronicle Section -->
        <div class="home-brand-col">
          <div class="home-hero-card">
            <img src="/assets/images/hero_aerospace.png" alt="两弹一星国防航天" class="home-hero-banner-img" />
            <div class="home-hero-badge-overlay">
              <div class="home-insignia-wrapper">
                ${insigniaSvg}
              </div>
              <div class="home-title-group">
                <h1 class="main-title">两弹一星</h1>
                <div class="sub">国防科技功勋研学汇报</div>
              </div>
            </div>
          </div>

          <!-- Chronicle Statistics Strip -->
          <div class="home-stats-strip">
            <div class="home-stat-item">
              <span class="stat-num">1960–1982</span>
              <span class="stat-lbl">历史跨度</span>
            </div>
            <span class="stat-divider">·</span>
            <div class="home-stat-item">
              <span class="stat-num">16 项</span>
              <span class="stat-lbl">攻坚试验</span>
            </div>
            <span class="stat-divider">·</span>
            <div class="home-stat-item">
              <span class="stat-num">9 位</span>
              <span class="stat-lbl">功勋元勋</span>
            </div>
          </div>

          <!-- Historic Quote Box -->
          <div class="home-quote-card">
            <div class="quote-text">“干惊天动地事，做隐姓埋名人”</div>
            <div class="quote-sub">—— 谨以此向把青春与热血铸入祖国钢铁长城的功勋元勋致敬</div>
          </div>
        </div>

        <!-- Right Mode Select Buttons -->
        <div id="homeBtns">
          <button class="hbtn primary menu-action-card" id="btn-play">
            <div class="card-btn-icon">🚀</div>
            <div class="card-btn-text">
              <div class="card-btn-title">历史攻关长卷</div>
              <div class="card-btn-desc">1960–1982 研学时间轴</div>
            </div>
          </button>

          <button class="hbtn pres-btn menu-action-card" id="btn-pres">
            <div class="card-btn-icon">🎓</div>
            <div class="card-btn-text">
              <div class="card-btn-title">思政汇报演示</div>
              <div class="card-btn-desc">课堂演讲自由推演</div>
            </div>
          </button>

          ${
            isEndlessUnlocked
              ? `<button class="hbtn endless-btn menu-action-card" id="btn-endless">
                  <div class="card-btn-icon">∞</div>
                  <div class="card-btn-text">
                    <div class="card-btn-title">无尽战略演习</div>
                    <div class="card-btn-desc">极限制导防御挑战</div>
                  </div>
                </button>`
              : ''
          }

          <button class="hbtn menu-action-card" id="btn-sci">
            <div class="card-btn-icon">★</div>
            <div class="card-btn-text">
              <div class="card-btn-title">功勋科学家名录</div>
              <div class="card-btn-desc">钱学森·邓稼先·于敏...</div>
            </div>
          </button>

          <button class="hbtn menu-action-card" id="btn-set">
            <div class="card-btn-icon">⚙</div>
            <div class="card-btn-text">
              <div class="card-btn-title">系统参数设置</div>
              <div class="card-btn-desc">音效与显示调节</div>
            </div>
          </button>
        </div>
      </div>
    `;

    document.getElementById('btn-play')?.addEventListener('click', callbacks.onStartCareer);
    document.getElementById('btn-pres')?.addEventListener('click', callbacks.onOpenPresentation);
    document.getElementById('btn-endless')?.addEventListener('click', () => {
      callbacks.onStartEndless?.();
    });
    document.getElementById('btn-sci')?.addEventListener('click', callbacks.onOpenScientists);
    document.getElementById('btn-set')?.addEventListener('click', callbacks.onOpenSettings);
  }
}
