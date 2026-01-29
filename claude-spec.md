# Integrated Specification: phpspreadsheet-js

## 1. Executive Summary
The `phpspreadsheet-js` library is a TypeScript port of the widely-used PHP library `PhpSpreadsheet`. It aims to provide a robust, memory-efficient, and high-performance solution for spreadsheet manipulation in the Bun runtime.

## 2. Core Hierarchy
- **`Spreadsheet`**: The entry point, representing a workbook.
- **`Worksheet`**: A single sheet within a workbook.
- **`Cell`**: An individual coordinate containing data or a formula.
- **`CellCollection`**: A sparse grid storage using `Map<string, Cell>`.

## 3. Calculation Engine
- **Stack-based Parser**: Converts Excel formulas into Reverse Polish Notation (RPN).
- **Features**:
    - Arithmetic operators and precedence.
    - Function registry supporting standard Excel functions (Math, Logical, Statistical, Lookup, etc.).
    - Range resolution (A1:B2) and cross-sheet references (Sheet1!A1).
    - **Advanced Support**:
        - Branch pruning (lazy evaluation for `IF`).
        - Structured references (Excel Tables).
        - Spill operator (`#`) and dynamic arrays via `ANCHORARRAY`.
        - Named ranges and named formulas.
- **Performance**:
    - Calculation caching at the cell level.
    - Sparse grid ensures large empty areas don't consume memory.

## 4. Coordinate System
- **1-based indexing** for all external and internal row/column representations.
- **Utility**: `Coordinate` class for A1 <-> (Col, Row) conversion.

## 5. Bun Optimizations
- **File API**: Use `Bun.file()` for potentially streaming large datasets or temporary cache files.
- **Testing**: Native `bun test` for high-speed verification.
- **Types**: Strict TypeScript for better developer experience and safety.

## 6. API Parity
- Public methods will mirror the original PHP API for ease of migration.
- Example: `getActiveSheet()`, `setCellValue($coordinate, $value)`, `getCalculatedValue()`.

## 7. Development Targets
- **100% Logic Parity** for the core calculation engine and cell management.
- **Sparse grid storage** as the default implementation.
- **Initial Phase**: Focus on Workbook/Worksheet/Cell core and the complete Calculation Engine. (File I/O and styling are subsequent phases).
