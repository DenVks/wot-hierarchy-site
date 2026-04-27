
(function(){
  'use strict';
  const db = window.WOT_CLASSES_DB || {features:[], progression:[], archetypes:[], meta:{}};
  const $ = id => document.getElementById(id);
  const state = { q:'', className:'all', archetype:'all', level:'all', category:'all' };
  const norm = v => String(v||'').toLowerCase().replace(/ё/g,'е').trim();
  const uniq = arr => Array.from(new Set(arr.filter(Boolean))).sort((a,b)=>String(a).localeCompare(String(b),'ru'));
  const esc = v => String(v??'').replace(/[&<>'"]/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[ch]));
  function fillSelect(el, values, allLabel){
    if(!el) return;
    el.innerHTML = `<option value="all">${allLabel}</option>` + values.map(v=>`<option value="${esc(v)}">${esc(v)}</option>`).join('');
  }
  function levelValues(){
    return uniq(db.features.map(f=>f.levels||'—')).sort((a,b)=>{
      const ai=parseInt(String(a).match(/\d+/)?.[0]||'999',10); const bi=parseInt(String(b).match(/\d+/)?.[0]||'999',10);
      return ai-bi || String(a).localeCompare(String(b),'ru');
    });
  }
  function updateArchetypeOptions(){
    const list = db.features.filter(f=> state.className==='all' || f.className===state.className).map(f=>f.archetype);
    fillSelect($('archetype-filter'), uniq(list), 'Все архетипы');
    $('archetype-filter').value = state.archetype;
    if($('archetype-filter').value !== state.archetype){ state.archetype='all'; $('archetype-filter').value='all'; }
  }
  function init(){
    const stats=$('class-db-stats');
    if(stats){
      stats.innerHTML = [
        ['Классов', db.meta.classesCount || uniq(db.features.map(f=>f.className)).length],
        ['Архетипов', db.meta.archetypesCount || db.archetypes.length],
        ['Черт', db.meta.featuresCount || db.features.length],
        ['Строк прогрессии', db.meta.progressionRows || db.progression.length]
      ].map(([k,v])=>`<div><strong>${v}</strong><span>${k}</span></div>`).join('');
    }
    fillSelect($('class-filter'), uniq(db.features.map(f=>f.className)), 'Все классы');
    fillSelect($('level-filter'), levelValues(), 'Все уровни');
    fillSelect($('category-filter'), uniq(db.features.map(f=>f.category)), 'Все категории');
    fillSelect($('progression-class-filter'), uniq(db.progression.map(p=>p.className)), 'Выбери класс');
    const firstClass = uniq(db.progression.map(p=>p.className))[0] || 'all';
    if($('progression-class-filter')) $('progression-class-filter').value = firstClass;
    updateArchetypeOptions();
    bind();
    renderAll();
  }
  function bind(){
    $('class-search')?.addEventListener('input', e=>{ state.q=e.target.value; renderFeatures(); });
    $('class-filter')?.addEventListener('change', e=>{ state.className=e.target.value; state.archetype='all'; updateArchetypeOptions(); renderAll(); });
    $('archetype-filter')?.addEventListener('change', e=>{ state.archetype=e.target.value; renderFeatures(); renderArchetypes(); });
    $('level-filter')?.addEventListener('change', e=>{ state.level=e.target.value; renderFeatures(); });
    $('category-filter')?.addEventListener('change', e=>{ state.category=e.target.value; renderFeatures(); });
    $('class-reset')?.addEventListener('click', ()=>{ state.q=''; state.className='all'; state.archetype='all'; state.level='all'; state.category='all'; ['class-search','class-filter','level-filter','category-filter'].forEach(id=>{ const el=$(id); if(el) el.value = id==='class-search' ? '' : 'all'; }); updateArchetypeOptions(); renderAll(); });
    $('progression-class-filter')?.addEventListener('change', renderProgression);
    document.querySelectorAll('[data-class-tab]').forEach(btn=>btn.addEventListener('click',()=>{
      document.querySelectorAll('[data-class-tab]').forEach(b=>b.classList.toggle('active', b===btn));
      document.querySelectorAll('[data-class-panel]').forEach(p=>p.classList.toggle('active', p.dataset.classPanel===btn.dataset.classTab));
    }));
    document.addEventListener('click', e=>{ if(e.target.matches('[data-feature-id]')) openFeature(e.target.dataset.featureId); if(e.target.matches('.class-modal-close,.class-modal-backdrop')) closeFeature(); });
    document.addEventListener('keydown', e=>{ if(e.key==='Escape') closeFeature(); });
  }
  function filteredFeatures(){
    const q=norm(state.q);
    return db.features.filter(f=>{
      const blob=norm([f.className,f.archetype,f.category,f.levels,f.feature,f.parent,f.description,f.source].join(' '));
      return (!q || blob.includes(q)) && (state.className==='all'||f.className===state.className) && (state.archetype==='all'||f.archetype===state.archetype) && (state.level==='all'||f.levels===state.level) && (state.category==='all'||f.category===state.category);
    }).sort((a,b)=> (a.className.localeCompare(b.className,'ru') || a.levelSort-b.levelSort || a.archetype.localeCompare(b.archetype,'ru') || a.feature.localeCompare(b.feature,'ru')));
  }
  function renderFeatures(){
    const grid=$('feature-grid'); if(!grid) return;
    const rows=filteredFeatures();
    $('class-feature-count').textContent=rows.length;
    grid.innerHTML = rows.map(f=>`<article class="feature-card ${f.categorySlug}">
      <div class="feature-head"><div><p class="feature-kicker">${esc(f.className)} · ${esc(f.archetype)}</p><h3>${esc(f.feature)}</h3></div><span class="level-pill">${esc(f.levels||'—')}</span></div>
      <div class="feature-tags"><span>${esc(f.category)}</span>${f.parent?`<span>↳ ${esc(f.parent)}</span>`:''}</div>
      <p class="feature-desc">${esc(shortText(f.description, 420))}</p>
      <button type="button" class="feature-open" data-feature-id="${esc(f.id)}">Открыть полностью</button>
    </article>`).join('') || '<div class="empty-state">По выбранным фильтрам ничего не найдено.</div>';
  }
  function shortText(s, n){ s=String(s||'').replace(/\s+/g,' ').trim(); return s.length>n ? s.slice(0,n-1)+'…' : s; }
  function renderProgression(){
    const wrap=$('progression-table-wrap'); if(!wrap) return;
    const cls=$('progression-class-filter')?.value || uniq(db.progression.map(p=>p.className))[0];
    const rows=db.progression.filter(p=>p.className===cls).sort((a,b)=>a.level-b.level);
    wrap.innerHTML = `<table class="class-progression-table"><thead><tr><th>Ур.</th><th>Бонус умения</th><th>Очки репутации</th><th>Черты / особенности</th><th>Дополнительно</th></tr></thead><tbody>${rows.map(r=>`<tr><td>${esc(r.level)}</td><td>${esc(r.profBonus)}</td><td>${esc(r.reputation||'—')}</td><td>${esc(r.features)}</td><td>${esc(r.extra||'—')}</td></tr>`).join('')}</tbody></table>`;
  }
  function renderArchetypes(){
    const grid=$('archetype-grid'); if(!grid) return;
    const rows=db.archetypes.filter(a=>(state.className==='all'||a.className===state.className) && (state.archetype==='all'||a.archetype===state.archetype));
    grid.innerHTML = rows.map(a=>`<article class="archetype-card"><p class="feature-kicker">${esc(a.className)}</p><h3>${esc(a.archetype)}</h3><p>${esc(a.description||'Описание отсутствует в индексе.')}</p><small>${esc(a.source||'')}</small></article>`).join('') || '<div class="empty-state">Архетипы не найдены.</div>';
  }
  function renderAll(){ renderFeatures(); renderProgression(); renderArchetypes(); }
  function openFeature(id){
    const f=db.features.find(x=>String(x.id)===String(id)); if(!f) return;
    let modal=document.getElementById('class-feature-modal');
    if(!modal){ modal=document.createElement('div'); modal.id='class-feature-modal'; modal.className='class-modal-backdrop'; document.body.appendChild(modal); }
    modal.innerHTML = `<div class="class-modal" role="dialog" aria-modal="true"><button class="class-modal-close" type="button">×</button><p class="feature-kicker">${esc(f.className)} · ${esc(f.archetype)} · ${esc(f.levels||'—')}</p><h2>${esc(f.feature)}</h2><div class="feature-tags"><span>${esc(f.category)}</span>${f.parent?`<span>Родитель: ${esc(f.parent)}</span>`:''}<span>${esc(f.source||'Источник')}</span></div><div class="class-modal-text">${paragraphs(f.description)}</div></div>`;
    modal.classList.add('show');
  }
  function paragraphs(s){ return String(s||'').split(/\n+/).map(x=>x.trim()).filter(Boolean).map(p=>`<p>${esc(p)}</p>`).join('') || '<p>Описание отсутствует.</p>'; }
  function closeFeature(){ const m=document.getElementById('class-feature-modal'); if(m) m.classList.remove('show'); }
  init();
})();
