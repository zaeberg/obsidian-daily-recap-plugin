import { Vault, TFile } from 'obsidian';

/**
 * Адаптер для работы с Obsidian Vault
 * ИзолируетObsidian API для возможности мокания в тестах
 */
export class VaultAdapter {
  constructor(private vault: Vault) {}

  /**
   * Получает все markdown файлы из vault
   */
  getMarkdownFiles(): TFile[] {
    return this.vault.getMarkdownFiles();
  }

  /**
   * Получает markdown файлы из указанной директории
   * @param folderPath - путь к директории (пустая строка = все файлы)
   */
  getMarkdownFilesInFolder(folderPath: string): TFile[] {
    const allFiles = this.vault.getMarkdownFiles();

    if (!folderPath || folderPath.trim() === '') {
      return allFiles;
    }

    // Нормализуем путь: убираем начальный и конечный слеши
    const normalizedPath = folderPath.replace(/^\/+|\/+$/g, '');

    return allFiles.filter((file) => {
      const fileFolderPath = file.parent?.path || '';
      return fileFolderPath === normalizedPath;
    });
  }

  /**
   * Читает содержимое файла
   * @param path - путь к файлу
   */
  async read(path: string): Promise<string> {
    return await this.vault.adapter.read(path);
  }

  /**
   * Создаёт новый файл
   * @param path - путь к файлу
   * @param content - содержимое файла
   */
  async create(path: string, content: string): Promise<void> {
    await this.vault.create(path, content);
  }

  /**
   * Перезаписывает содержимое файла или создаёт новый если не существует
   * @param path - путь к файлу
   * @param content - новое содержимое файла
   */
  async modify(path: string, content: string): Promise<void> {
    const file = this.getAbstractFileByPath(path);
    if (file) {
      // Файл существует - перезаписываем
      await this.vault.modify(file, content);
    } else {
      // Файл не существует - создаём новый
      await this.vault.create(path, content);
    }
  }

  /**
   * Удаляет файл
   * @param path - путь к файлу
   */
  async delete(path: string): Promise<void> {
    const file = this.getAbstractFileByPath(path);
    if (file) {
      await this.vault.delete(file);
    }
  }

  /**
   * Получает информацию о файле по пути
   * @param path - путь к файлу
   */
  getAbstractFileByPath(path: string): TFile | null {
    const file = this.vault.getAbstractFileByPath(path);
    return file instanceof TFile ? file : null;
  }

  /**
   * Получает статистику файла (время модификации и т.д.)
   * @param path - путь к файлу
   */
  async getStat(path: string): Promise<{ mtime: number } | null> {
    try {
      const stat = await this.vault.adapter.stat(path);
      return stat ? { mtime: stat.mtime } : null;
    } catch {
      return null;
    }
  }
}
