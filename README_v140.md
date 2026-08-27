# v140 · Scream v2.4 manifest fix

Корректирующий патч к v139 для Иерархии Крик.

## Исправлено

- Полностью перепроверен архив `WoT_site_patch_v139_Крик_v2.4(2).zip`.
- В v139 были пропущены обновлённые изображения:
  - `assets/hierarchies/scream/KR-06.png`
  - `assets/hierarchies/scream/KR-structure.png`
- Оба файла включены в v140.
- `scream.html` взят из пользовательского архива и нормализован под cache-busting v140.
- Добавлен manifest-аудит `SCREAM_HIERARCHY_V24_MANIFEST_AUDIT_v140.md`.

## Изменённые runtime-файлы

- `scream.html`
- `assets/hierarchies/scream/KR-06.png`
- `assets/hierarchies/scream/KR-structure.png`
- `VERSION.txt`
