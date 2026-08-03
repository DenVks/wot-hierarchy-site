# v130 — Scream hierarchy visibility hotfix

## Назначение

Патч исправляет проблему видимости новой Иерархии Крика на странице `hierarchies.html`.

В v129 полная страница `scream.html`, карточки главной страницы, меню и `hierarchy-data.js` были добавлены, но верхний ряд кнопок на странице `Иерархии` не содержал отдельной кнопки `Крик`. Из-за этого на экране с заголовком `Великие Иерархии` Иерархия Крика выглядела отсутствующей.

## Изменения

- `hierarchies.html`: добавлена кнопка `Крик` в верхний ряд навигации раздела.
- `hierarchies.html`: добавлена статическая ссылка `Крик` в верхнее меню этой страницы.
- `hierarchies.html`: блок `Крик и Держащие Равновесие` вынесен из общего блока про Стену в отдельный раздел `#scream-hierarchy`.
- `assets/styles.css`: добавлено оформление `detail-panel.scream` по стилю сайта.
- `VERSION.txt`: обновлён до v130.

## Файлы патча

```text
hierarchies.html
assets/styles.css
VERSION.txt
README_v130.md
SCREAM_HIERARCHY_VISIBILITY_AUDIT_v130.md
```
