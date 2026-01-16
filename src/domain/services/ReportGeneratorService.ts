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
   * Генерирует содержимое для всех заметок, группируя по секциям
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

    // Определяем какие секции показывать
    const sectionsToShow = includedSections && includedSections.length > 0
      ? includedSections
      : this.extractAllUniqueSections(notesToInclude);

    // Генерируем контент для каждой секции
    for (const sectionName of sectionsToShow) {
      content += this.generateSectionContent(sectionName, notesToInclude, includedSections);
    }

    // Если совсем нет контента
    if (content.trim().length === 0) {
      content = '*No daily notes found or no matching sections*\n\n';
    }

    return content;
  }

  /**
   * Извлекает все уникальные названия секций из заметок (fallback)
   */
  private static extractAllUniqueSections(notes: DailyNote[]): string[] {
    const uniqueSections = new Set<string>();

    for (const note of notes) {
      const sections = SectionExtractor.extract(note.content);
      Object.keys(sections).forEach(key => uniqueSections.add(key));
    }

    return Array.from(uniqueSections);
  }

  /**
   * Генерирует контент для одной секции по всем дням
   */
  private static generateSectionContent(
    sectionName: string,
    notes: DailyNote[],
    includedSections: string[]
  ): string {
    let content = '';
    let hasContent = false;

    // Извлекаем все секции из заметок
    const notesWithSections = notes.map(note => ({
      note,
      sections: includedSections && includedSections.length > 0
        ? SectionExtractor.extractOnly(note.content, includedSections)
        : SectionExtractor.extract(note.content)
    }));

    // Генерируем заголовок секции
    content += `## ${sectionName}\n\n`;

    // Для каждой заметки добавляем контент если он есть
    for (const { note, sections } of notesWithSections) {
      if (SectionExtractor.hasContent(sections, sectionName)) {
        hasContent = true;
        const noteDate = moment(note.date);
        content += `- ${noteDate.format('dddd, MMMM D, YYYY')}\n`;
        content += this.indentContent(SectionExtractor.getContent(sections, sectionName));
        content += '\n';
      }
    }

    // Если нет контента ни в одном дне, пропускаем секцию
    if (!hasContent) {
      return '';
    }

    // Добавляем пустую строку между секциями
    content += '\n';

    return content;
  }

  /**
   * Добавляет отступ (2 пробела) к каждой строке контента
   */
  private static indentContent(content: string): string {
    if (!content) return '';
    return content.split('\n').map(line => `  ${line}`).join('\n') + '\n';
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
