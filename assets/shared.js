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
(function(){const path=(location.pathname.split('/').pop()||'index.html');document.querySelectorAll('.nav-links a').forEach(a=>{const href=a.getAttribute('href');a.classList.toggle('active',href===path);});})();


/* ==== v52: Правила dropdown after Главная; stable hover bridge ==== */
(function(){
  'use strict';
  const navLinks = document.querySelector('.nav-links');
  if(!navLinks || navLinks.querySelector('.nav-rule-group')) return;

  const path = (location.pathname.split('/').pop() || 'index.html');
  const ruleItems = [
    {href:'classes.html', label:'Классы'},
    {href:'weaves.html', label:'Плетения'},
    {href:'feats.html', label:'Дополнительные черты'},
    {href:'unity.html', label:'Единство'},
    {href:'throne.html', label:'Трон'},
    {href:'madding.html', label:'Хранители'},
    {href:'hierarchy-wall.html', label:'Иерархия Стены'},
    {href:'order.html', label:'Орден'}
  ];
  window.WOT_RULE_ITEMS = ruleItems.slice();
  const groupedPages = new Set(ruleItems.map(i => i.href.split('#')[0]));

  Array.from(navLinks.querySelectorAll('a')).forEach(a => {
    const href = (a.getAttribute('href') || '').split('#')[0];
    if(groupedPages.has(href)) a.remove();
  });

  const group = document.createElement('div');
  group.className = 'nav-rule-group';
  if(groupedPages.has(path)) group.classList.add('active');

  const btn = document.createElement('button');
  btn.type = 'button';
  btn.className = 'nav-rule-btn';
  btn.setAttribute('aria-haspopup','true');
  btn.setAttribute('aria-expanded','false');
  btn.textContent = 'Правила';
  group.appendChild(btn);

  const menu = document.createElement('div');
  menu.className = 'nav-rule-menu nav-rule-menu-floating';
  menu.setAttribute('role','menu');

  ruleItems.forEach(item => {
    const a = document.createElement('a');
    a.href = item.href;
    a.textContent = item.label;
    a.setAttribute('role','menuitem');
    if(item.href.split('#')[0] === path) a.classList.add('active');
    menu.appendChild(a);
  });
  document.body.appendChild(menu);

  const home = Array.from(navLinks.querySelectorAll('a')).find(a => (a.getAttribute('href') || '').split('#')[0] === 'index.html');
  if(home) home.insertAdjacentElement('afterend', group);
  else navLinks.prepend(group);

  let closeTimer = 0;
  function positionMenu(){
    const r = btn.getBoundingClientRect();
    const width = Math.max(240, menu.offsetWidth || 240);
    let left = r.left;
    const maxLeft = window.innerWidth - width - 12;
    if(left > maxLeft) left = Math.max(12, maxLeft);
    menu.style.left = left + 'px';
    menu.style.top = (r.bottom + 8) + 'px';
  }
  function setOpen(open){
    clearTimeout(closeTimer);
    group.classList.toggle('open', open);
    menu.classList.toggle('open', open);
    btn.setAttribute('aria-expanded', String(open));
    if(open){
      positionMenu();
      const r = btn.getBoundingClientRect();
      menu.style.setProperty('--bridge-left', r.left + 'px');
      menu.style.setProperty('--bridge-top', r.bottom + 'px');
      menu.style.setProperty('--bridge-width', r.width + 'px');
    }
  }
  function scheduleClose(){
    clearTimeout(closeTimer);
    closeTimer = window.setTimeout(() => setOpen(false), 320);
  }
  function cancelClose(){
    clearTimeout(closeTimer);
    setOpen(true);
  }

  group.addEventListener('mouseenter', cancelClose);
  group.addEventListener('mouseleave', scheduleClose);
  menu.addEventListener('mouseenter', cancelClose);
  menu.addEventListener('mouseleave', scheduleClose);

  btn.addEventListener('click', e => {
    e.stopPropagation();
    setOpen(!group.classList.contains('open'));
  });
  btn.addEventListener('keydown', e => {
    if(e.key === 'ArrowDown' || e.key === 'Enter' || e.key === ' '){
      e.preventDefault(); setOpen(true);
      const first = menu.querySelector('a'); if(first) first.focus();
    }
  });
  menu.addEventListener('keydown', e => {
    const links = Array.from(menu.querySelectorAll('a'));
    const i = links.indexOf(document.activeElement);
    if(e.key === 'Escape'){ setOpen(false); btn.focus(); }
    else if(e.key === 'ArrowDown'){ e.preventDefault(); links[(i + 1 + links.length) % links.length].focus(); }
    else if(e.key === 'ArrowUp'){ e.preventDefault(); links[(i - 1 + links.length) % links.length].focus(); }
  });
  document.addEventListener('click', e => {
    if(!group.contains(e.target) && !menu.contains(e.target)) setOpen(false);
  });
  window.addEventListener('resize', () => { if(menu.classList.contains('open')) positionMenu(); });
  window.addEventListener('scroll', () => { if(menu.classList.contains('open')) positionMenu(); }, {passive:true});
})();


/* ==== v74: Государства и народы dropdown ==== */
(function(){
  'use strict';
  const navLinks = document.querySelector('.nav-links');
  if(!navLinks || navLinks.querySelector('.nav-nations-group')) return;

  const path = (location.pathname.split('/').pop() || 'index.html');
  const nationItems = [
    {href:'aiel.html', label:'Айил'},
    {href:'tuataan.html', label:'Туата’ан'},
    {href:'arafel.html', label:'Арафел'},
    {href:'kandor.html', label:'Кандор'},
    {href:'shienar.html', label:'Шайнар'},
    {href:'tar-valon.html', label:'Тар Валон'}
  ];
  window.WOT_NATION_ITEMS = nationItems.slice();
  const nationPages = new Set(nationItems.map(i => i.href.split('#')[0]));

  Array.from(navLinks.querySelectorAll('a')).forEach(a => {
    const href = (a.getAttribute('href') || '').split('#')[0];
    if(nationPages.has(href)) a.remove();
  });

  const group = document.createElement('div');
  group.className = 'nav-nations-group nav-rule-group';
  if(nationPages.has(path)) group.classList.add('active');

  const btn = document.createElement('button');
  btn.type = 'button';
  btn.className = 'nav-nations-btn nav-rule-btn';
  btn.setAttribute('aria-haspopup','true');
  btn.setAttribute('aria-expanded','false');
  btn.textContent = 'Государства и народы';
  group.appendChild(btn);

  const menu = document.createElement('div');
  menu.className = 'nav-nations-menu nav-rule-menu nav-rule-menu-floating';
  menu.setAttribute('role','menu');

  nationItems.forEach(item => {
    const a = document.createElement('a');
    a.href = item.href;
    a.textContent = item.label;
    a.setAttribute('role','menuitem');
    if(item.href.split('#')[0] === path) a.classList.add('active');
    menu.appendChild(a);
  });
  document.body.appendChild(menu);

  const rules = navLinks.querySelector('.nav-rule-group');
  const anchor = Array.from(navLinks.querySelectorAll('a')).find(a => (a.getAttribute('href') || '').split('#')[0] === 'hierarchies.html');
  if(rules) rules.insertAdjacentElement('afterend', group);
  else if(anchor) anchor.insertAdjacentElement('afterend', group);
  else navLinks.prepend(group);

  let closeTimer = 0;
  function positionMenu(){
    const r = btn.getBoundingClientRect();
    const width = Math.max(260, menu.offsetWidth || 260);
    let left = r.left;
    const maxLeft = window.innerWidth - width - 12;
    if(left > maxLeft) left = Math.max(12, maxLeft);
    menu.style.left = left + 'px';
    menu.style.top = (r.bottom + 8) + 'px';
  }
  function setOpen(open){
    clearTimeout(closeTimer);
    group.classList.toggle('open', open);
    menu.classList.toggle('open', open);
    btn.setAttribute('aria-expanded', String(open));
    if(open){
      positionMenu();
      const r = btn.getBoundingClientRect();
      menu.style.setProperty('--bridge-left', r.left + 'px');
      menu.style.setProperty('--bridge-top', r.bottom + 'px');
      menu.style.setProperty('--bridge-width', r.width + 'px');
    }
  }
  function scheduleClose(){ clearTimeout(closeTimer); closeTimer = window.setTimeout(() => setOpen(false), 320); }
  function cancelClose(){ clearTimeout(closeTimer); setOpen(true); }
  group.addEventListener('mouseenter', cancelClose);
  group.addEventListener('mouseleave', scheduleClose);
  menu.addEventListener('mouseenter', cancelClose);
  menu.addEventListener('mouseleave', scheduleClose);
  btn.addEventListener('click', e => { e.stopPropagation(); setOpen(!group.classList.contains('open')); });
  btn.addEventListener('keydown', e => {
    if(e.key === 'ArrowDown' || e.key === 'Enter' || e.key === ' '){
      e.preventDefault(); setOpen(true);
      const first = menu.querySelector('a'); if(first) first.focus();
    }
  });
  menu.addEventListener('keydown', e => {
    const links = Array.from(menu.querySelectorAll('a'));
    const i = links.indexOf(document.activeElement);
    if(e.key === 'Escape'){ setOpen(false); btn.focus(); }
    else if(e.key === 'ArrowDown'){ e.preventDefault(); links[(i + 1 + links.length) % links.length].focus(); }
    else if(e.key === 'ArrowUp'){ e.preventDefault(); links[(i - 1 + links.length) % links.length].focus(); }
  });
  document.addEventListener('click', e => { if(!group.contains(e.target) && !menu.contains(e.target)) setOpen(false); });
  window.addEventListener('resize', () => { if(menu.classList.contains('open')) positionMenu(); });
  window.addEventListener('scroll', () => { if(menu.classList.contains('open')) positionMenu(); }, {passive:true});
})();


/* ==== v58: DM Toolkit dropdown at the right edge + password-gated links ==== */
(function(){
  'use strict';
  const navLinks = document.querySelector('.nav-links');
  if(!navLinks || navLinks.querySelector('.nav-dm-group')) return;

  const PASSWORD = 'WOT-ANOMALY-773';
  const STORAGE_KEY = 'wot_dm_toolkit_access';
  const LEGACY_KEY = 'wot_access';
  const path = (location.pathname.split('/').pop() || 'index.html');
  const dmItems = [
    {href:'monsters.html', label:'Монстры'},
    {href:'monsters-battle.html', label:'Monsters / Бой'},
    {href:'encounter-generator.html', label:'Генератор энкаунтеров'},
    {href:'npc-generator.html', label:'NPC Generator'},
    {href:'dm-npc.html', label:'NPC / Бой'}
  ];
  const dmPages = new Set(dmItems.map(i => i.href));

  function isUnlocked(){
    return localStorage.getItem(STORAGE_KEY) === '1' || localStorage.getItem(LEGACY_KEY) === PASSWORD;
  }
  function unlock(){
    localStorage.setItem(STORAGE_KEY, '1');
    localStorage.setItem(LEGACY_KEY, PASSWORD);
  }

  Array.from(navLinks.querySelectorAll('a')).forEach(a => {
    const href = (a.getAttribute('href') || '').split('#')[0];
    if(dmPages.has(href)) a.remove();
  });

  const group = document.createElement('div');
  group.className = 'nav-dm-group nav-rule-group';
  if(dmPages.has(path)) group.classList.add('active');

  const btn = document.createElement('button');
  btn.type = 'button';
  btn.className = 'nav-dm-btn nav-rule-btn';
  btn.setAttribute('aria-haspopup','true');
  btn.setAttribute('aria-expanded','false');
  btn.textContent = 'DM Toolkit';
  group.appendChild(btn);

  const menu = document.createElement('div');
  menu.className = 'nav-dm-menu nav-rule-menu nav-rule-menu-floating';
  menu.setAttribute('role','menu');

  dmItems.forEach(item => {
    const a = document.createElement('a');
    a.href = item.href;
    a.textContent = item.label;
    a.setAttribute('role','menuitem');
    a.dataset.protectedHref = item.href;
    if(item.href === path) a.classList.add('active');
    menu.appendChild(a);
  });
  document.body.appendChild(menu);
  navLinks.appendChild(group);

  let closeTimer = 0;
  function positionMenu(){
    const r = btn.getBoundingClientRect();
    const width = Math.max(260, menu.offsetWidth || 260);
    let left = r.right - width;
    const maxLeft = window.innerWidth - width - 12;
    if(left > maxLeft) left = maxLeft;
    if(left < 12) left = 12;
    menu.style.left = left + 'px';
    menu.style.top = (r.bottom + 8) + 'px';
  }
  function setOpen(open){
    clearTimeout(closeTimer);
    group.classList.toggle('open', open);
    menu.classList.toggle('open', open);
    btn.setAttribute('aria-expanded', String(open));
    if(open){
      positionMenu();
      const r = btn.getBoundingClientRect();
      menu.style.setProperty('--bridge-left', r.left + 'px');
      menu.style.setProperty('--bridge-top', r.bottom + 'px');
      menu.style.setProperty('--bridge-width', r.width + 'px');
    }
  }
  function scheduleClose(){
    clearTimeout(closeTimer);
    closeTimer = window.setTimeout(() => setOpen(false), 360);
  }
  function cancelClose(){
    clearTimeout(closeTimer);
    setOpen(true);
  }
  group.addEventListener('mouseenter', cancelClose);
  group.addEventListener('mouseleave', scheduleClose);
  menu.addEventListener('mouseenter', cancelClose);
  menu.addEventListener('mouseleave', scheduleClose);
  btn.addEventListener('click', e => { e.stopPropagation(); setOpen(!group.classList.contains('open')); });
  document.addEventListener('click', e => { if(!group.contains(e.target) && !menu.contains(e.target)) setOpen(false); });
  window.addEventListener('resize', () => { if(menu.classList.contains('open')) positionMenu(); });
  window.addEventListener('scroll', () => { if(menu.classList.contains('open')) positionMenu(); }, {passive:true});

  menu.addEventListener('click', e => {
    const link = e.target.closest('a[data-protected-href]');
    if(!link) return;
    if(isUnlocked()) return;
    e.preventDefault();
    setOpen(false);
    showDmToolkitPrompt(link.getAttribute('href'));
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
