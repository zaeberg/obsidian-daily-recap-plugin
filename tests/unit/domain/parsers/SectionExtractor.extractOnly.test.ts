import { describe, it, expect } from 'vitest';
import { SectionExtractor } from '../../../../src/domain/parsers/SectionExtractor';

describe('SectionExtractor.extractOnly', () => {
  it('should extract only specified sections', () => {
    const content = `---
type: daily
---
## План (3 главных задачи)
- Task 1
- Task 2

## Сегодня (рабочий лог)
- 09:00 - Started work

## Блокеры / вопросы
- Issue with API

## Итого
- Сделал: Completed feature`;

    const result = SectionExtractor.extractOnly(content, [
      'План (3 главных задачи)',
      'Сегодня (рабочий лог)',
    ]);

    expect(result).toEqual({
      'План (3 главных задачи)': '- Task 1\n- Task 2',
      'Сегодня (рабочий лог)': '- 09:00 - Started work',
    });
    expect(Object.keys(result)).toHaveLength(2);
  });

  it('should throw error if sectionNames is empty', () => {
    const content = `## Section
Some content`;

    expect(() =>
      SectionExtractor.extractOnly(content, [])
    ).toThrowError('No sections specified for extraction');
  });

  it('should throw error if sectionNames is null', () => {
    const content = `## Section
Some content`;

    expect(() =>
      SectionExtractor.extractOnly(content, null as any)
    ).toThrowError('No sections specified for extraction');
  });

  it('should skip sections that are not found', () => {
    const content = `## План (3 главных задачи)
- Task 1

## Сегодня (рабочий лог)
- 09:00 - Started work`;

    const result = SectionExtractor.extractOnly(content, [
      'План (3 главных задачи)',
      'Блокеры / вопросы', // Эта секция не существует
    ]);

    expect(result).toEqual({
      'План (3 главных задачи)': '- Task 1',
    });
    expect(result['Блокеры / вопросы']).toBeUndefined();
  });

  it('should return empty object if no sections match', () => {
    const content = `## Section A
Content A

## Section B
Content B`;

    const result = SectionExtractor.extractOnly(content, [
      'Section C',
      'Section D',
    ]);

    expect(result).toEqual({});
  });

  it('should preserve section order from sectionNames array', () => {
    const content = `## Section C
Content C

## Section A
Content A

## Section B
Content B`;

    const result = SectionExtractor.extractOnly(content, [
      'Section B',
      'Section A',
      'Section C',
    ]);

    const keys = Object.keys(result);
    expect(keys).toEqual(['Section B', 'Section A', 'Section C']);
  });

  it('should handle frontmatter correctly', () => {
    const content = `---
type: daily
date: 2024-01-15
---
## План (3 главных задачи)
- Task 1`;

    const result = SectionExtractor.extractOnly(content, [
      'План (3 главных задачи)',
    ]);

    expect(result).toEqual({
      'План (3 главных задачи)': '- Task 1',
    });
  });

  it('should handle empty sections', () => {
    const content = `## Section A

## Section B
Content B`;

    const result = SectionExtractor.extractOnly(content, [
      'Section A',
      'Section B',
    ]);

    expect(result).toEqual({
      'Section A': '',
      'Section B': 'Content B',
    });
  });

  it('should be case sensitive', () => {
    const content = `## план
- lowercase

## План
- uppercase`;

    const result = SectionExtractor.extractOnly(content, ['План']);

    expect(result).toEqual({
      'План': '- uppercase',
    });
    expect(result['план']).toBeUndefined();
  });

  it('should handle whitespace in section names correctly', () => {
    const content = `##  План (3 главных задачи)
- Task 1`;

    const result = SectionExtractor.extractOnly(content, [
      'План (3 главных задачи)',
    ]);

    expect(result).toEqual({
      'План (3 главных задачи)': '- Task 1',
    });
  });
});
