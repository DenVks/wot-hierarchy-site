'use strict';
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'..'),ctx={window:{}};vm.createContext(ctx);
for(const f of ['hierarchy-data.js','hierarchy-wall-data.js','hierarchy-mechanics.js','npc-data.js','npc-combat-view.js'])vm.runInContext(fs.readFileSync(path.join(root,'assets',f),'utf8'),ctx);
const npcScript=fs.readFileSync(path.join(root,'assets/dm-npc.js'),'utf8');
vm.runInContext(npcScript.slice(npcScript.indexOf('const SCREAM_ABILITY_SIGNATURE_RE='),npcScript.indexOf('function screamAbilityKind(')),ctx);
const data=ctx.window.NPC_DATA,view=ctx.window.WOT_COMBAT_VIEW,db=ctx.window.WOT_HIERARCHY_DB;
const rows=id=>view.entries(data.find(c=>c.id===id),db,ctx.splitScreamAbilities);
for(const c of data){const e=rows(c.id);assert.equal(new Set(e.map(x=>x.id)).size,e.length,c.id+': duplicate rule IDs');assert.ok(e.every(x=>view.GROUPS[x.kind]),c.id+': unknown kind');}
const commander=rows(13).filter(x=>x.name==='Приём: Командирский удар');assert.equal(commander.length,1);assert.equal(commander[0].kind,'bonus');assert.match(commander[0].text,/союзник реакцией/);
const scream=rows(48);for(const [name,kind] of [['Искра Хвоста','bonus'],['Твёрдый шаг','bonus'],['Полог дождя','reaction'],['Малый Вал','action'],['Держать тело','bonus'],['Стена перед Валом','action']]){const found=scream.filter(x=>x.name===name);assert.equal(found.length,1,name);assert.equal(found[0].kind,kind,name);assert.ok(found[0].text.length>210,name+': full text was clipped');}
assert.equal(scream.filter(x=>/^II ·/.test(x.name)).length,0,'Whole rank is not a reaction/bonus action');
const steel=rows(42).find(x=>x.name==='Стальная воля');assert.equal(steel.kind,'passive');assert.match(steel.text,/испуган/);assert.match(steel.text,/очарован/);
const aura=rows(32).find(x=>x.name==='Аура Имперской Власти');assert.equal(aura.kind,'action');assert.match(aura.text,/Имперский приказ/);assert.ok(!aura.text.includes('всех врагов в 30 фт'),'Legacy duplicate must not override hierarchy source');
const wave=rows(40).find(x=>x.name==='Волна Силы');assert.equal(wave.kind,'bonus');assert.match(wave.text,/силового/);assert.match(wave.text,/до конца текущего хода/);
assert.equal(rows(41).find(x=>x.name==='Пустота между ударами').kind,'reaction');assert.ok(rows(41).some(x=>x.name==='Ячейки Договора'&&x.kind==='reference'));
for(const page of ['dm-npc.html','monsters-battle.html','anomaly-dm.html']){const html=fs.readFileSync(path.join(root,page),'utf8').replace(/<script\b[^>]*>[\s\S]*?<\/script>/g,'');const ids=[...html.matchAll(/\bid="([^"]+)"/g)].map(x=>x[1]);assert.equal(ids.length,new Set(ids).size,page+': duplicate static IDs');}
assert.ok(!npcScript.slice(npcScript.indexOf('function combatBrief('),npcScript.indexOf('function getSpellLine(')).includes('clipNpcText'));
console.log('PASS: 50 NPC rule maps; one Commander bonus action; separate full Scream abilities; canonical Throne/Shara rules; Pact reaction; unique control IDs.');
