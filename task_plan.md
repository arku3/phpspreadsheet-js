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
- [x] Charts: add `Layout`, `Properties`, `AxisText` and align chart/axis/data-series/legend/title APIs.
- [x] AutoFilter/HeaderFooter: align range input types, add image APIs, clone behavior, return types.

## Phase 3: Style Parity
- [ ] Implement missing NumberFormat formatter/wizard classes and built-in registry.
  - [x] Align `NumberFormat` built-in registry for key Excel/PHP ids (`14`, `22`, `47`) and system date/time token conversion.
  - [x] Expand `toFormattedString` runtime handling for sections, text `@`, percentages, fractions, scientific formats, scaling commas, quoted literals, and date/time paths.
  - [x] Add more PHP-like date/time parity for textual month tokens, uppercase masks, elapsed `[hh]/[mm]/[ss]`, fractional-second rounding, early-1900 serial handling, callback color propagation, and `lessFloatPrecision`.
  - [x] Preserve currency tokens like `[$USD-409]` and `[$€]` during numeric formatting.
  - [x] Align more locale-specific built-in format ids (`50`, `53`, `55`, `59`-`62`, `67`-`70`) with PHP.
  - [x] Support PHP-like complex numeric masks with embedded separators such as `000-000`.
  - [x] Resolve `[Color n]` formatter tags to BIFF8 palette colors for callback formatting.
  - [x] Preserve `?` placeholder spacing in numeric and percentage masks.
  - [x] Extend complex-mask parity for multi-block decimal formats like `000-00-00.00-0` and `000\.00\.00\.00\.00`.
  - [x] Add PHP-like decimal/thousands separator overrides for formatted numeric output.
  - [x] Fix complex-mask spillover for single-block decimal submasks and scientific-to-plain-string cases.
  - [x] Cover more PHP fixture complex masks such as `(000) 0-0000-000`, `0000:00:00`, and `0000:00.00`.
  - [x] Match more PHP scientific complex-mask fixtures, including integer-with-decimal-mask scaling and the >= `1e18` plain-string fallback.
  - [x] Preserve quoted characters and escaped quotes in text `@` substitution paths.
  - [x] Ignore quoted numeric literals when deriving decimal precision for prefixed/suffixed number masks.
  - [x] Preserve PHP-like accounting spacing for `_`/`*` patterns, including zero `??` placeholders and text-section trimming.
  - [x] Match PHP section-selection defaults when only some sections define conditions, and accept compact `[color10]` formatter tags.
  - [x] Preserve trailing underscore spacing in quoted literal numeric masks like `$#,##0.00_`.
  - [x] Use PHP-like half-up rounding for simple numeric masks and keep leading zeroes when the mask requires `0`.
  - [x] Preserve zero-padded percentage placeholders and keep negative percentage parentheses around the `%` sign.
  - [x] Match PHP negative sign placement for currency-style masks, inserting the sign after leading currency/literal prefixes.
  - [x] Trim `General` scientific notation like PHP while keeping a single decimal digit for whole mantissas.
  - [x] Match PHP optional grouping and optional integer placeholder behavior for masks like `?,???` and `$?.00`.
  - [x] Ignore quoted literals when detecting date formats and splice formatted numeric tokens back into literal-prefix masks.
  - [x] Follow PhpSpreadsheet's current behavior of ignoring four-section text formatting and returning raw text unless a single-section `@` mask is used.
  - [x] Lock empty-section behavior and issue-specific HUF / dollar-sign regressions with NumberFormat tests.
  - [ ] Finish remaining NumberFormat parity gaps in formatter edge cases and helper-class coverage.
- [ ] Align conditional formatting (rule evaluation, color scale/data bar/icon set APIs, wizard factories, cell matcher).
  - [x] Fix wizard factory parity for blanks/errors, quoted formula reference adjustment, and expression reverse-adjust round trips.
  - [x] Implement relative reference/value substitution in `CellMatcher` while preserving quoted strings.
  - [x] Preserve conditional-style nullable font defaults so multiple matched rules merge without wiping earlier font attributes.
  - [x] Sort relative range-operator operands numerically in `CellMatcher` for PHP-like `between` evaluation.
  - [x] Evaluate contains/begins/ends text rules directly in `CellMatcher` instead of relying on unsupported `SEARCH(...)` engine paths.
  - [x] Evaluate blank / not-blank runtime rules directly in `CellMatcher` instead of relying on unsupported `LEN(TRIM(...))` engine paths.
  - [x] Evaluate contains-errors / not-contains-errors runtime rules directly in `CellMatcher` instead of relying on unsupported `ISERROR(...)` engine paths.
  - [x] Evaluate core time-period runtime rules (`today`, `yesterday`, `tomorrow`, `last7Days`) directly in `CellMatcher` instead of relying on unsupported `TODAY()` expression paths.
  - [x] Evaluate week/month time-period runtime rules (`lastWeek`, `thisWeek`, `nextWeek`, `lastMonth`, `thisMonth`, `nextMonth`) directly in `CellMatcher`.
  - [ ] Continue conditional-formatting runtime evaluation and assessor parity.
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
