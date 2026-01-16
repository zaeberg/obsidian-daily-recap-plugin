import { Plugin, Notice } from 'obsidian';
import { PluginSettings, DEFAULT_SETTINGS } from './domain/entities';
import { Container } from './di/Container';
import { DailyRecapSettingTab, UIComponents } from './presentation';

export default class DailyRecapPlugin extends Plugin {
  settings: PluginSettings;
  private container: Container;

  async onload() {
    await this.loadSettings();

    // Создаём DI контейнер
    this.container = new Container(this.app, this);

    // Регистрируем UI компоненты
    UIComponents.registerAll(this, () => this.generateRecap());

    // Добавляем settings tab
    this.addSettingTab(
      new DailyRecapSettingTab(this.app, this, () => this.settings, () => this.saveSettings())
    );
  }

  async generateRecap() {
    try {
      // Создаём Use Case через DI контейнер
      const useCase = this.container.createGenerateRecapUseCase();

      // Выполняем Use Case
      const filename = await useCase.execute();

      new Notice(`Daily recap report generated: ${filename}`);
    } catch (error) {
      new Notice(`Error generating recap: ${error}`);
      console.error('Error generating recap:', error);
    }
  }

  async loadSettings() {
    try {
      const savedData = await this.loadData();
      if (savedData) {
        this.settings = { ...DEFAULT_SETTINGS, ...savedData };
      } else {
        this.settings = { ...DEFAULT_SETTINGS };
      }
    } catch (error) {
      console.error('Error loading settings:', error);
      this.settings = { ...DEFAULT_SETTINGS };
    }
  }

  async saveSettings() {
    await this.saveData(this.settings);
  }
}
