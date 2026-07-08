
(function(){
  'use strict';
  const DATA = window.WOT_KEEPERS_DATA || {};
  const POIS = window.WOT_KEEPERS_POIS || [];
  const $ = id => document.getElementById(id);
  const esc = v => String(v ?? '').replace(/[&<>'"]/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[ch]));
  const norm = v => String(v || '').toLowerCase().replace(/ё/g,'е');
  const labelMap = {
    name:'Название', post:'Пост', age:'Возраст', gender:'Пол', faction:'Фракция', stance:'Позиция', desc:'Описание', goal:'Цель', secret:'Секрет', hooks:'Зацепки', hook:'Зацепка', lever:'Рычаги', pair:'Связь', type:'Тип', tension:'Напряжение', use:'Использование', tag:'Тег', role:'Роль', size:'Размер', leader:'Руководитель', location:'Локация', district:'Район', public:'Публично', hidden:'Скрыто', controller:'Контролёр', security:'Безопасность', scene:'Сцена', trigger:'Триггер', steps:'Шаги', failure:'Провал', play:'Игра за столом', group:'Группа', attitude:'Отношение', pressure:'Давление', force:'Сила', official:'Официально', real:'Реально', npc:'NPC', year:'Год', publicScope:'Публичный охват', hiddenScope:'Скрытый охват', controllers:'Контролёры', instruments:'Инструменты', limits:'Ограничения', domain:'Домен', ring:'Кольцо', range:'Диапазон', authority:'Полномочия', risk:'Риск', class:'Класс', meaning:'Смысл', guildUse:'Использование Гильдией', level:'Уровень', title:'Заголовок', who:'Кто', crystal:'Кристалл', receives:'Получает', energyCost:'Цена энергии', serviceObligation:'Служебная обязанность', risks:'Риски', permissions:'Полномочия', gameUse:'Использование в игре', action:'Действие', citizen:'Гражданин', r1:'Ранг I', r2:'Ранг II', r3:'Ранг III', r4:'Ранг IV', r5:'Ранг V', public:'Публично', real:'Реально', sign:'Признак', symptoms:'Симптомы', code:'Код', zone:'Зона', distance:'Дистанция', status:'Статус', rating:'Опасность', lore:'Лор', access:'Доступ', curator:'Куратор', known:'Известно', outside:'Внешний контур', inside:'Внутренний контур', checks:'Проверки', value:'Ценность', threats:'Угрозы', protocol:'Протокол', competitors:'Конкуренты', find:'Находки', extractionCost:'Цена извлечения', threatPassport:'Паспорт угрозы', countermeasures:'Контрмеры', evacuation:'Эвакуация', dangerRating:'Рейтинг опасности', isAnomaly:'Аномалия', anomalyRating:'R-рейтинг', archDanger:'АРХ-опасность', difficultyLevel:'Уровень сложности', difficultyScale:'Шкала', siteClass:'Класс PoI', siteClassLabel:'Класс PoI', siteClassDesc:'Описание класса PoI', icon:'Иконка', sub:'Подзаголовок', body:'Текст', motive:'Мотив', knows:'Знает', superior:'Начальник'
  };
  function label(k){ return labelMap[k] || k; }
  function valueHtml(v){
    if(Array.isArray(v)) return '<ul>' + v.map(x => '<li>' + valueHtml(x) + '</li>').join('') + '</ul>';
    if(v && typeof v === 'object') return '<div class="keeper-subkv">' + Object.entries(v).map(([k,val]) => '<div><b>'+esc(label(k))+':</b> '+valueHtml(val)+'</div>').join('') + '</div>';
    if(v === true) return 'да'; if(v === false) return 'нет'; if(v === null || v === undefined) return '—';
    return esc(v);
  }
  function titleOf(o, fallback){ return o.name || o.title || o.pair || o.group || o.force || o.domain || o.ring || o.level || o.type || o.code || fallback || 'Запись'; }
  function subOf(o){ return o.post || o.tag || o.status || o.range || o.distance || o.role || o.faction || o.rating || o.type || ''; }
  function card(o, idx, kind){
    const entries = Object.entries(o).filter(([k]) => !['color','key'].includes(k));
    return '<article class="keeper-card '+esc(kind||'')+'">' +
      '<div class="keeper-card-head"><div><span class="panel-kicker">'+esc(kind || 'Запись')+'</span><h4>'+esc(titleOf(o, 'Запись '+(idx+1)))+'</h4>'+(subOf(o)?'<p>'+esc(subOf(o))+'</p>':'')+'</div></div>' +
      '<div class="keeper-kv-grid">' + entries.map(([k,v]) => '<div class="keeper-kv"><b>'+esc(label(k))+'</b><span>'+valueHtml(v)+'</span></div>').join('') + '</div></article>';
  }
  function tableFromRows(rows){
    if(!rows.length) return '';
    const keys = Array.from(new Set(rows.flatMap(o => Object.keys(o))));
    return '<div class="keeper-table-wrap"><table class="data-table keeper-data-table"><thead><tr>' + keys.map(k=>'<th>'+esc(label(k))+'</th>').join('') + '</tr></thead><tbody>' +
      rows.map(o => '<tr>' + keys.map(k => '<td>'+valueHtml(o[k])+'</td>').join('') + '</tr>').join('') + '</tbody></table></div>';
  }
  const sections = [
    ['overview','Обзор'],['coverage','Охват'],['coverageRings','Кольца охвата'],['ranks','Ранги'],['crystalMechanics','Кристаллы'],['drainModes','Дренаж'],['rankPermissions','Матрица полномочий'],['council','Совет Девяти'],['relations','Связи'],['divisions','Отделы'],['affiliates','Аффилиаты'],['operatives','Оперативники'],['locations','Локации'],['protocols','Протоколы'],['social','Социальные группы'],['external','Внешние силы'],['timeline','Хронология'],['hooks','Сюжетные крючки'],['rumors','Слухи'],['poiBridge','Классы PoI']
  ];
  function renderOverview(){
    const host = $('keeper-overview'); if(!host) return;
    const dataCount = Object.values(DATA).reduce((n,v)=> n + (Array.isArray(v)?v.length:0), 0);
    host.innerHTML = '<div class="keeper-summary-grid">' +
      '<div class="keeper-summary"><b>'+esc(dataCount)+'</b><span>записей по Гильдии</span></div>' +
      '<div class="keeper-summary"><b>'+esc(POIS.length)+'</b><span>PoI и археонаходок</span></div>' +
      '<div class="keeper-summary"><b>AS / HY / OP / AR</b><span>классы объектов</span></div>' +
      '<div class="keeper-summary"><b>R7–R10 / АРХ</b><span>шкалы угроз</span></div>' +
      '</div><div class="alert-line"><strong>Статус:</strong> закрытый DM-раздел. Данные встроены в страницу сайта нативно: без iframe и без перехода на отдельные самостоятельные HTML-модули.</div>';
  }
  function renderDataSections(){
    const nav = $('keeper-section-tabs'); const host = $('keeper-sections'); if(!nav||!host) return;
    nav.innerHTML = sections.map(([key,title],i)=>'<button type="button" class="keeper-tab '+(i===0?'active':'')+'" data-section="'+esc(key)+'">'+esc(title)+' <small>'+(Array.isArray(DATA[key])?DATA[key].length:'')+'</small></button>').join('') + '<button type="button" class="keeper-tab" data-section="poi">Каталог PoI <small>'+POIS.length+'</small></button>';
    host.innerHTML = sections.map(([key,title],i)=>{
      const arr = DATA[key] || [];
      let content = '';
      if(!arr.length) content = '<p class="class-empty">Нет данных в источнике.</p>';
      else if(key === 'rankPermissions') content = tableFromRows(arr);
      else if(typeof arr[0] === 'string') content = '<div class="keeper-card-grid">' + arr.map((x,idx)=>card({title:'Слух '+(idx+1), body:x}, idx, title)).join('') + '</div>';
      else content = '<div class="keeper-card-grid">' + arr.map((x,idx)=>card(x, idx, title)).join('') + '</div>';
      return '<section class="keeper-section-panel '+(i===0?'active':'')+'" data-section-panel="'+esc(key)+'"><div class="class-panel-head"><div><span class="panel-kicker">Гильдия Хранителей</span><h3>'+esc(title)+'</h3></div><p>Записи из структурированного DM-модуля.</p></div>'+content+'</section>';
    }).join('') + '<section class="keeper-section-panel" data-section-panel="poi"><div id="keeper-poi-native"></div></section>';
    nav.addEventListener('click', e => {
      const btn=e.target.closest('[data-section]'); if(!btn) return;
      const id=btn.dataset.section;
      nav.querySelectorAll('.keeper-tab').forEach(b=>b.classList.toggle('active', b===btn));
      host.querySelectorAll('.keeper-section-panel').forEach(p=>p.classList.toggle('active', p.dataset.sectionPanel===id));
      if(id==='poi') renderPOI();
    });
  }
  const poiState = {q:'', ring:'all', cls:'all'};
  function unique(vals){return Array.from(new Set(vals.filter(Boolean))).sort((a,b)=>String(a).localeCompare(String(b),'ru'));}
  function renderPOI(){
    const host=$('keeper-poi-native'); if(!host || host.dataset.ready) return; host.dataset.ready='1';
    const rings=unique(POIS.map(p=>p.ring)); const classes=unique(POIS.map(p=>p.siteClassLabel||p.siteClass));
    host.innerHTML = '<div class="class-panel-head"><div><span class="panel-kicker">Полевой каталог</span><h3>Каталог PoI R7–R10 и археонаходок</h3></div><p>Полный набор карточек, встроенный в стиль сайта.</p></div>'+
      '<div class="keeper-poi-controls"><input id="keeper-poi-search" type="search" placeholder="Поиск по названию, коду, куратору, лору…"><select id="keeper-poi-ring"><option value="all">Все кольца</option>'+rings.map(r=>'<option>'+esc(r)+'</option>').join('')+'</select><select id="keeper-poi-class"><option value="all">Все классы PoI</option>'+classes.map(c=>'<option>'+esc(c)+'</option>').join('')+'</select></div><div id="keeper-poi-count" class="keeper-poi-count"></div><div id="keeper-poi-list" class="keeper-poi-list"></div>';
    $('keeper-poi-search').addEventListener('input', e=>{poiState.q=e.target.value; drawPOI();});
    $('keeper-poi-ring').addEventListener('change', e=>{poiState.ring=e.target.value; drawPOI();});
    $('keeper-poi-class').addEventListener('change', e=>{poiState.cls=e.target.value; drawPOI();});
    drawPOI();
  }
  function drawPOI(){
    const list=$('keeper-poi-list'), count=$('keeper-poi-count'); if(!list) return;
    const rows=POIS.filter(p=>{
      if(poiState.ring!=='all' && p.ring!==poiState.ring) return false;
      if(poiState.cls!=='all' && (p.siteClassLabel||p.siteClass)!==poiState.cls) return false;
      if(poiState.q){ const hay=norm(Object.values(p).join(' ')); if(!hay.includes(norm(poiState.q))) return false; }
      return true;
    });
    count.textContent = rows.length + ' из ' + POIS.length + ' объектов';
    list.innerHTML = rows.map((p,idx)=>'<details class="keeper-poi-card"><summary><span class="keeper-poi-code">'+esc(p.code)+'</span><span><b>'+esc(p.name)+'</b><small>'+esc([p.ring,p.rating,p.siteClassLabel].filter(Boolean).join(' · '))+'</small></span></summary><div class="keeper-kv-grid">'+Object.entries(p).map(([k,v])=>'<div class="keeper-kv"><b>'+esc(label(k))+'</b><span>'+valueHtml(v)+'</span></div>').join('')+'</div></details>').join('');
  }
  renderOverview(); renderDataSections();
})();
