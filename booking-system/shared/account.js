/**
 * C 端游戏登录态展示组件
 * - 渲染顶部账号条
 * - 提供"切换账号"模态（mock 用，演示多账号场景）
 */
import { getCurrentAccount, setCurrentUser, getMockAccounts } from './store.js';

export function renderAccountBar(container, opts = {}) {
  const { compact = false, onChange } = opts;
  const acc = getCurrentAccount();

  const bar = document.createElement('div');
  bar.className = 'account-bar' + (compact ? ' compact' : '');
  bar.innerHTML = `
    <div class="avatar">${acc.avatar || '🎮'}</div>
    <div class="info">
      <div class="nick">
        ${acc.nickname}
        <span class="tag">${acc.tag || ''}</span>
      </div>
      <div class="meta">
        <span class="pill">${acc.server || '默认大区'}</span>
        <span class="pill">${acc.rank || ''}</span>
        <span style="color:var(--text-3);">游戏登录态</span>
      </div>
    </div>
    <button class="switch-btn" type="button">切换</button>
  `;

  bar.querySelector('.switch-btn').addEventListener('click', () => {
    openAccountPicker((next) => {
      if (next.openid !== acc.openid) {
        setCurrentUser(next);
        if (onChange) onChange(next);
        else location.reload();
      }
    });
  });

  if (typeof container === 'string') container = document.querySelector(container);
  container.innerHTML = '';
  container.appendChild(bar);
  return bar;
}

export function openAccountPicker(onPick) {
  const accounts = getMockAccounts();
  const current = getCurrentAccount();

  const mask = document.createElement('div');
  mask.className = 'mask';
  mask.innerHTML = `
    <div class="modal" style="max-width:340px;text-align:left;">
      <div class="modal-title" style="text-align:center;">切换游戏账号</div>
      <div style="font-size:12px;color:var(--text-3);text-align:center;margin-bottom:14px;">
        Demo 模式：实际场景由游戏 SDK 提供登录态
      </div>
      <div class="account-picker">
        ${accounts.map(a => `
          <button class="acc-item ${a.openid === current.openid ? 'current' : ''}" data-openid="${a.openid}" type="button">
            <div class="avatar">${a.avatar}</div>
            <div class="info">
              <div class="nick">${a.nickname} <span style="font-weight:400;color:var(--text-3);font-size:11px;">${a.tag}</span></div>
              <div class="meta">${a.server} · ${a.rank} · Lv.${a.level}</div>
            </div>
            <div class="check">${a.openid === current.openid ? '✓' : ''}</div>
          </button>
        `).join('')}
      </div>
      <button class="btn btn-ghost close-btn" type="button" id="closePicker" style="margin-top:16px;width:100%;">关闭</button>
    </div>
  `;

  document.body.appendChild(mask);

  const close = () => mask.remove();
  mask.addEventListener('click', (e) => { if (e.target === mask) close(); });
  mask.querySelector('#closePicker').onclick = close;
  mask.querySelectorAll('.acc-item').forEach(btn => {
    btn.onclick = () => {
      const openid = btn.dataset.openid;
      const picked = accounts.find(a => a.openid === openid);
      close();
      if (onPick) onPick(picked);
    };
  });
}
