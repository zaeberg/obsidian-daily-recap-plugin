import moment from 'moment';
import { ReportData, ReportInfo, DailyNote } from '../entities';
import { SectionExtractor } from '../parsers/SectionExtractor';

/**
 * Сервис для генерации markdown контента отчёта
 * Чистый класс без зависимостей от Obsidian API
 */
export class ReportGeneratorService {
  // Названия секций из daily notes
  private static SECTION_PLAN = 'План (3 главных задачи)';
  private static SECTION_TODAY = 'Сегодня (рабочий лог)';
  private static SECTION_BLOCKERS = 'Блокеры / вопросы';
  private static SECTION_SUMMARY = 'Итого';

  /**
   * Генерирует полный markdown контент отчёта
   * @param reportData - данные для генерации
   * @param lastReport - информация о последнем отчёте
   * @param includedSections - список секций для включения в отчёт
   * @returns markdown контент
   */
  static generateReport(
    reportData: ReportData,
    lastReport: ReportInfo | null,
    includedSections: string[] = []
  ): string {
    const { startDate, endDate, allFiles, includedFiles } = reportData;

    let content = this.generateHeader(startDate, endDate, lastReport);
    content += '---\n\n';

    // Генерируем содержимое для каждой заметки
    content += this.generateNotesContent(
      allFiles,
      includedFiles,
      includedSections
    );

    // Добавляем секцию с пропущенными днями (позже будет добавлено)
    // content += this.generateMissingDaysSection(reportData);

    return content;
  }

  /**
   * Генерирует заголовок отчёта
   */
  private static generateHeader(
    startDate: moment.Moment,
    endDate: moment.Moment,
    lastReport: ReportInfo | null
  ): string {
    let content = '# Work Recap Report\n\n';
    content += `**Generated:** ${endDate.format('YYYY-MM-DD HH:mm')}\n\n`;
    content += `**Period:** ${startDate.format('YYYY-MM-DD')} - ${endDate.format('YYYY-MM-DD')}\n\n`;

    if (lastReport) {
      content += `*Previous report: ${lastReport.reportDate} ${lastReport.reportTime}*\n\n`;
    }

    return content;
  }

  /**
   * Генерирует содержимое для всех заметок
   */
  private static generateNotesContent(
    allFiles: DailyNote[],
    includedFiles: string[],
    includedSections: string[]
  ): string {
    let content = '';

    const notesToInclude = allFiles.filter((note) =>
      includedFiles.includes(note.path)
    );

    // Сортируем заметки по возрастанию даты (от старой к новой)
    notesToInclude.sort((a, b) =>
      moment(a.date).unix() - moment(b.date).unix()
    );

    for (const note of notesToInclude) {
      content += this.generateNoteSection(note, includedSections);
    }

    return content;
  }

  /**
   * Генерирует секцию для одной заметки
   */
  private static generateNoteSection(
    note: DailyNote,
    includedSections: string[]
  ): string {
    const noteDate = moment(note.date);
    let content = `## ${noteDate.format('dddd, MMMM D, YYYY')}\n\n`;

    // Извлекаем секции
    let sections;
    if (includedSections && includedSections.length > 0) {
      // Извлекаем только указанные секции
      sections = SectionExtractor.extractOnly(note.content, includedSections);
    } else {
      // Если список секций не настроен - извлекаем все секции (fallback для старых настроек)
      sections = SectionExtractor.extract(note.content);
    }

    // Проверяем что есть хотя бы одна секция с контентом
    let hasAnyContent = false;

    // Определяем какие секции проверять
    const sectionsToCheck = includedSections && includedSections.length > 0
      ? includedSections
      : Object.keys(sections);

    // Итерируемся по секциям
    for (const sectionName of sectionsToCheck) {
      if (SectionExtractor.hasContent(sections, sectionName)) {
        hasAnyContent = true;
        content += `### ${sectionName}\n${SectionExtractor.getContent(sections, sectionName)}\n\n`;
      }
    }

    if (!hasAnyContent) {
      content += '*No matching sections found*\n\n';
    }

    content += '---\n\n';

    return content;
  }

  /**
   * Генерирует секцию с пропущенными днями
   * Ограничивает вывод последними 21 днём (3 недели)
   */
  static generateMissingDaysSection(missingDays: Array<{
    date: string;
    reason: string;
  }>): string {
    if (missingDays.length === 0) {
      return '';
    }

    // Ограничиваем вывод последними 21 днём (3 недели)
    const maxDays = 21;
    const limitedDays = missingDays.slice(-maxDays);

    let content = '## Missing Days\n\n';

    // Если список был обрезан, добавляем уведомление
    if (missingDays.length > maxDays) {
      content += `*Showing last ${maxDays} days of ${missingDays.length} missing days*\n\n`;
    }

    for (const day of limitedDays) {
      content += `- ${day.date} ${day.reason}\n`;
    }
    content += '\n';

    return content;
  }
}
