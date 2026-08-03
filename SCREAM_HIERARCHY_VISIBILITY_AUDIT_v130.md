# SCREAM_HIERARCHY_VISIBILITY_AUDIT_v130

## Причина патча

Пользователь сообщил, что после v129 не видит Иерархию Крика в разделе `Иерархии`. На скриншоте верхний ряд кнопок страницы содержал:

```text
Единство / Хрустальный Трон / Фар Мэддинг / Единая Воля / Сравнение / Иерархия Стены
```

Кнопки `Крик` там не было.

## Проверка v129

В v129 Крик был добавлен в:

```text
scream.html
index.html
assets/shared.js
assets/hierarchy-data.js
assets/hierarchies/scream/
```

Но в `hierarchies.html` верхняя локальная навигация `.chapter-nav.anchor-nav` не получила отдельный пункт `Крик`. Блок с Криком находился внутри нижнего раздела `#wall-hierarchy`, поэтому он был плохо заметен и не соответствовал ожиданию пользователя.

## Исправление v130

1. В `.chapter-nav.anchor-nav` добавлена кнопка:

```html
<a href="#scream-hierarchy">Крик</a>
```

2. В статический navbar страницы добавлена ссылка:

```html
<a href="scream.html">Крик</a>
```

3. Нижний объединённый раздел разделён на два самостоятельных блока:

```text
#wall-hierarchy    — Иерархия Аномальной Стены
#scream-hierarchy  — Крик и Держащие Равновесие
```

4. Добавлено оформление `detail-panel.scream`.

## Проверки

- `hierarchies.html` содержит ссылку `href="#scream-hierarchy"`.
- `hierarchies.html` содержит раздел `id="scream-hierarchy"`.
- `hierarchies.html` содержит ссылку на `scream.html`.
- `assets/styles.css` содержит `detail-panel.scream`.
- `assets/shared.js`, `assets/hierarchy-data.js`, `assets/npc-data.js`, `assets/dm-npc.js` проходят `node --check`.
