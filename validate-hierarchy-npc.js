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

let generatorSource = fs.readFileSync(path.join(root, 'assets/npc-generator.js'), 'utf8');
generatorSource = generatorSource.replace(
  "document.addEventListener('DOMContentLoaded',bind);\n})();",
  "global.__npcHierarchyTest={applyHierarchy,avgHp,rankOrder,hierarchyProfileSummary};\n})();"
);
vm.runInThisContext(generatorSource, { filename: 'assets/npc-generator.js' });

const { applyHierarchy } = global.__npcHierarchyTest;
const db = window.WOT_HIERARCHY_DB;
const blankStats = value => ({ str: value, dex: value, con: value, int: value, wis: value, cha: value });
const assert = (condition, message) => { if (!condition) throw new Error(message); };
const picks = (ranks, first, second, amount = 2) => Object.fromEntries(ranks.map(rank => [rank, [{ key: first, amount, slot: 0 }, { key: second, amount, slot: 1 }]]));
const context = extra => Object.assign({ cls: 'Варвар', role: 'Фронтлайн', isChanneler: false, hierarchyChoices: { stats: {}, penalties: {} }, profileKind: 'regular', screamInitiative: 'none', screamInitiativeStat: 'dex', screamCharge: true }, extra);

assert(db.validationErrors.length === 0, 'Database validation errors: ' + db.validationErrors.join(' · '));
assert(db.hierarchies.length === 7, 'Expected seven hierarchies.');

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

console.log(`OK: ${db.hierarchies.length} hierarchies, ${db.hierarchies.reduce((sum, h) => sum + h.ranks.length, 0)} ranks, ${db.hierarchies.reduce((sum, h) => sum + h.abilities.length, 0)} abilities; NPC special profiles passed.`);
