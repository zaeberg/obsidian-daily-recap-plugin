/**
 * Сущность daily note с метаданными
 */
export interface DailyNote {
  date: string;
  path: string;
  content: string;
  exists: boolean;
  isWorkday: boolean;
}
