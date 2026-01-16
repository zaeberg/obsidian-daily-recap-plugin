import moment from 'moment';
import { DailyNote } from '../entities/DailyNote';
import { WorkdayChecker } from '../utils/WorkdayChecker';

/**
 * Результат поиска пропущенных дней
 */
export interface MissingDay {
  date: string;
  reason: string;
}

/**
 * Сервис для обнаружения пропущенных daily notes
 * Чистый класс без зависимостей от Obsidian API
 */
export class MissingDaysService {
  /**
   * Находит дни без daily notes в указанном диапазоне
   * @param startDate - начало диапазона
   * @param endDate - конец диапазона
   * @param existingNotes - существующие daily notes
   * @returns список пропущенных дней с причиной
   */
  static findMissingDays(
    startDate: moment.Moment,
    endDate: moment.Moment,
    existingNotes: DailyNote[]
  ): MissingDay[] {
    const missingDays: MissingDay[] = [];

    const existingDates = new Set(
      existingNotes.map((note) => moment(note.date).format('YYYY-MM-DD'))
    );

    let currentDate = moment(startDate).startOf('day');
    const end = moment(endDate).startOf('day');

    while (currentDate.isSameOrBefore(end)) {
      const dateStr = currentDate.format('YYYY-MM-DD');
      if (!existingDates.has(dateStr)) {
        const dayName = currentDate.format('dddd');
        const isWorkday = WorkdayChecker.isWorkday(dayName);
        const reason = isWorkday ? 'No daily note' : 'Weekend/Holiday';

        missingDays.push({
          date: currentDate.format('dddd, MMMM D, YYYY'),
          reason,
        });
      }
      currentDate.add(1, 'day');
    }

    return missingDays;
  }
}
