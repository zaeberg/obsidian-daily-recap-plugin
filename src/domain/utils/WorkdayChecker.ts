/**
 * Проверка: является ли день рабочим
 * Чистый класс без зависимостей от Obsidian API
 */
export class WorkdayChecker {
  private static WORKDAYS = [
    'Monday',
    'Tuesday',
    'Wednesday',
    'Thursday',
    'Friday',
  ];

  /**
   * Проверяет является ли день рабочим
   * @param day - название дня недели на английском (например, "Monday")
   * @returns true если это рабочий день
   */
  static isWorkday(day: string): boolean {
    return this.WORKDAYS.includes(day);
  }

  /**
   * Проверяет является ли день выходным
   * @param day - название дня недели на английском
   * @returns true если это выходной (Saturday или Sunday)
   */
  static isWeekend(day: string): boolean {
    return !this.isWorkday(day);
  }
}
