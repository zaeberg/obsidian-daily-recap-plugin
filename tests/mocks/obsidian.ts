// Mock для Obsidian API
export class TFile {
  path: string;
  parent: TFolder | null;

  constructor(path: string, parent: TFolder | null = null) {
    this.path = path;
    this.parent = parent;
  }
}

export class TFolder {
  path: string;
  parent: TFolder | null;

  constructor(path: string, parent: TFolder | null = null) {
    this.path = path;
    this.parent = parent;
  }
}

export class Vault {
  getMarkdownFiles(): TFile[] {
    return [];
  }

  async read(path: string): Promise<string> {
    return '';
  }

  async create(path: string, content: string): Promise<void> {
    // Mock implementation
  }

  getAbstractFileByPath(path: string): TFile | null {
    return null;
  }

  adapter = {
    async read(path: string): Promise<string> {
      return '';
    },
    async stat(path: string): Promise<{ mtime: number } | null> {
      return null;
    },
  };
}

export class App {}
export class Plugin {}
export class Notice {}
export const moment = require('moment');
