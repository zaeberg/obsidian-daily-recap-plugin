import { ReportInfo } from './ReportInfo';

/**
 * Настройки плагина
 */
export interface PluginSettings {
  lastReport: ReportInfo | null;
  reports: ReportInfo[]; // History of all generated reports
  includedSections: string[]; // Секции которые должны включаться в рекап (## заголовки)
}
