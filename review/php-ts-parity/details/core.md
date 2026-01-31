
# Core Parity (PhpSpreadsheet vs TS)

This document focuses on the “core” workbook/cell surface area: `Spreadsheet`, `Cell`, coordinate utilities, defined names, theme, settings, and core hash table/cell storage.

For the generated full maps, see:
- `review/php-ts-parity/modules/_root-map.md`
- `review/php-ts-parity/modules/cell-map.md`
- `review/php-ts-parity/modules/collection-map.md`
- `review/php-ts-parity/modules/document-map.md`
- `review/php-ts-parity/modules/shared-map.md` (shared/helpers frequently used by core)

Note: worksheet-level parity is tracked separately (but some worksheet-owned collections are referenced here): `review/php-ts-parity/details/worksheet.md`.

## Overview And Mapping Notes

High-level mapping of key PHP classes to TS locations:

- `php-src/src/PhpSpreadsheet/Spreadsheet.php` -> `src/core/spreadsheet.ts`
- `php-src/src/PhpSpreadsheet/Worksheet/Worksheet.php` -> `src/core/worksheet.ts` (full worksheet parity: `review/php-ts-parity/details/worksheet.md`)
- `php-src/src/PhpSpreadsheet/Cell/Cell.php` -> `src/core/cell.ts`
- `php-src/src/PhpSpreadsheet/Cell/Coordinate.php` -> `src/utils/coordinate.ts`
- `php-src/src/PhpSpreadsheet/DefinedName.php` -> `src/core/defined-name.ts`
- `php-src/src/PhpSpreadsheet/NamedRange.php` -> `src/core/named-range.ts`
- `php-src/src/PhpSpreadsheet/NamedFormula.php` -> (missing in TS; `_root-map` suggests `src/core/named-formula.ts`)
- `php-src/src/PhpSpreadsheet/Settings.php` -> (missing in TS; `_root-map` suggests `src/core/settings.ts`)
- `php-src/src/PhpSpreadsheet/Theme.php` -> `src/style/theme.ts`
- `php-src/src/PhpSpreadsheet/HashTable.php` -> `src/common/hash-table.ts`

Related core-adjacent building blocks:

- Cell storage: `php-src/src/PhpSpreadsheet/Collection/Cells.php` -> `src/core/cell-collection.ts`
- Document metadata/security: `php-src/src/PhpSpreadsheet/Document/*` -> `src/document/*` (`src/document/properties.ts`, `src/document/security.ts`)
- Value binders:
  - `php-src/src/PhpSpreadsheet/Cell/IValueBinder.php` -> `src/core/i-value-binder.ts`
  - `php-src/src/PhpSpreadsheet/Cell/DefaultValueBinder.php` -> `src/core/default-value-binder.ts`
  - `php-src/src/PhpSpreadsheet/Cell/AdvancedValueBinder.php` -> `src/core/advanced-value-binder.ts`
  - `php-src/src/PhpSpreadsheet/Cell/StringValueBinder.php` -> missing (no TS match)

## Key File Mapping (Focused)

Status definitions:
- implemented: TS has a clear port with the primary public surface present.
- partial: TS exists but misses significant public API and/or behavior.
- missing: no TS implementation.

| PHP file | TS file(s) | Status | Notes |
|---|---|---|---|
| `php-src/src/PhpSpreadsheet/Spreadsheet.php` | `src/core/spreadsheet.ts` | partial | Workbook basics exist; many workbook APIs and behaviors are missing or differ. |
| `php-src/src/PhpSpreadsheet/Cell/Cell.php` | `src/core/cell.ts` | partial | Core value/type/calc exist; many PhpSpreadsheet behaviors (collection binding, ignored errors, formula metadata, more) are missing. |
| `php-src/src/PhpSpreadsheet/Cell/Coordinate.php` | `src/utils/coordinate.ts` | partial | Core conversions exist; validation, ranges (comma), and many helper APIs are missing/different. |
| `php-src/src/PhpSpreadsheet/Cell/DataType.php` | `src/core/cell.ts` | partial | TS has `DataType` constants but lacks `TYPE_STRING2`, `TYPE_ISO_DATE`, `TYPE_DRAWING_IN_CELL`, string/error sanitizers. |
| `php-src/src/PhpSpreadsheet/Cell/DefaultValueBinder.php` | `src/core/default-value-binder.ts` | partial | Numeric/error detection mostly aligned; missing UTF-8 sanitization, formula parser validation, drawings-in-cell, preserveCr. |
| `php-src/src/PhpSpreadsheet/Cell/AdvancedValueBinder.php` | `src/core/advanced-value-binder.ts` | partial | TS has minimal bool/percent/currency; missing locale-aware parsing, date/time/fraction handling, format assignment. |
| `php-src/src/PhpSpreadsheet/Cell/IValueBinder.php` | `src/core/i-value-binder.ts` | implemented | Signature matches. |
| `php-src/src/PhpSpreadsheet/Cell/StringValueBinder.php` | (none) | missing | TS has no equivalent “force string” binder with conversion toggles. |
| `php-src/src/PhpSpreadsheet/Cell/Hyperlink.php` | `src/core/hyperlink.ts` | partial | Basic URL/tooltip exist; missing display/internal detection/hash; TS adds `location` field (not in PHP). |
| `php-src/src/PhpSpreadsheet/Cell/DataValidation.php` | `src/core/data-validation.ts` | partial | Core fields exist; hash code differs (no md5, no class salt). |
| `php-src/src/PhpSpreadsheet/DefinedName.php` | `src/core/defined-name.ts` | partial | TS is a minimal base; missing name/worksheet/scope mutators, formula detection, create/resolve helpers, and rename side-effects. |
| `php-src/src/PhpSpreadsheet/NamedRange.php` | `src/core/named-range.ts` | partial | Constructor constraint matches; missing `getCellsInRange`. |
| `php-src/src/PhpSpreadsheet/NamedFormula.php` | (none) | missing | No `NamedFormula` class in TS. |
| `php-src/src/PhpSpreadsheet/Settings.php` | (none) | missing | No global settings (locale/cache/chart renderer) surface in TS. |
| `php-src/src/PhpSpreadsheet/Theme.php` | `src/style/theme.ts` | partial | Major constants/data present; missing `setThemeColorName(..., Spreadsheet $spreadsheet)` behavior that applies fonts. |
| `php-src/src/PhpSpreadsheet/HashTable.php` | `src/common/hash-table.ts` | partial | Add + index lookup exist; missing remove/clear/getByHashCode/toArray; error semantics differ. |

## Detailed Gaps And Parity Notes

### Spreadsheet (Workbook)

PHP: `php-src/src/PhpSpreadsheet/Spreadsheet.php`
TS: `src/core/spreadsheet.ts`

Missing or materially different public APIs:

- **Sheet lookup/management differences**
  - PHP has `getAllSheets()`; TS does not (`php-src/src/PhpSpreadsheet/Spreadsheet.php`, `src/core/spreadsheet.ts`).
  - PHP `getSheetByName()` is case-insensitive and trims surrounding quotes; TS compares `Worksheet.getTitle()` strictly (`php-src/src/PhpSpreadsheet/Spreadsheet.php`, `src/core/spreadsheet.ts`).
  - PHP has `getSheetByNameOrThrow()`; TS does not (TS throws in some callers but no dedicated method).
  - PHP `addSheet(..., $retitleIfNeeded)` can retitle and also throws on duplicates; TS `addSheet()` currently doesn’t enforce unique sheet titles and doesn’t implement retitle rules (`php-src/src/PhpSpreadsheet/Spreadsheet.php`, `src/core/spreadsheet.ts`).
  - PHP `createSheet(?int $sheetIndex = null)` always creates a new `Worksheet` and relies on addSheet logic; TS `createSheet(title?, index?)` also exists but its signature differs and it doesn’t replicate PHP’s retitle/duplicate protections (`php-src/src/PhpSpreadsheet/Spreadsheet.php`, `src/core/spreadsheet.ts`).
  - PHP `setActiveSheetIndex(int): Worksheet` returns the active sheet; TS `setActiveSheetIndex(index): this` returns the spreadsheet (`php-src/src/PhpSpreadsheet/Spreadsheet.php`, `src/core/spreadsheet.ts`).
  - PHP `setActiveSheetIndexByName(string): Worksheet` returns the selected worksheet; TS returns `this` (`php-src/src/PhpSpreadsheet/Spreadsheet.php`, `src/core/spreadsheet.ts`).
  - PHP `setIndexByName(...)` exists; TS does not (`php-src/src/PhpSpreadsheet/Spreadsheet.php`).
  - PHP `addExternalSheet(...)` exists and remaps XF indices and rebinds parent; TS does not (`php-src/src/PhpSpreadsheet/Spreadsheet.php`).

- **Duplicate worksheet behavior**
  - PHP `duplicateWorksheetByTitle()` clones the entire worksheet object and inserts it adjacent (`php-src/src/PhpSpreadsheet/Spreadsheet.php`).
  - TS `duplicateWorksheetByTitle()` only copies cell values and merge ranges (no row/column dimensions, styles, drawings, charts, tables, etc.) (`src/core/spreadsheet.ts`).

- **Destructor / disconnection semantics**
  - PHP calls `disconnectWorksheets()` from `__destruct()` and also clears calculation engine and XF collections (`php-src/src/PhpSpreadsheet/Spreadsheet.php`).
  - TS exposes `disconnectWorksheets()` but has no destructor equivalent (expected in JS); also TS resets `#activeSheetIndex` and ensures a worksheet exists in `removeSheetByIndex()` (behavioral divergence).

- **Workbook ID / metadata**
  - PHP includes a `uniqueID` + `getID()` (deprecated) (`php-src/src/PhpSpreadsheet/Spreadsheet.php`).
  - TS has no workbook ID (`src/core/spreadsheet.ts`).

- **Defined names / named ranges**
  - PHP has richer management APIs (add/remove/update on rename, formula updates via `ReferenceHelper`) (`php-src/src/PhpSpreadsheet/DefinedName.php`, `php-src/src/PhpSpreadsheet/Spreadsheet.php`).
  - TS has `getDefinedName()` / `addDefinedName()` and `getNamedRange()` / `addNamedRange()` but lacks remove/update/rename integration and named formula support (`src/core/spreadsheet.ts`, `src/core/defined-name.ts`).

Behavioral diffs worth calling out explicitly:

- TS `getSheetByCodeName()` is implemented as a fallback to title; PHP has a dedicated codeName property on Worksheet and resolves via that (`src/core/spreadsheet.ts`).
- TS `removeSheetByIndex()` ensures at least one worksheet remains; PHP allows empty workbook sheet collections (it does not auto-add a sheet) (`src/core/spreadsheet.ts`, `php-src/src/PhpSpreadsheet/Spreadsheet.php`).

### Cell

PHP: `php-src/src/PhpSpreadsheet/Cell/Cell.php`
TS: `src/core/cell.ts`

Missing or materially different public APIs:

- **Collection binding model**
  - PHP `Cell` is bound to `Collection\Cells` and derives coordinate/row/column from the collection cursor (`getCurrentCoordinate`, etc.) (`php-src/src/PhpSpreadsheet/Cell/Cell.php`).
  - TS `Cell` stores `(row, column)` internally as 0-indexed numbers and computes `A1` on demand (`src/core/cell.ts`).
  - PHP exposes `updateInCollection()`, `attach()`, and uses `detach()` to drop parent collection; TS uses `detach()` but has no `updateInCollection()` and does not model collection cursor semantics.

- **Formula metadata and ignored errors**
  - PHP has formula attributes (`$formulaAttributes`) and `IgnoredErrors` (`php-src/src/PhpSpreadsheet/Cell/Cell.php`, `php-src/src/PhpSpreadsheet/Cell/IgnoredErrors.php`).
  - TS has no equivalent (no `IgnoredErrors`, no `getIgnoredErrors()`, no formula attribute API) (`src/core/cell.ts`).

- **Value conversion helpers**
  - PHP includes `getValueString()` and `getCalculatedValueString()` (and much richer formatting behavior) (`php-src/src/PhpSpreadsheet/Cell/Cell.php`).
  - TS only has `getValue()`, `getCalculatedValue()`, and a simplified `getFormattedValue()` that delegates to TS number-formatting (`src/core/cell.ts`).

- **Hyperlink behavior**
  - PHP tracks hyperlink presence/clearing behavior when setting values (`$hadHyperlink` / `clearHyperlink()` patterns) (`php-src/src/PhpSpreadsheet/Cell/Cell.php`).
  - TS uses a lazily-created `Hyperlink` instance (`getHyperlink()`) and a `hasHyperlink()` check but doesn’t mirror PHP’s hyperlink/value interaction semantics (`src/core/cell.ts`).

Behavioral diffs:

- TS caches calculated values in `#calculatedValue` and computes via `Calculation.calculateFormula` on first access for formula cells (`src/core/cell.ts`). PHP also caches, but PhpSpreadsheet also supports “last calculated by Excel” behavior and has broader error/locale handling.
- TS `isLocked()` / `isHiddenOnFormulaBar()` is implemented in terms of style `Protection` flags; PHP has a more complete protection model but the core intent matches (`src/core/cell.ts`).

### Coordinate Utilities

PHP: `php-src/src/PhpSpreadsheet/Cell/Coordinate.php`
TS: `src/utils/coordinate.ts`

Major gaps / behavior differences:

- **Validation and error handling**
  - PHP throws on invalid coordinates and on invalid ranges passed to single-coordinate methods (`coordinateFromString`, `absoluteCoordinate`, etc.) (`php-src/src/PhpSpreadsheet/Cell/Coordinate.php`).
  - TS frequently returns defaults on invalid input (e.g. `indexesFromString` falls back to `[1, 1]`) and only throws in a few cases (`src/utils/coordinate.ts`).

- **Range detection**
  - PHP `coordinateIsRange()` is true for `:` *or* `,` (union) (`php-src/src/PhpSpreadsheet/Cell/Coordinate.php`).
  - TS `coordinateIsRange()` only checks `:` (comma unions are treated as “not a range” by this helper) (`src/utils/coordinate.ts`).

- **Absolute references**
  - PHP supports `absoluteReference()` which accepts row-only (`"1"`), column-only (`"A"`), or full cell (`"A1"`), and preserves/quotes worksheet titles correctly via worksheet helpers (`php-src/src/PhpSpreadsheet/Cell/Coordinate.php`).
  - TS only provides `absoluteCoordinate()` and it is “best-effort” for worksheet prefixes (no proper quoting/escaping); it also doesn’t support row-only/column-only inputs (`src/utils/coordinate.ts`).

- **Whole-row/whole-column ranges and advanced helpers**
  - PHP `rangeBoundaries()` supports whole-row (`"2:3"`) and whole-column (`"B:C"`) ranges and has additional helpers like `rangeDimension`, `getRangeBoundaries`, `coordinateIsInsideRange`, `extractAllCellReferencesInRange` (`php-src/src/PhpSpreadsheet/Cell/Coordinate.php`).
  - TS `rangeBoundaries()` and `splitRange()` only support simple `A1:B2` style ranges and don’t implement the broader helper surface (`src/utils/coordinate.ts`).

- **Column index limits**
  - PHP enforces column string length <= 3 and throws otherwise (`php-src/src/PhpSpreadsheet/Cell/Coordinate.php`).
  - TS will convert arbitrary-length strings (no max) (`src/utils/coordinate.ts`).

### DataType

PHP: `php-src/src/PhpSpreadsheet/Cell/DataType.php`
TS: `src/core/cell.ts`

Gaps:

- TS does not model `TYPE_STRING2` (`'str'`) normalization, `TYPE_ISO_DATE` (`'d'`), or `TYPE_DRAWING_IN_CELL` (`'drawingCell'`) (`php-src/src/PhpSpreadsheet/Cell/DataType.php`, `src/core/cell.ts`).
- TS has no equivalent of `DataType::checkString()` (max length 32767 + CR/LF normalization) or `DataType::checkErrorCode()` / `getErrorCodes()` (`php-src/src/PhpSpreadsheet/Cell/DataType.php`).

### Value Binders

PHP: `php-src/src/PhpSpreadsheet/Cell/DefaultValueBinder.php`, `php-src/src/PhpSpreadsheet/Cell/AdvancedValueBinder.php`, `php-src/src/PhpSpreadsheet/Cell/StringValueBinder.php`
TS: `src/core/default-value-binder.ts`, `src/core/advanced-value-binder.ts`, (no StringValueBinder)

Gaps and behavior differences:

- PHP DefaultValueBinder sanitizes UTF-8, supports `DateTimeInterface`, `Stringable`, and `BaseDrawing` (in-cell drawings), and validates formulas via the parser before classifying them as formula (`php-src/src/PhpSpreadsheet/Cell/DefaultValueBinder.php`).
- TS DefaultValueBinder is a reduced port: it supports `RichText`, basic numeric strings, and error codes, but does not sanitize UTF-8, does not validate formulas before setting `TYPE_FORMULA`, and has no in-cell drawing binding (`src/core/default-value-binder.ts`).
- PHP AdvancedValueBinder performs locale-aware boolean parsing, fractions, percentages/currency with number format assignment, times, dates/datetimes (to Excel serials), and wrap-text on newline (`php-src/src/PhpSpreadsheet/Cell/AdvancedValueBinder.php`).
- TS AdvancedValueBinder currently only handles basic TRUE/FALSE, percentage strings, and a very basic USD `$` currency parse; it does not set number formats or handle dates/times/fractions/locale (`src/core/advanced-value-binder.ts`).
- PHP StringValueBinder exists (configurable conversions + ignored errors integration); TS has no equivalent (`php-src/src/PhpSpreadsheet/Cell/StringValueBinder.php`).

### Hyperlink

PHP: `php-src/src/PhpSpreadsheet/Cell/Hyperlink.php`
TS: `src/core/hyperlink.ts`

Gaps / diffs:

- PHP supports `display` text, `isInternal()`, `getTypeHyperlink()`, and `getHashCode()` (`php-src/src/PhpSpreadsheet/Cell/Hyperlink.php`).
- TS supports `url`, `tooltip`, and a TS-only `location` field, plus `isEmpty()`; it does not implement PHP’s display/internal/hash behavior (`src/core/hyperlink.ts`).

### DataValidation

PHP: `php-src/src/PhpSpreadsheet/Cell/DataValidation.php`
TS: `src/core/data-validation.ts`

Gaps / diffs:

- Core fields and operator/type constants largely match.
- Hashing differs:
  - PHP `getHashCode()` returns an md5 and includes `__CLASS__` in the hash salt (`php-src/src/PhpSpreadsheet/Cell/DataValidation.php`).
  - TS `getHashCode()` returns a raw concatenated string without class salting or md5 (`src/core/data-validation.ts`).

### DefinedName / NamedRange / NamedFormula

PHP: `php-src/src/PhpSpreadsheet/DefinedName.php`, `php-src/src/PhpSpreadsheet/NamedRange.php`, `php-src/src/PhpSpreadsheet/NamedFormula.php`
TS: `src/core/defined-name.ts`, `src/core/named-range.ts`, (no `NamedFormula`)

Missing or materially different APIs:

- PHP `DefinedName` supports `setName`, `setWorksheet`, `setLocalOnly`, `setScope`, `createInstance`, `testIfFormula`, `resolveName`, deep cloning, and (importantly) rename side effects into the parent `Spreadsheet` + `ReferenceHelper` (`php-src/src/PhpSpreadsheet/DefinedName.php`).
- TS `DefinedName` is an abstract minimal base with `getName`, `getValue`, `setValue`, `getWorksheet`, `getLocalOnly`, `getScope`, and `isFormula()` implemented as `value.startsWith('=')` (`src/core/defined-name.ts`).
- PHP formula detection (`testIfFormula`) treats numeric values and many invalid range characters as formulas; TS does not replicate that logic (`php-src/src/PhpSpreadsheet/DefinedName.php`, `src/core/defined-name.ts`).
- PHP `NamedRange::getCellsInRange()` exists (extracts all cell references); TS has no equivalent (`php-src/src/PhpSpreadsheet/NamedRange.php`, `src/core/named-range.ts`).
- PHP `NamedFormula` exists; TS does not (`php-src/src/PhpSpreadsheet/NamedFormula.php`).

### Settings (Global)

PHP: `php-src/src/PhpSpreadsheet/Settings.php`
TS: missing

PHP provides global/static knobs that influence core behavior:

- Locale binding for calculation translation: `Settings::setLocale()` / `Settings::getLocale()` (`php-src/src/PhpSpreadsheet/Settings.php`).
- Cell collection caching strategy via PSR-16 cache: `Settings::setCache()` / `Settings::getCache()` and SimpleCache version switching (`php-src/src/PhpSpreadsheet/Settings.php`).
- Chart renderer selection (`Settings::setChartRenderer`) (less “core”, but Settings is the entry point).

TS currently has no equivalent global settings surface (`review/php-ts-parity/modules/_root-map.md` suggests a future `src/core/settings.ts`).

### Theme

PHP: `php-src/src/PhpSpreadsheet/Theme.php`
TS: `src/style/theme.ts`

Notes:

- Core data/constants appear aligned (color schemes and font substitution maps exist in TS) (`php-src/src/PhpSpreadsheet/Theme.php`, `src/style/theme.ts`).
- API shape differences:
  - PHP `setThemeColorName(string $name, ?array $themeColors = null, ?Spreadsheet $spreadsheet = null)` can apply theme fonts to a provided spreadsheet default style (`php-src/src/PhpSpreadsheet/Theme.php`).
  - TS `setThemeColorName(name, themeColors?)` does not accept a `Spreadsheet` parameter and does not apply font changes downstream (`src/style/theme.ts`).

### HashTable

PHP: `php-src/src/PhpSpreadsheet/HashTable.php`
TS: `src/common/hash-table.ts`

Gaps / diffs:

- Missing APIs in TS: `remove`, `clear`, `getByHashCode`, `toArray`, deep clone (`php-src/src/PhpSpreadsheet/HashTable.php`, `src/common/hash-table.ts`).
- Error/return semantics differ:
  - PHP `getIndexForHashCode` returns `false|int` (false if missing).
  - TS `getIndexForHashCode` throws if missing.

## Recent Parity Wins Touching Core

These are “core-adjacent” improvements that land in core models and enable IO parity:

- Classic comments model + worksheet storage:
  - `src/core/comment.ts`
  - `src/core/cell.ts` (comment accessors)
  - `src/core/worksheet.ts` (comment map + normalization)
- Drawings and charts as worksheet-owned sparse collections:
  - `src/core/worksheet.ts` (`#drawingCollection`, `#chartCollection`, add/remove)

## Actionable Next Steps (Short List)

1. Implement missing core surface:
   - `NamedFormula` (`php-src/src/PhpSpreadsheet/NamedFormula.php` parity) and wire into `DefinedName.createInstance` equivalent (`src/core/defined-name.ts`, `src/core/spreadsheet.ts`).
   - `Settings` (locale + cache abstraction at minimum) (`php-src/src/PhpSpreadsheet/Settings.php`).
2. Close high-impact behavior gaps:
   - Workbook sheet name semantics (case-insensitive name lookup + duplicate name prevention + retitleIfNeeded behavior) (`php-src/src/PhpSpreadsheet/Spreadsheet.php`, `src/core/spreadsheet.ts`).
   - Worksheet duplication parity (clone styles/dimensions/drawings/charts/tables, not just values/merges) (`php-src/src/PhpSpreadsheet/Spreadsheet.php`, `src/core/spreadsheet.ts`).
3. Expand coordinate/data type utilities to match PhpSpreadsheet contracts:
   - `Coordinate.coordinateIsRange` should treat comma unions as ranges and match PHP’s error behavior.
   - Add `absoluteReference`, whole-row/whole-column range handling, and strict validation behavior where relied upon.
   - Add `DataType.checkString/checkErrorCode/getErrorCodes` equivalents.
4. Align hash code behaviors where used for deduplication:
   - Bring `DataValidation.getHashCode()` closer to PHP (md5 + class salt) or document intentional divergence.
   - Fill out `HashTable` APIs and error semantics.
