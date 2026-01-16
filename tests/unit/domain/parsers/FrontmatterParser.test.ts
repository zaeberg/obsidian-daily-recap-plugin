import { describe, it, expect } from 'vitest';
import { FrontmatterParser } from '../../../../src/domain/parsers/FrontmatterParser';

describe('FrontmatterParser', () => {
  describe('parse', () => {
    it('should parse valid frontmatter', () => {
      const content = `---
type: daily
date: 2024-01-15 09:00
---
# Content`;
      const result = FrontmatterParser.parse(content);
      expect(result).toEqual({
        type: 'daily',
        date: '2024-01-15 09:00',
      });
    });

    it('should return null for missing frontmatter', () => {
      const content = `# Just content without frontmatter`;
      const result = FrontmatterParser.parse(content);
      expect(result).toBeNull();
    });

    it('should handle empty frontmatter', () => {
      const content = `---
---
# Content`;
      const result = FrontmatterParser.parse(content);
      // Пустой frontmatter возвращает null (нет ключей)
      expect(result).toBeNull();
    });

    it('should handle frontmatter with colons in values', () => {
      const content = `---
type: daily
date: 2024-01-15 09:00:00
title: My: Note: Title
---
# Content`;
      const result = FrontmatterParser.parse(content);
      expect(result).toEqual({
        type: 'daily',
        date: '2024-01-15 09:00:00',
        title: 'My: Note: Title',
      });
    });

    it('should handle frontmatter with multiple fields', () => {
      const content = `---
type: daily
date: 2024-01-15
tags: work, important
status: in-progress
---
# Content`;
      const result = FrontmatterParser.parse(content);
      expect(result).toEqual({
        type: 'daily',
        date: '2024-01-15',
        tags: 'work, important',
        status: 'in-progress',
      });
    });
  });

  describe('isDailyNote', () => {
    it('should return true for valid daily note', () => {
      const frontmatter = {
        type: 'daily',
        date: '2024-01-15',
      };
      expect(FrontmatterParser.isDailyNote(frontmatter)).toBe(true);
    });

    it('should return false when type is not daily', () => {
      const frontmatter = {
        type: 'meeting',
        date: '2024-01-15',
      };
      expect(FrontmatterParser.isDailyNote(frontmatter)).toBe(false);
    });

    it('should return false when date is missing', () => {
      const frontmatter = {
        type: 'daily',
      };
      expect(FrontmatterParser.isDailyNote(frontmatter)).toBe(false);
    });

    it('should return false for null', () => {
      expect(FrontmatterParser.isDailyNote(null)).toBe(false);
    });

    it('should return false when type is missing', () => {
      const frontmatter = {
        date: '2024-01-15',
      };
      expect(FrontmatterParser.isDailyNote(frontmatter)).toBe(false);
    });
  });
});
