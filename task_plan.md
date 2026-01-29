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
    - [ ] Implement Spill Operator (#) support. <!-- id: 18 -->
    - [ ] Implement Matrix/Array Constant refinements. <!-- id: 19 -->

## Decisions
- Use native private members (`#`) for internal state.
- Strictly avoid `enum`; use `const` objects.
- Maintain sparse grid compatibility.

## Errors Encountered
| Error | Attempt | Resolution |
|-------|---------|------------|
