import { SCIENTISTS } from '../data/scientists';

export class ScientistGallery {
  public static render(
    container: HTMLElement,
    unlockedList: readonly string[],
    onBack: () => void
  ): void {
    let rowsHtml = '';

    SCIENTISTS.forEach((sc) => {
      const isUnlocked = unlockedList.includes(sc.id);
      const classes = ['sci', isUnlocked ? '' : 'locked'].filter(Boolean).join(' ');

      if (isUnlocked) {
        rowsHtml += `
          <div class="${classes}">
            <div class="sname">★ ${sc.name} · ${sc.title}</div>
            <div class="quote">${sc.quote}</div>
            <div class="sdesc">${sc.desc}</div>
            ${sc.pow ? `<div class="spow">发射架倾力加成：最大力度 +${sc.pow}</div>` : ''}
          </div>
        `;
      } else {
        rowsHtml += `
          <div class="${classes}">
            <div class="sname">？？？ · 隐姓埋名</div>
            <div class="quote">“干惊天动地事，做隐姓埋名人。”</div>
            <div class="sdesc">攻克对应国防攻关历史关卡后归队。</div>
          </div>
        `;
      }
    });

    container.innerHTML = `
      <div id="viewSci" class="menu-view">
        <div class="vtitle">功勋科学家名录</div>
        <div class="tip" style="margin-bottom:14px;">
          攻克对应历史关卡后归队，解锁发射架力度加成、新型弹药与专属能力
        </div>
        <div id="sciRow">${rowsHtml}</div>
        <button class="mbtn ghost backBtn" id="btn-sci-back">返回主页</button>
      </div>
    `;

    document.getElementById('btn-sci-back')?.addEventListener('click', onBack);
  }
}
