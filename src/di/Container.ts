import { App, Plugin } from 'obsidian';
import { PluginSettings } from '../domain/entities';
import { DailyNoteRepository } from '../infrastructure/repositories/DailyNoteRepository';
import { ReportRepository } from '../infrastructure/repositories/ReportRepository';
import {
  VaultAdapter,
  SettingsAdapter,
  ObsidianSettingsAdapter,
} from '../infrastructure/adapters';
import { GenerateRecapUseCase } from '../application/useCases/GenerateRecapUseCase';

/**
 * DI Контейнер для создания зависимостей
 * Изолирует логику создания объектов для удобного тестирования
 */
export class Container {
  private loadDataFn: () => Promise<any>;
  private saveDataFn: (data: any) => Promise<void>;

  constructor(private app: App, plugin: Plugin) {
    // Сохраняем ссылки на методы loadData/saveData из плагина
    this.loadDataFn = () => plugin.loadData();
    this.saveDataFn = (data) => plugin.saveData(data);
  }

  /**
   * Создаёт VaultAdapter
   */
  createVaultAdapter(): VaultAdapter {
    return new VaultAdapter(this.app.vault);
  }

  /**
   * Создаёт SettingsAdapter
   */
  createSettingsAdapter(): SettingsAdapter<PluginSettings> {
    return new SettingsAdapter<PluginSettings>(
      this.loadDataFn,
      this.saveDataFn
    );
  }

  /**
   * Создаёт ObsidianSettingsAdapter
   */
  createObsidianSettingsAdapter(): ObsidianSettingsAdapter {
    return new ObsidianSettingsAdapter(this.app);
  }

  /**
   * Создаёт DailyNoteRepository
   */
  createDailyNoteRepository(): DailyNoteRepository {
    return new DailyNoteRepository(
      this.createVaultAdapter(),
      this.createObsidianSettingsAdapter()
    );
  }

  /**
   * Создаёт ReportRepository
   */
  createReportRepository(): ReportRepository {
    return new ReportRepository(
      this.createVaultAdapter(),
      this.createObsidianSettingsAdapter()
    );
  }

  /**
   * Создаёт GenerateRecapUseCase
   */
  createGenerateRecapUseCase(): GenerateRecapUseCase {
    return new GenerateRecapUseCase(
      this.createDailyNoteRepository(),
      this.createReportRepository(),
      this.createSettingsAdapter()
    );
  }
}
