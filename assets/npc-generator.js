(function(){
'use strict';
const CUSTOM_KEY='wot_custom_npcs_v1';
const clsDb=window.WOT_CLASSES_DB||{features:[],meta:{classes:[]}};
const feats=(window.WOT_FEATS_DB&&window.WOT_FEATS_DB.feats)||[];
const weaves=window.WOT_WEAVES||[];
const existing=Array.isArray(window.CS)?window.CS:(typeof CS!=='undefined'?CS:[]);
let currentNpc=null;
const $=id=>document.getElementById(id);
const abbr={str:'СИЛ',dex:'ЛОВ',con:'ТЕЛ',int:'ИНТ',wis:'МДР',cha:'ХАР'};
const hitDie={'Варвар':12,'Пустынный воин':10,'Мастер по оружию':10,'Лесник':10,'Благородный':8,'Скиталец':8,'Дичок':8,'Посвящённый':4};
const roleTemplates={
  'Фронтлайн':{str:16,dex:12,con:16,int:10,wis:12,cha:10},
  'Стрелок':{str:10,dex:16,con:14,int:12,wis:14,cha:10},
  'Скиталец':{str:8,dex:16,con:14,int:14,wis:12,cha:12},
  'Направляющий':{str:8,dex:12,con:14,int:16,wis:16,cha:10},
  'Командир':{str:12,dex:12,con:14,int:14,wis:14,cha:16},
  'Сбалансированный':{str:13,dex:13,con:14,int:12,wis:13,cha:12}
};
function mod(v){return Math.floor((Number(v)-10)/2)}
function sign(v){return (v>=0?'+':'')+v}
function prof(lv){return Math.ceil(Number(lv)/4)+1}
function avgHp(cls,lv,con){const die=hitDie[cls]||8; if(lv<1)return 1; return die+mod(con)+Math.max(0,lv-1)*(Math.floor(die/2)+1+mod(con));}
function safe(s){return String(s||'').replace(/[&<>]/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;'}[ch]))}
function slug(s){return String(s||'').toLowerCase().replace(/ё/g,'е').replace(/[^a-zа-я0-9]+/g,'-').replace(/^-|-$/g,'')}
function getLevel(){return Math.max(1,Math.min(20,parseInt($('npc-level').value||'1',10)))}
function getStats(){return ['str','dex','con','int','wis','cha'].reduce((o,k)=>(o[k]=Number($(k).value)||10,o),{})}
function getClass(){return $('npc-class').value}
function getArch(){return $('npc-arch').value}
function initClassSelect(){
  const classes=Array.from(new Set(clsDb.features.map(f=>f.className).filter(Boolean))).sort((a,b)=>a.localeCompare(b));
  $('npc-class').innerHTML=classes.map(c=>`<option>${safe(c)}</option>`).join('');
  if(classes.includes('Варвар')) $('npc-class').value='Варвар';
  updateArchSelect();
}
function updateArchSelect(){
  const c=getClass();
  const archs=Array.from(new Set(clsDb.features.filter(f=>f.className===c).map(f=>f.archetype).filter(a=>a&&a!=='Базовый класс')));
  $('npc-arch').innerHTML='<option value="Базовый класс">Базовый класс</option>'+archs.sort((a,b)=>a.localeCompare(b)).map(a=>`<option>${safe(a)}</option>`).join('');
}
function initFeats(){
  const list=$('feat-list');
  const q=($('feat-search').value||'').toLowerCase();
  list.innerHTML=feats.filter(f=>!q||String(f.name).toLowerCase().includes(q)||String(f.cls).toLowerCase().includes(q)).slice(0,120).map((f,i)=>{
    const id='feat_'+slug(f.name)+'_'+i;
    return `<label class="check"><input type="checkbox" value="${safe(f.name)}" data-name="${safe(f.name)}"><span><b>${safe(f.name)}</b> <small>${safe(f.cls&&f.cls!=='—'?f.cls:'')} ${safe(f.req&&f.req!=='—'?'· '+f.req:'')}</small></span></label>`;
  }).join('')||'<div class="mono warn">Ничего не найдено.</div>';
}
function selectedFeats(){return Array.from(document.querySelectorAll('#feat-list input:checked')).map(i=>i.dataset.name)}
function applyTemplate(){
  const t=roleTemplates[$('npc-role').value]||roleTemplates['Сбалансированный'];
  Object.entries(t).forEach(([k,v])=>$(k).value=v);
}
function availableFeatures(cls,arch,lv){
  return clsDb.features.filter(f=>f.className===cls && Number(f.levelSort||0)<=lv && (f.archetype==='Базовый класс'||f.archetype===arch))
    .filter(f=>!/(Параметры класса|Владение|Снаряжение|Создание)/i.test(String(f.category||'')) || /Увеличение характеристик/.test(String(f.feature||'')))
    .sort((a,b)=>(Number(a.levelSort||0)-Number(b.levelSort||0))||String(a.feature).localeCompare(String(b.feature)));
}
function hierarchyBonuses(faction,rank,stats,lv){
  const r={name:'',tags:[],items:[],hpBonus:0,acBonus:0,iniBonus:0,svBonus:0,dcBonus:0};
  const rn={'I':1,'II':2,'III':3,'IV':4,'V':5}[rank]||0;
  if(!faction||faction==='none'||!rn) return r;
  const labels={unity:'Иерархия Единства',throne:'Хрустальный Трон',guild:'Гильдия Хранителей',order:'Орден Стражей Узора',wall:'Иерархия Стены'};
  r.name=(labels[faction]||'Иерархия')+', Ранг '+rank; r.tags.push('Ранг '+rank);
  r.hpBonus=rn===1?5:rn===2?10:Math.round(lv*(rn+2));
  r.iniBonus=rn>=2?2:0; r.svBonus=rn>=2?1:0; r.dcBonus=rn>=2?1:0;
  if(faction==='unity'){stats.wis+=Math.min(4,rn*2); stats.int+=rn>=2?2:0; r.items.push({n:'Энергетическая связь',d:'Союзники рядом получают поддержку Иерархии; точные параметры уточняются по странице Единства.'});}
  if(faction==='throne'){stats.str+=rn>=2?2:0; stats.cha+=rn>=2?2:0; r.items.push({n:'Аура Имперской Власти',d:'Социальное давление, приказ и подчинение по правилам Хрустального Трона.'});}
  if(faction==='guild'){stats.int+=rn>=2?2:0; stats.dex+=rn>=3?2:0; r.items.push({n:'Инженерия Воли',d:'Техно-дисциплинарное усиление Хранителей Фар Мэддинга.'});}
  if(faction==='order'){stats.wis+=rn>=2?2:0; stats.con+=rn>=3?2:0; r.items.push({n:'Стабилизация Узора',d:'Способности Ордена по работе с аномалиями и ранами реальности.'});}
  if(faction==='wall'){stats.con+=rn>=2?2:0; stats.wis+=rn>=3?2:0; r.items.push({n:'Адаптация к Стене',d:'Навыки выживания в Ореоле/Гребне и сопротивление эффектам Стены.'});}
  r.items.push({n:'Наследование рангов',d:'Ранг наследует уникальные свойства всех нижестоящих рангов этой Иерархии.'});
  return r;
}
function makeAttacks(cls,stats,p,featsSel){
  const dexAtk=mod(stats.dex)+p, strAtk=mod(stats.str)+p;
  if(/Скиталец/.test(cls)) return [{n:'Рапира',a:sign(dexAtk),d:`1к8${sign(mod(stats.dex))}`,t:'Прон.',r:'Ближний',no:'Скрытная атака добавляется отдельной кнопкой/строкой при выполнении условий.'}];
  if(/Лесник/.test(cls)) return [{n:'Длинный лук',a:sign(dexAtk+2),d:`1к8${sign(mod(stats.dex))}`,t:'Прон.',r:'150/600 фт',no:'Стиль Стрельба учтён, если выбран для NPC.'}];
  if(/Дичок|Посвящённый/.test(cls)) return [{n:'Посох',a:sign(strAtk),d:`1к6${sign(mod(stats.str))}`,t:'Дроб.',r:'Ближний',no:'Основной урон должен идти через вкладку плетений.'}];
  if(/Варвар|Мастер по оружию|Пустынный воин/.test(cls)) return [{n:'Основное оружие',a:sign(strAtk),d:`1к12${sign(mod(stats.str))}`,t:'Руб.',r:'Ближний',no:'Замените на конкретное оружие/тер’ангриал после утверждения ГМ.'}];
  return [{n:'Оружие',a:sign(Math.max(strAtk,dexAtk)),d:'1к8',t:'—',r:'Ближний',no:'Черновая атака.'}];
}
function findWeavesInput(){
  const names=$('npc-weaves').value.split(/[;,\n]/).map(s=>s.trim()).filter(Boolean);
  return names.map(n=>weaves.find(w=>String(w.title).toLowerCase()===n.toLowerCase())||{title:n,level:'?',school:'?',desc:'Плетение не найдено в базе.'});
}
function buildNpc(){
  const name=$('npc-name').value.trim()||'Новый NPC';
  const nation=$('npc-nation').value.trim()||'—';
  const lv=getLevel(); const cls=getClass(); const arch=getArch(); const p=prof(lv);
  const rawStats=getStats(); const stats=JSON.parse(JSON.stringify(rawStats));
  const hb=hierarchyBonuses($('npc-faction').value,$('npc-rank').value,stats,lv);
  const features=availableFeatures(cls,arch,lv);
  const featsSel=selectedFeats();
  const hp=avgHp(cls,lv,stats.con)+hb.hpBonus;
  let ac=10+mod(stats.dex); if(/Варвар/.test(cls)) ac=10+mod(stats.dex)+mod(stats.con); else if(/Скиталец|Лесник|Пустынный/.test(cls)) ac=12+mod(stats.dex); else ac=13+Math.min(2,mod(stats.dex));
  const ini=mod(stats.dex)+hb.iniBonus;
  const pp=10+mod(stats.wis)+p;
  const hi=hb.name?{nm:hb.name,ty:$('npc-faction').value==='throne'?'shonchan':$('npc-faction').value==='guild'?'guild':'unity',items:hb.items}:null;
  const spells=findWeavesInput().map(w=>({n:w.title,lv:w.level,tal:w.school||'',el:Array.isArray(w.powers)?w.powers.join('·'):'',t:w.cast||'',r:w.range||'',dur:w.duration||'',sb:w.save||'',slot:String(w.level||''),dmg:w.damage||'—',ef:(w.summary||w.desc||'').slice(0,260)}));
  const ab=features.map(f=>({n:f.feature,d:f.description,hi:Number(f.levelSort||0)===lv || f.archetype===arch}));
  featsSel.forEach(fn=>{const f=feats.find(x=>x.name===fn); ab.push({n:fn,d:f?f.desc.join(' '):'Дополнительная черта.',hi:false});});
  const id=200000+Date.now()%100000000;
  const npc={id,sh:name,na:nation,lv,ic:/Дичок|Посвящённый/.test(cls)?'🔥':/Лесник/.test(cls)?'🏹':/Скиталец/.test(cls)?'◇':/Варвар/.test(cls)?'🪓':'⚔',ty:hi?'purple':'warning',custom:true,ti:`${name} — ${cls}${arch&&arch!=='Базовый класс'?' / '+arch:''} ${lv}-го уровня`,su:`Черновик NPC · ${$('npc-role').value} · ${$('npc-threat').value}`,tags:[cls,arch,`Ур.${lv}`,nation].filter(Boolean),st:stats,co:{hp,ac,sp:30,ini:sign(ini),prof:sign(p),sv:`Основные: ${cls==='Варвар'?'Сил, Тел':/Дичок|Посвящённый/.test(cls)?'Инт, Мдр':'по классу'} ${hb.svBonus?'+ бонус иерархии':''}`,pp,cr:`Черновик · проверьте вручную`},at:makeAttacks(cls,stats,p,featsSel),ab,hi,eq:[{r:false,t:'Снаряжение требует утверждения ГМ.'}],sk:[{n:'Восприятие',v:sign(mod(stats.wis)+p),e:false,note:'Черновой расчёт.'},{n:'Проницательность',v:sign(mod(stats.wis)+p),e:false,note:'Черновой расчёт.'}],verify:validateNpc({cls,arch,lv,features,featsSel,spells,hb,stats,hp,ac}),tactics:[{ph:'Роль',d:`${$('npc-role').value}. Уточните боевой паттерн под сцену.`},{ph:'Проверка ГМ',d:'Перед переносом в канон проверьте ОЗ, КД, предметы, плетения и бонусы Иерархии.'}],dm:$('npc-notes')?.value||'Создано генератором. Требует утверждения ГМ.'};
  if(spells.length) npc.spells=spells;
  currentNpc=npc; renderPreview(npc); return npc;
}
function validateNpc(ctx){
  const out=[];
  out.push({s:'ok',t:`Бонус мастерства рассчитан по уровню: ${sign(prof(ctx.lv))}.`});
  if(!ctx.features.length) out.push({s:'err',t:'Не найдены классовые черты. Проверьте класс/архетип в classes-data.js.'}); else out.push({s:'ok',t:`Найдено черт класса/архетипа: ${ctx.features.length}.`});
  if(ctx.arch!=='Базовый класс'&&!ctx.features.some(f=>f.archetype===ctx.arch)) out.push({s:'warn',t:'Для выбранного архетипа нет доступных черт на этом уровне.'});
  if(/Дичок|Посвящённый/.test(ctx.cls)&&!ctx.spells.length) out.push({s:'warn',t:'NPC-направляющему не выбраны плетения.'});
  if(ctx.hb.name) out.push({s:'warn',t:'Бонусы Иерархии применены по упрощённой модели. Сверьте с соответствующей страницей правил.'});
  ctx.featsSel.forEach(fn=>{const f=feats.find(x=>x.name===fn); if(f&&f.cls&&f.cls!=='—'&&!String(ctx.cls).includes(f.cls)&&!String(f.cls).includes('Направляющий')) out.push({s:'warn',t:`Проверьте требование черты «${fn}»: класс/условие ${f.cls}.`});});
  out.push({s:'warn',t:'Снаряжение, ангриалы и тер’ангриалы не назначаются автоматически — добавить вручную.'});
  return out;
}
function renderPreview(npc){
  const stats=Object.entries(npc.st).map(([k,v])=>`<div class="stat"><b>${abbr[k]}</b><span>${v} (${sign(mod(v))})</span></div>`).join('');
  $('preview').innerHTML=`<div class="preview-grid"><div><div class="card"><h3>${safe(npc.ti)}</h3><p>${safe(npc.su)}</p><div>${npc.tags.map(t=>`<span class="badge">${safe(t)}</span>`).join('')}</div></div><div class="card"><h3>Характеристики</h3><div class="statrow">${stats}</div></div><div class="card"><h3>Ядро</h3><p class="mono">ОЗ ${npc.co.hp} · КД ${npc.co.ac} · Иниц. ${npc.co.ini} · Пасс. Воспр. ${npc.co.pp}</p></div></div><div><div class="card feature-list"><h3>Черты (${npc.ab.length})</h3>${npc.ab.slice(0,80).map(a=>`<div class="feature"><b>${safe(a.n)}</b><br><small>${safe(String(a.d).slice(0,240))}${String(a.d).length>240?'…':''}</small></div>`).join('')}</div></div></div>`;
  $('validation').innerHTML=npc.verify.map(v=>`<div class="${v.s==='ok'?'ok':v.s==='err'?'err':'warn'}">${v.s==='ok'?'✓':v.s==='err'?'✕':'⚠'} ${safe(v.t)}</div>`).join('');
  const exp=JSON.stringify(npc,null,2).replace(/"([^"\n]+)":/g,'$1:');
  $('export-box').textContent=exp;
}
function saveLocal(){
  const npc=currentNpc||buildNpc();
  const arr=JSON.parse(localStorage.getItem(CUSTOM_KEY)||'[]').filter(x=>x.id!==npc.id);
  arr.push(npc); localStorage.setItem(CUSTOM_KEY,JSON.stringify(arr));
  alert('NPC добавлен в пользовательскую базу этого браузера. Откройте NPC / Бой и сделайте Ctrl+F5, если он не появился сразу.');
}
function clearCustom(){ if(confirm('Удалить всех пользовательских NPC из этого браузера?')){localStorage.removeItem(CUSTOM_KEY); alert('Пользовательские NPC удалены.');}}
function copyExport(){navigator.clipboard&&navigator.clipboard.writeText($('export-box').textContent).then(()=>alert('JS/JSON скопирован.'));}
function bind(){
  initClassSelect(); initFeats(); buildNpc();
  $('npc-class').addEventListener('change',()=>{updateArchSelect(); buildNpc();});
  $('npc-arch').addEventListener('change',buildNpc);
  $('feat-search').addEventListener('input',initFeats);
  $('apply-template').addEventListener('click',()=>{applyTemplate(); buildNpc();});
  $('generate').addEventListener('click',buildNpc);
  $('copy-export').addEventListener('click',copyExport);
  $('save-local').addEventListener('click',saveLocal);
  $('clear-custom').addEventListener('click',clearCustom);
  document.querySelectorAll('input,select,textarea').forEach(el=>el.addEventListener('change',()=>{ if(el.id!=='feat-search') buildNpc(); }));
}
document.addEventListener('DOMContentLoaded',bind);
})();
