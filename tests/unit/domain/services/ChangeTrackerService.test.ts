import { describe, it, expect } from 'vitest';
import { ChangeTrackerService } from '../../../../src/domain/services/ChangeTrackerService';
import { DailyNote } from '../../../../src/domain/entities/DailyNote';

describe('ChangeTrackerService', () => {
  const createMockNote = (path: string): DailyNote => ({
    date: '2024-01-15',
    path,
    content: '',
    exists: true,
    isWorkday: true,
  });

  describe('detectModifiedFiles', () => {
    it('should detect all files when no last report exists', () => {
      const notesWithMtime = [
        { note: createMockNote('/note1.md'), mtime: 1000 },
        { note: createMockNote('/note2.md'), mtime: 2000 },
      ];
      const lastReportMtime = new Map();

      const result = ChangeTrackerService.detectModifiedFiles(
        notesWithMtime,
        lastReportMtime
      );

      expect(result.size).toBe(2);
      expect(result.get('/note1.md')).toBe(1000);
      expect(result.get('/note2.md')).toBe(2000);
    });

    it('should detect files with newer mtime', () => {
      const notesWithMtime = [
        { note: createMockNote('/note1.md'), mtime: 1500 }, // Newer
        { note: createMockNote('/note2.md'), mtime: 2000 }, // Same
      ];
      const lastReportMtime = new Map([
        ['/note1.md', 1000],
        ['/note2.md', 2000],
      ]);

      const result = ChangeTrackerService.detectModifiedFiles(
        notesWithMtime,
        lastReportMtime
      );

      expect(result.size).toBe(1);
      expect(result.get('/note1.md')).toBe(1500);
      expect(result.get('/note2.md')).toBeUndefined();
    });

    it('should handle files not in last report', () => {
      const notesWithMtime = [
        { note: createMockNote('/new-note.md'), mtime: 3000 },
      ];
      const lastReportMtime = new Map([
        ['/old-note.md', 1000],
      ]);

      const result = ChangeTrackerService.detectModifiedFiles(
        notesWithMtime,
        lastReportMtime
      );

      expect(result.size).toBe(1);
      expect(result.get('/new-note.md')).toBe(3000);
    });

    it('should return empty map when all files have same mtime', () => {
      const notesWithMtime = [
        { note: createMockNote('/note1.md'), mtime: 1000 },
        { note: createMockNote('/note2.md'), mtime: 2000 },
      ];
      const lastReportMtime = new Map([
        ['/note1.md', 1000],
        ['/note2.md', 2000],
      ]);

      const result = ChangeTrackerService.detectModifiedFiles(
        notesWithMtime,
        lastReportMtime
      );

      expect(result.size).toBe(0);
    });
  });

  describe('wasModified', () => {
    it('should return true when file not in last report', () => {
      const result = ChangeTrackerService.wasModified(
        '/new-file.md',
        1000,
        new Map()
      );

      expect(result).toBe(true);
    });

    it('should return true when mtime is newer', () => {
      const lastMtime = new Map([['/file.md', 1000]]);

      const result = ChangeTrackerService.wasModified(
        '/file.md',
        2000,
        lastMtime
      );

      expect(result).toBe(true);
    });

    it('should return false when mtime is same', () => {
      const lastMtime = new Map([['/file.md', 1000]]);

      const result = ChangeTrackerService.wasModified(
        '/file.md',
        1000,
        lastMtime
      );

      expect(result).toBe(false);
    });

    it('should return false when mtime is older', () => {
      const lastMtime = new Map([['/file.md', 2000]]);

      const result = ChangeTrackerService.wasModified(
        '/file.md',
        1000,
        lastMtime
      );

      expect(result).toBe(false);
    });
  });

  describe('createMtimeMap', () => {
    it('should convert object to Map', () => {
      const obj = {
        '/file1.md': 1000,
        '/file2.md': 2000,
      };

      const result = ChangeTrackerService.createMtimeMap(obj);

      expect(result).toBeInstanceOf(Map);
      expect(result.get('/file1.md')).toBe(1000);
      expect(result.get('/file2.md')).toBe(2000);
    });

    it('should handle empty object', () => {
      const result = ChangeTrackerService.createMtimeMap({});

      expect(result).toBeInstanceOf(Map);
      expect(result.size).toBe(0);
    });
  });

  describe('mapToObject', () => {
    it('should convert Map to object', () => {
      const map = new Map([
        ['/file1.md', 1000],
        ['/file2.md', 2000],
      ]);

      const result = ChangeTrackerService.mapToObject(map);

      expect(result).toEqual({
        '/file1.md': 1000,
        '/file2.md': 2000,
      });
    });

    it('should handle empty Map', () => {
      const result = ChangeTrackerService.mapToObject(new Map());

      expect(result).toEqual({});
    });
  });
});
