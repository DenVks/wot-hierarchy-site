# CRYSTAL_THRONE_FORMAT_HOTFIX_AUDIT_v132

## Цель

Привести страницу `throne.html` после интеграции Хрустального Трона v1.2 к общему формату сайта и убрать повторяющиеся крупные символы Иерархии внутри текста.

## Изменения

### 1. Типографика и ширина чтения

- Основной контейнер `throne-v12-reader` ограничен шириной `1040px`, как у других страниц Иерархий.
- Уменьшены размеры заголовков `h2/h3` до масштаба страниц `unity.html`, `madding.html`, `hierarchies.html`.
- Размер основного текста приведён к `16.5px` и линейке `1.82`, как у существующих prose-блоков сайта.
- Таблицы, callout-блоки и подписи к изображениям приведены к более компактной сетке.
- Карточки разделов `.book` получили оформление, близкое к `.section-block` сайта.

### 2. Символ Хрустального Трона

- Удалены 5 повторяющихся SVG-символов `part-mark` из внутренних разделителей частей.
- Оставлен один символ Хрустального Трона в верхнем hero-блоке.
- Верхний символ оформлен через стандартный паттерн `.hierarchy-emblem`, аналогично другим страницам Иерархий.

### 3. Изображения

- 16 иллюстраций Хрустального Трона сохранены.
- Пути к изображениям не менялись.
- Повторяющиеся символы Иерархии удалялись только как SVG-разделители, не как иллюстрации HT.

## Проверки

```text
throne.html: svg.part-mark = 0
throne.html: .throne-single-emblem = 1
throne.html: img = 16
throne.html: styles.css?v=132
throne.html: shared.js?v=132
```

Выполнены проверки JS:

```bash
node --check assets/hierarchy-data.js
node --check assets/npc-rules-data.js
node --check assets/npc-data.js
node --check assets/dm-npc.js
node --check assets/shared.js
```

## Файлы

```text
throne.html
assets/styles.css
VERSION.txt
README_v132.md
CRYSTAL_THRONE_FORMAT_HOTFIX_AUDIT_v132.md
```
