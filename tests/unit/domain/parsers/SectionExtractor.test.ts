import { describe, it, expect } from 'vitest';
import { SectionExtractor } from '../../../../src/domain/parsers/SectionExtractor';

describe('SectionExtractor', () => {
  describe('extract', () => {
    it('should extract sections from markdown with frontmatter', () => {
      const content = `---
type: daily
date: 2024-01-15
---

## План (3 главных задачи)
- Task 1
- Task 2

## Сегодня (рабочий лог)
- 09:00 - Started work`;

      const result = SectionExtractor.extract(content);
      expect(result).toEqual({
        'План (3 главных задачи)': '- Task 1\n- Task 2',
        'Сегодня (рабочий лог)': '- 09:00 - Started work',
      });
    });

    it('should handle sections with Russian names', () => {
      const content = `## Блокеры / вопросы
- Issue with API

## Итого
- Сделал: Completed feature`;

      const result = SectionExtractor.extract(content);
      expect(result).toEqual({
        'Блокеры / вопросы': '- Issue with API',
        'Итого': '- Сделал: Completed feature',
      });
    });

    it('should return empty object for content without sections', () => {
      const content = `Just some content
without any headers`;

      const result = SectionExtractor.extract(content);
      expect(result).toEqual({});
    });

    it('should handle empty sections', () => {
      const content = `## Section 1

## Section 2
Some content`;

      const result = SectionExtractor.extract(content);
      expect(result).toEqual({
        'Section 1': '',
        'Section 2': 'Some content',
      });
    });

    it('should trim whitespace from section content', () => {
      const content = `## Test Section

  Content with spaces


More content`;
      const result = SectionExtractor.extract(content);
      // trim() удаляет whitespace только с начала и конца, не посередине
      expect(result['Test Section']).toBe('Content with spaces\n\n\nMore content');
    });

    it('should handle multiple occurrences of same section name', () => {
      const content = `## Tasks
- Task 1

## Notes
Some notes

## Tasks
- Task 2`;

      const result = SectionExtractor.extract(content);
      // Последняя секция с тем же именем перезаписывает предыдущую
      expect(result['Tasks']).toBe('- Task 2');
      expect(result['Notes']).toBe('Some notes');
    });
  });

  describe('hasContent', () => {
    it('should return true for section with content', () => {
      const sections = {
        'Section 1': 'Some content',
        'Section 2': '',
      };
      expect(SectionExtractor.hasContent(sections, 'Section 1')).toBe(true);
    });

    it('should return false for empty section', () => {
      const sections = {
        'Section 1': 'Some content',
        'Section 2': '',
      };
      expect(SectionExtractor.hasContent(sections, 'Section 2')).toBe(false);
    });

    it('should return false for missing section', () => {
      const sections = {
        'Section 1': 'Some content',
      };
      expect(SectionExtractor.hasContent(sections, 'Missing')).toBe(false);
    });

    it('should return false for section with only whitespace', () => {
      const sections = {
        'Section 1': '   \n\n  ',
      };
      expect(SectionExtractor.hasContent(sections, 'Section 1')).toBe(false);
    });
  });

  describe('getContent', () => {
    it('should return section content', () => {
      const sections = {
        'Section 1': 'Content here',
      };
      expect(SectionExtractor.getContent(sections, 'Section 1')).toBe('Content here');
    });

    it('should return empty string for missing section', () => {
      const sections = {
        'Section 1': 'Content here',
      };
      expect(SectionExtractor.getContent(sections, 'Missing')).toBe('');
    });

    it('should return empty string for empty section', () => {
      const sections = {
        'Section 1': '',
      };
      expect(SectionExtractor.getContent(sections, 'Section 1')).toBe('');
    });
  });
});
