/* Explicit presentation metadata. Rule text stays in NPC/hierarchy data. */
(function(root){
'use strict';
const GROUPS={action:'Действия',bonus:'Бонусные действия',reaction:'Реакции',trigger:'Триггеры хода',passive:'Постоянные свойства',special:'Особые применения',preparation:'Подготовка',reference:'Полные правила'};
const CLASS_TYPES={
 'Второе дыхание':'bonus','Всплеск действий':'special','Приём: Финт':'bonus','Приём: Командирский удар':'bonus',
 'Закрепление плетения':'action','Мгновенный захват источника':'bonus','Одновременное плетение':'action','Создание нескольких плетений':'action',
 'Слова конца':'action','Пустота между ударами':'reaction','Разум на краю':'passive','Знак держит нить':'special','Кровь как печать':'special','Шрам помнит силу':'trigger','Последнее эхо':'trigger','Отводящая грань':'reaction','Кровь как чернила':'reaction','Печать против вторжения':'passive',
 'Искл.талант Защита 2 — Щит':'reaction','Искл.талант Защита 3 — Сопротивление плетениям':'passive',
 'Искл.талант Соединение 2 — Манипуляция Разумом':'bonus'
};
const HIERARCHY_TYPES={'Аура Имперской Власти':'action','Аура Страха':'trigger','Холодная решимость':'passive','Стальная воля':'passive','Поглощение Воли':'bonus','Волна Силы':'bonus','Холодная стойкость Айяд':'passive','Холодная стойкость Воина':'passive'};
function featureName(name){return String(name||'').replace(/\s*\((?:ур\.|Ранг|Tie-Off|Simultaneous|Multiweave)[\s\S]*$/i,'').trim();}
function hierarchyOwns(c,a){
 if(!c.hi)return false;const name=String(a.n||'').trim();
 return /^Ранг\s+[IVX]+[:\s]/i.test(name)||(c.hi.items||[]).some(h=>name===h.n||name.startsWith(h.n+' ('));
}
function canonicalRule(c,item,db){
 const hierarchy=db?.getHierarchy(c.hpCalculation?.hierarchyId);
 const rule=hierarchy?.abilities?.find(a=>a.name===item.n);
 return {text:rule?.description||item.d||'',source:rule?.source||hierarchy?.source||'',specific:rule?.description&&rule.description!==item.d?item.d:''};
}
function entries(c,db,splitScream){
 const out=[];
 for(const [i,a] of (c.ab||[]).entries()){
  if(hierarchyOwns(c,a))continue;
  const name=featureName(a.n),type=Object.keys(CLASS_TYPES).find(k=>k.toLocaleLowerCase('ru')===name.toLocaleLowerCase('ru'));
  out.push({id:'class-'+i,name:a.n,text:a.d||'',kind:type?CLASS_TYPES[type]:'reference',source:'Черта NPC',specific:''});
 }
 for(const [i,item] of (c.hi?.items||[]).entries()){
  if(c.hi.ty==='scream'){
   const blocks=splitScream(item.d);
   if(blocks.length){for(const [j,b] of blocks.entries()){
    const parts=b.meta.split('·').map(x=>x.trim().toLowerCase());
    const kind=parts.includes('реакция')?'reaction':parts.includes('бонусное действие')?'bonus':parts.includes('действие')?'action':parts.includes('пассив')?'passive':parts.includes('1/проход')?'preparation':'reference';
    out.push({id:`hierarchy-${i}-${j}`,name:b.name,text:b.meta+'. '+b.body,kind,source:'Иерархия · '+item.n,href:'scream.html',specific:''});
   }continue;}
  }
  const rule=canonicalRule(c,item,db);
  out.push({id:'hierarchy-'+i,name:item.n,text:rule.text,specific:rule.specific,kind:HIERARCHY_TYPES[item.n]||'reference',source:'Иерархия',href:rule.source});
 }
 // One source entry gets one place; references remain available in the complete descriptions.
 const seen=new Set();return out.filter(e=>{const key=e.name.toLocaleLowerCase('ru')+'|'+e.text;if(seen.has(key))return false;seen.add(key);return true;});
}
root.WOT_COMBAT_VIEW={GROUPS,entries,hierarchyOwns,canonicalRule};
})(window);
