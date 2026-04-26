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


(function(){
  const nav = document.querySelector('.nav-links');
  if(!nav) return;
  nav.addEventListener('wheel', function(e){
    if(Math.abs(e.deltaY) > Math.abs(e.deltaX)) {
      nav.scrollLeft += e.deltaY;
      e.preventDefault();
    }
  }, {passive:false});
  let down = false, startX = 0, startLeft = 0;
  nav.addEventListener('mousedown', e => { down = true; startX = e.pageX; startLeft = nav.scrollLeft; nav.classList.add('dragging'); });
  window.addEventListener('mouseup', ()=> { down = false; nav.classList.remove('dragging'); });
  window.addEventListener('mousemove', e => {
    if(!down) return;
    nav.scrollLeft = startLeft - (e.pageX - startX);
  });
})();

/* ==== v22: global sidebar + page UX ==== */
(function(){
  'use strict';
  if(document.querySelector('.site-sidebar')) return;

  const navLinks = Array.from(document.querySelectorAll('.nav-links a'));
  if(!navLinks.length) return;

  const groups = [
    {title:'Мир', items:['index.html','epoch.html','chronicles.html']},
    {title:'Иерархии', items:['hierarchies.html','unity.html','throne.html','madding.html','hierarchy-wall.html']},
    {title:'Орден и аномалии', items:['order.html','wall.html','anomalies.html','tsitadel.html']},
    {title:'Игровые инструменты', items:['rituals.html','weaves.html','ingredients.html','loot-generator.html','encounter-generator.html','monsters.html']},
    {title:'Народы', items:['aiel.html','tuataan.html','freefolk.html']}
  ];
  const byHref = new Map(navLinks.map(a => [a.getAttribute('href'), a.textContent.trim()]));
  const path = (location.pathname.split('/').pop() || 'index.html');

  const toggle = document.createElement('button');
  toggle.className = 'sidebar-toggle';
  toggle.type = 'button';
  toggle.setAttribute('aria-label','Открыть навигацию');
  toggle.setAttribute('aria-expanded','false');
  toggle.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 7h16M4 12h16M4 17h16"/></svg>';

  const backdrop = document.createElement('div');
  backdrop.className = 'sidebar-backdrop';

  const sidebar = document.createElement('aside');
  sidebar.className = 'site-sidebar';
  sidebar.setAttribute('aria-label','Боковая навигация');

  let navHtml = '';
  groups.forEach(g => {
    const links = g.items.filter(h => byHref.has(h)).map(h => {
      const active = h === path ? ' active' : '';
      return '<a class="sidebar-link'+active+'" href="'+h+'">'+byHref.get(h)+'</a>';
    }).join('');
    if(links) navHtml += '<div class="sidebar-group"><div class="sidebar-group-title">'+g.title+'</div>'+links+'</div>';
  });

  sidebar.innerHTML = '<div class="sidebar-shell">'
    + '<div class="sidebar-head"><div class="sidebar-title">Навигация</div><button class="sidebar-close" type="button" aria-label="Закрыть">×</button></div>'
    + '<div class="sidebar-search-wrap"><input class="sidebar-search" type="search" placeholder="Фильтр разделов…" aria-label="Фильтр разделов"></div>'
    + '<nav class="sidebar-nav">'+navHtml+'</nav>'
    + '<div class="sidebar-toc"><div class="sidebar-group-title">На этой странице</div><div class="sidebar-toc-list"></div></div>'
    + '</div>';

  const topButton = document.createElement('button');
  topButton.className = 'to-top';
  topButton.type = 'button';
  topButton.setAttribute('aria-label','Наверх');
  topButton.textContent = '↑';

  document.body.prepend(backdrop);
  document.body.prepend(sidebar);
  document.body.prepend(toggle);
  document.body.appendChild(topButton);
  document.body.classList.add('sidebar-ready');

  if(localStorage.getItem('wotSidebarCollapsed') === '1') document.body.classList.add('sidebar-collapsed');

  const closeBtn = sidebar.querySelector('.sidebar-close');
  function isDesktop(){ return window.matchMedia('(min-width:1260px)').matches; }
  function setOpen(open){
    if(isDesktop()){
      document.body.classList.toggle('sidebar-collapsed', !open);
      localStorage.setItem('wotSidebarCollapsed', open ? '0' : '1');
    } else {
      document.body.classList.toggle('sidebar-open', open);
    }
    toggle.setAttribute('aria-expanded', String(open));
  }
  function currentOpen(){ return isDesktop() ? !document.body.classList.contains('sidebar-collapsed') : document.body.classList.contains('sidebar-open'); }
  toggle.addEventListener('click', () => setOpen(!currentOpen()));
  closeBtn.addEventListener('click', () => setOpen(false));
  backdrop.addEventListener('click', () => setOpen(false));
  document.addEventListener('keydown', e => { if(e.key === 'Escape') setOpen(false); });
  window.addEventListener('resize', () => { if(isDesktop()) document.body.classList.remove('sidebar-open'); });

  const search = sidebar.querySelector('.sidebar-search');
  search.addEventListener('input', () => {
    const q = search.value.trim().toLowerCase();
    sidebar.querySelectorAll('.sidebar-link').forEach(a => {
      a.style.display = !q || a.textContent.toLowerCase().includes(q) ? '' : 'none';
    });
    sidebar.querySelectorAll('.sidebar-group').forEach(g => {
      const visible = Array.from(g.querySelectorAll('.sidebar-link')).some(a => a.style.display !== 'none');
      g.style.display = visible ? '' : 'none';
    });
  });

  // Build compact table of contents for the current page.
  const mainRoot = document.querySelector('.page-body') || document.body;
  const headingCandidates = Array.from(mainRoot.querySelectorAll('section h2, section h3, .chapter-title, .hero h1, .page-header h1'));
  const seen = new Set();
  const headings = headingCandidates.filter(h => {
    const text = h.textContent.replace(/\s+/g,' ').trim();
    if(!text || seen.has(text)) return false;
    seen.add(text);
    return true;
  }).slice(0,14);
  const tocList = sidebar.querySelector('.sidebar-toc-list');
  const staticPageAnchors = {
    'wall.html': [
      ['#w1','Феномен'], ['#w2','Зоны'], ['#wall-visual','Схема'], ['#w3','Пересечение'], ['#w4','Механика'], ['#w5','Карта']
    ],
    'hierarchies.html': [
      ['#edinstvo','Единство'], ['#tron','Хрустальный Трон'], ['#farmadding','Фар Мэддинг'], ['#comparison','Сравнение'], ['#wall-hierarchy','Иерархия Стены']
    ],
    'tsitadel.html': [
      ['#citadel-device','Цитадель как устройство'],
      ['#threshold-node','Порог Узла'],
      ['#gallery-threads','Галерея Нитей'],
      ['#pyramid-workshops','Мастерские Пирамид'],
      ['#access-hall','Зал Допусков'],
      ['#pattern-sphere-hall','Сердце Цитадели'],
      ['#silent-gardens','Сады Тишины']
    ],
    'weaves.html': [
      ['#weave-level-0','Кантрипы'],
      ['#weave-level-1','1-й уровень'],
      ['#weave-level-2','2-й уровень'],
      ['#weave-level-3','3-й уровень'],
      ['#weave-level-4','4-й уровень'],
      ['#weave-level-5','5-й уровень'],
      ['#weave-level-6','6-й уровень'],
      ['#weave-level-7','7-й уровень'],
      ['#weave-level-8','8-й уровень'],
      ['#weave-level-9','9-й уровень']
    ]
  };
  function slugify(text){
    return text.toLowerCase().replace(/[«»“”"'’]/g,'').replace(/[^a-zа-яё0-9]+/gi,'-').replace(/^-+|-+$/g,'').slice(0,64) || 'section';
  }
  const staticAnchors = staticPageAnchors[path] || null;
  if(staticAnchors){
    staticAnchors.forEach(([href, label]) => {
      const a = document.createElement('a');
      a.className = 'sidebar-toc-link primary';
      a.href = href;
      a.textContent = label;
      a.addEventListener('click', () => { if(!isDesktop()) setOpen(false); });
      tocList.appendChild(a);
    });
  } else if(headings.length){
    headings.forEach((h, idx) => {
      if(!h.id){
        let base = slugify(h.textContent.trim()), id = base, n = 2;
        while(document.getElementById(id)) id = base + '-' + (n++);
        h.id = id;
      }
      const a = document.createElement('a');
      a.className = 'sidebar-toc-link';
      a.href = '#'+h.id;
      a.textContent = h.textContent.replace(/\s+/g,' ').trim();
      a.addEventListener('click', () => { if(!isDesktop()) setOpen(false); });
      tocList.appendChild(a);
    });
  } else {
    tocList.innerHTML = '<div class="sidebar-empty">Нет внутренних разделов</div>';
  }

  if('IntersectionObserver' in window && headings.length){
    const tocLinks = Array.from(sidebar.querySelectorAll('.sidebar-toc-link'));
    const map = new Map(tocLinks.map(a => [a.getAttribute('href').slice(1), a]));
    const io = new IntersectionObserver(entries => {
      const visible = entries.filter(e => e.isIntersecting).sort((a,b)=>a.boundingClientRect.top-b.boundingClientRect.top)[0];
      if(!visible) return;
      tocLinks.forEach(a => a.classList.remove('active'));
      const link = map.get(visible.target.id); if(link) link.classList.add('active');
    }, {rootMargin:'-18% 0px -70% 0px', threshold:[0,1]});
    headings.forEach(h => io.observe(h));
  }

  topButton.addEventListener('click', () => window.scrollTo({top:0, behavior:'smooth'}));
  window.addEventListener('scroll', () => {
    topButton.classList.toggle('visible', window.scrollY > 650);
  }, {passive:true});
})();
