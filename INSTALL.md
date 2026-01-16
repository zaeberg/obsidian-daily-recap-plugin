# Quick Installation Guide

## Option 1: From Build Directory (Recommended)

1. **Build the plugin:**
   ```bash
   cd obsidian-daily-recap-plugin
   npm install
   npm run build
   ```

2. **Install in Obsidian:**
   - Locate the `build/` folder in the plugin directory
   - Copy the entire `build/` folder
   - Paste it into your Obsidian vault's `.obsidian/plugins/` directory
   - Rename the folder to `daily-recap` (optional but recommended)

3. **Enable the plugin:**
   - Open Obsidian
   - Go to **Settings → Community Plugins**
   - Find "Daily Recap" in the installed plugins list
   - Toggle the switch to enable it

## Option 2: Development Installation

For developers or those who want to modify the plugin:

```bash
# Clone and install
cd obsidian-daily-recap-plugin
npm install

# Run in development mode (auto-rebuilds on changes)
npm run dev
```

Then follow steps 2-3 from Option 1 (the `build/` folder will be updated automatically).

## Creating Daily Notes

The plugin looks for daily notes with this structure:

```markdown
---
type: daily
date: 2024-01-15 09:00
---

# Daily Note

## План (3 главных задачи)
- [ ] Task 1
- [ ] Task 2
- [ ] Task 3

## Сегодня (рабочий лог)
- 09:00 - Started work on feature X
- 10:30 - Meeting with team

## Блокеры / вопросы
- Issue with API

## Итого
- Сделал: Completed feature X
- Не сделал: Blocked by API
- Следующий шаг: Resolve API issue
```

**Important:** The frontmatter must include:
- `type: daily`
- `date: <valid date>`

## Generating Reports

There are two ways to generate a recap report:

1. **Click the calendar icon** in Obsidian's left sidebar
2. **Use the command palette** (`Ctrl/Cmd + P`) → "Generate Daily Recap Report"

The report will be saved as `Recap_YYYY-MM-DD_HH-mm.md` in your vault's root directory.

## Troubleshooting

### Plugin not showing in settings
- Ensure you copied the `build/` folder, not the `src/` folder
- Check that the folder contains `main.js`, `manifest.json`, and `versions.json`

### Daily notes not being detected
- Verify your daily notes have the required frontmatter
- The `date` field must be in a format that moment.js can parse

### No reports generated
- Check Obsidian's developer console for errors
- Ensure you have at least one daily note with the correct format

## Support

For issues or feature requests, please check the main README.md file or open an issue on the project repository.