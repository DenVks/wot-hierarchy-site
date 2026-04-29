(function () {
  'use strict';
  const PASSWORD = 'WOT-ANOMALY-773';
  const STORAGE_KEY = 'wot_dm_toolkit_access';
  const LEGACY_KEY = 'wot_access';

  function isUnlocked(){
    return localStorage.getItem(STORAGE_KEY) === '1' || localStorage.getItem(LEGACY_KEY) === PASSWORD;
  }
  function unlock(){
    localStorage.setItem(STORAGE_KEY, '1');
    localStorage.setItem(LEGACY_KEY, PASSWORD);
  }
  function clearLegacyGates(){
    document.querySelectorAll('.dm-gate').forEach(g => g.remove());
  }
  function removeOverlay(){
    document.documentElement.classList.remove('auth-lock');
    document.querySelectorAll('.auth-overlay').forEach(o => o.remove());
    clearLegacyGates();
  }

  if (isUnlocked()) {
    document.documentElement.classList.remove('auth-lock');
    document.addEventListener('DOMContentLoaded', removeOverlay);
    return;
  }

  document.documentElement.classList.add('auth-lock');
  document.addEventListener('DOMContentLoaded', function () {
    clearLegacyGates();
    if (isUnlocked()) { removeOverlay(); return; }

    const overlay = document.createElement('div');
    overlay.className = 'auth-overlay';
    overlay.innerHTML = `
      <div class="auth-modal" role="dialog" aria-modal="true" aria-labelledby="auth-title">
        <div class="auth-sigil" aria-hidden="true"><span></span></div>
        <p class="auth-kicker">DM Toolkit</p>
        <h1 id="auth-title">Закрытый раздел</h1>
        <p class="auth-text">Эта страница содержит материалы для ведущего: монстров, генератор энкаунтеров и боевые листы NPC.</p>
        <form class="auth-form">
          <label for="auth-password">Пароль доступа</label>
          <input id="auth-password" type="password" autocomplete="current-password" placeholder="Введите пароль" autofocus />
          <p class="auth-error" aria-live="polite"></p>
          <button type="submit">Войти</button>
        </form>
      </div>
    `;
    document.body.appendChild(overlay);

    const form = overlay.querySelector('.auth-form');
    const input = overlay.querySelector('#auth-password');
    const error = overlay.querySelector('.auth-error');

    form.addEventListener('submit', function (event) {
      event.preventDefault();
      if (input.value === PASSWORD) {
        unlock();
        removeOverlay();
      } else {
        error.textContent = 'Неверный пароль.';
        input.classList.add('auth-input-error');
        input.select();
      }
    });
  });
})();
