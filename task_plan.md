# Task Plan: Remediation Based on Findings

## Goal
Close parity gaps between TypeScript and PHP while preserving XLSX-only IO scope and matching all public API names, arguments, and return types.

## Constraints
- XLSX-only reader/writer support.
- Public API parity with PHP in naming, arguments, and return types.

## Phase 1: Public API Parity (Core)
- [x] Spreadsheet: align return types for `setActiveSheetIndex`, `setActiveSheetIndexByName`, `setValueBinder`.
- [x] Spreadsheet: add missing APIs (named formulas/ranges, calculation hooks, sheet management, cell Xf helpers, macros/ribbon, PDF helpers).
- [x] Worksheet: align `setTitle`, `getStyle`, `setCellValue` signatures.
- [x] Worksheet: add missing methods (cell lookup helpers, hyperlinks, conditional styles, table/chart collections, protection, active cell, dimension helpers).
- [x] Cell: align constructor, `getColumn/getRow`, `setValue`, `setValueExplicit`, data validation/hyperlink APIs.
- [x] Cell: add calculated-value and formula attribute APIs.
- [x] Comment/DefinedName/NamedRange/Hyperlink: add missing APIs and align constructors/constants.
- [x] CellCollection: implement Cells-like behaviors (active cell, sorting, delete/unset, clone, factory).

## Phase 2: Worksheet Extras Parity
- [x] Tables: add `Table/Column`, `TableStyle`, `TableDxfsStyle` and align table APIs.
- [x] Drawings: add `MemoryDrawing`, `HeaderFooterDrawing` and complete BaseDrawing/Drawing APIs.
- [ ] Charts: add `Layout`, `Properties`, `AxisText` and align chart/axis/data-series/legend/title APIs.
- [x] AutoFilter/HeaderFooter: align range input types, add image APIs, clone behavior, return types.

## Phase 3: Style Parity
- [ ] Implement missing NumberFormat formatter/wizard classes and built-in registry.
- [ ] Align conditional formatting (rule evaluation, color scale/data bar/icon set APIs, wizard factories, cell matcher).
- [ ] Fix hash code mismatches (Alignment, Color, Fill, NumberFormat, Font).
- [ ] Align Theme/Color logic and hyperlink theme behavior.

## Phase 4: Calculation Parity
- [ ] Implement missing calculation core classes (locale, category, function registry metadata, exceptions).
- [ ] Align Calculation public API and parser semantics (union/intersection/range operators, scientific notation, structured refs, matrix literals).
- [ ] Add array return modes, cyclic reference handling, logger/branch pruning parity.
- [ ] Expand function coverage to match PHP categories, with metadata parity.

## Phase 5: IO/XLSX Parity (XLSX-only)
- [ ] Align IReader/IWriter interfaces with PHP flags and options.
- [ ] Implement missing reader parts (conditional styles, hyperlinks, theme, shared formula).
- [ ] Implement missing writer parts (metadata, defined names, richer drawings/comments).
- [ ] Add missing writer options (forceFullCalc, explicitStyle0, restrictMaxColumnWidth) where applicable.

## Phase 6: Shared/Utils Parity
- [ ] Implement missing shared helpers needed by XLSX scope (Date/TimeZone/File/XMLWriter/Drawing/Font).
- [ ] Add `IOFactory` and `Settings` parity stubs to satisfy public API requirements.
- [ ] Complete `StringHelper`, `Coordinate/ReferenceHelper`, and `HashTable` APIs.

## Verification
- [x] For each subsystem: update/add tests to match PHP behavior.
- [x] Run `bunx tsc --noEmit`.
- [x] Run `bun test`.
- [ ] Run `verify-php/` scripts when XLSX writer changes.
