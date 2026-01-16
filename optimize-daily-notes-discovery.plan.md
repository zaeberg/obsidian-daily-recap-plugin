# Оптимизация поиска Daily Notes

**Status**: `complete`

## Problem Statement
Сейчас `DailyNoteRepository` ищет daily notes по всему vault, перебирая все markdown файлы. Это неэффективно, так как в Obsidian встроенный плагин Daily Notes хранит все ежедневные заметки в одной папке, которая указана в его настройках. Нужно оптимизировать поиск, используя эту папку.

## Questions Resolved
- Q: Как обрабатывать ситуацию, если встроенный плагин Daily Notes отключён или не настроена папка для daily notes?
  A: Показывать ошибку пользователю с просьбой настроить встроенный плагин

## Edge Cases & Considerations
- [x] Встроенный плагин Daily Notes отключён → Показать ошибку пользователю
- [x] Папка Daily Notes не указана в настройках → Показать ошибку пользователю
- [x] Папка Daily Notes пуста → Вернуть пустой массив (не ошибка, просто нет заметок)
- [x] В папке есть файлы без frontmatter type: daily → Игнорировать такие файлы
- [x] Путь к папке содержит относительные пути (например, "Daily Notes" или "/Daily Notes") → Нормализовать путь

## Relevant Context
- `src/infrastructure/repositories/DailyNoteRepository.ts:18-43` - Метод `findAll()` который сейчас сканирует весь vault
- `src/infrastructure/adapters/VaultAdapter.ts` - Адаптер для работы с Vault API
- `src/di/Container.ts:42-44` - Создание DailyNoteRepository через DI
- `src/main.ts:6` - Экземпляр App доступен через `this.app`

## Feature Steps
> **Note**: Каждый шаг представляет пользовательскую историю или значимую часть функциональности, а не детали реализации.

- [x] **Получение папки Daily Notes из настроек Obsidian**
  - **Business Value**: Позволяет определить правильную директорию для поиска вместо сканирования всего vault
  - **Depends on**: none
  - **Definition of Done**:
    - [x] Добавлен способ получить путь к папке из встроенного плагина Daily Notes
    - [x] Путь корректно извлекается из настроек Obsidian
    - [x] Обрабатываются случаи когда плагин отключён или папка не настроена
  - **Touches**: `src/infrastructure/adapters/VaultAdapter.ts`, `src/infrastructure/repositories/DailyNoteRepository.ts`

- [x] **Фильтрация markdown файлов по папке**
  - **Business Value**: Устраняет необходимость сканировать весь vault, значительно улучшая производительность
  - **Depends on**: Получение папки Daily Notes из настроек Obsidian
  - **Definition of Done**:
    - [x] VaultAdapter получает только файлы из указанной папки
    - [x] Корректно обрабатываются пути с/без начального слеша
    - [x] Пустой путь к папке обрабатывается как корень vault (fallback)
  - **Touches**: `src/infrastructure/adapters/VaultAdapter.ts`

- [x] **Обновление логики поиска в DailyNoteRepository**
  - **Business Value**: Использует оптимизированный поиск по папке вместо полного сканирования vault
  - **Depends on**: Фильтрация markdown файлов по папке
  - **Definition of Done**:
    - [x] `findAll()` использует папку из настроек Daily Notes
    - [x] Показывает ошибку пользователю если плагин не настроен
    - [x] Сортировка результатов по убыванию даты сохраняется
  - **Touches**: `src/infrastructure/repositories/DailyNoteRepository.ts`

- [x] **Обновление DI контейнера для передачи App**
  - **Business Value**: Позволяет репозиторию получить доступ к настройкам Obsidian
  - **Depends on**: none
  - **Definition of Done**:
    - [x] App доступен в DailyNoteRepository через DI
    - [x] Зависимости корректно передаются через контейнер
  - **Touches**: `src/di/Container.ts`, `src/infrastructure/repositories/DailyNoteRepository.ts`

## Testing Strategy
- **Unit тесты** для новых методов:
  - Тест получения папки из настроек Daily Notes (включая случаи когда плагин отключён)
  - Тест фильтрации файлов по папке (включая граничные случаи с путями)
  - Тест обработки пустой папки
- **Ручное тестирование** пользователем на реальном vault после реализации

## Notes
- В Obsidian настройки встроенного плагина Daily Notes доступны через `app.internalPlugins.plugins['daily-notes']`
- Возможно понадобится использовать `app.vault.getConfig('daily-notes-folder')` или напрямую обращаться к internalPlugins
- **[Implementation Complete]** Все задачи реализованы, 81 тест проходит (включая 19 новых тестов для ObsidianSettingsAdapter и VaultAdapter)
- Для корректной работы тестов добавлен mock для obsidian API в `tests/mocks/obsidian.ts`
- Vitest настроен с alias для подмены obsidian на mock при тестировании
