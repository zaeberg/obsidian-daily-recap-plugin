import { App, Plugin, PluginSettingTab, Setting } from 'obsidian';
import { PluginSettings } from '../domain/entities';

/**
 * Settings Tab для плагина Daily Recap
 * Отделён от бизнес-логики и работает только с отображением
 */
export class DailyRecapSettingTab extends PluginSettingTab {
  constructor(
    app: App,
    plugin: Plugin,
    private getSettings: () => PluginSettings,
    private saveSettings: () => Promise<void>
  ) {
    super(app, plugin);
  }

  display(): void {
    const { containerEl } = this;

    containerEl.empty();

    containerEl.createEl('h2', { text: 'Daily Recap Settings' });

    const settings = this.getSettings();

    new Setting(containerEl)
      .setName('Included Sections')
      .setDesc(
        'Enter section titles (## headers) to include in recap, separated by commas. Example: План (3 главных задачи), Сегодня (рабочий лог)'
      )
      .addText((text) =>
        text
          .setPlaceholder('План (3 главных задачи), Сегодня (рабочий лог)')
          .setValue(settings.includedSections.join(', '))
          .onChange(async (value) => {
            // Парсим строку, разделяем по запятым и убираем пробелы
            settings.includedSections = value
              .split(',')
              .map((s) => s.trim())
              .filter((s) => s.length > 0);
            await this.saveSettings();
          })
      );

    containerEl.createEl('h3', { text: 'Statistics' });

    new Setting(containerEl)
      .setName('Last Report')
      .setDesc('Date and time of the last generated report')
      .addText((text) =>
        text
          .setPlaceholder('No reports generated yet')
          .setValue(
            settings.lastReport
              ? `${settings.lastReport.reportDate} ${settings.lastReport.reportTime}`
              : ''
          )
          .setDisabled(true)
      );

    new Setting(containerEl)
      .setName('Total Reports Generated')
      .setDesc('Number of reports generated')
      .addText((text) =>
        text.setValue(settings.reports.length.toString()).setDisabled(true)
      );
  }
}
