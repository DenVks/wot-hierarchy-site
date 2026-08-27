# SCREAM_HIERARCHY_V24_MANIFEST_AUDIT_v140

Цель: перепроверить архив `WoT_site_patch_v139_Крик_v2.4(2).zip`, установить, что было пропущено в v139, и выпустить корректирующий v140.

## 1. Состав исходного архива пользователя

| Файл | Размер | SHA-256 | Статус v140 |
|---|---:|---|---|
| `README_v139.md` | 2175 | `a3a71a84a8a969e32ba1d66b1ef3528ae81dd5d4fd0900fd0cbe2721afea0c07` | учтён как исходная документация; заменён README/AUDIT v140 |
| `SCREAM_HIERARCHY_V24_INTEGRATION_AUDIT_v139.md` | 2027 | `50aa1af8734cd39074e687d0186ada432748a4c4a68d1c479b384390fd3cb4cd` | учтён как исходная документация; заменён README/AUDIT v140 |
| `VERSION.txt` | 51 | `d271861b3470bc169479d7a65fab10b450871828a11ea7ffefe31820baca4d48` | применён |
| `assets/hierarchies/scream/KR-06.png` | 3963721 | `d1fd908d80dea0e5253f84cab7fbe5657743bd433686923b00fc64e6b55bf127` | применён |
| `assets/hierarchies/scream/KR-structure.png` | 3679612 | `e461f2f0ed17a4806b884026c9f27e3eba1b285712eaaf5e75c0d66d9c025628` | применён |
| `scream.html` | 153176 | `18c1d6f21f0b226aa9c1aa68a9655d80f7d60d95bb40849a1db7f4855938b49d` | применён |

## 2. Что было неполным в v139

В v139 patch отсутствовали два файла из пользовательского архива:

- `assets/hierarchies/scream/KR-06.png`
- `assets/hierarchies/scream/KR-structure.png`

В результате HTML обновился, но две обновлённые иллюстрации из пакета не были доставлены в patch.

## 3. Файлы v140 patch

| Файл | Размер | SHA-256 |
|---|---:|---|
| `README_v140.md` | 848 | `0a803b76a94acd25c80629443e0ec3686024f39e97628b5133a10c38a5ca313a` |
| `SCREAM_HIERARCHY_V24_MANIFEST_AUDIT_v140.md` | 1849 | `49c4ab5587a5ff64920afde278d420c335f87fa62202275575fa35879a1c2181` |
| `VERSION.txt` | 73 | `75b4409348a4b0f34e212ff4d330b81bd488035f2a02f5b257e2e44ff92e1b00` |
| `assets/hierarchies/scream/KR-06.png` | 3963721 | `d1fd908d80dea0e5253f84cab7fbe5657743bd433686923b00fc64e6b55bf127` |
| `assets/hierarchies/scream/KR-structure.png` | 3679612 | `e461f2f0ed17a4806b884026c9f27e3eba1b285712eaaf5e75c0d66d9c025628` |
| `scream.html` | 153176 | `d8cceabcc36440e5e08bc054e2131a4224b907ff87c60ad227c2571ef46ce50d` |

## 4. Нормализация

- `scream.html` взят из архива пользователя, но cache-busting нормализован до `assets/styles.css?v=140` и `assets/shared.js?v=140`.
- `VERSION.txt` заменён на v140, чтобы сборка не маркировалась как v139.
- Служебные исходные `README_v139.md` и `SCREAM_HIERARCHY_V24_INTEGRATION_AUDIT_v139.md` не перенесены как runtime-файлы; их содержание учтено в этом manifest-аудите.

## 5. Проверки

- `scream.html` не содержит `data:image`.
- Все ссылки `assets/hierarchies/scream/...` из `scream.html` разрешаются в существующие файлы.
- `KR-06.png` и `KR-structure.png` в итоговой сборке имеют хэши пользовательского архива.
- Повторная проверка служебных надписей: явных `Игроковая редакция`, `О документе`, `Codex Hierarchiarum`, `site_package` нет.
