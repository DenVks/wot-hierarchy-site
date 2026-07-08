# WoT Hierarchy Site Patch v116

Patch: `v116_NPC41_WARLOCK_KEEPER_INTEGRATION`

Apply over the site state from `wot-hierarchy-site_last.zip` / v115.

## Files changed/added

- `assets/npc-data.js` — adds NPC 41, Кар'ас Ган'эй.
- `assets/dm-npc.js` — supports `dm-npc.html#npc-41` / `?npc=41`.
- `dm-npc.html` — cache bump and class link.
- `assets/shared.js` — adds protected DM Toolkit entries.
- `warlock-land-madmen.html` — protected class page for Колдун Земли Безумцев v1.5.
- `keeper-poi-catalog.html` — protected DM PoI catalog integration page.
- `VERSION.txt` — v116.
- `V116_INTEGRATION_AUDIT.md` — validation notes.

## Notes

The uploaded GitHub archive did not contain the original standalone source `guild_keepers_r9_r10_poi_catalog_2000m_mechanics.html`. v116 therefore creates the protected DM page and navigation integration, but does not invent exact PoI entries. Replace `keeper-poi-catalog.html` later with the exact standalone catalog if/when the source is available.
