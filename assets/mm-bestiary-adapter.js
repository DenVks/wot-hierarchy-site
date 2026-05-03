// Monster Manual 5e adapter for WoT Hierarchy v80.
// Depends on window.MM_BESTIARY from assets/mm-monsters-data.js.
(function(){
  const root = window.MM_BESTIARY || {articles:[], statblocks:[]};
  const articles = Array.isArray(root.articles) ? root.articles : [];
  const statblocks = Array.isArray(root.statblocks) ? root.statblocks : [];
  const byArticle = new Map(articles.map(a => [String(a.title || '').trim(), a]));
  const STRUCT_CACHE = new Map();

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
  function cleanLine(v){ return String(v || '').replace(/\s+/g, ' ').trim(); }
  function normalizeDice(v){ return String(v || '').replace(/d/gi,'к').replace(/\s+/g,'').replace(/[–—−]/g,'-'); }
  function statMod(v){
    const n = Number(v || 10);
    const r = Math.floor((n - 10) / 2);
    return (r >= 0 ? '+' : '') + r;
  }
  function abilityKey(label){
    const s = String(label || '').toUpperCase();
    if(s.includes('СИЛ')) return 'str';
    if(s.includes('ЛОВ')) return 'dex';
    if(s.includes('ТЕЛ')) return 'con';
    if(s.includes('ИНТ')) return 'int';
    if(s.includes('МДР') || s.includes('МУД')) return 'wis';
    if(s.includes('ХАР')) return 'cha';
    return null;
  }
  function abilityLabel(key){
    return {str:'СИЛ',dex:'ЛОВ',con:'ТЕЛ',int:'ИНТ',wis:'МДР',cha:'ХАР'}[key] || key;
  }
  function normalizeStatText(text){
    return String(text || '')
      .replace(/\r/g,'')
      .replace(/[–—−]/g,'−')
      .replace(/Сл\s+/gi,'СЛ ')
      .replace(/Класс\s+Доспеха/gi,'Класс Доспеха')
      .replace(/\n{3,}/g,'\n\n')
      .trim();
  }

  function extractAbilities(text){
    const result = {str:10,dex:10,con:10,int:10,wis:10,cha:10};
    const block = String(text || '').match(/СИЛ\s*\n\s*ЛОВ\s*\n\s*ТЕЛ\s*\n\s*ИНТ\s*\n\s*МДР\s*\n\s*ХАР\s*\n([\s\S]*?)(?:\nСпасброски|\nНавыки|\nУязвимость|\nСопротивление|\nИммунитет|\nЧувства|\nЯзыки|\nОпасность)/i);
    if(!block) return result;
    const nums = [...block[1].matchAll(/(\d+)\s*\(\s*[+−\-]?\d+\s*\)/g)].map(m => parseInt(m[1],10));
    ['str','dex','con','int','wis','cha'].forEach((k,i)=>{ if(Number.isFinite(nums[i])) result[k]=nums[i]; });
    return result;
  }
  function extractLine(text, label, stopLabels){
    const stops = stopLabels || ['Спасброски','Навыки','Уязвимость к урону','Сопротивление к урону','Сопротивления к урону','Иммунитет к урону','Иммунитеты к урону','Иммунитет к состоянию','Иммунитеты к состоянию','Чувства','Языки','Опасность'];
    const stop = stops.filter(x => x !== label).map(x => x.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')).join('|');
    const re = new RegExp('(?:^|\\n)' + label.replace(/[.*+?^${}()|[\]\\]/g,'\\$&') + '\\s+([\\s\\S]*?)(?=\\n(?:' + stop + ')\\s+|\\nОпасность|$)', 'i');
    const m = String(text || '').match(re);
    return m ? cleanLine(m[1]) : '';
  }
  function beforeDanger(text){
    const idx = String(text || '').search(/\nОпасность\s+[^\n]+/i);
    return idx >= 0 ? String(text).slice(0, idx) : String(text || '');
  }
  function baseFields(stat, text){
    const header = beforeDanger(text);
    return {
      saves: extractLine(header, 'Спасброски'),
      skills: extractLine(header, 'Навыки'),
      vuln: extractLine(header, 'Уязвимость к урону') || extractLine(header, 'Уязвимости к урону'),
      res: extractLine(header, 'Сопротивление к урону') || extractLine(header, 'Сопротивления к урону'),
      idmg: extractLine(header, 'Иммунитет к урону') || extractLine(header, 'Иммунитеты к урону'),
      ics: extractLine(header, 'Иммунитет к состоянию') || extractLine(header, 'Иммунитеты к состоянию'),
      senses: extractLine(header, 'Чувства'),
      languages: extractLine(header, 'Языки')
    };
  }
  function afterDanger(text){
    const idx = String(text || '').search(/\nОпасность\s+[^\n]+/i);
    if(idx < 0) return '';
    const rest = String(text).slice(idx).replace(/^\n?Опасность\s+[^\n]+\n?/i,'');
    return rest.trim();
  }
  function splitSections(rest){
    const headings = [
      'Действия', 'Бонусные действия', 'Реакции', 'Легендарные действия',
      'Действия логова', 'Региональные эффекты', 'Описание'
    ];
    const positions = [];
    headings.forEach(h => {
      const re = new RegExp('(?:^|\\n)' + h.replace(/[.*+?^${}()|[\]\\]/g,'\\$&') + '\\s*(?:\\n|$)', 'i');
      const m = rest.match(re);
      if(m) positions.push({h, idx:m.index + (m[0].startsWith('\n') ? 1 : 0), len:h.length});
    });
    positions.sort((a,b)=>a.idx-b.idx);
    const sec = {traits:''};
    if(!positions.length){ sec.traits = rest.trim(); return sec; }
    sec.traits = rest.slice(0, positions[0].idx).trim();
    positions.forEach((p,i)=>{
      const start = p.idx + p.len;
      const end = positions[i+1]?.idx ?? rest.length;
      sec[p.h] = rest.slice(start, end).replace(/^\s+/, '').trim();
    });
    return sec;
  }
  function splitEntries(sectionText){
    const text = String(sectionText || '').trim();
    if(!text) return [];
    const matches = [];
    const re = /(^|\n)([А-ЯЁA-Z][^\.\n]{1,90})\.\s+/g;
    let m;
    while((m = re.exec(text))){
      const name = cleanLine(m[2]);
      if(/^(Класс Доспеха|Хиты|Скорость|СИЛ|ЛОВ|ТЕЛ|ИНТ|МДР|ХАР|Спасброски|Навыки|Чувства|Языки|Опасность)$/i.test(name)) continue;
      matches.push({name, start:m.index + m[1].length, bodyStart:re.lastIndex});
    }
    if(!matches.length) return [{n:'Текст раздела', d:cleanLine(text), raw:text}];
    return matches.map((it,i)=>{
      const end = matches[i+1]?.start ?? text.length;
      const d = cleanLine(text.slice(it.bodyStart, end));
      return {n:it.name, d, raw:text.slice(it.start,end).trim()};
    }).filter(x => x.n || x.d);
  }
  function attackTypeFromText(text){
    const s = String(text || '').toLowerCase();
    const types = [];
    [['руб','Руб.'],['кол','Кол.'],['дроб','Дроб.'],['огн','Огонь'],['холод','Холод'],['кислот','Кисл.'],['яд','Яд'],['электр','Молния'],['молн','Молния'],['излуч','Излуч.'],['некрот','Некрот.'],['псих','Псих.'],['силов','Сил.'],['звук','Звук']].forEach(([needle,label])=>{ if(s.includes(needle) && !types.includes(label)) types.push(label); });
    return types.slice(0,3).join('/') || 'Особ.';
  }
  function rangeFromText(text){
    const s = String(text || '');
    const parts = [];
    const reach = s.match(/досягаемость\s+([^,.]+(?:фт\.?|м))/i);
    if(reach) parts.push('дос. ' + cleanLine(reach[1]));
    const dist = s.match(/дистанц(?:ия|ии)\s+([^,.]+(?:фт\.?|м|\)|$))/i);
    if(dist) parts.push('дист. ' + cleanLine(dist[1]));
    const cone = s.match(/(\d+)\s*-?футов(?:ым|ый)?\s+конус/i);
    if(cone) parts.push('конус ' + cone[1] + ' фт');
    const line = s.match(/лини(?:ю|я)\s+(?:длиной\s+)?(\d+)\s*фт/i);
    if(line) parts.push('линия ' + line[1] + ' фт');
    const radius = s.match(/радиус(?:ом|е)?\s+(\d+)\s*фт/i);
    if(radius) parts.push('радиус ' + radius[1] + ' фт');
    return parts.join(' / ') || '—';
  }
  function diceFromText(text){
    const found = [...String(text || '').matchAll(/\((\d+\s*к\s*\d+\s*(?:[+\-−]\s*\d+)?)\)/gi)].map(m => normalizeDice(m[1]));
    if(!found.length) return {dice:'', bonus:0, dmg:'—'};
    const parts = [];
    let bonus = 0;
    found.forEach(f => {
      const m = f.match(/^(\d+к\d+)([+\-−]\d+)?$/);
      if(m){ parts.push(m[1]); if(m[2]) bonus += parseInt(m[2].replace('−','-'),10) || 0; }
      else parts.push(f);
    });
    const dice = parts.join('+');
    const avg = String(text || '').match(/(?:Попадание:|получает|получая|Провал:)\s*[^\d]*(\d+)\s*\(/i)?.[1] || '';
    return {dice, bonus, dmg: avg ? `${avg} (${found.join(' + ')})` : found.join(' + ')};
  }
  function saveFromText(text){
    const s = String(text || '');
    const m = s.match(/спасбросок\s+([А-ЯЁа-яё\s()]+?)\s+(?:со\s+)?СЛ\s*(\d+)/i);
    if(!m) return null;
    return {ability:cleanLine(m[1]).replace(/\s*\([^)]*\)/g,''), dc:m[2]};
  }
  function actionMeta(entry){
    const raw = entry.raw || `${entry.n}. ${entry.d}`;
    const atk = raw.match(/([+−\-]\d+)\s+к\s+попаданию/i);
    const dice = diceFromText(raw);
    const sv = saveFromText(raw);
    const isMulti = /^Мультиатака$/i.test(entry.n);
    let a = '—';
    if(atk) a = atk[1].replace('−','-');
    else if(sv) a = `СЛ ${sv.dc}`;
    else if(/перезарядка/i.test(entry.n + ' ' + entry.d)) a = (entry.n + ' ' + entry.d).match(/перезарядка\s*[^).]+/i)?.[0].replace(/^./, c=>c.toUpperCase()) || 'Перез.';
    return {
      n: entry.n,
      a,
      d: isMulti ? entry.d : dice.dmg,
      t: sv ? sv.ability : attackTypeFromText(raw),
      r: rangeFromText(raw),
      no: `${entry.n}. ${entry.d}`,
      dice: dice.dice,
      bonus: dice.bonus,
      sv: Boolean(sv) || (!atk && !dice.dice),
      isMulti
    };
  }
  function parseStatblock(stat, index){
    if(STRUCT_CACHE.has(index)) return STRUCT_CACHE.get(index);
    const text = normalizeStatText(stat.text || '');
    const fields = baseFields(stat, text);
    const rest = afterDanger(text);
    const sections = splitSections(rest);
    const traits = splitEntries(sections.traits).filter(e => e.d).map(e => ({n:e.n, d:e.d, raw:e.raw}));
    const actions = splitEntries(sections['Действия']).filter(e => e.d).map(actionMeta);
    const bonusActions = splitEntries(sections['Бонусные действия']).filter(e => e.d).map(actionMeta);
    const reactions = splitEntries(sections['Реакции']).filter(e => e.d).map(e => ({n:e.n, d:e.d, raw:e.raw}));
    const legendary = splitEntries(sections['Легендарные действия']).filter(e => e.d).map(e => ({n:e.n, d:e.d, raw:e.raw}));
    const lair = splitEntries(sections['Действия логова']).filter(e => e.d).map(e => ({n:e.n, d:e.d, raw:e.raw}));
    const regional = splitEntries(sections['Региональные эффекты']).filter(e => e.d).map(e => ({n:e.n, d:e.d, raw:e.raw}));
    const abilities = extractAbilities(text);
    const parsed = {text, fields, abilities, traits, actions, bonusActions, reactions, legendary, lair, regional, sections};
    STRUCT_CACHE.set(index, parsed);
    return parsed;
  }
  function formatBlockText(text){
    const parts = String(text || '').split(/\n{2,}/).map(x => x.trim()).filter(Boolean);
    if(parts.length <= 1){
      return '<pre class="mm-pre">' + esc(text) + '</pre>';
    }
    return parts.map(p => '<p>' + esc(p).replace(/\n/g, '<br>') + '</p>').join('');
  }
  function structuredList(items, cls){
    if(!items || !items.length) return '<div class="mm-empty">Нет данных.</div>';
    return `<div class="mm-structured-list ${cls||''}">${items.map(x=>`<div class="mm-structured-card"><h4>${esc(x.n)}</h4><p>${esc(x.d || x.no || '')}</p></div>`).join('')}</div>`;
  }
  function structuredActions(items){
    if(!items || !items.length) return '<div class="mm-empty">Нет данных.</div>';
    return `<div class="mm-structured-list mm-action-list">${items.map(a=>`<div class="mm-structured-card"><h4>${esc(a.n)}${a.a && a.a !== '—' ? ` <span class="anomaly-pill">${esc(a.a)}</span>` : ''}</h4><div class="anomaly-card-meta"><span class="anomaly-pill">${esc(a.t || 'Особ.')}</span><span class="anomaly-pill">${esc(a.r || '—')}</span>${a.d && a.d !== '—' ? `<span class="anomaly-pill">Урон ${esc(a.d)}</span>` : ''}</div><p>${esc(a.no || a.d || '')}</p></div>`).join('')}</div>`;
  }
  function defenseRows(s, p){
    const f = p.fields;
    const rows = [
      ['Класс Доспеха', s.ac || '—'], ['Хиты', s.hp || '—'], ['Скорость', s.speed || '—'],
      ['Спасброски', f.saves || '—'], ['Навыки', f.skills || '—'], ['Уязвимости к урону', f.vuln || '—'],
      ['Сопротивления к урону', f.res || '—'], ['Иммунитеты к урону', f.idmg || '—'], ['Иммунитеты к состояниям', f.ics || '—'],
      ['Чувства', f.senses || '—'], ['Языки', f.languages || '—'], ['Опасность', s.cr || '—']
    ];
    return `<table class="mm-defense-table"><tbody>${rows.map(([k,v])=>`<tr><th>${esc(k)}</th><td>${esc(v)}</td></tr>`).join('')}</tbody></table>`;
  }
  function abilitiesGrid(abilities){
    return `<div class="stats-grid mm-abilities-grid">${['str','dex','con','int','wis','cha'].map(k=>`<div class="stat-box"><div class="stat-name">${abilityLabel(k)}</div><div class="stat-val">${abilities[k]}</div><div class="stat-mod">${statMod(abilities[k])}</div></div>`).join('')}</div>`;
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
    const p = parseStatblock(s, index);
    const img = imageForStat(s);
    const bonusBlock = p.bonusActions.length ? `<h3>Бонусные действия</h3>${structuredActions(p.bonusActions)}` : '';
    const reactionBlock = p.reactions.length ? `<h3>Реакции</h3>${structuredList(p.reactions,'mm-reactions')}` : '';
    const legendaryBlock = p.legendary.length ? `<h3>Легендарные действия</h3>${structuredList(p.legendary,'mm-legendary')}` : '';
    const lairBlock = p.lair.length ? `<h3>Действия логова</h3>${structuredList(p.lair,'mm-lair')}` : '';
    const regionalBlock = p.regional.length ? `<h3>Региональные эффекты</h3>${structuredList(p.regional,'mm-regional')}` : '';
    return `<article class="anomaly-detail-article mm-detail mm-structured-detail">
      <div class="mm-detail-head">
        ${img ? `<img src="${esc(img)}" alt="${esc(s.name)}" class="mm-detail-image">` : ''}
        <div><h2>${esc(s.name)}</h2><div class="anomaly-card-meta"><span class="anomaly-pill">Monster Manual 5e</span><span class="anomaly-pill">CR ${esc(crLabel(s.cr))}</span><span class="anomaly-pill">КД ${esc(s.ac || '—')}</span><span class="anomaly-pill">ОЗ ${esc(s.hp || '—')}</span><span class="anomaly-pill">стр. ${esc(s.page || '—')}</span></div><p>${esc(s.type || '')}</p></div>
      </div>
      <div class="anomaly-card-actions"><a class="anomaly-action primary" href="monsters-battle.html?monster=${encodeURIComponent(statId(index))}">В бой</a></div>
      <h3>Основные параметры</h3>${defenseRows(s,p)}
      <h3>Характеристики</h3>${abilitiesGrid(p.abilities)}
      <h3>Черты</h3>${structuredList(p.traits,'mm-traits')}
      <h3>Атаки и действия</h3>${structuredActions(p.actions)}
      ${bonusBlock}${reactionBlock}${legendaryBlock}${lairBlock}${regionalBlock}
      <details class="mm-raw-details"><summary>Сырой статблок</summary><div class="mm-stat-text">${formatBlockText(s.text || '')}</div></details>
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
    return statblocks.map((s, i) => {
      const p = parseStatblock(s, i);
      const actions = [...p.actions, ...p.bonusActions.map(a => ({...a, n:'Бонусное действие: ' + a.n}))];
      return {
        id: statId(i), source: 'mm5e', z: 'mm5e', cr: crLabel(s.cr), crN: crValue(s.cr), xp: String(s.cr || '').match(/\(([^)]*)\)/)?.[1] || '',
        nm: s.name || 'Monster Manual creature', en: 'Monster Manual 5e', ly: `Monster Manual 5e · ${s.article || 'статблок'}`, sz: s.type || 'существо',
        st: p.abilities,
        hp: firstNumber(s.hp, 1), hpF: s.hp || '', ac: firstNumber(s.ac, 10), acN: s.ac || '', spd: s.speed || '—', ini: statMod(p.abilities.dex), pp: passive(s.text),
        sv: p.fields.saves || '—', sk: p.fields.skills || '—', res: p.fields.res || '—', idmg: p.fields.idmg || '—', ics: p.fields.ics || '—', sn: p.fields.senses || '—', lng: p.fields.languages || '—',
        tr: p.traits.length ? p.traits.map(t => ({n:t.n, d:t.d, hi:/сопротивление|иммунитет|регенерац|магическ|врождённое|колдовство|тактика стаи|легендар/i.test(t.n + ' ' + t.d)})) : [{n:'Статблок не структурирован', d:'Автоматический разбор не нашёл отдельных черт. Используйте сырой текст в контр-механике.', hi:true}],
        at: actions.length ? actions : [{n:'Полный статблок',a:'—',d:'—',t:'Особ.',r:'—',no:s.text || '',dice:'',bonus:0,sv:true}],
        re: p.reactions.map(r => ({n:r.n, d:r.d})),
        la: p.legendary.length ? p.legendary.map(l => ({n:l.n, d:l.d})) : null, laC: p.legendary.length ? 3 : 0,
        km: `Классический монстр 5e. Статья: ${s.article || '—'}, стр. ${s.page || '—'}. Данные автоматически структурированы из исходного статблока; спорные формулировки сверяйте с оригинальным источником.`,
        desc: s.text || '', img: imageForStat(s)
      };
    });
  }
  window.MM_ADAPTER = {
    articles, statblocks, articleCard, statCard, articleDetail, statDetail,
    typeOptions, crOptions, buildBattleMonsters, statId, articleId, crLabel, crValue, esc,
    parseStatblock
  };
})();
