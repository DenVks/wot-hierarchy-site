# NPC 42 / dm-npc.html — v124 layout and patch-chain audit

## Scope

Patch v124 fixes readability of the spell table on `dm-npc.html`, especially for NPC 42, whose weave descriptions became long after affinity / anglial recalculation.

## Findings

### 1. Patch chain issue

`v123_NPC42_AFFINITY_LEVEL_DAMAGE_PATCH` contains:

- `assets/npc-data.js`
- `dm-npc.html`
- `VERSION.txt`
- `NPC42_SELAIN_KOTALLEN_AUDIT_v123.md`
- `README_v123.md`

It does **not** contain `assets/dm-npc.js`.

`v122_NPC42_ANGRIAL_AFFINITY_HIERARCHY_PATCH` contained `assets/dm-npc.js` with the UI label change:

- old: `Доп. урон`
- new: `Доп. кубики`

Therefore, applying v123 directly after v121 preserves the v123 NPC data, but misses that v122 UI label change. v124 includes `assets/dm-npc.js` again, so the patch chain is safe after v121 + v123.

### 2. Spell table readability problem

The table had ten columns. Several compact columns used `white-space: nowrap`, and the damage column became wide after formulas such as `19к8 + 1к8+7`. Browser auto-layout compressed the last description column, making text narrow and hard to read.

## Changes

### `assets/dm-npc.css`

Added v124 spell-table layout overrides:

- fixed proportional column widths;
- narrowed service columns: talent, elements, time, range, duration, slot;
- widened damage and description columns;
- allowed wrapping inside compact cells;
- preserved horizontal scrolling on narrow screens;
- increased description line-height.

### `assets/dm-npc.js`

Included cumulative v122 change:

- `Доп. кубики` instead of `Доп. урон` in the anglial panel.

### `dm-npc.html`

Updated cache-busting to v124 for:

- `assets/dm-npc.css`
- `assets/npc-rules-data.js`
- `assets/npc-data.js`
- `assets/dm-npc.js`

## Technical checks

- `node --check assets/npc-data.js` — passed
- `node --check assets/dm-npc.js` — passed
- `node --check assets/npc-rules-data.js` — passed
- duplicate NPC ids — none
- NPC 42 — found
- anglial label in renderer — `Доп. кубики`
