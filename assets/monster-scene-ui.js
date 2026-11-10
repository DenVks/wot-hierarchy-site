/* Local scene storage and UI. Gameplay statblocks remain in the installed catalog. */
const MONSTER_SCENE_KEY='wot.monsterScene.v1',MONSTER_SCENE_BACKUP='wot.monsterScene.backup.v1';
const sceneTemplates=new Map();
let sceneId='scene-'+Date.now()+'-'+Math.random().toString(36).slice(2),sceneName='Бой монстров';
let sceneRound=0,sceneRunning=false,sceneTurnSerial=0,sceneLog=[];
let sceneWarning='',sceneNotice='',sceneStorageBlocked=false,sceneLastFingerprint='',sceneSavedAt='';
let pendingScene=null,pendingSceneError='',sceneImportRead=0;
function sceneCopy(value){return JSON.parse(JSON.stringify(value));}
function registerSceneTemplate(m){if(!sceneTemplates.has(String(m.id)))sceneTemplates.set(String(m.id),sceneCopy(m));}
function resolveSceneTemplate(id){
 if(sceneTemplates.has(String(id)))return sceneCopy(sceneTemplates.get(String(id)));
 const match=/^mm-(\d+)$/.exec(String(id));
 if(match&&window.MM_ADAPTER){const m=window.MM_ADAPTER.buildBattleMonsters()[Number(match[1])];if(m&&String(m.id)===String(id))return sceneCopy(m);}
 return null;
}
function sceneBackgrounds(){return window.ANOMALY_BACKGROUNDS||[];}
function recordCreature(m){
 const sources={};for(const k of ['res','vul','idmg','ics'])sources[k]=sceneCopy(m._profileSources?.[k]||{});
 const traits=sceneBackgrounds().filter(bg=>{const t=bg.spawnTemplate?.trait;return t&&(m.tr||[]).some(x=>x.n===t.name&&x.d===t.text);}).map(bg=>bg.id);
 return {id:String(m.id),templateId:String(m.isClone?m.baseId:m.id),cloneNo:m.isClone?m.cloneNo:null,profile:Object.fromEntries(['res','vul','idmg','ics'].map(k=>[k,String(m[k]||'')])),sources,traits,state:sceneCopy(STATE[keyOf(m)])};
}
function captureMonsterScene(){return {format:window.WOT_MONSTER_SCENE.FORMAT,version:1,dataset:window.WOT_MONSTER_SCENE.DATASET,sceneId,name:sceneName,savedAt:sceneSavedAt||new Date().toISOString(),creatures:allMonsters().map(recordCreature),initiative:sceneCopy(INITIATIVE),turnIndex,round:sceneRound,running:sceneRunning,turnSerial:sceneTurnSerial,nextCloneId:cloneSeq,selectedId:cur?keyOf(cur):null,tab,backgroundId:activeAnomalyBackgroundId,backgroundExpanded:anomalyBgExpanded,log:sceneCopy(sceneLog)};}
function validateMonsterScene(data){return window.WOT_MONSTER_SCENE.validate(data,resolveSceneTemplate,sceneBackgrounds().map(b=>b.id));}
function sceneEvent(text){sceneLog.unshift({time:`Раунд ${sceneRound||'—'} · ход ${sceneTurnSerial}`,text});sceneLog=sceneLog.slice(0,100);}
function saveMonsterScene(force=false){
 if(sceneStorageBlocked&&!force)return;
 try{
  const snapshot=validateMonsterScene(captureMonsterScene());const stable={...snapshot,savedAt:''};const fingerprint=JSON.stringify(stable);
  if(!force&&fingerprint===sceneLastFingerprint)return;
  snapshot.savedAt=new Date().toISOString();localStorage.setItem(MONSTER_SCENE_KEY,JSON.stringify(snapshot));
  sceneSavedAt=snapshot.savedAt;sceneLastFingerprint=fingerprint;sceneWarning='';sceneStorageBlocked=false;
 }catch(error){sceneWarning='Не удалось сохранить сцену: '+error.message+'. Изменения остаются в текущем окне; экспортируйте файл, если он доступен.';}
}
function reconstructScene(data){
 return data.creatures.map(row=>{
  const m=resolveSceneTemplate(row.templateId);if(!m)throw Error('Нет статблока '+row.templateId);
  Object.assign(m,row.profile);m._profileSources=sceneCopy(row.sources);
  for(const bgId of row.traits){const t=sceneBackgrounds().find(b=>b.id===bgId)?.spawnTemplate?.trait;if(t&&!m.tr.some(x=>x.n===t.name&&x.d===t.text))m.tr.push({n:t.name,d:t.text,hi:true});}
  if(row.id!==row.templateId){m.id=row.id;m.baseId=resolveSceneTemplate(row.templateId).id;m.cloneNo=row.cloneNo;m.isClone=true;m.nm=`${m.nm} #${row.cloneNo}`;}
  return {m,state:sceneCopy(row.state)};
 });
}
function applyMonsterScene(data){
 // Prepare every entity before mutating the live scene.
 const prepared=reconstructScene(data);
 for(const entry of prepared)registerSceneTemplate(resolveSceneTemplate(String(entry.m.isClone?entry.m.baseId:entry.m.id)));
 MS.splice(0,MS.length,...Array.from(sceneTemplates.values()).map(sceneCopy));CLONES.splice(0,CLONES.length);
 for(const key of Object.keys(STATE))delete STATE[key];MS.forEach(m=>STATE[keyOf(m)]=makeState(m));
 for(const {m,state} of prepared){if(m.isClone)CLONES.push(m);else{const i=MS.findIndex(x=>String(x.id)===String(m.id));if(i>=0)MS[i]=m;else MS.push(m);}STATE[keyOf(m)]=state;}
 INITIATIVE.splice(0,INITIATIVE.length,...data.initiative.map(item=>{const m=getMon(item.id);return item.manual?item:{...item,name:m.nm,z:m.z};}));
 sceneId=data.sceneId;sceneName=data.name;sceneRound=data.round;sceneRunning=data.running;sceneTurnSerial=data.turnSerial;
 sceneLog=sceneCopy(data.log);cloneSeq=data.nextCloneId;turnIndex=data.turnIndex;cur=data.selectedId?getMon(data.selectedId):null;tab=data.tab;
 activeAnomalyBackgroundId=data.backgroundId;anomalyBgExpanded=data.backgroundExpanded;cloneNotice='';sceneSavedAt=data.savedAt;sceneLastFingerprint='';
}
function initializeMonsterScene(){
 MS.forEach(registerSceneTemplate);
 try{const raw=localStorage.getItem(MONSTER_SCENE_KEY);if(raw!==null){applyMonsterScene(validateMonsterScene(JSON.parse(raw)));sceneNotice='Сцена восстановлена из браузера.';return true;}}
 catch(error){sceneWarning='Сохранение не прочитано: '+error.message+'. Исходные данные не перезаписаны. Можно экспортировать текущую сцену или восстановить резервную копию.';sceneStorageBlocked=true;}
 return false;
}
function backupMonsterScene(){
 try{const raw=localStorage.getItem(MONSTER_SCENE_KEY);if(sceneStorageBlocked&&raw!==null)localStorage.setItem(MONSTER_SCENE_KEY+'.unreadable.'+Date.now(),raw);localStorage.setItem(MONSTER_SCENE_BACKUP,JSON.stringify(captureMonsterScene()));return true;}
 catch(error){sceneWarning='Не удалось создать резервную копию. Текущая сцена не заменена.';return false;}
}
function activeSceneActor(){return INITIATIVE[turnIndex]||null;}
function selectSceneActor(){const a=activeSceneActor();if(a&&!a.manual)cur=getMon(a.id);}
function startMonsterCombat(){
 if(!INITIATIVE.length)return;
 sceneRunning=!sceneRunning;if(sceneRunning){sceneRound=Math.max(1,sceneRound);sceneTurnSerial=Math.max(1,sceneTurnSerial);selectSceneActor();sceneEvent('Бой начат/продолжен. Начало хода: '+activeSceneActor().name+'. Разрешите эффекты начала хода.');}
 else sceneEvent('Бой приостановлен.');buildSidebar();renderFull();
}
function setMonsterSceneName(value){sceneName=String(value||'Бой монстров').slice(0,120);saveMonsterScene();}
function renderMonsterScenePanel(){
 const actor=activeSceneActor();
 const preview=pendingScene?`<div class="scene-import-preview"><b>Просмотр файла: ${escHtml(pendingScene.name)}</b><p>Копий: ${pendingScene.creatures.filter(c=>c.cloneNo!==null).length}; в очереди: ${pendingScene.initiative.length}; раунд: ${pendingScene.round}. Текущая сцена будет заменена с резервной копией.</p><button onclick="confirmMonsterSceneImport()">Заменить текущую сцену</button><button onclick="cancelMonsterSceneImport()">Отмена импорта</button></div>`:'';
 return `<section class="scene-panel" aria-label="Сцена боя"><div class="scene-controls"><label>Сцена <input id="monster-scene-name" maxlength="120" value="${escAttr(sceneName)}" oninput="setMonsterSceneName(this.value)"/></label><strong id="scene-round">${sceneRound?'Раунд '+sceneRound:'До боя'}</strong><span id="scene-actor">${actor?'Ход: '+escHtml(actor.name):'Очередь пуста'}${sceneRunning?'':' · пауза'}</span><button onclick="startMonsterCombat()" ${INITIATIVE.length?'':'disabled'}>${sceneRunning?'Пауза':sceneRound?'Продолжить бой':'Начать бой'}</button><button onclick="nextTurn()" ${sceneRunning?'':'disabled'}>Следующий ход</button><details class="scene-transfer"><summary>Сохранение и перенос</summary><div class="scene-controls"><button onclick="exportMonsterScene()">Экспорт сцены</button><label class="scene-file">Импорт файла <input id="monster-scene-file" type="file" accept=".json,application/json" onchange="readMonsterSceneFile(this.files[0])"/></label><button onclick="previewMonsterSceneBackup()">Резервная копия</button><button onclick="requestNewMonsterScene()">Новая сцена</button></div></details></div><p id="scene-storage-status" role="status">${escHtml(sceneWarning||sceneNotice||(sceneSavedAt?'Сохранено в этом браузере.':'Сцена ещё не сохранена.'))}</p>${pendingSceneError?`<p role="alert">${escHtml(pendingSceneError)}</p>`:''}${preview}<div id="scene-reset-confirm" hidden><p>Начать новую сцену? Текущая останется в резервной копии.</p><button onclick="confirmNewMonsterScene()">Подтвердить новую сцену</button><button onclick="document.getElementById('scene-reset-confirm').hidden=true">Отмена</button></div><details><summary>Журнал сцены</summary>${sceneLog.length?sceneLog.map(e=>`<p><small>${escHtml(e.time)}</small> ${escHtml(e.text)}</p>`).join(''):'<p>Событий пока нет.</p>'}</details></section>`;
}
function exportMonsterScene(){
 try{const data=validateMonsterScene(captureMonsterScene()),blob=new Blob([JSON.stringify(data,null,2)],{type:'application/json'}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download='wot-monster-scene-'+sceneId+'.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);sceneNotice='Файл сцены подготовлен для скачивания.';renderFull();}
 catch(error){sceneWarning='Экспорт не выполнен: '+error.message;renderFull();}
}
function prepareMonsterSceneImport(text){
 pendingScene=null;pendingSceneError='';try{if(text.length>4*1024*1024)throw Error('Файл больше 4 МБ');pendingScene=validateMonsterScene(JSON.parse(text));}
 catch(error){pendingSceneError='Файл не принят: '+error.message;}renderFull();return Boolean(pendingScene);
}
async function readMonsterSceneFile(file){
 if(!file)return;const read=++sceneImportRead;pendingScene=null;pendingSceneError='';
 if(file.size>4*1024*1024){pendingSceneError='Файл больше 4 МБ';renderFull();return;}
 try{const text=await file.text();if(read===sceneImportRead)prepareMonsterSceneImport(text);}
 catch(error){if(read===sceneImportRead){pendingSceneError='Не удалось прочитать файл.';renderFull();}}
}
function confirmMonsterSceneImport(){
 if(!pendingScene)return;
 const data=pendingScene;try{reconstructScene(data);}catch(error){pendingSceneError=error.message;return renderFull();}
 if(!backupMonsterScene())return renderFull();
 applyMonsterScene(data);pendingScene=null;pendingSceneError='';sceneStorageBlocked=false;sceneNotice='Сцена загружена. Прежняя сохранена в резервной копии.';sceneEvent('Сцена импортирована/восстановлена из файла.');buildSidebar();renderFull();
}
function cancelMonsterSceneImport(){pendingScene=null;pendingSceneError='';renderFull();}
function previewMonsterSceneBackup(){try{const raw=localStorage.getItem(MONSTER_SCENE_BACKUP);if(!raw)throw Error('Резервной копии пока нет');prepareMonsterSceneImport(raw);}catch(error){pendingSceneError=error.message;renderFull();}}
function requestNewMonsterScene(){document.getElementById('scene-reset-confirm').hidden=false;}
function confirmNewMonsterScene(){
 if(!backupMonsterScene())return renderFull();
 MS.splice(0,MS.length,...Array.from(sceneTemplates.values()).map(sceneCopy));CLONES.splice(0,CLONES.length);INITIATIVE.splice(0,INITIATIVE.length);for(const k of Object.keys(STATE))delete STATE[k];MS.forEach(m=>STATE[keyOf(m)]=makeState(m));
 cloneSeq=1;cloneNotice='';cur=MS[0]||null;tab='combat';turnIndex=0;sceneRound=0;sceneRunning=false;sceneTurnSerial=0;sceneLog=[];sceneId='scene-'+Date.now()+'-'+Math.random().toString(36).slice(2);sceneName='Бой монстров';activeAnomalyBackgroundId='';anomalyBgExpanded=false;pendingScene=null;pendingSceneError='';sceneStorageBlocked=false;sceneNotice='Создана новая сцена; прежняя — в резервной копии.';buildSidebar();renderFull();
}
function saveMonsterRoll(index,text){if(!cur)return;STATE[keyOf(cur)].roll[index]={text};sceneEvent(cur.nm+': '+text);saveMonsterScene();}
function renderMonsterRoll(value){return value?`<span class="r-label">${escHtml(value.text)}</span>`:'';}
