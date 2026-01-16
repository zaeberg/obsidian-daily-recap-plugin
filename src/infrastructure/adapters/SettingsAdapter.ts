/**
 * Адаптер для работы с настройками плагина
 * Изолирует Obsidian loadData/saveData API
 */
export class SettingsAdapter<T = any> {
  constructor(
    private loadData: () => Promise<T | null>,
    private saveData: (data: T) => Promise<void>
  ) {}

  /**
   * Загружает настройки из хранилища
   * @param defaultSettings - настройки по умолчанию
   */
  async load(defaultSettings: T): Promise<T> {
    try {
      const savedData = await this.loadData();
      if (savedData) {
        // Мержим с настройками по умолчанию
        return { ...defaultSettings, ...savedData };
      }
      return { ...defaultSettings };
    } catch (error) {
      console.error('Error loading settings:', error);
      return { ...defaultSettings };
    }
  }

  /**
   * Сохраняет настройки в хранилище
   * @param settings - настройки для сохранения
   */
  async save(settings: T): Promise<void> {
    await this.saveData(settings);
  }
}
