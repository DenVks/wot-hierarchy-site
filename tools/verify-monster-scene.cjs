'use strict';
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'..'),html=fs.readFileSync(path.join(root,'monsters-battle.html'),'utf8');
const source=[...html.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/g)].map(m=>m[1]).find(s=>s.includes('function createClones('));
const KEY='wot.monsterScene.v1',BACKUP='wot.monsterScene.backup.v1';
function harness(initial={}){
 const nodes=new Map(),storage=new Map(Object.entries(initial));let writesFail=false;
 const el=id=>{if(!nodes.has(id))nodes.set(id,{value:'',hidden:true,style:{},innerHTML:'',textContent:'',classList:{add(){},remove(){}},focus(){},click(){}});return nodes.get(id);};
 const ctx={window:{},enhanceCombatControls(){},setCombatMobileTitle(){},closeCombatCatalog(){},rememberCombatModalFocus(){},restoreCombatModalFocus(){},console,Date,URLSearchParams,setTimeout:()=>1,clearTimeout(){},location:{search:''},localStorage:{getItem:k=>storage.get(k)??null,setItem:(k,v)=>{if(writesFail)throw Error('quota');storage.set(k,String(v));}},document:{getElementById:el,addEventListener(){},querySelectorAll:()=>[],createElement:()=>el('download')}};
 vm.createContext(ctx);for(const f of ['bestiary-data.js','monster-packs-data.js','anomaly-backgrounds-data.js','monster-scene.js','monster-scene-ui.js'])vm.runInContext(fs.readFileSync(path.join(root,'assets',f),'utf8'),ctx,{filename:f});
 vm.runInContext(source.split('// Initialize scene')[0]+`buildSidebar=()=>{};window.test={MS,CLONES,STATE,INITIATIVE,ensureMmMonsterLoaded,createClones,removeClone,selectMon,applyHp,toggleCond,upsertInitiative,addManualInitiative,removeFromInitiative,startMonsterCombat,nextTurn,iniJump,clearInitiative,initializeMonsterScene,renderFull,captureMonsterScene,validateMonsterScene,prepareMonsterSceneImport,confirmMonsterSceneImport,cancelMonsterSceneImport,saveMonsterScene,saveMonsterRoll,confirmNewMonsterScene,previewMonsterSceneBackup,applyAnomalyBackgroundToCurrent,setAnomalyBackground,meta:()=>({round:sceneRound,running:sceneRunning,index:turnIndex,serial:sceneTurnSerial,pending:!!pendingScene,error:pendingSceneError,warning:sceneWarning,blocked:sceneStorageBlocked}),current:()=>cur};`,ctx);
 const a=ctx.window.test;a.initializeMonsterScene();a.renderFull();return {a,el,storage,ctx,failWrites(){writesFail=true;}};
}
let count=0;function test(name,fn){fn();count++;console.log('PASS '+name);}
function battle(h){const copies=h.a.createClones(h.a.MS[0],3);copies.forEach((c,i)=>h.a.upsertInitiative(c,20-i));h.a.startMonsterCombat();return copies;}
test('Three rounds and current actor survive a reload',()=>{
 const h=harness(),copies=battle(h);for(let i=0;i<6;i++)h.a.nextTurn();assert.equal(h.a.meta().round,3);assert.equal(h.a.INITIATIVE[h.a.meta().index].id,copies[0].id);
 const re=harness(Object.fromEntries(h.storage));assert.equal(re.a.meta().round,3);assert.equal(re.a.meta().running,true);assert.equal(re.a.current().id,copies[0].id);assert.equal(re.a.meta().serial,h.a.meta().serial);
});
test('Separate HP, conditions, rolls, phase and background marks survive',()=>{
 const h=harness(),c=battle(h);h.a.selectMon(c[2].id);h.el('hp-modal-val').value='10';h.a.applyHp(-1);h.a.toggleCond('prone');h.a.saveMonsterRoll(1,'Урон 13 · [4+5]+4');h.a.STATE[c[2].id].bleach=2;h.a.renderFull();
 const re=harness(Object.fromEntries(h.storage));assert.equal(re.a.STATE[c[2].id].hp,95);assert.equal(re.a.STATE[c[2].id].conds.prone,true);assert.equal(re.a.STATE[c[2].id].bleach,2);assert.equal(re.a.STATE[c[2].id].roll[1].text,'Урон 13 · [4+5]+4');assert.equal(re.a.STATE[c[0].id].hp,105);assert.equal(re.a.current().id,c[2].id);
 const boss=h.a.MS.find(m=>m.ph2);h.a.selectMon(boss.id);h.a.STATE[String(boss.id)].phase=2;h.a.renderFull();assert.equal(harness(Object.fromEntries(h.storage)).a.STATE[String(boss.id)].phase,2);
});
test('Background profile and trait edits survive export/import into another context',()=>{
 const h=harness();const c=h.a.createClones(h.a.MS[0],1)[0];h.a.selectMon(c.id);const bg=h.ctx.window.ANOMALY_BACKGROUNDS.find(x=>x.spawnTemplate?.trait);assert.ok(bg);h.el('anomaly-bg-select').value=bg.id;h.a.setAnomalyBackground();h.a.applyAnomalyBackgroundToCurrent();
 const snapshot=h.a.captureMonsterScene(),target=harness();assert.equal(target.a.prepareMonsterSceneImport(JSON.stringify(snapshot)),true);assert.equal(target.a.CLONES.length,0,'Preview must not mutate participants');target.a.confirmMonsterSceneImport();assert.equal(target.a.CLONES.length,1);assert.equal(target.a.current().res,h.a.current().res);assert.ok(target.a.current().tr.some(x=>x.n===bg.spawnTemplate.trait.name));assert.equal(target.a.captureMonsterScene().backgroundId,bg.id);
});
test('Removing an earlier participant keeps the active actor; removing active moves forward',()=>{
 const h=harness(),c=battle(h);h.a.nextTurn();h.a.removeFromInitiative(c[0].id);assert.equal(h.a.INITIATIVE[h.a.meta().index].id,c[1].id);h.a.removeClone(c[1].id);assert.equal(h.a.INITIATIVE[h.a.meta().index].id,c[2].id);assert.equal(h.a.current().id,c[2].id);h.a.removeClone(c[2].id);assert.equal(h.a.meta().running,false);assert.equal(h.a.meta().index,0);
});
test('Sorting initiative during combat preserves actor; dead participants are not silently removed',()=>{
 const h=harness(),c=battle(h);h.a.nextTurn();h.a.upsertInitiative(c[2],99);assert.equal(h.a.INITIATIVE[h.a.meta().index].id,c[1].id);h.a.selectMon(c[1].id);h.el('hp-modal-val').value='999';h.a.applyHp(-1);assert.equal(h.a.STATE[c[1].id].hp,0);assert.ok(h.a.INITIATIVE.some(x=>x.id===c[1].id));h.a.nextTurn();assert.equal(h.a.meta().round,2);
});
test('Pause does not advance time, and resume does not reset round',()=>{
 const h=harness(),c=battle(h);h.a.nextTurn();h.a.startMonsterCombat();const active=h.a.INITIATIVE[h.a.meta().index].id;h.a.upsertInitiative(c[2],99);assert.equal(h.a.INITIATIVE[h.a.meta().index].id,active);const m=h.a.meta();h.a.nextTurn();assert.equal(h.a.meta().index,m.index);assert.equal(h.a.meta().serial,m.serial);h.a.startMonsterCombat();assert.equal(h.a.meta().round,m.round);
});
test('Import validates before replacement; backup can restore the previous scene',()=>{
 const old=harness(),oldCopies=battle(old);const oldId=old.a.captureMonsterScene().sceneId;const other=harness();other.a.createClones(other.a.MS[1],2);const imported=other.a.captureMonsterScene();
 assert.equal(old.a.prepareMonsterSceneImport(JSON.stringify(imported)),true);assert.equal(old.a.CLONES.length,3);old.a.cancelMonsterSceneImport();assert.equal(old.a.captureMonsterScene().sceneId,oldId);
 old.a.prepareMonsterSceneImport(JSON.stringify(imported));old.a.confirmMonsterSceneImport();assert.equal(old.a.CLONES.length,2);assert.ok(old.storage.has(BACKUP));old.a.previewMonsterSceneBackup();assert.equal(old.a.meta().pending,true);old.a.confirmMonsterSceneImport();assert.equal(old.a.captureMonsterScene().sceneId,oldId);assert.equal(old.a.CLONES[0].id,oldCopies[0].id);
});
test('Invalid JSON, future schema, missing template, duplicate IDs and out-of-range values are rejected atomically',()=>{
 const h=harness();battle(h);const initial=h.a.captureMonsterScene();const variants=['{'];
 for(const edit of [d=>d.version=2,d=>d.dataset='future',d=>d.creatures[0].templateId='unknown',d=>d.creatures.push(d.creatures[0]),d=>d.creatures[0].state.hp=-1,d=>d.turnIndex=100,d=>d.nextCloneId=1,d=>d.creatures[0].state.conds.newRule=true,d=>d.creatures.find(c=>c.cloneNo!==null).cloneNo=0]){const d=JSON.parse(JSON.stringify(initial));edit(d);variants.push(JSON.stringify(d));}
 for(const raw of variants){assert.equal(h.a.prepareMonsterSceneImport(raw),false);assert.equal(h.a.captureMonsterScene().sceneId,initial.sceneId);assert.equal(h.a.CLONES.length,3);}
});
test('Manual participant names render as text; injected identifier/prototype keys are rejected',()=>{
 const h=harness();battle(h);h.el('ini-manual-name').value='<img src=x onerror=alert(1)>';h.el('ini-manual-val').value='30';h.a.addManualInitiative();assert.ok(h.el('mn').innerHTML.includes('&lt;img'));assert.ok(!h.el('mn').innerHTML.includes('<img src=x'));
 const raw=JSON.stringify(h.a.captureMonsterScene()).replace('"name":','"__proto__":{"x":1},"name":');assert.equal(h.a.prepareMonsterSceneImport(raw),false);
});
test('Corrupted storage is retained, quota errors are visible, failed backup aborts replacement',()=>{
 const broken=harness({[KEY]:'broken'});assert.equal(broken.storage.get(KEY),'broken');assert.equal(broken.a.meta().blocked,true);
 const h=harness();battle(h);const id=h.a.captureMonsterScene().sceneId;h.failWrites();h.a.nextTurn();assert.match(h.a.meta().warning,/Не удалось сохранить/);h.a.confirmNewMonsterScene();assert.equal(h.a.captureMonsterScene().sceneId,id);
});
test('New scene backs up all state; clone IDs remain unique across reload and subsequent additions',()=>{
 const h=harness(),c=battle(h);h.a.removeClone(c[2].id);const re=harness(Object.fromEntries(h.storage));const copy=re.a.createClones(re.a.MS[0],1)[0];assert.notEqual(copy.id,c[2].id);re.a.confirmNewMonsterScene();assert.equal(re.a.CLONES.length,0);assert.equal(re.a.INITIATIVE.length,0);assert.equal(re.a.meta().round,0);assert.ok(re.storage.has(BACKUP));
});
test('Backup captures the live scene, not an older stored snapshot',()=>{
 const h=harness(),c=battle(h);h.a.STATE[c[0].id].hp=17;h.a.confirmNewMonsterScene();const backup=JSON.parse(h.storage.get(BACKUP));assert.equal(backup.creatures.find(x=>x.id===c[0].id).state.hp,17);
 const broken=harness({[KEY]:'broken'});broken.a.confirmNewMonsterScene();assert.ok([...broken.storage].some(([k,v])=>k.startsWith(KEY+'.unreadable.')&&v==='broken'));
});
test('MM templates resolve by catalog reference across independent contexts',()=>{
 const h=harness();for(const f of ['mm-monsters-data.js','mm-bestiary-adapter.js'])vm.runInContext(fs.readFileSync(path.join(root,'assets',f),'utf8'),h.ctx);
 const fixture=h.ctx.window.MM_ADAPTER.buildBattleMonsters().find(m=>m.hp>0&&Array.isArray(m.at));assert.ok(fixture,'MM fixture required');
 const base=h.a.ensureMmMonsterLoaded(fixture.id);assert.ok(base);const c=h.a.createClones(base,1)[0];h.a.upsertInitiative(c,15);h.a.startMonsterCombat();
 const data=JSON.stringify(h.a.captureMonsterScene()),target=harness();for(const f of ['mm-monsters-data.js','mm-bestiary-adapter.js'])vm.runInContext(fs.readFileSync(path.join(root,'assets',f),'utf8'),target.ctx);
 assert.equal(target.a.prepareMonsterSceneImport(data),true);target.a.confirmMonsterSceneImport();assert.equal(target.a.current().baseId,base.id);assert.equal(target.a.STATE[c.id].hp,base.hp);
});
console.log(`${count} scene scenario groups passed.`);
