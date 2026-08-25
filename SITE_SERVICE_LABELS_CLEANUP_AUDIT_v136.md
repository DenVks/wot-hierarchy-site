# v136 · Проверка служебных надписей

## Цель

Удалить служебные/редакционные подписи, которые не должны быть видны читателю на опубликованном сайте.

## Удалено / заменено

| Файл | Было | Стало |
|---|---|---|
| `shara-will.html` | `Codex Hierarchiarum · Shara · Revision III`, `Игроковая редакция Единой Воли Шары...` | footer удалён |
| `scream.html` | служебный note-card `Игроковая редакция` | блок удалён |
| `throne.html` | служебный note-card `Игроковая редакция` | блок удалён |
| `madding.html` | footer `Codex Hierarchiarum` | footer удалён |
| `hierarchies.html` | `Полная игроковая редакция...` | `Полное описание...` |
| `classes.html` | `Полная глава`, `II · полная глава`, описание генерации полной главы | `Полный текст`, `II · текст класса`, нейтральное описание |

## Контрольный поиск по видимому HTML-тексту

Проверены все `*.html` в корне сайта после удаления `script/style/noscript`. Не найдены строки:

- `Игроковая редакция`
- `О документе`
- `Codex Hierarchiarum`
- `Revision III`, `Revision II`, `Revision I`
- `версия 1.0`, `версия 1.1`, `версия 1.2`
- `site_package`
- `Sources/`, `Hierarhies`
- `для сайта`
- `полная глава` / `Полная глава`
- `заменяет v`, `интеграция v`
- `Редакция III`

## Технические проверки

Выполнено:

```bash
node --check assets/hierarchy-data.js
node --check assets/npc-data.js
node --check assets/dm-npc.js
node --check assets/shared.js
```

Дополнительно проверено:

- `shara-will.html`: 9 изображений сохранены;
- `scream.html`: 11 изображений сохранены;
- `throne.html`: 16 изображений сохранены;
- `classes.html`: структура страницы сохранена;
- `hierarchies.html`: ссылка на `throne.html` сохранена.
