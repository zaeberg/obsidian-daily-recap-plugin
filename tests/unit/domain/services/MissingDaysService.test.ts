import { describe, it, expect } from 'vitest';
import moment from 'moment';
import { MissingDaysService } from '../../../../src/domain/services/MissingDaysService';
import { DailyNote } from '../../../../src/domain/entities/DailyNote';

describe('MissingDaysService', () => {
  describe('findMissingDays', () => {
    it('should find missing days when no notes exist', () => {
      const startDate = moment('2024-01-08');
      const endDate = moment('2024-01-10');
      const existingNotes: DailyNote[] = [];

      const result = MissingDaysService.findMissingDays(
        startDate,
        endDate,
        existingNotes
      );

      expect(result).toHaveLength(3);
      expect(result[0].reason).toBe('No daily note'); // Monday
      expect(result[1].reason).toBe('No daily note'); // Tuesday
      expect(result[2].reason).toBe('No daily note'); // Wednesday
    });

    it('should not return existing days', () => {
      const startDate = moment('2024-01-08');
      const endDate = moment('2024-01-10');
      const existingNotes: DailyNote[] = [
        {
          date: '2024-01-08',
          path: '/2024-01-08.md',
          content: '',
          exists: true,
          isWorkday: true,
        },
      ];

      const result = MissingDaysService.findMissingDays(
        startDate,
        endDate,
        existingNotes
      );

      expect(result).toHaveLength(2);
      expect(result[0].date).not.toContain('January 8');
    });

    it('should distinguish workdays from weekends', () => {
      const startDate = moment('2024-01-06'); // Saturday
      const endDate = moment('2024-01-07'); // Sunday
      const existingNotes: DailyNote[] = [];

      const result = MissingDaysService.findMissingDays(
        startDate,
        endDate,
        existingNotes
      );

      expect(result).toHaveLength(2);
      expect(result[0].reason).toBe('Weekend/Holiday'); // Saturday
      expect(result[1].reason).toBe('Weekend/Holiday'); // Sunday
    });

    it('should handle mixed workdays and weekends', () => {
      const startDate = moment('2024-01-06'); // Saturday
      const endDate = moment('2024-01-08'); // Monday
      const existingNotes: DailyNote[] = [];

      const result = MissingDaysService.findMissingDays(
        startDate,
        endDate,
        existingNotes
      );

      expect(result).toHaveLength(3);
      expect(result[0].reason).toBe('Weekend/Holiday'); // Saturday
      expect(result[1].reason).toBe('Weekend/Holiday'); // Sunday
      expect(result[2].reason).toBe('No daily note'); // Monday
    });

    it('should return empty array when all days have notes', () => {
      const startDate = moment('2024-01-08');
      const endDate = moment('2024-01-10');
      const existingNotes: DailyNote[] = [
        {
          date: '2024-01-08',
          path: '/2024-01-08.md',
          content: '',
          exists: true,
          isWorkday: true,
        },
        {
          date: '2024-01-09',
          path: '/2024-01-09.md',
          content: '',
          exists: true,
          isWorkday: true,
        },
        {
          date: '2024-01-10',
          path: '/2024-01-10.md',
          content: '',
          exists: true,
          isWorkday: true,
        },
      ];

      const result = MissingDaysService.findMissingDays(
        startDate,
        endDate,
        existingNotes
      );

      expect(result).toHaveLength(0);
    });

    it('should format dates correctly', () => {
      const startDate = moment('2024-01-08');
      const endDate = moment('2024-01-08');
      const existingNotes: DailyNote[] = [];

      const result = MissingDaysService.findMissingDays(
        startDate,
        endDate,
        existingNotes
      );

      expect(result).toHaveLength(1);
      expect(result[0].date).toBe('Monday, January 8, 2024');
    });
  });
});
