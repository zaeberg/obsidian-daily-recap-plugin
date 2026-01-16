/**
 * Метаданные отчёта
 */
export interface ReportInfo {
  reportDate: string; // ISO date string when report was generated
  reportTime: string; // Time when report was generated
  periodStart: string; // Start date of the report period (ISO date string)
  filesIncluded: string[]; // Paths to files included in this report
}
