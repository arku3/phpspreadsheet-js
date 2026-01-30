# Parity Check: TypeScript vs PHP

This document summarizes the parity check between the TypeScript implementation in `src/` and the original PHP implementation in `php-src/src/PhpSpreadsheet/`.

## 1. Style Module (`src/style/`)

| TS File | PHP Counterpart | Parity Status | Key Differences / Notes |
|---------|-----------------|---------------|-------------------------|
| `color.ts` | `Style/Color.php` | Partial | Missing `setHyperlinkTheme`, `hasChanged` state tracking. `setTint` was removed for parity with I/O behavior but PHP still has the property (it's resolved during export). |
| `font.ts` | `Style/Font.php` | Partial | Missing chart/theme properties: Latin, EastAsian, ComplexScript, StrikeType, Cap, BaseLine. |
| `fill.ts` | `Style/Fill.php` | Good | Logic generally aligned. |
| `border.ts` | `Style/Border.php` | Good | Logic generally aligned. |
| `borders.ts` | `Style/Borders.php` | Good | Logic generally aligned. |
| `alignment.ts` | `Style/Alignment.php` | Partial | Missing `HORIZONTAL_ALIGNMENT_FOR_XLSX` mapping and rotation range validation. |
| `number-format.ts` | `Style/NumberFormat.php` | Missing Logic | Missing `toFormattedString` and comprehensive built-in format mapping. |
| `protection.ts` | `Style/Protection.php` | Good | Logic generally aligned. |
| `style.ts` | `Style/Style.php` | Partial | `applyFromArray` implementation differs from PHP's XF index caching strategy. |
| `supervisor.ts` | `Style/Supervisor.php` | Good | Logic generally aligned. |

### Style Detail Findings

#### Font.ts
- **Missing Properties**: Chart titles and theme-specific properties (Latin, EastAsian, ComplexScript).
- **StrikeType**: PHP uses constants for different strike types, TS might only support boolean.

#### NumberFormat.ts
- **Formatting Engine**: PHP contains a massive `toFormattedString` method that handles the actual rendering of values. TS is currently a data holder without the formatting logic.

#### Alignment.ts
- **Validation**: PHP validates rotation ranges (-90 to 90 or 255). TS needs to ensure parity here.

#### General
- **Visibility**: TS uses `#private` fields for true encapsulation, while PHP uses `protected`. This is a conscious architectural choice but limits inheritance-based extensions compared to PHP.

## 2. Core Module (`src/core/`)

**Files:** `src/core/spreadsheet.ts` vs `Spreadsheet.php`

### Missing Public Methods in TS
- `__clone`, `copy` (Deep cloning)
- `addExternalSheet`, `duplicateWorksheetByTitle`
- `setActiveSheetIndex`, `setActiveSheetIndexByName` (TS has private `#activeSheetIndex` but no public setter)
- `removeSheetByIndex`
- `getSheetNames`, `getSheetByCodeName`, `sheetNameExists`, `sheetCodeNameExists`
- `getWorksheetIterator`
- `getCellXfExists`, `removeCellStyleXfByIndex`
- `getMacrosCode`, `hasMacros`, `setHasMacros`, etc. (VBA/Macros support)
- `getRibbonXMLData`, `hasRibbon`, etc. (Ribbon support)
- `disconnectWorksheets` (Disposal logic)

### Method Signature Differences
- `createSheet(title?: string, index?: number)` in TS vs `createSheet(?int $sheetIndex = null)` in PHP. PHP's version doesn't take a title directly in `createSheet`.
- `addSheet(worksheet: Worksheet, index?: number)` in TS vs `addSheet(Worksheet $pSheet, ?int $sheetIndex = null)` in PHP.

### Logic Discrepancies
- **Active Sheet:** TS lacks `setActiveSheetIndex`. PHP version handles the logic of ensuring an active sheet exists and updating indices.
- **Garbage Collection:** TS implementation of `garbageCollect` is partially implemented but missing some edge cases compared to PHP (e.g., handling of `null` Xf indices).

## 3. I/O Module (`src/io/`)

### XLSX Writer Parity

| Feature / Part | PHP Implementation | TypeScript Implementation | Status |
| :--- | :--- | :--- | :--- |
| **Charts** | `Chart.php` | Missing | ❌ |
| **Drawings / Images** | `Drawing.php` | Missing | ❌ |
| **Comments / VML** | `Comments.php` | Missing | ❌ |
| **Tables** | `Table.php` | Missing | ❌ |
| **Defined Names** | `DefinedNames.php` | Partial (in Workbook) | ⚠️ |
| **Macros / VBA** | `RelsVBA.php` | Missing | ❌ |
| **Rich Data** | `RichDataDrawing.php` | Missing | ❌ |

### Key Discrepancies (Writer)
- **Shared Strings**: Missing control character sanitization (`controlCharacterPHP2OOXML`).
- **Relationships**: Relationship IDs (`rId`) are hardcoded in `Workbook.ts`, making it fragile for extension.
- **Styles**: `cellStyleXfs` is limited to a single hardcoded entry.
- **Rich Text**: Inconsistent support for font properties between `Styles` and `StringTable`.

## 4. Calculation Module (`src/calculation/`)

| Feature | Parity Level | Notes |
| :--- | :--- | :--- |
| **Tokenizer** | 100% | Direct port of the state machine logic. |
| **Parser** | 95% | Handles all major Excel syntax; R1C1 support is limited. |
| **Branch Pruning** | 100% | Lazy IF evaluation is fully implemented. |
| **Cache** | 100% | Identical caching strategy and control methods. |
| **Functions** | 95% | 120+ functions implemented across all major categories. |
| **Table Refs** | 90% | Most common structured reference syntax supported. |
| **Errors** | 100% | All standard Excel error codes and circularity detection present. |

### Detail Findings (Calculation)
- **Functions**: ✅ **COMPLETE** - All major categories implemented:
  - DateTimeExcel: 14 functions (TODAY, NOW, DATE, etc.)
  - Financial: 7 functions (FV, PV, PMT, NPV, IRR, etc.)
  - Engineering: 13 functions (COMPLEX, CONVERT, DEC2BIN, etc.)
  - Statistical: 25+ functions (STDEV, MEDIAN, PERCENTILE, etc.)
  - Conditional: 8 functions (COUNTIF, SUMIF, AVERAGEIFS, etc.)
  - Core: 50+ functions (Math, Logic, Text, Lookup)
  - **Total: ~120+ functions**
- **R1C1**: Limited support (lower priority feature).
- **Registry**: TS uses a modern registry pattern with full category support.

**Files:** `src/core/worksheet.ts` vs `Worksheet/Worksheet.php`

### Missing Public Methods in TS
- `cellExists`, `dataValidationExists`, `hyperlinkExists`, `conditionalStylesExists`
- `getHighestRow`, `getHighestColumn`, `getHighestDataRow`, `getHighestDataColumn` (Crucial for iteration)
- `toArray`, `fromArray`, `rangeToArray`
- `insertNewRowBefore`, `insertNewColumnBefore`, `removeRow`, `removeColumn`
- `copyCells`, `duplicateStyle`, `duplicateConditionalStyle`
- `getCodeName`, `setCodeName`
- `getHeaderFooter`, `getProtection`, `getHyperlink`
- `getColumnIterator`, `getRowIterator`
- `disconnectCells`

### Method Signature Differences
- `setCellValue(coordinate: string, value: any)` in TS returns `Worksheet` (fluent), while PHP version also handles value binding but returns `self`.
- `mergeCells(range: string, behaviour: string)` in TS. PHP version `mergeCells($range, $behaviour = self::MERGE_CELL_CONTENT_EMPTY)` is similar, but PHP also has `unmergeCells`.

### Logic Discrepancies
- **Coordinate Handling:** TS uses `Coordinate` utility for many things that PHP might do inline or via different helpers.
- **Sparse Grid:** Both use sparse storage, but PHP's `CellCollection` is more abstracted (supporting different cache backends).

## 3. Cell

**Files:** `src/core/cell.ts` vs `Cell/Cell.php`

### Missing Public Methods in TS
- `__toString`
- `getFormattedValue` (Requires NumberFormat support)
- `getMergeRange`, `isInMergeRange`, `isMergeRangeValueCell`
- `isFormula`, `isLocked`, `isHiddenOnFormulaBar`
- `getHyperlink`, `getDataValidation`
- `attach`, `detach` (Used by CellCollection)

### Method Signature Differences
- Constructor in TS: `constructor(value: any, dataType: TDataType, worksheet: Worksheet, column: number, row: number)`
- Constructor in PHP: `__construct($value, $dataType, Worksheet $worksheet)` (Coordinates are often set later or managed by the collection).

### Logic Discrepancies
- **Value Binding:** TS uses `IValueBinder` from the spreadsheet. PHP does similar but has more complex default binding.
- **Calculated Value:** TS caches it in `#calculatedValue`. PHP also caches it but has `getOldCalculatedValue` for formula results.

## 4. Cell Collection

**Files:** `src/core/cell-collection.ts` vs `Collection/Cells.php`

### Missing Public Methods in TS
- `getHighestRow`, `getHighestColumn`, `getHighestRowAndColumn`
- `getSortedCoordinates`
- `removeRow`, `removeColumn`
- `unsetWorksheetCells` (Disposal logic)

### Logic Discrepancies
- **Storage:** TS uses a simple `Map<string, Cell>`. PHP's `Cells` class is an interface to various caching strategies (Memory, DiscISAM, etc.).
- **Parent Reference:** PHP's `Cells` collection maintains a reference to the `Worksheet`. TS `CellCollection` currently doesn't (though cells themselves know their worksheet).

## 5. Event Handling & Disposal

### Differences
- **PHP:** Has a robust `disconnectWorksheets` -> `disconnectCells` -> `unsetWorksheetCells` -> `detach` chain to break circular references and free memory, especially important for PHP's long-running processes or memory limits.
- **TypeScript:** Currently lacks any explicit disposal or "disconnect" logic. While JS has garbage collection, circular references (Spreadsheet -> Worksheet -> Cell -> Worksheet) can sometimes lead to memory leaks or prevent collection in certain environments if not handled.
