(function(){
  'use strict';
  document.querySelectorAll('[data-tabs]').forEach(group=>{
    const buttons=group.querySelectorAll('[data-tab]');
    const panels=group.parentElement.querySelectorAll('[data-panel]');
    buttons.forEach(btn=>btn.addEventListener('click',()=>{
      buttons.forEach(b=>b.classList.toggle('active',b===btn));
      panels.forEach(p=>p.classList.toggle('active',p.dataset.panel===btn.dataset.tab));
    }));
  });
  function initPassword(){
    const gate=document.querySelector('.dm-gate, .auth-overlay'); if(!gate) return;
    const btn=gate.querySelector('button, .gate-btn'); const input=gate.querySelector('input');
    const err=gate.querySelector('.gate-error, .hint');
    const ok=()=>{ if(input && input.value==='WOT-ANOMALY-773'){ gate.remove(); sessionStorage.setItem('wotMonstersUnlocked','1'); localStorage.setItem('wot_dm_toolkit_access','1'); localStorage.setItem('wot_access','WOT-ANOMALY-773'); } else if(err){ err.textContent='Неверный пароль'; } };
    if(btn) btn.addEventListener('click', ok); if(input) input.addEventListener('keydown',e=>{if(e.key==='Enter')ok();});
    if(sessionStorage.getItem('wotMonstersUnlocked')==='1' || localStorage.getItem('wot_dm_toolkit_access')==='1' || localStorage.getItem('wot_access')==='WOT-ANOMALY-773') gate.remove();
  }
  initPassword();
})();

/* Existing Toolkit access behavior, shared by menu and overview links. */
(function(){
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

  document.addEventListener('click', e => {
    const link=e.target.closest('a[data-protected-href]');
    if(!link||isUnlocked())return;
    e.preventDefault();showDmToolkitPrompt(link.getAttribute('href'));
  });
  function showDmToolkitPrompt(targetHref){
    document.querySelectorAll('.dm-toolkit-auth-overlay').forEach(o => o.remove());
    const overlay = document.createElement('div');
    overlay.className = 'auth-overlay dm-toolkit-auth-overlay';
    overlay.innerHTML = `
      <div class="auth-modal" role="dialog" aria-modal="true" aria-labelledby="dm-toolkit-auth-title">
        <div class="auth-sigil" aria-hidden="true"><span></span></div>
        <p class="auth-kicker">DM Toolkit</p>
        <h1 id="dm-toolkit-auth-title">Доступ мастера</h1>
        <p class="auth-text">Введите пароль, чтобы открыть закрытый инструментарий ведущего.</p>
        <form class="auth-form">
          <label for="dm-toolkit-password">Пароль доступа</label>
          <input id="dm-toolkit-password" type="password" autocomplete="current-password" placeholder="Введите пароль" autofocus />
          <p class="auth-error" aria-live="polite"></p>
          <button type="submit">Открыть</button>
        </form>
      </div>`;
    document.body.appendChild(overlay);
    const form = overlay.querySelector('form');
    const input = overlay.querySelector('input');
    const error = overlay.querySelector('.auth-error');
    form.addEventListener('submit', ev => {
      ev.preventDefault();
      if(input.value === PASSWORD){
        unlock();
        window.location.href = targetHref;
      } else {
        error.textContent = 'Неверный пароль.';
        input.classList.add('auth-input-error');
        input.select();
      }
    });
    overlay.addEventListener('click', ev => {
      if(ev.target === overlay) overlay.remove();
    });
    input.focus();
  }
})();
