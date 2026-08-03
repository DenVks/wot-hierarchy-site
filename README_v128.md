# v128 — NPC 41 Pact Bearer v2 correction

Patch v128 is a targeted correction for NPC 41 after adopting the current Pact Bearer / Носитель Договора class progression in v126.

## Changed files

- `assets/npc-data.js`
- `assets/dm-npc.js`
- `dm-npc.html`
- `VERSION.txt`
- `NPC41_KARAS_GANEI_AUDIT_v128.md`
- `README_v128.md`

## Main corrections

- NPC 41 now uses 4 Secret Matrices at level 12, not 6.
- Anchor Sign features are no longer counted as Secret Matrices.
- Removed the false `hi` hierarchy-style block from NPC 41.
- Removed old-class live-card terminology from NPC 41.
- Replaced the stale `Разрез Договора` attack with current Pact Bearer / WoT weave combat options.
- Added Pact Bearer class-context and alias support to `dm-npc.js` for `(i)` tooltips.
- Updated `dm-npc.html` cache-busting to v128.

## Checks

```bash
node --check assets/npc-data.js
node --check assets/dm-npc.js
node --check assets/npc-rules-data.js
node --check assets/hierarchy-data.js
```
