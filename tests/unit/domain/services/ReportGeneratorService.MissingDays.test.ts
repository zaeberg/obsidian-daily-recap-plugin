import { describe, it, expect } from 'vitest';
import { ReportGeneratorService } from '../../../../src/domain/services/ReportGeneratorService';

describe('ReportGeneratorService.generateMissingDaysSection', () => {
  it('should return empty string for empty missing days array', () => {
    const result = ReportGeneratorService.generateMissingDaysSection([]);

    expect(result).toBe('');
  });

  it('should generate section for all days if <= 21 days', () => {
    const missingDays = Array.from({ length: 21 }, (_, i) => ({
      date: `Day ${i + 1}`,
      reason: 'No daily note',
    }));

    const result = ReportGeneratorService.generateMissingDaysSection(missingDays);

    expect(result).toContain('## Missing Days');
    expect(result).not.toContain('Showing last');
    // Should contain all 21 days
    expect(result.split('\n').filter((line) => line.includes('- Day')).length).toBe(21);
  });

  it('should limit to 21 days if more than 21 days', () => {
    const missingDays = Array.from({ length: 30 }, (_, i) => ({
      date: `Day ${i + 1}`,
      reason: 'No daily note',
    }));

    const result = ReportGeneratorService.generateMissingDaysSection(missingDays);

    expect(result).toContain('## Missing Days');
    expect(result).toContain('Showing last 21 days of 30 missing days');
    // Should only contain last 21 days
    const lines = result.split('\n').filter((line) => line.includes('- Day'));
    expect(lines.length).toBe(21);
    // Should show Day 10 to Day 30 (last 21)
    expect(lines[0]).toContain('Day 10');
    expect(lines[20]).toContain('Day 30');
  });

  it('should show last 21 days for exactly 40 missing days', () => {
    const missingDays = Array.from({ length: 40 }, (_, i) => ({
      date: `2024-01-${(i + 1).toString().padStart(2, '0')}`,
      reason: i % 7 < 5 ? 'No daily note' : 'Weekend/Holiday',
    }));

    const result = ReportGeneratorService.generateMissingDaysSection(missingDays);

    expect(result).toContain('Showing last 21 days of 40 missing days');
    const lines = result.split('\n').filter((line) => line.includes('- 2024-01-'));
    expect(lines.length).toBe(21);
  });

  it('should handle different reasons correctly', () => {
    const missingDays = [
      { date: 'Monday, January 1, 2024', reason: 'No daily note' },
      { date: 'Saturday, January 6, 2024', reason: 'Weekend/Holiday' },
      { date: 'Sunday, January 7, 2024', reason: 'Weekend/Holiday' },
    ];

    const result = ReportGeneratorService.generateMissingDaysSection(missingDays);

    expect(result).toContain('- Monday, January 1, 2024 No daily note');
    expect(result).toContain('- Saturday, January 6, 2024 Weekend/Holiday');
    expect(result).toContain('- Sunday, January 7, 2024 Weekend/Holiday');
  });

  it('should add trailing newline after section', () => {
    const missingDays = [{ date: 'Day 1', reason: 'No daily note' }];

    const result = ReportGeneratorService.generateMissingDaysSection(missingDays);

    expect(result).toMatch(/\n$/);
  });

  it('should preserve order of missing days', () => {
    const missingDays = [
      { date: 'Day A', reason: 'Reason A' },
      { date: 'Day B', reason: 'Reason B' },
      { date: 'Day C', reason: 'Reason C' },
    ];

    const result = ReportGeneratorService.generateMissingDaysSection(missingDays);

    const lines = result.split('\n').filter((line) => line.startsWith('- '));
    expect(lines[0]).toContain('Day A');
    expect(lines[1]).toContain('Day B');
    expect(lines[2]).toContain('Day C');
  });

  it('should not show notification message for exactly 21 days', () => {
    const missingDays = Array.from({ length: 21 }, (_, i) => ({
      date: `Day ${i + 1}`,
      reason: 'No daily note',
    }));

    const result = ReportGeneratorService.generateMissingDaysSection(missingDays);

    expect(result).not.toContain('Showing last');
  });

  it('should show only last 3 weeks for 100 days', () => {
    const missingDays = Array.from({ length: 100 }, (_, i) => ({
      date: `Day ${i + 1}`,
      reason: 'No daily note',
    }));

    const result = ReportGeneratorService.generateMissingDaysSection(missingDays);

    expect(result).toContain('Showing last 21 days of 100 missing days');
    const lines = result.split('\n').filter((line) => line.includes('- Day'));
    expect(lines.length).toBe(21);
    expect(lines[0]).toContain('Day 80'); // First of last 21
    expect(lines[20]).toContain('Day 100'); // Last day
  });
});
