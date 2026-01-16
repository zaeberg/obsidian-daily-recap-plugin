import { describe, it, expect, vi } from 'vitest';
import { VaultAdapter } from '../../../../src/infrastructure/adapters/VaultAdapter';

// Mock TFile interface for testing
interface MockTFile {
  path: string;
  parent: { path: string } | null;
}

describe('VaultAdapter', () => {
  describe('getMarkdownFilesInFolder', () => {
    it('should return all files when folderPath is empty', () => {
      const mockFile1 = { path: 'note1.md', parent: { path: '' } } as any;
      const mockFile2 = { path: 'Daily/note2.md', parent: { path: 'Daily' } } as any;

      const mockVault = {
        getMarkdownFiles: () => [mockFile1, mockFile2],
      };

      const adapter = new VaultAdapter(mockVault as any);
      const result = adapter.getMarkdownFilesInFolder('');

      expect(result).toHaveLength(2);
      expect(result).toContain(mockFile1);
      expect(result).toContain(mockFile2);
    });

    it('should return all files when folderPath is whitespace only', () => {
      const mockFile1 = { path: 'note1.md', parent: { path: '' } } as any;
      const mockFile2 = { path: 'Daily/note2.md', parent: { path: 'Daily' } } as any;

      const mockVault = {
        getMarkdownFiles: () => [mockFile1, mockFile2],
      };

      const adapter = new VaultAdapter(mockVault as any);
      const result = adapter.getMarkdownFilesInFolder('   ');

      expect(result).toHaveLength(2);
    });

    it('should filter files in the specified folder', () => {
      const mockFile1 = { path: 'note1.md', parent: { path: '' } } as any;
      const mockFile2 = { path: 'Daily/note2.md', parent: { path: 'Daily' } } as any;
      const mockFile3 = { path: 'Daily/note3.md', parent: { path: 'Daily' } } as any;
      const mockFile4 = { path: 'Other/note4.md', parent: { path: 'Other' } } as any;

      const mockVault = {
        getMarkdownFiles: () => [mockFile1, mockFile2, mockFile3, mockFile4],
      };

      const adapter = new VaultAdapter(mockVault as any);
      const result = adapter.getMarkdownFilesInFolder('Daily');

      expect(result).toHaveLength(2);
      expect(result).toContain(mockFile2);
      expect(result).toContain(mockFile3);
      expect(result).not.toContain(mockFile1);
      expect(result).not.toContain(mockFile4);
    });

    it('should handle folder path with leading slash', () => {
      const mockFile1 = { path: 'Daily/note1.md', parent: { path: 'Daily' } } as any;
      const mockFile2 = { path: 'note2.md', parent: { path: '' } } as any;

      const mockVault = {
        getMarkdownFiles: () => [mockFile1, mockFile2],
      };

      const adapter = new VaultAdapter(mockVault as any);
      const result = adapter.getMarkdownFilesInFolder('/Daily');

      expect(result).toHaveLength(1);
      expect(result).toContain(mockFile1);
    });

    it('should handle folder path with trailing slash', () => {
      const mockFile1 = { path: 'Daily/note1.md', parent: { path: 'Daily' } } as any;
      const mockFile2 = { path: 'note2.md', parent: { path: '' } } as any;

      const mockVault = {
        getMarkdownFiles: () => [mockFile1, mockFile2],
      };

      const adapter = new VaultAdapter(mockVault as any);
      const result = adapter.getMarkdownFilesInFolder('Daily/');

      expect(result).toHaveLength(1);
      expect(result).toContain(mockFile1);
    });

    it('should handle folder path with both leading and trailing slashes', () => {
      const mockFile1 = { path: 'Daily/note1.md', parent: { path: 'Daily' } } as any;
      const mockFile2 = { path: 'note2.md', parent: { path: '' } } as any;

      const mockVault = {
        getMarkdownFiles: () => [mockFile1, mockFile2],
      };

      const adapter = new VaultAdapter(mockVault as any);
      const result = adapter.getMarkdownFilesInFolder('/Daily/');

      expect(result).toHaveLength(1);
      expect(result).toContain(mockFile1);
    });

    it('should handle nested folder paths', () => {
      const mockFile1 = { path: 'Journal/Daily/note1.md', parent: { path: 'Journal/Daily' } } as any;
      const mockFile2 = { path: 'Daily/note2.md', parent: { path: 'Daily' } } as any;

      const mockVault = {
        getMarkdownFiles: () => [mockFile1, mockFile2],
      };

      const adapter = new VaultAdapter(mockVault as any);
      const result = adapter.getMarkdownFilesInFolder('Journal/Daily');

      expect(result).toHaveLength(1);
      expect(result).toContain(mockFile1);
    });

    it('should return empty array when no files match the folder', () => {
      const mockFile1 = { path: 'note1.md', parent: { path: '' } } as any;
      const mockFile2 = { path: 'Other/note2.md', parent: { path: 'Other' } } as any;

      const mockVault = {
        getMarkdownFiles: () => [mockFile1, mockFile2],
      };

      const adapter = new VaultAdapter(mockVault as any);
      const result = adapter.getMarkdownFilesInFolder('Daily');

      expect(result).toHaveLength(0);
    });

    it('should handle files with null parent (root level files)', () => {
      const mockFile1 = { path: 'note1.md', parent: null } as any;
      const mockFile2 = { path: 'Daily/note2.md', parent: { path: 'Daily' } } as any;

      const mockVault = {
        getMarkdownFiles: () => [mockFile1, mockFile2],
      };

      const adapter = new VaultAdapter(mockVault as any);

      // Root level files should not match 'Daily' folder
      const dailyResult = adapter.getMarkdownFilesInFolder('Daily');
      expect(dailyResult).toHaveLength(1);
      expect(dailyResult).not.toContain(mockFile1);

      // But should match empty folder path
      const rootResult = adapter.getMarkdownFilesInFolder('');
      expect(rootResult).toHaveLength(2);
    });

    it('should be case sensitive when matching folder paths', () => {
      const mockFile1 = { path: 'Daily/note1.md', parent: { path: 'Daily' } } as any;
      const mockFile2 = { path: 'daily/note2.md', parent: { path: 'daily' } } as any;

      const mockVault = {
        getMarkdownFiles: () => [mockFile1, mockFile2],
      };

      const adapter = new VaultAdapter(mockVault as any);

      const dailyResult = adapter.getMarkdownFilesInFolder('Daily');
      expect(dailyResult).toHaveLength(1);
      expect(dailyResult).toContain(mockFile1);

      const lowercaseResult = adapter.getMarkdownFilesInFolder('daily');
      expect(lowercaseResult).toHaveLength(1);
      expect(lowercaseResult).toContain(mockFile2);
    });
  });
});
