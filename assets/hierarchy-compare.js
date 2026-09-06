(function () {
  'use strict';
  const db = window.WOT_HIERARCHY_DB;
  const root = document.getElementById('hierarchy-db-compare');
  if (!db || !root) return;
  const roman = rank => db.getRankNumber ? db.getRankNumber(rank) : 0;
  const esc = value => String(value == null ? '' : value).replace(/[&<>\"]/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '\"': '&quot;' }[ch]));
  const sign = value => Number(value) >= 0 ? '+' + Number(value) : String(Number(value));
  const hierarchyOptions = (db.hierarchies || []).filter(h => h.mechanics).map(h => `<option value="${esc(h.id)}">${esc(h.name)}</option>`).join('');

  root.innerHTML = `
    <div class="hierarchy-db-status" id="hierarchy-db-status"></div>
    <div class="hierarchy-compare-controls">
      <div class="hierarchy-compare-side"><label>Иерархия A</label><select id="hierarchy-a">${hierarchyOptions}</select><label>Ранг</label><select id="hierarchy-rank-a"></select><div id="hierarchy-branch-wrap-a"><label>Путь</label><select id="hierarchy-branch-a"></select></div></div>
      <div class="hierarchy-compare-side"><label>Иерархия B</label><select id="hierarchy-b">${hierarchyOptions}</select><label>Ранг</label><select id="hierarchy-rank-b"></select><div id="hierarchy-branch-wrap-b"><label>Путь</label><select id="hierarchy-branch-b"></select></div></div>
    </div>
    <div class="rank-table-wrap"><table class="rank-table hierarchy-compare-table"><thead><tr><th>Параметр</th><th id="hierarchy-head-a"></th><th id="hierarchy-head-b"></th></tr></thead><tbody id="hierarchy-compare-body"></tbody></table></div>
    <div class="hierarchy-ability-columns"><div class="hierarchy-ability-panel" id="hierarchy-abilities-a"></div><div class="hierarchy-ability-panel" id="hierarchy-abilities-b"></div></div>`;

  function byId(id) { return document.getElementById(id); }
  function selected(side) {
    const hierarchy = db.getHierarchy(byId('hierarchy-' + side).value);
    const rank = byId('hierarchy-rank-' + side).value;
    const branch = byId('hierarchy-branch-' + side).value;
    return { hierarchy, rank, branch, profile: hierarchy && hierarchy.mechanics.ranks[rank] };
  }
  function updateRanks(side, keep) {
    const hierarchy = db.getHierarchy(byId('hierarchy-' + side).value);
    const select = byId('hierarchy-rank-' + side), previous = keep ? select.value : '';
    const ranks = hierarchy ? (hierarchy.ranks || []).map(r => r.rank).filter(r => hierarchy.mechanics.ranks[r]) : [];
    select.innerHTML = ranks.map(rank => `<option value="${rank}">${rank} · ${esc((hierarchy.ranks.find(r => r.rank === rank) || {}).name)}</option>`).join('');
    select.value = ranks.includes(previous) ? previous : ranks[ranks.length - 1];
    updateBranches(side);
  }
  function updateBranches(side) {
    const hierarchy = db.getHierarchy(byId('hierarchy-' + side).value), rank = byId('hierarchy-rank-' + side).value;
    const branches = hierarchy ? hierarchy.mechanics.branches || [] : [];
    const show = branches.length && roman(rank) >= roman(hierarchy.mechanics.branchFromRank || 'I');
    byId('hierarchy-branch-wrap-' + side).hidden = !show;
    byId('hierarchy-branch-' + side).innerHTML = show ? branches.map(b => `<option value="${esc(b.id)}">${esc(b.name)}</option>`).join('') : '<option value="">—</option>';
  }
  function cumulativeStats(hierarchy, rank) {
    return Object.entries(hierarchy.mechanics.ranks).filter(([key]) => roman(key) <= roman(rank)).reduce((sum, pair) => sum + Number(pair[1].statPoints || 0), 0);
  }
  function value(ctx, key) {
    const p = ctx.profile || {}, m = ctx.hierarchy.mechanics;
    if (key === 'rank') return `${ctx.rank} · ${esc(((ctx.hierarchy.ranks || []).find(r => r.rank === ctx.rank) || {}).name || '')}`;
    if (key === 'stats') {
      const points = cumulativeStats(ctx.hierarchy, ctx.rank), cap = p.cap || 20;
      const special = p.statCaps ? ' (ИНТ/МДР до 26)' : '';
      if (p.penaltyPoints) return `временно −1 к ${p.penaltyPoints} характеристикам`;
      if (p.fixedStats) return Object.entries(p.fixedStats).map(([stat, amount]) => `${stat.toUpperCase()} ${sign(amount)}`).join(', ');
      return points ? `+${points} пунктов накопительно; предел ${cap}${special}` : 'без повышения';
    }
    if (key === 'hp') return [p.hp ? sign(p.hp) + ' ОЗ' : '', p.hitDiceMult ? 'Кости Хитов ×' + p.hitDiceMult : ''].filter(Boolean).join(' · ') || '—';
    if (key === 'combat') { const attack=p.attackByBranch?Number(p.attackByBranch[ctx.branch]||0):Number(p.attack||0), force=p.forceDamageDieByBranch&&p.forceDamageDieByBranch[ctx.branch]; return [`КД ${sign(p.ac || 0)}`, `атака ${sign(attack)}`, `урон ${sign(p.damage || 0)}`, force?`силовой +${force}`:''].filter(Boolean).join(' · '); }
    if (key === 'speed') return sign(p.speedByBranch ? Number(p.speedByBranch[ctx.branch] || 0) : Number(p.speed || 0)) + ' фт';
    if (key === 'initiative') return sign(p.initiative || 0) + (p.initiativeExceptional != null ? ` / ${sign(p.initiativeExceptional)} при успехе на 5+` : '') + (p.initiativeAdv ? ' · преимущество' : '');
    if (key === 'saves') return p.stability ? `устойчивость ${sign(p.stability)}` : `${sign(p.saves || 0)} ко всем${p.saveAdv ? ' · преимущество: ' + p.saveAdv : ''}`;
    if (key === 'channeling') {
      const dc = p.dcByBranch ? Number(p.dcByBranch[ctx.branch] || 0) : Number(p.dcByChanneler || p.dc || 0);
      return [`СЛ ${sign(dc)}`, p.weaveAttack ? `атака ${sign(p.weaveAttack)}` : '', p.weaveDamageDice ? `+${p.weaveDamageDice} куб.` : '', p.weaveRangeMult ? `дальность ×${p.weaveRangeMult}` : '', p.weavePower ? `усиление ${p.weavePower}` : '', p.extraSlots ? `применения ${p.extraSlots}` : ''].filter(Boolean).join(' · ');
    }
    if (key === 'special') return [p.regen ? `регенерация ${p.regen}` : '', p.conductivity ? `проводимость ${p.conductivity}` : '', p.width ? `ширина ${p.width}` : '', p.chargeDie ? `куб ${p.chargeDie}` : ''].filter(Boolean).join(' · ') || '—';
    return '—';
  }
  function abilityPanel(ctx, side) {
    const abilities = db.getAbilities(ctx.hierarchy.id, ctx.rank, ctx.branch, true);
    byId('hierarchy-abilities-' + side).innerHTML = `<h3>${esc(ctx.hierarchy.shortName || ctx.hierarchy.name)} · способности (${abilities.length})</h3>` + abilities.map(a => `<details><summary>${esc(a.name)} <small>· ${esc(a.rank)}${a.path ? ' · ' + esc(a.path) : ''}</small></summary><p>${esc(a.description)}</p></details>`).join('');
  }
  function render() {
    const a = selected('a'), b = selected('b'); if (!a.hierarchy || !b.hierarchy) return;
    byId('hierarchy-head-a').innerHTML = `${esc(a.hierarchy.shortName || a.hierarchy.name)}<br><small>${esc(a.hierarchy.mechanics.version || '')}</small>`;
    byId('hierarchy-head-b').innerHTML = `${esc(b.hierarchy.shortName || b.hierarchy.name)}<br><small>${esc(b.hierarchy.mechanics.version || '')}</small>`;
    const rows = [['rank', 'Ранг'], ['stats', 'Характеристики'], ['hp', 'Хиты'], ['combat', 'КД / атака / урон'], ['speed', 'Скорость'], ['initiative', 'Инициатива'], ['saves', 'Спасброски / устойчивость'], ['channeling', 'Направление'], ['special', 'Особый профиль']];
    byId('hierarchy-compare-body').innerHTML = rows.map(([key, label]) => `<tr><th>${label}</th><td>${value(a, key)}</td><td>${value(b, key)}</td></tr>`).join('') + `<tr><th>Источник</th><td><a class="hierarchy-source-link" href="${esc(a.hierarchy.source)}">Полные правила</a></td><td><a class="hierarchy-source-link" href="${esc(b.hierarchy.source)}">Полные правила</a></td></tr>`;
    abilityPanel(a, 'a'); abilityPanel(b, 'b');
  }
  function changedHierarchy(side) { updateRanks(side, false); render(); }
  ['a', 'b'].forEach(side => {
    byId('hierarchy-' + side).addEventListener('change', () => changedHierarchy(side));
    byId('hierarchy-rank-' + side).addEventListener('change', () => { updateBranches(side); render(); });
    byId('hierarchy-branch-' + side).addEventListener('change', render);
  });
  byId('hierarchy-a').value = db.getHierarchy('unity') ? 'unity' : db.hierarchies[0].id;
  byId('hierarchy-b').value = db.getHierarchy('crystal-throne') ? 'crystal-throne' : db.hierarchies[1].id;
  updateRanks('a', false); updateRanks('b', false);
  const errors = db.validationErrors || [];
  byId('hierarchy-db-status').innerHTML = `<span class="${errors.length ? '' : 'ok'}">${errors.length ? 'Требует проверки: ' + errors.length : '✓ База прошла проверку целостности'}</span><span>${db.hierarchies.length} Иерархий</span><span>схема v${db.schemaVersion}</span><span>обновлено ${esc(db.updated)}</span>`;
  render();
})();
