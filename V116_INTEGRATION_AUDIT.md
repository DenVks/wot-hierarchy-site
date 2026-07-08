# v116 — NPC 41 / Колдун Земли Безумцев / Keeper PoI integration audit

## Base

Input archive: `wot-hierarchy-site_last.zip`
Detected site version before patch: `v115 — Land of Madmen nation page patch`

## Integrated

1. `assets/npc-data.js`
   - Added NPC ID 41: `Кар'ас Ган'эй`.
   - Final values: CON 16, CHA 20, HP 99, AC 15, Weave DC 17, Weave attack +9.
   - Pact slots: 3 slots of 5th level.
   - Forbidden Matrix: 6th level, 1/long rest, selected `Огненные цветки`.
   - Legal Secret Matrices: `Усиленная нить`, `Точная матрица`, `Инверсия договора`, `Кровь как печать`, `Знак держит нить`, `Шрам помнит боль`.
   - Removed/avoided illegal matrix `Клинок ведёт руку`.

2. `dm-npc.html` and `assets/dm-npc.js`
   - Cache bump to v116.
   - Added support for direct NPC opening by URL: `dm-npc.html#npc-41` or `dm-npc.html?npc=41`.
   - Added sidebar link to class page.

3. `warlock-land-madmen.html`
   - Added protected DM rules page for `Колдун Земли Безумцев v1.5`.
   - Captures v1.5 corrections around Forbidden Matrix, Pact slots, Якорь Знака, and NPC 41 compatibility.

4. `keeper-poi-catalog.html`
   - Added protected DM page and integration shell for Guild Keepers R9–R10 PoI catalog.
   - The exact standalone source `guild_keepers_r9_r10_poi_catalog_2000m_mechanics.html` was not present in the uploaded GitHub archive, so no fabricated exact PoI entries were inserted.

5. `assets/shared.js`
   - Added protected DM Toolkit links:
     - `NPC 41 · Кар'ас Ган'эй` → `dm-npc.html#npc-41`
     - `Класс · Колдун ЗБ` → `warlock-land-madmen.html`
     - `Гильдия Хранителей · PoI R9–R10` → `keeper-poi-catalog.html`

## Validation

- JavaScript syntax checked with `node --check` for changed JS files.
- `assets/npc-data.js` loaded in a JS VM and confirmed to contain NPC ID 41.
- Patch archive contains only changed/added files, not a full site snapshot.
