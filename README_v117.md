# WoT Hierarchy Site v117 patch

Apply over v116 full site or over repository state equivalent to `wot_hierarchy_site_v116_FULL_FROM_GITHUB_LAST.zip`.

Main changes:
- Renames `Колдун Земли Безумцев` to `Носитель Договора`.
- Integrates the class into `classes.html` via `assets/classes-data.js` and `assets/classes.js`.
- Removes separate DM Toolkit links to `dm-npc.html#npc-41` and the old class page.
- Replaces Keeper PoI placeholder with full DM module wrapper and adds the two source modules:
  - `guild-keepers-expanded.html`
  - `guild-keepers-poi-catalog.html`
- Updates `VERSION.txt` to v117.

Old `warlock-land-madmen.html` remains as a compatibility redirect to `classes.html#class-nositel-dogovora`.
