import moment from 'moment';
import { DailyNote } from './DailyNote';

/**
 * Данные для генерации отчёта
 */
export interface ReportData {
  startDate: moment.Moment;
  endDate: moment.Moment;
  allFiles: DailyNote[];
  includedFiles: string[];
}
