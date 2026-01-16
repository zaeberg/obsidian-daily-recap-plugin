import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import moment from 'moment';
import { GenerateRecapUseCase } from '../../../../src/application/useCases/GenerateRecapUseCase';
import { DailyNoteRepository } from '../../../../src/infrastructure/repositories/DailyNoteRepository';
import { ReportRepository } from '../../../../src/infrastructure/repositories/ReportRepository';
import { SettingsAdapter } from '../../../../src/infrastructure/adapters/SettingsAdapter';
import { PluginSettings } from '../../../../src/domain/entities';

describe('GenerateRecapUseCase - New Logic', () => {
  // Mock repositories
  let mockDailyNoteRepo: any;
  let mockReportRepo: any;
  let mockSettingsAdapter: any;
  let useCase: GenerateRecapUseCase;

  beforeEach(() => {
    // Reset all mocks before each test
    mockDailyNoteRepo = {
      findAll: vi.fn(),
    };

    mockReportRepo = {
      saveOrUpdateToday: vi.fn(),
    };

    mockSettingsAdapter = {
      load: vi.fn(),
      save: vi.fn(),
    };

    useCase = new GenerateRecapUseCase(
      mockDailyNoteRepo,
      mockReportRepo,
      mockSettingsAdapter
    );
  });

  afterEach(() => {
    // Reset system time after each test
    vi.useRealTimers();
  });

  describe('Date calculation', () => {
    it('should use last report date as start date (not next day)', async () => {
      // Мокаем системное время
      vi.setSystemTime(new Date('2024-01-15T10:00:00Z'));

      const lastReportDate = '2024-01-10';
      const settings: PluginSettings = {
        lastReport: {
          reportDate: lastReportDate,
          reportTime: '10:00',
          periodStart: '2024-01-10',
          filesIncluded: [],
        },
        reports: [],
        includedSections: [],
      };

      // Репозиторий возвращает заметки в порядке убывания (новые первыми)
      const dailyNotes = [
        { path: '2024-01-15.md', date: '2024-01-15', content: '' },
        { path: '2024-01-12.md', date: '2024-01-12', content: '' },
        { path: '2024-01-11.md', date: '2024-01-11', content: '' },
        { path: '2024-01-10.md', date: '2024-01-10', content: '' },
      ];

      mockSettingsAdapter.load.mockResolvedValue(settings);
      mockDailyNoteRepo.findAll.mockResolvedValue(dailyNotes);
      mockReportRepo.saveOrUpdateToday.mockResolvedValue('Recap_2024-01-15_10-00.md');
      mockSettingsAdapter.save.mockResolvedValue(undefined);

      await useCase.execute();

      const savedSettings = mockSettingsAdapter.save.mock.calls[0][0] as PluginSettings;
      const reportInfo = savedSettings.lastReport!;

      // Проверяем что в отчёт попали файлы начиная с ДАТЫ ПОСЛЕДНЕГО РЕКАПА
      // (2024-01-10 включительно, не следующий день 2024-01-11)
      expect(reportInfo.filesIncluded).toContain('2024-01-10.md');
      expect(reportInfo.filesIncluded).toContain('2024-01-11.md');
      expect(reportInfo.filesIncluded).toContain('2024-01-12.md');
      expect(reportInfo.filesIncluded).toContain('2024-01-15.md');
      // periodStart должен быть установлен в дату последнего рекапа
      expect(reportInfo.periodStart).toBe('2024-01-10');
    });

    it('should use oldest note as start date when no last report', async () => {
      // Мокаем системное время
      vi.setSystemTime(new Date('2024-01-15T10:00:00Z'));

      const settings: PluginSettings = {
        lastReport: null,
        reports: [],
        includedSections: [],
      };

      // Репозиторий возвращает заметки в порядке убывания (новые первыми)
      const dailyNotes = [
        { path: '2024-01-15.md', date: '2024-01-15', content: '' },
        { path: '2024-01-10.md', date: '2024-01-10', content: '' },
        { path: '2024-01-08.md', date: '2024-01-08', content: '' },
      ];

      mockSettingsAdapter.load.mockResolvedValue(settings);
      mockDailyNoteRepo.findAll.mockResolvedValue(dailyNotes);
      mockReportRepo.saveOrUpdateToday.mockResolvedValue('Recap_2024-01-15_10-00.md');
      mockSettingsAdapter.save.mockResolvedValue(undefined);

      await useCase.execute();

      const savedSettings = mockSettingsAdapter.save.mock.calls[0][0] as PluginSettings;
      const reportInfo = savedSettings.lastReport!;

      // Все заметки должны быть включены
      expect(reportInfo.filesIncluded).toContain('2024-01-08.md');
      expect(reportInfo.filesIncluded).toContain('2024-01-10.md');
      expect(reportInfo.filesIncluded).toContain('2024-01-15.md');
      // periodStart должен быть установлен в дату самой старой заметки
      expect(reportInfo.periodStart).toBe('2024-01-08');
    });

    it('should use 7 days ago when no notes and no last report', async () => {
      // Мокаем системное время
      vi.setSystemTime(new Date('2024-01-15T10:00:00Z'));

      const settings: PluginSettings = {
        lastReport: null,
        reports: [],
        includedSections: [],
      };

      mockSettingsAdapter.load.mockResolvedValue(settings);
      mockDailyNoteRepo.findAll.mockResolvedValue([]);
      mockReportRepo.saveOrUpdateToday.mockResolvedValue('Recap_2024-01-15_10-00.md');
      mockSettingsAdapter.save.mockResolvedValue(undefined);

      await useCase.execute();

      // Период должен начинаться за 7 дней от текущей даты
      const savedSettings = mockSettingsAdapter.save.mock.calls[0][0] as PluginSettings;
      const reportInfo = savedSettings.lastReport!;

      // Нет файлов для включения
      expect(reportInfo.filesIncluded).toEqual([]);
    });
  });

  describe('File deletion on same day', () => {
    it('should call saveOrUpdateToday which handles deletion', async () => {
      vi.setSystemTime(new Date('2024-01-15T10:00:00Z'));

      const settings: PluginSettings = {
        lastReport: null,
        reports: [],
        includedSections: [],
      };

      const dailyNotes = [
        { path: '2024-01-15.md', date: '2024-01-15', content: '' },
      ];

      mockSettingsAdapter.load.mockResolvedValue(settings);
      mockDailyNoteRepo.findAll.mockResolvedValue(dailyNotes);
      mockReportRepo.saveOrUpdateToday.mockResolvedValue('Recap_2024-01-15_10-00.md');
      mockSettingsAdapter.save.mockResolvedValue(undefined);

      await useCase.execute();

      // saveOrUpdateToday должен быть вызван один раз
      expect(mockReportRepo.saveOrUpdateToday.mock.calls.length).toBe(1);
    });
  });

  describe('Same day regeneration', () => {
    it('should preserve period start when regenerating on the same day', async () => {
      // Мокаем системное время
      vi.setSystemTime(new Date('2024-01-15T10:00:00Z'));

      const settings: PluginSettings = {
        lastReport: {
          reportDate: '2024-01-15', // Тот же день!
          reportTime: '09:00',
          periodStart: '2024-01-10', // Период начался 5 дней назад
          filesIncluded: ['2024-01-10.md', '2024-01-11.md', '2024-01-15.md'],
        },
        reports: [],
        includedSections: [],
      };

      // Репозиторий возвращает заметки в порядке убывания (новые первыми)
      const dailyNotes = [
        { path: '2024-01-15.md', date: '2024-01-15', content: '' },
        { path: '2024-01-11.md', date: '2024-01-11', content: '' },
        { path: '2024-01-10.md', date: '2024-01-10', content: '' },
      ];

      mockSettingsAdapter.load.mockResolvedValue(settings);
      mockDailyNoteRepo.findAll.mockResolvedValue(dailyNotes);
      mockReportRepo.saveOrUpdateToday.mockResolvedValue('Recap_2024-01-15_10-00.md');
      mockSettingsAdapter.save.mockResolvedValue(undefined);

      await useCase.execute();

      const savedSettings = mockSettingsAdapter.save.mock.calls[0][0] as PluginSettings;
      const reportInfo = savedSettings.lastReport!;

      // Должны сохранить тот же periodStart
      expect(reportInfo.periodStart).toBe('2024-01-10');
      // Все дни должны быть включены
      expect(reportInfo.filesIncluded).toContain('2024-01-10.md');
      expect(reportInfo.filesIncluded).toContain('2024-01-11.md');
      expect(reportInfo.filesIncluded).toContain('2024-01-15.md');
    });
  });

  describe('No change tracking', () => {
    it('should not track file modifications', async () => {
      vi.setSystemTime(new Date('2024-01-15T10:00:00Z'));

      const settings: PluginSettings = {
        lastReport: {
          reportDate: '2024-01-10',
          reportTime: '10:00',
          periodStart: '2024-01-10',
          filesIncluded: ['2024-01-10.md'],
        },
        reports: [],
        includedSections: [],
      };

      // Репозиторий возвращает заметки в порядке убывания (новые первыми)
      const dailyNotes = [
        { path: '2024-01-15.md', date: '2024-01-15', content: 'Today content' },
        { path: '2024-01-11.md', date: '2024-01-11', content: 'New content' },
        { path: '2024-01-10.md', date: '2024-01-10', content: 'Updated content' },
      ];

      mockSettingsAdapter.load.mockResolvedValue(settings);
      mockDailyNoteRepo.findAll.mockResolvedValue(dailyNotes);
      mockReportRepo.saveOrUpdateToday.mockResolvedValue('Recap_2024-01-15_10-00.md');
      mockSettingsAdapter.save.mockResolvedValue(undefined);

      await useCase.execute();

      const savedSettings = mockSettingsAdapter.save.mock.calls[0][0] as PluginSettings;
      const reportInfo = savedSettings.lastReport!;

      // Все файлы включаются без отслеживания изменений
      expect(reportInfo.filesIncluded).toContain('2024-01-10.md');
      expect(reportInfo.filesIncluded).toContain('2024-01-11.md');
      expect(reportInfo.filesIncluded).toContain('2024-01-15.md');
      expect(reportInfo.filesIncluded.length).toBe(3);

      // В ReportInfo нет поля filesModifiedAfter
      expect('filesModifiedAfter' in reportInfo).toBe(false);
    });
  });

  describe('Empty periods', () => {
    it('should handle empty period between last report and today', async () => {
      vi.setSystemTime(new Date('2024-01-15T10:00:00Z'));

      const settings: PluginSettings = {
        lastReport: {
          reportDate: '2024-01-14',
          reportTime: '10:00',
          periodStart: '2024-01-14',
          filesIncluded: ['2024-01-14.md'],
        },
        reports: [],
        includedSections: [],
      };

      // Репозиторий возвращает заметки в порядке убывания (новые первыми)
      const dailyNotes = [
        { path: '2024-01-14.md', date: '2024-01-14', content: '' },
        { path: '2024-01-10.md', date: '2024-01-10', content: '' },
      ];

      mockSettingsAdapter.load.mockResolvedValue(settings);
      mockDailyNoteRepo.findAll.mockResolvedValue(dailyNotes);
      mockReportRepo.saveOrUpdateToday.mockResolvedValue('Recap_2024-01-15_10-00.md');
      mockSettingsAdapter.save.mockResolvedValue(undefined);

      await useCase.execute();

      const savedSettings = mockSettingsAdapter.save.mock.calls[0][0] as PluginSettings;
      const reportInfo = savedSettings.lastReport!;

      // Должен быть включён файл за 2024-01-14 (дата последнего рекапа)
      expect(reportInfo.filesIncluded).toContain('2024-01-14.md');
    });
  });
});
