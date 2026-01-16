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

    it('should include note sections with content', () => {
      const noteContent = `---
type: daily
date: 2024-01-08
---

## План (3 главных задачи)
- Task 1

## Сегодня (рабочий лог)
- 09:00 Started work`;

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
        ['План (3 главных задачи)', 'Сегодня (рабочий лог)', 'Блокеры / вопросы', 'Итого']
      );

      expect(result).toContain('## Monday, January 8, 2024');
      expect(result).toContain('### План (3 главных задачи)');
      expect(result).toContain('- Task 1');
      expect(result).toContain('### Сегодня (рабочий лог)');
      expect(result).toContain('- 09:00 Started work');
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
        ['План (3 главных задачи)', 'Сегодня (рабочий лог)', 'Блокеры / вопросы', 'Итого']
      );

      // Не должно быть пометок об обновлениях
      expect(result).not.toContain('⚠️ Updated since last report');
      // Но контент должен быть включён
      expect(result).toContain('### План (3 главных задачи)');
      expect(result).toContain('- Task 1');
    });

    it('should handle notes without content', () => {
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
        ['План (3 главных задачи)', 'Сегодня (рабочий лог)', 'Блокеры / вопросы', 'Итого']
      );

      expect(result).toContain('*No matching sections found*');
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
        includedFiles: ['/2024-01-08.md'], // Only first file included
      };
      const lastReport = null;

      const result = ReportGeneratorService.generateReport(
        reportData,
        lastReport,
        ['План (3 главных задачи)', 'Сегодня (рабочий лог)', 'Блокеры / вопросы', 'Итого']
      );

      // Should only include the first note (2024-01-08)
      expect(result).toContain('Monday, January 8, 2024');
      expect(result).toContain('Task 1');
      // Should not include the second note
      expect(result).not.toContain('Tuesday, January 9, 2024');
    });

    it('should order notes from oldest to newest', () => {
      const noteContent = `---
type: daily
date: 2024-01-08
---

## План (3 главных задачи)
- Task for Jan 8`;

      const note2Content = `---
type: daily
date: 2024-01-10
---

## План (3 главных задачи)
- Task for Jan 10`;

      // allFiles в обратном порядке (как возвращает репозиторий)
      const reportData: ReportData = {
        startDate: moment('2024-01-08'),
        endDate: moment('2024-01-10'),
        allFiles: [
          createMockNote('2024-01-10', '/2024-01-10.md', note2Content),
          createMockNote('2024-01-08', '/2024-01-08.md', noteContent),
        ],
        includedFiles: ['/2024-01-08.md', '/2024-01-10.md'],
      };
      const lastReport = null;

      const result = ReportGeneratorService.generateReport(
        reportData,
        lastReport,
        ['План (3 главных задачи)', 'Сегодня (рабочий лог)', 'Блокеры / вопросы', 'Итого']
      );

      // Находим позиции заголовков
      const jan8Index = result.indexOf('Monday, January 8, 2024');
      const jan10Index = result.indexOf('Wednesday, January 10, 2024');

      // Jan 8 должен идти раньше Jan 10 (хронологический порядок)
      expect(jan8Index).toBeLessThan(jan10Index);
      expect(jan8Index).toBeGreaterThan(-1);
      expect(jan10Index).toBeGreaterThan(-1);
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
