import { describe, it, expect } from 'vitest';
import { WorkdayChecker } from '../../../../src/domain/utils/WorkdayChecker';

describe('WorkdayChecker', () => {
  describe('isWorkday', () => {
    it('should return true for Monday', () => {
      expect(WorkdayChecker.isWorkday('Monday')).toBe(true);
    });

    it('should return true for Tuesday', () => {
      expect(WorkdayChecker.isWorkday('Tuesday')).toBe(true);
    });

    it('should return true for Wednesday', () => {
      expect(WorkdayChecker.isWorkday('Wednesday')).toBe(true);
    });

    it('should return true for Thursday', () => {
      expect(WorkdayChecker.isWorkday('Thursday')).toBe(true);
    });

    it('should return true for Friday', () => {
      expect(WorkdayChecker.isWorkday('Friday')).toBe(true);
    });

    it('should return false for Saturday', () => {
      expect(WorkdayChecker.isWorkday('Saturday')).toBe(false);
    });

    it('should return false for Sunday', () => {
      expect(WorkdayChecker.isWorkday('Sunday')).toBe(false);
    });

    it('should be case-sensitive', () => {
      expect(WorkdayChecker.isWorkday('monday')).toBe(false);
      expect(WorkdayChecker.isWorkday('MONDAY')).toBe(false);
    });
  });

  describe('isWeekend', () => {
    it('should return false for Monday-Friday', () => {
      expect(WorkdayChecker.isWeekend('Monday')).toBe(false);
      expect(WorkdayChecker.isWeekend('Tuesday')).toBe(false);
      expect(WorkdayChecker.isWeekend('Wednesday')).toBe(false);
      expect(WorkdayChecker.isWeekend('Thursday')).toBe(false);
      expect(WorkdayChecker.isWeekend('Friday')).toBe(false);
    });

    it('should return true for Saturday', () => {
      expect(WorkdayChecker.isWeekend('Saturday')).toBe(true);
    });

    it('should return true for Sunday', () => {
      expect(WorkdayChecker.isWeekend('Sunday')).toBe(true);
    });
  });
});
