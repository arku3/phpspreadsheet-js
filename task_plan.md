# Task Plan - Phase 15 Systematic Parity & Reader

## Goal
Complete systematic parity fixes identified in the review and implement the XLSX Reader.

## Phases
... (Phases 1-14 identical to original) ...

- [ ] Phase 15: I/O Extension & Graphics <!-- id: 54 -->
    - [x] Systematic Writer Parity Review and Verification against PHP. <!-- id: 56 -->
    - [x] Align Style and Worksheet API with PhpSpreadsheet (API Parity). <!-- id: 57 -->
    - [ ] **Parity Fixes (Mandatory before Reader)** <!-- id: 58 -->
        - [ ] Implement `Worksheet.getHighestRow()` and `Worksheet.getHighestColumn()`.
        - [ ] Implement `SharedStrings.controlCharacterPHP2OOXML` sanitization.
        - [ ] Add `isInMergeRange` and `getFormattedValue` to `Cell`.
        - [ ] Add basic row/column insertion/deletion to `Worksheet`.
    - [ ] Implement Xlsx Reader. <!-- id: 45 -->
    - [ ] Implement Worksheet Drawings (Images). <!-- id: 46 -->

- [ ] Phase 16: Performance & Scalability <!-- id: 55 -->
    - [ ] Design and implement pluggable Cell Caching for large datasets. <!-- id: 53 -->

## Decisions
- Use native private members (`#`) for internal state.
- Strictly avoid `enum`; use `const` objects.
- **Parity Priority**: If PHP has a public method or specific logic behavior, TS must replicate it to ensure seamless porting for users.

## Errors Encountered
...
| Parity Mismatch | Style/Core Audit | Fixed discrepancies in Color/Tint and added review/parity-check.md |
| Syntax Error | Style.ts refactor | Fixed broken object literal in exportArray |
