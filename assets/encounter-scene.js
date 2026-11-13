/* Mixed encounter data and commands. Game effects remain explicit Master decisions. */
(function(root,factory){
  const common=typeof module==='object'&&module.exports?require('./github-store.js'):root.WOT_GITHUB_STORE;
  const api=factory(common);
  if(typeof module==='object'&&module.exports)module.exports=api;else root.WOT_ENCOUNTER=api;
})(typeof window==='object'?window:globalThis,function(common){
  'use strict';
  const {clone,StoreError}=common;
  const FORMAT='wot-encounter',VERSION=1,BOOK_FORMAT='wot-encounter-book',FILE='wot-data/encounters.json';
  const NATIVE={npc:'npc-state-v56',monster:'monster-state-v1',manual:'manual-v1'};
  const CONDITIONS=['stun','fear','poison','prone','blind','conc','restrained'];
  const fail=message=>{throw new StoreError('SCENE_INVALID',message);};
  const object=(value,label)=>{if(!value||typeof value!=='object'||Array.isArray(value))fail('Неверный объект: '+label);return value;};
  const text=(value,max,label)=>{if(typeof value!=='string'||value.length>max)fail('Неверный текст: '+label);return value;};
  const integer=(value,min,max,label)=>{if(!Number.isSafeInteger(value)||value<min||value>max)fail('Неверное число: '+label);return value;};
  const id=value=>{if(typeof value!=='string'||!/^[-a-zA-Z0-9_]{1,100}$/.test(value))fail('Неверный ID сцены или участника.');return value;};
  function checkJson(value,depth=0){
    if(depth>22)fail('Слишком глубокая структура сцены.');
    if(typeof value==='number'&&!Number.isFinite(value))fail('Нечисловой счётчик в состоянии.');
    if(['function','symbol','bigint','undefined'].includes(typeof value))fail('Сцена должна содержать только JSON-данные.');
    if(value&&typeof value==='object')for(const [key,item]of Object.entries(value)){
      if(['__proto__','constructor','prototype'].includes(key))fail('Недопустимый ключ сцены.');checkJson(item,depth+1);
    }
  }
  function actorHp(actor){return actor.kind==='manual'?null:actor.state[actor.kind==='npc'?'curHp':'hp'];}
  function actorConditions(actor){return actor.kind==='npc'?actor.state.conditions.slice():actor.kind==='monster'?Object.keys(actor.state.conds).filter(key=>actor.state.conds[key]):[];}
  function validateProfile(actor){
    const card=actor.snapshot;if(actor.kind==='manual')return;
    text(actor.kind==='npc'?card.sh:card.nm,300,'имя снимка');
    const fields=actor.kind==='npc'?['at','ab','eq','sk','spells','slots','tactics']:['at','tr','re','la'];
    for(const key of fields)if(card[key]!==undefined&&card[key]!==null){if(!Array.isArray(card[key])||card[key].length>1000)fail('Неверный раздел карточки: '+key);for(const item of card[key])object(item,key);}
    if(card.st!==undefined)object(card.st,'характеристики');
    if(actor.kind==='npc'){object(card.co,'параметры NPC');integer(card.co.hp,1,1000000,'базовые хиты NPC');}else integer(card.hp,1,1000000,'базовые хиты монстра');
  }
  function validateCounters(actor){
    const state=actor.state;
    if(state.slots!==undefined){object(state.slots,'ячейки');for(const slot of Object.values(state.slots)){object(slot,'ячейка');integer(slot.total,0,1000,'запас ячеек');integer(slot.used,0,slot.total,'расход ячеек');}}
    if(state.manualResources!==undefined){if(!Array.isArray(state.manualResources)||state.manualResources.length>40)fail('Неверные дополнительные счётчики.');for(const item of state.manualResources){object(item,'счётчик');text(item.name,100,'название счётчика');integer(item.total,1,1000,'запас счётчика');integer(item.used,0,item.total,'расход счётчика');}}
    if(state.sceneNotes!==undefined)text(state.sceneNotes,12000,'заметки');
    if(state.sdTotal!==undefined){integer(state.sdTotal,0,1000,'кости превосходства');integer(state.sdUsed||0,0,state.sdTotal,'расход костей превосходства');}
    if(actor.kind==='monster'&&state.legendaryUsed!==undefined)integer(state.legendaryUsed,0,actor.snapshot.laC||0,'расход легендарных действий');
  }
  function validateScene(input){
    checkJson(input);const data=clone(input);object(data,'сцена');
    if(data.format!==FORMAT||data.version!==VERSION)fail('Неизвестный формат или версия общей сцены.');
    id(data.sceneId);text(data.name,120,'название');text(data.createdAt,40,'создано');text(data.updatedAt,40,'обновлено');
    if(!Array.isArray(data.actors)||data.actors.length>1000)fail('Неверный список участников.');
    const actors=new Map(),copyGroups=new Map();
    for(const actor of data.actors){
      object(actor,'участник');id(actor.id);if(actors.has(actor.id))fail('Повторный ID участника.');actors.set(actor.id,actor);
      if(!Object.hasOwn(NATIVE,actor.kind)||actor.nativeVersion!==NATIVE[actor.kind])fail('Неизвестный тип или версия состояния участника.');
      text(actor.name,180,'имя участника');object(actor.snapshot,'снимок карточки');object(actor.state,'состояние');object(actor.source,'источник');
      validateProfile(actor);validateCounters(actor);text(actor.source.catalog,100,'каталог');text(actor.source.id,150,'ID источника');text(actor.source.revision,150,'редакция источника');
      if(actor.initiative!==null)integer(actor.initiative,-100,200,'инициатива');
      if(actor.kind==='manual')continue;
      const group=actor.kind+':'+actor.source.catalog+':'+actor.source.id,used=copyGroups.get(group)||new Set();if(actor.copyNo===undefined){let n=1;while(used.has(n))n++;actor.copyNo=n;}integer(actor.copyNo,1,1000000,'номер копии');if(used.has(actor.copyNo))fail('Повторный номер копии источника.');used.add(actor.copyNo);copyGroups.set(group,used);
      integer(actor.maxHp,1,1000000,'максимум хитов');integer(actorHp(actor),0,actor.maxHp,'текущие хиты');
      if(actor.kind==='npc'){
        if(typeof actor.snapshot.sh!=='string'||!Number.isFinite(actor.snapshot.co?.hp))fail('Неверный снимок NPC.');
        if(!Array.isArray(actor.state.conditions)||actor.state.conditions.some(key=>!CONDITIONS.includes(key)))fail('Неизвестное состояние NPC.');
      }else{
        if(typeof actor.snapshot.nm!=='string'||!Number.isFinite(actor.snapshot.hp))fail('Неверный снимок монстра.');
        object(actor.state.conds,'состояния монстра');for(const [key,value]of Object.entries(actor.state.conds))if(!CONDITIONS.includes(key)||typeof value!=='boolean')fail('Неизвестное состояние монстра.');
        integer(actor.state.phase,1,actor.snapshot.ph2?2:1,'фаза монстра');
      }
    }
    if(!Array.isArray(data.order)||data.order.length>1000||new Set(data.order).size!==data.order.length)fail('Неверная очередь ходов.');
    for(const actorId of data.order)if(!actors.has(actorId)||actors.get(actorId).initiative===null)fail('В очереди нет участника с инициативой.');
    if(data.actors.some(actor=>actor.initiative!==null&&!data.order.includes(actor.id)))fail('Участник с инициативой отсутствует в очереди.');
    if(data.activeId!==null&&!data.order.includes(data.activeId))fail('Текущего участника нет в очереди.');
    if(data.selectedId!==null&&!actors.has(data.selectedId))fail('Выбранного участника нет в сцене.');
    integer(data.round,0,1000000,'раунд');integer(data.turnSerial,0,1000000000,'номер хода');
    if(typeof data.running!=='boolean'||(data.running&&(!data.round||!data.activeId)))fail('Неверное состояние боя.');
    if(!data.order.length&&(data.running||data.activeId!==null))fail('Пустая очередь не может вести бой.');
    if(!Array.isArray(data.log)||data.log.length>100)fail('Неверный журнал.');
    for(const item of data.log){object(item,'событие');text(item.text,2000,'событие');integer(item.round,0,1000000,'раунд события');integer(item.turn,0,1000000000,'ход события');}
    return data;
  }
  function newScene({name='Общий бой',uuid=()=>crypto.randomUUID(),now=()=>new Date().toISOString()}={}){
    const stamp=now();return validateScene({format:FORMAT,version:VERSION,sceneId:'encounter-'+uuid(),name,createdAt:stamp,updatedAt:stamp,actors:[],order:[],activeId:null,selectedId:null,round:0,running:false,turnSerial:0,log:[]});
  }
  function forkScene(scene,{name=null,uuid=()=>crypto.randomUUID(),now=()=>new Date().toISOString()}={}){
    const data=validateScene(scene),ids=new Map(data.actors.map(actor=>[actor.id,'actor-'+uuid()])),stamp=now();
    data.sceneId='encounter-'+uuid();data.name=name||data.name.slice(0,108)+' (копия)';data.createdAt=stamp;data.updatedAt=stamp;
    for(const actor of data.actors)actor.id=ids.get(actor.id);data.order=data.order.map(id=>ids.get(id));data.activeId=data.activeId?ids.get(data.activeId):null;data.selectedId=data.selectedId?ids.get(data.selectedId):null;
    return validateScene(data);
  }
  function initialState(kind,snapshot){
    if(kind==='npc')return{curHp:snapshot.co.hp,conditions:[],slots:Object.fromEntries((snapshot.slots||[]).map(slot=>[slot.lv,{total:slot.n,used:0}])),sdUsed:0,sdTotal:Number(String(snapshot.co.cr||'').match(/(\d+)к8/)?.[1]||0),saOn:false};
    if(kind==='monster')return{hp:snapshot.hp,conds:{},phase:1,roll:{},ini:null,bleach:0};
    return{};
  }
  class Encounter{
    constructor(data=newScene(),{uuid=()=>crypto.randomUUID(),now=()=>new Date().toISOString()}={}){this.data=validateScene(data);this.uuid=uuid;this.now=now;}
    snapshot(){return clone(this.data);}
    change(edit){const draft=clone(this.data),result=edit(draft);draft.updatedAt=this.now();this.data=validateScene(draft);return result;}
    actor(draft,actorId){const actor=draft.actors.find(item=>item.id===actorId);if(!actor)fail('Участник не найден.');return actor;}
    event(draft,message){draft.log.unshift({text:message,round:draft.round,turn:draft.turnSerial});draft.log=draft.log.slice(0,100);}
    sort(draft){
      const previous=draft.order.slice(),positions=new Map(previous.map((key,index)=>[key,index]));
      draft.order=draft.actors.filter(actor=>actor.initiative!==null).sort((a,b)=>b.initiative-a.initiative||(positions.get(a.id)??10000)-(positions.get(b.id)??10000)).map(actor=>actor.id);
      if(!draft.round||!draft.activeId)draft.activeId=draft.order[0]||null;
    }
    add({kind,snapshot,source={catalog:'manual',id:'',revision:''},name,state=null,maxHp=null},count=1){
      checkJson(snapshot);if(state)checkJson(state);integer(count,1,20,'число копий');if(!Object.hasOwn(NATIVE,kind))fail('Неизвестный тип участника.');
      return this.change(draft=>{
        const ids=[];const same=draft.actors.filter(actor=>actor.kind===kind&&actor.source.catalog===source.catalog&&actor.source.id===source.id),used=new Set(same.map(actor=>actor.copyNo));for(let i=0;i<count;i++){
          let copyNo=1;while(used.has(copyNo))copyNo++;used.add(copyNo);const card=clone(snapshot),actorId='actor-'+this.uuid(),label=name||(kind==='npc'?card.sh:kind==='monster'?card.nm:'Участник');
          draft.actors.push({id:actorId,kind,nativeVersion:NATIVE[kind],name:kind!=='manual'&&(count>1||same.length)?label+' #'+copyNo:label,copyNo:kind==='manual'?null:copyNo,source:clone(source),snapshot:card,state:state?clone(state):initialState(kind,card),maxHp:kind==='manual'?null:maxHp??(kind==='npc'?card.co.hp:card.hp),initiative:null});ids.push(actorId);
        }
        draft.selectedId=ids[0];this.event(draft,'Добавлено участников: '+count+'.');return ids;
      });
    }
    select(actorId){return this.change(draft=>{this.actor(draft,actorId);draft.selectedId=actorId;});}
    rename(actorId,name){text(name,180,'имя');return this.change(draft=>{this.actor(draft,actorId).name=name;});}
    adjustHp(actorId,delta){integer(delta,-1000000,1000000,'изменение хитов');return this.change(draft=>{
      const actor=this.actor(draft,actorId);if(actor.kind==='manual')fail('Для этого участника хиты не отслеживаются.');const key=actor.kind==='npc'?'curHp':'hp';actor.state[key]=Math.max(0,Math.min(actor.maxHp,actor.state[key]+delta));this.event(draft,actor.name+': хиты '+actor.state[key]+'/'+actor.maxHp+'.');
    });}
    condition(actorId,key){if(!CONDITIONS.includes(key))fail('Неизвестное состояние.');return this.change(draft=>{
      const actor=this.actor(draft,actorId);if(actor.kind==='npc'){const values=actor.state.conditions;actor.state.conditions=values.includes(key)?values.filter(item=>item!==key):[...values,key];}else if(actor.kind==='monster')actor.state.conds[key]=!actor.state.conds[key];else fail('У этого участника нет счётчиков состояний.');
    });}
    setNativeState(actorId,state,{maxHp=null}={}){checkJson(state);return this.change(draft=>{const actor=this.actor(draft,actorId);actor.state=clone(state);if(maxHp!==null)actor.maxHp=maxHp;});}
    setInitiative(actorId,value){if(value!==null)integer(value,-100,200,'инициатива');return this.change(draft=>{
      const actor=this.actor(draft,actorId);actor.initiative=value;if(value===null){const index=draft.order.indexOf(actorId);draft.order=draft.order.filter(key=>key!==actorId);if(draft.activeId===actorId)draft.activeId=draft.order[index%draft.order.length]||null;}
      this.sort(draft);if(!draft.order.length){draft.activeId=null;draft.running=false;draft.round=0;}
    });}
    start(){return this.change(draft=>{if(!draft.order.length)fail('Сначала задайте инициативу хотя бы одному участнику.');if(!draft.round)draft.round=1;draft.activeId=draft.activeId||draft.order[0];draft.selectedId=draft.activeId;draft.running=true;this.event(draft,'Бой начат / продолжен.');});}
    pause(){return this.change(draft=>{draft.running=false;this.event(draft,'Пауза.');});}
    next(){return this.change(draft=>{
      if(!draft.running)fail('Бой на паузе.');const index=draft.order.indexOf(draft.activeId),next=(index+1)%draft.order.length;if(next===0)draft.round++;draft.activeId=draft.order[next];draft.selectedId=draft.activeId;draft.turnSerial++;this.event(draft,'Ход: '+this.actor(draft,draft.activeId).name+'.');
    });}
    jump(actorId){return this.change(draft=>{if(!draft.order.includes(actorId))fail('Участника нет в очереди.');draft.activeId=actorId;draft.selectedId=actorId;draft.turnSerial++;this.event(draft,'Ручная коррекция текущего хода.');});}
    remove(actorId){return this.change(draft=>{
      this.actor(draft,actorId);const index=draft.order.indexOf(actorId);draft.actors=draft.actors.filter(actor=>actor.id!==actorId);draft.order=draft.order.filter(key=>key!==actorId);
      if(draft.activeId===actorId)draft.activeId=draft.order[index%draft.order.length]||null;if(draft.selectedId===actorId)draft.selectedId=draft.actors[0]?.id||null;
      if(!draft.order.length){draft.activeId=null;draft.running=false;draft.round=0;}this.event(draft,'Участник удалён из сцены.');
    });}
  }
  function validateBook(value){
    checkJson(value);const data=clone(value);if(data.format!==BOOK_FORMAT||data.version!==1||!Array.isArray(data.records)||data.records.length>100)fail('Неизвестный формат книги боёв.');
    const seen=new Set();for(const row of data.records){object(row,'запись боя');id(row.sceneId);if(seen.has(row.sceneId)||typeof row.revision!=='string'||!row.revision||typeof row.archived!=='boolean')fail('Неверная или повторная запись боя.');seen.add(row.sceneId);validateScene(row.scene);if(row.scene.sceneId!==row.sceneId)fail('ID боя не совпадает с документом.');}return data;
  }
  class SceneBook{
    constructor(store,{uuid=()=>crypto.randomUUID()}={}){this.store=store;this.uuid=uuid;this.snapshot=null;this.busy=false;}
    async load(){const saved=await this.store.read(FILE);this.snapshot={...saved,data:validateBook(saved.data)};return this.records();}
    records(){return this.snapshot?clone(this.snapshot.data.records):[];}
    async initialize(){try{return await this.load();}catch(error){if(error.code!=='NOT_FOUND')throw error;if(this.store.ensureBranch)await this.store.ensureBranch();this.snapshot=await this.store.write(FILE,{format:BOOK_FORMAT,version:1,records:[]},null,'Initialize WoT encounter book');return[];}}
    async save(scene,{revision=null,archived=false}={}){
      if(this.busy)throw new StoreError('BUSY','Сохранение боя уже выполняется.');if(!this.snapshot)throw new StoreError('NOT_LOADED','Сначала загрузите книгу боёв.');const current=validateScene(scene);this.busy=true;
      try{const data=clone(this.snapshot.data),old=data.records.find(row=>row.sceneId===current.sceneId);if((!old&&revision)||(old&&old.revision!==revision))throw new StoreError('CONFLICT',old?'Сохранённый бой изменился. Откройте актуальную версию или создайте копию текущего боя.':'Ранее сохранённый бой не найден. Загрузите список или создайте копию текущего боя.');const row={sceneId:current.sceneId,revision:this.uuid(),archived:!!archived,scene:current};if(old)data.records[data.records.indexOf(old)]=row;else data.records.push(row);validateBook(data);this.snapshot=await this.store.write(FILE,data,this.snapshot.sha,'Save WoT encounter '+current.sceneId);return clone(row);}finally{this.busy=false;}
    }
  }
  return{FORMAT,VERSION,BOOK_FORMAT,FILE,NATIVE,CONDITIONS,validateScene,newScene,forkScene,Encounter,actorHp,actorConditions,validateBook,SceneBook};
});
