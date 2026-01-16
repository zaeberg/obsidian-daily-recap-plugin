# Refactor Plugin Architecture to Clean Architecture

**Status**: `ready`

## Problem Statement

Рефакторить monolithic плагин (426 строк в `main.ts`) в layered Clean Architecture для обеспечения:
- Поддерживаемости кода (явное разделение ответственности)
- Тестируемости бизнес-логики без mock'ов Obsidian API
- Расширяемости для будущих изменений

**Текущее состояние**: Вся логика в одном файле `src/main.ts`, невозможность unit тестировать бизнес-логику.

**Целевое состояние**: 4-слойная архитектура (domain/infrastructure/application/presentation) с чёткими границами зависимостей.

## Questions Resolved

- Q: Какой стиль архитектуры использовать?
  A: Layered (Clean Architecture) с Dependency Rule

- Q: Нужны ли тесты?
  A: Да, unit тесты для domain и application слоёв

- Q: Что меняется чаще всего?
  A: Всё примерно одинаково → архитектура должна быть симметричной

## Edge Cases & Considerations

- [ ] Сохранение работоспособности плагина после каждого шага → Работаем инкрементально, plugin остаётся функциональным
- [ ] Минимизация breaking changes для пользователя → Те же hotkeys/UI, та же функциональность
- [ ] Избежание "big bang" рефакторинга → Разбиваем на безопасные, проверяемые шаги
- [ ] Отсутствие git/бэкапов → Работаем напрямую, осторожно с критическими изменениями

## Relevant Context

- `src/main.ts:1-426` - Текущий monolithic код (все зависимости в одном месте)
- `src/main.ts:11-34` - Интерфейсы `ReportInfo`, `PluginSettings`, `DailyNoteData` (станут domain entities)
- `src/main.ts:60-98` - Метод `generateRecap()` (станет Use Case)
- `src/main.ts:100-144` - Методы `getDailyNotes()`, `parseFrontmatter()` (станут repository + parser)
- `src/main.ts:146-208` - Метод `prepareReportData()` (станет часть Use Case + сервисы)
- `src/main.ts:210-289` - Метод `generateRecapContent()` (станет `ReportGeneratorService`)
- `src/main.ts:291-319` - Метод `extractSections()` (станет `SectionExtractor`)
- `src/main.ts:350-354` - Метод `isWorkday()` (станет `WorkdayChecker`)
- `src/main.ts:387-425` - Класс `DailyRecapSettingTab` (станет presentation слой)
- `CLAUDE.md` - Требования к layered архитектуре

## Feature Steps

> **Note**: Каждый шаг описывает user story или значимый milestone прогресса, не детали реализации.

- [x] **Настроен Vitest для unit тестирования**
  - **Business Value**: Инфраструктура для автоматического тестирования; быстрый feedback при разработке
  - **Depends on**: none
  - **Definition of Done**:
    - [x] Vitest установлен (`npm install -D vitest @vitest/ui`)
    - [x] Создан `vitest.config.ts` с настройками для TypeScript
    - [x] Добавлен скрипт `npm test` в `package.json`
    - [x] Создан пример теста в `tests/unit/example.test.ts`
    - [x] `npm test` запускается успешно
  - **Touches**: `package.json`, `vitest.config.ts`, `tests/unit/example.test.ts`

- [x] **Создана базовая структура проекта и domain entities**
  - **Business Value**: Фундамент для layered архитектуры; явное определение сущностей бизнеса
  - **Depends on**: none
  - **Definition of Done**:
    - [x] Создана папка структура `domain/`, `infrastructure/`, `application/`, `presentation/`, `di/`
    - [x] Вынесены `DailyNote`, `ReportInfo`, `ReportData`, `PluginSettings` в `domain/entities/`
    - [x] Все entities имеют чистые TypeScript interfaces без зависимостей от Obsidian
    - [x] Плагин компилируется и запускается (функциональность пока та же)
  - **Touches**: `src/main.ts`, новые файлы `domain/entities/*.ts`

- [x] **Парсеры работают независимо от Obsidian API**
  - **Business Value**: Изолированная, тестируемая логика парсинга; можно unit тестить без mock'ов
  - **Depends on**: "Настроен Vitest", "Создана базовая структура"
  - **Definition of Done**:
    - [x] `FrontmatterParser` вынесен в `domain/parsers/` с чистыми функциями
    - [x] `SectionExtractor` вынесен в `domain/parsers/` с чистыми функциями
    - [x] Оба парсера имеют unit тесты с fixtures
    - [x] `main.ts` использует новые парсеры через импорты
  - **Touches**: `domain/parsers/FrontmatterParser.ts`, `domain/parsers/SectionExtractor.ts`, `tests/unit/domain/parsers/*.test.ts`, `main.ts:128-144`, `main.ts:291-319`

- [x] **Domain сервисы инкапсулируют бизнес-правила**
  - **Business Value**: Чистая бизнес-логика изолирована от infrastructure; тестируемость без зависимостей
  - **Depends on**: "Парсеры работают независимо"
  - **Definition of Done**:
    - [x] `ChangeTrackerService` в `domain/services/` (логика отслеживания mtime)
    - [x] `ReportGeneratorService` в `domain/services/` (генерация markdown)
    - [x] `MissingDaysService` в `domain/services/` (поиск пропущенных дней)
    - [x] `WorkdayChecker` в `domain/utils/` (проверка выходных)
    - [x] Все сервисы имеют unit тесты
    - [x] Сервисы не зависят от Obsidian API
  - **Touches**: `domain/services/ChangeTrackerService.ts`, `domain/services/ReportGeneratorService.ts`, `domain/services/MissingDaysService.ts`, `domain/utils/WorkdayChecker.ts`, `tests/unit/domain/services/*.test.ts`, `main.ts:146-348`

- [x] **Infrastructure адаптеры изолируют Obsidian API**
  - **Business Value**: Чёткая граница с внешней системой; лёгкая замена моками в тестах
  - **Depends on**: "Domain сервисы инкапсулируют бизнес-правила"
  - **Definition of Done**:
    - [x] `VaultAdapter` в `infrastructure/adapters/` (обёртка над `app.vault`)
    - [x] `SettingsAdapter` в `infrastructure/adapters/` (обёртка над `loadData`/`saveData`)
    - [x] `DailyNoteRepository` в `infrastructure/repositories/` (поиск daily notes)
    - [x] `ReportRepository` в `infrastructure/repositories/` (сохранение отчётов)
    - [x] Адаптеры имеют интерфейсы для мокания в тестах
    - [x] Весь код Obsidian API находится только в этом слое
  - **Touches**: `infrastructure/adapters/VaultAdapter.ts`, `infrastructure/adapters/SettingsAdapter.ts`, `infrastructure/repositories/DailyNoteRepository.ts`, `infrastructure/repositories/ReportRepository.ts`, `main.ts:60-98`, `main.ts:356-366`

- [x] **Use Case координирует генерацию отчёта**
  - **Business Value**: Явный оркестратор всего процесса; единая точка входа для бизнес-логики
  - **Depends on**: "Infrastructure адаптеры изолируют Obsidian API"
  - **Definition of Done**:
    - [x] `GenerateRecapUseCase` в `application/` создан
    - [x] Use Case использует repositories и domain сервисы через DI
    - [x] Вся логика из `main.ts:generateRecap()` перенесена в Use Case
    - [x] Use Case имеет unit тест с mock'ами repositories
    - [x] `main.ts` только вызывает Use Case, не содержит бизнес-логики
  - **Touches**: `application/GenerateRecapUseCase.ts`, `tests/unit/application/GenerateRecapUseCase.test.ts`, `main.ts:60-98`

- [x] **Presentation слой отделён от бизнес-логики**
  - **Business Value**: UI не содержит бизнес-логики; легко менять UI независимо от логики
  - **Depends on**: "Use Case координирует генерацию отчёта"
  - **Definition of Done**:
    - [x] `DailyRecapSettingTab` вынесен в `presentation/`
    - [x] `UIComponents` вынесен в `presentation/` (ribbon icon, commands)
    - [x] Presentation только вызывает Use Case, не содержит бизнес-логики
    - [x] Настройки работают как раньше (отображение lastReport, reports count)
  - **Touches**: `presentation/DailyRecapSettingTab.ts`, `presentation/UIComponents.ts`, `main.ts:39-58`, `main.ts:387-425`

- [x] **Dependency Injection контейнер связывает компоненты**
  - **Business Value**: Явные зависимости; легкое тестирование (можно подменить реализации)
  - **Depends on**: "Presentation слой отделён от бизнес-логики"
  - **Definition of Done**:
    - [x] `Container` в `di/` создан (фабрика для создания зависимостей)
    - [x] Все зависимости явно прописаны (no implicit deps)
    - [x] `main.ts` использует Container для создания Use Case и presentation
    - [x] В продакшене Container создаёт реальные реализации
    - [x] В тестах Container может создавать mock'и
  - **Touches**: `di/Container.ts`, `main.ts:1-58`

- [x] **Все тесты проходят, плагин работает**
  - **Business Value**: Уверенность в корректности рефакторинга; функциональность сохранена
  - **Depends on**: "Dependency Injection контейнер связывает компоненты"
  - **Definition of Done**:
    - [x] Все unit тесты проходят (62 теста, 100% pass)
    - [x] Плагин собирается (npm run build - success)
    - [x] Плагин готов к установке в Obsidian
    - [ ] Ручное тестирование: генерация отчёта работает (требует установки в Obsidian)
    - [ ] Ручное тестирование: настройки отображаются корректно (требует установки в Obsidian)
    - [ ] Ручное тестирование: изменения отслеживаются корректно (требует установки в Obsidian)
    - [ ] История отчётов сохраняется и используется (требует установки в Obsidian)
  - **Touches**: Все файлы, мануальное тестирование в Obsidian

## Testing Strategy

### Unit Tests (Vitest)
**Framework**: Vitest с поддержкой TypeScript

**Coverage**:
- **FrontmatterParser**: Тестовые данные с разным frontmatter (валидный, невалидный, отсутствующий)
- **SectionExtractor**: Разные markdown форматы, секции на русском, пустые секции
- **ChangeTrackerService**: Моковые данные mtime, проверка детекции изменений
- **ReportGeneratorService**: Фикстуры daily notes, проверка генерации markdown
- **MissingDaysService**: Разные диапазоны дат, выходные/будни
- **WorkdayChecker**: Все дни недели

**Запуск**: `npm test` (Vitest watch mode)
**CI**: Запускается автоматически при изменении файлов

### Integration Tests (Application Layer)
- **GenerateRecapUseCase**: Mock'и для repositories, проверка координации сервисов

### Manual Testing (E2E)
_Выполняется пользователем самостоятельно после каждого шага_

1. Установить плагин в Obsidian после рефакторинга
2. Создать несколько daily notes с `type: daily`
3. Сгенерировать отчёт → проверить содержимое
4. Изменить один из daily notes → сгенерировать новый отчёт → проверить пометку "⚠️ Updated"
5. Пропустить рабочий день → проверить секцию "Missing Days"
6. Проверить настройки (Last Report, Total Reports)
7. Проверить историю отчётов (отображение предыдущего отчёта)

### Performance Testing
- Проверить работу с большим количеством daily notes (100+ файлов)
- Убедиться что производительность не ухудшилась

**Примечание**: Git не используется, бэкапы не создаются. Работа ведётся напрямую в файловой системе.

## Notes

_(Worker добавляет заметки здесь при обнаружении проблем или блокеров)_
