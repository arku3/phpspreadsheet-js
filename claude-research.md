# Research Findings: PhpSpreadsheet Architecture

## 1. Core Architecture
- **Hierarchy**: `Spreadsheet` (Workbook) -> `Worksheet` -> `Cell`.
- **Decoupling**: The calculation engine is largely decoupled from the spreadsheet structure, but integrated via the `Spreadsheet` class.
- **Indexing**: 1-based indexing for rows and columns is used throughout the library to match Excel.

## 2. Calculation Engine
- **Pattern**: Stack-based evaluation (Reverse Polish Notation).
- **Components**:
    - **Tokenizer**: Uses complex regexes for formula tokens.
    - **Evaluator**: Processes the stack, handles operator precedence, and resolves cell references.
    - **Function Registry**: Maps Excel functions to specific implementation classes.
    - **Branch Pruning**: Optimizes logical functions (IF, etc.) by skipping unused branches.

## 3. Storage & Performance
- **Sparse Grid**: Cells are stored in a collection (Map-like) only when they contain data.
- **Flyweight Pattern**: `Cell` objects are often lightweight or instantiated on-demand.
- **Caching**: Results and cell data can be cached to save memory and CPU.

## 4. Coordinate System
- **Utilities**: `Coordinate` class provides robust A1 <-> (col, row) mapping.
- **Internal Storage**: Often uses integer pointers (`row * 16384 + col`) for indexing.

## 5. Data Types
- **DataType**: Defined constants for `string`, `numeric`, `boolean`, `formula`, `error`, and `null`.
- **Value Binder**: Logic for converting raw input into spreadsheet-native types.
