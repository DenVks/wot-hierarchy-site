# WoT Hierarchy Site

Статический сайт для публикации через GitHub Pages.

## Быстрый деплой через GitHub Pages

1. Создать новый репозиторий на GitHub, например `wot-hierarchy-site`.
2. Загрузить в корень репозитория все файлы из этого архива.
3. Убедиться, что `index.html` находится именно в корне репозитория.
4. Открыть `Settings` → `Pages`.
5. В блоке `Build and deployment` выбрать:
   - Source: `Deploy from a branch`
   - Branch: `main`
   - Folder: `/ (root)`
6. Нажать `Save`.

После публикации сайт будет доступен по адресу вида:

```text
https://<github-username>.github.io/<repository-name>/
```

## Автообновление

Если включён GitHub Pages из ветки `main`, сайт будет автоматически обновляться после каждого изменения файлов в этой ветке.

Типовой цикл обновления:

```bash
git add .
git commit -m "Update site"
git push
```

GitHub сам пересоберёт и опубликует сайт.

## Проверки перед публикацией

- `index.html` лежит в корне.
- Пути к CSS/JS относительные: `assets/styles.css`, `assets/shared.js`.
- Файл `.nojekyll` добавлен, чтобы GitHub Pages не применял Jekyll-обработку.
