export interface SettingsCallbacks {
  onToggleSound: () => boolean;
  onToggleReducedMotion: () => boolean;
  onResetData: () => void;
  onBack: () => void;
}

export class SettingsMenu {
  public static render(
    container: HTMLElement,
    soundEnabled: boolean,
    reducedMotion: boolean,
    callbacks: SettingsCallbacks
  ): void {
    container.innerHTML = `
      <div id="viewSet" class="menu-view">
        <div class="vtitle">游戏设置</div>

        <div class="settings-card">
          <div class="setting-item">
            <span class="setting-title">游戏音效合成</span>
            <button class="wbtn" id="btn-toggle-sound">${soundEnabled ? '已开启' : '已静音'}</button>
          </div>

          <div class="setting-item">
            <span class="setting-title">减弱动态效果 (无屏幕震颤)</span>
            <button class="wbtn" id="btn-toggle-motion">${reducedMotion ? '已减弱' : '标准效果'}</button>
          </div>

          <hr style="border:none;border-top:1px solid #2d3860;margin:16px 0;" />

          <div id="reset-confirm-box">
            <button class="hbtn danger" id="btn-reset-data">重置游戏存档数据</button>
            <div class="tip" style="margin-top:8px;">将清空闯关进度与已归队的科学家，不可恢复</div>
          </div>
        </div>

        <div class="tip" style="margin-top:16px;">两弹一星研学工程 · 现代化重构版 v2.0 (TypeScript + Canvas 2D)</div>
        <button class="mbtn ghost backBtn" id="btn-settings-back">返回首页</button>
      </div>
    `;

    document.getElementById('btn-toggle-sound')?.addEventListener('click', (e) => {
      const now = callbacks.onToggleSound();
      (e.currentTarget as HTMLElement).textContent = now ? '已开启' : '已静音';
    });

    document.getElementById('btn-toggle-motion')?.addEventListener('click', (e) => {
      const now = callbacks.onToggleReducedMotion();
      (e.currentTarget as HTMLElement).textContent = now ? '已减弱' : '标准效果';
    });

    document.getElementById('btn-reset-data')?.addEventListener('click', () => {
      const box = document.getElementById('reset-confirm-box');
      if (!box) return;
      box.innerHTML = `
        <div style="color:#ff9b9b;font-size:14px;margin-bottom:8px;">确定要清除所有进度吗？此操作无法撤销！</div>
        <div style="display:flex;gap:10px;justify-content:center;">
          <button class="mbtn" id="btn-do-reset" style="background:#8a2b2b;">确认重置</button>
          <button class="mbtn ghost" id="btn-cancel-reset">取消</button>
        </div>
      `;

      document.getElementById('btn-do-reset')?.addEventListener('click', () => {
        callbacks.onResetData();
      });

      document.getElementById('btn-cancel-reset')?.addEventListener('click', () => {
        SettingsMenu.render(container, soundEnabled, reducedMotion, callbacks);
      });
    });

    document.getElementById('btn-settings-back')?.addEventListener('click', callbacks.onBack);
  }
}
