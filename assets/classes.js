
(function(){
  'use strict';

  const db = window.WOT_CLASSES_DB || {features:[], progression:[], archetypes:[], meta:{}};
  const $ = id => document.getElementById(id);
  const esc = v => String(v ?? '').replace(/[&<>'"]/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[ch]));
  const norm = v => String(v || '').toLowerCase().replace(/ё/g,'е').trim();
  const uniq = arr => Array.from(new Set(arr.filter(Boolean))).sort((a,b)=>String(a).localeCompare(String(b),'ru'));

  const classOrder = [
    'Пустынный воин',
    'Мастер по оружию',
    'Посвящённый',
    'Благородный',
    'Скиталец',
    'Дичок',
    'Лесник'
  ].filter(c => db.features.some(f => f.className === c));

  const classBlurbs = {
    'Пустынный воин': 'Айильский боевой путь: скорость, выносливость, бой без тяжёлой брони и общественные традиции воинов Пустоши.',
    'Мастер по оружию': 'Профессиональный воин и дуэлянт. Его сила — дисциплина, формы боя, архетипы командования и владение оружием.',
    'Посвящённый': 'Класс направляющих Единой Силы. Традиции, плетения, видение нитей и опасная цена обращения к Источнику.',
    'Благородный': 'Социальный класс власти, ресурсов и влияния. Приказы, связи, поддержка союзников и дворянские пути.',
    'Скиталец': 'Гибкий класс разведчиков, воров, информаторов и убийц. Скрытность, точечный урон и городская тактика.',
    'Дичок': 'Дикий направляющий, в котором Сила проявилась вне башенных школ. Инстинкт, талант и опасная спонтанность.',
    'Лесник': 'Следопыт, охотник и проводник. Выживание, местность, звери, разведка и дальняя война.'
  };

  const state = {
    className: classOrder[0] || (db.meta.classes || [])[0] || '',
    archetype: 'all',
    level: 'all',
    q: ''
  };

  function featureLevelLabel(f){
    return f.levels && String(f.levels).trim() ? String(f.levels) : '—';
  }

  function isBaseFeature(f){
    return f.archetype === 'Базовый класс' || f.archetypeSlug === 'bazovyy-klass' || /базов/i.test(f.archetype || '');
  }

  function currentFeatures(){
    return db.features.filter(f => f.className === state.className);
  }

  function filteredFeatures(options = {}){
    const includeBase = options.includeBase !== false;
    return currentFeatures().filter(f => {
      if (!includeBase && isBaseFeature(f)) return false;
      if (state.archetype !== 'all' && !isBaseFeature(f) && f.archetype !== state.archetype) return false;
      if (state.archetype !== 'all' && options.onlySelectedArchetype && f.archetype !== state.archetype) return false;
      if (state.level !== 'all' && String(f.levelSort || f.levels) !== state.level) return false;
      if (state.q) {
        const hay = norm([f.feature, f.description, f.category, f.archetype, f.levels].join(' '));
        if (!hay.includes(norm(state.q))) return false;
      }
      return true;
    }).sort((a,b)=>
      (Number(a.levelSort || 999) - Number(b.levelSort || 999)) ||
      String(a.archetype).localeCompare(String(b.archetype),'ru') ||
      String(a.feature).localeCompare(String(b.feature),'ru')
    );
  }

  function renderClassTabs(){
    const host = $('class-tabs');
    if(!host) return;
    host.innerHTML = classOrder.map(c => {
      const count = db.features.filter(f => f.className === c).length;
      const active = c === state.className ? ' active' : '';
      return `<button class="class-tab${active}" type="button" data-class="${esc(c)}">
        <span>${esc(c)}</span><small>${count} черт</small>
      </button>`;
    }).join('');
    host.querySelectorAll('.class-tab').forEach(btn => {
      btn.addEventListener('click', () => {
        state.className = btn.dataset.class;
        state.archetype = 'all';
        state.level = 'all';
        state.q = '';
        renderAll();
        document.getElementById('class-hero')?.scrollIntoView({behavior:'smooth', block:'start'});
      });
    });
  }

  function renderHero(){
    const feats = currentFeatures();
    const archs = db.archetypes.filter(a => a.className === state.className);
    const prog = db.progression.filter(p => p.className === state.className);
    $('class-kicker').textContent = 'Класс · WoT 5e';
    $('class-title').textContent = state.className;
    $('class-intro').textContent = classBlurbs[state.className] || 'Класс из адаптации Wheel of Time 5e. Ниже собраны прогрессия, базовые черты и архетипы.';
    $('class-stats').innerHTML = `
      <div><strong>${feats.length}</strong><span>черт</span></div>
      <div><strong>${archs.length}</strong><span>архетипов</span></div>
      <div><strong>${prog.length}</strong><span>уровней</span></div>
    `;
  }

  function renderFilters(){
    const archSelect = $('archetype-filter');
    const levelSelect = $('level-filter');
    const search = $('class-search');

    const archs = uniq(db.archetypes.filter(a => a.className === state.className).map(a => a.archetype));
    archSelect.innerHTML = `<option value="all">Все архетипы</option>` + archs.map(a => `<option value="${esc(a)}">${esc(a)}</option>`).join('');
    archSelect.value = state.archetype;

    const levels = uniq(currentFeatures().map(f => String(f.levelSort || f.levels || '')).filter(x => x && x !== '999'));
    levelSelect.innerHTML = `<option value="all">Все уровни</option>` + levels.map(l => `<option value="${esc(l)}">${esc(l)}</option>`).join('');
    levelSelect.value = state.level;

    search.value = state.q;
  }

  function renderProgression(){
    const rows = db.progression.filter(p => p.className === state.className).sort((a,b)=>a.level-b.level);
    const host = $('class-progression');
    if(!rows.length){ host.innerHTML = '<p class="class-empty">Нет данных прогрессии.</p>'; return; }
    host.innerHTML = `<table class="class-progression-table">
      <thead><tr><th>Ур.</th><th>БМ</th><th>Реп.</th><th>Черты</th><th>Доп.</th></tr></thead>
      <tbody>${rows.map(r => `<tr>
        <td>${esc(r.level)}</td>
        <td>${esc(r.profBonus || '—')}</td>
        <td>${esc(r.reputation || '—')}</td>
        <td>${esc(r.features || '—')}</td>
        <td>${esc(r.extra || '—')}</td>
      </tr>`).join('')}</tbody>
    </table>`;
  }

  function shortDesc(text){
    const s = String(text || '').replace(/\s+/g,' ').trim();
    if (s.length <= 260) return s;
    return s.slice(0, 250).replace(/\s+\S*$/,'') + '…';
  }

  function featureCard(f, compact=false){
    const base = isBaseFeature(f) ? 'base' : 'arch';
    const desc = compact ? shortDesc(f.description) : shortDesc(f.description);
    return `<article class="feature-card class-feature-card ${base}" data-feature-id="${esc(f.id)}">
      <div class="feature-card-top">
        <span class="feature-level">Ур. ${esc(featureLevelLabel(f))}</span>
        <span class="feature-category">${esc(f.category || 'Черта')}</span>
      </div>
      <h4>${esc(f.feature)}</h4>
      <div class="feature-sub">${esc(isBaseFeature(f) ? 'Базовый класс' : f.archetype)}</div>
      <p>${esc(desc)}</p>
      <button type="button" class="feature-more" data-feature-id="${esc(f.id)}">Подробнее</button>
    </article>`;
  }

  function renderBaseFeatures(){
    const feats = filteredFeatures().filter(isBaseFeature);
    $('class-base-features').innerHTML = feats.length ? feats.map(f => featureCard(f)).join('') : '<p class="class-empty">Базовые черты не найдены по выбранному фильтру.</p>';
  }

  function renderArchetypes(){
    const host = $('class-archetypes');
    let archs = db.archetypes.filter(a => a.className === state.className);
    if (state.archetype !== 'all') archs = archs.filter(a => a.archetype === state.archetype);
    if(!archs.length){ host.innerHTML = '<p class="class-empty">Архетипы не найдены.</p>'; return; }

    host.innerHTML = archs.map(a => {
      const feats = filteredFeatures({includeBase:false, onlySelectedArchetype:false}).filter(f => f.archetype === a.archetype);
      return `<article class="archetype-reader-card">
        <div class="archetype-reader-head">
          <div>
            <span class="panel-kicker">Архетип</span>
            <h4>${esc(a.archetype)}</h4>
          </div>
          <span class="archetype-count">${feats.length} черт</span>
        </div>
        <p>${esc(a.description || 'Описание архетипа отсутствует в индексе.')}</p>
        <div class="feature-card-grid compact">${feats.length ? feats.map(f => featureCard(f, true)).join('') : '<p class="class-empty">Нет черт по текущему фильтру.</p>'}</div>
      </article>`;
    }).join('');
  }

  function renderAllFeatures(){
    const feats = filteredFeatures();
    $('feature-count').textContent = String(feats.length);
    $('class-all-features').innerHTML = feats.length ? feats.map(f => featureCard(f, true)).join('') : '<p class="class-empty">Ничего не найдено.</p>';
  }

  function openFeatureModal(id){
    const f = db.features.find(x => String(x.id) === String(id));
    if(!f) return;
    let modal = document.getElementById('class-feature-modal');
    if(!modal){
      modal = document.createElement('div');
      modal.id = 'class-feature-modal';
      modal.className = 'class-feature-modal';
      document.body.appendChild(modal);
      modal.addEventListener('click', e => { if(e.target === modal) closeFeatureModal(); });
    }
    modal.innerHTML = `<div class="class-feature-dialog" role="dialog" aria-modal="true">
      <button class="class-feature-close" type="button" onclick="window.closeClassFeatureModal()">×</button>
      <div class="modal-kicker">${esc(f.className)} · ${esc(isBaseFeature(f) ? 'Базовый класс' : f.archetype)} · Ур. ${esc(featureLevelLabel(f))}</div>
      <h3>${esc(f.feature)}</h3>
      <div class="modal-tags">
        <span>${esc(f.category || 'Черта')}</span>
        ${f.parent ? `<span>Родитель: ${esc(f.parent)}</span>` : ''}
        ${f.source ? `<span>Источник: ${esc(f.source)}</span>` : ''}
      </div>
      <div class="modal-description">${String(f.description || '').split(/\n+/).map(p=>`<p>${esc(p)}</p>`).join('')}</div>
    </div>`;
    modal.classList.add('open');
  }

  function closeFeatureModal(){
    document.getElementById('class-feature-modal')?.classList.remove('open');
  }

  window.openClassFeatureModal = openFeatureModal;
  window.closeClassFeatureModal = closeFeatureModal;
  window.WOT_CLASS_FEATURES_INDEX = {
    byId: id => db.features.find(f => String(f.id) === String(id)),
    byName: name => db.features.filter(f => norm(f.feature) === norm(name)),
    search: q => db.features.filter(f => norm([f.feature,f.description,f.className,f.archetype].join(' ')).includes(norm(q)))
  };

  function wireStaticEvents(){
    $('archetype-filter').addEventListener('change', e => { state.archetype = e.target.value; renderContentOnly(); });
    $('level-filter').addEventListener('change', e => { state.level = e.target.value; renderContentOnly(); });
    $('class-search').addEventListener('input', e => { state.q = e.target.value; renderContentOnly(); });
    $('class-reset').addEventListener('click', () => { state.archetype='all'; state.level='all'; state.q=''; renderAll(); });
    document.addEventListener('click', e => {
      const btn = e.target.closest('.feature-more');
      if(btn) openFeatureModal(btn.dataset.featureId);
    });
    document.addEventListener('click', e => {
      const link = e.target.closest('.class-local-nav a[href^="#"], .sidebar-toc-link[href^="#"]');
      if(!link) return;
      const href = link.getAttribute('href');
      if(!href || href === '#') return;
      const target = document.querySelector(href);
      if(!target) return;
      e.preventDefault();
      target.scrollIntoView({behavior:'smooth', block:'start'});
      history.replaceState(null, '', href);
      document.querySelectorAll('.class-local-nav a').forEach(a => a.classList.toggle('active', a.getAttribute('href') === href));
    });
    document.addEventListener('keydown', e => { if(e.key === 'Escape') closeFeatureModal(); });
  }

  function renderContentOnly(){
    renderBaseFeatures();
    renderArchetypes();
    renderAllFeatures();
  }

  function renderAll(){
    renderClassTabs();
    renderHero();
    renderFilters();
    renderProgression();
    renderContentOnly();
  }

  renderAll();
  wireStaticEvents();
})();
