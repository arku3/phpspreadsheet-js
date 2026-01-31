# Worksheet Parity (PhpSpreadsheet vs TS)

This document compares PhpSpreadsheet's Worksheet implementation (`php-src/src/PhpSpreadsheet/Worksheet/Worksheet.php`) with this repository's TypeScript Worksheet implementation (`src/core/worksheet.ts`).

## Overview Mapping

- PHP core: `php-src/src/PhpSpreadsheet/Worksheet/Worksheet.php`
- TS core: `src/core/worksheet.ts` (Worksheet is currently in `src/core/`, not under `src/worksheet/`)

Supporting subsystems (non-exhaustive):

- Dimensions
  - PHP: `php-src/src/PhpSpreadsheet/Worksheet/RowDimension.php`, `php-src/src/PhpSpreadsheet/Worksheet/ColumnDimension.php`, `php-src/src/PhpSpreadsheet/Worksheet/Dimension.php`
  - TS: `src/worksheet/row-dimension.ts`, `src/worksheet/column-dimension.ts`, `src/worksheet/dimension.ts`
- Page layout
  - PHP: `php-src/src/PhpSpreadsheet/Worksheet/PageSetup.php`, `php-src/src/PhpSpreadsheet/Worksheet/PageMargins.php`, plus header/footer `php-src/src/PhpSpreadsheet/Worksheet/HeaderFooter.php`
  - TS: `src/worksheet/page-setup.ts`, `src/worksheet/page-margins.ts` (no header/footer model yet)
- View/panes
  - PHP: `php-src/src/PhpSpreadsheet/Worksheet/SheetView.php`, `php-src/src/PhpSpreadsheet/Worksheet/Pane.php`
  - TS: `src/worksheet/sheet-view.ts`, `src/worksheet/pane.ts`
- AutoFilter
  - PHP: `php-src/src/PhpSpreadsheet/Worksheet/AutoFilter.php`
  - TS: `src/worksheet/auto-filter.ts` and `src/worksheet/auto-filter/*`
- Tables
  - PHP: `php-src/src/PhpSpreadsheet/Worksheet/Table.php`
  - TS: `src/worksheet/table.ts`
- Drawings
  - PHP: `php-src/src/PhpSpreadsheet/Worksheet/BaseDrawing.php` and related drawing classes
  - TS: `src/worksheet/drawing/base-drawing.ts`, `src/worksheet/drawing/drawing.ts`, `src/worksheet/drawing/shadow.ts`
- Charts
  - PHP: charts stored on worksheet via `php-src/src/PhpSpreadsheet/Worksheet/Worksheet.php`
  - TS: `src/worksheet/chart/chart.ts` plus worksheet collection in `src/core/worksheet.ts`

## Coverage Table (Key Worksheet Subsystems)

Status meanings:

- Full: feature exists with close-enough behavior and shape
- Partial: feature exists but differs materially (API, behavior, storage model, or missing options)
- Missing: feature not present in TS worksheet API/model

| Subsystem | PHP reference | TS reference | Status | Notes |
|---|---|---|---|---|
| Cell storage / access | `php-src/src/PhpSpreadsheet/Worksheet/Worksheet.php` | `src/core/worksheet.ts`, `src/core/cell-collection.ts`, `src/core/cell.ts` | Partial | Both are sparse collections and create cells lazily; PHP cell collection has the "one active cell" caching warning, TS returns retained `Cell` instances and later provides `disconnectCells()` to detach them. |
| Setting values / explicit types | `php-src/src/PhpSpreadsheet/Worksheet/Worksheet.php` | `src/core/worksheet.ts` | Partial | PHP supports `setCellValue(...)` plus `setCellValueExplicit(...)`; TS `setCellValue(...)` exists but there is no explicit-type setter at worksheet level. |
| Styles (supervisor pattern) | `php-src/src/PhpSpreadsheet/Worksheet/Worksheet.php` | `src/core/worksheet.ts` | Partial | Both route `getStyle(...)` via the workbook's supervisor; PHP accepts many coordinate types and strips `$`, TS accepts a string and sets selected cells before returning the supervisor. |
| Row/column dimensions | `php-src/src/PhpSpreadsheet/Worksheet/Worksheet.php`, `php-src/src/PhpSpreadsheet/Worksheet/RowDimension.php`, `php-src/src/PhpSpreadsheet/Worksheet/ColumnDimension.php` | `src/core/worksheet.ts`, `src/worksheet/row-dimension.ts`, `src/worksheet/column-dimension.ts` | Partial | TS has default row/col dimensions and per-row/per-column maps; PHP also has caching impacts (highest row/column) and additional helpers like `getRowStyle`/`getColumnStyle`. |
| Merge cells | `php-src/src/PhpSpreadsheet/Worksheet/Worksheet.php` | `src/core/worksheet.ts` | Partial | TS tracks merged ranges and blanks out other cells unless `HIDE`; PHP supports multiple merge behaviors including `MERGE` (concatenate content into top-left) and has more edge-case handling around iterating the merge range. |
| Conditional formatting | `php-src/src/PhpSpreadsheet/Worksheet/Worksheet.php` | `src/core/worksheet.ts` | Partial | TS stores a `Map<string, Conditional[]>` keyed by uppercase range string; PHP supports more complex lookup (single cell vs range, union/intersection resolution, priority ordering). |
| Data validations | `php-src/src/PhpSpreadsheet/Worksheet/Worksheet.php` | `src/core/worksheet.ts` | Partial | TS stores validations per coordinate (single-cell key); PHP allows keys that can include ranges and multiple cells/ranges. |
| Comments | `php-src/src/PhpSpreadsheet/Worksheet/Worksheet.php` | `src/core/worksheet.ts`, `src/core/comment.ts` | Partial | TS stores classic comments keyed by A1 (no `$`, no ranges) and enforces this with normalization; PHP supports worksheet comment collection and a broader set of worksheet operations around them. |
| AutoFilter model + evaluation | `php-src/src/PhpSpreadsheet/Worksheet/AutoFilter.php` | `src/worksheet/auto-filter.ts` | Partial | Both model a range + per-column rules and can `showHideRows()`; TS implements filtering and an auto-extend behavior for single-row ranges within `showHideRows()`, while PHP also has `setRangeToMaxRow()` and uses row iterators for auto-extend. |
| Tables | `php-src/src/PhpSpreadsheet/Worksheet/Table.php` | `src/worksheet/table.ts` | Partial | TS table model is minimal (name/range/columns/header/totals); PHP table supports style, structured ref updates, duplicate name validation across workbook, allowFilter, integrated AutoFilter, and deep clone behavior. |
| Page setup / margins | `php-src/src/PhpSpreadsheet/Worksheet/PageSetup.php`, `php-src/src/PhpSpreadsheet/Worksheet/PageMargins.php` | `src/worksheet/page-setup.ts`, `src/worksheet/page-margins.ts` | Partial | TS covers many PageSetup fields (paper size/orientation/scale/fit, repeat rows/cols, print area, first page number) and PageMargins; PHP includes additional print-related worksheet-level flags and behaviors. |
| Header/footer | `php-src/src/PhpSpreadsheet/Worksheet/HeaderFooter.php`, `php-src/src/PhpSpreadsheet/Worksheet/Worksheet.php` | (none) | Missing | PHP exposes `getHeaderFooter()`/`setHeaderFooter(...)`; TS worksheet does not model header/footer. |
| Sheet view / panes / freeze | `php-src/src/PhpSpreadsheet/Worksheet/Worksheet.php`, `php-src/src/PhpSpreadsheet/Worksheet/SheetView.php`, `php-src/src/PhpSpreadsheet/Worksheet/Pane.php` | `src/core/worksheet.ts`, `src/worksheet/sheet-view.ts`, `src/worksheet/pane.ts` | Partial | TS supports freeze panes and a `SheetView` with view types and zoom scales; PHP has more sheet-view related properties and integrates with print/page break preview modes more broadly. |
| Charts | `php-src/src/PhpSpreadsheet/Worksheet/Worksheet.php` | `src/core/worksheet.ts`, `src/worksheet/chart/chart.ts` | Partial | Both have chart collections; TS enforces single-worksheet ownership (throws if already assigned), and provides add/remove; PHP also exposes chart count/index/name helpers. |
| Drawings | `php-src/src/PhpSpreadsheet/Worksheet/Worksheet.php`, `php-src/src/PhpSpreadsheet/Worksheet/BaseDrawing.php` | `src/core/worksheet.ts`, `src/worksheet/drawing/base-drawing.ts`, `src/worksheet/drawing/drawing.ts`, `src/worksheet/drawing/shadow.ts` | Partial | TS has a single drawing collection and minimal BaseDrawing; PHP has both drawing collection and in-cell drawing collection and a richer drawing surface. |
| Structural edits (insert/remove rows/cols) | `php-src/src/PhpSpreadsheet/Worksheet/Worksheet.php`, `php-src/src/PhpSpreadsheet/ReferenceHelper.php` | `src/core/worksheet.ts` | Partial | TS shifts stored cells and adjusts merge ranges and row/col dimensions; PHP updates many more dependent systems (formula refs, named ranges, breaks, validations, conditional formatting, etc.) via ReferenceHelper. |
| Page breaks | `php-src/src/PhpSpreadsheet/Worksheet/PageBreak.php`, `php-src/src/PhpSpreadsheet/Worksheet/Worksheet.php` | (none) | Missing | PHP supports row/column breaks via `setBreak(...)` and break collections; TS does not track breaks. |
| Protection + protected ranges | `php-src/src/PhpSpreadsheet/Worksheet/Protection.php`, `php-src/src/PhpSpreadsheet/Worksheet/ProtectedRange.php`, `php-src/src/PhpSpreadsheet/Worksheet/Worksheet.php` | (none) | Missing | PHP exposes sheet protection and a protected ranges collection; TS worksheet has no protection API/model. |
| Hyperlinks | `php-src/src/PhpSpreadsheet/Worksheet/Worksheet.php` | (worksheet-level missing; drawing has hyperlink) | Missing | PHP has a worksheet hyperlink collection keyed by coordinate; TS does not expose worksheet hyperlinks (drawings can have a `Hyperlink` in `src/worksheet/drawing/base-drawing.ts`). |
| Memory/disposal | `php-src/src/PhpSpreadsheet/Worksheet/Worksheet.php` | `src/core/worksheet.ts` | Partial | Both have `disconnectCells()`; PHP also clears calculation cache for the worksheet in `__destruct()`, TS detaches cells/drawings and clears collections. |

## Major Parity Gaps / Behavioral Differences

### Iterators and iterator-driven features

- PHP uses row/column/cell iterator infrastructure in worksheet logic and related subsystems (e.g. AutoFilter auto-range expansion uses row iteration): `php-src/src/PhpSpreadsheet/Worksheet/Worksheet.php`, `php-src/src/PhpSpreadsheet/Worksheet/AutoFilter.php`.
- TS has no `RowIterator`/`ColumnIterator`/`CellIterator` equivalents at worksheet level; features that depend on iterator semantics are implemented differently or are absent: `src/core/worksheet.ts`.

### Title validation and rename side-effects

- PHP `setTitle($title, $updateFormulaCellReferences = true, $validate = true)` validates characters/length, enforces uniqueness within the workbook (auto-suffixing), and optionally updates formula/named-formula references and calculation cache bookkeeping: `php-src/src/PhpSpreadsheet/Worksheet/Worksheet.php`.
- TS `setTitle(title: string)` is a simple setter with no validation, uniqueness enforcement, or formula-reference updating: `src/core/worksheet.ts`.

### Merge behavior: MERGE content behavior missing

- PHP defines `MERGE_CELL_CONTENT_MERGE` behavior, which merges/concatenates formatted values into the top-left cell (in addition to EMPTY and HIDE behaviors): `php-src/src/PhpSpreadsheet/Worksheet/Worksheet.php`.
- TS defines `MERGE_CELL_CONTENT_MERGE` constant but currently does not implement the merge-content behavior; it only blanks cells (unless HIDE): `src/core/worksheet.ts`.

### Exporting ranges: number formatting and API surface

- PHP `rangeToArray` can apply number formatting (via `NumberFormat`) and has additional helpers like `rangesToArray(...)` and `rangeToArrayYieldRows(...)`: `php-src/src/PhpSpreadsheet/Worksheet/Worksheet.php`.
- TS `rangeToArray(...)` accepts a `formatData` flag but explicitly ignores it (TODO) and only implements `rangeToArray` + `toArray`: `src/core/worksheet.ts`.

### Printing: header/footer and page breaks

- PHP worksheet includes header/footer (`getHeaderFooter`) and page break collections (`setBreak`, `getRowBreaks`, `getColumnBreaks`): `php-src/src/PhpSpreadsheet/Worksheet/Worksheet.php`, `php-src/src/PhpSpreadsheet/Worksheet/HeaderFooter.php`, `php-src/src/PhpSpreadsheet/Worksheet/PageBreak.php`.
- TS worksheet models page setup and margins, but does not model header/footer or breaks: `src/core/worksheet.ts`, `src/worksheet/page-setup.ts`, `src/worksheet/page-margins.ts`.

### Protection and protected ranges

- PHP has worksheet protection settings and per-range protection (`ProtectedRange`): `php-src/src/PhpSpreadsheet/Worksheet/Protection.php`, `php-src/src/PhpSpreadsheet/Worksheet/ProtectedRange.php`, `php-src/src/PhpSpreadsheet/Worksheet/Worksheet.php`.
- TS worksheet has no protection API/model; only style-level protection exists as part of the style system (`src/style/protection.ts`), which is not equivalent to worksheet protection.

### Tables are significantly simplified in TS

- PHP tables are workbook-aware (duplicate name checks), can update structured references in formulas, and have styling/AutoFilter integration: `php-src/src/PhpSpreadsheet/Worksheet/Table.php`.
- TS tables are a minimal model without those behaviors and do not integrate with worksheet AutoFilter beyond being stored on the worksheet: `src/worksheet/table.ts`, `src/core/worksheet.ts`.

### Drawings: in-cell drawings and richer model missing

- PHP supports both a drawing collection and an in-cell drawing collection on the worksheet: `php-src/src/PhpSpreadsheet/Worksheet/Worksheet.php`.
- TS has a single drawing collection and a smaller BaseDrawing surface (coordinates/offsets/size/hyperlink): `src/core/worksheet.ts`, `src/worksheet/drawing/base-drawing.ts`.

## Memory/Disposal Parity Notes

- PHP
  - `disconnectCells()` unsets worksheet cells and detaches the worksheet from the parent workbook: `php-src/src/PhpSpreadsheet/Worksheet/Worksheet.php`.
  - `__destruct()` additionally clears calculation cache for the worksheet name and unsets large collections (dimensions, tables, drawings, charts, autofilter): `php-src/src/PhpSpreadsheet/Worksheet/Worksheet.php`.
- TS
  - `disconnectCells()` detaches retained `Cell` instances (breaks `Cell` <-> `Worksheet` cycles), clears the cell collection, detaches AutoFilter parent, clears tables, detaches drawings, and clears the drawing collection: `src/core/worksheet.ts`.
  - `garbageCollect()` exists but is currently a no-op: `src/core/worksheet.ts`.

## Next Steps (Parity Work Items)

Suggested follow-ups to close major gaps (no code changes in this doc):

1) Implement worksheet title validation + uniqueness + rename side-effects similar to PHP `setTitle(...)`: `php-src/src/PhpSpreadsheet/Worksheet/Worksheet.php` / `src/core/worksheet.ts`.
2) Implement true `MERGE_CELL_CONTENT_MERGE` behavior (concatenate/merge content into upper-left) and align merge edge cases: `php-src/src/PhpSpreadsheet/Worksheet/Worksheet.php` / `src/core/worksheet.ts`.
3) Add iterator infrastructure (row/column/cell iterators) and migrate iterator-dependent logic (AutoFilter auto-range expansion, traversal utilities): `php-src/src/PhpSpreadsheet/Worksheet/AutoFilter.php` / `src/worksheet/auto-filter.ts`.
4) Add header/footer model + worksheet API for it: `php-src/src/PhpSpreadsheet/Worksheet/HeaderFooter.php`.
5) Add page breaks (row/column breaks) and incorporate them into IO and structural edits: `php-src/src/PhpSpreadsheet/Worksheet/PageBreak.php`, `php-src/src/PhpSpreadsheet/Worksheet/Worksheet.php`.
6) Add worksheet protection + protected ranges model: `php-src/src/PhpSpreadsheet/Worksheet/Protection.php`, `php-src/src/PhpSpreadsheet/Worksheet/ProtectedRange.php`.
7) Implement formatting in `rangeToArray(..., formatData=true)` and add `rangesToArray` / yield-row variants: `php-src/src/PhpSpreadsheet/Worksheet/Worksheet.php` / `src/core/worksheet.ts`.
8) Expand TS tables toward PHP parity (validation, workbook-unique names, structured ref updates, style + AutoFilter integration): `php-src/src/PhpSpreadsheet/Worksheet/Table.php` / `src/worksheet/table.ts`.
