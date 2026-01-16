import { describe, it, expect } from 'vitest';
import moment from 'moment';
import { ReportGeneratorService } from '../../../../src/domain/services/ReportGeneratorService';
import { ReportData, ReportInfo } from '../../../../src/domain/entities';

describe('ReportGeneratorService', () => {
  const createMockNote = (date: string, path: string, content: string) => ({
    date,
    path,
    content,
    exists: true,
    isWorkday: true,
  });

  describe('generateReport', () => {
    it('should generate report header with dates', () => {
      const reportData: ReportData = {
        startDate: moment('2024-01-08'),
        endDate: moment('2024-01-10'),
        allFiles: [],
        includedFiles: [],
      };
      const lastReport: ReportInfo = {
        reportDate: '2024-01-05',
        reportTime: '10:00',
        periodStart: '2024-01-05',
        filesIncluded: [],
      };

      const result = ReportGeneratorService.generateReport(
        reportData,
        lastReport,
        ['План (3 главных задачи)', 'Сегодня (рабочий лог)', 'Блокеры / вопросы', 'Итого']
      );

      expect(result).toContain('# Work Recap Report');
      expect(result).toContain('**Period:** 2024-01-08 - 2024-01-10');
      expect(result).toContain('Previous report: 2024-01-05 10:00');
    });

    it('should generate report without previous report', () => {
      const reportData: ReportData = {
        startDate: moment('2024-01-08'),
        endDate: moment('2024-01-10'),
        allFiles: [],
        includedFiles: [],
      };
      const lastReport = null;

      const result = ReportGeneratorService.generateReport(
        reportData,
        lastReport,
        ['План (3 главных задачи)', 'Сегодня (рабочий лог)', 'Блокеры / вопросы', 'Итого']
      );

      expect(result).toContain('# Work Recap Report');
      expect(result).not.toContain('Previous report:');
    });

    it('should group sections instead of days', () => {
      const noteContent = `---
type: daily
date: 2024-01-08
---

## План (3 главных задачи)
- Task 1
- Task 2

## Сегодня (рабочий лог)
- 09:00 Started work
- 10:30 Meeting`;

      const reportData: ReportData = {
        startDate: moment('2024-01-08'),
        endDate: moment('2024-01-08'),
        allFiles: [createMockNote('2024-01-08', '/2024-01-08.md', noteContent)],
        includedFiles: ['/2024-01-08.md'],
      };
      const lastReport = null;

      const result = ReportGeneratorService.generateReport(
        reportData,
        lastReport,
        ['План (3 главных задачи)', 'Сегодня (рабочий лог)']
      );

      // Проверяем что секции идут как ## заголовки верхнего уровня
      expect(result).toContain('## План (3 главных задачи)');
      expect(result).toContain('## Сегодня (рабочий лог)');

      // Проверяем что дни идут как элементы списка
      expect(result).toContain('- Monday, January 8, 2024');

      // Проверяем что контент имеет отступ
      expect(result).toContain('  - Task 1');
      expect(result).toContain('  - 09:00 Started work');
    });

    it('should handle multiple days in one section', () => {
      const note1Content = `---
type: daily
date: 2024-01-08
---

## План (3 главных задачи)
- Task Jan 8`;

      const note2Content = `---
type: daily
date: 2024-01-09
---

## План (3 главных задачи)
- Task Jan 9`;

      const reportData: ReportData = {
        startDate: moment('2024-01-08'),
        endDate: moment('2024-01-09'),
        allFiles: [
          createMockNote('2024-01-08', '/2024-01-08.md', note1Content),
          createMockNote('2024-01-09', '/2024-01-09.md', note2Content),
        ],
        includedFiles: ['/2024-01-08.md', '/2024-01-09.md'],
      };
      const lastReport = null;

      const result = ReportGeneratorService.generateReport(
        reportData,
        lastReport,
        ['План (3 главных задачи)']
      );

      // Оба дня должны быть в одной секции
      const planSection = result.match(/## План \(3 главных задачи\)([\s\S]*?)(?=##|$)/)?.[0];
      expect(planSection).toBeDefined();
      expect(planSection).toContain('- Monday, January 8, 2024');
      expect(planSection).toContain('  - Task Jan 8');
      expect(planSection).toContain('- Tuesday, January 9, 2024');
      expect(planSection).toContain('  - Task Jan 9');
    });

    it('should order days chronologically within sections', () => {
      const note1Content = `---
type: daily
date: 2024-01-08
---

## План (3 главных задачи)
- Task Jan 8`;

      const note2Content = `---
type: daily
date: 2024-01-10
---

## План (3 главных задачи)
- Task Jan 10`;

      // allFiles в обратном порядке
      const reportData: ReportData = {
        startDate: moment('2024-01-08'),
        endDate: moment('2024-01-10'),
        allFiles: [
          createMockNote('2024-01-10', '/2024-01-10.md', note2Content),
          createMockNote('2024-01-08', '/2024-01-08.md', note1Content),
        ],
        includedFiles: ['/2024-01-08.md', '/2024-01-10.md'],
      };
      const lastReport = null;

      const result = ReportGeneratorService.generateReport(
        reportData,
        lastReport,
        ['План (3 главных задачи)']
      );

      // Находим позиции дней в секции
      const jan8Index = result.indexOf('Monday, January 8, 2024');
      const jan10Index = result.indexOf('Wednesday, January 10, 2024');

      // Jan 8 должен идти раньше Jan 10 (хронологический порядок)
      expect(jan8Index).toBeLessThan(jan10Index);
      expect(jan8Index).toBeGreaterThan(-1);
      expect(jan10Index).toBeGreaterThan(-1);
    });

    it('should order sections according to includedSections', () => {
      const noteContent = `---
type: daily
date: 2024-01-08
---

## План (3 главных задачи)
- Task 1

## Сегодня (рабочий лог)
- 09:00 Work

## Блокеры / вопросы
- Blocker 1`;

      const reportData: ReportData = {
        startDate: moment('2024-01-08'),
        endDate: moment('2024-01-08'),
        allFiles: [createMockNote('2024-01-08', '/2024-01-08.md', noteContent)],
        includedFiles: ['/2024-01-08.md'],
      };
      const lastReport = null;

      const result = ReportGeneratorService.generateReport(
        reportData,
        lastReport,
        ['Сегодня (рабочий лог)', 'План (3 главных задачи)', 'Блокеры / вопросы']
      );

      // Проверяем порядок секций
      const todayIndex = result.indexOf('## Сегодня (рабочий лог)');
      const planIndex = result.indexOf('## План (3 главных задачи)');
      const blockersIndex = result.indexOf('## Блокеры / вопросы');

      expect(todayIndex).toBeLessThan(planIndex);
      expect(planIndex).toBeLessThan(blockersIndex);
    });

    it('should skip empty sections', () => {
      const noteContent = `---
type: daily
date: 2024-01-08
---

## План (3 главных задачи)
- Task 1`;

      const reportData: ReportData = {
        startDate: moment('2024-01-08'),
        endDate: moment('2024-01-08'),
        allFiles: [createMockNote('2024-01-08', '/2024-01-08.md', noteContent)],
        includedFiles: ['/2024-01-08.md'],
      };
      const lastReport = null;

      const result = ReportGeneratorService.generateReport(
        reportData,
        lastReport,
        ['План (3 главных задачи)', 'Сегодня (рабочий лог)', 'Блокеры / вопросы']
      );

      // План должен быть
      expect(result).toContain('## План (3 главных задачи)');

      // Пустые секции не должны быть
      expect(result).not.toContain('## Сегодня (рабочий лог)');
      expect(result).not.toContain('## Блокеры / вопросы');
    });

    it('should skip days where section is empty', () => {
      const note1Content = `---
type: daily
date: 2024-01-08
---

## План (3 главных задачи)
- Task Jan 8`;

      const note2Content = `---
type: daily
date: 2024-01-09
---

## Сегодня (рабочий лог)
- Work on Jan 9`;

      const reportData: ReportData = {
        startDate: moment('2024-01-08'),
        endDate: moment('2024-01-09'),
        allFiles: [
          createMockNote('2024-01-08', '/2024-01-08.md', note1Content),
          createMockNote('2024-01-09', '/2024-01-09.md', note2Content),
        ],
        includedFiles: ['/2024-01-08.md', '/2024-01-09.md'],
      };
      const lastReport = null;

      const result = ReportGeneratorService.generateReport(
        reportData,
        lastReport,
        ['План (3 главных задачи)', 'Сегодня (рабочий лог)']
      );

      // В секции План должен быть только Jan 8
      const planSection = result.match(/## План \(3 главных задачи\)([\s\S]*?)(?=## Сегодня|$)/)?.[0];
      expect(planSection).toBeDefined();
      expect(planSection).toContain('Monday, January 8, 2024');
      expect(planSection).not.toContain('Tuesday, January 9, 2024');

      // В секции Сегодня должен быть только Jan 9
      const todaySection = result.match(/## Сегодня \(рабочий лог\)([\s\S]*?)(?=---|$)/)?.[0];
      expect(todaySection).toBeDefined();
      expect(todaySection).toContain('Tuesday, January 9, 2024');
      expect(todaySection).not.toContain('Monday, January 8, 2024');
    });

    it('should handle notes without any matching sections', () => {
      const noteContent = `---
type: daily
date: 2024-01-08
---

No sections here`;

      const reportData: ReportData = {
        startDate: moment('2024-01-08'),
        endDate: moment('2024-01-08'),
        allFiles: [createMockNote('2024-01-08', '/2024-01-08.md', noteContent)],
        includedFiles: ['/2024-01-08.md'],
      };
      const lastReport = null;

      const result = ReportGeneratorService.generateReport(
        reportData,
        lastReport,
        ['План (3 главных задачи)', 'Сегодня (рабочий лог)']
      );

      // Должно быть сообщение что нет контента
      expect(result).toContain('*No daily notes found or no matching sections*');
    });

    it('should filter out non-included files', () => {
      const noteContent = `---
type: daily
date: 2024-01-08
---

## План (3 главных задачи)
- Task 1`;

      const reportData: ReportData = {
        startDate: moment('2024-01-08'),
        endDate: moment('2024-01-08'),
        allFiles: [
          createMockNote('2024-01-08', '/2024-01-08.md', noteContent),
          createMockNote('2024-01-09', '/2024-01-09.md', noteContent),
        ],
        includedFiles: ['/2024-01-08.md'], // Только первый файл
      };
      const lastReport = null;

      const result = ReportGeneratorService.generateReport(
        reportData,
        lastReport,
        ['План (3 главных задачи)']
      );

      // Должен быть только Jan 8
      expect(result).toContain('Monday, January 8, 2024');
      // Не должно быть Jan 9
      expect(result).not.toContain('Tuesday, January 9, 2024');
    });

    it('should not mark files as updated (no change tracking)', () => {
      const noteContent = `---
type: daily
date: 2024-01-08
---

## План (3 главных задачи)
- Task 1`;

      const reportData: ReportData = {
        startDate: moment('2024-01-08'),
        endDate: moment('2024-01-08'),
        allFiles: [createMockNote('2024-01-08', '/2024-01-08.md', noteContent)],
        includedFiles: ['/2024-01-08.md'],
      };
      const lastReport: ReportInfo = {
        reportDate: '2024-01-05',
        reportTime: '10:00',
        periodStart: '2024-01-05',
        filesIncluded: ['/2024-01-08.md'],
      };

      const result = ReportGeneratorService.generateReport(
        reportData,
        lastReport,
        ['План (3 главных задачи)']
      );

      // Не должно быть пометок об обновлениях
      expect(result).not.toContain('⚠️ Updated since last report');
      // Но контент должен быть включён
      expect(result).toContain('## План (3 главных задачи)');
      expect(result).toContain('  - Task 1');
    });

    it('should handle empty includedSections (fallback to all sections)', () => {
      const noteContent = `---
type: daily
date: 2024-01-08
---

## Custom Section
- Custom content`;

      const reportData: ReportData = {
        startDate: moment('2024-01-08'),
        endDate: moment('2024-01-08'),
        allFiles: [createMockNote('2024-01-08', '/2024-01-08.md', noteContent)],
        includedFiles: ['/2024-01-08.md'],
      };
      const lastReport = null;

      const result = ReportGeneratorService.generateReport(
        reportData,
        lastReport,
        [] // Пустой includedSections
      );

      // Должна извлечься Custom Section (fallback)
      expect(result).toContain('## Custom Section');
      expect(result).toContain('  - Custom content');
    });
  });

  describe('generateMissingDaysSection', () => {
    it('should generate missing days section', () => {
      const missingDays = [
        { date: 'Monday, January 8, 2024', reason: 'No daily note' },
        { date: 'Saturday, January 6, 2024', reason: 'Weekend/Holiday' },
      ];

      const result =
        ReportGeneratorService.generateMissingDaysSection(missingDays);

      expect(result).toContain('## Missing Days');
      expect(result).toContain('- Monday, January 8, 2024 No daily note');
      expect(result).toContain('- Saturday, January 6, 2024 Weekend/Holiday');
    });

    it('should return empty string for no missing days', () => {
      const result = ReportGeneratorService.generateMissingDaysSection([]);

      expect(result).toBe('');
    });
  });
});
