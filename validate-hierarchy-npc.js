/* Read-only integrity checks for the hierarchy database and NPC calculations. */
'use strict';

const fs = require('fs');
const vm = require('vm');
const path = require('path');
const root = __dirname;

global.window = {};
global.document = { addEventListener() {}, querySelectorAll() { return []; }, getElementById() { return null; } };
global.localStorage = { getItem() { return null; }, setItem() {}, removeItem() {} };

function run(file) {
  vm.runInThisContext(fs.readFileSync(path.join(root, file), 'utf8'), { filename: file });
}

run('assets/hierarchy-data.js');
run('assets/hierarchy-wall-data.js');
run('assets/hierarchy-mechanics.js');
run('assets/classes-data.js');
run('assets/pact-matrices-data.js');
run('assets/feats-data.js');

let generatorSource = fs.readFileSync(path.join(root, 'assets/npc-generator.js'), 'utf8');
generatorSource = generatorSource.replace(
  /document\.addEventListener\('DOMContentLoaded',bind\);\r?\n\}\)\(\);\s*$/,
  "global.__npcHierarchyTest={applyHierarchy,avgHp,rankOrder,hierarchyProfileSummary,getChannelingSlots};\n})();"
);
vm.runInThisContext(generatorSource, { filename: 'assets/npc-generator.js' });

const { applyHierarchy, getChannelingSlots } = global.__npcHierarchyTest;
const db = window.WOT_HIERARCHY_DB;
const matrixDb = window.WOT_PACT_MATRICES;
const featsDb = window.WOT_FEATS_DB;
const blankStats = value => ({ str: value, dex: value, con: value, int: value, wis: value, cha: value });
const assert = (condition, message) => { if (!condition) throw new Error(message); };
const picks = (ranks, first, second, amount = 2) => Object.fromEntries(ranks.map(rank => [rank, [{ key: first, amount, slot: 0 }, { key: second, amount, slot: 1 }]]));
const context = extra => Object.assign({ cls: 'Варвар', role: 'Фронтлайн', isChanneler: false, hierarchyChoices: { stats: {}, penalties: {} }, profileKind: 'regular', screamInitiative: 'none', screamInitiativeStat: 'dex', screamCharge: true }, extra);

assert(db.validationErrors.length === 0, 'Database validation errors: ' + db.validationErrors.join(' · '));
assert(db.hierarchies.length === 7, 'Expected seven hierarchies.');
assert(matrixDb.validationErrors.length === 0, 'Pact matrix validation errors: ' + matrixDb.validationErrors.join(' · '));
assert(matrixDb.secret.length === 40, 'Expected 40 Secret matrices.');
assert(matrixDb.forbidden.length === 24, 'Expected 24 general Forbidden matrices.');
assert(matrixDb.restricted.length === 19, 'Expected 19 GM-restricted Forbidden matrices.');
assert(matrixDb.secret.every(matrix => matrix.description && matrix.requirement), 'Every Secret matrix must have a full description and requirement.');
assert(matrixDb.forbidden.every(matrix => matrix.description), 'Every Forbidden matrix must have a full description.');
const sharpshooter = featsDb.feats.find(feat => feat.name === 'Меткий стрелок');
assert(sharpshooter && sharpshooter.cls === '—', 'Sharpshooter must not have a class restriction.');
assert(sharpshooter.req === 'Владение дальнобойным оружием', 'Sharpshooter must require ranged-weapon proficiency.');
const pactLevel13 = window.WOT_CLASSES_DB.progression.find(row => row.className === 'Носитель Договора' && row.level === 13);
assert(pactLevel13 && pactLevel13.pactSlots === 3 && pactLevel13.slotLevel === 5, 'Pact Bearer level 13 must have three ordinary 5th-level Pact slots.');
assert(pactLevel13.forbiddenMatrix === '7-й уровень', 'Pact Bearer level 13 must gain the separate 7th-level Forbidden Matrix resource.');

{
  const slots = getChannelingSlots('Дичок', 13, 'Странник', { extraSlots: 0 }, []);
  assert(JSON.stringify(slots) === JSON.stringify([{lv:'1',n:5},{lv:'2',n:4},{lv:'3',n:4},{lv:'4',n:3},{lv:'5',n:3},{lv:'6',n:2},{lv:'7',n:1}]), 'Wilder level-13 weave slots are incorrect.');
}

{
  const stats = blankStats(10);
  const result = applyHierarchy(stats, context({ faction: 'unity', rank: 'V', isChanneler: true, hierarchyChoices: { penalties: {}, stats: picks(['II', 'III', 'IV', 'V'], 'wis', 'int') } }));
  assert(stats.wis === 18 && stats.int === 18, 'Unity manual rank packages were not applied independently.');
  assert(result.dcBonus === 7 && result.extraSlots === 5, 'Unity V current profile is incorrect.');
}

{
  const stats = blankStats(10);
  const screamStats = {};
  ['II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII'].forEach((rank, index) => {
    const points = [1, 1, 2, 1, 2, 1, 2][index];
    screamStats[rank] = Array.from({ length: points }, (_, slot) => ({ key: 'wis', amount: 1, slot }));
  });
  const noCharge = applyHierarchy(stats, context({ faction: 'scream', rank: 'VIII', screamInitiative: 'exceptional', screamCharge: false, hierarchyChoices: { penalties: {}, stats: screamStats } }));
  assert(stats.wis === 16, 'Scream must cap hierarchy contribution to one characteristic at +6.');
  assert(noCharge.acBonus === 0 && noCharge.speedBonus === 0 && noCharge.initiativeBonus === 0 && noCharge.stability === 0, 'Scream charge-dependent bonuses must switch off together.');
  const charged = applyHierarchy(blankStats(10), context({ faction: 'scream', rank: 'VIII', screamInitiative: 'exceptional', screamCharge: true, hierarchyChoices: { penalties: {}, stats: screamStats } }));
  assert(charged.initiativeBonus === 15 && charged.acBonus === 5, 'Scream exceptional initiative profile is incorrect.');
}

{
  const choices = { penalties: {}, stats: picks(['II', 'III', 'IV', 'V', 'VI'], 'str', 'cha') };
  const regularStats = blankStats(20);
  const uniqueStats = blankStats(20);
  applyHierarchy(regularStats, context({ faction: 'crystal-throne', rank: 'VI', profileKind: 'regular', hierarchyChoices: choices }));
  applyHierarchy(uniqueStats, context({ faction: 'crystal-throne', rank: 'VI', profileKind: 'unique', hierarchyChoices: choices }));
  assert(regularStats.str === 24 && regularStats.cha === 24, 'Regular Throne VI cap must be 24.');
  assert(uniqueStats.str === 26 && uniqueStats.cha === 26, 'Unique Throne VI cap must be 26.');
}

{
  const warrior = applyHierarchy(blankStats(12), context({ faction: 'shara-will', rank: 'V', branch: 'warrior', hierarchyChoices: { penalties: {}, stats: picks(['II', 'III', 'IV', 'V'], 'str', 'con') } }));
  assert(warrior.attackBonus === 3 && warrior.forceDamageDie === '1к8', 'Shara warrior branch profile is incorrect.');
}

run('assets/npc-data.js');
{
  const expectedAttackCounts = { 43: 4, 44: 3, 45: 3, 46: 1, 47: 2, 48: 1 };
  Object.entries(expectedAttackCounts).forEach(([id, count]) => {
    const npc = window.NPC_DATA.find(entry => Number(entry.id) === Number(id));
    assert(npc, `NPC ${id} is missing.`);
    assert(npc.at.length === count, `NPC ${id} must render ${count} weapon attacks in a full ordinary turn; found ${npc.at.length}.`);
  });
  const blade = window.NPC_DATA.find(entry => Number(entry.id) === 45);
  const book = window.NPC_DATA.find(entry => Number(entry.id) === 46);
  const guard = window.NPC_DATA.find(entry => Number(entry.id) === 43);
  const archer = window.NPC_DATA.find(entry => Number(entry.id) === 44);
  const rogue = window.NPC_DATA.find(entry => Number(entry.id) === 47);
  const wilder = window.NPC_DATA.find(entry => Number(entry.id) === 48);
  assert(blade.pact.secretMatrices.length === 4 && blade.pact.forbiddenMatrices.length === 2, 'Blade Pact NPC matrix selection is incomplete.');
  assert(book.pact.secretMatrices.length === 4 && book.pact.forbiddenMatrices.length === 2, 'Book Pact NPC matrix selection is incomplete.');
  assert(book.pact.openFormula === 'Прикосновение Смерти', 'Book Pact NPC Open Formula is incorrect.');
  assert([blade, book].every(npc => !(npc.spells || []).some(spell => /Плетение не найдено в базе/i.test(String(spell.ef || '')))), 'Pact matrices leaked into the normal weave list.');
  assert(JSON.stringify(wilder.slots) === JSON.stringify([{lv:'1',n:5},{lv:'2',n:4},{lv:'3',n:4},{lv:'4',n:3},{lv:'5',n:3},{lv:'6',n:2},{lv:'7',n:1}]), 'Wilder NPC slots are missing or incorrect.');
  assert([blade, book].every(npc => JSON.stringify(npc.slots) === JSON.stringify([{lv:'5',n:3},{lv:'Запр. 6',n:1},{lv:'Запр. 7',n:1}])), 'Pact NPC slot resources are missing or incorrect.');
  assert(guard.at.every(atk => /Мастер большого оружия/i.test(atk.no) && /тяж[её]л/i.test(atk.no)), 'Guardian attacks must expose the Great Weapon Master mode.');
  assert(archer.at.every(atk => /Меткий стрелок/i.test(atk.no)), 'Archer attacks must expose the Sharpshooter mode.');
  assert(rogue.ab.some(feature => /Скрытая атака/i.test(feature.n)), 'Rogue must expose Sneak Attack for the combined attack-and-damage roll.');
  assert(wilder.spells.filter(spell => Number(spell.lv) === 0).length === 4, 'Wilder must have four repeatable cantrip actions.');
  assert(wilder.spells.some(spell => Number(spell.lv) === 0 && /Разорвать плоть/i.test(spell.n)), 'Wilder combat cantrips must include Rend Flesh.');
  assert(JSON.stringify(wilder.affinities) === JSON.stringify(['Земля','Огонь']), 'Wilder affinities must remain Earth and Fire.');
  assert(/Страж проходов/.test(guard.su) && !/контрол[её]р/i.test(guard.su), 'Guardian role subtitle must explain the battlefield-control role without unexplained jargon.');
  assert([43,44,45,46,47,48].every(id => window.NPC_DATA.find(entry => entry.id === id).tactics.length === 5), 'Every new NPC must have five standalone tactics phases.');
}

{
  const dmSource = fs.readFileSync(path.join(root, 'assets/dm-npc.js'), 'utf8');
  const dmHtml = fs.readFileSync(path.join(root, 'dm-npc.html'), 'utf8');
  const miscSource = fs.readFileSync(path.join(root, 'assets/npc-misc-items.js'), 'utf8');
  ['разорвать плоть','каменный вихрь','огненные цветки','землятресение','огненные стрелы'].forEach(name => {
    assert(dmSource.includes(`k==='${name}'`), `Missing calculated damage rule for «${name}».`);
  });
  assert(dmSource.includes('atk-option-row power') && dmSource.includes('atk-option-row sneak'), 'Battle cards must render power-attack and Sneak Attack roll modes.');
  assert(dmSource.includes('battleCantrips') && dmSource.includes('Кантрипы · без ячеек'), 'Battle tab must render repeatable cantrip actions.');
  assert(dmSource.includes("slot-cnt-sp-") && dmSource.includes("slot-box-sp-"), 'Weaves-tab resource clicks must refresh their own counter and used state.');
  assert(dmSource.includes("filter(sl=>!/^Запр\\./i"), 'A short rest must restore ordinary Pact slots without restoring Forbidden Matrices.');
  assert(dmSource.includes("/[+\\-]\\s*\\d+(?!\\d)(?!\\s*к)/g"), 'Weapon damage rolls must support signed flat modifiers such as the Wilder\'s 1к4-1.');
  assert(dmSource.includes('function renderWeaponSelector') && dmSource.includes('function getDisplayAttacks'), 'Equipment tab must expose a weapon selector that updates combat attacks.');
  assert(dmSource.includes('magicBonus') && dmSource.includes('Магическое оружие'), 'Weapon override must account for the magic bonus in attacks and damage.');
  assert(dmSource.includes('function renderMiscEquipmentSelector') && miscSource.includes('window.WOT_NPC_MISC_ITEMS = []'), 'Empty miscellaneous equipment catalog template is missing.');
  assert(dmHtml.includes('assets/npc-misc-items.js'), 'NPC page must load the miscellaneous equipment catalog before the combat UI.');
  assert(dmSource.includes('function npcClassNames') && dmSource.includes('Класс: Воин / Мастер по оружию'), 'Armor proficiency must use structured class names and recognize the Fighter class.');
  assert(dmSource.includes('const effective=base===0?Math.min(9,matched):Math.min(9,base+matched)') && dmSource.includes('Аффинитеты: совпало'), 'Wilder affinity matches must increase the effective weave circle and remain visible in calculation notes.');
}

console.log(`OK: ${db.hierarchies.length} hierarchies, ${db.hierarchies.reduce((sum, h) => sum + h.ranks.length, 0)} ranks, ${db.hierarchies.reduce((sum, h) => sum + h.abilities.length, 0)} abilities; ${matrixDb.secret.length + matrixDb.forbidden.length + matrixDb.restricted.length} Pact matrix records; six level-13 NPC combat profiles passed.`);
