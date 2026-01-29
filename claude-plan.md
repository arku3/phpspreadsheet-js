# Implementation Plan: phpspreadsheet-js

## 1. Overview
This plan outlines the porting of the core PHPSpreadsheet engine to TypeScript using the Bun runtime. The focus is on memory efficiency (sparse grid), strict API parity with the original PHP library, and a complete, robust calculation engine.

## 2. Phase 1: Infrastructure & Utilities
### 2.1 Project Setup
- Initialize Bun project (`bun init`).
- Configure `tsconfig.json` with strict mode and ESM modules.
- Setup directory structure:
    - `src/core/`: Workbook, Worksheet, Cell, CellCollection.
    - `src/calculation/`: Formula Parser, Evaluator, Functions.
    - `src/utils/`: Coordinate helpers, String utilities.
    - `tests/`: Mirrored structure for unit tests.

### 2.2 Coordinate System (`src/utils/coordinate.ts`)
- Port `Coordinate` class for A1 <-> (Column, Row) mapping.
- Columns are 1-based (A=1).
- Rows are 1-based.
- Methods: `coordinateFromString`, `stringFromCoordinate`, `columnIndexFromString`, `stringFromColumnIndex`.

### 2.3 Shared Constants & Types
- `src/core/data-type.ts`: Port `DataType` constants (TYPE_STRING, TYPE_NUMERIC, etc.).
- `src/calculation/errors.ts`: Port standard Excel error strings (#NULL!, #DIV/0!, etc.).

## 3. Phase 2: Core Spreadsheet Model
### 3.1 Cell Collection (`src/core/cell-collection.ts`)
- Implement a sparse grid using `Map<string, Cell>`.
- Methods for adding, retrieving, and checking existence of cells.

### 3.2 Cell (`src/core/cell.ts`)
- Properties: Value, DataType, Worksheet (parent), Coordinate.
- Methods: `getValue()`, `setValue()`, `getCalculatedValue()`, `getDataType()`.
- Integration with the Calculation Engine for formula evaluation.

### 3.3 Worksheet (`src/core/worksheet.ts`)
- Manage `CellCollection`.
- Maintain Table and Named Range collections.
- Methods: `getCell()`, `setCellValue()`, `getTableByName()`, `getTitle()`.

### 3.4 Spreadsheet (`src/core/spreadsheet.ts`)
- Root container.
- Manage Worksheet collection and `ActiveSheet`.
- Methods: `getActiveSheet()`, `addSheet()`, `getNamedRange()`.

## 4. Phase 3: Calculation Engine
### 4.1 Tokenization & Parsing (`src/calculation/formula-parser.ts`)
- Port the formula tokenizer using equivalent regexes for cell refs, functions, and ranges.
- Implement `FormulaParser` to convert infix formulas to a postfix (RPN) token stack.
- Support for structured references (`Table1[Column]`) and spill operators (`#`).

### 4.2 Evaluator (`src/calculation/calculation.ts`)
- Implement `processTokenStack` loop.
- Stack-based evaluation of operators (+, -, *, /, &, etc.).
- Branch Pruning (`src/calculation/branch-pruner.ts`) for logical functions.
- Circular reference detection using a recursive stack check.
- Calculation Caching using a `Map` within the `Calculation` instance.

### 4.3 Function Registry (`src/calculation/function-registry.ts`)
- Registry to map function names to implementation classes.
- Categorized function modules (Math, Statistical, Logical, Lookup).

## 5. Phase 4: Advanced Domain Logic
### 5.1 Tables & Named Ranges
- `src/worksheet/table.ts`: Implementation of Excel Table and TableColumn.
- `src/core/defined-name.ts`: Base class for named ranges and formulas.
- `src/calculation/engine/structured-reference.ts`: Resolver for Table references.

### 5.2 Dynamic Arrays & Spills
- Implementation of `ANCHORARRAY` internal function for the `#` operator.

## 6. Verification & Quality
- **Testing**: Use `bun test`. Mirror PHP test cases where possible.
- **Linter**: Standard ESLint/Prettier setup.
- **Type Safety**: No `any` types; prefer `unknown` or explicit interfaces.

## 7. Delivery
- A functional Spreadsheet instance capable of parsing and evaluating complex formulas with 100% logic parity to the original PHP version.
