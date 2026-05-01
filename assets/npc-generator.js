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
const CHANNELING_TALENTS=['Танец Облаков','Соединение','Пение Земли','Элементализм','Исцеление','Иллюзия','Перемещение','Защита','Погибельный огонь'];
const AFFINITIES=['Воздух','Земля','Огонь','Дух','Вода'];
function isChannelingClass(cls){ return /Дичок|Посвящ/i.test(String(cls||'')); }
function getMaxWeaveLevel(cls,lv){ lv=Number(lv)||1; if(lv>=17) return 9; if(lv>=15) return 8; if(lv>=13) return 7; if(lv>=11) return 6; if(lv>=9) return 5; if(lv>=7) return 4; if(lv>=5) return 3; if(lv>=3) return 2; return 1; }
function baseFreeWeaveLevel(cls){ return /Дичок/i.test(String(cls||'')) ? 2 : 1; }
function getSelectedTalents(){ return [...document.querySelectorAll('[data-talent]:checked')].map(x=>x.value); }
function getSelectedAffinities(){ return [...document.querySelectorAll('[data-affinity]:checked')].map(x=>x.value); }
function getSelectedWeaveTitles(){ return [...document.querySelectorAll('[data-weave-title]:checked')].map(x=>x.value); }
function getWeaveSummary(w){ return Array.isArray(w.desc) ? w.desc.join(' ') : String(w.desc || w.summary || ''); }
function getMetaValue(w,label){ const m=(w.meta||[]).find(x=>String(x.label||'').toLowerCase().includes(String(label).toLowerCase())); return m ? m.value : ''; }
function weaveAllowedByTalent(w,cls,talents){ const lv=Number(w.level)||0; if(lv<=baseFreeWeaveLevel(cls)) return true; return talents.includes(w.school); }
function renderTalentAffinityControls(){
  const tbox=$('talent-list'), abox=$('affinity-list'); if(!tbox||!abox) return;
  const selected=new Set(getSelectedTalents());
  tbox.innerHTML=CHANNELING_TALENTS.map(t=>'<label class="check"><input type="checkbox" data-talent value="'+safe(t)+'" '+(selected.has(t)?'checked':'')+'> <span>'+safe(t)+'</span></label>').join('');
  const affSel=new Set(getSelectedAffinities());
  abox.innerHTML=AFFINITIES.map(a=>'<label class="check"><input type="checkbox" data-affinity value="'+safe(a)+'" '+(affSel.has(a)?'checked':'')+'> <span>'+safe(a)+'</span></label>').join('');
}
function renderWeavePicker(){
  const wrap=$('channeling-fields'), picker=$('weave-picker'); if(!wrap||!picker) return;
  const cls=getClass(), lv=getLevel(), ch=isChannelingClass(cls);
  wrap.style.display=ch?'':'none';
  if(!ch){ picker.innerHTML=''; return; }
  renderTalentAffinityControls();
  const talents=getSelectedTalents(); const maxLv=getMaxWeaveLevel(cls,lv); const q=normText($('weave-search')?.value||''); const selected=new Set(getSelectedWeaveTitles());
  const filtered=(weaves||[]).filter(w=>Number(w.level||0)<=maxLv).filter(w=>weaveAllowedByTalent(w,cls,talents)).filter(w=>!q || normText(w.title).includes(q) || normText(w.school).includes(q));
  const groups={}; filtered.forEach(w=>{ const k='Уровень '+w.level+' · '+(w.school||'Без таланта'); (groups[k]=groups[k]||[]).push(w); });
  picker.innerHTML=Object.entries(groups).sort((a,b)=>a[0].localeCompare(b[0],undefined,{numeric:true})).map(([g,list])=>'<div class="weave-group"><div class="weave-group-title">'+safe(g)+'</div>'+list.sort((a,b)=>String(a.title).localeCompare(String(b.title))).map(w=>'<label class="weave-choice"><input type="checkbox" data-weave-title value="'+safe(w.title)+'" '+(selected.has(w.title)?'checked':'')+'> <span><b>'+safe(w.title)+'</b><small>'+safe((Array.isArray(w.powers)?w.powers.join('·'):'')+' · '+(getMetaValue(w,'Спасбросок')||''))+'</small></span></label>').join('')+'</div>').join('') || '<div class="muted mono">Нет доступных плетений при выбранных талантах/уровне.</div>';
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
    if(before < max){
      const inc = Math.min(remaining, 2, max-before);
      if(inc>0){ addStat(stats,k,inc,max); applied[k]=(applied[k]||0)+inc; remaining-=inc; }
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
    if(r.stats){
      const total = Object.values(r.stats).reduce((a,b)=>a+(Number(b)>0?Number(b):0),0);
      distributeStatPoints(stats, total, primaryStats(ctx.cls,ctx.role), max, hdb.name + ' ' + rk, out.steps);
    }
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
  updateFightingStyleSelect();
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
function calcAc(cls,stats,eq,h,style){
  const a=eq.armor, shield=(eq.shield.ac||0)+eq.shieldBonus, dex=mod(stats.dex); let ac=10+dex;
  let note='Без доспеха: 10 + ЛОВ';
  if(a.category==='none'){
    if(/Варвар/.test(cls)){ ac=10+dex+mod(stats.con)+shield; note='Защита без доспехов Варвара: 10 + ЛОВ + ТЕЛ + щит'; }
    else ac=10+dex+shield;
  }else{
    const dexPart=a.dexMax===null?dex:Math.min(dex,a.dexMax); ac=a.base+dexPart+eq.armorBonus+shield; note=`${a.name}: ${a.base} + ЛОВ${a.dexMax===null?'':' макс. '+a.dexMax} + магия/щит`;
  }
  if(style && style.id==='defense' && a.category!=='none'){ ac+=1; note+=' + стиль Защита +1'; }
  ac+=h.acBonus||0; if(h.acBonus) note+=` + Иерархия ${h.acBonus}`;
  return {ac,note};
}
function hasFeat(name,sel){return sel.some(x=>x.toLowerCase()===name.toLowerCase())}
function calcAttack(cls,stats,eq,p,featsSel,h,style){
  const w=eq.weapon; let stat=w.stat||'str'; if(w.properties&&/Finesse/i.test(w.properties)){ stat=mod(stats.dex)>=mod(stats.str)?'dex':'str'; }
  let attack=mod(stats[stat])+p+eq.weaponBonus+(h.attackBonus||0); let dmgBonus=mod(stats[stat])+eq.weaponBonus+(h.damageBonus||0);
  const notes=[];
  if(hasFeat('Пламя и пустота',featsSel)){ attack+=mod(stats.wis); notes.push(`Пламя и пустота: +${mod(stats.wis)} МДР к атаке`); }
  if(style){
    if(style.id==='archery' && w.type==='ranged'){ attack+=2; notes.push(`${style.n}: +2 к атаке дальнобойным оружием`); }
    if(style.id==='dueling' && w.type==='melee' && !/two-handed|двуруч/i.test(w.properties||'')){ dmgBonus+=2; notes.push(`${style.n}: +2 к урону одноручным оружием`); }
    if(style.id==='great_weapon') notes.push(`${style.n}: переброс 1–2 на кубиках урона двуручного/универсального оружия`);
    if(style.id==='protection') notes.push(`${style.n}: реакция, помеха атаке по союзнику в 5 фт при наличии щита`);
    if(style.id==='two_weapon') notes.push(`${style.n}: модификатор характеристики добавляется к урону второй атаки`);
  }
  if(/Варвар/.test(cls)&&w.type==='melee') notes.push('Ярость добавляет урон ярости только при атаке Силой и активной ярости.');
  if(hasFeat('Мастер большого оружия',featsSel) && /Heavy|тяж/i.test(w.properties||'')) notes.push('Мастер большого оружия: можно −5 к атаке / +10 к урону.');
  if(hasFeat('Меткий стрелок',featsSel) && w.type==='ranged') notes.push('Меткий стрелок: можно −5 к атаке / +10 к урону, игнор укрытий.');
  return {n:w.name,a:sign(attack),d:`${w.damage}${sign(dmgBonus)}`,t:w.type==='ranged'?'Прон.':'Руб./Прон.',r:w.type==='ranged'?'дистанция по оружию':'Ближний',no:[w.properties, ...notes].filter(Boolean).join(' · ')};
}

function findWeavesInput(){
  const titles = new Set(getSelectedWeaveTitles());
  const manual = ($('npc-weaves') ? $('npc-weaves').value : '').split(/[;,\n]/).map(s=>s.trim()).filter(Boolean);
  manual.forEach(x=>titles.add(x));
  return [...titles].map(n=>weaves.find(w=>normText(w.title)===normText(n))||{title:n,level:'?',school:'?',desc:['Плетение не найдено в базе.']});
}
function buildNpc(){
  const name=$('npc-name').value.trim()||'Новый NPC', nation=getNation(), lv=getLevel(), cls=getClass(), arch=getArch(), role=$('npc-role').value, faction=$('npc-faction').value, rank=$('npc-rank').value, p=prof(lv), featsSel=selectedFeats();
  const style=getSelectedFightingStyle();
  const selectedTalents=getSelectedTalents(), selectedAffinities=getSelectedAffinities();
  const baseStats=getBaseStats(), applied=applyStatBlock(baseStats,{cls,role,faction,rank,lv,nation,featsSel}), stats=applied.stats, h=applied.hierarchy, eq=getEquipment(), acCalc=calcAc(cls,stats,eq,h,style), features=availableFeatures(cls,arch,lv);
  const hp=avgHp(cls,lv,stats.con,h), ini=mod(stats.dex)+(h.initiativeBonus||0), pp=10+mod(stats.wis)+p+((featsSel.includes('Внимательный'))?5:0);
  const attack=calcAttack(cls,stats,eq,p,featsSel,h,style), hi=h.name?{nm:h.name,ty:h.type,items:[...h.items,{n:'Сводные бонусы',d:`ОЗ ${h.hpBonus?'+ '+h.hpBonus:''}${h.hpMult?' ×'+h.hpMult:''}; КД +${h.acBonus||0}; скорость +${h.speedBonus||0}; инициатива +${h.initiativeBonus||0}${h.initiativeAdv?' и преимущество':''}; спасброски +${h.saveBonus||0}; DC плетений +${h.dcBonus||0}; сила плетений +${h.weavePower||0}; доп. плетения ${h.extraSlots||0}.`}]}:null;
  const spells=findWeavesInput().map(w=>({n:w.title,lv:w.level,tal:w.school||'',el:Array.isArray(w.powers)?w.powers.join('·'):'',t:getMetaValue(w,'Время плетения')||w.cast||'',r:getMetaValue(w,'Дальность')||w.range||'',dur:getMetaValue(w,'Длительность')||w.duration||'',sb:getMetaValue(w,'Спасбросок')||w.save||'',slot:String(w.level||''),dmg:w.damage||'—',ef:getWeaveSummary(w).slice(0,320)}));
  const ab=[];
  features.forEach(f=>ab.push({n:f.feature,d:f.description,hi:Number(f.levelSort||0)===lv||f.archetype===arch,source:'class'}));
  if(style) ab.push({n:style.n,d:style.d,hi:true,source:'fighting-style'});
  featsSel.forEach(fn=>{const f=feats.find(x=>x.name===fn); ab.push({n:fn,d:f?f.desc.join(' '):'Дополнительная черта.',hi:false,source:'feat'});});
  h.traits.forEach(t=>ab.push({n:t.n,d:t.d,hi:true,source:'hierarchy',color:t.color}));
  const id=200000+Date.now()%100000000;
  const npc={id,sh:name,na:nation,lv,ic:/Дичок|Посвящ/.test(cls)?'🔥':/Лесник/.test(cls)?'🏹':/Скиталец/.test(cls)?'◇':/Варвар/.test(cls)?'🪓':'⚔',ty:hi?'purple':'warning',custom:true,ti:`${name} — ${cls}${arch&&arch!=='Базовый класс'?' / '+arch:''} ${lv}-го уровня`,su:`Черновик NPC · ${role} · ${$('npc-threat').value}`,tags:[cls,arch,`Ур.${lv}`,nation].filter(Boolean),talents:selectedTalents,affinities:selectedAffinities,st:stats,co:{hp,ac:acCalc.ac,sp:30+(h.speedBonus||0),ini:sign(ini)+(h.initiativeAdv?' / преим.':''),prof:sign(p),sv:`${cls==='Варвар'?'Сил, Тел':/Дичок|Посвящ/.test(cls)?'Инт, Мдр':'по классу'}${h.saveBonus?' +'+h.saveBonus+' от Иерархии':''}`,pp,cr:`${attack.n}: ${attack.a}, ${attack.d}`},at:[attack],ab,hi,eq:[{r:!!(eq.weaponBonus||eq.armorBonus||eq.shieldBonus),t:`${eq.weapon.name}${eq.weaponBonus?` +${eq.weaponBonus}`:''}; ${eq.armor.name}${eq.armorBonus?` +${eq.armorBonus}`:''}; ${eq.shield.name}${eq.shieldBonus?` +${eq.shieldBonus}`:''}. КД: ${acCalc.note}.`}],sk:[{n:'Восприятие',v:sign(mod(stats.wis)+p),e:false,note:'Черновой расчёт.'},{n:'Проницательность',v:sign(mod(stats.wis)+p),e:false,note:'Черновой расчёт.'}],verify:[],tactics:[{ph:'Роль',d:`${role}. Уточните боевой паттерн под сцену.`},{ph:'Проверка ГМ',d:'Перед канонизацией проверьте ОЗ, КД, предметы, плетения и бонусы Иерархии.'}],dm:$('npc-notes')?.value||'Создано генератором. Требует утверждения ГМ.'};
  if(spells.length) npc.spells=spells;
  if(selectedTalents.length) npc.excTalents=selectedTalents.map(t=>({tal:t,items:[{lv:1,n:'Исключительный талант: '+t,d:'Выбран в генераторе NPC. Проверьте точное описание таланта по базе правил.'}]}));
  npc.verify=validateNpc({cls,arch,lv,nation,features,featsSel,spells,h,stats,hp,ac:acCalc.ac,applied,eq,attack,selectedTalents,selectedAffinities});
  currentNpc=npc; reviewReady=true; renderReview(npc,{applied,acCalc,attack,eq}); return npc;
}
function validateNpc(ctx){
  const out=[]; out.push({s:'ok',t:`Бонус мастерства: ${sign(prof(ctx.lv))}.`});
  out.push({s:'ok',t:`Рост характеристик: уровни ${ctx.applied.asiEvents.join(', ')||'нет'}; использовано пунктов +${ctx.applied.asiPointsUsed}.`});
  const nmatch=getNationMatch(ctx.nation);
  if(Object.keys(ctx.applied.nationBonus).length) out.push({s:'ok',t:`Бонус нации применён (${nmatch.key||ctx.nation}): ${Object.entries(ctx.applied.nationBonus).map(([k,v])=>abbr[k]+' +'+v).join(', ')}.`});
  else if(nmatch.status==='ambiguous') out.push({s:'warn',t:`Нация указана неоднозначно: ${ctx.nation}. Возможные варианты: ${(nmatch.candidates||[]).join(', ')}.`});
  else out.push({s:'warn',t:'Бонус нации не найден: проверьте написание нации.'});
  if(ctx.applied.featPenalty) out.push({s:'warn',t:`Выбрано дополнительных черт: ${ctx.applied.featPenalty}. По правилу нужно уменьшить один из уровневых приростов характеристик на 1 за каждую такую черту. Генератор уже уменьшил авто-распределение на ${ctx.applied.featPenalty}, но ГМ должен подтвердить выбор.`});
  if(!ctx.features.length) out.push({s:'err',t:'Не найдены классовые черты. Проверьте класс/архетип в classes-data.js.'}); else out.push({s:'ok',t:`Найдено черт класса/архетипа: ${ctx.features.length}.`});
  const st=getSelectedFightingStyle();
  const opts=getFightingStyleOptions(ctx.cls,ctx.arch,ctx.lv);
  if(opts.length && st) out.push({s:'ok',t:`Стиль боя выбран: ${st.n}. Бонусы стиля учтены в финальной карточке.`});
  if(opts.length && !st) out.push({s:'warn',t:'Класс/архетип получает Стиль боя, но стиль не выбран.'});
  if(ctx.arch!=='Базовый класс'&&!ctx.features.some(f=>f.archetype===ctx.arch)) out.push({s:'warn',t:'Для выбранного архетипа нет доступных черт на этом уровне.'});
  if(/Дичок|Посвящ/.test(ctx.cls)&&!(ctx.selectedTalents||[]).length) out.push({s:'warn',t:'NPC-направляющему не выбраны Исключительные таланты. Плетения выше свободного уровня будут скрыты.'});
  if(/Дичок|Посвящ/.test(ctx.cls)&&!(ctx.selectedAffinities||[]).length) out.push({s:'warn',t:'NPC-направляющему не выбраны аффинитеты.'});
  if(/Дичок|Посвящ/.test(ctx.cls)&&!ctx.spells.length) out.push({s:'warn',t:'NPC-направляющему не выбраны плетения.'});
  if(/Дичок|Посвящ/.test(ctx.cls)&&(ctx.selectedTalents||[]).length) out.push({s:'ok',t:'Исключительные таланты: '+ctx.selectedTalents.join(', ')+'.'});
  if(/Дичок|Посвящ/.test(ctx.cls)&&(ctx.selectedAffinities||[]).length) out.push({s:'ok',t:'Аффинитеты: '+ctx.selectedAffinities.join(', ')+'.'});
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
  initClassSelect(); initNationSelect(); initEquipment(); initFeats(); updateFightingStyleSelect(); renderWeavePicker(); buildNpc(); renderCustomManager();
  $('npc-class').addEventListener('change',()=>{updateArchSelect(); updateFightingStyleSelect(); renderWeavePicker(); buildNpc();}); $('npc-arch').addEventListener('change',()=>{updateFightingStyleSelect(); buildNpc();}); $('npc-fighting-style')?.addEventListener('change',buildNpc); $('feat-search').addEventListener('input',initFeats); $('weave-search')?.addEventListener('input',()=>{renderWeavePicker(); buildNpc();}); $('clear-weaves')?.addEventListener('click',()=>{document.querySelectorAll('[data-weave-title]').forEach(x=>x.checked=false); $('npc-weaves').value=''; buildNpc();});
  $('apply-template').addEventListener('click',applyTemplate); $('generate').addEventListener('click',buildNpc); $('copy-export').addEventListener('click',copyExport); $('save-local').addEventListener('click',saveLocal); $('clear-custom').addEventListener('click',clearCustom);
  document.addEventListener('click',e=>{ const i=e.target.closest('.info-dot'); if(i){showFeatureModal(Number(i.dataset.featureIndex));} const d=e.target.closest('[data-del-custom]'); if(d){deleteCustomNpc(d.dataset.delCustom);} if(e.target.id==='feature-modal') e.target.style.display='none'; });
  document.addEventListener('change',e=>{ const t=e.target; if(t && t.matches && (t.matches('[data-talent]')||t.matches('[data-affinity]'))){ renderWeavePicker(); buildNpc(); } else if(t && t.matches && t.matches('[data-weave-title]')){ buildNpc(); } });
  document.querySelectorAll('input,select,textarea').forEach(el=>el.addEventListener('change',()=>{ if(el.id==='feat-search') return; if(el.id==='npc-class'||el.id==='npc-arch'||el.id==='npc-fighting-style') return; if(el.id==='npc-level'){ updateFightingStyleSelect(); renderWeavePicker(); } if(el.matches && (el.matches('[data-talent]')||el.matches('[data-affinity]'))){ renderWeavePicker(); } buildNpc(); }));
}
document.addEventListener('DOMContentLoaded',bind);
})();
