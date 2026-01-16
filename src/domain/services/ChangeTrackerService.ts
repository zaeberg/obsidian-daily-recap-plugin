import { DailyNote } from '../entities/DailyNote';

/**
 * Сервис для отслеживания изменений в файлах
 * Чистый класс без зависимостей от Obsidian API
 */
export class ChangeTrackerService {
  /**
   * Определяет какие файлы были изменены после последнего отчёта
   * @param notesWithMtime - список файлов с их модификационными временами
   * @param lastReportMtime - маппинг путей к временам из последнего отчёта
   * @returns маппинг путей к новым временам модификации
   */
  static detectModifiedFiles(
    notesWithMtime: Array<{ note: DailyNote; mtime: number }>,
    lastReportMtime: Map<string, number>
  ): Map<string, number> {
    const modifiedFiles = new Map<string, number>();

    for (const { note, mtime } of notesWithMtime) {
      const lastMtime = lastReportMtime.get(note.path);

      // Если файла не было в последнем отчёте или он был изменён
      if (!lastMtime || mtime > lastMtime) {
        modifiedFiles.set(note.path, mtime);
      }
    }

    return modifiedFiles;
  }

  /**
   * Проверяет был ли файл изменён после последнего отчёта
   * @param filePath - путь к файлу
   * @param currentMtime - текущее время модификации
   * @param lastReportMtime - время модификации из последнего отчёта
   * @returns true если файл был изменён
   */
  static wasModified(
    filePath: string,
    currentMtime: number,
    lastReportMtime: Map<string, number>
  ): boolean {
    const lastMtime = lastReportMtime.get(filePath);

    // Если файла не было в последнем отчёте - считаем изменённым
    if (!lastMtime) {
      return true;
    }

    return currentMtime > lastMtime;
  }

  /**
   * Создаёт Map из объекта filesModifiedAfter
   * @param filesModifiedAfter - объект из ReportInfo
   * @returns Map для удобного использования
   */
  static createMtimeMap(
    filesModifiedAfter: { [path: string]: number }
  ): Map<string, number> {
    return new Map(Object.entries(filesModifiedAfter));
  }

  /**
   * Преобразует Map обратно в объект
   * @param mtimeMap - Map времен модификации
   * @returns объект для сохранения в ReportInfo
   */
  static mapToObject(
    mtimeMap: Map<string, number>
  ): { [path: string]: number } {
    const obj: { [path: string]: number } = {};
    mtimeMap.forEach((value, key) => {
      obj[key] = value;
    });
    return obj;
  }
}
