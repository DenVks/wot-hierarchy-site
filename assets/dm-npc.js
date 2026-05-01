const FORMS = [
  {lv:3, n:'Кабан сбегает с горы',
   d:'Когда вы используете действие Атака (Attack), вы получаете преимущество на атаки против любого существа, которого вы уже атаковали в этом ходу.'},
  {lv:3, n:'Бушующий Вихрь',
   d:'Если вы находитесь в зоне угрозы нескольких существ, вы можете использовать свою реакцию, чтобы получить бонус +2 к классу брони (AC) до конца вашего следующего хода.'},
  {lv:3, n:'Кошка танцует на стене',
   d:'Когда вы попадаете по крупному или меньшему существу атакой оружием, вы можете попытаться сбить цель с ног. Проведите проверку Силы против цели. Если вы побеждаете, существо оказывается сбитым с ног (prone).'},
  {lv:3, n:'Лотос закрывает свой бутон',
   d:'Если ваша атака снизила очки здоровья существа до 0, его союзники должны выполнить спасбросок Мудрости (Wisdom saving throw) или быть напуганными вами до конца вашего следующего хода.'},
  {lv:3, n:'Разделяя шёлк',
   d:'В первый ход боя, если вы не застигнуты врасплох, вы можете использовать своё бонусное действие, чтобы переместиться на расстояние своей скорости и нанести атаку до того, как любое другое существо выполнит действие или перемещение.'},
  {lv:3, n:'Гадюка шевелит языком',
   d:'Когда вы используете действие Атака (Attack), если ваша цель находится под угрозой другого существа, вы получаете преимущество на атаку.'},
  {lv:7, n:'Яблоневые цветы на ветру',
   d:'Когда вы используете действие Атака (Attack), начиная со второй атаки, вы получаете преимущество на атаки против существ, которых вы ещё не атаковали в этом ходу.'},
  {lv:7, n:'Колибри целует розу',
   d:'Если ваша первая атака попадает по существу, цель не получает урон, но обязана выполнить действие Уклонение (Dodge) в свой следующий ход.'},
  {lv:7, n:'Леопард в высокой траве',
   d:'До конца вашего следующего хода враги не получают преимущества на атаки за то, что окружают вас.'},
  {lv:7, n:'Река света',
   d:'Если вы застигнуты врасплох, вы можете использовать свою реакцию во время раунда внезапной атаки, чтобы атаковать существо, которое входит в вашу зону угрозы.'},
  {lv:13, n:'Целуя гадюку',
   d:'Когда вы используете действие Атака (Attack), вы можете отказаться от дополнительных атак, чтобы совершить одну атаку. Если эта атака попадает, она автоматически становится критической.'},
  {lv:13, n:'Ящерица в терновнике',
   d:'Вы можете отказаться от дополнительных атак, чтобы совершить ближнюю атаку по любому количеству существ в пределах 5 футов от вас, с отдельным броском атаки для каждой цели.'}
];

;

// ── Custom NPCs from NPC Generator ─────────────────────────────────────────
const CUSTOM_NPC_STORAGE_KEY = 'wot_custom_npcs_v1';
function loadCustomNpcsFromStorage(){
  try{
    const arr = JSON.parse(localStorage.getItem(CUSTOM_NPC_STORAGE_KEY) || '[]');
    if(Array.isArray(arr)){ arr.forEach(raw => {
      if(!raw || raw.id == null) return;
      const id = Number(raw.id);
      if(CS.some(c => Number(c.id) === id)) return;
      const npc = JSON.parse(JSON.stringify(raw));
      npc.id = id; npc.custom = true;
      CS.push(npc);
    }); }
  }catch(e){ console.warn('Cannot load custom NPCs', e); }
}
loadCustomNpcsFromStorage();

// ── State / Encounter copies ───────────────────────────────────────────────
const BASE_NPC_IDS = CS.map(c => c.id);
const STATE = {}; // {npcIdOrCloneId: {curHp, conditions:[], slots:{}, sdUsed, saOn}}
let ENCOUNTER_CLONES = []; // полноценные копии NPC, созданные на время боя
let ENCOUNTER_CLONE_COUNTER = 1;
const CLONE_ID_BASE = 100000;
const STORAGE_KEY = 'wot_dm_npc_state_v56';
const LEGACY_STORAGE_KEYS = ['wot_dm_npc_state_v34'];

function deepCloneNpc(obj){ return JSON.parse(JSON.stringify(obj)); }
function getNpcById(id){ return CS.find(x => Number(x.id) === Number(id)); }
function isEncounterClone(id){ const c=getNpcById(id); return !!(c && c.isClone); }
function baseNpcLabel(c){ return (c.tags && c.tags[0] ? c.tags[0] : c.sh || 'NPC') + (c.tags && c.tags[1] && !String(c.tags[1]).startsWith('Ур.') ? ' / ' + c.tags[1] : ''); }
function nextCloneNoForBase(baseId){
  const used = ENCOUNTER_CLONES.filter(c => Number(c.baseId) === Number(baseId)).map(c => Number(c.cloneNo || 0));
  let n = 1; while(used.includes(n)) n++; return n;
}
function hydrateEncounterClones(clones){
  if(!Array.isArray(clones)) return;
  clones.forEach(raw => {
    if(!raw || raw.id == null) return;
    const id = Number(raw.id);
    if(CS.some(c => Number(c.id) === id)) return;
    const clone = deepCloneNpc(raw);
    clone.id = id;
    clone.isClone = true;
    CS.push(clone);
    ENCOUNTER_CLONES.push(clone);
    ENCOUNTER_CLONE_COUNTER = Math.max(ENCOUNTER_CLONE_COUNTER, id - CLONE_ID_BASE + 1);
  });
}
function addEncounterClone(baseId){
  const base = getNpcById(baseId);
  if(!base) return;
  const source = base.isClone ? getNpcById(base.baseId) || base : base;
  const clone = deepCloneNpc(source);
  const cloneNo = nextCloneNoForBase(source.id);
  let id = CLONE_ID_BASE + ENCOUNTER_CLONE_COUNTER++;
  while(CS.some(c => Number(c.id) === id)) id = CLONE_ID_BASE + ENCOUNTER_CLONE_COUNTER++;
  clone.id = id;
  clone.baseId = source.id;
  clone.cloneNo = cloneNo;
  clone.isClone = true;
  clone.sh = (source.sh || baseNpcLabel(source)) + ' #' + cloneNo;
  clone.ti = (source.ti || source.sh || 'NPC') + ' · копия ' + cloneNo;
  clone.su = 'Копия для текущей боевой сцены · ' + (source.su || '');
  clone.tags = Array.from(new Set([...(source.tags || []), 'Копия']));
  CS.push(clone);
  ENCOUNTER_CLONES.push(clone);
  getState(id);
  savePersistedState();
  buildSidebar();
  showNPC(id);
}
function removeEncounterClone(id){
  const clone = getNpcById(id);
  if(!clone || !clone.isClone) return;
  if(!confirm('Удалить эту копию NPC из текущей сцены?')) return;
  const idx = CS.findIndex(c => Number(c.id) === Number(id));
  if(idx >= 0) CS.splice(idx, 1);
  ENCOUNTER_CLONES = ENCOUNTER_CLONES.filter(c => Number(c.id) !== Number(id));
  delete STATE[id]; delete STATE[String(id)];
  iniOrder = iniOrder.filter(e => Number(e.id) !== Number(id));
  if(iniCurrent >= iniOrder.length) iniCurrent = Math.max(0, iniOrder.length - 1);
  if(Number(curNPC) === Number(id)) {
    curNPC = -1;
    document.getElementById('mn').innerHTML = '<div class="placeholder" id="placeholder">← Выбери персонажа слева</div>';
  }
  savePersistedState();
  buildSidebar();
  refreshIniTracker();
}
function clearEncounterClonesOnly(){
  if(!ENCOUNTER_CLONES.length) return;
  if(!confirm('Удалить все копии NPC из текущей сцены? Базовые NPC останутся.')) return;
  const cloneIds = new Set(ENCOUNTER_CLONES.map(c => Number(c.id)));
  for(let i=CS.length-1;i>=0;i--) if(cloneIds.has(Number(CS[i].id))) CS.splice(i,1);
  cloneIds.forEach(id => { delete STATE[id]; delete STATE[String(id)]; });
  ENCOUNTER_CLONES = [];
  iniOrder = iniOrder.filter(e => !cloneIds.has(Number(e.id)));
  if(iniCurrent >= iniOrder.length) iniCurrent = Math.max(0, iniOrder.length - 1);
  if(cloneIds.has(Number(curNPC))) {
    curNPC = -1;
    document.getElementById('mn').innerHTML = '<div class="placeholder" id="placeholder">← Выбери персонажа слева</div>';
  }
  savePersistedState();
  buildSidebar();
  refreshIniTracker();
}
function loadPersistedState(){
  try{
    let raw = localStorage.getItem(STORAGE_KEY);
    if(!raw) {
      for(const k of LEGACY_STORAGE_KEYS){ raw = localStorage.getItem(k); if(raw) break; }
    }
    if(!raw) return;
    const data = JSON.parse(raw);
    hydrateEncounterClones(data && data.encounterClones);
    if(data && data.STATE) Object.assign(STATE, data.STATE);
    if(data && Array.isArray(data.iniOrder)) iniOrder = data.iniOrder;
    if(data && typeof data.iniCurrent === 'number') iniCurrent = data.iniCurrent;
  }catch(e){ console.warn('Не удалось загрузить состояние DM NPC', e); }
}
function savePersistedState(){
  try{
    localStorage.setItem(STORAGE_KEY, JSON.stringify({STATE, iniOrder, iniCurrent, encounterClones: ENCOUNTER_CLONES}));
  }catch(e){ console.warn('Не удалось сохранить состояние DM NPC', e); }
}
function resetAllDmState(){
  if(!confirm('Сбросить бой: ОЗ, состояния, слоты, инициативу и все созданные копии NPC?')) return;
  localStorage.removeItem(STORAGE_KEY);
  LEGACY_STORAGE_KEYS.forEach(k => localStorage.removeItem(k));
  Object.keys(STATE).forEach(k=>delete STATE[k]);
  const cloneIds = new Set(ENCOUNTER_CLONES.map(c => Number(c.id)));
  for(let i=CS.length-1;i>=0;i--) if(cloneIds.has(Number(CS[i].id))) CS.splice(i,1);
  ENCOUNTER_CLONES = [];
  iniOrder = [];
  iniCurrent = 0;
  curNPC = -1;
  buildSidebar();
  document.getElementById('mn').innerHTML = '<div class="placeholder" id="placeholder">← Выбери персонажа слева</div>';
}
let curNPC = -1;
let groupBy = 'lv';
let iniOrder = []; // [{id, val}]
let iniCurrent = 0;

function getState(id) {
  if (!STATE[id]) {
    const c = getNpcById(id);
    const slots = {};
    if (c && c.slots) c.slots.forEach(s => { slots[s.lv] = {total: s.n, used: 0}; });
    const sdTotal = c && c.co && c.co.cr && c.co.cr.includes('к8') ?
      parseInt((c.co.cr.match(/(d+)к8/)||[0,0])[1]) : 0;
    STATE[id] = { curHp: c ? c.co.hp : 0, conditions: [], slots, sdUsed: 0, sdTotal, saOn: false };
  }
  return STATE[id];
}

// ── Dice ──────────────────────────────────────────────────────────────────
function roll(n, sides) {
  let results = [], sum = 0;
  for (let i = 0; i < n; i++) { const r = Math.floor(Math.random()*sides)+1; results.push(r); sum += r; }
  return {results, sum};
}

function normalizeDamageExpr(dmgExpr) {
  let expr = String(dmgExpr || '');
  if (expr.includes('=')) expr = expr.split('=').pop();
  expr = expr.replace(/\([^)]*\)/g, ' ');
  expr = expr.replace(/[→⇒]/g, ' ');
  return expr.trim();
}

function rollDice(expr, label) {
  const m = expr.match(/^(\d+)к(\d+)([+-]\d+)?$/);
  if (!m) return;
  const n = parseInt(m[1]), sides = parseInt(m[2]), bonus = parseInt(m[3]||'0');
  const {results, sum} = roll(n, sides);
  const total = sum + bonus;
  const modal = document.getElementById('dice-modal');
  modal.className = 'dice-modal' + (n===1&&sides===20&&sum===20?' crit':n===1&&sides===20&&sum===1?' fumble':'');
  document.getElementById('dice-modal-title').textContent = label || expr;
  document.getElementById('dice-modal-result').textContent = total;
  document.getElementById('dice-modal-detail').textContent = '[' + results.join('+') + ']' + (bonus ? (bonus>0?'+':'')+bonus : '');
  modal.style.display = 'block';
  setTimeout(() => modal.style.display='none', 8000);
}

function rollAttack(atkBonus, label) {
  const d20 = Math.floor(Math.random()*20)+1;
  const total = d20 + atkBonus;
  const crit = d20 === 20, fumble = d20 === 1;
  const modal = document.getElementById('dice-modal');
  modal.className = 'dice-modal' + (crit?' crit':fumble?' fumble':'');
  document.getElementById('dice-modal-title').textContent = label || 'Атака';
  document.getElementById('dice-modal-result').textContent = crit ? 'КРИ!' : fumble ? 'ПРОВАЛ' : total;
  document.getElementById('dice-modal-detail').textContent = 'd20[' + d20 + '] + ' + atkBonus;
  modal.style.display = 'block';
  setTimeout(() => modal.style.display='none', 8000);
}

function rollDamage(dmgExpr, label, isCrit) {
  const cleanExpr = normalizeDamageExpr(dmgExpr);
  const parts = (cleanExpr.match(/\d+к\d+/g) || []);
  const bonusM = cleanExpr.match(/\+(\d+)(?!к)/g) || [];
  const bonus = bonusM.reduce((s,b) => s + parseInt(b.replace('+','')), 0);
  let allResults = [], sum = 0;
  parts.forEach((p, pi) => {
    const pm = p.match(/(\d+)к(\d+)/);
    const n = parseInt(pm[1]) * (isCrit && pi === 0 ? 2 : 1);
    const s = parseInt(pm[2]);
    const {results, sum: s2} = roll(n, s);
    allResults.push(...results); sum += s2;
  });
  sum += bonus;
  const modal = document.getElementById('dice-modal');
  modal.className = 'dice-modal' + (isCrit?' crit':'');
  document.getElementById('dice-modal-title').textContent = label || 'Урон' + (isCrit?' (КРИТ!)':'');
  document.getElementById('dice-modal-result').textContent = sum;
  document.getElementById('dice-modal-detail').textContent = '[' + allResults.join('+') + ']' + (bonus ? (bonus>0?'+':'')+bonus : '');
  modal.style.display = 'block';
  setTimeout(() => modal.style.display='none', 8000);
}

function extractSpellDamageExpr(dmgExpr) {
  let raw = String(dmgExpr || '').trim();
  if (!raw || raw === '—' || raw.includes('НЕДОСТУПЕН')) return '';
  if (raw.includes('/')) {
    const variants = raw.split('/').map(x => x.trim()).filter(x => /\d+к\d+/.test(x));
    raw = variants.length ? variants[variants.length - 1] : raw;
  }
  raw = normalizeDamageExpr(raw).replace(/^\+/, '').trim();
  const parts = raw.match(/\d+к\d+(?:[+-]\d+)?(?:\+\d+к\d+(?:[+-]\d+)?)*/);
  return parts ? parts[0] : '';
}

function resetSpellDamageButton(btn) {
  if (!btn) return;
  btn.textContent = '🎲';
  btn.classList.remove('rolled');
  btn.removeAttribute('data-last-result');
  btn.title = 'ЛКМ — бросить урон; ПКМ или Shift+ЛКМ — сбросить результат';
}

function rollSpellDamage(dmgExpr, label, resultTarget) {
  const cleanExpr = extractSpellDamageExpr(dmgExpr);
  if (!cleanExpr) return;

  const parts = (cleanExpr.match(/\d+к\d+/g) || []);
  const bonusM = cleanExpr.match(/\+\d+(?!к)/g) || [];
  const bonus = bonusM.reduce((s,b) => s + parseInt(b.replace('+','')), 0);
  let sum = 0;
  parts.forEach(p => {
    const pm = p.match(/(\d+)к(\d+)/);
    if (!pm) return;
    const rr = roll(parseInt(pm[1]), parseInt(pm[2]));
    sum += rr.sum;
  });
  sum += bonus;

  // v49: без модального окна и без соседнего результата.
  // Итог виден только в самой кнопке: "🎲 37".
  let btn = null;
  if (resultTarget && resultTarget.nodeType === 1) {
    btn = resultTarget.tagName === 'BUTTON' ? resultTarget : resultTarget.closest('button');
  }
  if (btn) {
    btn.textContent = '🎲 ' + sum;
    btn.classList.add('rolled');
    btn.setAttribute('data-last-result', String(sum));
    btn.title = (label || 'Урон плетения') + ': ' + sum + '. ПКМ или Shift+ЛКМ — сбросить.';
  }
}

function escAttr(v) {
  return String(v ?? '').replace(/[&<>"']/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
}

function spellDamageButton(dmgExpr, label) {
  const cleanExpr = extractSpellDamageExpr(dmgExpr);
  if (!cleanExpr) return '';
  return ' <button class="sp-dmg-roll" type="button" title="ЛКМ — бросить урон; ПКМ или Shift+ЛКМ — сбросить результат" data-dmg="' + escAttr(dmgExpr) + '" data-label="' + escAttr(label || 'Урон плетения') + '">🎲</button>';
}

// Делегированный обработчик кнопок урона плетений.
// ЛКМ — бросить/перебросить. Shift+ЛКМ или ПКМ — сбросить результат до "🎲".
document.addEventListener('click', function(e) {
  const btn = e.target && e.target.closest ? e.target.closest('.sp-dmg-roll') : null;
  if (!btn) return;
  e.preventDefault();
  e.stopPropagation();
  if (e.shiftKey) {
    resetSpellDamageButton(btn);
    return;
  }
  rollSpellDamage(btn.getAttribute('data-dmg') || '', btn.getAttribute('data-label') || 'Урон плетения', btn);
});

document.addEventListener('contextmenu', function(e) {
  const btn = e.target && e.target.closest ? e.target.closest('.sp-dmg-roll') : null;
  if (!btn) return;
  e.preventDefault();
  e.stopPropagation();
  resetSpellDamageButton(btn);
});
// ── HP System ────────────────────────────────────────────────────────────
let hpModalNpcId = null;
function openHpModal(id) {
  hpModalNpcId = id;
  const c = getNpcById(id);
  document.getElementById('hp-modal-title').textContent = (c?c.sh:'NPC') + ' — HP';
  document.getElementById('hp-modal-val').value = '';
  document.getElementById('hp-modal').style.display = 'flex';
  document.getElementById('hp-modal-val').focus();
}
function closeHpModal() { document.getElementById('hp-modal').style.display='none'; }
function applyHp(sign) {
  const id = hpModalNpcId;
  const val = parseInt(document.getElementById('hp-modal-val').value) || 0;
  const c = getNpcById(id);
  const s = getState(id);
  s.curHp = Math.max(0, Math.min(c.co.hp, s.curHp + sign * val));
  savePersistedState();
  closeHpModal();
  refreshCombatPanel(id);
  refreshSidebarHP(id);
}
document.getElementById('hp-modal').addEventListener('click', e => { if(e.target===e.currentTarget) closeHpModal(); });
document.getElementById('hp-modal-val').addEventListener('keydown', e => {
  if (e.key==='Enter') { if (e.shiftKey) applyHp(1); else applyHp(-1); }
  if (e.key==='Escape') closeHpModal();
});

// ── Conditions ───────────────────────────────────────────────────────────
const CONDITIONS = ['Оглушён','Напуган','Отравлен','Лежит','Ослеплён','Конц.'];
const COND_KEYS = ['stun','fear','poison','prone','blind','conc'];
const COND_LABELS = {stun:'Оглушён',fear:'Напуган',poison:'Отравлен',prone:'Лежит',blind:'Ослеплён',conc:'Конц.'};
function toggleCondition(id, key) {
  const s = getState(id);
  const idx = s.conditions.indexOf(key);
  if (idx >= 0) s.conditions.splice(idx,1); else s.conditions.push(key);
  savePersistedState();
  refreshCombatPanel(id);
  refreshSidebarHP(id);
}

// ── Slots ─────────────────────────────────────────────────────────────────
function useSlot(id, lvKey) {
  const s = getState(id);
  if (s.slots[lvKey] && s.slots[lvKey].used < s.slots[lvKey].total) s.slots[lvKey].used++;
  savePersistedState();
  refreshSlotsPanel(id);
}
function resetSlot(id, lvKey) {
  const s = getState(id);
  if (s.slots[lvKey]) s.slots[lvKey].used = 0;
  savePersistedState();
  refreshSlotsPanel(id);
}
function useSD(id) {
  const s = getState(id);
  if (s.sdUsed < s.sdTotal) { s.sdUsed++; savePersistedState(); refreshSDPanel(id); }
}
function resetSD(id) {
  const s = getState(id);
  s.sdUsed = 0; savePersistedState(); refreshSDPanel(id);
}

// ── Refresh helpers ──────────────────────────────────────────────────────
function hpColor(cur, max) {
  const pct = cur / max;
  if (cur === 0) return 'hp-dead';
  if (pct > 0.5) return 'hp-high';
  if (pct > 0.25) return 'hp-mid';
  return 'hp-low';
}

function refreshSidebarHP(id) {
  const btn = document.querySelector(`[data-npcid="${id}"]`);
  if (!btn) return;
  const s = getState(id);
  const c = getNpcById(id);
  const maxHp = c.co.hp;
  const pct = Math.max(0, s.curHp/maxHp*100);
  const fill = btn.querySelector('.npc-btn-hp-fill');
  if (fill) { fill.style.width = pct+'%'; fill.className = 'npc-btn-hp-fill ' + hpColor(s.curHp, maxHp); }
  const badges = btn.querySelector('.cond-badges');
  if (badges) {
    badges.innerHTML = s.conditions.map(k =>
      `<span class="cond-badge cb-${k}">${COND_LABELS[k]||k}</span>`
    ).join('');
  }
}

function refreshCombatPanel(id) {
  const s = getState(id);
  const c = getNpcById(id);
  if (!c) return;
  const maxHp = c.co.hp;
  const pct = Math.max(0, s.curHp/maxHp*100);
  const el = document.getElementById('cp-hp-cur');
  if (el) {
    el.textContent = s.curHp;
    el.className = 'cp-hp-cur ' + hpColor(s.curHp, maxHp).replace('hp-','');
    const fill = document.getElementById('cp-hp-fill');
    if (fill) { fill.style.width = pct+'%'; fill.className = 'cp-hp-fill ' + hpColor(s.curHp, maxHp); }
  }
  COND_KEYS.forEach(k => {
    const btn = document.getElementById('ct-'+k);
    if (btn) btn.className = 'cond-toggle' + (s.conditions.includes(k)?' on-'+k:'');
  });
}

function refreshSlotsPanel(id) {
  const s = getState(id);
  const c = getNpcById(id);
  if (!c || !c.slots) return;
  c.slots.forEach(slot => {
    const st = s.slots[slot.lv];
    if (!st) return;
    const container = document.getElementById('slot-pips-'+id+'-'+slot.lv);
    if (!container) return;
    const cnt = document.getElementById('slot-cnt-'+id+'-'+slot.lv);
    if (cnt) cnt.textContent = (st.total-st.used)+'/'+st.total;
    container.innerHTML = Array.from({length:st.total},(_,i)=>
      `<div class="slot-pip${i<st.used?' used':''}" onclick="useSlot(${id},'${slot.lv}')"></div>`
    ).join('');
  });
}

function refreshSDPanel(id) {
  const s = getState(id);
  const container = document.getElementById('sd-pips-'+id);
  if (!container) return;
  container.innerHTML = Array.from({length:s.sdTotal},(_,i)=>
    `<div class="sd-pip${i<s.sdUsed?' used':''}" onclick="useSD(${id})">${i<s.sdUsed?'':'к8'}</div>`
  ).join('');
}

// ── Sidebar ───────────────────────────────────────────────────────────────
const m = v => { const r=Math.floor((v-10)/2); return (r>=0?'+':'')+r; };

function sidebarGroupLabel(text, extraHtml){
  const lbl = document.createElement('div');
  lbl.className = 'sb-group-label';
  lbl.innerHTML = '<span>' + text + '</span>' + (extraHtml || '');
  return lbl;
}

function renderSidebarNpcButton(c, mode){
  const s = getState(c.id);
  const hiHtml = c.hiIcon==='throne'?'<span class="hi-badge throne">△</span>':
    c.hiIcon==='unity'?'<span class="hi-badge unity">⊙</span>':
    c.hiIcon==='guild'?'<span class="hi-badge guild">◇</span>':'';
  const btn = document.createElement('div');
  btn.className = 'npc-btn ty-' + c.ty + (Number(c.id)===Number(curNPC)?' active':'') + (c.isClone?' npc-btn-clone':'');
  btn.dataset.npcid = c.id;
  const pct = Math.max(0,s.curHp/c.co.hp*100);
  const clLabel = c.isClone ? (baseNpcLabel(c) + ' #' + c.cloneNo) : ((c.tags[0]||'') + (c.tags[1]&&!String(c.tags[1]).startsWith('Ур.')?' / '+c.tags[1]:''));
  const nameLabel = c.isClone ? ((getNpcById(c.baseId)||{}).sh || 'Копия') : (c.sh !== c.tags[0] && c.sh !== (c.tags[0]+'-'+c.tags[1]) ? c.sh : '');
  // На левой панели не показываем кнопку создания копии у базовых NPC,
  // чтобы не накладывалась на иконки/бейджи. Копия создаётся только из карточки персонажа.
  const actionHtml = c.isClone
    ? '<button class="npc-copy-btn npc-copy-remove" title="Удалить копию из сцены" onclick="event.stopPropagation(); removeEncounterClone('+c.id+')">×</button>'
    : '';
  btn.innerHTML = '<span class="npc-btn-icon">'+c.ic+'</span>'+
    '<span class="npc-btn-info">'+
      '<span class="npc-btn-name">'+clLabel+'</span>'+
      '<span class="npc-btn-sub">'+(nameLabel ? nameLabel+' · ' : '')+c.na+'</span>'+
      '<div class="npc-btn-hp"><div class="npc-btn-hp-fill '+hpColor(s.curHp,c.co.hp)+'" style="width:'+pct+'%"></div></div>'+
      '<div class="cond-badges">'+s.conditions.map(k=>'<span class="cond-badge cb-'+k+'">'+(COND_LABELS[k]||k)+'</span>').join('')+'</div>'+
    '</span>'+hiHtml+actionHtml+'<span class="npc-btn-lv">'+c.lv+'</span>';
  btn.onclick = () => showNPC(c.id);
  return btn;
}

function buildSidebar() {
  const sb = document.getElementById('sb');
  const search = document.getElementById('sb-search').value.toLowerCase();
  const baseList = CS.filter(c => !c.isClone);
  const filtered = baseList.filter(c => {
    if (!search) return true;
    return c.sh.toLowerCase().includes(search) || c.na.toLowerCase().includes(search) ||
      c.ti.toLowerCase().includes(search) || c.tags.some(t=>t.toLowerCase().includes(search));
  });

  document.getElementById('sb-count').textContent = filtered.length + ' / ' + baseList.length + ' базовых · копий: ' + ENCOUNTER_CLONES.length;
  sb.innerHTML = '';

  if (ENCOUNTER_CLONES.length) {
    sb.appendChild(sidebarGroupLabel('Сцена боя · копии', '<button class="enc-clear-btn" onclick="event.stopPropagation(); clearEncounterClonesOnly()" title="Удалить все копии NPC">очистить</button>'));
    ENCOUNTER_CLONES.slice().sort((a,b)=>Number(a.id)-Number(b.id)).forEach(c => sb.appendChild(renderSidebarNpcButton(c, 'clone')));
  }

  let groups = {};
  if (groupBy === 'lv') {
    filtered.sort((a,b)=>a.lv-b.lv).forEach(c => { const k = 'Ур. '+c.lv; (groups[k]=groups[k]||[]).push(c); });
  } else if (groupBy === 'na') {
    filtered.sort((a,b)=>a.na.localeCompare(b.na)).forEach(c => { (groups[c.na]=groups[c.na]||[]).push(c); });
  } else {
    filtered.sort((a,b)=>(a.tags[0]||'').localeCompare(b.tags[0]||'')).forEach(c => { const k = c.tags[0]||c.sh; (groups[k]=groups[k]||[]).push(c); });
  }

  Object.entries(groups).forEach(([gname, list]) => {
    if (Object.keys(groups).length > 1 || ENCOUNTER_CLONES.length) sb.appendChild(sidebarGroupLabel(gname));
    list.forEach(c => sb.appendChild(renderSidebarNpcButton(c, 'base')));
  });
}

function filterSidebar() { buildSidebar(); }
function setGroup(g) {
  groupBy = g;
  ['lv','na','sh'].forEach(k => document.getElementById('grp-'+k).classList.toggle('active', k===g));
  buildSidebar();
}


// ── Weave full-description modal / tooltip ───────────────────────────────
function normalizeWeaveName(name){
  return String(name || '')
    .replace(/[⚡⛔✅❌⭐]/g,'')
    .replace(/\[[^\]]*\]/g,'')
    .replace(/\([^)]*(?:ур\.|НЕДОСТУПЕН|кантрип|слот|аффинитет)[^)]*\)/gi,'')
    .replace(/\([^)]*\)/g, function(m){
      // Keep English aliases out of key; catalog titles may include them, lookup handles both.
      return '';
    })
    .replace(/ё/g,'е').replace(/Ё/g,'Е')
    .replace(/\s+/g,' ')
    .trim()
    .toLowerCase();
}

function getWeaveIndex(){
  if (window.__WOT_WEAVE_INDEX) return window.__WOT_WEAVE_INDEX;
  const index = new Map();
  (window.WOT_WEAVES || []).forEach(w => {
    const full = normalizeWeaveName(w.title);
    index.set(full, w);
    const noAlias = normalizeWeaveName(String(w.title).replace(/\([^)]*\)/g,''));
    index.set(noAlias, w);
  });
  // Common aliases from NPC sheets to catalog names.
  const alias = {
    'подслушать':'подслушивание',
    'анализ земли':'анализ почвы',
    'уровнять землю':'выровнять землю',
    'выровнять матрицу':'выравнивание матрицы',
    'огненный меч':'огненный жезл',
    'охр. от порожд. тени':'охрана от порождений тени',
    'охрана от тени':'охрана от порождений тени',
    'охр. от направляющих':'охрана от направляющих',
    'охр. от единой силы':'охрана от единой силы',
    'сокрытие направления':'сокрытие способности направлять',
    'защитный купол':'охрана от единой силы',
    'предложение':'влияние',
    'исцелить':'исцеление',
    'создать огонь':'создать огонь',
    'воздушный кулак':'воздушный кулак',
    'огненный шар':'огненный шар',
    'каменный вихрь':'каменный вихрь',
    'расколотая земля':'расколотая земля',
    'маскировка':'маскировка',
    'свернутый свет':'свернутый свет',
    'узы стража':'узы стража',
    'принуждение':'принуждение',
    'влияние':'влияние'
  };
  Object.entries(alias).forEach(([a,b]) => {
    const target = index.get(normalizeWeaveName(b));
    if (target) index.set(normalizeWeaveName(a), target);
  });
  window.__WOT_WEAVE_INDEX = index;
  return index;
}

function findWeaveByName(name){
  const key = normalizeWeaveName(name);
  const idx = getWeaveIndex();
  if (idx.has(key)) return idx.get(key);
  // fallback: substring match both ways
  for (const [k,w] of idx.entries()){
    if (key && (k.includes(key) || key.includes(k))) return w;
  }
  return null;
}

function weaveInfoButton(spName){
  const w = findWeaveByName(spName);
  if (!w) return '<button class="sp-info-btn missing" title="Описание не найдено в каталоге Плетений" type="button">?</button>';
  const safeName = String(spName).replace(/"/g,'&quot;').replace(/'/g,'&#39;');
  return `<button class="sp-info-btn" title="Показать полное описание из раздела Плетения" type="button" onmouseenter="showWeaveModal('${safeName}', event, true)" onfocus="showWeaveModal('${safeName}', event, true)" onclick="showWeaveModal('${safeName}', event, false)">i</button>`;
}

function renderWeaveModalContent(w){
  const lvl = w.level === 0 ? 'Кантрип' : `${w.level}-й уровень`;
  const powers = (w.powers || []).map(p=>`<span>${p}</span>`).join('');
  const meta = (w.meta || []).map(m=>`<div><b>${m.label}</b><em>${m.value}</em></div>`).join('');
  const desc = (w.desc || []).map(p=>`<p>${p}</p>`).join('');
  const upcast = (w.upcast && w.upcast.length)
    ? `<div class="weave-pop-upcast"><strong>На более высоких уровнях</strong>${w.upcast.map(p=>`<p>${p}</p>`).join('')}</div>`
    : '';
  return `<button class="weave-pop-close" onclick="hideWeaveModal()">×</button>
    <div class="weave-pop-kicker">${lvl} · ${w.school} · ${w.rarity}</div>
    <h3>${w.title}</h3>
    <div class="weave-pop-powers">${powers}</div>
    <div class="weave-pop-meta">${meta}</div>
    <div class="weave-pop-desc">${desc}</div>
    ${upcast}`;
}

function showWeaveModal(spName, event, hoverMode){
  const w = findWeaveByName(spName);
  if (!w) return;
  let pop = document.getElementById('weave-popover');
  if (!pop){
    pop = document.createElement('div');
    pop.id = 'weave-popover';
    pop.className = 'weave-popover';
    document.body.appendChild(pop);
    pop.addEventListener('mouseenter',()=>{ pop.dataset.hover='1'; });
    pop.addEventListener('mouseleave',()=>{ pop.dataset.hover='0'; setTimeout(()=>{ if(pop.dataset.locked!=='1') hideWeaveModal(); }, 120); });
  }
  pop.innerHTML = renderWeaveModalContent(w);
  pop.style.display = 'block';
  pop.dataset.locked = hoverMode ? '0' : '1';

  const btn = event && event.currentTarget ? event.currentTarget : null;
  const r = btn ? btn.getBoundingClientRect() : {left:innerWidth/2, top:innerHeight/2, bottom:innerHeight/2};
  const width = Math.min(460, window.innerWidth - 24);
  let left = Math.min(window.innerWidth - width - 12, Math.max(12, r.left - width/2 + 12));
  let top = r.bottom + 10;
  if (top + 420 > window.innerHeight) top = Math.max(12, r.top - 420);
  pop.style.width = width + 'px';
  pop.style.left = left + 'px';
  pop.style.top = top + 'px';
}

function hideWeaveModal(){
  const pop = document.getElementById('weave-popover');
  if (pop) { pop.style.display = 'none'; pop.dataset.locked='0'; }
}

document.addEventListener('click', function(e){
  const pop = document.getElementById('weave-popover');
  if (!pop || pop.style.display === 'none') return;
  if (!pop.contains(e.target) && !e.target.classList.contains('sp-info-btn')) hideWeaveModal();
});
document.addEventListener('keydown', function(e){ if(e.key === 'Escape') { hideWeaveModal(); hideClassFeatureModal(); } });

// ── Class feature modal / lookup from classes.html data ─────────────────────
function normalizeFeatureName(name){
  let s = String(name || '')
    .replace(/[⚡⛔✅❌⭐★]/g,'')
    .replace(/\([^)]*(?:ур\.|НЕДОСТУП|крит|слот)[^)]*\)/gi,'')
    .replace(/\([^)]*\)/g,'')
    .replace(/\d+\s*[кkдd]\s*\d+/gi,'')
    .replace(/\d+\s*[кkдd]\b/gi,'')
    .replace(/×\d+/g,'')
    .replace(/\bур\.?\s*\d+\b/gi,'')
    .replace(/:.*/,'')
    .replace(/ё/g,'е').replace(/Ё/g,'Е')
    .replace(/\s+/g,' ')
    .trim()
    .toLowerCase();
  s = s.replace(/доп\.?\s+/g,'дополнительная ')
       .replace(/улучш\.?\s+/g,'улучшенный ')
       .replace(/тяж\.?\s+/g,'тяжелых ')
       .replace(/сред\.?\s+/g,'средних ')
       .replace(/скрытная атака/g,'скрытая атака')
       .replace(/всплеск действий/g,'всплеск действия')
       .replace(/безмозглая ярость/g,'бездумная ярость')
       .replace(/инстинктивная ловкость/g,'дикий инстинкт')
       .replace(/\s+/g,' ')
       .trim();
  return s;
}
function escHtml(v){
  return String(v ?? '').replace(/[&<>'"]/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[ch]));
}
function npcClassContexts(c){
  const text = [c.sh, c.ti].concat(c.tags || []).join(' ').toLowerCase();
  const ctx = [];
  const add = (className, archetype) => ctx.push({className, archetype});
  if (text.includes('скиталец')) {
    let a = text.includes('ассасин') ? 'Ассасин (Assassin)' : text.includes('охотник за ворами') ? 'Охотник за ворами (Thief Taker)' : text.includes('вор') ? 'Вор (Thief)' : text.includes('менестр') ? 'Менестрель (Gleeman)' : null;
    add('Скиталец', a);
  }
  if (text.includes('мастер меча')) add('Мастер по оружию','Мастер Меча (Blademaster)');
  else if (text.includes('чемпион')) add('Мастер по оружию','Архетип: Чемпион (Champion)');
  else if (text.includes('командир') || text.includes('мастер по оружию') || text.includes('мечник')) add('Мастер по оружию',null);
  if (text.includes('дичок')) add('Дичок', null);
  if (text.includes('посвящ') || text.includes('аша') || text.includes('айз седай') || text.includes('ищущ')) add('Посвящённый', text.includes('аша') ? "Аша'ман (Asha'man)" : text.includes('айз седай') ? 'Айз Седай' : null);
  if (text.includes('лесник')) {
    const a = text.includes('разведчик') ? 'Разведчик' : text.includes('охотник') ? 'Охотник' : text.includes('мастер зверей') ? 'Мастер зверей' : null;
    add('Лесник', a);
  }
  if (text.includes('варвар') || text.includes('берсерк')) add('Варвар', text.includes('берсерк') ? 'Путь Берсерка' : null);
  if (text.includes('благород')) add('Благородный', null);
  return ctx;
}
function findClassFeatureForNpc(c, abilityName){
  const db = window.WOT_CLASSES_DB || {features:[]};
  const key = normalizeFeatureName(abilityName);
  if (!key) return null;
  const contexts = npcClassContexts(c);
  const candidates = db.features.filter(f => {
    const fKey = normalizeFeatureName(f.feature);
    if (!fKey) return false;
    const nameMatch = fKey === key || fKey.includes(key) || key.includes(fKey);
    if (!nameMatch) return false;
    if (!contexts.length) return true;
    return contexts.some(ctx => {
      if (ctx.className && f.className !== ctx.className) return false;
      if (ctx.archetype && !(/базов/i.test(f.archetype||'')) && f.archetype !== ctx.archetype) return false;
      return true;
    });
  });
  if (candidates.length) {
    candidates.sort((a,b) => {
      const aBase = /базов/i.test(a.archetype||'') ? 0 : 1;
      const bBase = /базов/i.test(b.archetype||'') ? 0 : 1;
      return aBase - bBase || (Number(a.levelSort||999)-Number(b.levelSort||999));
    });
    return candidates[0];
  }
  return null;
}

function findExtraFeatForNpc(c, abilityName){
  const db = window.WOT_FEATS_DB || {feats:[]};
  const key = normalizeFeatureName(abilityName);
  if(!key) return null;
  const text = [c.sh, c.ti].concat(c.tags || []).join(' ').toLowerCase();
  const candidates = (db.feats || []).filter(f => {
    const fKey = normalizeFeatureName(f.name);
    if(!fKey) return false;
    const nameMatch = fKey === key || fKey.includes(key) || key.includes(fKey);
    if(!nameMatch) return false;
    const cls = String(f.cls || '').toLowerCase();
    if(!cls || cls === '—' || cls === '-' || cls === 'любой') return true;
    if(cls.includes('направля')) return text.includes('направля') || text.includes('дичок') || text.includes('ашаман') || text.includes('айз седай');
    if(cls.includes('лесник')) return text.includes('лесник') || text.includes('следопыт');
    return text.includes(cls);
  });
  if(!candidates.length) return null;
  candidates.sort((a,b)=>String(a.book||'').localeCompare(String(b.book||''),'ru'));
  return candidates[0];
}
function findFeatureInfoForNpc(c, abilityName){
  const cls = findClassFeatureForNpc(c, abilityName);
  if(cls) return {source:'classes.html', type:'class', data:cls};
  const feat = findExtraFeatForNpc(c, abilityName);
  if(feat) return {source:'feats.html', type:'feat', data:feat};
  return null;
}

function classFeatureInfoButton(npcId, abilityName){
  return '<button class="sp-info-btn feature-info-btn" title="Показать полное описание черты из classes.html / feats.html" type="button" '+
    'data-npc-id="'+escHtml(npcId)+'" data-feature-name="'+escHtml(abilityName)+'">i</button>';
}

let classFeatureHideTimer = null;
function scheduleClassFeatureHide(){
  clearTimeout(classFeatureHideTimer);
  classFeatureHideTimer = setTimeout(() => {
    const pop = document.getElementById('class-feature-popover');
    if(!pop || pop.dataset.locked === '1' || pop.dataset.hover === '1') return;
    hideClassFeatureModal();
  }, 140);
}
function relatedClassFeatureRows(f){
  const db = window.WOT_CLASSES_DB || {features:[]};
  if(!f) return [];
  const parentKey = normalizeFeatureName(f.feature);
  return db.features.filter(x => {
    if (String(x.id) === String(f.id)) return false;
    if (x.className !== f.className) return false;
    if ((x.archetype || '') !== (f.archetype || '')) return false;
    const xParent = normalizeFeatureName(x.parent || '');
    const xFeature = normalizeFeatureName(x.feature || '');
    return xParent === parentKey || (x.parent && parentKey && parentKey === xFeature);
  }).sort((a,b)=>(Number(a.levelSort||999)-Number(b.levelSort||999)) || String(a.feature).localeCompare(String(b.feature),'ru'));
}
function renderClassFeatureModalContent(found, c, abilityName){
  if(found && found.type === 'class'){
    const f = found.data;
    const desc = String(f.description || '').split(/\n+/).filter(Boolean).map(p=>'<p>'+escHtml(p)+'</p>').join('');
    const related = relatedClassFeatureRows(f);
    const relatedHtml = related.length ? '<div class="weave-pop-upcast"><strong>Связанные уточнения / развитие черты</strong>'+
      related.map(r => '<p><b>'+escHtml(r.feature)+'</b>'+(r.levels ? ' · ур. '+escHtml(r.levels) : '')+'</p>'+
        String(r.description || '').split(/\n+/).filter(Boolean).map(p=>'<p>'+escHtml(p)+'</p>').join('')).join('')+
      '</div>' : '';
    return '<button class="weave-pop-close" onclick="hideClassFeatureModal()">×</button>'+
      '<div class="weave-pop-kicker">'+escHtml(f.className)+' · '+escHtml(f.archetype || 'Базовый класс')+' · ур. '+escHtml(f.levels || '—')+'</div>'+
      '<h3>'+escHtml(f.feature)+'</h3>'+
      '<div class="weave-pop-meta"><div><b>Категория</b><em>'+escHtml(f.category || 'Черта')+'</em></div><div><b>Источник</b><em>classes.html</em></div></div>'+
      '<div class="weave-pop-desc">'+desc+'</div>'+relatedHtml;
  }
  if(found && found.type === 'feat'){
    const f = found.data;
    const desc = (Array.isArray(f.desc) ? f.desc : [f.desc]).filter(Boolean).map(p=>'<p>'+escHtml(p)+'</p>').join('');
    return '<button class="weave-pop-close" onclick="hideClassFeatureModal()">×</button>'+
      '<div class="weave-pop-kicker">Дополнительная черта · '+escHtml(f.book || '—')+'</div>'+
      '<h3>'+escHtml(f.name)+'</h3>'+
      '<div class="weave-pop-meta"><div><b>Требование</b><em>'+escHtml(f.req || '—')+'</em></div><div><b>Класс</b><em>'+escHtml(f.cls || '—')+'</em></div><div><b>Источник</b><em>feats.html</em></div></div>'+
      '<div class="weave-pop-desc">'+desc+'</div>';
  }
  const fallback = (c.ab||[]).find(a => normalizeFeatureName(a.n) === normalizeFeatureName(abilityName));
  const fallbackDesc = fallback ? fallback.d : 'Для этой записи нет точного совпадения в базе классов или дополнительных черт.';
  return '<button class="weave-pop-close" onclick="hideClassFeatureModal()">×</button>'+
    '<div class="weave-pop-kicker">Описание не найдено в classes.html / feats.html</div>'+
    '<h3>'+escHtml(abilityName)+'</h3>'+
    '<div class="weave-pop-desc">'+String(fallbackDesc || '').split(/\n+/).filter(Boolean).map(p=>'<p>'+escHtml(p)+'</p>').join('')+'</div>';
}
function showClassFeatureModal(npcId, abilityName, event, hoverMode){
  const c = getNpcById(npcId);
  if(!c) return;
  const f = findFeatureInfoForNpc(c, abilityName);
  let pop = document.getElementById('class-feature-popover');
  if(!pop){
    pop = document.createElement('div');
    pop.id = 'class-feature-popover';
    pop.className = 'weave-popover class-feature-popover';
    document.body.appendChild(pop);
    pop.addEventListener('mouseenter',()=>{ pop.dataset.hover='1'; clearTimeout(classFeatureHideTimer); });
    pop.addEventListener('mouseleave',()=>{ pop.dataset.hover='0'; if(pop.dataset.locked !== '1') scheduleClassFeatureHide(); });
  }
  clearTimeout(classFeatureHideTimer);
  pop.innerHTML = renderClassFeatureModalContent(f, c, abilityName);
  pop.style.display = 'block';
  pop.dataset.locked = hoverMode ? '0' : '1';
  pop.dataset.hover = '0';
  const btn = event && event.currentTarget ? event.currentTarget : null;
  if(btn){
    const r = btn.getBoundingClientRect();
    const w = Math.min(560, window.innerWidth - 24);
    let top = r.bottom + 8;
    if (top + 420 > window.innerHeight) top = Math.max(12, r.top - 420);
    pop.style.width = w + 'px';
    pop.style.left = Math.min(window.innerWidth - w - 12, Math.max(12, r.left - w + 28)) + 'px';
    pop.style.top = top + 'px';
  }
}
function hideClassFeatureModal(){
  const pop=document.getElementById('class-feature-popover');
  if(pop){ pop.style.display='none'; pop.dataset.locked='0'; pop.dataset.hover='0'; }
}

// Delegated handlers for feature info buttons. Avoid inline JS: feature names may contain apostrophes.
document.addEventListener('mouseover', e => {
  const btn = e.target.closest && e.target.closest('.feature-info-btn');
  if(!btn) return;
  showClassFeatureModal(Number(btn.dataset.npcId), btn.dataset.featureName || '', {currentTarget: btn}, true);
});
document.addEventListener('mouseout', e => {
  const btn = e.target.closest && e.target.closest('.feature-info-btn');
  if(!btn) return;
  const pop = document.getElementById('class-feature-popover');
  if(pop && e.relatedTarget && (pop.contains(e.relatedTarget) || btn.contains(e.relatedTarget))) return;
  scheduleClassFeatureHide();
});
document.addEventListener('focusin', e => {
  const btn = e.target.closest && e.target.closest('.feature-info-btn');
  if(!btn) return;
  showClassFeatureModal(Number(btn.dataset.npcId), btn.dataset.featureName || '', {currentTarget: btn}, true);
});
document.addEventListener('click', e => {
  const btn = e.target.closest && e.target.closest('.feature-info-btn');
  if(!btn) return;
  e.preventDefault();
  showClassFeatureModal(Number(btn.dataset.npcId), btn.dataset.featureName || '', {currentTarget: btn}, false);
});

// ── Show NPC ─────────────────────────────────────────────────────────────
const lvClass = lv => lv<=1?'sp-lv1':lv===2?'sp-lv2':lv===3?'sp-lv3':lv===4?'sp-lv4':lv>=5&&lv<=6?'sp-lv5':lv>=7&&lv<=8?'sp-lv7':'sp-lv9';

function parseSignedBonus(v){
  const m = String(v || '').match(/[+\-]?\d+/);
  return m ? parseInt(m[0], 10) : 0;
}
function getSkillBonus(c, names){
  const list = Array.isArray(names) ? names : [names];
  const sk = (c.sk || []).find(x => list.some(n => String(x.n || '').toLowerCase().includes(String(n).toLowerCase())));
  return sk ? parseSignedBonus(sk.v) : null;
}
function getPassiveInsight(c){
  const insight = getSkillBonus(c, ['Проницательность']);
  if (insight !== null) return 10 + insight;
  return 10 + Math.floor((((c.st && c.st.wis) || 10) - 10) / 2);
}
function canUseStealthQuickRoll(c){
  return !!(c && c.sk && c.sk.some(x => String(x.n || '').toLowerCase().includes('скрытность')) &&
    (c.tags || []).some(t => /Скиталец|Лесник/i.test(t)));
}
function getSneakAttackExpr(c){
  const sources = [c && c.co && c.co.cr, ...((c && c.ab) || []).flatMap(a => [a.n, a.d])].filter(Boolean).join(' · ');
  const m = sources.match(/(?:СА|Скрытн(?:ая|ая)? атака|Скрытая атака)\s*(\d+к\d+)/i) || sources.match(/(\d+к\d+)\s*(?:СА|скрытн|скрыт)/i);
  return m ? m[1] : null;
}

function showNPC(id) {
  curNPC = id;
  buildSidebar(); // update active state
  const c = getNpcById(id);
  const s = getState(id);
  const main = document.getElementById('mn');
  const ph = document.getElementById('placeholder');
  if (ph) ph.style.display = 'none';

  const hasSpells = !!(c.spells || c.slots);
  const hasForms = !!c.hasForms;
  const hasTalents = !!(c.excTalents && c.excTalents.length);
  const hasSD = c.co.cr && /\d+к8.*Превосх/.test(c.co.cr);

  const tabs = ['battle','overview','abilities','equipment'].concat(hasForms?['forms']:[]).concat(hasSpells?['spells']:[]).concat(hasTalents?['talents']:[]);
  const tabLabels = {'battle':'⚔ Бой','overview':'📊 Обзор','abilities':'✨ Черты','equipment':'🎒 Снар.','forms':'🗡 Формы','spells':'🌀 Плетения','talents':'🌟 Таланты'};

  let html = `
<div class="combat-panel" id="combat-panel-${id}">
  <span class="cp-name">${c.ic} ${(c.tags[0]||"")+(c.tags[1]&&!c.tags[1].startsWith("Ур.")?" / "+c.tags[1]:"")+(c.sh&&c.sh!==c.tags[0]?" · "+c.sh:"")}</span>
  <div class="cp-hp-block">
    <span class="cp-hp-label">ОЗ</span>
    <span class="cp-hp-cur ${hpColor(s.curHp,c.co.hp).replace('hp-','')}" id="cp-hp-cur" onclick="openHpModal(${id})">${s.curHp}</span>
    <span class="cp-hp-sep">/</span>
    <span class="cp-hp-max">${c.co.hp}</span>
    <div class="cp-hp-bar"><div class="cp-hp-fill ${hpColor(s.curHp,c.co.hp)}" id="cp-hp-fill" style="width:${Math.max(0,s.curHp/c.co.hp*100)}%"></div></div>
  </div>
  <button class="cp-dmg-btn" onclick="openHpModal(${id})">−ОЗ</button>
  <button class="cp-heal-btn" onclick="openHpModal(${id})">+ОЗ</button>
  <button class="cp-reset-btn" onclick="resetHP(${id})" title="Восстановить полные ОЗ">↺</button>
  ${c.isClone ? `<button class="cp-reset-btn cp-clone-remove" onclick="removeEncounterClone(${id})" title="Удалить эту копию из сцены">× копия</button>` : `<button class="cp-reset-btn cp-clone-add" onclick="addEncounterClone(${id})" title="Создать ещё одну копию этого NPC">＋ копия</button>`}
  ${c.custom && !c.isClone ? `<button class="cp-reset-btn cp-custom-remove" onclick="deleteCustomNpcFromBrowser(${id})" title="Удалить пользовательского NPC из этого браузера">× удалить NPC</button>` : ``}
  <div class="cp-ac-box"><div class="cp-ac-val">${c.co.ac}</div><div class="cp-ac-lbl">КД</div></div>
  <div class="cp-ini-box" onclick="addToIni(${id})" title="Добавить в трекер инициативы"><div class="cp-ini-val">${c.co.ini}</div><div class="cp-ini-lbl">Иниц.</div></div>
  <div class="cp-sp-box"><div class="cp-sp-val">${c.co.sp} фт</div><div class="cp-sp-lbl">Скор.</div></div>
  <div class="cp-pass-box" title="Пассивное восприятие"><div class="cp-pass-val">${c.co.pp}</div><div class="cp-pass-lbl">Пасс ВСПР</div></div>
  <div class="cp-pass-box" title="Пассивная проницательность"><div class="cp-pass-val">${getPassiveInsight(c)}</div><div class="cp-pass-lbl">Пасс ПРН</div></div>
  <div class="cond-panel">
    ${COND_KEYS.map(k=>`<button class="cond-toggle${s.conditions.includes(k)?' on-'+k:''}" id="ct-${k}" onclick="toggleCondition(${id},'${k}')">${COND_LABELS[k]}</button>`).join('')}
  </div>
</div>`;

  // Initiative tracker
  html += `<div class="ini-tracker" id="ini-tracker">
  <span class="ini-tracker-label">Инициатива:</span>
  ${iniOrder.length ? iniOrder.map((e,i)=>{
    const nc=getNpcById(e.id);
    return `<div class="ini-slot${i===iniCurrent?' current':''}" onclick="iniJump(${i})">${nc?nc.ic:'?'} <span class="ini-slot-name">${nc?nc.sh.split(' ')[0]:'?'}</span><span class="ini-slot-val">${e.val}</span></div>`;
  }).join('') : '<span style="color:var(--text3);font-size:10px">Нажмите на Иниц. чтобы добавить NPC</span>'}
  ${iniOrder.length?`<button class="ini-next-btn" onclick="iniNext()">→ След.</button><button class="ini-clear-btn" onclick="iniClear()">✕</button>`:''}
</div>`;

  html += `<div class="sheet">
<div class="sheet-header ty-${c.ty}">
  <div class="sh-row1"><span class="sh-icon">${c.ic}</span><div>
    <div class="sh-title">${c.ti}</div>
    <div class="sh-sub">${c.su}</div>
  </div></div>
  <div class="sh-tags">${c.tags.map(t=>`<span class="tag tag-${c.ty}">${t}</span>`).join('')}</div>
</div>
<div class="tabs" id="tabs_${id}">
  ${tabs.map((t,ti)=>`<button class="tab-btn${ti===0?' active':''}" onclick="switchTab(${id},'${t}')">${tabLabels[t]}</button>`).join('')}
</div>`;

  // ── TAB: BATTLE ──────────────────────────────────────────────────────
  html += `<div class="tab-content active" id="tab_${id}_battle">`;

  // Rest + round buttons
  html += `<div class="rest-row">
  <button class="new-round-btn" onclick="newRound(${id})">🔄 Новый раунд</button>
  <button class="short-rest-btn" onclick="shortRest(${id})">☕ Кор. отдых</button>
  <button class="long-rest-btn" onclick="longRest(${id})">🌙 Долг. отдых</button>
  </div>`;

  // Dice buttons
  html += `<div class="sec"><div class="sec-h">Кубики</div>
<div class="dice-btns">
  ${['1к4','1к6','1к8','1к10','1к12','1к20','2к6','1к20+0'].map(d=>`<button class="dice-btn" onclick="rollDice('${d}','${d}')">${d}</button>`).join('')}
  <span class="dice-output" id="dice-out">—</span>
</div></div>`;

  // Quick skill / precision damage tools
  const saExpr = getSneakAttackExpr(c);
  const stealthBonus = getSkillBonus(c, 'Скрытность');
  if (saExpr || canUseStealthQuickRoll(c)) {
    html += `<div class="quick-combat-row">`;
    if (saExpr) {
      html += `<button class="quick-roll-btn quick-sa" onclick="rollSADmg(${id},'${saExpr}')">🎲 Скрытая атака ${saExpr}</button>
        <span class="quick-note">отдельно: применять только когда есть преимущество/союзник у цели</span>`;
    }
    if (canUseStealthQuickRoll(c)) {
      html += `<button class="quick-roll-btn quick-stealth" onclick="rollSkillInline(${id},'Скрытность',${stealthBonus || 0})">🕶 Скрытность ${stealthBonus>=0?'+':''}${stealthBonus}</button>`;
    }
    html += `</div>`;
  }

  // Attack cards
  html += `<div class="sec"><div class="sec-h">Атаки
    <button class="roll-all-btn" onclick="rollAllAtk(${id})" title="Бросить все атаки сразу">⚡ Все атаки</button>
  </div>
  <div class="atk-inline-log" id="atk-log-${id}"></div>
  <div class="battle-grid">`;
  const parseAtk = (a) => { const m = a.match(/^([+\-]\d+)/); return m ? parseInt(m[1]) : 0; };
  c.at.forEach((atk, ai) => {
    const bonus = parseAtk(atk.a);
    const dmgSafe = atk.d.replace(/'/g,"\\'");
    const nameSafe = atk.n.replace(/'/g,"\\'");
    const canCrit = /^[+\-]\d+/.test(String(atk.a || ''));
    html += `<div class="atk-card" id="atk-card-${id}-${ai}">
<div class="atk-card-header">
  <span class="atk-name">${atk.n}</span>
  <span class="atk-type">${atk.t||'—'}</span>
  <span class="atk-range">${atk.r||'—'}</span>
</div>
<div class="atk-btn-row">
  <button class="atk-roll-btn" onclick="rollAtkInline(${id},${ai},${bonus},'${nameSafe}','${dmgSafe}',false)">⚔ ${atk.a}</button>
  <button class="atk-dmg-btn" onclick="rollDmgInline(${id},${ai},'${dmgSafe}','${nameSafe}',false)">🎲 ${atk.d}</button>
  ${canCrit ? `<button class="atk-crit-btn" onclick="rollDmgInline(${id},${ai},'${dmgSafe}','${nameSafe}',true)">💥</button>` : ''}
</div>
<div class="atk-inline-result" id="atk-res-${id}-${ai}"></div>
<div class="atk-note">${atk.no||''}</div>
</div>`;
  });
  html += `</div></div>`;

  // Slots (clickable)
  if (c.slots) {
    html += `<div class="sec"><div class="sec-h">Ячейки плетений</div>
<div class="slots-block">
<div class="slots-row">`;
    c.slots.forEach(slot => {
      const st = s.slots[slot.lv] || {total:slot.n, used:0};
      html += `<div class="slot-group">
<div class="slot-lv">${slot.lv}</div>
<div class="slot-pips" id="slot-pips-${id}-${slot.lv}">
${Array.from({length:st.total},(_,i)=>`<div class="slot-pip${i<st.used?' used':''}" onclick="useSlot(${id},'${slot.lv}')"></div>`).join('')}
</div>
<div class="slot-count" id="slot-cnt-${id}-${slot.lv}">${st.total-st.used}/${st.total}</div>
</div>`;
    });
    html += `</div></div></div>`;
  }

  // Superiority dice
  if (hasSD) {
    const sdM = c.co.cr.match(/(\d+)к8.*Превосх/);
    const sdN = sdM ? parseInt(sdM[1]) : 0;
    if (!STATE[id]) getState(id); STATE[id].sdTotal = sdN;
    html += `<div class="sec"><div class="sec-h">Кости превосходства</div>
<div class="sd-block">
<div class="sd-pips" id="sd-pips-${id}">
${Array.from({length:sdN},(_,i)=>`<div class="sd-pip${i<s.sdUsed?' used':''}" onclick="useSD(${id})">${i<s.sdUsed?'':'к8'}</div>`).join('')}
</div>
<button class="cp-reset-btn" style="margin-top:5px" onclick="resetSD(${id})">↺ Восстановить</button>
</div></div>`;
  }

  html += `</div>`; // end battle tab

  // ── TAB: OVERVIEW ────────────────────────────────────────────────────
  html += `<div class="tab-content" id="tab_${id}_overview">
<div class="stats-grid">
${['СИЛ','ТЕЛ','ЛОВ','ИНТ','МДР','ХАР'].map((name,si)=>{
  const keys=['str','con','dex','int','wis','cha'];
  const val=c.st[keys[si]];
  return `<div class="stat-box"><div class="stat-name">${name}</div><div class="stat-val">${val}</div><div class="stat-mod">${m(val)}</div></div>`;
}).join('')}
</div>
<div class="core-grid">
  <div class="core-box"><span style="font-size:10px;color:var(--text3)">Спасброски</span><span class="core-val" style="font-size:11px">${c.co.sv}</span></div>
  <div class="core-box"><span style="font-size:10px;color:var(--text3)">Бонус умения</span><span class="core-val">${c.co.prof}</span></div>
  <div class="core-box passive-core"><span class="core-label">Пасс ВСПР<br><em>пассивное восприятие</em></span><span class="core-val big">${c.co.pp}</span></div>
  <div class="core-box passive-core"><span class="core-label">Пасс ПРН<br><em>пассивная проницательность</em></span><span class="core-val big">${getPassiveInsight(c)}</span></div>
  <div class="core-box core-wide"><span style="font-size:10px;color:var(--text3)">Особенности</span><span class="core-val" style="font-size:10px;color:var(--gold2)">${c.co.cr}</span></div>
</div>
${c.hi ? renderHi(c.hi) : ''}
${c.angrial ? renderAngrial(c.angrial) : ''}
<div class="sec"><div class="sec-h">Навыки</div>
<div class="sk-grid">${c.sk.map(sk=>`<div class="sk-item${sk.e?' expert':''}"><span class="sk-name">${sk.e?'<span class="sk-star">★</span>':''}${sk.n}<span style="font-size:9px;color:var(--text3);margin-left:3px">${sk.note||''}</span></span><span class="sk-val">${sk.v}</span></div>`).join('')}</div></div>
<div class="tact-box"><div class="tact-title">🎯 Тактика</div>
${c.tactics.map(t=>`<div class="tact-phase"><div class="tact-phase-name">${t.ph}</div><div class="tact-desc">${t.d}</div></div>`).join('')}
</div>
<div class="dm-notes"><div class="dm-notes-title">📝 DM заметки</div><div class="dm-note">${c.dm}</div></div>
</div>`;

  // ── TAB: ABILITIES ────────────────────────────────────────────────────
  html += `<div class="tab-content" id="tab_${id}_abilities">
<div class="sec"><div class="sec-h">Черты класса и архетипа</div>
<div class="ab-grid">${c.ab.map(a=>`<div class="ab-card${a.hi?' highlight':''}"><div class="ab-name">${a.n} ${classFeatureInfoButton(id, a.n)}</div><div class="ab-desc">${a.d}</div></div>`).join('')}</div>
</div></div>`;

  // ── TAB: EQUIPMENT ────────────────────────────────────────────────────
  html += `<div class="tab-content" id="tab_${id}_equipment">
<div class="sec"><div class="sec-h">Снаряжение</div>
<div class="eq-list">${c.eq.map(e=>`<div class="eq-item${e.r?' rare':''}">${e.r?'⭐ ':''}${e.t}</div>`).join('')}
</div></div></div>`;

  // ── FORMS ─────────────────────────────────────────────────────────────
  if (hasForms) html += renderFormsTab(id, c);

  // ── SPELLS ────────────────────────────────────────────────────────────
  if (hasSpells) {
    html += `<div class="tab-content" id="tab_${id}_spells">`;
    if (c.angrial) html += renderAngrial(c.angrial);
    if (c.slots) {
      html += `<div class="sec"><div class="sec-h">Ячейки плетений (клик = использовать)</div>
<div class="slots-row">${c.slots.map(sl=>{
  const st=s.slots[sl.lv]||{total:sl.n,used:0};
  return `<div class="slot-box2${st.used>=st.total?' used':''}" onclick="useSlot(${id},'${sl.lv}')">
<div class="slot-lv2">${sl.lv}</div><div class="slot-cnt2" id="slot-cnt-sp-${id}-${sl.lv}">${st.total-st.used}/${st.total}</div></div>`;
}).join('')}</div></div>`;
    }
    if (c.spells) {
      html += `<div class="sec"><div class="sec-h">Плетения</div>
<div style="overflow-x:auto"><table class="sp-table"><thead><tr>
<th>Плетение</th><th>Талант</th><th>Стихии</th><th>Время</th><th>Дальн.</th><th>Длит.</th><th>СБ</th><th>Слот</th><th>Урон</th><th>Описание</th>
</tr></thead><tbody>
${c.spells.map((sp,spi)=>`<tr>
<td class="sp-name ${sp.lv===0?'sp-lv0':lvClass(sp.lv)}"><span class="sp-title">${sp.n}</span> ${weaveInfoButton(sp.n)}</td>
<td class="sp-dc">${sp.tal||'б/т'}</td>
<td><span class="sp-el">${sp.el}</span></td>
<td class="sp-dc">${sp.t}</td><td class="sp-dc">${sp.r||'—'}</td>
<td class="sp-dc">${sp.dur||'Мгн.'}</td><td class="sp-dc">${sp.sb}</td>
<td class="sp-dc">${sp.slot!=null?sp.slot:sp.lv===0?'0':sp.lv+' ур.'}</td>
<td class="sp-dmg">${sp.dmg||'—'}${spellDamageButton(sp.dmg, sp.n)}</td>
<td class="sp-note">${sp.ef}</td></tr>`).join('')}
</tbody></table></div></div>`;
    }
    html += `</div>`;
  }

  // ── TALENTS ───────────────────────────────────────────────────────────
  if (hasTalents) html += renderTalentsTab(id, c);

  html += `</div></div>`; // sheet + app

  main.innerHTML = html;
}


// ── Inline attack rolling ────────────────────────────────────────────────
function rollAtkInline(npcId, atkIdx, bonus, name, dmgExpr, saOn) {
  const d20 = Math.floor(Math.random()*20)+1;
  const total = d20 + bonus;
  const isCrit = d20 === 20, isFumble = d20 === 1;
  const el = document.getElementById('atk-res-'+npcId+'-'+atkIdx);
  if (!el) return;
  let html = '';
  if (isCrit) {
    html = `<span class="r-label">d20 </span><span class="r-d20 r-crit">20 КРИ!</span> — `;
    html += `<button class="atk-crit-btn" style="font-size:11px;padding:2px 6px" onclick="rollDmgInline(${npcId},${atkIdx},'${dmgExpr}','${name}',true)">💥 Крит урон</button>`;
  } else if (isFumble) {
    html = `<span class="r-d20 r-miss">ПРОВАЛ (1)</span>`;
  } else {
    const cls = 'r-hit';
    html = `<span class="r-label">d20[${d20}]+${bonus}= </span><span class="r-d20 ${cls}">${total}</span>`;
  }
  el.innerHTML = html;
  el.className = 'atk-inline-result show' + (isCrit?' r-crit-glow':'');
  
  // Log
  addToAtkLog(npcId, isCrit?`💥 ${name}: КРИ!`:isFumble?`✗ ${name}: ПРОВАЛ`:`⚔ ${name}: ${total} (d20[${d20}]+${bonus})`);
}

function rollDmgInline(npcId, atkIdx, dmgExpr, name, isCrit) {
  const cleanExpr = normalizeDamageExpr(dmgExpr);
  // Parse dice groups (e.g. "1к8", "3к6")
  const parts = (cleanExpr.match(/\d+к\d+/g) || []);
  // Parse flat bonus: +N where N is NOT followed by к (so "+4" yes, "+4к6" no)
  const bonusM = cleanExpr.match(/\+(\d+)(?!к)/g) || [];
  const bonus = bonusM.reduce((s,b) => s + parseInt(b.replace('+','')), 0);

  let allResults = [], sum = 0;
  parts.forEach((p, pi) => {
    const pm = p.match(/(\d+)к(\d+)/);
    // Only double the FIRST dice group on crit (base weapon/spell die)
    // Bonus dice like angrial (+Nк) stay single — they are enhancement, not weapon die
    const n = parseInt(pm[1]) * (isCrit && pi === 0 ? 2 : 1);
    const s = parseInt(pm[2]);
    for (let i=0;i<n;i++) { const r=Math.floor(Math.random()*s)+1; allResults.push(r); sum+=r; }
  });
  sum += bonus;
  
  const el = document.getElementById('atk-res-'+npcId+'-'+atkIdx);
  if (!el) return;
  const prefix = isCrit ? '💥 КРИТ ' : '🎲 ';
  el.innerHTML = `<span class="r-label">${prefix}[${allResults.join('+')}]${bonus?'+'+bonus:''} = </span><span class="r-dmg">${sum}</span>`;
  el.className = 'atk-inline-result show';
  addToAtkLog(npcId, `${isCrit?'💥':'🎲'} ${name}: ${sum} ур. [${allResults.join('+')}${bonus?'+'+bonus:''}]`);
}

function addToAtkLog(npcId, text) {
  const log = document.getElementById('atk-log-'+npcId);
  if (!log) return;
  log.classList.add('show');
  const line = document.createElement('div');
  line.textContent = text;
  log.insertBefore(line, log.firstChild);
  while (log.children.length > 8) log.removeChild(log.lastChild);
}

function rollDiceExpressionRaw(expr){
  const cleanExpr = normalizeDamageExpr(expr);
  const parts = (cleanExpr.match(/\d+к\d+/g) || []);
  const bonusM = cleanExpr.match(/\+(\d+)(?!к)/g) || [];
  const bonus = bonusM.reduce((sum,b)=>sum+parseInt(b.replace('+',''),10),0);
  let rolls = [], total = bonus;
  parts.forEach(p => {
    const m = p.match(/(\d+)к(\d+)/);
    if (!m) return;
    const n = parseInt(m[1],10), sides = parseInt(m[2],10);
    for (let i=0;i<n;i++) { const r = Math.floor(Math.random()*sides)+1; rolls.push(r); total += r; }
  });
  return {expr: cleanExpr, rolls, bonus, total};
}
function rollSADmg(npcId, expr){
  const r = rollDiceExpressionRaw(expr);
  addToAtkLog(npcId, `🎲 Скрытая атака ${expr}: ${r.total} ур. [${r.rolls.join('+')}${r.bonus?'+'+r.bonus:''}]`);
}
function rollSkillInline(npcId, name, bonus){
  const d20 = Math.floor(Math.random()*20)+1;
  const total = d20 + bonus;
  addToAtkLog(npcId, `🕶 ${name}: ${total} (d20[${d20}]${bonus>=0?'+':''}${bonus})`);
}

function rollAllAtk(npcId) {
  const c = getNpcById(npcId);
  if (!c) return;
  const parseAtk = a => { const m=a.match(/^([+\-]\d+)/); return m?parseInt(m[1]):0; };
  c.at.forEach((atk, ai) => {
    setTimeout(() => rollAtkInline(npcId, ai, parseAtk(atk.a), atk.n, atk.d, false), ai * 150);
  });
}

// ── Rest functions ───────────────────────────────────────────────────────
function shortRest(id) {
  const s = getState(id);
  const c = getNpcById(id);
  // Restore: Second Wind, Action Surge, SD, Battle Master SD, Oгл.удар
  s.sdUsed = 0;
  // Roll HD to restore HP (simplified: restore 1d8+con or 1d10+con)
  const hd = c.co.cr.includes('1к8')||c.sh.includes('Скиталец') ? 8 : 10;
  const conMod = Math.floor((c.st.con-10)/2);
  const healed = Math.floor(Math.random()*hd)+1+conMod;
  s.curHp = Math.min(c.co.hp, s.curHp + healed);
  savePersistedState();
  refreshCombatPanel(id);
  refreshSidebarHP(id);
  refreshSDPanel(id);
  // Refresh slots panel
  if (c.slots) c.slots.forEach(sl => { const st=s.slots[sl.lv]; if(st) refreshSlotsPanel(id); });
  addToAtkLog(id, `☕ Кор.отдых: +${healed} ОЗ (${s.curHp}/${c.co.hp})`);
}

function longRest(id) {
  const s = getState(id);
  const c = getNpcById(id);
  s.curHp = c.co.hp;
  s.sdUsed = 0;
  s.saOn = false;
  s.conditions = [];
  // Restore all slots
  if (c.slots) c.slots.forEach(sl => {
    if (s.slots[sl.lv]) s.slots[sl.lv].used = 0;
  });
  savePersistedState();
  refreshCombatPanel(id);
  refreshSidebarHP(id);
  refreshSDPanel(id);
  if (c.slots) c.slots.forEach(sl => refreshSlotsPanel(id));
  addToAtkLog(id, `🌙 Долг.отдых: полное восстановление`);
}

function newRound(id) {
  const s = getState(id);
  s.saOn = false;
  savePersistedState();
  const saBtn = document.getElementById('sa-btn');
  if (saBtn) { saBtn.className='sa-toggle'; saBtn.textContent='⬜ Не использована'; }
  addToAtkLog(id, `🔄 Новый раунд`);
}

// ── Manual initiative add ─────────────────────────────────────────────────
function addManualIni() {
  const name = document.getElementById('ini-manual-name').value.trim() || '?';
  const val = parseInt(document.getElementById('ini-manual-val').value) || 0;
  iniOrder.push({id: -Date.now(), manualName: name, val});
  iniOrder.sort((a,b)=>b.val-a.val);
    savePersistedState();
  refreshIniTracker();
}

// Override refreshIniTracker to support manual entries and add input
function refreshIniTracker() {
  const el = document.getElementById('ini-tracker');
  if (!el) return;
  let html = '<span class="ini-tracker-label">Инициатива:</span>';
  html += iniOrder.map((e,i)=>{
    const nc = e.id>0 ? getNpcById(e.id) : null;
    const ico = nc?nc.ic:'👤';
    const nm = nc?nc.sh.split(' ')[0]:(e.manualName||'?');
    return `<div class="ini-slot${i===iniCurrent?' current':''}" onclick="${e.id>0?'iniJump('+i+')':'iniJump('+i+')'}">${ico} <span class="ini-slot-name">${nm}</span><span class="ini-slot-val">${e.val}</span></div>`;
  }).join('');
  if (iniOrder.length) {
    html += `<button class="ini-next-btn" onclick="iniNext()">→</button>`;
    html += `<button class="ini-clear-btn" onclick="iniClear()">✕</button>`;
  }
  html += `<div class="ini-add-manual">
    <input class="ini-manual-name" id="ini-manual-name" placeholder="Имя (игрок)" maxlength="12">
    <input class="ini-manual-val" id="ini-manual-val" type="number" placeholder="20">
    <button class="ini-add-btn" onclick="addManualIni()">+</button>
  </div>`;
  el.innerHTML = html;
}

// ── Helper renderers ──────────────────────────────────────────────────────
function renderHi(hi) {
  if (!hi) return '';
  return `<div class="hi-box ${hi.ty||'unity'}" style="margin-bottom:8px">
<div class="hi-name">${hi.nm}</div>
<div class="hi-items">${hi.items.map(it=>`<div class="hi-item"><div class="hi-item-name">${it.n}</div><div class="hi-item-desc">${it.d}</div></div>`).join('')}</div>
</div>`;
}

function renderAngrial(a) {
  return `<div class="angrial-box">
<div class="angrial-title">🔮 Ангриал (Уровень ${a.lv})</div>
<div class="angrial-grid">
<div class="angrial-stat"><div class="angrial-label">Атака</div><div class="angrial-val">${a.atk}</div></div>
<div class="angrial-stat"><div class="angrial-label">Доп. урон</div><div class="angrial-val">${a.dmgd}</div></div>
<div class="angrial-stat"><div class="angrial-label">Дистанция</div><div class="angrial-val">${a.range}</div></div>
<div class="angrial-stat"><div class="angrial-label">Площадь</div><div class="angrial-val">${a.area}</div></div>
</div>
<div style="font-size:11px;color:var(--text2);margin-top:6px;line-height:1.35">${a.desc}</div>
</div>`;
}

function renderTalentsTab(i, c) {
  if (!c.excTalents || !c.excTalents.length) return '';
  let html = `<div class="tab-content" id="tab_${i}_talents">
<div style="font-size:11px;color:var(--text3);margin-bottom:8px">Дичок получает исключ. талант на ур.1, 7, 15. Можно из любого своего таланта.</div>`;
  c.excTalents.forEach(tg => {
    html += `<div class="tal-group"><div class="tal-group-name">${tg.tal}</div>`;
    tg.items.forEach(it => {
      const lvCls = it.lv===1?'tag-success':it.lv===7?'tag-warning':'tag-purple';
      html += `<div class="tal-item">
<div><span class="tag ${lvCls}" style="margin-right:5px">Ур.${it.lv}</span><span class="tal-name">${it.n}</span></div>
<div class="tal-desc">${it.d}</div>
</div>`;
    });
    html += `</div>`;
  });
  html += `</div>`;
  return html;
}

// ── Tab switching ─────────────────────────────────────────────────────────
function switchTab(i, tabId) {
  document.querySelectorAll(`#tab_${i}_battle, #tab_${i}_overview, #tab_${i}_abilities, #tab_${i}_equipment, #tab_${i}_forms, #tab_${i}_spells, #tab_${i}_talents`).forEach(el => el && el.classList.remove('active'));
  document.querySelectorAll(`#tabs_${i} .tab-btn`).forEach(b => b.classList.remove('active'));
  const tc = document.getElementById(`tab_${i}_${tabId}`);
  if (tc) tc.classList.add('active');
  document.querySelectorAll(`#tabs_${i} .tab-btn`).forEach(b => {
    if (b.getAttribute('onclick') && b.getAttribute('onclick').includes(`'${tabId}'`)) b.classList.add('active');
  });
}

// ── SA Toggle ────────────────────────────────────────────────────────────
function toggleSA(id) {
  const s = getState(id);
  s.saOn = !s.saOn;
  savePersistedState();
  const btn = document.getElementById('sa-btn');
  if (btn) { btn.className='sa-toggle'+(s.saOn?' on':''); btn.textContent=s.saOn?'✅ Активна':'⬜ Не использована'; }
}

// ── Reset HP ─────────────────────────────────────────────────────────────
function resetHP(id) {
  const c = getNpcById(id);
  if (c) { getState(id).curHp = c.co.hp; savePersistedState(); refreshCombatPanel(id); refreshSidebarHP(id); }
}

// ── Initiative Tracker ────────────────────────────────────────────────────
function addToIni(id) {
  const c = getNpcById(id);
  if (!c) return;
  const iniStr = c.co.ini.replace(/[^0-9+\-]/g,'');
  const iniBonus = parseInt(iniStr)||0;
  const roll20 = Math.floor(Math.random()*20)+1;
  const total = roll20 + iniBonus;
  if (!iniOrder.find(e=>Number(e.id)===Number(id))) {
    iniOrder.push({id, val:total});
    iniOrder.sort((a,b)=>b.val-a.val);
    savePersistedState();
  }
  refreshIniTracker();
}


function iniNext() { if (iniOrder.length) { iniCurrent=(iniCurrent+1)%iniOrder.length; savePersistedState(); refreshIniTracker(); } }
function iniJump(i) { iniCurrent=i; savePersistedState(); refreshIniTracker(); if(iniOrder[i]) showNPC(iniOrder[i].id); }
function iniClear() { iniOrder=[]; iniCurrent=0; savePersistedState(); refreshIniTracker(); }



function renderFormsTab(i, c) {
  var dexMod = Math.floor((c.st.dex - 10)/2);
  var prof = parseInt(c.co.prof);
  var dc = 10 + dexMod + prof;
  var parts = [];
  parts.push('<div class="tab-content" id="tab_' + i + '_forms">');
  parts.push('<div class="forms-dc-note">');
  parts.push('<strong>Формы меча — Мастер Меча (Blademaster)</strong><br>');
  parts.push('Раз в раунд выбрать одну форму и использовать её.<br>');
  parts.push('На 13-м уровне — две формы за раунд (разных уровней).<br>');
  parts.push('Требует меча Мастера Меча + действие <em>Пламя и Пустота</em>.</div>');
  parts.push('<div class="forms-rule"><strong>DC форм = 10 + мод.Лов + бонус умения = СЛ ' + dc + '</strong></div>');
  parts.push('<div class="forms-filter">');
  parts.push('<button class="form-filter-btn active" onclick="filterForms(this,' + i + ',\'all\')">Все</button>');
  parts.push('<button class="form-filter-btn" onclick="filterForms(this,' + i + ',\'3\')">Ур.3 (доступны)</button>');
  parts.push('<button class="form-filter-btn" onclick="filterForms(this,' + i + ',\'7\')">Ур.7 (доступны)</button>');
  parts.push('<button class="form-filter-btn" onclick="filterForms(this,' + i + ',\'13\')">Ур.13</button>');
  parts.push('</div>');
  parts.push('<div id="forms-list-' + i + '">');
  FORMS.forEach(function(f) {
    var avail = c.lv >= f.lv;
    var cls = avail ? ('lv' + f.lv) : 'unavail';
    var badge = '<span class="form-lv-badge">Ур.' + f.lv + '</span>';
    var name = '<span class="form-name">' + f.n + '</span>';
    var warn = avail ? '' : '<span class="form-unavail-tag">\u26a0 нужен ур.' + f.lv + '</span>';
    parts.push('<div class="form-card ' + cls + '" data-lv="' + f.lv + '">');
    parts.push('<div class="form-header">' + badge + name + warn + '</div>');
    parts.push('<div class="form-desc">' + f.d + '</div>');
    parts.push('</div>');
  });
  parts.push('</div></div>');
  return parts.join('');
}




function filterForms(btn, npcId, filter) {
  btn.closest('.tab-content').querySelectorAll('.form-filter-btn').forEach(b=>b.classList.remove('active'));
  btn.classList.add('active');
  const list = document.getElementById('forms-list-' + npcId);
  if (!list) return;
  list.querySelectorAll('.form-card').forEach(card=>{
    if(filter==='all') card.style.display='';
    else card.style.display=(card.dataset.lv===filter)?'':'none';
  });
}

// Initialize
loadPersistedState();
buildSidebar();

// ── Custom NPC deletion helper (v61) ──────────────────────────────────────
function deleteCustomNpcFromBrowser(id){
  const npc = getNpcById(id);
  if(!npc || !npc.custom || npc.isClone) return;
  if(!confirm('Удалить пользовательского NPC «' + (npc.sh||npc.ti||id) + '» из этого браузера?')) return;
  try{
    const arr = JSON.parse(localStorage.getItem(CUSTOM_NPC_STORAGE_KEY) || '[]').filter(x => Number(x.id) !== Number(id));
    localStorage.setItem(CUSTOM_NPC_STORAGE_KEY, JSON.stringify(arr));
  }catch(e){}
  const idx = CS.findIndex(x => Number(x.id) === Number(id));
  if(idx >= 0) CS.splice(idx,1);
  delete STATE[id]; delete STATE[String(id)];
  if(Number(curNPC) === Number(id)) curNPC = null;
  saveState(); buildSidebar();
  const main = document.getElementById('mn'); if(main) main.innerHTML = '<div class="placeholder" id="placeholder">← Выбери персонажа слева</div>';
}
