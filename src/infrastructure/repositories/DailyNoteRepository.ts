import moment from 'moment';
import { DailyNote } from '../../domain/entities/DailyNote';
import { FrontmatterParser } from '../../domain/parsers/FrontmatterParser';
import { WorkdayChecker } from '../../domain/utils/WorkdayChecker';
import { VaultAdapter, ObsidianSettingsAdapter } from '../adapters';

/**
 * Репозиторий для работы с daily notes
 * Инкапсулирует логику поиска и чтения daily notes из vault
 */
export class DailyNoteRepository {
  constructor(
    private vaultAdapter: VaultAdapter,
    private obsidianSettings: ObsidianSettingsAdapter
  ) {}

  /**
   * Находит все daily notes в vault
   * @returns отсортированный список daily notes (по убыванию даты)
   * @throws Error если встроенный плагин Daily Notes не настроен
   */
  async findAll(): Promise<DailyNote[]> {
    // Получаем папку из настроек встроенного плагина Daily Notes
    const dailyNotesFolder = this.obsidianSettings.getDailyNotesFolder();

    if (!dailyNotesFolder) {
      throw new Error(
        'Daily Notes plugin is not configured. Please enable and configure the Daily Notes plugin in Obsidian settings.'
      );
    }

    const dailyNotes: DailyNote[] = [];
    // Получаем файлы только из папки Daily Notes
    const files = this.vaultAdapter.getMarkdownFilesInFolder(dailyNotesFolder);

    for (const file of files) {
      const content = await this.vaultAdapter.read(file.path);
      const frontmatter = FrontmatterParser.parse(content);

      if (FrontmatterParser.isDailyNote(frontmatter)) {
        dailyNotes.push({
          date: frontmatter!.date!, // Type assertion: isDailyNote гарантирует наличие
          path: file.path,
          content: content,
          exists: true,
          isWorkday: WorkdayChecker.isWorkday(
            moment(frontmatter!.date).format('dddd')
          ),
        });
      }
    }

    // Сортируем по убыванию даты
    return dailyNotes.sort(
      (a, b) => moment(b.date).unix() - moment(a.date).unix()
    );
  }

  /**
   * Получает daily notes с их mtime
   * @param notes - список daily notes
   * @returns список заметок с их временем модификации
   */
  async notesWithMtime(
    notes: DailyNote[]
  ): Promise<Array<{ note: DailyNote; mtime: number }>> {
    const result: Array<{ note: DailyNote; mtime: number }> = [];

    for (const note of notes) {
      const file = this.vaultAdapter.getAbstractFileByPath(note.path);
      if (file) {
        const stat = await this.vaultAdapter.getStat(note.path);
        if (stat) {
          result.push({ note, mtime: stat.mtime });
        }
      }
    }

    return result;
  }
}
