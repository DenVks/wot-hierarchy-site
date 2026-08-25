# GUARDIANS_PATTERN_V11_INTEGRATION_AUDIT_v133

## Source

Uploaded package: `Стражи_Узора_v1.1_site_package(1).zip`.

## Result

- Replaced the old `order.html` content with the full rules content from `guardians-pattern.html`.
- Preserved all OU-00–OU-16 illustrations.
- Moved the official sign OU-00 to a single top emblem position.
- Suppressed repeated large package glyphs: `.heading-glyph` and `.part-mark` are removed or hidden.
- Removed visible package/frontmatter service text such as player-edition/version notes from the site page.
- Added a visible `Стражи Узора` anchor and summary block to `hierarchies.html`.
- Updated `assets/hierarchy-data.js` with a new `pattern-guardians` hierarchy entry.
- Updated `assets/npc-rules-data.js` order hierarchy data to six ranks.
- Updated `assets/npc-generator.js` rank traversal to support VI–VIII ranks.

## Mechanics fixed in data

Стражи Узора now use six ranks:

- I: Страж-послушник
- II: Страж Узла
- III: Ткач Потока
- IV: Старший Ткач
- V: Чемпион Узора
- VI: Архистраж

The generator data encodes final HP/AC/attack progression as incremental values where required by the existing generator implementation.

## Validation checklist

- `order.html` exists and contains OU-00–OU-16 references.
- `hierarchies.html` contains `#order-hierarchy` and link to `order.html`.
- `assets/hierarchy-data.js` contains `pattern-guardians`.
- `assets/npc-rules-data.js` contains rank VI for `order`.
- `assets/npc-generator.js` supports rank VI and higher.
- No visible source package CSS is embedded in `order.html`.
