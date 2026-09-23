(function(){
'use strict';
const CUSTOM_KEY='wot_custom_npcs_v1';
const clsDb=window.WOT_CLASSES_DB||{features:[],meta:{classes:[]}};
const feats=(window.WOT_FEATS_DB&&window.WOT_FEATS_DB.feats)||[];
const featNameAliases={
  'Пламя и пустота (редкий)':'Пламя и Пустота (Редкое)',
  'Плетение без Жестов (Редкое)':'Плетение без жестов (Редкое)'
};
const normalizeFeatName=name=>featNameAliases[name]||name;
const WILDER_TRADITIONS=['Мудрый','Странник','Сновидец'];
const PACT_PATRONS=['Ланфир, Госпожа Снов','Семираг, Госпожа Боли','Ишамаэль, Голос Конца','Могидин, Паучиха','Великая Мигрирующая Аномалия','Дракон Возрождённый, След огня в Узоре'];
const CLASS_ARCHETYPE_OVERRIDES={'Дичок':WILDER_TRADITIONS,'Носитель Договора':PACT_PATRONS};
const weaves=window.WOT_WEAVES||[];
const existing=Array.isArray(window.CS)?window.CS:(typeof CS!=='undefined'?CS:[]);
const rules=window.WOT_NPC_RULES||{};
const hierarchyDb=window.WOT_HIERARCHY_DB||{hierarchies:[]};
let currentNpc=null;
let reviewReady=false;
let loadedCustomId=null;
const hierarchyChoiceMemory={};
const $=id=>document.getElementById(id);
const statKeys=['str','dex','con','int','wis','cha'];
const abbr={str:'СИЛ',dex:'ЛОВ',con:'ТЕЛ',int:'ИНТ',wis:'МДР',cha:'ХАР'};
const ruStat={str:'Сила',dex:'Ловкость',con:'Телосложение',int:'Интеллект',wis:'Мудрость',cha:'Харизма'};
const hitDie={'Варвар':12,'Пустынный воин':10,'Мастер по оружию':10,'Лесник':10,'Благородный':8,'Скиталец':8,'Носитель Договора':8,'Дичок':6,'Посвящённый':4,'Посвященный':4};
const roleTemplates={
  'Фронтлайн':{str:16,dex:12,con:16,int:10,wis:12,cha:10},
  'Стрелок':{str:10,dex:16,con:14,int:12,wis:14,cha:10},
  'Скиталец':{str:8,dex:16,con:14,int:14,wis:12,cha:12},
  'Направляющий':{str:8,dex:12,con:14,int:16,wis:16,cha:10},
  'Командир':{str:12,dex:12,con:14,int:14,wis:14,cha:16},
  'Сбалансированный':{str:13,dex:13,con:14,int:12,wis:13,cha:12}
};
const CHANNELING_TALENTS=Array.from(new Set(weaves.map(w=>w.school).filter(Boolean))).sort((a,b)=>a.localeCompare(b,'ru'));
const AFFINITIES=['Воздух','Земля','Огонь','Дух','Вода'];
const PACT_GENERAL_WEAVES=[
  'Руки Воздуха','Создать Огонь','Течение','Анализ почвы','Ложный след','Предсказание Погоды','Граната','Обуздать Ветер','Свет','Полировка','Инструмент Воздуха','Голос Силы','Тепло','Ледяные кристаллы',
  'Преграда для взгляда','Круг тишины','Маскировка','Высушить','Подслушивание','Ложная Стена','Уплотнить Воздух','Консервация','Выровнять Землю','Зеркало Туманов','Поднять Туман','Огненный Жезл','Смерч','Воздушный кулак',
  'Огненный Меч','Огненный шар','Свернутый Свет','Громовой Удар','Охрана от Направляющих','Охрана От Людей',
  'Очищение','Разрезать Плетения','Искатель','Огненная Ловушка','Перемещение Воды','Щит','Охрана От Единой Силы','Водоворот',
  'Отдалённый Глаз','Приносить в жертву','Защитный купол','Расколотая Земля','Оглушение','Молния','Дыхание зимы'
];
const PACT_PATRON_RULES={
  'Ланфир, Госпожа Снов':{affinities:['Дух','Воздух','Вода'],talents:['Иллюзия','Перемещение','Соединение','Защита Снов'],weaves:['Защита Снов','Зеркало Туманов','Маскировка','Свернутый Свет','Небесные Огни','Влияние','Сокрытие способности Направлять','Предложение','Отдалённый Глаз','Полёт','Узы как у Первых']},
  'Семираг, Госпожа Боли':{affinities:['Дух','Вода','Воздух'],talents:['Исцеление','Соединение','Защита','Элементализм'],weaves:['Разорвать плоть','Углубленное Исследование','Исцеление','Исцеление Разума','Обновление','Восстановление','Громовой Удар','Охрана от Направляющих','Очищение','Защитный кокон','Оглушение','Прикосновение Смерти','Дыхание зимы']},
  'Ишамаэль, Голос Конца':{affinities:['Дух','Огонь','Земля'],talents:['Погибельный Огонь','Элементализм','Соединение','Защита'],weaves:['Круг тишины','Зеркало Туманов','Огненный шар','Громовой Удар','Щит','Огненная Ловушка','Искатель','Приносить в жертву','Расколотая Земля','Прикосновение Смерти','Молния']},
  'Могидин, Паучиха':{affinities:['Дух','Воздух','Вода'],talents:['Иллюзия','Соединение','Защита','Перемещение'],weaves:['Круг тишины','Подслушивание','Маскировка','Свернутый Свет','Охрана От Людей','Влияние','Искатель','Огненная Ловушка','Предложение','Сокрытие способности Направлять','Отдалённый Глаз','Полёт','Узы как у Первых']},
  'Великая Мигрирующая Аномалия':{affinities:['Воздух','Вода','Земля','Огонь','Дух'],talents:['Танец Облаков','Элементализм','Пение Земли','Защита','Соединение','Перемещение','Исцеление'],weaves:['Граната','Обуздать Ветер','Анализ почвы','Предсказание Погоды','Воздушный кулак','Смерч','Выровнять Землю','Исцеление','Громовой Удар','Охрана от Направляющих','Водоворот','Разрезать Плетения','Очищение','Расколотая Земля','Защитный купол','Отдалённый Глаз','Молния','Дыхание зимы','Узы как у Первых']},
  'Дракон Возрождённый, След огня в Узоре':{affinities:['Огонь','Дух','Земля'],talents:['Элементализм','Защита','Соединение','Погибельный Огонь'],weaves:['Огненный Жезл','Смерч','Зеркало Туманов','Огненный шар','Охрана от Направляющих','Щит','Разрезать Плетения','Охрана От Единой Силы','Защитный купол','Расколотая Земля','Приносить в жертву','Молния','Дыхание зимы']}
};
const TALENT_SCHOOL_ALIASES={'Перемещение':['Перемещение','Путешествие'],'Защита':['Защита','Охранные Плетения'],'Защита Снов':['Защита Снов','Охранные Плетения']};
const LAND_MADMEN_NATIONS=['Агори','Тишани','Харани','Кайнар'];
const PACT_ANCHOR_RULES={
  blade:{label:'Якорь Клинка',features:[[3,'3-й уровень: Договорный клинок'],[7,'7-й уровень: Резонансная кромка'],[12,'12-й уровень: Проводящая кромка'],[18,'18-й уровень: Между ударом и нитью']]},
  book:{label:'Якорь Книги',features:[[3,'3-й уровень: Кварцевые страницы'],[7,'7-й уровень: Дополнительные формулы'],[12,'12-й уровень: Открытая формула'],[18,'18-й уровень: Совершенная запись']]},
  sign:{label:'Якорь Знака',features:[[3,'3-й уровень: Знак держит нить'],[7,'7-й уровень: Кровь как печать'],[12,'12-й уровень: Шрам помнит силу'],[18,'18-й уровень: Двойная печать']]}
};
const PACT_PATRON_FEATURES={
  'Ланфир, Госпожа Снов':[[1,'1-й уровень: Зеркало желания'],[6,'6-й уровень: Шаг сквозь отражение'],[10,'10-й уровень: Сон не держит меня'],[14,'14-й уровень: Лунная дверь']],
  'Семираг, Госпожа Боли':[[1,'1-й уровень: Анатомия страдания'],[6,'6-й уровень: Боль как поводок'],[10,'10-й уровень: Холодный врач'],[14,'14-й уровень: Открытая нервная нить']],
  'Ишамаэль, Голос Конца':[[1,'1-й уровень: Слова конца'],[6,'6-й уровень: Пустота между ударами'],[10,'10-й уровень: Разум на краю'],[14,'14-й уровень: Нить, которой не должно быть']],
  'Могидин, Паучиха':[[1,'1-й уровень: Нить под кожей'],[6,'6-й уровень: Паучий отход'],[10,'10-й уровень: Скрытая мысль'],[14,'14-й уровень: Кокон воли']],
  'Великая Мигрирующая Аномалия':[[1,'1-й уровень: Резонанс фронта'],[6,'6-й уровень: Между Валом и Хвостом'],[10,'10-й уровень: Тело прохода'],[14,'14-й уровень: Полный проход']],
  'Дракон Возрождённый, След огня в Узоре':[[1,'1-й уровень: Пламя выбора'],[6,'6-й уровень: Между миром и огнём'],[10,'10-й уровень: Несломанный Узор'],[14,'14-й уровень: Пламя, которое не должно сжечь мир']]
};
const PACT_FORBIDDEN_MATRICES={
  'Ланфир, Госпожа Снов':['Дворец отражений','Путь через сон','Сон наяву','Совершенный сон'],
  'Семираг, Госпожа Боли':['Нервная буря','Переписанная плоть','Открытая нервная сеть','Совершенная операция'],
  'Ишамаэль, Голос Конца':['Круг угасания','Слово гибели','Беззвёздная пустота','Последнее слово'],
  'Могидин, Паучиха':['Паучья клетка','Невидимая охота','Лабиринт паутины','Сеть без выхода'],
  'Великая Мигрирующая Аномалия':['Каменный вихрь','Линия Вала','Око над полем','Полный проход Крика'],
  'Дракон Возрождённый, След огня в Узоре':['Щит выбора','Огненная корона','Белое пламя','Сердце Дракона']
};
const PACT_FORBIDDEN_THRESHOLDS=[11,13,15,17];
const WEAVE_MAX_CIRCLE={
  'Дичок':[1,2,3,3,4,4,5,5,6,6,6,7,7,7,8,8,9,9,9,9],
  'Посвящённый':[1,1,2,2,3,3,4,4,5,5,6,6,7,7,8,8,9,9,9,9],
  'Носитель Договора':[1,1,2,2,3,3,4,4,5,5,5,5,5,5,5,5,5,5,5,5]
};
const PACT_KNOWN_LIMITS={cantrips:[2,2,2,3,3,3,3,3,3,4,4,4,4,4,4,4,4,4,4,4],weaves:[2,3,4,5,6,7,8,9,10,10,11,11,12,12,13,13,14,14,15,15]};
function isChannelingClass(cls){ return /Дичок|Посвящ|Носитель Договора/i.test(String(cls||'')); }
function getEffectiveChannelerLevel(cls,arch,lv){ lv=Math.max(1,Math.min(20,Number(lv)||1)); if(/Посвящ/i.test(String(cls||''))&&/Аша.?ман/i.test(String(arch||''))){ if(lv>=17)return Math.min(20,lv+2); if(lv>=13)return Math.min(20,lv+1); } return lv; }
function getMaxWeaveLevel(cls,lv,arch){ const table=WEAVE_MAX_CIRCLE[cls]; if(!table)return 0; const effective=getEffectiveChannelerLevel(cls,arch,lv); return Number(table[effective-1]||1); }
function baseFreeWeaveLevel(cls){ return /Дичок|Носитель Договора/i.test(String(cls||'')) ? 2 : 1; }
function getTalentLimit(cls,lv){ lv=Number(lv)||1; if(/Носитель Договора/i.test(String(cls||'')))return lv>=10?2:1; if(/Дичок|Посвящ/i.test(String(cls||'')))return lv>=11?3:2; return 0; }
function getKnownWeaveLimits(cls,lv){ if(!/Носитель Договора/i.test(String(cls||'')))return null; const i=Math.max(0,Math.min(19,(Number(lv)||1)-1)); return {cantrips:PACT_KNOWN_LIMITS.cantrips[i],weaves:PACT_KNOWN_LIMITS.weaves[i]}; }
function getSelectedTalents(){ return [...document.querySelectorAll('[data-talent]:checked')].map(x=>x.value); }
function getSelectedAffinities(){ return [...document.querySelectorAll('[data-affinity]:checked')].map(x=>x.value); }
function getSelectedWeaveTitles(){ return [...document.querySelectorAll('[data-weave-title]:checked')].map(x=>x.value); }
function getAjah(){ return $('npc-ajah')?.value||''; }
function getPactAnchor(){ return $('npc-pact-anchor')?.value||''; }
function getPactAnchorLabel(anchor=getPactAnchor()){ return PACT_ANCHOR_RULES[anchor]?.label||''; }
function updatePactControls(){
  const box=$('pact-options'), anchorField=$('pact-anchor-field'), note=$('pact-focus-note'), archLabel=$('npc-arch-label'); if(!box)return;
  const isPact=/Носитель Договора/i.test(getClass()), lv=getLevel();
  if(archLabel)archLabel.textContent=isPact?'Покровитель':/Дичок/i.test(getClass())?'Традиция':'Архетип';
  box.hidden=!isPact;
  if(anchorField)anchorField.hidden=!isPact||lv<3;
  if(note)note.textContent=!isPact?'':lv<3?'На 1-м и 2-м уровнях фокусом служит фокус Договора. Выбор Якоря откроется на 3-м уровне.':'Выбранный Якорь служит фокусом Плетений Договора. Если Якорь не выбран, проверка карточки покажет ошибку.';
}
function updateAjahControl(){ const field=$('ajah-field'); if(!field)return; field.hidden=!(/Посвящ/i.test(getClass())&&/Айз Седай/i.test(getArch())&&getLevel()>=7); }
function getWeaveSummary(w){ return Array.isArray(w.desc) ? w.desc.join(' ') : String(w.desc || w.summary || ''); }
function getMetaValue(w,label){ const m=(w.meta||[]).find(x=>String(x.label||'').toLowerCase().includes(String(label).toLowerCase())); return m ? m.value : ''; }
const WEAVE_META_LABELS=['Время создания','Время плетения','Дальность','Цель или область','Длительность','Спасбросок или бросок атаки','Спасбросок'];
function getCanonicalMetaValue(w,label){
  const wanted=String(label||'').toLowerCase();
  const direct=getMetaValue(w,label);
  if(direct)return direct;
  const aliases={
    'время создания':['время создания','время плетения'],
    'спасбросок или бросок атаки':['спасбросок или бросок атаки','спасбросок']
  }[wanted]||[wanted];
  const text=Array.isArray(w&&w.desc)?w.desc.join(' \n '):String(w&&w.desc||'');
  for(const alias of aliases){
    const escaped=alias.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');
    const labels=WEAVE_META_LABELS.map(x=>x.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')).join('|');
    const re=new RegExp('(?:^\\s*-?\\s*|\\n\\s*-?\\s*|\\s+-\\s+)'+escaped+'\\s*:\\s*(.*?)(?=\\s+-\\s+(?:'+labels+')\\s*:|\\n|$)','i');
    const match=text.match(re);
    if(match&&match[1])return match[1].trim();
  }
  return '';
}
function weaveDealsHitPointDamage(w){ const positive=/(?:получает|получают|наносит|наносят|наносите|причиняет|причиняют)[^.]{0,100}урон|\d+[кd]\d+[^.]{0,80}урон/i, nonDamage=/не\s+(?:получает|получают|наносит|наносят|причиняет|причиняют)[^.]{0,60}урон|получа(?:ет|ют|ете)[^.]{0,40}(?:бонус[^.]{0,25}(?:к\s+)?урон|сопротивление\s+урон)/i; return getWeaveSummary(w).split(/[.!?]/).some(sentence=>positive.test(sentence)&&!nonDamage.test(sentence)); }
function isPactWeaveAvailable(w,cls,arch){ if(!/Носитель Договора/i.test(String(cls||'')))return true; const allowed=[...PACT_GENERAL_WEAVES,...(PACT_PATRON_RULES[arch]?.weaves||[])].map(normText); return allowed.includes(normText(w.title)); }
function talentMatchesSchool(talent,school){return (TALENT_SCHOOL_ALIASES[talent]||[talent]).includes(school);}
function weaveAllowedByTalent(w,cls,arch,lv,talents,ajah){ const circle=Number(w.level)||0; if(circle<=baseFreeWeaveLevel(cls)) return true; if(talents.some(t=>talentMatchesSchool(t,w.school))) return true; if(/Посвящ/i.test(String(cls||''))&&/Аша.?ман/i.test(String(arch||''))&&Number(lv)>=7&&circle<=4&&weaveDealsHitPointDamage(w))return true; if(/Посвящ/i.test(String(cls||''))&&/Айз Седай/i.test(String(arch||''))&&Number(lv)>=7&&ajah==='Зелёная'&&circle<=3&&weaveDealsHitPointDamage(w))return true; return /Посвящ/i.test(String(cls||''))&&/Айз Седай/i.test(String(arch||''))&&Number(lv)>=7&&ajah==='Жёлтая'&&w.school==='Исцеление'&&!/утрачен|новое/i.test(String(w.rarity||'')); }
function renderTalentAffinityControls(){
  const tbox=$('talent-list'), abox=$('affinity-list'); if(!tbox||!abox) return;
  const cls=getClass(), arch=getArch(), lv=getLevel(), limit=getTalentLimit(cls,lv), selected=new Set(getSelectedTalents()), patron=PACT_PATRON_RULES[arch];
  const availableTalents=patron?patron.talents:CHANNELING_TALENTS, availableAffinities=patron?patron.affinities:AFFINITIES;
  tbox.innerHTML=availableTalents.map(t=>'<label class="check"><input type="checkbox" data-talent value="'+safe(t)+'" '+(selected.has(t)?'checked':'')+' '+(!selected.has(t)&&selected.size>=limit?'disabled':'')+'> <span>'+safe(t)+'</span></label>').join('');
  const limitHint=$('talent-limit-hint'); if(limitHint){ limitHint.classList.toggle('warn',selected.size>limit); limitHint.textContent=`Выбрано Талантов: ${selected.size} из ${limit}. ${/Носитель Договора/i.test(cls)?'Второй Талант Носитель получает на 10-м уровне.':'Третий Талант становится доступен на 11-м уровне.'}`; }
  const affSel=new Set(getSelectedAffinities());
  abox.innerHTML=availableAffinities.map(a=>'<label class="check"><input type="checkbox" data-affinity value="'+safe(a)+'" '+(affSel.has(a)?'checked':'')+'> <span>'+safe(a)+'</span></label>').join('');
}
function renderWeavePicker(){
  const wrap=$('channeling-fields'), picker=$('weave-picker'); if(!wrap||!picker) return;
  const cls=getClass(), arch=getArch(), lv=getLevel(), ch=isChannelingClass(cls);
  wrap.style.display=ch?'':'none';
  if(!ch){ picker.innerHTML=''; return; }
  updateAjahControl();
  renderTalentAffinityControls();
  const talents=getSelectedTalents(), ajah=getAjah(); const maxLv=getMaxWeaveLevel(cls,lv,arch); const q=normText($('weave-search')?.value||''); const selected=new Set(getSelectedWeaveTitles());
  const filtered=(weaves||[]).filter(w=>Number(w.level||0)<=maxLv).filter(w=>isPactWeaveAvailable(w,cls,arch)).filter(w=>weaveAllowedByTalent(w,cls,arch,lv,talents,ajah)).filter(w=>!q || normText(w.title).includes(q) || normText(w.school).includes(q));
  const groups={}; filtered.forEach(w=>{ const k=(Number(w.level)===0?'Кантрипы':'Круг '+w.level)+' · '+(w.school||'Без таланта'); (groups[k]=groups[k]||[]).push(w); });
  const knownLimits=getKnownWeaveLimits(cls,lv), selectedRows=(weaves||[]).filter(w=>selected.has(w.title)), selectedCantrips=selectedRows.filter(w=>Number(w.level)===0).length, selectedLeveled=selectedRows.filter(w=>Number(w.level)>0).length;
  const effective=getEffectiveChannelerLevel(cls,arch,lv), powerJump=effective!==lv?` «Скачок в силе»: для таблицы используется эффективный уровень ${effective}.`:'';
  const combatException=/Посвящ/i.test(cls)&&/Аша.?ман/i.test(arch)&&lv>=7?' Аша’ман также видит наносящие урон Плетения до 4-го круга без соответствующего Таланта.':'';
  const ajahException=ajah==='Зелёная'?' Зелёная Айя: наносящие урон Плетения до 3-го круга доступны без соответствующего Таланта.':ajah==='Жёлтая'?' Жёлтая Айя: Плетения Исцеления без пометок «Утерянное» и «Новое» доступны через особый Талант сверх обычного предела.':'';
  const pactLimit=/Носитель Договора/i.test(cls)?` Показан общий список Носителя и расширенный список Покровителя «${arch}». По таблице известно: кантрипы ${selectedCantrips}/${knownLimits.cantrips}, Плетения 1-го круга и выше ${selectedLeveled}/${knownLimits.weaves}.`:'';
  const summary=`<div class="weave-access-summary"><b>Доступный базовый круг: ${maxLv}-й.</b> Без соответствующего Таланта: до ${baseFreeWeaveLevel(cls)}-го круга включительно.${safe(powerJump+combatException+ajahException+pactLimit)}</div>`;
  const list=Object.entries(groups).sort((a,b)=>a[0].localeCompare(b[0],undefined,{numeric:true})).map(([g,items])=>'<div class="weave-group"><div class="weave-group-title">'+safe(g)+'</div>'+items.sort((a,b)=>String(a.title).localeCompare(String(b.title))).map(w=>{const chosen=selected.has(w.title), capReached=knownLimits&&!chosen&&(Number(w.level)===0?selectedCantrips>=knownLimits.cantrips:selectedLeveled>=knownLimits.weaves);return '<label class="weave-choice"><input type="checkbox" data-weave-title value="'+safe(w.title)+'" '+(chosen?'checked':'')+' '+(capReached?'disabled':'')+'> <span><b>'+safe(w.title)+'</b><small>'+safe((Array.isArray(w.powers)?w.powers.join('·'):'')+' · '+(getMetaValue(w,'Спасбросок')||'')+(w.rarity&&w.rarity!=='Обычное'?' · '+w.rarity:''))+'</small></span></label>';}).join('')+'</div>').join('') || '<div class="muted mono">Нет доступных плетений при выбранных Талантах и уровне.</div>';
  picker.innerHTML=summary+list;
}
const FIGHTING_STYLES = {
  master: [
    {id:'archery', n:'Стрельба из лука', d:'Вы получаете бонус +2 к броскам атаки, которые совершаете с использованием дальнобойного оружия.'},
    {id:'defense', n:'Защита', d:'Когда вы носите доспехи, вы получаете бонус +1 к КД.'},
    {id:'dueling', n:'Дуэль', d:'Когда вы держите оружие ближнего боя в одной руке и не используете другого оружия, вы получаете +2 к урону этим оружием.'},
    {id:'great_weapon', n:'Бой с большим оружием', d:'При атаке двуручным или универсальным оружием ближнего боя можно перебросить 1 или 2 на кубике урона.'},
    {id:'protection', n:'Протекция', d:'Реакцией наложить помеху на атаку по союзнику в 5 фт, если вы держите щит.'},
    {id:'two_weapon', n:'Бой двумя оружиями', d:'При бое двумя оружиями вы добавляете модификатор характеристики к урону второй атаки.'}
  ],
  lesnik: [
    {id:'archery', n:'Стрельба', d:'Вы получаете бонус +2 к броскам атаки дальнобойным оружием.'},
    {id:'defense', n:'Защита', d:'Пока вы носите доспехи, вы получаете бонус +1 к КД.'},
    {id:'dueling', n:'Дуэль', d:'Когда вы сражаетесь оружием ближнего боя в одной руке и не держите другого оружия, вы получаете +2 к урону этим оружием.'},
    {id:'two_weapon', n:'Бой двумя оружиями', d:'При бое двумя оружиями вы добавляете модификатор характеристики к урону второй атаки.'}
  ],
  ashaman: [
    {id:'dueling', n:'Дуэль', d:'Когда вы держите оружие ближнего боя в одной руке и не используете другого оружия, вы получаете +2 к урону этим оружием.'},
    {id:'great_weapon', n:'Бой с тяжёлым оружием', d:'При атаке двуручным или универсальным оружием ближнего боя можно перебросить 1 или 2 на кубике урона.'},
    {id:'two_weapon', n:'Бой двумя оружиями', d:'При бое двумя оружиями вы добавляете модификатор характеристики к урону второй атаки.'}
  ]
};
function getFightingStyleOptions(cls,arch,lv){
  lv=Number(lv)||1;
  if(/Мастер по оружию/.test(cls) && lv>=1) return FIGHTING_STYLES.master;
  if(/Лесник/.test(cls) && lv>=2) return FIGHTING_STYLES.lesnik;
  if(/Посвящ/.test(cls) && /Аша'?ман/i.test(String(arch||'')) && lv>=3) return FIGHTING_STYLES.ashaman;
  return [];
}
function getSelectedFightingStyle(){
  const el=$('npc-fighting-style');
  if(!el || !el.value) return null;
  const opts=getFightingStyleOptions(getClass(),getArch(),getLevel());
  return opts.find(x=>x.id===el.value)||null;
}
function updateFightingStyleSelect(){
  const field=$('fighting-style-field'), sel=$('npc-fighting-style');
  if(!field||!sel) return;
  const opts=getFightingStyleOptions(getClass(),getArch(),getLevel());
  const old=sel.value;
  if(!opts.length){ field.style.display='none'; sel.innerHTML=''; return; }
  field.style.display='';
  sel.innerHTML='<option value="">— выберите стиль боя —</option>'+opts.map(o=>`<option value="${safe(o.id)}">${safe(o.n)}</option>`).join('');
  if(opts.some(o=>o.id===old)) sel.value=old;
}

function mod(v){return Math.floor((Number(v)-10)/2)}
function sign(v){v=Number(v)||0; return (v>=0?'+':'')+v}
function prof(lv){return Math.ceil(Number(lv)/4)+1}
function cap(v,c=20){return Math.min(c,Math.max(1,Number(v)||10))}
function safe(s){return String(s||'').replace(/[&<>"]/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[ch]))}
function short(s,n=170){s=String(s||''); return s.length>n?s.slice(0,n).trim()+'…':s}
function slug(s){return String(s||'').toLowerCase().replace(/ё/g,'е').replace(/[^a-zа-я0-9]+/g,'-').replace(/^-|-$/g,'')}
function getLevel(){return Math.max(1,Math.min(20,parseInt($('npc-level').value||'1',10)))}
function getBaseStats(){return statKeys.reduce((o,k)=>(o[k]=Number($(k).value)||10,o),{})}
function getClass(){return $('npc-class').value}
function getArch(){return $('npc-arch').value}
function getNation(){return $('npc-nation').value.trim()||'—'}
function normText(s){
  return String(s||'').toLowerCase().replace(/ё/g,'е').replace(/[’'`]/g,'').replace(/[^a-zа-я0-9]+/g,' ').trim();
}
function getNationMatch(nation){
  const db=rules.nationBonuses||{};
  const raw=String(nation||'').trim();
  const n=normText(raw);
  if(!n) return {key:null, bonus:{}, status:'empty'};
  if(db[raw]) return {key:raw, bonus:clone(db[raw]), status:'exact'};
  const aliases={
    'атаан миэйр':'Морской народ','ата ан миэйр':'Морской народ','атан миэйр':'Морской народ','sea folk':'Морской народ',
    'порубежник':'Порубежники','порубежники':'Порубежники','арафелец':'Арафел','шайнарец':'Шайнар','салдеец':'Салдея','кандорец':'Кандор',
    'домани женщина':'Домани жен','домани жен':'Домани жен','домани муж':'Домани муж','домани мужчина':'Домани муж',
    'фар мэддинг':'Фар Мэддинг','фар мэддинга':'Фар Мэддинг','tar valon':'Тар Валон','seanchan':'Шончан'
  };
  if(aliases[n] && db[aliases[n]]) return {key:aliases[n], bonus:clone(db[aliases[n]]), status:'alias'};
  const exactNorm=Object.keys(db).find(k=>normText(k)===n);
  if(exactNorm) return {key:exactNorm, bonus:clone(db[exactNorm]), status:'exact-normalized'};
  const contains=Object.keys(db).filter(k=>{const nk=normText(k); return nk && (n.includes(nk)||nk.includes(n));});
  if(contains.length===1) return {key:contains[0], bonus:clone(db[contains[0]]), status:'fuzzy'};
  if(contains.length>1) return {key:null, bonus:{}, status:'ambiguous', candidates:contains};
  return {key:null, bonus:{}, status:'missing'};
}
function primaryStats(cls,role){
  // Приоритеты берутся из требований класса/боевой роли, а не из шаблона Иерархии.
  // Иерархия усиливает важные для данного NPC характеристики: основную, вторую, третью, затем поддерживающую.
  if(/Варвар/.test(cls)) return ['str','con','dex','wis'];
  if(/Мастер по оружию/.test(cls)){
    if(/Стрелок|Скиталец/i.test(role||'')) return ['dex','str','con','wis'];
    return ['str','dex','con','wis'];
  }
  if(/Пустынный/.test(cls)) return ['dex','con','wis','str'];
  if(/Скиталец/.test(cls)) return ['dex','int','cha','wis'];
  if(/Лесник/.test(cls)) return ['dex','wis','con','str'];
  if(/Носитель Договора/.test(cls)) return ['cha','con','dex','wis'];
  if(/Дичок|Посвящ/.test(cls)) return ['wis','int','con','dex'];
  if(/Благород/.test(cls)) return ['cha','wis','int','con'];
  const map={Фронтлайн:['str','con','dex','wis'],Стрелок:['dex','wis','con','str'],Скиталец:['dex','int','cha','wis'],Направляющий:['wis','int','con','dex'],Командир:['cha','wis','con','int']};
  return map[role]||['str','con','dex','wis'];
}
function distributeStatPoints(stats, total, priorities, max, label, steps){
  total = Number(total)||0;
  if(!total) return {};
  const applied={};
  const pri = Array.from(new Set([...(priorities||[]), 'con','wis','dex','str','int','cha'])).filter(k=>statKeys.includes(k));
  let remaining = total; let idx = 0;
  while(remaining>0 && idx < pri.length*3){
    const k = pri[idx % pri.length];
    const before = stats[k]||10;
    const limit = typeof max==='object' ? Number(max[k]||max.default||20) : Number(max||20);
    if(before < limit){
      const inc = Math.min(remaining, 2, limit-before);
      if(inc>0){ addStat(stats,k,inc,limit); applied[k]=(applied[k]||0)+inc; remaining-=inc; }
    }
    idx++;
  }
  Object.entries(applied).forEach(([k,v])=>steps.push(label + ': ' + abbr[k] + ' +' + v + ' по приоритету класса'));
  if(remaining>0) steps.push(label + ': ' + remaining + ' пункт(ов) не применены — достигнут предел характеристик.');
  return applied;
}
function clone(o){return JSON.parse(JSON.stringify(o||{}))}
function getAsiEvents(cls,lv){const arr=(rules.asiLevels&& (rules.asiLevels[cls]||rules.asiLevels.default))||[4,8,12,16,19]; return arr.filter(x=>x<=lv);}
function getNationBonus(nation){
  return getNationMatch(nation).bonus || {};
}
function addStat(obj,k,v,max=20){obj[k]=cap((obj[k]||10)+(Number(v)||0),max)}
function applyStatBlock(base,ctx){
  const steps=[]; const stats=clone(base); const pri=primaryStats(ctx.cls,ctx.role);
  const nmatch=getNationMatch(ctx.nation);
  const nb=nmatch.bonus||{};
  Object.entries(nb).forEach(([k,v])=>{addStat(stats,k,v,20); steps.push(`Нация ${nmatch.key||ctx.nation}: ${abbr[k]} +${v}`);});
  if(nmatch.status==='missing' || nmatch.status==='empty') steps.push(`Нация ${ctx.nation}: бонус не найден — проверьте написание.`);
  if(nmatch.status==='ambiguous') steps.push(`Нация ${ctx.nation}: неоднозначное совпадение (${(nmatch.candidates||[]).join(', ')}) — уточните вариант.`);
  const asiEvents=getAsiEvents(ctx.cls,ctx.lv); let asiPoints=asiEvents.length*2; const featPenalty=ctx.featsSel.length;
  if(featPenalty){ asiPoints=Math.max(0,asiPoints-featPenalty); steps.push(`Доп. черты: предупреждение — уменьшено/должно быть уменьшено ${featPenalty} пункт(ов) из уровневого роста характеристик.`); }
  for(let i=0;i<asiPoints;i++){ const k=pri[i%pri.length]||'con'; if(stats[k]<20){addStat(stats,k,1,20); steps.push(`Рост характеристик ур. ${asiEvents[Math.floor(i/2)]||'?'}: ${abbr[k]} +1`);} }
  // feat effects
  const fnotes=[]; ctx.featsSel.forEach(fn=>{
    const eff=(rules.featEffects||{})[fn]; if(!eff) return;
    let statObj=eff.stat;
    if(!statObj && eff.statChoice){ const chosen=eff.statChoice.find(k=>pri.includes(k))||eff.statChoice[0]; statObj={[chosen]:1}; }
    if(statObj){ Object.entries(statObj).forEach(([k,v])=>{addStat(stats,k,v,20); fnotes.push(`${fn}: ${abbr[k]} +${v}`);}); }
  });
  fnotes.forEach(x=>steps.push(x));
  const h=applyHierarchy(stats,ctx); // mutates stats after normal cap, up to rank cap if set
  h.steps.forEach(x=>steps.push(x));
  return {stats,steps,hierarchy:h,asiEvents,asiPointsUsed:asiPoints,featPenalty,nationBonus:nb,featNotes:fnotes};
}
function rankOrder(rank){return {'I':1,'II':2,'III':3,'IV':4,'V':5,'VI':6,'VII':7,'VIII':8}[rank]||0}
function hierarchyProfileSummary(profile){
  if(!profile) return 'Числовых изменений нет.';
  const parts=[];
  if(profile.hp) parts.push(`ОЗ ${sign(profile.hp)}`);
  if(profile.hitDiceMult) parts.push(`Кости Хитов ×${profile.hitDiceMult}`);
  if(profile.ac) parts.push(`КД ${sign(profile.ac)}`);
  if(profile.attack||profile.damage) parts.push(`атака/урон ${sign(profile.attack||0)}/${sign(profile.damage||0)}`);
  if(profile.speed) parts.push(`скорость ${sign(profile.speed)} фт`);
  if(profile.initiative) parts.push(`инициатива ${sign(profile.initiative)}${profile.initiativeAdv?' и преимущество':''}`);
  else if(profile.initiativeAdv) parts.push('преимущество инициативы');
  if(profile.saves) parts.push(`спасброски ${sign(profile.saves)}`);
  if(profile.stability) parts.push(`устойчивость ${sign(profile.stability)}`);
  if(profile.dc) parts.push(`СЛ плетений ${sign(profile.dc)}`);
  if(profile.regen) parts.push(`регенерация ${profile.regen}`);
  if(profile.conductivity) parts.push(`проводимость ${profile.conductivity}`);
  return parts.join(' · ')||'Числовых изменений нет.';
}
function getSelectedHierarchy(){return hierarchyDb.getHierarchy?hierarchyDb.getHierarchy($('npc-faction')?.value):null}
function hierarchyChoiceKey(hierarchyId,kind,rank,slot){return `${hierarchyId}:${kind}:${rank}:${slot}`}
function readHierarchyStatChoices(){
  const out={stats:{},penalties:{}};
  document.querySelectorAll('[data-hierarchy-stat]').forEach(el=>{
    const kind=el.dataset.hierarchyKind==='penalty'?'penalties':'stats';
    const rank=el.dataset.hierarchyRank, amount=Number(el.dataset.hierarchyAmount)||0;
    (out[kind][rank]=out[kind][rank]||[]).push({key:el.value,amount,slot:Number(el.dataset.hierarchySlot)||0});
  });
  return out;
}
function renderHierarchyStatChoices(){
  const box=$('hierarchy-stat-allocation'), hierarchy=getSelectedHierarchy(), rank=$('npc-rank')?.value;
  if(!box||!hierarchy||!rankOrder(rank)){if(box)box.innerHTML='';return;}
  const mechanics=hierarchy.mechanics||{}, rn=rankOrder(rank);
  document.querySelectorAll('[data-hierarchy-stat]').forEach(el=>{hierarchyChoiceMemory[hierarchyChoiceKey(el.dataset.hierarchyId,el.dataset.hierarchyKind,el.dataset.hierarchyRank,el.dataset.hierarchySlot)]=el.value;});
  const priorities=Array.from(new Set([...primaryStats(getClass(),$('npc-role')?.value),...(mechanics.priorities||[]),'con','wis','dex','str','int','cha']));
  const makeSelect=(kind,rk,slot,amount,defaultKey)=>{
    const key=hierarchyChoiceKey(hierarchy.id,kind,rk,slot), selected=hierarchyChoiceMemory[key]||defaultKey||priorities[slot%priorities.length]||statKeys[slot%statKeys.length];
    return `<label class="hierarchy-stat-select"><span>${amount>0?'+':''}${amount}</span><select data-hierarchy-stat data-hierarchy-id="${safe(hierarchy.id)}" data-hierarchy-kind="${kind}" data-hierarchy-rank="${rk}" data-hierarchy-slot="${slot}" data-hierarchy-amount="${amount}">${statKeys.map(k=>`<option value="${k}" ${k===selected?'selected':''}>${abbr[k]} · ${ruStat[k]}</option>`).join('')}</select></label>`;
  };
  const rows=[];
  const current=mechanics.ranks[rank]||{};
  if(current.penaltyPoints){
    const pg=mechanics.penaltyGrant||{choices:current.penaltyPoints,amount:-1,distinct:true};
    rows.push(`<div class="hierarchy-stat-rank"><div class="hierarchy-stat-rank-label">${rank} · цена</div><div class="hierarchy-stat-selects">${Array.from({length:pg.choices||current.penaltyPoints},(_,i)=>makeSelect('penalty',rank,i,pg.amount||-1,priorities[i])).join('')}</div></div>`);
  }
  let pointSlot=0;
  Object.entries(mechanics.ranks||{}).sort((a,b)=>rankOrder(a[0])-rankOrder(b[0])).filter(([rk,r])=>rankOrder(rk)<=rn&&r.statPoints).forEach(([rk,r])=>{
    const grant=mechanics.statGrant||{mode:'points',amount:1};
    const count=grant.mode==='paired'?(grant.choices||2):Math.max(1,Math.ceil(Number(r.statPoints)/(grant.amount||1)));
    const amount=grant.mode==='paired'?(grant.amount||1):(grant.amount||1);
    rows.push(`<div class="hierarchy-stat-rank"><div class="hierarchy-stat-rank-label">Ранг ${rk}</div><div><div class="hierarchy-stat-selects">${Array.from({length:count},(_,i)=>makeSelect('stat',rk,i,amount,grant.mode==='points'?priorities[pointSlot++%priorities.length]:priorities[i])).join('')}</div><div class="hierarchy-allocation-note">Предел на этом ранге: ${r.cap||20}${r.statCaps?' (отдельные характеристики могут иметь иной предел)':''}.</div></div></div>`);
  });
  box.innerHTML=rows.length?`<strong>Распределение характеристик</strong>${rows.join('')}`:'';
}
function normalizeDistinctHierarchyChoice(changed){
  if(!changed||!changed.matches('[data-hierarchy-stat]'))return;
  const hierarchy=getSelectedHierarchy(), grant=changed.dataset.hierarchyKind==='penalty'?(hierarchy?.mechanics?.penaltyGrant):(hierarchy?.mechanics?.statGrant);
  if(!grant?.distinct)return;
  const peers=[...document.querySelectorAll(`[data-hierarchy-stat][data-hierarchy-kind="${changed.dataset.hierarchyKind}"][data-hierarchy-rank="${changed.dataset.hierarchyRank}"]`)];
  const used=new Set();
  peers.forEach(el=>{if(!used.has(el.value)){used.add(el.value);return;} const replacement=statKeys.find(k=>!used.has(k)); if(replacement){el.value=replacement;used.add(replacement);}});
}
function initHierarchyControls(){
  const select=$('npc-faction'); if(!select) return;
  select.innerHTML='<option value="none">Без иерархии</option>'+(hierarchyDb.hierarchies||[]).filter(h=>h.mechanics).map(h=>`<option value="${safe(h.id)}">${safe(h.name)}</option>`).join('');
  updateHierarchyControls(true);
}
function updateHierarchyControls(resetRank){
  const hierarchy=getSelectedHierarchy(), rankSelect=$('npc-rank'), options=$('hierarchy-options'), branchField=$('hierarchy-branch-field'), branchSelect=$('npc-hierarchy-branch'), summary=$('hierarchy-selection-summary');
  if(!rankSelect||!options) return;
  if(!hierarchy){
    rankSelect.innerHTML='<option value="0">—</option>'; options.hidden=true; renderHierarchyStatChoices(); return;
  }
  const ranks=(hierarchy.ranks||[]).map(r=>r.rank).filter(r=>hierarchy.mechanics.ranks[r]);
  const previous=resetRank?'':rankSelect.value;
  rankSelect.innerHTML=ranks.map(r=>`<option value="${r}">${r} · ${safe((hierarchy.ranks.find(x=>x.rank===r)||{}).name||'')}</option>`).join('');
  rankSelect.value=ranks.includes(previous)?previous:ranks[0];
  const selectedRank=rankSelect.value, branchNeeded=(hierarchy.mechanics.branches||[]).length && rankOrder(selectedRank)>=rankOrder(hierarchy.mechanics.branchFromRank||'I');
  branchField.hidden=!branchNeeded;
  if(branchNeeded){
    const oldBranch=branchSelect.value;
    branchSelect.innerHTML=hierarchy.mechanics.branches.map(b=>`<option value="${safe(b.id)}">${safe(b.name)}</option>`).join('');
    if(hierarchy.mechanics.branches.some(b=>b.id===oldBranch)) branchSelect.value=oldBranch;
  } else branchSelect.innerHTML='';
  const sharaVessel=$('hierarchy-shara-vessel-field'), throneProfile=$('hierarchy-throne-profile-field'), screamFields=$('hierarchy-scream-fields');
  if(sharaVessel) sharaVessel.hidden=!(hierarchy.mechanics.type==='shara'&&selectedRank==='V');
  if(throneProfile) throneProfile.hidden=!(hierarchy.id==='crystal-throne'&&selectedRank==='VI');
  if(screamFields) screamFields.hidden=hierarchy.mechanics.type!=='scream';
  const row=(hierarchy.ranks||[]).find(r=>r.rank===selectedRank)||{};
  const profile=hierarchy.mechanics.ranks[selectedRank]||{};
  summary.innerHTML=`<strong>${safe(hierarchy.name)} · ${safe(hierarchy.mechanics.version||hierarchy.version||'')}</strong>${safe(row.name||'')}<div class="mechanics-line">${safe(hierarchyProfileSummary(profile))}</div><a href="${safe(hierarchy.source||'#')}" target="_blank" rel="noopener">Открыть полные правила</a>`;
  options.hidden=false;
  renderHierarchyStatChoices();
}
function applyHierarchy(stats,ctx){
  const out={name:'',type:'',color:'#b07ae8',items:[],traits:[],hpBonus:0,hpMult:null,acBonus:0,attackBonus:0,damageBonus:0,forceDamageDie:'',speedBonus:0,initiativeBonus:0,initiativeAdv:false,saveBonus:0,dcBonus:0,weavePower:0,weaveAttack:0,weaveDamageDice:0,weaveRangeMult:1,extraSlots:0,regen:0,stability:0,conductivity:0,cap:20,steps:[],branch:'',source:'',version:'',profile:null,statChoices:ctx.hierarchyChoices||{stats:{},penalties:{}},chargeActive:true};
  const hdb=hierarchyDb.getHierarchy?hierarchyDb.getHierarchy(ctx.faction):null; const rn=rankOrder(ctx.rank);
  if(!hdb||!hdb.mechanics||!rn) return out;
  const mechanics=hdb.mechanics, profile=mechanics.ranks[ctx.rank]; if(!profile) return out;
  const branch=(mechanics.branches||[]).find(b=>b.id===ctx.branch);
  out.name=hdb.name+', Ранг '+ctx.rank+(branch?' · '+branch.name:''); out.type=mechanics.type||ctx.faction; out.color=mechanics.color||out.color; out.branch=branch?branch.name:''; out.source=hdb.source; out.version=mechanics.version||hdb.version||''; out.profile=profile;

  const priorities=primaryStats(ctx.cls,ctx.role), choices=ctx.hierarchyChoices||{stats:{},penalties:{}}, hierarchyTotals={};
  if(profile.penaltyPoints){
    const picked=(choices.penalties&&choices.penalties[ctx.rank])||[]; const used=[]; const fallback=Array.from({length:profile.penaltyPoints},(_,i)=>({key:priorities[i%priorities.length],amount:-1}));
    (picked.length?picked:fallback).forEach(choice=>{const key=choice.key;if(!statKeys.includes(key))return;stats[key]=Math.max(1,(stats[key]||10)+(Number(choice.amount)||-1));used.push(abbr[key]+' −1');});
    out.steps.push(`${hdb.name} ${ctx.rank}: временная цена ранга — ${used.join(', ')}`);
  }
  if(profile.fixedStats){Object.entries(profile.fixedStats).forEach(([key,value])=>{stats[key]=Math.max(1,(stats[key]||10)+Number(value)); out.steps.push(`${hdb.name} ${ctx.rank}: ${abbr[key]} ${sign(value)}`);});}
  Object.entries(mechanics.ranks).sort((a,b)=>rankOrder(a[0])-rankOrder(b[0])).filter(([rk])=>rankOrder(rk)<=rn).forEach(([rk,r])=>{
    if(!r.statPoints) return;
    const caps=Object.assign({default:r.cap||20},r.statCaps||{});
    if(hdb.id==='crystal-throne'&&rk==='VI'&&ctx.profileKind!=='unique') caps.default=24;
    const picked=(choices.stats&&choices.stats[rk])||[];
    if(!picked.length){distributeStatPoints(stats,r.statPoints,priorities,caps,hdb.name+' '+rk,out.steps);return;}
    const used=new Set();
    picked.forEach(choice=>{
      const key=choice.key, amount=Number(choice.amount)||0, grant=mechanics.statGrant||{};
      if(!statKeys.includes(key)||!amount)return;
      if(grant.distinct&&used.has(key)){out.steps.push(`${hdb.name} ${rk}: повтор ${abbr[key]} пропущен — на этом ранге нужны разные характеристики.`);return;}
      used.add(key);
      let allowed=amount;
      if(grant.perStatMax) allowed=Math.min(allowed,Math.max(0,Number(grant.perStatMax)-(hierarchyTotals[key]||0)));
      const before=stats[key]||10, limit=Number(caps[key]||caps.default||20), applied=Math.min(allowed,Math.max(0,limit-before));
      if(applied>0){addStat(stats,key,applied,limit);hierarchyTotals[key]=(hierarchyTotals[key]||0)+applied;out.steps.push(`${hdb.name} ${rk}: ${abbr[key]} +${applied} (выбор ГМ)`);}
      if(applied<amount)out.steps.push(`${hdb.name} ${rk}: ${abbr[key]} — ${amount-applied} пункт(ов) не применены из-за предела.`);
    });
  });

  out.cap=(hdb.id==='crystal-throne'&&ctx.rank==='VI'&&ctx.profileKind!=='unique')?24:(profile.cap||20); out.hpBonus=profile.hp||0; out.hpMult=profile.hitDiceMult||null; out.acBonus=profile.ac||0; out.attackBonus=profile.attackByBranch?Number(profile.attackByBranch[ctx.branch]||0):Number(profile.attack||0); out.damageBonus=profile.damage||0; out.forceDamageDie=profile.forceDamageDieByBranch?String(profile.forceDamageDieByBranch[ctx.branch]||''):'';
  out.speedBonus=profile.speedByBranch?Number(profile.speedByBranch[ctx.branch]||0):Number(profile.speed||0);
  out.initiativeBonus=Number(profile.initiative||0); out.initiativeAdv=!!profile.initiativeAdv; out.saveBonus=Number(profile.saves||0);
  if(mechanics.type==='scream'){
    out.chargeActive=ctx.screamCharge!==false;
    out.initiativeBonus=ctx.screamInitiative==='exceptional'?Number(profile.initiativeExceptional||0):ctx.screamInitiative==='success'?Number(profile.initiative||0):0;
    if(!out.chargeActive){out.acBonus=0;out.speedBonus=0;out.initiativeBonus=0;out.initiativeAdv=false;out.stability=0;}
  }
  const rawDc=profile.dcByBranch?Number(profile.dcByBranch[ctx.branch]||0):Number(profile.dcByChanneler||profile.dc||0);
  out.dcBonus=ctx.isChanneler?rawDc:0;
  out.weavePower=ctx.isChanneler?Number(profile.weavePower||0):0; out.weaveAttack=ctx.isChanneler?Number(profile.weaveAttack||0):0; out.weaveDamageDice=ctx.isChanneler?Number(profile.weaveDamageDice||0):0; out.weaveRangeMult=ctx.isChanneler?Number(profile.weaveRangeMult||1):1; out.extraSlots=ctx.isChanneler?Number(profile.extraSlots||0):0; out.regen=Number(profile.regen||0); out.stability=Number(profile.stability||0); out.conductivity=Number(profile.conductivity||0);
  if(mechanics.type==='scream'&&!out.chargeActive) out.stability=0;
  const abilities=hierarchyDb.getAbilities?hierarchyDb.getAbilities(hdb.id,ctx.rank,ctx.branch,ctx.isChanneler):(hdb.abilities||[]);
  abilities.forEach(a=>{const item={n:a.name,d:a.description,rank:a.rank,path:a.path,type:a.type,source:a.source||hdb.source};out.items.push(item);out.traits.push({n:a.name,d:a.description,rank:a.rank,path:a.path,type:a.type,hi:true,source:'hierarchy',color:out.color});});
  out.items.push({n:'Ранговый профиль',d:hierarchyProfileSummary({hp:out.hpBonus,hitDiceMult:out.hpMult,ac:out.acBonus,attack:out.attackBonus,damage:out.damageBonus,speed:out.speedBonus,initiative:out.initiativeBonus,initiativeAdv:out.initiativeAdv,saves:out.saveBonus,stability:out.stability,dc:out.dcBonus,regen:out.regen,conductivity:out.conductivity})+(out.forceDamageDie?' · дополнительный силовой урон '+out.forceDamageDie:''),rank:ctx.rank});
  if(mechanics.type==='scream') out.items.push({n:'Состояние кварцевого заряда',d:out.chargeActive?'Настроенный заряд есть: зависимые от него ранговые бонусы включены.':'Настроенного заряда нет: ранговые КД, скорость, инициатива и устойчивость отключены; повышения характеристик сохранены.',rank:ctx.rank});
  if(mechanics.profileNote) out.items.push({n:'Условие профиля',d:mechanics.profileNote,rank:ctx.rank});
  out.items.push({n:'Наследование рангов',d:'Уникальные способности нижестоящих рангов сохранены. Числовые значения взяты из итогового профиля выбранного ранга и не сложены повторно.',rank:ctx.rank});
  return out;
}
function avgHp(cls,lv,con,h){const die=hitDie[cls]||8, conPart=lv*mod(con), hitDicePart=die+Math.max(0,lv-1)*(Math.floor(die/2)+1); const scaled=h&&h.hpMult?Math.floor(hitDicePart*h.hpMult):hitDicePart; return Math.max(1,scaled+conPart+(h?h.hpBonus:0));}
function initClassSelect(){
  const classes=Array.from(new Set(clsDb.features.map(f=>f.className).filter(Boolean))).sort((a,b)=>a.localeCompare(b));
  $('npc-class').innerHTML=classes.map(c=>`<option>${safe(c)}</option>`).join('');
  if(classes.includes('Варвар')) $('npc-class').value='Варвар'; updateArchSelect();
}
function updateArchSelect(){
  const c=getClass(), override=CLASS_ARCHETYPE_OVERRIDES[c];
  const archs=override?[...override]:Array.from(new Set(clsDb.features.filter(f=>f.className===c).map(f=>f.archetype).filter(a=>a&&a!=='Базовый класс'))).sort((a,b)=>a.localeCompare(b));
  $('npc-arch').innerHTML=(override?'':'<option value="Базовый класс">Базовый класс</option>')+archs.map(a=>`<option>${safe(a)}</option>`).join('');
  updateFightingStyleSelect();
}
function initNationSelect(){ const nats=Object.keys(rules.nationBonuses||{}).sort((a,b)=>a.localeCompare(b)); const inp=$('npc-nation'); if(!inp) return; const val=inp.value||'Андор'; const old=$('nation-list'); if(old)old.remove(); const dl=document.createElement('datalist'); dl.id='nation-list'; dl.innerHTML=nats.map(n=>`<option value="${safe(n)}" label="${LAND_MADMEN_NATIONS.includes(n)?'Земля Безумцев':'Основные народы'}">`).join(''); document.body.appendChild(dl); inp.setAttribute('list','nation-list'); inp.value=val; }
function initEquipment(){
  const W=(rules.equipment&&rules.equipment.weapons)||[], A=(rules.equipment&&rules.equipment.armor)||[], S=(rules.equipment&&rules.equipment.shields)||[];
  $('weapon-select').innerHTML=W.map((w,i)=>`<option value="${i}">${safe(w.name)} · ${safe(w.damage)}</option>`).join('');
  const armorGroups=[['none','Без доспеха'],['cloth','Тканевая защитная одежда'],['light','Лёгкие доспехи'],['medium','Средние доспехи'],['heavy','Тяжёлые доспехи']];
  $('armor-select').innerHTML=armorGroups.map(([category,label])=>`<optgroup label="${safe(label)}">${A.map((a,i)=>({a,i})).filter(x=>x.a.category===category).map(x=>`<option value="${x.i}">${safe(x.a.name)} · КД ${x.a.base}${x.a.dexMax===0?'':'+ЛОВ'}</option>`).join('')}</optgroup>`).join('');
  $('shield-select').innerHTML=S.map((s,i)=>`<option value="${i}">${safe(s.name)} ${s.ac?'+КД '+s.ac:''}</option>`).join('');
}
function initFeats(){
  const list=$('feat-list'), q=($('feat-search').value||'').toLowerCase();
  const selected=new Set(selectedFeats());
  list.innerHTML=feats.filter(f=>!q||String(f.name).toLowerCase().includes(q)||String(f.cls).toLowerCase().includes(q)||String(f.req).toLowerCase().includes(q)).slice(0,140).map((f,i)=>{
    const checked=selected.has(f.name)?'checked':'';
    return `<label class="check"><input type="checkbox" ${checked} value="${safe(f.name)}" data-name="${safe(f.name)}"><span><b>${safe(f.name)}</b> <small>${safe(f.cls&&f.cls!=='—'?f.cls:'')} ${safe(f.req&&f.req!=='—'?'· '+f.req:'')}</small></span></label>`;
  }).join('')||'<div class="mono warn">Ничего не найдено.</div>';
  list.querySelectorAll('input').forEach(i=>i.addEventListener('change',buildNpc));
}
function selectedFeats(){return Array.from(document.querySelectorAll('#feat-list input:checked')).map(i=>i.dataset.name)}
function getFeatCostSignature(featsSel=selectedFeats()){return [getClass(),getLevel(),$('npc-role')?.value||'',...featsSel.slice().sort((a,b)=>a.localeCompare(b))].join('|')}
function getFeatCostPlan(cls,lv,role,featCount){ const events=getAsiEvents(cls,lv), total=events.length*2, paid=Math.min(featCount,total), pri=primaryStats(cls,role), removed=[]; for(let i=Math.max(0,total-paid);i<total;i++){removed.push({level:events[Math.floor(i/2)]||'?',stat:abbr[pri[i%pri.length]||'con']});} return {total,paid,unpaid:Math.max(0,featCount-paid),removed}; }
function syncFeatCostConfirmation(featsSel=selectedFeats()){
  const panel=$('feat-confirm-panel'), checkbox=$('feat-cost-confirm'), details=$('feat-cost-details'); if(!panel||!checkbox||!details)return {confirmed:!featsSel.length,plan:getFeatCostPlan(getClass(),getLevel(),$('npc-role')?.value||'',featsSel.length)};
  const signature=getFeatCostSignature(featsSel), plan=getFeatCostPlan(getClass(),getLevel(),$('npc-role')?.value||'',featsSel.length);
  panel.hidden=!featsSel.length;
  if(checkbox.dataset.signature!==signature){checkbox.checked=false;checkbox.dataset.signature=signature;}
  checkbox.disabled=plan.unpaid>0;
  const paid=plan.removed.length?plan.removed.map(x=>`${x.level}-й ур.: ${x.stat} +1`).join('; '):'нет доступных уровневых приростов';
  details.textContent=`Выбраны: ${featsSel.join(', ')||'нет'}. Не добавляются: ${paid}.${plan.unpaid?` Не оплачено черт: ${plan.unpaid}. Повысьте уровень или снимите выбор.`:''}`;
  return {confirmed:!featsSel.length||(!checkbox.disabled&&checkbox.checked),plan};
}
function isFeatCostConfirmed(){return syncFeatCostConfirmation(selectedFeats()).confirmed}
function applyTemplate(){
  let t=clone(roleTemplates[$('npc-role').value]||roleTemplates.Сбалансированный);
  if(/Носитель Договора/i.test(getClass())){
    const values=Object.values(t).map(Number).sort((a,b)=>b-a), order=['cha','con','dex','wis','int','str'];
    t=order.reduce((acc,key,index)=>{acc[key]=values[index];return acc;},{});
  }
  Object.entries(t).forEach(([k,v])=>$(k).value=v); buildNpc();
}
function findClassFeature(name,level,archetype='Базовый класс'){
  const found=clsDb.features.find(f=>f.className==='Носитель Договора'&&f.feature===name);
  return found?Object.assign({},found,{levelSort:level,archetype}):null;
}
function makePactFeature(name,description,level=1,archetype='Базовый класс'){return {className:'Носитель Договора',archetype,level:String(level),levelSort:level,category:'Сводка генератора',feature:name,description};}
function pactFeatures(patron,anchor,lv){
  const selected=[
    makePactFeature('Плетения Договора','Харизма — базовая характеристика Плетений Договора. СЛ = 8 + бонус мастерства + модификатор Харизмы; атака плетением = бонус мастерства + модификатор Харизмы. Все ячейки Договора восстанавливаются после короткого или продолжительного отдыха.',1),
    findClassFeature('Видение нитей',1),
    findClassFeature('Последнее эхо',1)
  ].filter(Boolean);
  (PACT_PATRON_FEATURES[patron]||[]).filter(([level])=>level<=lv).forEach(([level,name])=>{const feature=findClassFeature(name,level,patron);if(feature)selected.push(feature);});
  if(lv<3){const focus=findClassFeature('Фокус Договора',1);if(focus)selected.push(focus);}
  if(lv>=3&&anchor)(PACT_ANCHOR_RULES[anchor]?.features||[]).filter(([level])=>level<=lv).forEach(([level,name])=>{const feature=findClassFeature(name,level,PACT_ANCHOR_RULES[anchor].label);if(feature)selected.push(feature);});
  if(lv>=2){
    const secretCount=2+(lv>=5?1:0)+(lv>=9?1:0)+(lv>=15?1:0);
    selected.push(makePactFeature(`Тайные матрицы · ${secretCount}`,`На этом уровне Носитель знает ${secretCount} Тайные матрицы, выбранные игроком из каталога с соблюдением требований. Каталог вариантов не является списком автоматически полученных черт, поэтому конкретные матрицы нужно зафиксировать отдельно.`,2));
  }
  const matrices=PACT_FORBIDDEN_MATRICES[patron]||[];
  PACT_FORBIDDEN_THRESHOLDS.forEach((threshold,index)=>{if(lv<threshold||!matrices[index])return;const feature=findClassFeature(matrices[index],threshold,patron);if(feature){feature.description+=`\n\nЭто автоматическая Запретная матрица Покровителя ${index+6}-го уровня. При получении матрицы её можно заменить другой матрицей того же уровня по правилам класса.`;selected.push(feature);}});
  if(lv>=20){const master=findClassFeature('Мастер Договора',20);if(master)selected.push(master);}
  return selected.sort((a,b)=>(Number(a.levelSort||0)-Number(b.levelSort||0))||String(a.feature).localeCompare(String(b.feature),'ru'));
}
function availableFeatures(cls,arch,lv,anchor=''){
  if(/Носитель Договора/i.test(cls))return pactFeatures(arch,anchor,lv);
  return clsDb.features.filter(f=>f.className===cls && Number(f.levelSort||0)<=lv && (f.archetype==='Базовый класс'||f.archetype===arch))
    .filter(f=>!/(Параметры класса|Владение|Снаряжение|Создание)/i.test(String(f.category||'')) || /Увеличение характеристик/.test(String(f.feature||'')))
    .sort((a,b)=>(Number(a.levelSort||0)-Number(b.levelSort||0))||String(a.feature).localeCompare(String(b.feature)));
}
function getEquipment(){
  const W=(rules.equipment&&rules.equipment.weapons)||[], A=(rules.equipment&&rules.equipment.armor)||[], S=(rules.equipment&&rules.equipment.shields)||[];
  const w=W[Number($('weapon-select').value)||0]||W[0]||{name:'Оружие',damage:'1к8',stat:'str',type:'melee'};
  const a=A[Number($('armor-select').value)||0]||A[0]||{name:'Без доспеха',base:10,dexMax:null,category:'none'};
  const s=S[Number($('shield-select').value)||0]||S[0]||{name:'Нет',ac:0};
  return {weapon:w,armor:a,shield:s,weaponBonus:Number($('weapon-bonus').value)||0,armorBonus:Number($('armor-bonus').value)||0,shieldBonus:Number($('shield-bonus').value)||0};
}
function calcAc(cls,stats,eq,h,style){
  const a=eq.armor, shield=(eq.shield.ac||0)+eq.shieldBonus, dex=mod(stats.dex); let ac=10+dex;
  let note='Без доспеха: 10 + ЛОВ';
  if(a.category==='none'){
    if(/Варвар/.test(cls)){ ac=10+dex+mod(stats.con)+shield; note='Защита без доспехов Варвара: 10 + ЛОВ + ТЕЛ + щит'; }
    else ac=10+dex+shield;
  }else{
    const dexPart=a.dexMax===null?dex:Math.min(dex,a.dexMax); ac=a.base+dexPart+eq.armorBonus+shield; note=`${a.name}: ${a.base} + ЛОВ${a.dexMax===null?'':' макс. '+a.dexMax} + магия/щит`;
  }
  if(style && style.id==='defense' && a.category!=='none' && a.isArmor!==false){ ac+=1; note+=' + стиль Защита +1'; }
  if(a.isArmor===false) note+=' · защитная одежда не считается доспехом';
  ac+=h.acBonus||0; if(h.acBonus) note+=` + Иерархия ${h.acBonus}`;
  return {ac,note};
}
function hasFeat(name,sel){return sel.some(x=>x.toLowerCase()===name.toLowerCase())}
function calcAttack(cls,stats,eq,p,featsSel,h,style,pactAnchor='',lv=1){
  const w=eq.weapon; let stat=w.stat||'str'; if(w.properties&&/Finesse|фехтов/i.test(w.properties)){ stat=mod(stats.dex)>=mod(stats.str)?'dex':'str'; }
  const pactBladeSelected=/Носитель Договора/i.test(cls)&&pactAnchor==='blade'&&Number(lv)>=3;
  const pactBlade=pactBladeSelected&&!/^Без оружия$/i.test(String(w.name||''));
  if(pactBlade)stat='cha';
  let attack=mod(stats[stat])+p+eq.weaponBonus+(h.attackBonus||0); let dmgBonus=mod(stats[stat])+eq.weaponBonus+(h.damageBonus||0);
  const notes=[], attackParts=[`${abbr[stat]} ${sign(mod(stats[stat]))}`,`БМ ${sign(p)}`], damageParts=[`${abbr[stat]} ${sign(mod(stats[stat]))}`], extraDamage=[];
  if(pactBlade){notes.push('Якорь Клинка: выбранное оружие считается связанным; для атаки и урона используется Харизма');if(Number(lv)>=5)notes.push('Договорный клинок: 2 атаки при действии Атака (не складывается с Дополнительной атакой)');if(Number(lv)>=7)extraDamage.push('1к8 силового (1/ход)');if(Number(lv)>=12)extraDamage.push(`${Math.max(1,mod(stats.cha))} силового (каждое попадание)`);}
  else if(pactBladeSelected)notes.push('Якорь Клинка выбран, но связанное оружие не указано: выберите оружие в разделе «Экипировка»');
  if(eq.weaponBonus){attackParts.push(`оружие ${sign(eq.weaponBonus)}`);damageParts.push(`оружие ${sign(eq.weaponBonus)}`);}
  if(h.attackBonus)attackParts.push(`Иерархия ${sign(h.attackBonus)}`);
  if(h.damageBonus)damageParts.push(`Иерархия ${sign(h.damageBonus)}`);
  if(hasFeat('Пламя и пустота',featsSel)){ attack+=mod(stats.wis); attackParts.push(`Пламя и пустота ${sign(mod(stats.wis))}`); notes.push(`Пламя и пустота: ${sign(mod(stats.wis))} МДР к атаке`); }
  if(style){
    if(style.id==='archery' && w.type==='ranged'){ attack+=2; attackParts.push('Стрельба +2'); notes.push(`${style.n}: +2 к атаке дальнобойным оружием`); }
    if(style.id==='dueling' && w.type==='melee' && !/two-handed|двуруч/i.test(w.properties||'')){ dmgBonus+=2; damageParts.push('Дуэль +2'); notes.push(`${style.n}: +2 к урону одноручным оружием`); }
    if(style.id==='great_weapon') notes.push(`${style.n}: переброс 1–2 на кубиках урона двуручного/универсального оружия`);
    if(style.id==='protection') notes.push(`${style.n}: реакция, помеха атаке по союзнику в 5 фт при наличии щита`);
    if(style.id==='two_weapon') notes.push(`${style.n}: модификатор характеристики добавляется к урону второй атаки`);
  }
  if(/Варвар/.test(cls)&&w.type==='melee') notes.push('Ярость добавляет урон ярости только при атаке Силой и активной ярости.');
  if(hasFeat('Мастер большого оружия',featsSel) && /Heavy|тяж/i.test(w.properties||'')) notes.push('Мастер большого оружия: можно −5 к атаке / +10 к урону.');
  if(hasFeat('Меткий стрелок',featsSel) && w.type==='ranged') notes.push('Меткий стрелок: можно −5 к атаке / +10 к урону, игнор укрытий.');
  if(h.forceDamageDie){extraDamage.push(`${h.forceDamageDie} силового (Иерархия)`);notes.push(`Иерархия: +${h.forceDamageDie} силового урона при подходящей оружейной атаке`);}
  const damage=`${w.damage}${sign(dmgBonus)}${extraDamage.length?' + '+extraDamage.join(' + '):''}`;
  const formula=`Атака: ${attackParts.join(' + ')} = ${sign(attack)}. Урон: ${w.damage} + ${damageParts.join(' + ')} = ${w.damage}${sign(dmgBonus)}${extraDamage.length?'; дополнительно '+extraDamage.join(' + '):''}.`;
  return {n:w.name,a:sign(attack),d:damage,t:w.type==='ranged'?'Прон.':'Руб./Прон.',r:w.type==='ranged'?'дистанция по оружию':'Ближний',no:[w.properties, ...notes].filter(Boolean).join(' · '),formula,stat,attacks:pactBlade&&Number(lv)>=5?2:1};
}

function findWeavesInput(){
  const titles = new Set(getSelectedWeaveTitles());
  const manual = ($('npc-weaves') ? $('npc-weaves').value : '').split(/[;,\n]/).map(s=>s.trim()).filter(Boolean);
  manual.forEach(x=>titles.add(x));
  return [...titles].map(n=>weaves.find(w=>normText(w.title)===normText(n))||{title:n,level:'?',school:'?',desc:['Плетение не найдено в базе.']});
}
function buildGeneratorSnapshot(){
  const value=id=>$(id)?.value??'', checked=id=>!!$(id)?.checked;
  return {schemaVersion:5,hierarchyDbVersion:hierarchyDb.updated||'',inputs:{
    name:value('npc-name'),nation:value('npc-nation'),level:value('npc-level'),cls:value('npc-class'),arch:value('npc-arch'),role:value('npc-role'),threat:value('npc-threat'),
    faction:value('npc-faction'),rank:value('npc-rank'),branch:value('npc-hierarchy-branch'),sharaVessel:value('npc-shara-vessel'),profileKind:value('npc-hierarchy-profile-kind'),
    screamInitiative:value('npc-scream-initiative'),screamInitiativeStat:value('npc-scream-initiative-stat'),screamCharge:checked('npc-scream-charge'),
    stats:getBaseStats(),hierarchyChoices:readHierarchyStatChoices(),fightingStyle:value('npc-fighting-style'),feats:selectedFeats(),featCostConfirmed:isFeatCostConfirmed(),ajah:value('npc-ajah'),pactAnchor:value('npc-pact-anchor'),talents:getSelectedTalents(),affinities:getSelectedAffinities(),weaves:getSelectedWeaveTitles(),manualWeaves:value('npc-weaves'),
    weapon:value('weapon-select'),weaponBonus:value('weapon-bonus'),armor:value('armor-select'),armorBonus:value('armor-bonus'),shield:value('shield-select'),shieldBonus:value('shield-bonus')
  }};
}
function restoreGeneratorSnapshot(snapshot){
  const i=snapshot&&snapshot.inputs;if(!i){alert('Эта карточка сохранена старой версией и не содержит исходных настроек для пересчёта.');return;}
  const previousDbVersion=snapshot.hierarchyDbVersion||'';
  const wilderTraditionMigrated=i.cls==='Дичок'&&!WILDER_TRADITIONS.includes(i.arch);
  const restoredArch=wilderTraditionMigrated?WILDER_TRADITIONS[0]:i.arch;
  const set=(id,value)=>{const el=$(id);if(el&&value!==undefined&&value!==null)el.value=String(value);};
  set('npc-name',i.name);set('npc-nation',i.nation);set('npc-level',i.level);set('npc-class',i.cls);updateArchSelect();set('npc-arch',restoredArch);set('npc-role',i.role);set('npc-threat',i.threat);set('npc-ajah',i.ajah||'');set('npc-pact-anchor',i.pactAnchor||'');updateAjahControl();updatePactControls();
  statKeys.forEach(k=>set(k,i.stats&&i.stats[k]));
  set('weapon-select',i.weapon);set('weapon-bonus',i.weaponBonus);set('armor-select',i.armor);set('armor-bonus',i.armorBonus);set('shield-select',i.shield);set('shield-bonus',i.shieldBonus);
  set('npc-faction',i.faction||'none');updateHierarchyControls(true);set('npc-rank',i.rank);updateHierarchyControls(false);set('npc-hierarchy-branch',i.branch);set('npc-shara-vessel',i.sharaVessel);set('npc-hierarchy-profile-kind',i.profileKind);set('npc-scream-initiative',i.screamInitiative);set('npc-scream-initiative-stat',i.screamInitiativeStat);if($('npc-scream-charge'))$('npc-scream-charge').checked=i.screamCharge!==false;
  renderHierarchyStatChoices();
  const saved=i.hierarchyChoices||{};document.querySelectorAll('[data-hierarchy-stat]').forEach(el=>{const group=el.dataset.hierarchyKind==='penalty'?saved.penalties:saved.stats;const row=group&&group[el.dataset.hierarchyRank];const found=(row||[]).find(x=>Number(x.slot)===Number(el.dataset.hierarchySlot));if(found)el.value=found.key;});
  const restoredFeats=(i.feats||[]).map(normalizeFeatName);initFeats();document.querySelectorAll('#feat-list input').forEach(el=>el.checked=restoredFeats.includes(el.dataset.name));
  if($('feat-cost-confirm')){$('feat-cost-confirm').dataset.signature=getFeatCostSignature(restoredFeats);$('feat-cost-confirm').checked=!!i.featCostConfirmed;}
  renderTalentAffinityControls();document.querySelectorAll('[data-talent]').forEach(el=>el.checked=(i.talents||[]).includes(el.value));document.querySelectorAll('[data-affinity]').forEach(el=>el.checked=(i.affinities||[]).includes(el.value));
  renderWeavePicker();document.querySelectorAll('[data-weave-title]').forEach(el=>el.checked=(i.weaves||[]).includes(el.value));set('npc-weaves',i.manualWeaves);updateFightingStyleSelect();set('npc-fighting-style',i.fightingStyle);
  buildNpc();window.scrollTo({top:0,behavior:'smooth'});
  if(wilderTraditionMigrated) alert('В сохранённой карточке Дичка вместо Традиции был указан Исключительный талант. Установлена Традиция «Мудрый»: выберите «Странник» или «Сновидец», если это требуется персонажу, и сохраните карточку заново.');
  if(previousDbVersion&&previousDbVersion!==(hierarchyDb.updated||'')) alert(`Карточка пересчитана: база Иерархий обновилась с ${previousDbVersion} до ${hierarchyDb.updated}. Проверьте блок «до → после» и сохраните карточку заново.`);
}
function buildNpc(){
  const name=$('npc-name').value.trim()||'Новый NPC', nation=getNation(), lv=getLevel(), cls=getClass(), arch=getArch(), pactAnchor=getPactAnchor(), role=$('npc-role').value, faction=$('npc-faction').value, rank=$('npc-rank').value, branch=$('npc-hierarchy-branch')?.value||'', p=prof(lv), featsSel=selectedFeats();
  const featCostState=syncFeatCostConfirmation(featsSel);
  const style=getSelectedFightingStyle();
  const selectedTalents=getSelectedTalents(), selectedAffinities=getSelectedAffinities();
  const hierarchyChoices=readHierarchyStatChoices(), hierarchyCtx={cls,role,faction,rank,branch,isChanneler:isChannelingClass(cls),lv,nation,featsSel,hierarchyChoices,profileKind:$('npc-hierarchy-profile-kind')?.value||'regular',screamInitiative:$('npc-scream-initiative')?.value||'none',screamInitiativeStat:$('npc-scream-initiative-stat')?.value||'dex',screamCharge:$('npc-scream-charge')?.checked!==false};
  const baseStats=getBaseStats(), applied=applyStatBlock(baseStats,hierarchyCtx), baseline=applyStatBlock(baseStats,Object.assign({},hierarchyCtx,{faction:'none',rank:'0',branch:''})), stats=applied.stats, h=applied.hierarchy, eq=getEquipment(), acCalc=calcAc(cls,stats,eq,h,style), baselineAc=calcAc(cls,baseline.stats,eq,baseline.hierarchy,style), features=availableFeatures(cls,arch,lv,pactAnchor);
  const initiativeStat=h.type==='scream'?(hierarchyCtx.screamInitiativeStat||'dex'):'dex', hp=avgHp(cls,lv,stats.con,h), ini=mod(stats[initiativeStat])+(h.initiativeBonus||0), pp=10+mod(stats.wis)+p+((featsSel.includes('Внимательный'))?5:0);
  const baselineHp=avgHp(cls,lv,baseline.stats.con,baseline.hierarchy), baselineIni=mod(baseline.stats.dex), baselineAttack=calcAttack(cls,baseline.stats,eq,p,featsSel,baseline.hierarchy,style,pactAnchor,lv);
  const attack=calcAttack(cls,stats,eq,p,featsSel,h,style,pactAnchor,lv), hi=h.name?{id:faction,rank,branch:branch||null,vessel:h.type==='shara'&&rank==='V'?($('npc-shara-vessel')?.value||null):null,version:h.version,source:h.source,nm:h.name,ty:h.type,items:[...h.items,{n:'Сводные бонусы',d:`${hierarchyProfileSummary({hp:h.hpBonus,hitDiceMult:h.hpMult,ac:h.acBonus,attack:h.attackBonus,damage:h.damageBonus,speed:h.speedBonus,initiative:h.initiativeBonus,initiativeAdv:h.initiativeAdv,saves:h.saveBonus,stability:h.stability,dc:h.dcBonus,regen:h.regen,conductivity:h.conductivity})}. Атаки плетениями ${sign(h.weaveAttack)}; дополнительных кубиков урона ${h.weaveDamageDice}; дальность/область ×${h.weaveRangeMult}; дополнительных применений ${h.extraSlots}.`}]}:null;
  const spells=findWeavesInput().map(w=>({n:w.title,lv:w.level,tal:w.school||'',el:Array.isArray(w.powers)?w.powers.join(' · '):'',t:getCanonicalMetaValue(w,'Время создания')||w.cast||'—',r:getCanonicalMetaValue(w,'Дальность')||w.range||'—',area:getCanonicalMetaValue(w,'Цель или область')||'',dur:getCanonicalMetaValue(w,'Длительность')||w.duration||'Мгновенная',sb:getCanonicalMetaValue(w,'Спасбросок или бросок атаки')||w.save||'—',slot:String(w.level||0),dmg:w.damage||'—',ef:getWeaveSummary(w).slice(0,420),calc:'canonical-v165'}));
  const ab=[];
  features.forEach(f=>ab.push({n:f.feature,d:f.description,hi:Number(f.levelSort||0)===lv||f.archetype===arch,source:'class'}));
  if(style) ab.push({n:style.n,d:style.d,hi:true,source:'fighting-style'});
  featsSel.forEach(fn=>{const f=feats.find(x=>x.name===fn); ab.push({n:fn,d:f?f.desc.join(' '):'Дополнительная черта.',hi:false,source:'feat'});});
  h.traits.forEach(t=>ab.push({n:t.n,d:t.d,hi:true,source:'hierarchy',color:t.color}));
  const id=loadedCustomId||200000+Date.now()%100000000;
  const ajah=getAjah();
  const pact=/Носитель Договора/i.test(cls)?{patron:arch,anchor:pactAnchor||null,anchorLabel:getPactAnchorLabel(pactAnchor)||null,primary:'Харизма',supporting:'Телосложение',spellAttack:sign(mod(stats.cha)+p+(h.weaveAttack||0)),spellDc:8+p+mod(stats.cha)+(h.dcBonus||0),note:'Ловкость полезна для КД в лёгком доспехе. Условный урон способностей Покровителя учитывается в тексте черт, а не прибавляется ко всем оружейным атакам.'}:null;
  const combatSummary=pact?`Плетение: ${pact.spellAttack}, СЛ ${pact.spellDc} · ${attack.n}: ${attack.a}, ${attack.d}`:`${attack.n}: ${attack.a}, ${attack.d}`;
  const npc={id,sh:name,na:nation,lv,ic:/Дичок|Посвящ|Носитель Договора/.test(cls)?'🔥':/Лесник/.test(cls)?'🏹':/Скиталец/.test(cls)?'◇':/Варвар/.test(cls)?'🪓':'⚔',ty:hi?'purple':'warning',custom:true,ti:`${name} — ${cls}${arch&&arch!=='Базовый класс'?' / '+arch:''} ${lv}-го уровня`,su:`Черновик NPC · ${role} · ${$('npc-threat').value}`,tags:[cls,arch,pact&&pact.anchorLabel,ajah&&`${ajah} Айя`,`Ур.${lv}`,nation].filter(Boolean),ajah:ajah||undefined,pact:pact||undefined,talents:selectedTalents,affinities:selectedAffinities,st:stats,co:{hp,ac:acCalc.ac,sp:30+(h.speedBonus||0),ini:sign(ini)+(h.initiativeAdv?' / преим.':''),prof:sign(p),sv:`${cls==='Варвар'?'Сил, Тел':/Носитель Договора/.test(cls)?'Мдр, Хар':/Дичок|Посвящ/.test(cls)?'Инт, Мдр':'по классу'}${h.saveBonus?' +'+h.saveBonus+' от Иерархии':''}`,pp,cr:combatSummary},at:[attack],ab,hi,eq:[{r:!!(eq.weaponBonus||eq.armorBonus||eq.shieldBonus),t:`${eq.weapon.name}${eq.weaponBonus?` +${eq.weaponBonus}`:''}; ${eq.armor.name}${eq.armorBonus?` +${eq.armorBonus}`:''}; ${eq.shield.name}${eq.shieldBonus?` +${eq.shieldBonus}`:''}. КД: ${acCalc.note}.`}],sk:[{n:'Восприятие',v:sign(mod(stats.wis)+p),e:false,note:'Черновой расчёт.'},{n:'Проницательность',v:sign(mod(stats.wis)+p),e:false,note:'Черновой расчёт.'}],verify:[],tactics:[{ph:'Роль',d:`${role}. Уточните боевой паттерн под сцену.`},{ph:'Проверка ГМ',d:'Перед канонизацией проверьте ОЗ, КД, предметы, плетения и бонусы Иерархии.'}],dm:$('npc-notes')?.value||'Создано генератором. Требует утверждения ГМ.',generator:buildGeneratorSnapshot()};
  if(spells.length) npc.spells=spells;
  npc.verify=validateNpc({cls,arch,pactAnchor,pact,lv,nation,features,featsSel,featCostState,spells,h,stats,hp,ac:acCalc.ac,applied,eq,attack,selectedTalents,selectedAffinities,hierarchyCtx});
  currentNpc=npc; reviewReady=true; renderReview(npc,{applied,acCalc,attack,eq,baseline:{stats:baseline.stats,hp:baselineHp,ac:baselineAc.ac,speed:30,initiative:baselineIni,attack:baselineAttack.a}}); return npc;
}
function validateNpc(ctx){
  const out=[]; out.push({s:'ok',t:`Бонус мастерства: ${sign(prof(ctx.lv))}.`});
  out.push({s:'ok',t:`Рост характеристик: уровни ${ctx.applied.asiEvents.join(', ')||'нет'}; использовано пунктов +${ctx.applied.asiPointsUsed}.`});
  const nmatch=getNationMatch(ctx.nation);
  if(Object.keys(ctx.applied.nationBonus).length) out.push({s:'ok',t:`Бонус нации применён (${nmatch.key||ctx.nation}): ${Object.entries(ctx.applied.nationBonus).map(([k,v])=>abbr[k]+' +'+v).join(', ')}.`});
  else if(nmatch.status==='ambiguous') out.push({s:'warn',t:`Нация указана неоднозначно: ${ctx.nation}. Возможные варианты: ${(nmatch.candidates||[]).join(', ')}.`});
  else out.push({s:'warn',t:'Бонус нации не найден: проверьте написание нации.'});
  if(ctx.applied.featPenalty&&ctx.featCostState.plan.unpaid) out.push({s:'err',t:`Дополнительные черты не оплачены: не хватает ${ctx.featCostState.plan.unpaid} пункт(ов) уровневого прироста характеристик. Повысьте уровень NPC или снимите часть черт.`});
  else if(ctx.applied.featPenalty&&!ctx.featCostState.confirmed) out.push({s:'err',t:`Выбрано дополнительных черт: ${ctx.applied.featPenalty}. Генератор уменьшил авто-распределение, но подтверждение ГМ не поставлено в разделе «Дополнительные черты».`});
  else if(ctx.applied.featPenalty) out.push({s:'ok',t:`ГМ подтвердил оплату ${ctx.applied.featPenalty} дополнительных черт: соответствующие пункты уровневого прироста характеристик не добавлены.`});
  if(!ctx.features.length) out.push({s:'err',t:'Не найдены классовые черты. Проверьте класс/архетип в classes-data.js.'}); else out.push({s:'ok',t:`Найдено черт класса/архетипа: ${ctx.features.length}.`});
  if(/Носитель Договора/i.test(ctx.cls)){
    out.push({s:'ok',t:`Покровитель: ${ctx.arch}. В карточку включены только общие способности класса, способности этого Покровителя и выбранной ветки Якоря.`});
    if(ctx.lv>=3&&!ctx.pactAnchor)out.push({s:'err',t:'С 3-го уровня Носитель Договора должен выбрать Якорь: Клинок, Книгу или Знак.'});
    else if(ctx.lv>=3)out.push({s:'ok',t:`Якорь выбран: ${getPactAnchorLabel(ctx.pactAnchor)}. Его ступени добавлены по текущему уровню.`});
    else out.push({s:'ok',t:'До 3-го уровня используется фокус Договора; выбор Якоря ещё не требуется.'});
    out.push({s:'ok',t:`Плетения Договора: основная характеристика ХАР, атака ${ctx.pact.spellAttack}, СЛ ${ctx.pact.spellDc}. Поддерживающая характеристика для сборки — ТЕЛ.`});
    out.push({s:'ok',t:`Оружейный урон проверен: модификатор ${abbr[ctx.attack.stat]} уже включён. ${ctx.attack.formula}`});
    if(ctx.pactAnchor==='blade'&&/^Без оружия$/i.test(String(ctx.eq.weapon.name||'')))out.push({s:'err',t:'Для Якоря Клинка не выбрано связанное оружие. Укажите оружие или форму договорного образа в разделе «Экипировка».'});
    else if(ctx.pactAnchor==='blade'&&ctx.lv>=5)out.push({s:'ok',t:`Якорь Клинка: в действии Атака ${ctx.attack.attacks} атаки; ступени 7-го и 12-го уровней отражены в строке дополнительного урона, когда доступны.`});
    if(/Семираг|Великая Мигрирующая Аномалия/.test(ctx.arch))out.push({s:'warn',t:'Условное усиление урона Покровителя применяется только при выполнении текста соответствующей черты. Оно не прибавлено к обычной оружейной атаке автоматически.'});
  }
  const st=getSelectedFightingStyle();
  const opts=getFightingStyleOptions(ctx.cls,ctx.arch,ctx.lv);
  if(opts.length && st) out.push({s:'ok',t:`Стиль боя выбран: ${st.n}. Бонусы стиля учтены в финальной карточке.`});
  if(opts.length && !st) out.push({s:'warn',t:'Класс/архетип получает Стиль боя, но стиль не выбран.'});
  if(ctx.arch!=='Базовый класс'&&!ctx.features.some(f=>f.archetype===ctx.arch)) out.push({s:'warn',t:'Для выбранного архетипа нет доступных черт на этом уровне.'});
  if(/Дичок|Посвящ|Носитель Договора/.test(ctx.cls)&&!(ctx.selectedTalents||[]).length) out.push({s:'warn',t:'NPC-направляющему не выбраны Таланты направления / Договора. Плетения выше свободного уровня будут скрыты.'});
  if(/Дичок|Посвящ|Носитель Договора/.test(ctx.cls)&&!(ctx.selectedAffinities||[]).length) out.push({s:'warn',t:'NPC-направляющему не выбраны аффинитеты.'});
  if(/Дичок|Посвящ|Носитель Договора/.test(ctx.cls)&&!ctx.spells.length) out.push({s:'warn',t:'NPC-направляющему не выбраны плетения.'});
  if(/Дичок|Посвящ|Носитель Договора/.test(ctx.cls)&&(ctx.selectedTalents||[]).length) out.push({s:'ok',t:'Таланты направления / Договора: '+ctx.selectedTalents.join(', ')+'.'});
  if(/Посвящ/i.test(ctx.cls)&&/Айз Седай/i.test(ctx.arch)&&ctx.lv>=7) out.push(getAjah()?{s:'ok',t:`Айя выбрана: ${getAjah()}. Её доступ к Плетениям учтён.`}:{s:'warn',t:'Айз Седай 7-го уровня или выше должна выбрать Айя в разделе «Плетения».'});
  const talentLimit=getTalentLimit(ctx.cls,ctx.lv); if((ctx.selectedTalents||[]).length>talentLimit) out.push({s:'err',t:`Выбрано слишком много Талантов: ${(ctx.selectedTalents||[]).length}, доступно ${talentLimit}.`});
  if(isChannelingClass(ctx.cls)){ const maxCircle=getMaxWeaveLevel(ctx.cls,ctx.lv,ctx.arch), tooHigh=ctx.spells.filter(w=>Number(w.lv)>maxCircle); out.push({s:tooHigh.length?'err':'ok',t:tooHigh.length?`Есть Плетения выше доступного ${maxCircle}-го круга: ${tooHigh.map(w=>w.n).join(', ')}.`:`Базовые круги проверены: для ${ctx.cls} ${ctx.lv}-го уровня доступен максимум ${maxCircle}-й круг.`}); }
  const knownLimits=getKnownWeaveLimits(ctx.cls,ctx.lv); if(knownLimits){ const cantrips=ctx.spells.filter(w=>Number(w.lv)===0).length, leveled=ctx.spells.filter(w=>Number(w.lv)>0).length, over=cantrips>knownLimits.cantrips||leveled>knownLimits.weaves; out.push({s:over?'err':'ok',t:`Известные Плетения Носителя: кантрипы ${cantrips}/${knownLimits.cantrips}, Плетения 1-го круга и выше ${leveled}/${knownLimits.weaves}.${over?' Снимите лишние Плетения.':''}`}); }
  if(/Дичок|Посвящ|Носитель Договора/.test(ctx.cls)&&(ctx.selectedAffinities||[]).length) out.push({s:'ok',t:'Аффинитеты: '+ctx.selectedAffinities.join(', ')+'.'});
  if(ctx.h.name) out.push({s:'ok',t:`Иерархия применена по единой базе (${ctx.h.version||'редакция не указана'}): ${ctx.h.name}. Числовой профиль взят только у текущего ранга, уникальные способности нижних рангов унаследованы.`});
  if(ctx.h.type==='scream'&&ctx.hierarchyCtx.screamInitiative==='none') out.push({s:'warn',t:'«Счёт витков» не проводился: ранговый числовой бонус Крика к инициативе не применён.'});
  if(ctx.h.type==='scream'&&ctx.hierarchyCtx.screamInitiative==='success') out.push({s:'ok',t:'Инициатива Крика рассчитана для обычного успеха «Счёта витков».'});
  if(ctx.h.type==='scream'&&ctx.hierarchyCtx.screamInitiative==='exceptional') out.push({s:'ok',t:'Инициатива Крика рассчитана для успеха «Счёта витков» на 5+.'});
  if(ctx.h.type==='scream'&&!ctx.h.chargeActive) out.push({s:'warn',t:'Нет настроенного заряда кварца: ранговые КД, скорость, инициатива и устойчивость Крика отключены. Повышения характеристик сохранены.'});
  if(ctx.h.type==='scream') out.push({s:'ok',t:`Для базовой инициативы Крика используется ${ctx.hierarchyCtx.screamInitiativeStat==='wis'?'Мудрость':'Ловкость'}.`});
  if(ctx.h.type==='shara'&&ctx.hierarchyCtx.rank==='V') out.push({s:'ok',t:`Вариант Сосуда выбран: ${$('npc-shara-vessel')?.selectedOptions?.[0]?.textContent||'не указан'}.`});
  if(ctx.h.type==='shonchan'&&ctx.hierarchyCtx.rank==='VI') out.push({s:'ok',t:`Предел характеристик VI ранга: ${ctx.hierarchyCtx.profileKind==='unique'?'26 для уникального NPC':'24 для обычного персонажа / NPC'}.`});
  if(ctx.h.type==='shara'&&/Айяд/.test(ctx.h.branch||'')&&!isChannelingClass(ctx.cls)) out.push({s:'warn',t:'Путь Айяд предполагает способность направлять Единую Силу, но выбранный класс не является направляющим.'});
  if(ctx.h.type==='shara'&&/Воина/.test(ctx.h.branch||'')&&isChannelingClass(ctx.cls)) out.push({s:'warn',t:'Путь Воина не использует ранговые бонусы к направлению. Классовые плетения сохранены, но Иерархия их не усиливает.'});
  if((hierarchyDb.validationErrors||[]).length) out.push({s:'err',t:'Проверка базы Иерархий: '+hierarchyDb.validationErrors.join(' · ')});
  if(ctx.featsSel.includes('Пламя и пустота')) out.push({s:'ok',t:'Пламя и пустота: модификатор Мудрости добавлен к броску атаки оружием в черновой атаке.'});
  ctx.featsSel.forEach(fn=>{const f=feats.find(x=>x.name===fn); if(f&&f.req&&f.req!=='—') out.push({s:'warn',t:`Проверьте требование черты «${fn}»: ${f.req}.`});});
  out.push({s:'ok',t:`Экипировка учтена: ${ctx.eq.weapon.name}; ${ctx.eq.armor.name}; ${ctx.eq.shield.name}.`});
  if(ctx.eq.armor.isArmor===false) out.push({s:'ok',t:'Выбранная тканевая защитная одежда повышает КД, но механически не считается доспехом: не включает Стиль боя «Защита» и не вызывает проверку за создание Плетения в доспехе.'});
  return out;
}
function renderReview(npc,ctx){
  const stats=statKeys.map(k=>`<div class="stat"><b>${abbr[k]}</b><span>${npc.st[k]} (${sign(mod(npc.st[k]))})</span></div>`).join('');
  const h=npc.hi?`<div class="card hierarchy-card"><h3 style="color:${safe(ctx.applied.hierarchy.color)}">${safe(npc.hi.nm)}</h3>${npc.hi.items.map(i=>`<div class="feature hierarchy"><b>${safe(i.n)}</b><br><small>${safe(i.d)}</small></div>`).join('')}</div>`:'';
  const pact=npc.pact?`<div class="card pact-combat-card"><h3>Носитель Договора · формулы</h3><div class="pact-combat-grid"><div><b>Основная</b><span>Харизма</span></div><div><b>Поддерживающая</b><span>Телосложение</span></div><div><b>Атака плетением</b><span>${safe(npc.pact.spellAttack)}</span></div><div><b>СЛ плетений</b><span>${safe(npc.pact.spellDc)}</span></div><div><b>Покровитель</b><span>${safe(npc.pact.patron)}</span></div><div><b>Якорь</b><span>${safe(npc.pact.anchorLabel||'фокус Договора до 3-го уровня')}</span></div></div><p class="pact-combat-note">${safe(npc.pact.note)}</p></div>`:'';
  const delta=npc.hi?`<div class="card"><h3>Влияние Иерархии · до → после</h3><div class="delta-grid">${statKeys.map(k=>`<div class="delta-item"><b>${abbr[k]}</b><span>${ctx.baseline.stats[k]} → ${npc.st[k]} <em class="${npc.st[k]>ctx.baseline.stats[k]?'delta-up':npc.st[k]<ctx.baseline.stats[k]?'delta-down':''}">(${sign(npc.st[k]-ctx.baseline.stats[k])})</em></span></div>`).join('')}<div class="delta-item"><b>ОЗ</b><span>${ctx.baseline.hp} → ${npc.co.hp}</span></div><div class="delta-item"><b>КД</b><span>${ctx.baseline.ac} → ${npc.co.ac}</span></div><div class="delta-item"><b>СКОР.</b><span>${ctx.baseline.speed} → ${npc.co.sp}</span></div><div class="delta-item"><b>ИНИЦ.</b><span>${sign(ctx.baseline.initiative)} → ${safe(npc.co.ini)}</span></div><div class="delta-item"><b>АТАКА</b><span>${safe(ctx.baseline.attack)} → ${safe(npc.at[0].a)}</span></div></div><p class="hint">«До» уже включает нацию, рост по уровням, дополнительные черты, класс, стиль боя и экипировку. «После» добавляет выбранную Иерархию.</p></div>`:'';
  $('preview').innerHTML=`
  <div class="review-title">Шаг 5 · Проверка финальной карточки перед переносом в NPC / Бой</div>
  <div class="preview-grid"><div>
    <div class="card"><h3>${safe(npc.ti)}</h3><p>${safe(npc.su)}</p><div>${npc.tags.map(t=>`<span class="badge">${safe(t)}</span>`).join('')}</div></div>
    ${delta}
    <div class="card"><h3>Характеристики</h3><div class="statrow">${stats}</div><details><summary>Как посчитано</summary><ul>${ctx.applied.steps.map(s=>`<li>${safe(s)}</li>`).join('')}</ul></details></div>
    <div class="card"><h3>Ядро</h3><p class="mono">ОЗ ${npc.co.hp} · КД ${npc.co.ac} · Скор. ${npc.co.sp} · Иниц. ${npc.co.ini} · Пасс. Воспр. ${npc.co.pp}</p><p><small>${safe(ctx.acCalc.note)}</small></p></div>
    ${pact}
    <div class="card"><h3>Атака</h3><p class="mono">${safe(npc.at[0].n)} · ${safe(npc.at[0].a)} · ${safe(npc.at[0].d)}</p><small class="combat-breakdown">${safe(npc.at[0].formula)}</small><p><small>${safe(npc.at[0].no)}</small></p></div>
    ${h}
  </div><div>
    <div class="card feature-list"><h3>Черты (${npc.ab.length})</h3>${npc.ab.slice(0,100).map((a,i)=>`<div class="feature ${a.source==='hierarchy'?'hierarchy':''}"><b>${safe(a.n)}</b> <button class="info-dot" data-feature-index="${i}" title="Полное описание">i</button><br><small>${safe(short(a.d,190))}</small></div>`).join('')}</div>
    <div class="card"><h3>Экипировка</h3>${npc.eq.map(e=>`<div class="feature"><small>${safe(e.t)}</small></div>`).join('')}</div>
  </div></div>`;
  $('validation').innerHTML=npc.verify.map(v=>`<div class="${v.s==='ok'?'ok':v.s==='err'?'err':'warn'}">${v.s==='ok'?'✓':v.s==='err'?'✕':'⚠'} ${safe(v.t)}</div>`).join('');
  const exp=JSON.stringify(npc,null,2).replace(/"([^"\n]+)":/g,'$1:'); $('export-box').textContent=exp;
  renderCustomManager();
}
function showFeatureModal(idx){ if(!currentNpc) return; const a=currentNpc.ab[idx]; if(!a) return; const box=$('feature-modal'); box.innerHTML=`<div class="fm-box"><button class="fm-close" type="button">×</button><h3>${safe(a.n)}</h3><p>${safe(a.d)}</p><small>${safe(a.source||'')}</small></div>`; box.style.display='flex'; box.querySelector('.fm-close').onclick=()=>box.style.display='none'; }
function getCustom(){try{return JSON.parse(localStorage.getItem(CUSTOM_KEY)||'[]')||[]}catch(e){return[]}}
function setCustom(arr){localStorage.setItem(CUSTOM_KEY,JSON.stringify(arr||[]));}
function saveLocal(){ const npc=currentNpc||buildNpc(); if(!reviewReady){alert('Сначала выполните проверку карточки.');return;} if(/Носитель Договора/i.test(getClass())&&getLevel()>=3&&!getPactAnchor()){alert('С 3-го уровня выберите Якорь Договора перед сохранением карточки.');return;} if(getPactAnchor()==='blade'&&/^Без оружия$/i.test(String(getEquipment().weapon.name||''))){alert('Для Якоря Клинка выберите связанное оружие в разделе «Экипировка».');return;} if(selectedFeats().length&&!isFeatCostConfirmed()){alert('Сначала подтвердите оплату дополнительных черт в разделе 3. Если пунктов уровневого роста недостаточно, повысьте уровень NPC или снимите часть черт.');return;} const arr=getCustom().filter(x=>Number(x.id)!==Number(npc.id)); arr.push(npc); setCustom(arr); renderCustomManager(); alert('NPC сохранён в постоянном пользовательском списке этого браузера. Нажмите «Открыть NPC / Бой»: карточка будет в группе «Пользовательские NPC».'); }
function deleteCustomNpc(id){ const arr=getCustom().filter(x=>Number(x.id)!==Number(id)); setCustom(arr); if(Number(loadedCustomId)===Number(id))loadedCustomId=null; renderCustomManager(); }
function loadCustomNpc(id){const npc=getCustom().find(x=>Number(x.id)===Number(id));if(npc){loadedCustomId=Number(npc.id);restoreGeneratorSnapshot(npc.generator);}}
function renderCustomManager(){ const box=$('custom-list'); if(!box) return; const arr=getCustom(); box.innerHTML=arr.length?arr.map(x=>`<div class="custom-row"><span>${safe(x.ti||x.sh||'NPC')}<small class="muted">${x.generator?` · база ${safe(x.generator.hierarchyDbVersion||'—')}`:' · без исходных настроек'}</small></span><div class="custom-actions">${x.generator?`<button type="button" class="load" data-load-custom="${x.id}">Загрузить / пересчитать</button>`:''}<button type="button" data-del-custom="${x.id}">Удалить</button></div></div>`).join(''):'<div class="mono muted">Пользовательских NPC пока нет.</div>'; }
function clearCustom(){ if(confirm('Удалить всех пользовательских NPC из этого браузера?')){localStorage.removeItem(CUSTOM_KEY); renderCustomManager(); alert('Пользовательские NPC удалены.');}}
function copyExport(){navigator.clipboard&&navigator.clipboard.writeText($('export-box').textContent).then(()=>alert('JS/JSON скопирован.'));}
function downloadExport(){ const npc=currentNpc||buildNpc(), blob=new Blob([JSON.stringify(npc,null,2)],{type:'application/json;charset=utf-8'}), url=URL.createObjectURL(blob), a=document.createElement('a'); a.href=url;a.download=(slug(npc.sh||'npc')||'npc')+'.json';document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1000); }
function bind(){
  initClassSelect(); initNationSelect(); initEquipment(); initFeats(); initHierarchyControls(); updatePactControls(); updateFightingStyleSelect(); renderWeavePicker(); buildNpc(); renderCustomManager();
  $('npc-class').addEventListener('change',()=>{updateArchSelect(); updatePactControls(); updateFightingStyleSelect(); renderWeavePicker(); renderHierarchyStatChoices(); buildNpc();}); $('npc-arch').addEventListener('change',()=>{updatePactControls();updateFightingStyleSelect(); renderWeavePicker(); buildNpc();}); $('npc-ajah')?.addEventListener('change',()=>{renderWeavePicker();buildNpc();}); $('npc-fighting-style')?.addEventListener('change',buildNpc); $('feat-search').addEventListener('input',initFeats); $('weave-search')?.addEventListener('input',()=>{renderWeavePicker(); buildNpc();}); $('clear-weaves')?.addEventListener('click',()=>{document.querySelectorAll('[data-weave-title]').forEach(x=>x.checked=false); $('npc-weaves').value=''; buildNpc();});
  $('npc-faction').addEventListener('change',()=>{updateHierarchyControls(true);buildNpc();}); $('npc-rank').addEventListener('change',()=>{updateHierarchyControls(false);buildNpc();}); $('npc-hierarchy-branch').addEventListener('change',buildNpc);
  $('npc-shara-vessel')?.addEventListener('change',()=>{const v=$('npc-shara-vessel').value;if($('npc-hierarchy-branch'))$('npc-hierarchy-branch').value=v==='shbotai-warrior'?'warrior':'aiyad';buildNpc();});
  $('npc-role').addEventListener('change',()=>{renderHierarchyStatChoices();buildNpc();});
  $('apply-template').addEventListener('click',applyTemplate); $('generate').addEventListener('click',buildNpc); $('copy-export').addEventListener('click',copyExport); $('download-export')?.addEventListener('click',downloadExport); $('save-local').addEventListener('click',saveLocal); $('clear-custom').addEventListener('click',clearCustom);
  document.addEventListener('click',e=>{ const i=e.target.closest('.info-dot'); if(i){showFeatureModal(Number(i.dataset.featureIndex));} const d=e.target.closest('[data-del-custom]'); if(d){deleteCustomNpc(d.dataset.delCustom);} const l=e.target.closest('[data-load-custom]');if(l){loadCustomNpc(l.dataset.loadCustom);} if(e.target.id==='feature-modal') e.target.style.display='none'; });
  document.addEventListener('change',e=>{ const t=e.target; if(t && t.matches && (t.matches('[data-talent]')||t.matches('[data-affinity]'))){ renderWeavePicker(); buildNpc(); } else if(t && t.matches && t.matches('[data-weave-title]')){ renderWeavePicker(); buildNpc(); } else if(t&&t.matches&&t.matches('[data-hierarchy-stat]')){normalizeDistinctHierarchyChoice(t);buildNpc();} });
  document.querySelectorAll('input,select,textarea').forEach(el=>el.addEventListener('change',()=>{ if(el.id==='feat-search'||el.matches('[data-hierarchy-stat]')) return; if(el.id==='npc-class'||el.id==='npc-arch'||el.id==='npc-ajah'||el.id==='npc-fighting-style'||el.id==='npc-faction'||el.id==='npc-rank'||el.id==='npc-hierarchy-branch'||el.id==='npc-role'||el.id==='npc-shara-vessel') return; if(el.id==='npc-level'){ updatePactControls(); updateFightingStyleSelect(); renderWeavePicker(); } if(el.matches && (el.matches('[data-talent]')||el.matches('[data-affinity]'))){ renderWeavePicker(); } buildNpc(); }));
}
document.addEventListener('DOMContentLoaded',bind);
})();
