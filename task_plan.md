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
- [ ] Phase 6: Parity & Advanced Features <!-- id: 5 -->
    - [ ] Define standardized Excel Error Codes. <!-- id: 6 -->
    - [ ] Implement Branch Pruning (Lazy IF evaluation). <!-- id: 7 -->
    - [ ] Implement Cross-Sheet References (`Sheet2!A1`). <!-- id: 8 -->
    - [ ] Support for more complex functions (VLOOKUP, etc.). <!-- id: 9 -->
    - [ ] Add argument count validation to FunctionRegistry. <!-- id: 10 -->
- [ ] Phase 4: Operators & Basic Functions <!-- id: 3 -->
    - [ ] Implement arithmetic operators (`+`, `-`, `*`, `/`, `^`).
    - [ ] Implement comparison operators.
    - [ ] Implement basic functions (`SUM`, `IF`).
- [ ] Phase 5: Integration & Testing <!-- id: 4 -->
    - [ ] Integrate with `Worksheet.setCellValue`.
    - [ ] Add unit tests for various formula scenarios.

## Decisions
- Use native private members (`#`) for internal state.
- Strictly avoid `enum`; use `const` objects.
- Maintain sparse grid compatibility.

## Errors Encountered
| Error | Attempt | Resolution |
|-------|---------|------------|
