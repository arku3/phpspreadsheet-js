# Project Spec: phpspreadsheet-js

## Goal
Rewrite the core functionality of [PhpSpreadsheet](https://github.com/PHPOffice/PhpSpreadsheet) in TypeScript, optimized for the [Bun](https://bun.sh) runtime.

## Core Requirements
1. **Language & Runtime**: TypeScript, targeting Bun.
2. **Parity**: Maintain logic parity with the original PHP implementation for calculation, cell management, and worksheet structure.
3. **Core Modules**:
    - **Workbook & Worksheet Management**: Hierarchy of Workbooks, Worksheets, and Cells.
    - **Calculation Engine**: Complete formula parser and evaluator (A1/R1C1, functions, ranges, cross-sheet references, structured references, spill operator).
    - **Cell Data Types**: Support for Numeric, String, Boolean, Formula, and Error types.
    - **Coordinates**: A1 to (row, column) conversion and range handling.
4. **Performance**:
    - Use sparse grid storage (Map-based) to handle large sheets efficiently.
    - Implement calculation caching.
5. **Testing**: 100% test coverage using `bun test`, mirroring the structure of the original PHP tests where applicable.

## Out of Scope (Initial Phase)
- Full I/O (XLSX, CSV, ODS) - focus on memory-resident spreadsheet and calculation first.
- Complex styling/formatting.
- Charts and Drawings.

## Implementation Strategy
1. Scaffold project structure (src/core, src/calculation, src/utils).
2. Port coordinate and helper utilities.
3. Implement Worksheet and Cell collection logic.
4. Port the Calculation Engine (Tokenizer -> Parser -> Evaluator).
5. Implement core Excel functions (Math, Statistical, Logical).
