# Agent Guidelines - phpspreadsheet-js

This document provides essential information for agentic coding agents (like yourself) working on the `phpspreadsheet-js` repository. Adhere to these guidelines to maintain consistency and quality.

## 1. Build, Lint, and Test Commands

This project uses [Bun](https://bun.sh) as its runtime, package manager, and test runner.

### Installation & Environment
- **Install dependencies:** `bun install`
- **Update lockfile:** `bun install` (Bun updates `bun.lockb` automatically)

### Execution
- **Run the main entry point:** `bun run index.ts`
- **Run a specific file:** `bun run path/to/file.ts`

### Testing (Bun Test)
Bun provides a fast, built-in test runner compatible with Jest/Vitest.
- **Run all tests:** `bun test`
- **Run a single test file:** `bun test path/to/file.test.ts`
- **Run tests matching a pattern:** `bun test -t "pattern"`
- **Watch mode:** `bun test --watch`
- **Coverage:** `bun test --coverage`
- **Snapshot testing:** Use `expect(value).toMatchSnapshot()` for complex object comparisons.

### Linting and Type Checking
- **Type check:** `bunx tsc --noEmit`
- **Verify before commit:** Ensure `bunx tsc` passes.

---

## 2. Code Style & Patterns

### TypeScript & Strictness
- **Strict Mode:** The project enforces `"strict": true` in `tsconfig.json`. Do not use `any` unless absolutely necessary (prefer `unknown`). Never modify `tsconfig.json` to relax type-checking or exclude directories to hide errors.
- **No Enums:** NEVER use TypeScript `enum`. Use `const` objects with `as const` or string literal types instead.
- **Types vs Interfaces:** 
  - Use `interface` for public APIs and object shapes that might be extended.
  - Use `type` for unions, intersections, and simple aliases.
- **Explicit Returns:** Annotate return types for all exported functions to improve readability and IDE performance.
- **Null Safety:** Avoid non-null assertions (`!`). Use optional chaining (`?.`) or explicit null checks.

### Imports & Exports
- **ESM Only:** Use standard `import`/`export` syntax.
- **Node Protocol:** Use the `node:` prefix for built-in modules (e.g., `import fs from 'node:fs'`).
- **Named Exports:** Prefer named exports (e.g., `export class Spreadsheet`) over default exports for better tree-shaking and refactoring support.
- **Organization:**
  1. Built-in modules (`node:*`)
  2. External dependencies
  3. Internal absolute/relative paths

### Naming Conventions
- **Files:** Use `kebab-case.ts` for all files (e.g., `cell-validator.ts`).
- **Classes/Interfaces:** `PascalCase` (e.g., `WorksheetManager`).
- **Functions/Variables:** `camelCase`.
- **Constants:** `UPPER_SNAKE_CASE` for global constants.
- **Private Members:** Prefix with `#` (native private) for true encapsulation.
- **Generic Types:** Use descriptive names if possible (e.g., `TCellData` instead of `T`).

### Error Handling
- **Domain Errors:** Create custom error classes extending `Error` for specific spreadsheet failures (e.g., `InvalidCellReferenceError`).
- **Predictable Failures:** For expected logical failures, consider returning a Result pattern `{ ok: true, value: T } | { ok: false, error: E }` rather than throwing.
- **Async Errors:** Always wrap async operations in `try/catch` or ensure they are properly handled by the caller.

---

## 3. Spreadsheet Domain Logic

When implementing spreadsheet features, follow these domain-specific guidelines:

### Coordinate Systems
- **Cell References:** Use standard A1 notation for external APIs.
- **Internal Storage:** Convert coordinates to 0-indexed integers (row, column) as early as possible for efficient processing.
- **Range Handling:** Use a dedicated `Range` class/interface to manage rectangular selections.

### Memory & Performance
- **Sparse Grids:** Do not allocate large empty arrays for the grid. Use a `Map` or a specialized sparse data structure to store only cells that contain data.
- **Immutability:** While internal state might be mutable for performance during batch operations, prefer returning new instances or deep copies for public API consumers to avoid side effects.
- **Lazy Evaluation:** Formulas should be evaluated lazily and results cached until the underlying dependencies change.

### Data Validation
- Ensure that data being written to cells is sanitized.
- Validate cell references (e.g., "A1", "Z100") before attempting to access them.

---

## 4. Project Architecture

As the project grows, follow this intended structure:
- `src/`: Core logic (Workbooks, Worksheets, Cells).
- `src/io/`: Readers and Writers (XLSX, CSV, ODS).
- `src/calculation/`: Formula parsing and evaluation engine.
- `src/utils/`: Shared utilities (coordinate conversion, string helpers).
- `tests/`: Test files mirroring the `src/` structure.

### API Design
- Aim for an API that is familiar to `PhpSpreadsheet` users (e.g., `getWorksheet`, `getCell`) but optimized for modern JavaScript idioms (e.g., fluent interfaces, promises).

---

## 5. Agent Instructions

### Session Start & Planning
- **Planning Skill:**  When starting a new session or a complex task, read `task_plan.md`, `findings.md`, and `progress.md`, which ensures consistency.
- **PHP Parity:** Before implementing any feature or writer part, ALWAYS reference the original PHP implementation in `php-src/src/PhpSpreadsheet/`. This is critical for ensuring logic parity and handling edge cases correctly.

### Context Awareness
- Before editing, read the relevant file and its neighbors to understand established patterns.
- If a file is large, read its exports first to get an overview.
- **Reference Implementation:** Always compare your implementation with the PHP counterpart in `/php-src` after finishing an implementation to ensure parity and review logic.

### Self-Verification Loop
1. **Plan:** Describe your approach briefly.
2. **Implement:** Write the code.
3. **Verify:**
   - Run `bunx tsc --noEmit` to check types.
   - Run relevant `bun test` commands.
   - If no tests exist for the feature, write them.
   - **XLSX Writer Parity:** If you modify the XLSX Writer, you MUST verify the output using the scripts in `verify-php/`. Generate a file with Bun and load it with the PHP scripts to ensure full compatibility.

### Persistence & Saving
- **Save Progress:** Always save your progress (e.g., via `git commit`) after completing a significant task or sub-task to ensure a clean state and prevent data loss.
- **Commit Prerequisites:** Before committing, you MUST update the `progress.md` and `task_plan.md` (or equivalent planning files) to accurately reflect the work completed and the remaining steps.
- **Commit Messages:** Use descriptive, conventional commit messages (e.g., `feat:`, `fix:`, `docs:`) that reflect the work done.

### Parallelism & Subagents
- **Default to Subagents:** When a task can be decomposed, use subagents aggressively. Prefer one subagent per failing test cluster, per file, or per independent parity check. Ask them not only provide insight, but actually make edit.
- **Senior Delegation:** Treat yourself as the integrator/reviewer. Default to outsourcing implementation work to subagents even when you can only run one at a time; reserve your time for architecture decisions, reviewing diffs, resolving conflicts, running tests, and landing clean commits.
- **Concurrent Safety:** When instructing subagents, explicitly tell them to avoid undoing, removing, reformatting, or otherwise modifying files that are outside their assigned scope (these may be concurrent work from other subagents).
- **Dependency Safety:** Do not run subagents concurrently on dependent tasks. Sequence work where one task needs another's output (e.g., define/land public APIs before writing tests; finish exploration/decision before implementation).
- **Task Decomposition:** Break down large requests into smaller, actionable tasks that can be delegated to subagents.
- **Reporting:** Ensure subagents provide a clear summary of their work and any identified issues.
- **PHP Parity:** When delegating tasks to subagents, ALWAYS remind them to check the original implementation with the PHP counterpart in `php-src/src/PhpSpreadsheet/` to ensure parity and review logic.

### Documentation
- Use JSDoc for all public classes and methods. Include `@param`, `@returns`, and `@throws` where applicable.
- Keep comments focused on the "Why" rather than the "What".

### Ethics & Quality
- **Minimal Changes:** Avoid unnecessary refactoring of stable code unless it directly relates to your task or improves critical performance.
- **No Side Effects:** Ensure that new features don't break existing spreadsheet parsing or calculation logic.
- **Security:** Never log sensitive data or cell contents unless explicitly debugging.
