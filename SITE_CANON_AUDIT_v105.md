# SITE_CANON_AUDIT_v105

Проверка общего состояния страниц после патча v105.

## Исправления

- `hierarchies.html`: в блоке «Прогрессия рангов Единства» титул V ранга заменён на `Легендарный Лидер` / `Легендарный лидер / Глава Единства`.
- `chronicles.html`: страница пересобрана в каноническом стиле сайта: `page-header`, `chapter-nav`, `chapter narrow`, карточная timeline-сетка, ширина `1040px`, мобильная адаптация.
- `tsitadel.html`: повреждённое/обрезающееся изображение `Сфера Узора · Сердце Цитадели` заменено на новый SVG `assets/citadel/pattern-sphere.svg`; дополнительно добавлен режим `object-fit: contain`.
- `rituals.html`: добавлена иллюстрация `Город Шончан · Обелиск Воли` в формате SVG-арта сайта.
- `assets/styles.css`: добавлены стили для канонической хроники, contain-режима иллюстраций Цитадели и ритуального изображения.
- Все HTML-страницы обновлены на `assets/styles.css?v=105` и `assets/shared.js?v=105`, где эти подключения присутствуют.

## Аудит HTML

Проверено:

- основной набор страниц имеет один `DOCTYPE`;
- изменённые страницы имеют один `<html>`, `<body>` и закрывающие теги;
- `chronicles.html`, `hierarchies.html`, `tsitadel.html`, `rituals.html` содержат `viewport`;
- новое изображение `assets/rituals/seanchan-obelisk.svg` физически присутствует;
- `tsitadel.html` содержит класс `lore-side-art--contain` для Сферы Узора и ссылается на `assets/citadel/pattern-sphere.svg`.

## Примечание по вложению

Отдельный файл изображения Шончана с обелиском в рабочей директории не был обнаружен, поэтому добавлен самостоятельный SVG-арт в принятой визуальной стилистике сайта. Его можно заменить на raster/AI-иллюстрацию позже, сохранив путь или обновив `src` в `rituals.html`.

## Список страниц

- aiel.html: DOCTYPE=1, viewport=yes
- anomalies.html: DOCTYPE=1, viewport=yes
- arafel.html: DOCTYPE=1, viewport=yes
- chronicles.html: DOCTYPE=1, viewport=yes
- classes.html: DOCTYPE=1, viewport=yes
- dm-npc.html: DOCTYPE=1, viewport=yes
- encounter-generator.html: DOCTYPE=1, viewport=yes
- epoch.html: DOCTYPE=1, viewport=yes
- feats.html: DOCTYPE=1, viewport=yes
- freefolk.html: DOCTYPE=1, viewport=yes
- hierarchies.html: DOCTYPE=1, viewport=yes
- hierarchy-wall.html: DOCTYPE=1, viewport=yes
- index.html: DOCTYPE=1, viewport=yes
- ingredients.html: DOCTYPE=1, viewport=yes
- kandor.html: DOCTYPE=1, viewport=yes
- loot-generator.html: DOCTYPE=1, viewport=yes
- madding.html: DOCTYPE=1, viewport=yes
- monsters-battle.html: DOCTYPE=1, viewport=yes
- monsters.html: DOCTYPE=1, viewport=yes
- npc-generator.html: DOCTYPE=1, viewport=yes
- order.html: DOCTYPE=1, viewport=yes
- rituals.html: DOCTYPE=1, viewport=yes
- shara-will.html: DOCTYPE=1, viewport=yes
- shara.html: DOCTYPE=1, viewport=yes
- shienar.html: DOCTYPE=1, viewport=yes
- tar-valon.html: DOCTYPE=1, viewport=yes
- throne.html: DOCTYPE=1, viewport=yes
- tsitadel.html: DOCTYPE=1, viewport=yes
- tuataan.html: DOCTYPE=1, viewport=yes
- unity.html: DOCTYPE=1, viewport=yes
- wall.html: DOCTYPE=1, viewport=yes
- weaves.html: DOCTYPE=1, viewport=yes
