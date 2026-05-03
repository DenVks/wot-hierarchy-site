// Monster Manual 5e adapter for WoT Hierarchy v77.
// Depends on window.MM_BESTIARY from assets/mm-monsters-data.js.
(function(){
  const root = window.MM_BESTIARY || {articles:[], statblocks:[]};
  const articles = Array.isArray(root.articles) ? root.articles : [];
  const statblocks = Array.isArray(root.statblocks) ? root.statblocks : [];
  const byArticle = new Map(articles.map(a => [String(a.title || '').trim(), a]));

  function esc(v){
    return String(v == null ? '' : v).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  }
  function crValue(cr){
    const raw = String(cr || '').trim().split(/\s+/)[0];
    if(!raw) return 0;
    if(raw.includes('/')){
      const [a,b] = raw.split('/').map(Number);
      return b ? a / b : 0;
    }
    const n = parseFloat(raw.replace(',', '.'));
    return Number.isFinite(n) ? n : 0;
  }
  function crLabel(cr){
    return String(cr || '—').replace(/\s*\([^)]*\)/g, '').trim() || '—';
  }
  function firstNumber(v, fallback){
    const m = String(v || '').match(/\d+/);
    return m ? parseInt(m[0], 10) : fallback;
  }
  function passive(text){
    const m = String(text || '').match(/пассивная\s+Внимательность\s+(\d+)/i);
    return m ? parseInt(m[1], 10) : 10;
  }
  function statId(index){ return 'mm-' + index; }
  function articleId(index){ return 'mm-article-' + index; }
  function articleForStat(stat){ return byArticle.get(String(stat.article || '').trim()) || null; }
  function imageForStat(stat){ return articleForStat(stat)?.image || ''; }
  function normalizeSearch(v){ return String(v || '').toLowerCase(); }
  function formatBlockText(text){
    const parts = String(text || '').split(/\n{2,}/).map(x => x.trim()).filter(Boolean);
    if(parts.length <= 1){
      return '<pre class="mm-pre">' + esc(text) + '</pre>';
    }
    return parts.map(p => '<p>' + esc(p).replace(/\n/g, '<br>') + '</p>').join('');
  }
  function articleCard(article, index){
    const statCount = Array.isArray(article.statblocks) ? article.statblocks.length : statblocks.filter(s => s.article === article.title).length;
    const page = article.page_end && article.page_end !== article.page ? `${article.page}–${article.page_end}` : article.page;
    return `<article class="mm-card mm-article-card" data-mm-article="${index}" data-search="${esc(normalizeSearch(article.title + ' ' + (article.text || '')))}">
      <div class="mm-thumb">${article.image ? `<img src="${esc(article.image)}" alt="${esc(article.title)}" loading="lazy">` : '<span>MM</span>'}</div>
      <div class="mm-card-body">
        <div class="anomaly-card-kicker">Monster Manual 5e · статья</div>
        <h3 class="anomaly-card-title">${esc(article.title)}</h3>
        <p class="mm-card-text">Стр. ${esc(page)} · статблоков: ${statCount}</p>
        <div class="anomaly-card-actions"><button class="anomaly-action" data-mm-open-article="${index}">Открыть статью</button></div>
      </div>
    </article>`;
  }
  function statCard(stat, index){
    const img = imageForStat(stat);
    const type = stat.type || 'существо';
    const cr = crLabel(stat.cr);
    return `<article class="mm-card mm-stat-card" data-mm-stat="${index}" data-cr="${esc(cr)}" data-crn="${crValue(stat.cr)}" data-type="${esc(normalizeSearch(type))}" data-search="${esc(normalizeSearch(stat.name + ' ' + type + ' ' + stat.article + ' ' + stat.text))}">
      <div class="mm-thumb">${img ? `<img src="${esc(img)}" alt="${esc(stat.name)}" loading="lazy">` : '<span>MM</span>'}</div>
      <div class="mm-card-body">
        <div class="anomaly-card-kicker">Monster Manual 5e · статблок</div>
        <h3 class="anomaly-card-title">${esc(stat.name)}</h3>
        <p class="mm-card-text">${esc(type)}</p>
        <div class="anomaly-stat-row"><div class="anomaly-stat"><b>CR</b><span>${esc(cr)}</span></div><div class="anomaly-stat"><b>КД</b><span>${esc(stat.ac || '—')}</span></div><div class="anomaly-stat"><b>ОЗ</b><span>${esc(stat.hp || '—')}</span></div></div>
        <div class="anomaly-card-meta"><span class="anomaly-pill">${esc(stat.speed || '—')}</span><span class="anomaly-pill">стр. ${esc(stat.page || '—')}</span><span class="anomaly-pill">${esc(stat.article || '—')}</span></div>
        <div class="anomaly-card-actions"><button class="anomaly-action" data-mm-open-stat="${index}">Подробнее</button><a class="anomaly-action primary" href="monsters-battle.html?monster=${encodeURIComponent(statId(index))}">В бой</a></div>
      </div>
    </article>`;
  }
  function articleDetail(index){
    const a = articles[index];
    if(!a) return '';
    const page = a.page_end && a.page_end !== a.page ? `${a.page}–${a.page_end}` : a.page;
    const related = statblocks.map((s,i)=>({s,i})).filter(x => x.s.article === a.title);
    return `<article class="anomaly-detail-article mm-detail">
      <div class="mm-detail-head">
        ${a.image ? `<img src="${esc(a.image)}" alt="${esc(a.title)}" class="mm-detail-image">` : ''}
        <div><h2>${esc(a.title)}</h2><div class="anomaly-card-meta"><span class="anomaly-pill">Monster Manual 5e</span><span class="anomaly-pill">стр. ${esc(page)}</span><span class="anomaly-pill">статблоков: ${related.length}</span></div></div>
      </div>
      <div class="mm-detail-text">${formatBlockText(a.text || '')}</div>
      ${related.length ? `<h3>Статблоки статьи</h3><div class="mm-related">${related.map(x=>`<button class="anomaly-action" data-mm-open-stat="${x.i}">${esc(x.s.name)} · CR ${esc(crLabel(x.s.cr))}</button>`).join('')}</div>` : ''}
    </article>`;
  }
  function statDetail(index){
    const s = statblocks[index];
    if(!s) return '';
    const img = imageForStat(s);
    return `<article class="anomaly-detail-article mm-detail">
      <div class="mm-detail-head">
        ${img ? `<img src="${esc(img)}" alt="${esc(s.name)}" class="mm-detail-image">` : ''}
        <div><h2>${esc(s.name)}</h2><div class="anomaly-card-meta"><span class="anomaly-pill">Monster Manual 5e</span><span class="anomaly-pill">CR ${esc(crLabel(s.cr))}</span><span class="anomaly-pill">КД ${esc(s.ac || '—')}</span><span class="anomaly-pill">ОЗ ${esc(s.hp || '—')}</span><span class="anomaly-pill">стр. ${esc(s.page || '—')}</span></div><p>${esc(s.type || '')}</p></div>
      </div>
      <div class="anomaly-card-actions"><a class="anomaly-action primary" href="monsters-battle.html?monster=${encodeURIComponent(statId(index))}">В бой</a></div>
      <div class="mm-stat-text">${formatBlockText(s.text || '')}</div>
    </article>`;
  }
  function typeOptions(){
    const set = new Set();
    statblocks.forEach(s => {
      const type = String(s.type || '').split(',')[0].trim();
      if(type) set.add(type);
    });
    return [...set].sort((a,b)=>a.localeCompare(b,'ru'));
  }
  function crOptions(){
    const values = new Map();
    statblocks.forEach(s => values.set(crLabel(s.cr), crValue(s.cr)));
    return [...values.entries()].sort((a,b)=>a[1]-b[1]).map(([label])=>label);
  }
  function buildBattleMonsters(){
    return statblocks.map((s, i) => ({
      id: statId(i), source: 'mm5e', z: 'mm5e', cr: crLabel(s.cr), crN: crValue(s.cr), xp: String(s.cr || '').match(/\(([^)]*)\)/)?.[1] || '',
      nm: s.name || 'Monster Manual creature', en: 'Monster Manual 5e', ly: `Monster Manual 5e · ${s.article || 'статблок'}`, sz: s.type || 'существо',
      st: {str:10,dex:10,con:10,int:10,wis:10,cha:10},
      hp: firstNumber(s.hp, 1), hpF: s.hp || '', ac: firstNumber(s.ac, 10), acN: s.ac || '', spd: s.speed || '—', ini: '—', pp: passive(s.text),
      sv: 'см. полный статблок', sk: 'см. полный статблок', res: '', idmg: '', ics: '', sn: '', lng: '',
      tr: [{n:'Полный статблок Monster Manual 5e', d:s.text || ''}],
      at: [], re: [], la: null, laC: 0,
      km: `Классический монстр 5e. Статья: ${s.article || '—'}, стр. ${s.page || '—'}.`,
      desc: s.text || '', img: imageForStat(s)
    }));
  }
  window.MM_ADAPTER = {articles, statblocks, articleCard, statCard, articleDetail, statDetail, typeOptions, crOptions, buildBattleMonsters, statId, articleId, crLabel, crValue, esc};
})();
