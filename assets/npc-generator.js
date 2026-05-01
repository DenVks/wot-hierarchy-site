(function(){
'use strict';
const CUSTOM_KEY='wot_custom_npcs_v1';
const clsDb=window.WOT_CLASSES_DB||{features:[],meta:{classes:[]}};
const feats=(window.WOT_FEATS_DB&&window.WOT_FEATS_DB.feats)||[];
const weaves=window.WOT_WEAVES||[];
const existing=Array.isArray(window.CS)?window.CS:(typeof CS!=='undefined'?CS:[]);
const rules=window.WOT_NPC_RULES||{};
let currentNpc=null;
let reviewReady=false;
const $=id=>document.getElementById(id);
const statKeys=['str','dex','con','int','wis','cha'];
const abbr={str:'СИЛ',dex:'ЛОВ',con:'ТЕЛ',int:'ИНТ',wis:'МДР',cha:'ХАР'};
const ruStat={str:'Сила',dex:'Ловкость',con:'Телосложение',int:'Интеллект',wis:'Мудрость',cha:'Харизма'};
const hitDie={'Варвар':12,'Пустынный воин':10,'Мастер по оружию':10,'Лесник':10,'Благородный':8,'Скиталец':8,'Дичок':8,'Посвящённый':4,'Посвященный':4};
const roleTemplates={
  'Фронтлайн':{str:16,dex:12,con:16,int:10,wis:12,cha:10},
  'Стрелок':{str:10,dex:16,con:14,int:12,wis:14,cha:10},
  'Скиталец':{str:8,dex:16,con:14,int:14,wis:12,cha:12},
  'Направляющий':{str:8,dex:12,con:14,int:16,wis:16,cha:10},
  'Командир':{str:12,dex:12,con:14,int:14,wis:14,cha:16},
  'Сбалансированный':{str:13,dex:13,con:14,int:12,wis:13,cha:12}
};
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
function primaryStats(cls,role,faction){
  if(faction&&faction!=='none'&&rules.hierarchies&&rules.hierarchies[faction]) return rules.hierarchies[faction].priority||['str','con'];
  if(/Варвар/.test(cls)) return ['str','con'];
  if(/Мастер по оружию|Пустынный/.test(cls)) return ['str','dex','con'];
  if(/Скиталец/.test(cls)) return ['dex','int','cha'];
  if(/Лесник/.test(cls)) return ['dex','wis','con'];
  if(/Дичок|Посвящ/.test(cls)) return ['wis','int','con'];
  if(/Благород/.test(cls)) return ['cha','wis','int'];
  const map={Фронтлайн:['str','con'],Стрелок:['dex','wis'],Скиталец:['dex','int'],Направляющий:['wis','int'],Командир:['cha','wis']};
  return map[role]||['str','con'];
}
function clone(o){return JSON.parse(JSON.stringify(o||{}))}
function getAsiEvents(cls,lv){const arr=(rules.asiLevels&& (rules.asiLevels[cls]||rules.asiLevels.default))||[4,8,12,16,19]; return arr.filter(x=>x<=lv);}
function getNationBonus(nation){
  const db=rules.nationBonuses||{};
  if(db[nation]) return clone(db[nation]);
  const found=Object.keys(db).find(k=>nation.toLowerCase().includes(k.toLowerCase())||k.toLowerCase().includes(nation.toLowerCase()));
  return found?clone(db[found]):{};
}
function addStat(obj,k,v,max=20){obj[k]=cap((obj[k]||10)+(Number(v)||0),max)}
function applyStatBlock(base,ctx){
  const steps=[]; const stats=clone(base); const pri=primaryStats(ctx.cls,ctx.role,ctx.faction);
  const nb=getNationBonus(ctx.nation);
  Object.entries(nb).forEach(([k,v])=>{addStat(stats,k,v,20); steps.push(`Нация ${ctx.nation}: ${abbr[k]} +${v}`);});
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
function rankOrder(rank){return {'I':1,'II':2,'III':3,'IV':4,'V':5}[rank]||0}
function applyHierarchy(stats,ctx){
  const out={name:'',type:'',color:'#b07ae8',items:[],traits:[],hpBonus:0,hpMult:null,acBonus:0,attackBonus:0,damageBonus:0,speedBonus:0,initiativeBonus:0,initiativeAdv:false,saveBonus:0,dcBonus:0,weavePower:0,extraSlots:0,cap:24,steps:[]};
  const hdb=rules.hierarchies&&rules.hierarchies[ctx.faction]; const rn=rankOrder(ctx.rank);
  if(!hdb||!rn) return out;
  out.name=hdb.name+', Ранг '+ctx.rank; out.type=hdb.type||ctx.faction; out.color=hdb.color||out.color;
  // inherit lower ranks
  ['I','II','III','IV','V'].slice(0,rn).forEach(rk=>{
    const r=hdb.ranks&&hdb.ranks[rk]; if(!r) return;
    const max=r.cap||out.cap||24;
    if(r.stats) Object.entries(r.stats).forEach(([k,v])=>{addStat(stats,k,v,max); out.steps.push(`${hdb.name} ${rk}: ${abbr[k]} +${v}`);});
    if(r.hp) out.hpBonus+=r.hp;
    if(r.hitDiceMult) out.hpMult=Math.max(out.hpMult||1,r.hitDiceMult);
    if(r.ac) out.acBonus+=r.ac;
    if(r.attack) out.attackBonus+=r.attack;
    if(r.damage) out.damageBonus+=r.damage;
    if(r.speed) out.speedBonus=Math.max(out.speedBonus,r.speed);
    if(r.initiative) out.initiativeBonus=Math.max(out.initiativeBonus,r.initiative);
    if(r.initiativeAdv) out.initiativeAdv=true;
    if(r.saves) out.saveBonus=Math.max(out.saveBonus,r.saves);
    if(r.dc) out.dcBonus=Math.max(out.dcBonus,r.dc);
    if(r.weavePower) out.weavePower=Math.max(out.weavePower,r.weavePower);
    if(r.extraSlots) out.extraSlots=Math.max(out.extraSlots,r.extraSlots);
    if(r.items) r.items.forEach(([n,d])=>{ out.items.push({n,d,rank:rk}); out.traits.push({n,d,rank:rk,hi:true,source:'hierarchy',color:out.color}); });
  });
  out.items.push({n:'Наследование рангов',d:'Текущий ранг наследует уникальные свойства всех нижестоящих рангов этой Иерархии.',rank:ctx.rank});
  return out;
}
function avgHp(cls,lv,con,h){const die=hitDie[cls]||8; let base=die+mod(con)+Math.max(0,lv-1)*(Math.floor(die/2)+1+mod(con)); if(h&&h.hpMult) base=Math.round(base*h.hpMult); return Math.max(1,base+(h?h.hpBonus:0));}
function initClassSelect(){
  const classes=Array.from(new Set(clsDb.features.map(f=>f.className).filter(Boolean))).sort((a,b)=>a.localeCompare(b));
  $('npc-class').innerHTML=classes.map(c=>`<option>${safe(c)}</option>`).join('');
  if(classes.includes('Варвар')) $('npc-class').value='Варвар'; updateArchSelect();
}
function updateArchSelect(){
  const c=getClass(); const archs=Array.from(new Set(clsDb.features.filter(f=>f.className===c).map(f=>f.archetype).filter(a=>a&&a!=='Базовый класс')));
  $('npc-arch').innerHTML='<option value="Базовый класс">Базовый класс</option>'+archs.sort((a,b)=>a.localeCompare(b)).map(a=>`<option>${safe(a)}</option>`).join('');
}
function initNationSelect(){ const nats=Object.keys(rules.nationBonuses||{}).sort((a,b)=>a.localeCompare(b)); const inp=$('npc-nation'); if(!inp) return; const val=inp.value||'Андор'; const dl=document.createElement('datalist'); dl.id='nation-list'; dl.innerHTML=nats.map(n=>`<option value="${safe(n)}">`).join(''); document.body.appendChild(dl); inp.setAttribute('list','nation-list'); inp.value=val; }
function initEquipment(){
  const W=(rules.equipment&&rules.equipment.weapons)||[], A=(rules.equipment&&rules.equipment.armor)||[], S=(rules.equipment&&rules.equipment.shields)||[];
  $('weapon-select').innerHTML=W.map((w,i)=>`<option value="${i}">${safe(w.name)} · ${safe(w.damage)}</option>`).join('');
  $('armor-select').innerHTML=A.map((a,i)=>`<option value="${i}">${safe(a.name)} · КД ${a.base}${a.dexMax===0?'':'+ЛОВ'}</option>`).join('');
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
function applyTemplate(){ const t=roleTemplates[$('npc-role').value]||roleTemplates.Сбалансированный; Object.entries(t).forEach(([k,v])=>$(k).value=v); buildNpc(); }
function availableFeatures(cls,arch,lv){
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
function calcAc(cls,stats,eq,h){
  const a=eq.armor, shield=(eq.shield.ac||0)+eq.shieldBonus, dex=mod(stats.dex); let ac=10+dex;
  let note='Без доспеха: 10 + ЛОВ';
  if(a.category==='none'){
    if(/Варвар/.test(cls)){ ac=10+dex+mod(stats.con)+shield; note='Защита без доспехов Варвара: 10 + ЛОВ + ТЕЛ + щит'; }
    else ac=10+dex+shield;
  }else{
    const dexPart=a.dexMax===null?dex:Math.min(dex,a.dexMax); ac=a.base+dexPart+eq.armorBonus+shield; note=`${a.name}: ${a.base} + ЛОВ${a.dexMax===null?'':' макс. '+a.dexMax} + магия/щит`;
  }
  ac+=h.acBonus||0; if(h.acBonus) note+=` + Иерархия ${h.acBonus}`;
  return {ac,note};
}
function hasFeat(name,sel){return sel.some(x=>x.toLowerCase()===name.toLowerCase())}
function calcAttack(cls,stats,eq,p,featsSel,h){
  const w=eq.weapon; let stat=w.stat||'str'; if(w.properties&&/Finesse/i.test(w.properties)){ stat=mod(stats.dex)>=mod(stats.str)?'dex':'str'; }
  let attack=mod(stats[stat])+p+eq.weaponBonus+(h.attackBonus||0); let dmgBonus=mod(stats[stat])+eq.weaponBonus+(h.damageBonus||0);
  const notes=[];
  if(hasFeat('Пламя и пустота',featsSel)){ attack+=mod(stats.wis); notes.push(`Пламя и пустота: +${mod(stats.wis)} МДР к атаке`); }
  if(/Лесник/.test(cls)&&w.type==='ranged'){ attack+=2; notes.push('Стиль Стрельба: +2 к атаке'); }
  if(/Варвар/.test(cls)&&w.type==='melee') notes.push('Ярость добавляет урон ярости только при атаке Силой и активной ярости.');
  if(hasFeat('Мастер большого оружия',featsSel) && /Heavy/i.test(w.properties||'')) notes.push('Мастер большого оружия: можно −5 к атаке / +10 к урону.');
  if(hasFeat('Меткий стрелок',featsSel) && w.type==='ranged') notes.push('Меткий стрелок: можно −5 к атаке / +10 к урону, игнор укрытий.');
  return {name:w.name,a:sign(attack),d:`${w.damage}${sign(dmgBonus)}`,t:w.type==='ranged'?'Прон.':'Руб./Прон.',r:w.type==='ranged'?'дистанция по оружию':'Ближний',no:[w.properties, ...notes].filter(Boolean).join(' · ')};
}
function findWeavesInput(){ const names=$("npc-weaves").value.split(/[;,\n]/).map(s=>s.trim()).filter(Boolean); return names.map(n=>weaves.find(w=>String(w.title).toLowerCase()===n.toLowerCase())||{title:n,level:"?",school:"?",desc:"Плетение не найдено в базе."}); }
function buildNpc(){
  const name=$('npc-name').value.trim()||'Новый NPC', nation=getNation(), lv=getLevel(), cls=getClass(), arch=getArch(), role=$('npc-role').value, faction=$('npc-faction').value, rank=$('npc-rank').value, p=prof(lv), featsSel=selectedFeats();
  const baseStats=getBaseStats(), applied=applyStatBlock(baseStats,{cls,role,faction,rank,lv,nation,featsSel}), stats=applied.stats, h=applied.hierarchy, eq=getEquipment(), acCalc=calcAc(cls,stats,eq,h), features=availableFeatures(cls,arch,lv);
  const hp=avgHp(cls,lv,stats.con,h), ini=mod(stats.dex)+(h.initiativeBonus||0), pp=10+mod(stats.wis)+p+((featsSel.includes('Внимательный'))?5:0);
  const attack=calcAttack(cls,stats,eq,p,featsSel,h), hi=h.name?{nm:h.name,ty:h.type,items:[...h.items,{n:'Сводные бонусы',d:`ОЗ ${h.hpBonus?'+ '+h.hpBonus:''}${h.hpMult?' ×'+h.hpMult:''}; КД +${h.acBonus||0}; скорость +${h.speedBonus||0}; инициатива +${h.initiativeBonus||0}${h.initiativeAdv?' и преимущество':''}; спасброски +${h.saveBonus||0}; DC плетений +${h.dcBonus||0}; сила плетений +${h.weavePower||0}; доп. плетения ${h.extraSlots||0}.`}]}:null;
  const spells=findWeavesInput().map(w=>({n:w.title,lv:w.level,tal:w.school||'',el:Array.isArray(w.powers)?w.powers.join('·'):'',t:w.cast||'',r:w.range||'',dur:w.duration||'',sb:w.save||'',slot:String(w.level||''),dmg:w.damage||'—',ef:(w.summary||w.desc||'').slice(0,320)}));
  const ab=[];
  features.forEach(f=>ab.push({n:f.feature,d:f.description,hi:Number(f.levelSort||0)===lv||f.archetype===arch,source:'class'}));
  featsSel.forEach(fn=>{const f=feats.find(x=>x.name===fn); ab.push({n:fn,d:f?f.desc.join(' '):'Дополнительная черта.',hi:false,source:'feat'});});
  h.traits.forEach(t=>ab.push({n:t.n,d:t.d,hi:true,source:'hierarchy',color:t.color}));
  const id=200000+Date.now()%100000000;
  const npc={id,sh:name,na:nation,lv,ic:/Дичок|Посвящ/.test(cls)?'🔥':/Лесник/.test(cls)?'🏹':/Скиталец/.test(cls)?'◇':/Варвар/.test(cls)?'🪓':'⚔',ty:hi?'purple':'warning',custom:true,ti:`${name} — ${cls}${arch&&arch!=='Базовый класс'?' / '+arch:''} ${lv}-го уровня`,su:`Черновик NPC · ${role} · ${$('npc-threat').value}`,tags:[cls,arch,`Ур.${lv}`,nation].filter(Boolean),st:stats,co:{hp,ac:acCalc.ac,sp:30+(h.speedBonus||0),ini:sign(ini)+(h.initiativeAdv?' / преим.':''),prof:sign(p),sv:`${cls==='Варвар'?'Сил, Тел':/Дичок|Посвящ/.test(cls)?'Инт, Мдр':'по классу'}${h.saveBonus?' +'+h.saveBonus+' от Иерархии':''}`,pp,cr:`${attack.name}: ${attack.a}, ${attack.d}`},at:[attack],ab,hi,eq:[{r:!!(eq.weaponBonus||eq.armorBonus||eq.shieldBonus),t:`${eq.weapon.name}${eq.weaponBonus?` +${eq.weaponBonus}`:''}; ${eq.armor.name}${eq.armorBonus?` +${eq.armorBonus}`:''}; ${eq.shield.name}${eq.shieldBonus?` +${eq.shieldBonus}`:''}. КД: ${acCalc.note}.`}],sk:[{n:'Восприятие',v:sign(mod(stats.wis)+p),e:false,note:'Черновой расчёт.'},{n:'Проницательность',v:sign(mod(stats.wis)+p),e:false,note:'Черновой расчёт.'}],verify:[],tactics:[{ph:'Роль',d:`${role}. Уточните боевой паттерн под сцену.`},{ph:'Проверка ГМ',d:'Перед канонизацией проверьте ОЗ, КД, предметы, плетения и бонусы Иерархии.'}],dm:$('npc-notes')?.value||'Создано генератором. Требует утверждения ГМ.'};
  if(spells.length) npc.spells=spells;
  npc.verify=validateNpc({cls,arch,lv,features,featsSel,spells,h,stats,hp,ac:acCalc.ac,applied,eq,attack});
  currentNpc=npc; reviewReady=true; renderReview(npc,{applied,acCalc,attack,eq}); return npc;
}
function validateNpc(ctx){
  const out=[]; out.push({s:'ok',t:`Бонус мастерства: ${sign(prof(ctx.lv))}.`});
  out.push({s:'ok',t:`Рост характеристик: уровни ${ctx.applied.asiEvents.join(', ')||'нет'}; использовано пунктов +${ctx.applied.asiPointsUsed}.`});
  if(Object.keys(ctx.applied.nationBonus).length) out.push({s:'ok',t:`Бонус нации применён: ${Object.entries(ctx.applied.nationBonus).map(([k,v])=>abbr[k]+' +'+v).join(', ')}.`}); else out.push({s:'warn',t:'Бонус нации не найден: проверьте написание нации.'});
  if(ctx.applied.featPenalty) out.push({s:'warn',t:`Выбрано дополнительных черт: ${ctx.applied.featPenalty}. По правилу нужно уменьшить один из уровневых приростов характеристик на 1 за каждую такую черту. Генератор уже уменьшил авто-распределение на ${ctx.applied.featPenalty}, но ГМ должен подтвердить выбор.`});
  if(!ctx.features.length) out.push({s:'err',t:'Не найдены классовые черты. Проверьте класс/архетип в classes-data.js.'}); else out.push({s:'ok',t:`Найдено черт класса/архетипа: ${ctx.features.length}.`});
  if(ctx.arch!=='Базовый класс'&&!ctx.features.some(f=>f.archetype===ctx.arch)) out.push({s:'warn',t:'Для выбранного архетипа нет доступных черт на этом уровне.'});
  if(/Дичок|Посвящ/.test(ctx.cls)&&!ctx.spells.length) out.push({s:'warn',t:'NPC-направляющему не выбраны плетения.'});
  if(ctx.h.name) out.push({s:'ok',t:`Иерархия применена: ${ctx.h.name}. Бонусы будут удалены/заменены при смене Иерархии, так как расчёт каждый раз идёт от базовых характеристик.`});
  if(ctx.featsSel.includes('Пламя и пустота')) out.push({s:'ok',t:'Пламя и пустота: модификатор Мудрости добавлен к броску атаки оружием в черновой атаке.'});
  ctx.featsSel.forEach(fn=>{const f=feats.find(x=>x.name===fn); if(f&&f.req&&f.req!=='—') out.push({s:'warn',t:`Проверьте требование черты «${fn}»: ${f.req}.`});});
  out.push({s:'ok',t:`Экипировка учтена: ${ctx.eq.weapon.name}; ${ctx.eq.armor.name}; ${ctx.eq.shield.name}.`});
  return out;
}
function renderReview(npc,ctx){
  const stats=statKeys.map(k=>`<div class="stat"><b>${abbr[k]}</b><span>${npc.st[k]} (${sign(mod(npc.st[k]))})</span></div>`).join('');
  const h=npc.hi?`<div class="card hierarchy-card"><h3 style="color:${safe(ctx.applied.hierarchy.color)}">${safe(npc.hi.nm)}</h3>${npc.hi.items.map(i=>`<div class="feature hierarchy"><b>${safe(i.n)}</b><br><small>${safe(i.d)}</small></div>`).join('')}</div>`:'';
  $('preview').innerHTML=`
  <div class="review-title">Шаг 5 · Проверка финальной карточки перед переносом в NPC / Бой</div>
  <div class="preview-grid"><div>
    <div class="card"><h3>${safe(npc.ti)}</h3><p>${safe(npc.su)}</p><div>${npc.tags.map(t=>`<span class="badge">${safe(t)}</span>`).join('')}</div></div>
    <div class="card"><h3>Характеристики</h3><div class="statrow">${stats}</div><details><summary>Как посчитано</summary><ul>${ctx.applied.steps.map(s=>`<li>${safe(s)}</li>`).join('')}</ul></details></div>
    <div class="card"><h3>Ядро</h3><p class="mono">ОЗ ${npc.co.hp} · КД ${npc.co.ac} · Скор. ${npc.co.sp} · Иниц. ${npc.co.ini} · Пасс. Воспр. ${npc.co.pp}</p><p><small>${safe(ctx.acCalc.note)}</small></p></div>
    <div class="card"><h3>Атака</h3><p class="mono">${safe(npc.at[0].name)} · ${safe(npc.at[0].a)} · ${safe(npc.at[0].d)}</p><p><small>${safe(npc.at[0].no)}</small></p></div>
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
function saveLocal(){ const npc=currentNpc||buildNpc(); if(!reviewReady){alert('Сначала выполните проверку карточки.');return;} const arr=getCustom().filter(x=>Number(x.id)!==Number(npc.id)); arr.push(npc); setCustom(arr); renderCustomManager(); alert('NPC добавлен в пользовательскую базу этого браузера. Откройте NPC / Бой.'); }
function deleteCustomNpc(id){ const arr=getCustom().filter(x=>Number(x.id)!==Number(id)); setCustom(arr); renderCustomManager(); }
function renderCustomManager(){ const box=$('custom-list'); if(!box) return; const arr=getCustom(); box.innerHTML=arr.length?arr.map(x=>`<div class="custom-row"><span>${safe(x.ti||x.sh||'NPC')}</span><button type="button" data-del-custom="${x.id}">Удалить</button></div>`).join(''):'<div class="mono muted">Пользовательских NPC пока нет.</div>'; }
function clearCustom(){ if(confirm('Удалить всех пользовательских NPC из этого браузера?')){localStorage.removeItem(CUSTOM_KEY); renderCustomManager(); alert('Пользовательские NPC удалены.');}}
function copyExport(){navigator.clipboard&&navigator.clipboard.writeText($('export-box').textContent).then(()=>alert('JS/JSON скопирован.'));}
function bind(){
  initClassSelect(); initNationSelect(); initEquipment(); initFeats(); buildNpc(); renderCustomManager();
  $('npc-class').addEventListener('change',()=>{updateArchSelect(); buildNpc();}); $('npc-arch').addEventListener('change',buildNpc); $('feat-search').addEventListener('input',initFeats);
  $('apply-template').addEventListener('click',applyTemplate); $('generate').addEventListener('click',buildNpc); $('copy-export').addEventListener('click',copyExport); $('save-local').addEventListener('click',saveLocal); $('clear-custom').addEventListener('click',clearCustom);
  document.addEventListener('click',e=>{ const i=e.target.closest('.info-dot'); if(i){showFeatureModal(Number(i.dataset.featureIndex));} const d=e.target.closest('[data-del-custom]'); if(d){deleteCustomNpc(d.dataset.delCustom);} if(e.target.id==='feature-modal') e.target.style.display='none'; });
  document.querySelectorAll('input,select,textarea').forEach(el=>el.addEventListener('change',()=>{ if(el.id!=='feat-search') buildNpc(); }));
}
document.addEventListener('DOMContentLoaded',bind);
})();
