# GUILD_KEEPERS_FORMAT_REBUILD_AUDIT_v138

## Причина

Версия v137 содержательно обновила `madding.html`, но страница сохраняла автономный печатный HTML/CSS пакета: Letter layout, двухколоночную книжную вёрстку, собственную типографику, отдельную обложку, фронтиспис и CSS `madding-v11.css`. Это выбивалось из общего формата сайта.

## Исправление

`madding.html` пересобран в нативном формате сайта:

- общий фон сайта: `pattern-bg` + `thread-layer`;
- стандартный верхний `sitenav`;
- `page-body keepers-page-shell`;
- `page-header compact-hero`;
- один верхний знак `keepers-single-emblem`;
- вводная иллюстрация и навигация в `chapter narrow`;
- основной текст в `keepers-v11-reader prose`;
- стили вынесены в `assets/styles.css`.

## Сохранение содержания

Содержимое бывшего `main.book` перенесено в новый reader-блок без сокращения. Изображения сохранены: 13.

## Удалено из HTML

- `<link href="assets/far-madding-v11/madding-v11.css?v=137" ...>`
- `body.guild-v11-site`
- `section.cover`
- `section.frontispiece`
- `section.frontmatter`
- `main.book`
- `sitepatch-homebar`
- автономная печатная структура Letter/PDF-style

## Проверки

- `madding.html` содержит только `assets/styles.css?v=138` как локальный CSS сайта.
- `madding-v11.css` в `madding.html` не подключён.
- `cover/frontmatter/frontispiece` отсутствуют.
- `main.keepers-v11-reader` присутствует.
- `.keepers-single-emblem` присутствует в количестве 1.
- Изображений: 13.
- Ссылок оглавления: 30.
- Служебных надписей не найдено.

Node checks:

```text
node --check assets/hierarchy-data.js
node --check assets/npc-rules-data.js
node --check assets/npc-data.js
node --check assets/shared.js
node --check assets/dm-npc.js
node --check assets/npc-generator.js
```
