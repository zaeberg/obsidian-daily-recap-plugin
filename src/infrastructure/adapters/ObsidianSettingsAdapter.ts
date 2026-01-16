import { App } from 'obsidian';

/**
 * Адаптер для доступа к настройкам Obsidian
 * Изолирует Obsidian API для возможности мокания в тестах
 */
export class ObsidianSettingsAdapter {
  constructor(private app: App) {}

  /**
   * Получает папку для ежедневных заметок из настроек встроенного плагина Daily Notes
   * @returns путь к папке или null если плагин не настроен
   */
  getDailyNotesFolder(): string | null {
    try {
      // @ts-ignore - internalPlugins не экспортирован в типах Obsidian
      const dailyNotesPlugin = this.app.internalPlugins?.plugins?.['daily-notes'];

      if (!dailyNotesPlugin || !dailyNotesPlugin.enabled) {
        return null;
      }

      const folder = dailyNotesPlugin.instance?.options?.folder;

      // Проверяем что папка указана и не пустая
      if (!folder || folder.trim() === '') {
        return null;
      }

      return folder.trim();
    } catch (error) {
      console.error('Error getting daily notes folder:', error);
      return null;
    }
  }

  /**
   * Проверяет что встроенный плагин Daily Notes настроен корректно
   */
  isDailyNotesPluginConfigured(): boolean {
    return this.getDailyNotesFolder() !== null;
  }
}
