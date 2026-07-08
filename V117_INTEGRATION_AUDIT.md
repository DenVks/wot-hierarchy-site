# v117 — Носитель Договора / Гильдия Хранителей DM module

## Основа
Patch собран поверх `wot_hierarchy_site_v116_FULL_FROM_GITHUB_LAST.zip`.

## Изменения

1. Класс `Колдун Земли Безумцев` переименован в `Носитель Договора`.
   - Причина: термин опирается на механику Договора, Покровителя, Якоря и матриц; не звучит как внешний D&D-warlock.

2. Класс перенесён в общий раздел `classes.html`.
   - Добавлен в `assets/classes-data.js`.
   - Добавлен в порядок и описание классов в `assets/classes.js`.
   - Поддержан прямой hash: `classes.html#class-nositel-dogovora`.
   - Старый `warlock-land-madmen.html` оставлен как compatibility redirect.

3. NPC 41 синхронизирован с новым названием класса.
   - `Кар'ас Ган'эй — Носитель Договора 12`.

4. DM Toolkit обновлён.
   - Убрана отдельная ссылка `dm-npc.html#npc-41`.
   - Убрана отдельная ссылка на страницу старого класса.
   - Оставлен общий `NPC / Бой`.
   - Добавлен `Гильдия Хранителей · DM-модуль`.

5. Раздел `keeper-poi-catalog.html` заменён полноценным закрытым DM-разделом.
   - Встроен `guild-keepers-expanded.html` — расширенный модуль Гильдии Хранителей.
   - Встроен `guild-keepers-poi-catalog.html` — каталог PoI R7–R10 / AR.
   - Оба самостоятельных HTML защищены через `assets/auth.js`.

## Проверки

- `node --check assets/classes.js`
- `node --check assets/shared.js`
- `node --check assets/npc-data.js`
- `assets/classes-data.js` загружается в Node VM, класс `Носитель Договора` найден.
- DM Toolkit больше не содержит `dm-npc.html#npc-41` и `warlock-land-madmen.html`.
