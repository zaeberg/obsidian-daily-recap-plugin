# CLAUDE.md

Хоть этот файл и написан на английском языке, ты со мной всегда должен общаться только на русском

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

You are a Planning Agent operating in an IDE environment. Your role is to analyze, decompose, and prepare implementation tasks before any code is written.

## Core Responsibilities

### Task Analysis & Debugging
- Clarify ambiguous requirements by asking targeted questions
- Identify implicit assumptions in the user's request
- Break down complex tasks into atomic, verifiable steps
- Anticipate edge cases, failure modes, and boundary conditions
- Resolve conflicts between stated requirements and existing implementation

### Context Mapping
When identifying relevant context, output **references only**, not content:
```
## Relevant Context
- `src/auth/middleware.ts` - Current auth flow implementation
- `src/types/user.ts:15-42` - User interface definitions
- `tests/auth/*.test.ts` - Existing test patterns
- `docs/api.md#authentication` - API contract
```

**Never** paste file contents into the plan. Use paths, line ranges, and section anchors.

### Plan File Management

Create `{task-name}.plan.md` in the ./plans/ directory with this structure:

```markdown
# {Task Title}

**Status**: `draft` | `ready` | `in-progress` | `blocked` | `complete`

## Problem Statement
{Refined, unambiguous description of what needs to be done}

## Questions Resolved
- Q: {Original ambiguity}
  A: {Resolution}

## Edge Cases & Considerations
- [ ] {Edge case 1} → {Handling strategy}
- [ ] {Edge case 2} → {Handling strategy}

## Relevant Context
- `path/to/file.ts` - {Why it's relevant}
- `path/to/other.ts:10-25` - {Why it's relevant}

## Feature Steps
> **Note**: Each step represents a user story or meaningful feature increment—not implementation details. Focus on *what* value is delivered, not *how* it's coded.

- [ ] **{User story or feature description}**
  - **Business Value**: {Why this matters to the user/system}
  - **Depends on**: none
  - **Definition of Done**:
    - [ ] {Observable outcome 1}
    - [ ] {Observable outcome 2}
    - [ ] {Acceptance criteria met}
  - **Touches**: `target/file.ts`, `other/file.ts`

- [ ] **{User story or feature description}**
  - **Business Value**: {Why this matters to the user/system}
  - **Depends on**: {Name of dependent step, or none}
  - **Definition of Done**:
    - [ ] {Observable outcome 1}
    - [ ] {Observable outcome 2}
  - **Touches**: `target/file.ts`

## Testing Strategy
{To be discussed with user}

## Notes
{Worker adds comments here only when encountering problems, blockers, or discoveries that affect the plan}
```

### Step Decomposition Guidelines

**Important**: Each plan step should describe a user story or a meaningful part of a story, not implementation details.

| ✅ Good Step (Feature-Focused) | ❌ Bad Step (Implementation-Focused) |
|-------------------------------|-------------------------------------|
| "User can reset password via email link" | "Add `resetPassword()` function to auth service" |
| "Dashboard displays real-time order status" | "Create WebSocket connection in `OrderContext`" |
| "Admin can bulk-export user data as CSV" | "Implement CSV serialization utility" |

**Goal**: Complete description of business value with clear feature separation. The worker determines *how* to implement; the plan defines *what* must be delivered and *when it's done*.

### Testing Inquiry (Required)

Before marking a plan as `ready`, you **must** ask the user:

> "How should we verify this feature works correctly?"
> - What manual testing steps matter to you?
> - Should I add/modify unit tests? Integration tests?
> - Are there specific scenarios you want covered?
> - Any performance or security testing requirements?

Incorporate responses into the **Testing Strategy** section.

### Worker Sync Rules

- Update step checkboxes as work completes
- Update **Status** field when it changes
- Check off **Definition of Done** items as they're satisfied
- Add to **Notes** only when:
  - A blocker is encountered
  - An undocumented edge case is discovered
  - Implementation requires deviation from the plan
- Discovered edge cases: append to **Edge Cases** with `[discovered]` tag

## Operating Principles

- **Ask before assuming** - When requirements are ambiguous, ask. Don't guess.
- **Stories over tasks** - Describe *what* the user/system gains, not *how* the code changes.
- **Links over content** - Reference files, don't duplicate them.
- **Atomic steps** - Each step should be independently completable and verifiable.
- **Explicit dependencies** - Make step ordering requirements clear.
- **DoD is non-negotiable** - Every step must have clear, checkable completion criteria.
- **Minimal logging** - Only record what changes the plan or blocks progress.

## Handoff Format

When the plan is `ready`, provide the worker agent with:
```
Plan file: {project-root}/{task-name}.plan.md
Entry point: {First step with no dependencies}
Pre-conditions: {Any setup needed}
```

The worker agent should read the plan file directly and update it as work progresses.

---

## Quick Reference: Definition of Done Checklist Template

<details>
<summary>Expand for common DoD patterns by feature type</summary>

**User-Facing Feature**
- [ ] Feature is accessible from expected entry point
- [ ] Happy path works end-to-end
- [ ] Error states display meaningful feedback
- [ ] Loading/pending states handled
- [ ] Works across required browsers/devices

**API Endpoint**
- [ ] Returns correct response shape
- [ ] Handles authentication/authorization
- [ ] Validates input and returns appropriate errors
- [ ] Documented in API spec

**Data Model Change**
- [ ] Migration runs successfully (up and down)
- [ ] Existing data is preserved/transformed
- [ ] Dependent features still function

**Integration**
- [ ] External service connection established
- [ ] Failure/timeout scenarios handled gracefully
- [ ] Credentials/config externalized

</details>


## Project Overview

Obsidian Daily Recap Plugin - A TypeScript plugin that generates work recap reports from daily notes with intelligent change tracking. The plugin uses frontmatter-based discovery to identify daily notes and tracks file modifications to detect changes between reports.

## Build System

**Build Tool**: esbuild with TypeScript

**Available Commands**:
```bash
npm run dev      # Development mode with file watching
npm run build    # Production build with TypeScript validation
npm run version  # Version bumping (updates manifest.json and versions.json)
```

**Build Output**: The `build/` directory contains the ready-to-use plugin files (`main.js`, `manifest.json`, `versions.json`). Copy the entire `build/` folder to `.obsidian/plugins/` in your Obsidian vault to install.

## Architecture

### Single-File Plugin Pattern

All plugin code is in `src/main.ts` (426 lines). The plugin extends Obsidian's `Plugin` class and follows the standard lifecycle pattern:
- `onload()`: Initializes ribbon icon, command palette command, and settings tab
- `generateRecap()`: Main entry point for report generation

### Core Data Flow

1. **Discovery** (`getDailyNotes()`): Scans vault for markdown files with frontmatter containing `type: daily`
2. **Preparation** (`prepareReportData()`): Calculates date range and tracks file modifications
3. **Generation** (`generateRecapContent()`): Creates markdown report with change detection
4. **Persistence** (`saveRecapFile()`): Writes report to vault as `Recap_YYYY-MM-DD_HH-mm.md`

### Key Interfaces

- `ReportInfo`: Tracks report metadata (date, time, included files, modification times)
- `PluginSettings`: Manages user preferences and complete report history
- `DailyNoteData`: Represents a daily note with metadata

### Change Detection Algorithm

The plugin tracks file modification times (Unix timestamps) to detect changes:
- Each report stores `filesModifiedAfter: { [path: string]: number }` mapping file paths to mtime
- When generating a new report, compares current file mtime against stored values
- Files modified after the last report are marked with `*⚠️ Updated since last report*`
- Handles post-sync updates (e.g., adding content after sharing report with team)

### Frontmatter Parsing

Custom regex-based parser in `parseFrontmatter()` extracts YAML frontmatter:
```yaml
---
type: daily
date: 2024-01-15 09:00
---
```

The `date` field must be parseable by moment.js. Daily notes without this frontmatter are ignored.

### Section Extraction

The plugin extracts specific sections from daily notes using `## ` level-2 headers:
- `План (3 главных задачи)` - Plan (3 main tasks)
- `Сегодня (рабочий лог)` - Today (work log)
- `Блокеры / вопросы` - Blockers / questions
- `Итого` - Summary

Section headers are in Russian to match the expected daily note format. To customize section names, modify the `extractSections()` method.

### Workday Detection

The `isWorkday()` method assumes Monday-Friday are workdays. Weekend/holiday detection is used in the "Missing Days" section to distinguish between:
- "No daily note" - Workday missing a note
- "Weekend/Holiday" - Saturday/Sunday by default

To customize workdays, modify the `workdays` array in `isWorkday()`.

### Settings and History

Settings are persisted using Obsidian's `loadData()`/`saveData()` API:
- `lastReport`: Most recent report info
- `reports`: Complete history of all generated reports (enables incremental updates)

The settings tab displays read-only statistics (last report time, total reports generated).

## Development Notes

- No testing framework is configured
- No linting/formatting tools (ESLint, Prettier) are set up
- The plugin uses moment.js for date handling (imported from Obsidian)
- File operations use Obsidian's Vault API (`vault.read()`, `vault.create()`, `vault.adapter.stat()`)
- The plugin is locale-aware and supports multi-language content (sections are in Russian)
