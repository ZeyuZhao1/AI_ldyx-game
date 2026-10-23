import { ICONS } from './Icons';

/**
 * 功勋科学家肖像加载与真实艺术图像集成模块
 * 
 * 核心准则：
 * 1. 彻底移除所有简笔画/素描勾勒线条内容
 * 2. 图像加载阶段展示精致军工金色转圈动画（Loading Spinner）
 * 3. 优先加载本地真实图片（/assets/images/scientists/${id}.png）
 * 4. 加载异常或文件为空时展示庄严的国家功勋丰碑印模（非简笔画）
 */

export const SCIENTIST_PORTRAITS: Record<string, string> = {};

/**
 * 统一肖像渲染器：展示加载转圈动画并加载真实艺术图片
 */
export function renderScientistPortraitHtml(
  scientistId: string,
  scientistName: string,
  options: {
    size?: 'thumb' | 'stage' | 'card';
    className?: string;
  } = {}
): string {
  const sizeClass = options.size || 'stage';
  const extraClass = options.className || '';

  return `
    <div class="sci-portrait-container ${sizeClass} ${extraClass}">
      <!-- 1. 加载转圈动画（加载中实时旋转） -->
      <div class="sci-loading-box">
        <div class="sci-spinner-ring"></div>
        <div class="sci-spinner-core">
          ${ICONS.star('sci-spin-star')}
        </div>
        ${sizeClass !== 'thumb' ? `<span class="sci-loading-text">档案载入中...</span>` : ''}
      </div>

      <!-- 2. 真实历史艺术图片 -->
      <img
        src="/assets/images/scientists/${scientistId}.png"
        alt="${scientistName} 功勋元勋肖像"
        class="sci-real-photo"
        loading="eager"
        onload="
          this.classList.add('is-loaded');
          const p = this.parentElement;
          if (p) {
            const sp = p.querySelector('.sci-loading-box');
            if (sp) sp.style.display = 'none';
          }
        "
        onerror="
          this.classList.add('is-missing');
          const p = this.parentElement;
          if (p) {
            const sp = p.querySelector('.sci-loading-box');
            if (sp) sp.style.display = 'none';
            const seal = p.querySelector('.sci-monument-seal');
            if (seal) seal.style.display = 'flex';
          }
        "
      />

      <!-- 3. 国家功勋纪念丰碑印章（仅在未配置图片或文件为空时展示，绝无简笔画） -->
      <div class="sci-monument-seal" style="display: none;">
        <div class="sci-seal-sunburst">
          ${ICONS.star('sci-seal-gold-star')}
        </div>
        <div class="sci-seal-name">${scientistName}</div>
        <div class="sci-seal-sub">两弹一星功勋元勋</div>
        <div class="sci-seal-ribbon">共和国功勋档案</div>
      </div>
    </div>
  `;
}
