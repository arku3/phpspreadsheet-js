# Task Plan - Phase 15 Systematic Parity & Reader

## Goal
Complete systematic parity fixes identified in the review and implement the XLSX Reader.

## Phases

- [ ] Phase 15: I/O Extension & Graphics <!-- id: 54 -->
    - [x] Systematic Writer Parity Review and Verification against PHP. <!-- id: 56 -->
    - [x] Align Style and Worksheet API with PhpSpreadsheet (API Parity). <!-- id: 57 -->
    
    - [ ] **Parity Fixes (Mandatory before Reader)** <!-- id: 58 -->
        - [ ] **Core Module Fixes**
            - [x] Implement `Worksheet.getHighestRow()` and `Worksheet.getHighestColumn()`.
            - [x] Implement `Worksheet.getHighestDataRow()` and `Worksheet.getHighestDataColumn()`.
            - [x] Implement `Worksheet.toArray()`, `fromArray()`, and `rangeToArray()`.
            - [x] Implement Row/Column manipulation: `insertNewRowBefore`, `insertNewColumnBefore`, `removeRow`, `removeColumn`.
            - [x] Implement Worksheet management: `duplicateWorksheetByTitle`, `removeSheetByIndex`, `sheetNameExists`.
            - [x] Implement Active Sheet management: `setActiveSheetIndex`, `setActiveSheetIndexByName`.
            - [x] Implement `Spreadsheet.getSheetNames()`, `getSheetByCodeName()`.
            - [x] Implement `Cell.isInMergeRange()`, `getMergeRange()`, and `getFormattedValue()`.
            - [x] Implement `Cell.isFormula()`, `isLocked()`, `isHiddenOnFormulaBar()`.
            - [x] Implement `Cell.getHyperlink()` and `getDataValidation()` support (with placeholders).
        
        - [ ] **Style Module Fixes**
            - [x] Add `NumberFormat.toFormattedString()` rendering engine (Complex Task).
            - [ ] Add missing Font properties: Latin, EastAsian, ComplexScript, StrikeType, Cap, BaseLine.
            - [ ] Add `Alignment` rotation range validation (-90 to 90, 255).
            - [ ] Add `Color.setHyperlinkTheme()` and `hasChanged` tracking.

        - [ ] **Calculation Engine Fixes**
            - [ ] Implement missing categories: `DateTimeExcel`, `Financial`, `Engineering`, `Statistical`.
            - [ ] Add support for R1C1 reference conversion.
            - [ ] Implement `Calculation.getFunctions()` metadata retrieval.
            - [ ] Implement intersection (` `) and union (`,`) operator evaluation parity.
        
        - [ ] **I/O Module (Writer) Fixes**
            - [x] Implement `SharedStrings.controlCharacterPHP2OOXML` sanitization.
            - [x] Refactor Relationship IDs (`rId`) in `Workbook.ts` to be dynamic.
            - [x] Support multiple `cellStyleXfs` instead of one hardcoded entry.
            - [x] Fix Rich Text superscript/subscript parity between Styles and StringTable.
        
        - [ ] **Memory & Disposal**
            - [ ] Implement `disconnectWorksheets()` and `disconnectCells()` circular reference breaking.

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
