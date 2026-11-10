'use strict';
// Regression checks against the shipped console, isolated from the user's browser storage.
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const root=path.resolve(__dirname,'..');
const html=fs.readFileSync(path.join(root,'anomaly-dm.html'),'utf8');
const htmlIds=new Set([...html.matchAll(/id="([^"]+)"/g)].map(x=>x[1]));
const KEY='wot.anomalyDmToolkit.v179', OLD='wot.anomalyDmToolkit.v148';
function harness(initial={}){
  const elements=new Map(),handlers={},storage=new Map(Object.entries(initial));
  const element=id=>{
    assert.ok(htmlIds.has(id.slice(1)),'Missing HTML control: '+id);
    if(!elements.has(id))elements.set(id,{value:'',checked:true,disabled:false,hidden:true,dataset:{},innerHTML:'',textContent:'',listeners:{},classList:{add(){},remove(){}},closest(){return this},addEventListener(name,fn){this.listeners[name]=fn;},click(){this.listeners.click?.();}});
    return elements.get(id);
  };
  let rolls=[],fallback=.5, failWrite=false;
  const sandbox={window:{},console,Date,Math:Object.assign(Object.create(Math),{random:()=>rolls.length?rolls.shift():fallback}),setTimeout:()=>1,clearTimeout(){},localStorage:{getItem:k=>storage.get(k)??null,setItem:(k,v)=>{if(failWrite)throw Error('quota');storage.set(k,v)}},document:{querySelector:element,querySelectorAll:()=>[],addEventListener:(name,fn)=>handlers[name]=fn}};
  vm.createContext(sandbox);
  const source=fs.readFileSync(path.join(root,'assets/anomaly-dm.js'),'utf8').replace('  initOptions();enforceChannel();render();',`  window.test={get:()=>state,reset:()=>{state=freshState();render()},normalize,render,installPyramid,operatorTurnEnd,additionalOperatorTurn,nextRound,setPhase,finalSave,rollLoot,finishOperation,damagePyramid,enforceChannel,matchingMonsters};initOptions();enforceChannel();render();`);
  vm.runInContext(source,sandbox);
  const api=sandbox.window.test;
  assert.ok(api,'Test hook insertion failed');
  return {a:api,el:element,storage,random(v){fallback=v},rolls(v){rolls=v},failWrites(){failWrite=true},change(id,value){const target=element('#'+id);target.id=id;if(typeof value==='boolean')target.checked=value;else target.value=value;target.closest=()=>null;handlers.change({target});},click(id){element('#'+id).click()}};
}
let passed=0;
function test(name,fn){fn();passed++;console.log('PASS '+name)}
test('All ranks install without a search; formula minimum and cost text',()=>{
 for(let rank=1;rank<=6;rank++)for(const rating of [1,5,10]){
  const h=harness();h.a.get().rank=rank;h.a.get().rating=rating;h.random(0);h.a.render();
  assert.equal(h.el('#installPyramid').disabled,false);h.a.installPyramid();
  assert.equal(h.a.get().extractionRemaining,Math.max(1,1+rating-rank));
  assert.match(h.el('#summonRule').textContent,rank<=2?/^Действие:/ : /^Бонусное действие:/);
 }
});
test('Installation requires proximity and a capable operator',()=>{
 for(const flag of ['operatorAtNode','operatorConscious','operatorCapable','operatorPlane','operatorRange']){
  const h=harness();h.change(flag,false);h.a.installPyramid();assert.equal(h.a.get().channelActive,false);
 }
});
test('Each lost channel condition breaks immediately, without generic rest; restoring it does not resume',()=>{
 for(const flag of ['operatorConscious','operatorCapable','operatorPlane','operatorRange']){
  const h=harness();h.a.installPyramid();const pulse=h.a.get().pulseIn;h.change(flag,false);
  assert.equal(h.a.get().channelActive,false);assert.equal(h.a.get().shortRestRequired,false);
  assert.equal(h.a.get().pulseIn,pulse,'Outburst must not reset a scheduled pulse');
  assert.ok(h.a.get().alerts.some(x=>x.title==='Сильный выброс'));
  h.change(flag,true);assert.equal(h.a.get().channelActive,false);h.a.installPyramid();assert.equal(h.a.get().channelActive,true);
 }
});
test('One count per operator turn, including phase changes and both button locations',()=>{
 const h=harness();h.a.installPyramid();const before=h.a.get().extractionRemaining;
 h.a.operatorTurnEnd();h.a.setPhase('after');h.a.operatorTurnEnd();
 assert.equal(h.a.get().extractionRemaining,before-1);assert.equal(h.el('#footerOperatorTurn').disabled,true);
 h.a.nextRound();assert.equal(h.a.get().extractionRemaining,before-1);h.a.operatorTurnEnd();assert.equal(h.a.get().extractionRemaining,before-2);
});
test('A genuine additional turn can be explicitly recorded',()=>{
 const h=harness();h.a.installPyramid();h.a.operatorTurnEnd();const before=h.a.get().extractionRemaining;
 h.a.additionalOperatorTurn();h.a.operatorTurnEnd();h.a.operatorTurnEnd();assert.equal(h.a.get().extractionRemaining,before-1);
});
test('Reload preserves the processed turn and remaining time',()=>{
 const h=harness();h.a.installPyramid();h.a.operatorTurnEnd();const before=h.a.get().extractionRemaining;
 const loaded=harness(Object.fromEntries(h.storage));loaded.a.operatorTurnEnd();assert.equal(loaded.a.get().extractionRemaining,before);
});
function ready(h){h.a.installPyramid();h.a.get().extractionRemaining=1;h.a.operatorTurnEnd();}
test('Final failure table boundaries 01/10/11/25/26/100',()=>{
 for(const percentile of [1,10,11,25,26,100]){
  const h=harness();ready(h);h.a.get().operatorBonus=-100;h.rolls([0,(percentile-1)/100,0]);h.a.finalSave();
  if(percentile<=10){assert.equal(h.a.get().channelActive,false);assert.equal(h.a.get().shortRestRequired,true);h.a.installPyramid();assert.equal(h.a.get().channelActive,false);h.click('shortRest');h.a.installPyramid();assert.equal(h.a.get().channelActive,true);}
  else{assert.equal(h.a.get().channelActive,true);assert.equal(h.a.get().extractionRemaining,1);assert.equal(h.a.get().marked,percentile<=25);h.a.operatorTurnEnd();assert.equal(h.a.get().extractionRemaining,1);}
 }
});
test('A Mark is consumed by the next final or external hierarchy save',()=>{
 const h=harness();ready(h);h.a.get().marked=true;h.a.get().operatorBonus=30;h.rolls([.95,0]);h.a.finalSave();assert.equal(h.a.get().marked,false);
 const x=harness();x.a.get().marked=true;x.click('consumeMark');assert.equal(x.a.get().marked,false);
});
test('Destroyed empty/active/charged pyramids have different consequences and cannot heal by input',()=>{
 for(const mode of ['empty','active','charged']){
  const h=harness();if(mode!=='empty')h.a.installPyramid();
  if(mode==='charged'){h.a.get().extractionRemaining=1;h.a.operatorTurnEnd();h.a.get().operatorBonus=30;h.a.finalSave();}
  h.el('#pyramidHp').value='0';h.click('applyPyramidHp');assert.equal(h.a.get().pyramidStatus,'destroyed');assert.equal(h.a.get().charged,false);assert.equal(h.a.get().channelActive,false);
  const titles=h.a.get().alerts.map(x=>x.title);assert.equal(titles.includes('Взрыв Пирамидки'),mode==='charged');assert.equal(titles.includes('Сильный выброс'),mode==='active');
  h.a.damagePyramid(80);h.a.installPyramid();assert.equal(h.a.get().pyramidHp,0);
  h.click('shortRest');assert.equal(h.a.get().pyramidStatus,'destroyed');
  h.click('workshopReplacement');assert.equal(h.a.get().pyramidStatus,'empty');assert.equal(h.a.get().pyramidHp,80);
 }
});
test('Damage is not healed by retrying extraction or changing rank after scene start',()=>{
 const h=harness();h.a.damagePyramid(30);h.a.installPyramid();h.change('operatorRange',false);h.change('operatorRange',true);h.a.installPyramid();assert.equal(h.a.get().pyramidHp,30);h.change('rankSelect','6');assert.equal(h.a.get().rank,3);assert.equal(h.a.get().pyramidHp,30);
});
test('Viewing phases has no combat, timer or reward side effects',()=>{
 const h=harness();h.a.setPhase('hold');assert.equal(h.a.get().round,0);assert.equal(h.a.get().combat,false);h.a.setPhase('after');h.a.rollLoot();assert.equal(h.a.get().lootRolled,false);
});
test('Successful operation is terminal and reward survives reload without reroll',()=>{
 const h=harness();ready(h);h.a.get().operatorBonus=30;h.a.finalSave();h.a.rollLoot();const result=JSON.stringify(h.a.get().lootResult);
 h.a.nextRound();h.a.installPyramid();h.a.setPhase('hold');h.a.finalSave();h.change('ratingSelect','10');h.a.rollLoot();
 assert.equal(h.a.get().outcome,'collapsed');assert.equal(h.a.get().combat,false);assert.equal(h.a.get().rating,5);assert.equal(JSON.stringify(h.a.get().lootResult),result);
 const loaded=harness(Object.fromEntries(h.storage));loaded.a.rollLoot();assert.equal(JSON.stringify(loaded.a.get().lootResult),result);assert.ok(loaded.el('#lootResult').innerHTML.includes('к100'));
});
test('Natural fading allows one base reward; departure does not',()=>{
 for(const outcome of ['faded','departed']){const h=harness();h.el('#operationOutcome').value=outcome;h.a.finishOperation();h.a.rollLoot();assert.equal(h.a.get().lootRolled,outcome==='faded');if(outcome==='faded')assert.equal(h.a.get().lootResult.chance,65);h.a.nextRound();assert.equal(h.a.get().combat,false);}
});
test('Legacy migration retains source and blocks uncertain already-counted turns',()=>{
 const old={version:148,rating:5,rank:3,round:2,combat:true,channelActive:true,pyramidInstalled:true,pyramidHp:30,extractionRemaining:7,extractionTotal:10,party:[],enemies:[],log:[],alerts:[]};
 const raw=JSON.stringify(old),h=harness({[OLD]:raw});assert.equal(h.storage.get(OLD),raw);assert.equal(h.a.get().version,179);h.a.operatorTurnEnd();assert.equal(h.a.get().extractionRemaining,7);assert.equal(h.a.get().pyramidHp,30);
});
test('Unreadable save is never silently overwritten; failed writes are visible',()=>{
 const h=harness({[KEY]:'broken'});h.a.render();assert.equal(h.storage.get(KEY),'broken');assert.ok(h.el('#storageStatus').textContent);
 const x=harness();x.failWrites();x.a.render();assert.match(x.el('#storageStatus').textContent,/Не удалось сохранить/);
});
test('New operation needs confirmation and retains a backup; cancel preserves state',()=>{
 const h=harness();h.a.installPyramid();const raw=h.storage.get(KEY);h.click('resetOperation');h.click('cancelReset');assert.equal(h.storage.get(KEY),raw);h.click('resetOperation');h.click('confirmReset');assert.equal(h.a.get().round,0);assert.ok([...h.storage.entries()].some(([key,value])=>key.startsWith(KEY+'.backup.')&&value===raw));
});
console.log(`${passed} scenario groups passed.`);
