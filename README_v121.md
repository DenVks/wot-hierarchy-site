# v121 — NPC42 checklist re-audit patch

This patch re-audits NPC42 according to `NPC_CARD_REVIEW_CHECKLIST_FOR_NEW_CHAT.md`.

Changed:

- `assets/npc-data.js`
  - fixed Imperial Command DC: 11 -> 16;
  - fixed Create Fire presentation: save DC 24, concentration, no attack roll;
  - added basic dagger attack from listed equipment;
  - added explicit Perception and Intimidation skill rows;
  - appended v121 verify rows.
- `dm-npc.html`
  - cache-busting moved to v121.
- `VERSION.txt`
- `NPC42_SELAIN_KOTALLEN_AUDIT_v121.md`

Technical checks passed:

```bash
node --check assets/npc-data.js
node --check assets/npc-rules-data.js
node --check assets/hierarchy-data.js
node --check assets/dm-npc.js
```
