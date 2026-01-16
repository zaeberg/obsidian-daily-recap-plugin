/**
 * Результат извлечения секций
 */
export interface ExtractedSections {
  [sectionName: string]: string;
}

/**
 * Извлекатель секций из markdown по заголовкам ## уровня
 * Чистый класс без зависимостей от Obsidian API
 */
export class SectionExtractor {
  /**
   * Извлекает секции из содержимого daily note
   * @param content - содержимое markdown файла (с frontmatter или без)
   * @returns объект с названиями секций как ключами и содержимым как значениями
   */
  static extract(content: string): ExtractedSections {
    const sections: ExtractedSections = {};

    // Удаляем frontmatter
    content = content.replace(/^---\n[\s\S]*?\n---\n/, "");

    // Разбиваем по строкам
    const lines = content.split("\n");
    let currentSection = "";
    let currentContent: string[] = [];

    for (const line of lines) {
      if (line.startsWith("## ")) {
        // Сохраняем предыдущую секцию
        if (currentSection) {
          sections[currentSection] = currentContent.join("\n").trim();
        }
        // Начинаем новую секцию
        currentSection = line.substring(3).trim();
        currentContent = [];
      } else {
        currentContent.push(line);
      }
    }

    // Сохраняем последнюю секцию
    if (currentSection) {
      sections[currentSection] = currentContent.join("\n").trim();
    }

    return sections;
  }

  /**
   * Извлекает только указанные секции из содержимого daily note
   * @param content - содержимое markdown файла (с frontmatter или без)
   * @param sectionNames - массив названий секций для извлечения
   * @returns объект с названиями секций как ключами и содержимым как значениями
   * @throws Error если sectionNames пустой
   */
  static extractOnly(content: string, sectionNames: string[]): ExtractedSections {
    if (!sectionNames || sectionNames.length === 0) {
      throw new Error('No sections specified for extraction. Please configure sections in plugin settings.');
    }

    // Извлекаем все секции
    const allSections = this.extract(content);

    // Фильтруем только те, которые указаны в sectionNames
    const filteredSections: ExtractedSections = {};
    for (const name of sectionNames) {
      if (allSections[name] !== undefined) {
        filteredSections[name] = allSections[name];
      }
      // Если секция не найдена - просто пропускаем её, не ошибка
    }

    return filteredSections;
  }

  /**
   * Проверяет содержит ли секция непустой контент
   * @param sections - извлеченные секции
   * @param sectionName - название секции
   * @returns true если секция существует и не пуста
   */
  static hasContent(
    sections: ExtractedSections,
    sectionName: string
  ): boolean {
    const content = sections[sectionName];
    return content !== undefined && content.trim().length > 0;
  }

  /**
   * Получает содержимое секции или пустую строку
   * @param sections - извлеченные секции
   * @param sectionName - название секции
   * @returns содержимое секции или пустая строка
   */
  static getContent(
    sections: ExtractedSections,
    sectionName: string
  ): string {
    return sections[sectionName] || "";
  }
}
