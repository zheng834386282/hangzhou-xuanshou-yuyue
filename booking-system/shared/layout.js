/**
 * 管理端共享布局：侧边栏 + 顶部栏
 */
import { resetStore } from './store.js';

export function renderAdminLayout({ active, title, actions = '' }) {
  const layoutEl = document.getElementById('layout');
  const menus = [
    { key: 'dashboard', label: '数据看板', ico: '📊', href: './index.html' },
    { key: 'sessions', label: '场次管理', ico: '🗓️', href: './sessions.html' },
    { key: 'bookings', label: '预约名单', ico: '📋', href: './bookings.html' },
    { key: 'checkin', label: '核销操作', ico: '✅', href: './checkin.html' }
  ];
  layoutEl.innerHTML = `
    <aside class="sidebar">
      <div class="logo">
        <div class="logo-emoji">🐲</div>
        <div>
          <div class="logo-text">棋遇预约</div>
          <div class="logo-sub">运营管理后台</div>
        </div>
      </div>
      <nav class="menu">
        ${menus.map(m => `
          <a href="${m.href}" class="${active === m.key ? 'active' : ''}">
            <span class="ico">${m.ico}</span><span>${m.label}</span>
          </a>`).join('')}
      </nav>
      <div class="footer">
        <a href="../client/index.html" target="_blank" style="color:#fff;opacity:0.7;font-size:12px;text-decoration:underline;">→ 打开预约端</a>
        <div style="margin-top:8px;">
          <a href="javascript:void(0)" id="resetBtn" style="color:#fff;opacity:0.5;font-size:11px;">重置 Mock 数据</a>
        </div>
      </div>
    </aside>
    <div class="main">
      <div class="topbar">
        <div>
          <h1>${title}</h1>
        </div>
        <div class="actions">${actions}</div>
      </div>
      <div class="content" id="content"></div>
    </div>
  `;

  document.getElementById('resetBtn').onclick = () => {
    if (confirm('确定重置全部 Mock 数据？将恢复初始示例数据。')) {
      resetStore();
      location.reload();
    }
  };
}
