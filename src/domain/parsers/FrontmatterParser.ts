/**
 * Результат парсинга frontmatter
 */
export interface ParsedFrontmatter {
  type?: string;
  date?: string;
  [key: string]: string | undefined;
}

/**
 * Парсер YAML frontmatter из markdown файлов
 * Чистая функция без зависимостей от Obsidian API
 */
export class FrontmatterParser {
  /**
   * Извлекает frontmatter из содержимого файла
   * @param content - содержимое markdown файла
   * @returns объект с полями из frontmatter или null если frontmatter отсутствует
   */
  static parse(content: string): ParsedFrontmatter | null {
    const match = content.match(/^---\n([\s\S]*?)\n---/);
    if (!match) return null;

    const frontmatter: ParsedFrontmatter = {};
    const lines = match[1].split("\n");

    for (const line of lines) {
      const [key, ...valueParts] = line.split(":");
      if (key && valueParts.length > 0) {
        const value = valueParts.join(":").trim();
        frontmatter[key.trim()] = value;
      }
    }

    return frontmatter;
  }

  /**
   * Проверяет является ли frontmatter валидным daily note
   * @param frontmatter - распаршенный frontmatter
   * @returns true если это daily note
   */
  static isDailyNote(frontmatter: ParsedFrontmatter | null): boolean {
    return (
      frontmatter !== null &&
      frontmatter.type === "daily" &&
      frontmatter.date !== undefined
    );
  }
}
