# Task Plan - Implementing Calculation Engine Evaluator

## Goal
Implement the main formula evaluation engine for `phpspreadsheet-js`, enabling the evaluation of Excel-style formulas like `=A1+B1`, `=SUM(A1:B10)`, etc.

## Phases
- [x] Phase 1: Infrastructure & Registry <!-- id: 0 -->
    - [x] Create `src/calculation/calculation.ts` as the main entry point.
    - [x] Set up a function registry for Excel functions (SUM, AVERAGE, etc.).
- [x] Phase 2: Core Evaluation Loop <!-- id: 1 -->
    - [x] Implement `processTokenStack` logic.
    - [x] Handle pushing operands to the stack.
    - [x] Handle executing operators.
- [x] Phase 3: Reference Resolution <!-- id: 2 -->
    - [x] Resolve cell references (e.g., `A1`).
    - [x] Resolve cell ranges (e.g., `A1:C10`).
- [x] Phase 4: Operators & Basic Functions <!-- id: 3 -->
    - [x] Implement arithmetic operators (`+`, `-`, `*`, `/`, `^`).
    - [x] Implement comparison operators.
    - [x] Implement basic functions (`SUM`, `IF`).
- [x] Phase 5: Integration & Testing <!-- id: 4 -->
    - [x] Integrate with `Worksheet.setCellValue`.
    - [x] Add unit tests for various formula scenarios.
- [x] Phase 6: Parity & Advanced Features <!-- id: 5 -->
    - [x] Define standardized Excel Error Codes. <!-- id: 6 -->
    - [x] Implement Branch Pruning (Lazy IF evaluation). <!-- id: 7 -->
    - [x] Implement Cross-Sheet References (`Sheet2!A1`). <!-- id: 8 -->
    - [x] Support for more complex functions (VLOOKUP, etc.). <!-- id: 9 -->
    - [x] Add argument count validation to FunctionRegistry. <!-- id: 10 -->
- [x] Phase 7: Performance & Compatibility <!-- id: 11 -->
    - [x] Implement Row-Major / Column-Major range extraction. <!-- id: 12 -->
    - [x] Support for Named Ranges (Formulas). <!-- id: 13 -->
    - [x] Refactor FunctionRegistry into Categorized modules. <!-- id: 14 -->
- [ ] Phase 8: Advanced Excel Parity <!-- id: 15 -->
    - [x] Implement Calculation Caching. <!-- id: 16 -->
    - [x] Implement Structured References (Excel Tables). <!-- id: 17 -->
    - [x] Implement Spill Operator (#) support. <!-- id: 18 -->
    - [x] Implement Matrix/Array Constant refinements. <!-- id: 19 -->
- [x] Phase 9: Value Binding & Data Type Parity <!-- id: 20 -->
    - [x] Implement `IValueBinder` interface and `DefaultValueBinder`. <!-- id: 21 -->
    - [x] Implement `AdvancedValueBinder` for automatic type detection (dates, percentages). <!-- id: 22 -->
    - [x] Integrate Value Binder into `Worksheet.setCellValue`. <!-- id: 23 -->
- [x] Phase 10: Rich Text & Formatting Infrastructure <!-- id: 24 -->
    - [x] Implement `RichText` and `Run` classes. <!-- id: 25 -->
    - [x] Port core Style classes (Font, Alignment, NumberFormat). <!-- id: 26 -->
    - [x] Implement applyFromArray across style classes and add tests. <!-- id: 28 -->
    - [x] Implement Cell Style (Xf) management in Workbook (Style Supervisor). <!-- id: 27 -->

- [x] Phase 11: Parity Refinement & Robustness <!-- id: 29 -->
    - [x] Systematic Parity Review against PHP source. <!-- id: 30 -->
    - [x] Refactor FormulaToken for better encapsulation. <!-- id: 31 -->
    - [x] Implement missing Worksheet PageSetup/Margins. <!-- id: 32 -->
    - [x] Resolve remaining LSP errors in Calculation modules. <!-- id: 33 -->
    - [x] Implement Worksheet dimensions (Row/Column). <!-- id: 34 -->
    - [x] Implement Spreadsheet.garbageCollect(). <!-- id: 35 -->

- [x] Phase 12: XLSX Writer Implementation <!-- id: 36 -->
    - [x] Set up XLSX writer infrastructure (IO module, ZIP container). <!-- id: 37 -->
    - [x] Implement ContentTypes and Rels generation. <!-- id: 38 -->
    - [x] Implement Workbook and Worksheet XML generation. <!-- id: 39 -->
    - [x] Implement Styles XML generation (CellXf, Fonts, Fills, Borders). <!-- id: 40 -->
    - [x] Implement SharedStrings (SST) support. <!-- id: 41 -->
    - [x] Integrate with `archiver` for .xlsx packaging. <!-- id: 42 -->

- [ ] Phase 13: Advanced Features & Interactivity <!-- id: 43 -->
    - [x] Implement Merged Cells logic in Worksheet and Writer. <!-- id: 44 -->
    - [x] Implement Worksheet Panes (Freeze Panes, Split) and View settings. <!-- id: 47 -->
    - [x] Implement AutoFilter logic (showHideRows). <!-- id: 48 -->
    - [ ] Implement Xlsx Reader. <!-- id: 45 -->
    - [ ] Implement Worksheet Drawings (Images). <!-- id: 46 -->

- [ ] Phase 14: Architectural & Parity Polish <!-- id: 49 -->
    - [ ] Implement Document Properties (Metadata). <!-- id: 50 -->
    - [ ] Port advanced Style features (Conditional Formatting, Themes/Tinting). <!-- id: 51 -->
    - [ ] Design and implement pluggable Cell Caching for large datasets. <!-- id: 52 -->
    - [ ] Implement Workbook Security and Protection. <!-- id: 53 -->

## Decisions
- Use native private members (`#`) for internal state.
- Strictly avoid `enum`; use `const` objects.
- Maintain sparse grid compatibility.

## Errors Encountered
| Error | Attempt | Resolution |
|-------|---------|------------|
