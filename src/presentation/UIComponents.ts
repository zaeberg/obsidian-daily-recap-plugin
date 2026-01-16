import { Plugin } from 'obsidian';

/**
 * UI компоненты плагина (ribbon icon, commands)
 * Отделены от бизнес-логики
 */
export class UIComponents {
  /**
   * Добавляет ribbon icon для генерации отчёта
   * @param plugin - экземпляр плагина
   * @param callback - функция для вызова при клике
   */
  static addRibbonIcon(
    plugin: Plugin,
    callback: () => void | Promise<void>
  ): void {
    plugin.addRibbonIcon('calendar-clock', 'Generate Daily Recap', async () => {
      await callback();
    });
  }

  /**
   * Добавляет команду в command palette
   * @param plugin - экземпляр плагина
   * @param callback - функция для вызова при выполнении команды
   */
  static addCommand(
    plugin: Plugin,
    callback: () => void | Promise<void>
  ): void {
    plugin.addCommand({
      id: 'generate-recap',
      name: 'Generate Daily Recap Report',
      callback: async () => {
        await callback();
      },
    });
  }

  /**
   * Добавляет все UI компоненты
   * @param plugin - экземпляр плагина
   * @param callback - функция для вызова при взаимодействии
   */
  static registerAll(
    plugin: Plugin,
    callback: () => void | Promise<void>
  ): void {
    this.addRibbonIcon(plugin, callback);
    this.addCommand(plugin, callback);
  }
}
