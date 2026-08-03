# v127 — NPC Combat Dashboard and Inventory Audit

Patch over v126.

## Included

- `dm-npc.html`: cache-busting updated to v127.
- `assets/dm-npc.js`: new combat-dashboard renderer for each NPC.
- `assets/dm-npc.css`: styles for the combat dashboard.
- `NPC_INVENTORY_AND_CARD_UX_AUDIT_v127.md`: inventory and flagged-issues report.
- `VERSION.txt`: v127 marker.

## Scope

This patch does not automatically rewrite NPC mechanics. It improves table usability and records the next mechanical audit targets.

Main known follow-ups:

- NPC 41: reconcile Secret Matrix count with Pact Bearer v2.
- NPC 9: verify Unity Rank III HP multiplier.
- Remove audit markers from live cards after mechanical decisions are approved.
