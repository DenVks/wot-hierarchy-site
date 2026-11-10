/* Portable monster scenes: versioned data only, resolved against the installed bestiary. */
(function(root){
'use strict';
const FORMAT='wot-monster-scene',VERSION=1,DATASET='wot-bestiary-v178';
const CONDITIONS=['stun','prone','blind','restrained','poison','fear'];
function fail(text){throw new Error(text);}
function object(v,label){if(!v||typeof v!=='object'||Array.isArray(v))fail('Неверный объект: '+label);return v;}
function text(v,max,label){if(typeof v!=='string'||v.length>max)fail('Неверный текст: '+label);return v;}
function number(v,min,max,label){if(!Number.isFinite(v)||!Number.isInteger(v)||v<min||v>max)fail('Неверное число: '+label);return v;}
function id(v){const s=String(v);if(!/^[a-zA-Z0-9_-]{1,100}$/.test(s))fail('Неверный идентификатор');return s;}
function guard(v,depth=0){
 if(depth>15)fail('Слишком глубокая структура');
 if(v&&typeof v==='object')for(const k of Object.keys(v)){if(['__proto__','constructor','prototype'].includes(k))fail('Недопустимый ключ');guard(v[k],depth+1);}
}
function validate(data,resolve,backgroundIds){
 guard(data);object(data,'сцена');
 if(data.format!==FORMAT||data.version!==VERSION)fail('Неподдерживаемый формат или версия сцены');
 if(data.dataset!==DATASET)fail('Сцена использует другую версию бестиария');
 const out={format:FORMAT,version:VERSION,dataset:DATASET,sceneId:id(data.sceneId),name:text(data.name,120,'название'),savedAt:text(data.savedAt,40,'дата')};
 if(!Array.isArray(data.creatures)||data.creatures.length>1000)fail('Неверный список существ');
 const seen=new Set();out.creatures=data.creatures.map(row=>{
  object(row,'существо');const templateId=id(row.templateId),base=resolve(templateId);if(!base)fail('В бестиарии нет существа: '+templateId);
  const entityId=id(row.id);if(seen.has(entityId))fail('Повторный ID участника');seen.add(entityId);
  const clone=entityId!==templateId;if(clone&&!/^clone-\d+$/.test(entityId))fail('Неверный ID копии');
  const c={id:entityId,templateId,cloneNo:clone?number(row.cloneNo,1,1000000,'номер копии'):null,profile:{},sources:{},traits:[]};
  object(row.profile,'защита');object(row.sources,'источники защиты');
  for(const kind of ['res','vul','idmg','ics']){
   c.profile[kind]=text(row.profile[kind],8000,'профиль');c.sources[kind]={};
   for(const [key,value] of Object.entries(object(row.sources[kind],'метки защиты'))){if(value!=='background')fail('Неизвестный источник защиты');c.sources[kind][text(key,1000,'метка')]=value;}
  }
  if(!Array.isArray(row.traits)||row.traits.length>100)fail('Неверный список черт среды');
  c.traits=row.traits.map(x=>{if(!backgroundIds.includes(x))fail('Неизвестная черта среды');return x;});
  const s=object(row.state,'состояние');c.state={hp:number(s.hp,0,base.hp,'HP'),phase:number(s.phase,1,base.ph2?2:1,'фаза'),bleach:number(s.bleach,0,3,'метки'),ini:s.ini===null?null:number(s.ini,-100,200,'инициатива'),conds:{},roll:{}};
  object(s.conds,'состояния');for(const [key,value] of Object.entries(s.conds)){if(!CONDITIONS.includes(key)||typeof value!=='boolean')fail('Неизвестное состояние');c.state.conds[key]=value;}
  object(s.roll,'броски');for(const [key,value] of Object.entries(s.roll)){if(!/^(?:quick|\d+)$/.test(key))fail('Неверный ключ броска');c.state.roll[key]={text:text(object(value,'бросок').text,1600,'результат броска')};}
  return c;
 });
 const names=new Map(out.creatures.map(c=>[c.id,c]));
 if(!Array.isArray(data.initiative)||data.initiative.length>1000)fail('Неверная очередь');
 const queueIds=new Set();out.initiative=data.initiative.map(row=>{
  object(row,'участник очереди');const entityId=id(row.id);if(queueIds.has(entityId))fail('Повторный участник очереди');queueIds.add(entityId);
  if(typeof row.manual!=='boolean')fail('Неверный тип участника');if(!row.manual&&!names.has(entityId))fail('В очереди отсутствующее существо');if(row.manual&&!entityId.startsWith('manual-'))fail('Неверный ID ручного участника');
  return {id:entityId,manual:row.manual,name:text(row.name,100,'имя'),val:number(row.val,-100,200,'инициатива'),z:text(row.z,100,'зона')};
 });
 out.nextCloneId=number(data.nextCloneId,1,1000000000,'следующий ID копии');
 if(out.creatures.some(c=>c.cloneNo!==null&&Number(c.id.slice(6))>=out.nextCloneId))fail('Счётчик копий пересекается с существующими ID');
 const numbers=new Set();for(const c of out.creatures){if(c.cloneNo!==null){const n=c.templateId+':'+c.cloneNo;if(numbers.has(n))fail('Повторный номер копии');numbers.add(n);if(!names.has(c.templateId))fail('Нет исходного статблока копии');}}
 out.turnIndex=number(data.turnIndex,0,Math.max(0,out.initiative.length-1),'текущий ход');out.round=number(data.round,0,1000000,'раунд');out.turnSerial=number(data.turnSerial,0,1000000000,'номер хода');
 if(typeof data.running!=='boolean'||(data.running&&(!out.round||!out.initiative.length)))fail('Неверное состояние боя');out.running=data.running;
 out.selectedId=data.selectedId===null?null:id(data.selectedId);if(out.selectedId&&!names.has(out.selectedId))fail('Выбранного существа нет в сцене');
 if(!['combat','traits','km','defense'].includes(data.tab))fail('Неизвестная вкладка');out.tab=data.tab;
 out.backgroundId=text(data.backgroundId,100,'фон');if(out.backgroundId&&!backgroundIds.includes(out.backgroundId))fail('Неизвестный фон');out.backgroundExpanded=Boolean(data.backgroundExpanded);
 if(!Array.isArray(data.log)||data.log.length>100)fail('Неверный журнал');out.log=data.log.map(row=>({time:text(row.time,60,'время'),text:text(row.text,2000,'событие')}));
 return out;
}
root.WOT_MONSTER_SCENE={FORMAT,VERSION,DATASET,validate};
})(window);
