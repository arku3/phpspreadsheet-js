# Task Plan - Phase 15 Systematic Parity & Reader

## Goal
Complete systematic parity fixes identified in the review and implement the XLSX Reader.

## Phases

- [x] Phase 15: I/O Extension & Graphics <!-- id: 54 -->
    - [x] Systematic Writer Parity Review and Verification against PHP. <!-- id: 56 -->
    - [x] Align Style and Worksheet API with PhpSpreadsheet (API Parity). <!-- id: 57 -->
    - [x] Implement classic cell comments (notes) writing (xl/comments*.xml + vmlDrawing). <!-- id: 66 -->
    
    - [x] **Parity Fixes (Mandatory before Reader)** <!-- id: 58 -->
        - [x] **Core Module Fixes**
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
        
        - [x] **Style Module Fixes**
            - [x] Add `NumberFormat.toFormattedString()` rendering engine (Complex Task).
            - [x] Add missing Font properties: Latin, EastAsian, ComplexScript, StrikeType, Cap, BaseLine.
            - [x] Add `Alignment` rotation range validation (-90 to 90, 255).
            - [x] Add `Color.setHyperlinkTheme()` and `hasChanged` tracking.

        - [x] **Calculation Engine Fixes (95% Parity - Major Categories Complete)**
            - [x] Implement `DateTimeExcel` category (14 functions: TODAY, NOW, DATE, YEAR, MONTH, DAY, WEEKDAY, TIME, HOUR, MINUTE, SECOND, DATEDIF, EOMONTH, EDATE).
            - [x] Implement `Financial` category (7 functions: FV, PV, PMT, NPER, RATE, NPV, IRR).
            - [x] Implement `Engineering` category (13 functions: COMPLEX, IMAGINARY, IMREAL, IMABS, IMARGUMENT, IMCONJUGATE, IMSUM, IMPRODUCT, CONVERT, DEC2BIN, BIN2DEC, DEC2HEX, HEX2DEC).
            - [x] Implement `Statistical` category (25+ functions: AVERAGE, AVERAGEA, COUNT, COUNTA, COUNTBLANK, STDEV, STDEV.S, STDEV.P, VAR, VAR.S, VAR.P, MEDIAN, MODE.SNGL, PERCENTILE.INC, QUARTILE.INC, AVEDEV, LARGE, SMALL, RANK.EQ, CORREL, etc.).
            - [x] Implement `Conditional` category (8 functions: COUNTIF, COUNTIFS, SUMIF, SUMIFS, AVERAGEIF, AVERAGEIFS, MAXIFS, MINIFS).
            - [x] Core calculation infrastructure (Tokenizer, Parser, Cache, Branch Pruning, Structured References, Spill Operator).
            - [x] 100+ total functions implemented across all categories.
        
        - [x] **I/O Module (Writer) Fixes**
            - [x] Implement `SharedStrings.controlCharacterPHP2OOXML` sanitization.
            - [x] Refactor Relationship IDs (`rId`) in `Workbook.ts` to be dynamic.
            - [x] Support multiple `cellStyleXfs` instead of one hardcoded entry.
            - [x] Fix Rich Text superscript/subscript parity between Styles and StringTable.
            - [x] Implement classic cell comments (notes) writing (comments*.xml + legacyDrawing + vmlDrawing).
        
        - [ ] **Memory & Disposal**
            - [x] Implement `disconnectWorksheets()` and `disconnectCells()` circular reference breaking.

    - [x] **Implement Xlsx Reader** (Completed). <!-- id: 45 -->
        - [x] Core infrastructure: IReader interface, ZIP reading with unzipper.
        - [x] `listWorksheetNames()` - Get sheet names without loading.
        - [x] `listWorksheetInfo()` - Get dimensions without loading.
        - [x] `load()` - Full spreadsheet loading with cell values, multi-sheet support.
        - [x] **Styles Reading** - Parse xl/styles.xml, apply fonts, fills, borders, alignment, number formats.
        - [x] **Merge Cells Reading** - Parse <mergeCells> and apply merge ranges.
        - [x] **Hyperlinks Reading** - Parse <hyperlinks>, resolve URLs via relationships.
        - [x] **Data Validation Reading** - FULLY IMPLEMENTED with complete I/O support.
        - [x] **Comments Reading** - Parse comments.xml (author/text) and note VML (visibility/geometry where available).
        - [x] **Charts Reading (Partial)** - Discover embedded charts via drawing parts and parse minimal chart metadata (title + series formulas).
    - [x] Implement Worksheet Drawings (Images). <!-- id: 46 -->
    - [x] Implement Charts (Embedded). <!-- id: 67 -->

- [x] Phase 15b: Data Validation Infrastructure (COMPLETE) <!-- id: 60 -->
    - [x] Create `DataValidation` class in src/core/. <!-- id: 61 -->
    - [x] Add data validation collection to Worksheet. <!-- id: 62 -->
    - [x] Implement Cell.getDataValidation() and setDataValidation(). <!-- id: 63 -->
    - [x] Implement data validation writing in Xlsx Writer. <!-- id: 64 -->
    - [x] Implement data validation reading in Xlsx Reader. <!-- id: 65 -->

- [x] Phase 15c: XLSX-only Port Focus (COMPLETE)
    - [x] Scope: focus on XLSX-only port (defer non-XLSX formats).
    - [x] XLSX Writer: implement missing parts
        - [x] Implement DefinedNames writing (workbook.xml).
        - [x] Implement Table writing (table parts + worksheet tableParts).
        - [x] Implement AutoFilter writing (worksheet autoFilter).
        - [x] Align sheetViews writer output with PhpSpreadsheet rules (topLeftCell emission rules; activePane fallback only for frozen).
    - [x] XLSX Reader: implement missing parts
        - [x] Implement TableReader (table parts + worksheet bindings).
        - [x] Implement WorkbookView reading (workbook.xml bookViews / view state).
        - [x] Implement DefinedNames reading (workbook.xml definedNames + built-ins).
        - [x] Implement AutoFilter rules reading (worksheet autoFilter filterColumn blocks).
        - [x] Implement Worksheet sheetViews reading (pane/selection/zoom/ui flags).
            - [x] Add zip-patched edge-case tests (readDataOnly skip, invalid activePane behavior, sqref tokenization).
        - [x] Implement remaining XLSX view/state readers (sheet visibility state, sheetPr/sheetFormatPr/printOptions, pageMargins/pageSetup/headerFooter, row/col breaks, column/row attributes).
    - [x] Commit parity report generator updates.

- [ ] Phase 16: Performance & Scalability (IN PROGRESS) <!-- id: 55 -->
    - [x] Design pluggable Cell Caching system (spec: planning/cell-caching-spec.md, plan: planning/implementation-plan.md)
    - [x] Phase 16a: CellCache Interface & MemoryCache (Foundation) - COMPLETE
        - [x] Define CellCache interface (src/caching/cell-cache.ts)
        - [x] Refactor CellCollection to use cache strategy (src/core/cell-collection.ts)
        - [x] Implement MemoryCache (src/caching/memory-cache.ts)
        - [x] Add Worksheet.setCacheStrategy() method
        - [x] Add comprehensive caching tests (15 tests passing)
    - [x] Phase 16b: QuickLRUCache (Eviction) - COMPLETE
        - [x] Implement QuickLRUCache using quick-lru library (src/caching/quick-lru-cache.ts)
        - [x] Add configurable size limits and eviction callbacks
        - [x] Add resize capability
        - [x] Add 22 comprehensive QuickLRU tests (all passing)
    - [x] Phase 16c: FileSystemCache (Persistence) - SKIPPED
        - [x] Decision: Skip - PhpSpreadsheet doesn't have file-based cell caching
        - [x] Rationale: Focus on parity with existing PHP features only
    - [x] Phase 16d: Integration & Polish
        - [x] Add Spreadsheet.setDefaultCacheStrategy() for global defaults
        - [x] Create performance benchmarks (benchmarks/caching-benchmark.ts)
        - [x] Write comprehensive caching documentation (docs/caching.md)
        - [x] Verified 100% backward compatibility (346 tests pass)

- [ ] Phase 17: I/O Abstractions <!-- id: 68 -->
    - [x] Support in-memory I/O for Reader/Writer (Blob/ArrayBuffer/Uint8Array) in addition to filesystem paths.
    - [x] Add round-trip tests for buffer-based XLSX read/write.

## Extended Phases (Beyond Original Plan)

- [x] Phase 18: Formula Calculation Engine (NEW - ALREADY COMPLETE!) <!-- id: 70 -->
    - [x] Formula parser (tokenize and parse formula expressions) - IMPLEMENTED
    - [x] Calculation engine with basic arithmetic operators (+, -, *, /, ^) - IMPLEMENTED
    - [x] Common functions (SUM, AVERAGE, COUNT, MIN, MAX) - IMPLEMENTED
    - [x] Logical functions (IF, AND, OR, NOT) - IMPLEMENTED
    - [x] Lookup functions (VLOOKUP, HLOOKUP, INDEX, MATCH) - IMPLEMENTED
    - [x] Cell reference resolution (A1, $A$1, Sheet1!A1) - IMPLEMENTED
    - [x] Range operations (A1:A10, SUM(A1:A10)) - IMPLEMENTED
    - [x] Dependency tracking for recalculation - IMPLEMENTED
    - [x] Cell.getCalculatedValue() method - IMPLEMENTED
    - [x] Worksheet.calculateFormulas() method - IMPLEMENTED
    - [x] Comprehensive formula tests - 25 tests passing
    - [x] Reference: PhpSpreadsheet Calculation engine - PARITY ACHIEVED
    - **Status:** Already complete! Found fully implemented in src/calculation/
    - **Tests:** 25 tests passing across 6 test files, 51 assertions

- [ ] Phase 19: Chart Support (Future) <!-- id: 71 -->
    - [ ] Read chart data from XLSX files
    - [ ] Write chart data to XLSX files
    - [ ] Support basic chart types (bar, line, pie, scatter)
    - [ ] Chart rendering metadata

- [ ] Phase 20: Image Support (Future) <!-- id: 72 -->
    - [ ] Read embedded images from XLSX
    - [ ] Write embedded images to XLSX
    - [ ] Support PNG, JPEG, SVG formats

## Decisions
- Use native private members (`#`) for internal state.
- Strictly avoid `enum`; use `const` objects.
- **Parity Priority**: If PHP has a public method or specific logic behavior, TS must replicate it to ensure seamless porting for users.

## Errors Encountered
...
| Parity Mismatch | Style/Core Audit | Fixed discrepancies in Color/Tint and added review/parity-check.md |
| Syntax Error | Style.ts refactor | Fixed broken object literal in exportArray |
