import moment from 'moment';
import { ReportInfo, PluginSettings, ReportData, DEFAULT_SETTINGS } from '../../domain/entities';
import { ReportGeneratorService, MissingDaysService } from '../../domain/services';
import { DailyNoteRepository } from '../../infrastructure/repositories/DailyNoteRepository';
import { ReportRepository } from '../../infrastructure/repositories/ReportRepository';
import { SettingsAdapter } from '../../infrastructure/adapters/SettingsAdapter';

/**
 * Use Case для генерации recap отчёта
 * Оркестрирует весь процесс генерации отчёта
 */
export class GenerateRecapUseCase {
  constructor(
    private dailyNoteRepo: DailyNoteRepository,
    private reportRepo: ReportRepository,
    private settingsAdapter: SettingsAdapter<PluginSettings>
  ) { }

  /**
   * Выполняет генерацию отчёта
   * @returns имя созданного файла отчёта
   */
  async execute(): Promise<string> {
    const now = moment();

    // 1. Загружаем настройки
    const settings = await this.settingsAdapter.load(DEFAULT_SETTINGS);

    // 2. Получаем все daily notes
    const dailyNotes = await this.dailyNoteRepo.findAll();

    // 3. Подготавливаем данные для отчёта
    const reportData = await this.prepareReportData(dailyNotes, settings);

    // 4. Генерируем контент отчёта
    const recapContent = this.generateRecapContent(reportData, settings.lastReport, settings.includedSections);

    // 5. Сохраняем или обновляем отчёт за сегодня
    const filename = await this.reportRepo.saveOrUpdateToday(recapContent);

    // 6. Обновляем настройки
    await this.saveSettings(settings, reportData, now);

    return filename;
  }

  /**
   * Подготавливает данные для генерации отчёта
   * Новая логика: включаем все заметки от последнего рекапа до сегодня
   * При пересоздании в тот же день - сохраняем период предыдущего рекапа
   */
  private async prepareReportData(
    dailyNotes: any[],
    settings: PluginSettings
  ): Promise<ReportData> {
    const now = moment();
    let startDate: moment.Moment;

    if (settings.lastReport) {
      // Проверяем, создан ли последний рекап сегодня
      const lastReportDate = moment(settings.lastReport.reportDate);
      const isToday = lastReportDate.isSame(now, 'day');

      if (isToday) {
        // Пересоздание в тот же день - используем periodStart из последнего рекапа
        startDate = moment(settings.lastReport.periodStart);
      } else {
        // Новый день - берём ДЕНЬ ПОСЛЕДНЕГО РЕКАПА (не следующий день!)
        startDate = lastReportDate;
      }
    } else {
      // Если нет предыдущего отчёта, начинаем с 7 дней назад или первой заметки
      if (dailyNotes.length > 0) {
        const oldestNote = dailyNotes[dailyNotes.length - 1];
        startDate = moment(oldestNote.date);
      } else {
        startDate = moment().subtract(7, 'days');
      }
    }

    // Фильтруем заметки в диапазоне [startDate, now] включая границы
    const notesInRange = dailyNotes.filter((note) =>
      moment(note.date).isBetween(startDate, now, 'day', '[]')
    );

    // Упрощённая логика - просто включаем все файлы из диапазона
    const includedFiles: string[] = notesInRange.map((note) => note.path);

    return {
      startDate,
      endDate: now,
      allFiles: notesInRange,
      includedFiles,
    };
  }

  /**
   * Генерирует markdown контент отчёта
   */
  private generateRecapContent(
    reportData: ReportData,
    lastReport: ReportInfo | null,
    includedSections: string[]
  ): string {
    // Используем ReportGeneratorService для генерации основного контента
    let content = ReportGeneratorService.generateReport(reportData, lastReport, includedSections);

    // Добавляем секцию с пропущенными днями
    const missingDays = MissingDaysService.findMissingDays(
      reportData.startDate,
      reportData.endDate,
      reportData.allFiles
    );
    const missingDaysSection =
      ReportGeneratorService.generateMissingDaysSection(missingDays);
    content += missingDaysSection;

    return content;
  }

  /**
   * Сохраняет обновлённые настройки
   */
  private async saveSettings(
    settings: PluginSettings,
    reportData: ReportData,
    now: moment.Moment
  ): Promise<void> {
    const reportInfo: ReportInfo = {
      reportDate: now.format('YYYY-MM-DD'),
      reportTime: now.format('HH:mm'),
      periodStart: reportData.startDate.format('YYYY-MM-DD'),
      filesIncluded: reportData.includedFiles,
    };

    settings.lastReport = reportInfo;
    settings.reports.push(reportInfo);

    await this.settingsAdapter.save(settings);
  }
}
