'use strict';
const fs=require('node:fs'),vm=require('node:vm'),path=require('node:path'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'..'),html=fs.readFileSync(path.join(root,'monsters-battle.html'),'utf8');
const blocks=[...html.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/g)].map(m=>m[1]);
const source=blocks.find(s=>s.includes('function createClones('));assert.ok(source);
const elements=new Map();function el(id){if(!elements.has(id))elements.set(id,{value:'',style:{},textContent:'',addEventListener(){},focus(){},classList:{add(){},remove(){}}});return elements.get(id);}
const context={window:{},enhanceCombatControls(){},setCombatMobileTitle(){},closeCombatCatalog(){},rememberCombatModalFocus(){},restoreCombatModalFocus(){},console,URLSearchParams,setTimeout:()=>1,clearTimeout(){},document:{getElementById:el,addEventListener(){},querySelectorAll:()=>[]}};vm.createContext(context);
vm.runInContext(fs.readFileSync(path.join(root,'assets/monster-packs-data.js'),'utf8'),context);
vm.runInContext(fs.readFileSync(path.join(root,'assets/bestiary-data.js'),'utf8'),context);
vm.runInContext(fs.readFileSync(path.join(root,'assets/monster-scene.js'),'utf8'),context);
vm.runInContext(fs.readFileSync(path.join(root,'assets/monster-scene-ui.js'),'utf8'),context);
vm.runInContext(source.split('// Initialize scene')[0]+`buildSidebar=()=>{};renderFull=()=>{};render=()=>{};window.test={MS,CLONES,STATE,createClones,createClone,removeClone,getMon,select:id=>cur=getMon(id),current:()=>cur,applyHp,toggleCond};`,context);
const a=context.window.test;assert.ok(a);
const base=a.MS[0],original=JSON.stringify(base);
const copies=a.createClones(base,3);assert.equal(copies.length,3);assert.equal(new Set(copies.map(c=>c.id)).size,3);assert.equal(a.current().id,copies[0].id);
for(const c of copies){assert.equal(a.STATE[c.id].hp,base.hp);assert.equal(c.baseId,base.id);}
a.select(copies[2].id);el('hp-modal-val').value='10';a.applyHp(-1);a.toggleCond('prone');a.STATE[copies[2].id].roll.attack=17;
assert.equal(a.STATE[copies[2].id].hp,base.hp-10);assert.equal(a.STATE[copies[2].id].conds.prone,true);
for(const c of copies.slice(0,2)){assert.equal(a.STATE[c.id].hp,base.hp);assert.equal(a.STATE[c.id].conds.prone,undefined);assert.equal(a.STATE[c.id].roll.attack,undefined);}
assert.equal(JSON.stringify(base),original,'Template was mutated');
const fromCopy=a.createClones(copies[2],2);assert.equal(fromCopy.length,2);assert.equal(a.STATE[fromCopy[0].id].hp,base.hp,'New copy must use the template, not wounded instance');assert.equal(fromCopy[0].cloneNo,4);
const survivorNames=a.CLONES.filter(c=>c.id!==copies[1].id).map(c=>[c.id,c.nm]);a.removeClone(copies[1].id);const replacement=a.createClones(base,1)[0];assert.equal(replacement.cloneNo,2);
for(const [id,name] of survivorNames)assert.equal(a.getMon(id).nm,name,'Existing copy was renumbered');
const before=a.CLONES.length;for(const count of [0,-1,1.5,21,'bad',''])assert.equal(a.createClones(base,count).length,0);assert.equal(a.CLONES.length,before);
assert.equal(a.createClones(base,20).length,20);assert.equal(new Set(a.CLONES.map(c=>c.id)).size,a.CLONES.length);
const nested=a.MS.find(c=>Object.values(c).some(v=>Array.isArray(v)&&v.some(item=>item&&typeof item==='object')));
assert.ok(nested,'A real nested statblock fixture is required');
const key=Object.keys(nested).find(k=>Array.isArray(nested[k])&&nested[k].some(item=>item&&typeof item==='object'));
const nestedClone=a.createClones(nested,1)[0],nestedBefore=JSON.stringify(nested[key]);
nestedClone[key].find(item=>item&&typeof item==='object').testOnly=true;
assert.equal(JSON.stringify(nested[key]),nestedBefore,'Statblock arrays are shared');

assert.ok(html.includes('id="clone-count"')&&html.includes('id="clone-status"'));
console.log('PASS: batch 3/20 copies, independent HP/conditions/rolls, adding from a wounded copy, removal/reused number, stable IDs/names, invalid counts and nested statblock isolation.');
