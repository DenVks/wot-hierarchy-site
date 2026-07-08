# WoT Hierarchy site — v124 NPC42 spell-table readability patch

This patch should be applied after v123, but it is also safe for the case where v123 was applied directly after v121 and v122 was skipped.

## Main fixes

1. Improves `dm-npc.html` spell-table readability.
2. Prevents the final description column from becoming too narrow.
3. Re-includes the v122 `assets/dm-npc.js` UI change: anglial bonus is displayed as `Доп. кубики`, not `Доп. урон`.
4. Updates cache-busting in `dm-npc.html` to v124.

## Changed files

- `assets/dm-npc.css`
- `assets/dm-npc.js`
- `assets/npc-data.js`
- `dm-npc.html`
- `VERSION.txt`
- `NPC42_LAYOUT_AUDIT_v124.md`
- `README_v124.md`
