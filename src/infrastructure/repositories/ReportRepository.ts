import moment from 'moment';
import { VaultAdapter } from '../adapters/VaultAdapter';
import { ObsidianSettingsAdapter } from '../adapters/ObsidianSettingsAdapter';

/**
 * Репозиторий для работы с отчётами
 * Инкапсулирует логику сохранения отчётов в vault
 */
export class ReportRepository {
  constructor(
    private vaultAdapter: VaultAdapter,
    private obsidianSettings: ObsidianSettingsAdapter
  ) {}

  /**
   * Получает папку для сохранения отчётов (такую же как Daily Notes)
   */
  private getReportsFolder(): string {
    const folder = this.obsidianSettings.getDailyNotesFolder();
    return folder || ''; // Если не настроена, сохраняем в корень
  }

  /**
   * Сохраняет или обновляет отчёт за текущий день
   * Если отчёт за сегодня уже существует - удаляет его и создаёт новый
   * @param content - markdown содержимое отчёта
   * @returns имя файла отчёта
   */
  async saveOrUpdateToday(content: string): Promise<string> {
    const now = moment();

    // Ищем отчёт за сегодня
    const todayFilename = this.findTodayReportFilename();

    if (todayFilename) {
      // Удаляем старый файл и создаём новый
      await this.vaultAdapter.delete(todayFilename);
    }

    // Всегда создаём новый файл
    const filename = this.generateFilename();
    await this.vaultAdapter.create(filename, content);
    return filename;
  }

  /**
   * Ищет файл отчёта за сегодняшний день
   * @returns имя файла или null если не найден
   */
  private findTodayReportFilename(): string | null {
    const now = moment();
    const todayPrefix = `${now.format('YYYY-MM-DD')}`;
    const reportsFolder = this.getReportsFolder();

    const files = reportsFolder
      ? this.vaultAdapter.getMarkdownFilesInFolder(reportsFolder)
      : this.vaultAdapter.getMarkdownFiles();

    // Ищем файл который содержит сегодняшнюю дату и слово Recap
    // Новый формат: YYYY-MM-DD_HH-mm_Recap.md
    const todayFile = files.find((file) => {
      const basename = file.basename || ''; // Имя файла без расширения
      return basename.includes(todayPrefix) && basename.includes('Recap');
    });

    return todayFile?.path || null;
  }

  /**
   * Сохраняет отчёт в vault (устаревший метод, сохранён для обратной совместимости)
   * @param content - markdown содержимое отчёта
   * @returns имя созданного файла
   */
  async save(content: string): Promise<string> {
    const filename = this.generateFilename();
    await this.vaultAdapter.create(filename, content);
    return filename;
  }

  /**
   * Генерирует имя файла для отчёта
   * Формат: YYYY-MM-DD_HH-mm_Recap.md
   * @returns путь к файлу
   */
  generateFilename(): string {
    const now = moment();
    const filename = `${now.format('YYYY-MM-DD_HH-mm')}_Recap.md`;
    const folder = this.getReportsFolder();

    // Если папка указана, добавляем её к пути
    return folder ? `${folder}/${filename}` : filename;
  }
}
