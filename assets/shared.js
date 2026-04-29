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
    const ok=()=>{ if(input && input.value==='Shattered270'){ gate.remove(); sessionStorage.setItem('wotMonstersUnlocked','1'); } else if(err){ err.textContent='Неверный пароль'; } };
    if(btn) btn.addEventListener('click', ok); if(input) input.addEventListener('keydown',e=>{if(e.key==='Enter')ok();});
    if(sessionStorage.getItem('wotMonstersUnlocked')==='1') gate.remove();
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
