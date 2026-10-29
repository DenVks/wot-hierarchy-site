'use strict';
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'..'),ctx={window:{}};
vm.createContext(ctx);
for(const file of ['assets/hierarchy-data.js','assets/hierarchy-wall-data.js','assets/hierarchy-mechanics.js','assets/npc-data.js'])vm.runInContext(fs.readFileSync(path.join(root,file),'utf8'),ctx,{filename:file});
const db=ctx.window.WOT_HIERARCHY_DB,rows=ctx.window.NPC_DATA;
let ranks=0;
for(const h of db.hierarchies)for(const [rank,p]of Object.entries(h.mechanics.ranks)){
  const calc=db.calculateHitPoints([{die:10,levels:10,first:true}],20,p.hitDiceMult||1,[{value:p.hp||0}]);
  assert.equal(calc.total,Math.floor(64*(p.hitDiceMult||1))+50+(p.hp||0),h.id+' '+rank);
  ranks++;
}
for(const c of rows){
  const d=c.hpCalculation;assert.ok(d,c.id+': missing calculation');
  assert.equal(d.status,'verified',c.id+': unverified');
  const profile=d.hierarchyId?db.getHierarchy(d.hierarchyId).mechanics.ranks[d.rank]:{};
  assert.equal(d.coefficient,profile.hitDiceMult||1,c.id+': coefficient');
  assert.equal(d.hierarchyFlat,profile.hp||0,c.id+': flat hierarchy bonus');
  const levels=d.classes.reduce((s,x)=>s+x.levels,0);assert.equal(levels,c.lv,c.id+': total level');
  assert.equal(d.classes.filter(x=>x.first).length,1,c.id+': first level maximum applied more than once');
  let hd=0;for(const cl of d.classes)hd+=(cl.first?cl.die:0)+(cl.levels-(cl.first?1:0))*(cl.die/2+1);
  const flat=d.flatModifiers.reduce((s,x)=>s+x.value,0), con=c.lv*Math.floor((c.st.con-10)/2);
  const expected=Math.max(1,Math.floor(hd*(profile.hitDiceMult||1))+con+(profile.hp||0)+flat);
  assert.equal(d.hitDicePart,hd,c.id+': hit dice component');assert.equal(d.contribution,con,c.id+': Constitution');
  assert.equal(c.co.hp,expected,c.id+': stored HP');assert.equal(d.expected,expected,c.id+': expected HP');
  const calc=db.calculateHitPoints(d.classes,c.st.con,d.coefficient,[{value:d.hierarchyFlat},...d.flatModifiers]);
  assert.equal(calc.total,expected,c.id+': shared calculator');
  const bonus=c.na==='Шончан'?c.lv:0;
  assert.equal(d.flatModifiers.filter(x=>x.name==='Шончан: Крепкий').reduce((s,x)=>s+x.value,0),bonus,c.id+': Sturdy');
}
const mixed=db.calculateHitPoints([{die:10,levels:11,first:true},{die:6,levels:3,first:false}],16,2,[{value:10}]);assert.equal(mixed.total,216);
const floor=db.calculateHitPoints([{die:12,levels:14,first:true}],24,2.5,[]);assert.equal(floor.total,355);
const v=db.calculateHitPoints([{die:10,levels:10,first:true}],20,3.5,[{value:80}]);assert.equal(v.total,354);
const vCon=db.calculateHitPoints([{die:10,levels:10,first:true}],22,3.5,[{value:80}]);assert.equal(vCon.total-v.total,10,'CON delta must not be multiplied');
for(const page of ['unity.html','throne.html','madding.html','hierarchy-wall.html','scream.html','order.html']){
 const html=fs.readFileSync(path.join(root,page),'utf8');assert.equal((html.match(/id="hit-point-formula"/g)||[]).length,1,page+': missing or repeated formula');assert.ok(html.includes('hp-formula.css?v=176'),page+': stylesheet');
}
assert.ok(fs.readFileSync(path.join(root,'shara-will.html'),'utf8').includes('Формула максимума хитов'));
console.log(`PASS: ${rows.length} NPCs, ${ranks} rank profiles, 7 hierarchy pages; multiclass, rounding, Constitution and flat bonuses.`);
