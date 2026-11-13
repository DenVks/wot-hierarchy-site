/* Navigation labels and routes: one owner for the menu and Toolkit overview. */
(function(){
'use strict';
const toolGroups=[
 {id:'run',label:'Проведение',items:[
  {href:'encounter.html',label:'Общая сцена боя',description:'NPC и монстры в одной очереди. Сохранить бой в GitHub и открыть с другого компьютера.',protected:true},
  {href:'dm-npc.html',label:'NPC / Бой',description:'Хиты, состояния, ресурсы и очередь NPC. Продолжить бой, сохранённый в этом браузере.',protected:true},
  {href:'monsters-battle.html',label:'Монстры / Бой',description:'Участники, ход и раунд боя монстров. Восстановить сцену из браузера или импортировать файл.',protected:true}]},
 {id:'prepare',label:'Подготовка',items:[
  {href:'npc-generator.html',label:'Генератор NPC',description:'Собрать и проверить NPC перед переносом в боевой список.',protected:true},
  {href:'encounter-generator.html',label:'Генератор энкаунтеров',description:'Подобрать волну существ для временной аномалии.',protected:true},
  {href:'loot-generator.html',label:'Генератор добычи',description:'Определить ингредиенты и остаток после аномалии или перехода.'}]},
 {id:'environment',label:'Среда',items:[
  {href:'anomaly-dm.html',label:'Временные аномалии',description:'Вести узловую операцию, условия канала и извлечение Пирамидкой.',protected:true},
  {href:'wall-dm.html',label:'Аномальная Стена',description:'Вести переход через зоны Стены и разрешать события пути.',protected:true},
  {href:'storm-belt-dm.html',label:'Штормовая Полоса',description:'Вести морской переход и события Штормовой Полосы.',protected:true}]},
 {id:'reference',label:'Справочники Мастера',items:[
  {href:'monsters.html',label:'Монстры',description:'Найти статблок и особенности существа.',protected:true},
  {href:'keeper-poi-catalog.html',label:'Гильдия Хранителей · DM-модуль',description:'Мастерский каталог объектов, служб и точек интереса Гильдии.',protected:true}]}
];
const groups=[
 {id:'world',label:'Мир',items:[
  {href:'epoch.html',label:'Эпоха · 270 ПБ'},{href:'chronicles.html',label:'Хронология'},
  ...[['aiel','Айил'],['tuataan','Туата’ан'],['sea-folk','Морской народ'],['tremalkin','Тремалкин'],['daaltian',"Дааль’тиан"],['land-madmen','Земля Безумцев'],['arafel','Арафел'],['kandor','Кандор'],['shienar','Шайнар'],['tar-valon','Тар Валон'],['shara','Шара'],['freefolk','Вольные земли'],['altara','Алтара · 285 ПБ'],['tarabon','Тарабон · 285 ПБ']].map(([p,label])=>({href:p+'.html',label})),
  {href:'tsitadel.html',label:'Цитадель'}]},
 {id:'rules',label:'Правила',items:[{href:'player-rules.html',label:'Книга правил'},{href:'classes.html',label:'Классы'},{href:'feats.html',label:'Черты'},{href:'weaves.html',label:'Плетения'},{href:'alchemy.html',label:'Необычная алхимия'},{href:'ingredients.html',label:'Ингредиенты'},{href:'rituals.html',label:'Ритуалы'}]},
 {id:'hierarchies',label:'Иерархии',items:[{href:'hierarchies.html',label:'Обзор и сравнение'},...['unity|Иерархия Единства','throne|Хрустальный Трон','madding|Гильдия Хранителей','shara-will|Единая Воля Шары','hierarchy-wall|Иерархия Аномальной Стены','scream|Крик и Держащие Равновесие','order|Орден Стражей Узора','guild-keepers-expanded|Гильдия · полное описание для Мастера','guild-keepers-poi-catalog|Гильдия · объекты для Мастера'].map(s=>{const[p,label]=s.split('|');return{href:p+'.html',label,protected:p.startsWith('guild-')};})]},
 {id:'dm',label:'Мастеру',items:[{href:'dm-toolkit.html',label:'Обзор DM Toolkit',protected:true},...toolGroups.flatMap(g=>g.items)]}
];
window.WOT_SITE_NAV={groups,toolGroups};
const current=location.pathname.split('/').pop()||'index.html';
function link(item){const a=document.createElement('a');a.href=item.href;a.textContent=item.label;if(item.protected)a.dataset.protectedHref=item.href;if(item.href===current){a.setAttribute('aria-current','page');a.classList.add('active');}return a;}
const bar=document.querySelector('.sitenav');
if(bar){
 bar.classList.add('site-navigation');bar.setAttribute('aria-label','Главная навигация');
 const container=bar.querySelector('.nav-links');container.replaceChildren();container.id='site-navigation-links';
 const brand=bar.querySelector('.nav-brand');brand?.setAttribute('aria-label','Главная · Колесо');if(current==='index.html')brand?.setAttribute('aria-current','page');
 const mobile=document.createElement('button');mobile.className='site-menu-toggle';mobile.type='button';mobile.textContent='Меню';mobile.setAttribute('aria-expanded','false');mobile.setAttribute('aria-controls',container.id);brand?.after(mobile);
 function closeGroups(){container.querySelectorAll('details[open]').forEach(d=>{d.open=false;d.querySelector('summary').setAttribute('aria-expanded','false');});}
 mobile.addEventListener('click',()=>{const open=mobile.getAttribute('aria-expanded')!=='true';mobile.setAttribute('aria-expanded',String(open));bar.classList.toggle('mobile-open',open);if(!open)closeGroups();});
 for(const group of groups){
  if(group.id==='dm')container.append(link({href:'anomalies.html',label:'Аномалии'}));
  const d=document.createElement('details');d.className='site-nav-group';if(group.items.some(i=>i.href===current))d.classList.add('active');
  const s=document.createElement('summary');s.textContent=group.label;s.setAttribute('aria-expanded','false');s.setAttribute('aria-controls','site-nav-'+group.id);
  const menu=document.createElement('div');menu.id='site-nav-'+group.id;menu.className='site-nav-list';for(const item of group.items)menu.append(link(item));
  d.append(s,menu);container.append(d);
  d.addEventListener('toggle',()=>{s.setAttribute('aria-expanded',String(d.open));if(d.open)container.querySelectorAll('details[open]').forEach(other=>{if(other!==d)other.open=false;});});
  s.addEventListener('keydown',e=>{if(e.key==='ArrowDown'){e.preventDefault();d.open=true;menu.querySelector('a')?.focus();}});
  menu.addEventListener('keydown',e=>{const links=Array.from(menu.querySelectorAll('a')),i=links.indexOf(document.activeElement);if(['ArrowDown','ArrowUp','Home','End'].includes(e.key)){e.preventDefault();links[e.key==='Home'?0:e.key==='End'?links.length-1:(i+(e.key==='ArrowDown'?1:-1)+links.length)%links.length]?.focus();}});
  d.addEventListener('focusout',e=>{if(!d.contains(e.relatedTarget)){d.open=false;}});
 }
 document.addEventListener('click',e=>{if(!bar.contains(e.target))closeGroups();});
 document.addEventListener('keydown',e=>{if(e.key!=='Escape')return;const open=container.querySelector('details[open]');if(open){open.open=false;open.querySelector('summary').focus();}else if(bar.classList.contains('mobile-open')){bar.classList.remove('mobile-open');mobile.setAttribute('aria-expanded','false');mobile.focus();}});
}
const overview=document.getElementById('toolkit-groups');
if(overview){for(const g of toolGroups){const section=document.createElement('section');section.className='toolkit-section';section.id=g.id;const h=document.createElement('h2');h.textContent=g.label;section.append(h);const cards=document.createElement('div');cards.className='toolkit-grid';for(const item of g.items){const a=link(item);a.className='toolkit-card';a.replaceChildren();const title=document.createElement('h3');title.textContent=item.label;const text=document.createElement('p');text.textContent=item.description;a.append(title,text);cards.append(a);}section.append(cards);overview.append(section);}}
if(!bar&&!document.querySelector('.sidebar-sub')&&!document.querySelector('a.back')){const wrap=document.querySelector('.wrap');if(wrap){const back=link({href:'dm-toolkit.html',label:'← DM Toolkit'});back.className='standalone-toolkit-return';wrap.prepend(back);}}
const back=document.querySelector('.sidebar-sub');if(back&&!bar){const a=link({href:'dm-toolkit.html',label:'← DM Toolkit'});a.className='toolkit-return';back.prepend(a,document.createTextNode(' · '));}
})();
