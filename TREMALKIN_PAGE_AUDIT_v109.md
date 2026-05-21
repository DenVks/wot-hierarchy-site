# v109 — Тремалкин / Государства и народы

Изменения:
- Создана страница `tremalkin.html` как отдельный региональный путеводитель по Тремалкину.
- В `assets/shared.js` в список `WOT_NATION_ITEMS` добавлен пункт `Тремалкин`.
- На `sea-folk.html` добавлена перекрёстная ссылка на Тремалкин.
- На `daaltian.html` добавлена перекрёстная ссылка на Тремалкин.
- Во всех HTML обновлены версии `styles.css?v=109` и `shared.js?v=109` для сброса кеша навигации.

Проверки:
- `assets/shared.js` проходит `node --check`.
- `tremalkin.html`, `sea-folk.html`, `daaltian.html`: по одному `DOCTYPE`, одному `<html>`, одному `<body>`.
- `tremalkin.html` содержит основные разделы: Ата'ан Миэйр, Тремалкин, Дааль'тиан, Что важно знать.
- `WOT_NATION_ITEMS` содержит `tremalkin.html`.
- Битых ссылок на `tremalking.html` не осталось.
