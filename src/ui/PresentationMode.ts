import { LEVELS } from '../data/levels';

export interface PresentationConfig {
  levelIndex: number;
  unlockAllAbilities: boolean;
  infiniteAmmo: boolean;
}

export interface PresentationModeCallbacks {
  onStartPresentation: (config: PresentationConfig) => void;
  onBack: () => void;
}

export class PresentationMode {
  public static render(
    container: HTMLElement,
    callbacks: PresentationModeCallbacks
  ): void {
    let levelOptions = '';
    LEVELS.forEach((lvl, i) => {
      levelOptions += `<option value="${i}">${lvl.year} · ${lvl.name}</option>`;
    });

    container.innerHTML = `
      <div id="viewPres" class="menu-view">
        <div class="vtitle">思政课堂汇报演示模式</div>
        <div class="tip" style="margin-bottom:20px;max-width:620px;line-height:1.6">
          专为课堂研学与思政答辩设计的演示模式。可自由选择任意历史关卡、配置科技树预设，且<b>绝不覆盖或影响普通游玩的存档进度</b>。
        </div>

        <div class="pres-config-box">
          <div class="form-row">
            <label for="pres-level-select">选择演示关卡：</label>
            <select id="pres-level-select" class="pres-select">
              ${levelOptions}
            </select>
          </div>

          <div class="form-row">
            <label>科技装备预设：</label>
            <div class="radio-group">
              <label class="radio-label">
                <input type="radio" name="pres-tech" value="full" checked />
                <span>全科技就位 (全科学家/瞄准镜/全弹种可用)</span>
              </label>
              <label class="radio-label">
                <input type="radio" name="pres-tech" value="historical" />
                <span>贴合史实装备 (仅开放该年代已攻克科技)</span>
              </label>
            </div>
          </div>

          <div class="form-row">
            <label class="checkbox-label">
              <input type="checkbox" id="pres-infinite-ammo" />
              <span>充裕弹药供给 (各弹种数量充裕，便于课堂多角度试射)</span>
            </label>
          </div>

          <div style="margin-top:24px;display:flex;gap:12px;justify-content:center;">
            <button class="hbtn primary" id="btn-pres-launch" style="width:200px;font-size:18px;">进入汇报演示</button>
            <button class="mbtn ghost" id="btn-pres-back" style="margin:0;">返回首页</button>
          </div>
        </div>
      </div>
    `;

    document.getElementById('btn-pres-launch')?.addEventListener('click', () => {
      const selectEl = document.getElementById('pres-level-select') as HTMLSelectElement;
      const levelIndex = parseInt(selectEl?.value || '0', 10);
      const fullTechEl = document.querySelector('input[name="pres-tech"][value="full"]') as HTMLInputElement;
      const unlockAllAbilities = fullTechEl ? fullTechEl.checked : true;
      const infiniteAmmoEl = document.getElementById('pres-infinite-ammo') as HTMLInputElement;
      const infiniteAmmo = infiniteAmmoEl ? infiniteAmmoEl.checked : false;

      callbacks.onStartPresentation({
        levelIndex,
        unlockAllAbilities,
        infiniteAmmo,
      });
    });

    document.getElementById('btn-pres-back')?.addEventListener('click', callbacks.onBack);
  }
}
