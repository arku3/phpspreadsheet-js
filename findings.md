# Findings & Decisions

## Requirements
- Create a detailed plan and task list to compare the current TypeScript implementation to the PHP counterpart under `php-src/src/PhpSpreadsheet`.
- Write out the plan and findings to `findings.md`, `task_plan.md`, and `progress.md`.
- Reader/writer scope: TypeScript implementation will only support XLSX (no other formats required).
- All public APIs must match the PHP interface in naming, arguments, and return types.

## Research Findings
- Repository contains a PHP reference implementation under the `php-src` submodule that must be used for parity comparisons.
- TypeScript top-level modules under `src/`: caching, calculation, common, core, document, io, rich-text, shared, style, utils, worksheet.
- PHP top-level modules under `php-src/src/PhpSpreadsheet`: Calculation, Cell, Chart, Collection, Comment.php, DefinedName.php, Document, Exception.php, HashTable.php, Helper, IComparable.php, IOFactory.php, NamedFormula.php, NamedRange.php, Reader, ReferenceHelper.php, RichText, Settings.php, Shared, Spreadsheet.php, Style, Theme.php, Worksheet, Writer.
- Initial TS → PHP module mapping drafted (core, worksheet, style, rich-text, document, calculation, io/xlsx, utils). See notes below.
- Initial gap scan suggests TS is XLSX-centric, while PHP supports multiple reader/writer formats.

## Initial Module Mapping (TS → PHP)
- Core: `src/core/*` → `php-src/src/PhpSpreadsheet/Spreadsheet.php`, `Worksheet/Worksheet.php`, `Cell/Cell.php`, `Collection/*`, `Comment.php`, `DefinedName.php`, `NamedRange.php`, `Cell/Hyperlink.php`, `Cell/DataValidation.php`, `Cell/IValueBinder.php`, `Cell/DefaultValueBinder.php`, `Cell/AdvancedValueBinder.php`.
- Worksheet: `src/worksheet/*` (Row/ColumnDimension, HeaderFooter, PageSetup/Margins, Pane, SheetView, AutoFilter, Table, Drawing) → `Worksheet/*` equivalents.
- Chart: `src/worksheet/chart/*` → `Chart/*` equivalents; `src/io/xlsx/charts.ts` → `Writer/Xlsx/*` chart XML writers.
- Style: `src/style/*` → `Style/*`, plus `Theme.php`.
- RichText: `src/rich-text/*` → `RichText/*` equivalents.
- Document: `src/document/*` → `Document/*` equivalents.
- Utils/Shared: `src/utils/coordinate.ts` → `Cell/Coordinate.php`; `src/utils/string-helper.ts` → `Shared/StringHelper.php`; `src/shared/password-hasher.ts` → `Shared/PasswordHasher.php`; `src/common/hash-table.ts` → `HashTable.php`.
- Calculation: `src/calculation/*` → `Calculation/*` (Calculation.php, Functions.php, FormulaParser.php, FormulaToken.php; functions subtrees by category).
- IO: `src/io/xlsx-*` and `src/io/xlsx/*` → `Reader/Xlsx.php`, `Writer/Xlsx.php`, and Xlsx reader/writer submodules.

## Initial Gap Scan (High-Level)
- Missing in TS (obvious): `IOFactory.php`, `Settings.php`, non-XLSX readers/writers (Csv/Html/Xls/Ods), cell/range helpers (CellRange/RowRange/ColumnRange/CellAddress/AddressHelper/AddressRange), worksheet iterators, worksheet protection/page break/memory drawing/header-footer drawing, many `Shared/*` helpers, and broader `Calculation/*` submodules.
- TS-only (obvious): `src/caching/*`, some calculation engine helpers (e.g., branch pruner, structured reference), which do not map 1:1 to PHP files.

## Phase 3: Core API Parity Findings (Spreadsheet/Worksheet/Cell/etc.)
### Spreadsheet (TS: `src/core/spreadsheet.ts` vs PHP: `php-src/src/PhpSpreadsheet/Spreadsheet.php`)
- Return-type mismatches: `setActiveSheetIndex`, `setActiveSheetIndexByName` (PHP returns `Worksheet`, TS returns `this`), `setValueBinder` (PHP returns `self`, TS returns `void`).
- Signature mismatches: `createSheet` (PHP only index; TS adds `title`), `addSheet` (PHP has `retitleIfNeeded`), `getSheetByName` (PHP trims quotes + case-insensitive), `getSheetByCodeName` (TS uses title fallback), `setVisibility` (PHP validates values).
- Missing public APIs: sheet management (`getAllSheets`, `setIndexByName`, `sheetCodeNameExists`, `getWorksheetIterator`), named formulas (`getNamedFormulae`, `addNamedFormula`, `getNamedFormula`, `removeNamedFormula`, `removeDefinedName`, `removeNamedRange`), calculation/clone (`copy`, `__clone`, `getCalculationEngineOrNull`), workbook properties (`getExcelCalendar`, `setExcelCalendar`, `resetThemeFonts`), macros/ribbon (`hasMacros`, `setHasMacros`, `setMacrosCode`, `getMacrosCode`, `setMacrosCertificate`, `getMacrosCertificate`, `discardMacros`, `setRibbonXMLData`, `getRibbonXMLData`, `setRibbonBinObjects`, `getRibbonBinObjects`, `hasRibbon`, `hasRibbonBinObjects`), PDF helpers (`mergeChartCellsForPdf`, `mergeDrawingCellsForPdf`), style XF helpers (`cellXfExists`, `removeCellStyleXfByIndex`).
- TS-only: cache strategy setters (`setDefaultCacheStrategy`, `getDefaultCacheStrategy`) have no PHP equivalent.

### Worksheet (TS: `src/core/worksheet.ts` vs PHP: `php-src/src/PhpSpreadsheet/Worksheet/Worksheet.php`)
- Signature/return mismatches: `setTitle` (PHP returns `self` + validation flags), `getParent` (PHP nullable), `getStyle` (PHP accepts range/CellAddress), `setCellValue` (PHP accepts arrays/CellAddress and optional binder). Missing `setCellValueExplicit`.
- Missing APIs: coordinate/cell helpers (`getCoordinates`, `cellExists`, `getCellOrNull`, `createNewCell`, `getWorksheetAndCoordinate`), named range resolution (`validateNamedRange`), styling helpers (`duplicateStyle`, `getRowStyle`, `getColumnStyle`), protection (`getProtection`, `setProtection`), hyperlink API (`getHyperlink`, `setHyperlink`, `hyperlinkExists`), conditional formatting APIs (`getConditionalStyles` with `firstOnly`, `getConditionalRange`, `conditionalStylesExists`, `removeConditionalStyles`, priority sorting), table APIs (`getTableCollection`, `getTablesWithStylesForCell`, `getTablesWithoutStylesForCell`), drawings (`getInCellDrawingCollection`), charts (`getChartCount`, `getChartByIndex`, `getChartNames`, `getChartByName`, `getChartByNameOrThrow`), row/column break objects/constants, cache hooks (`refreshColumnDimensions`, `refreshRowDimensions`, `calculateWorksheetDimension`, `calculateWorksheetDataDimension`, `calculateColumnWidths`), active cell APIs (`setActiveCell`), validation helpers (`getInvalidCharacters`, `checkSheetTitle/checkSheetCodeName`).

### Cell (TS: `src/core/cell.ts` vs PHP: `php-src/src/PhpSpreadsheet/Cell/Cell.php`)
- Signature/return mismatches: constructor (TS adds column/row; PHP uses worksheet + collection coordinate), `getColumn/getRow` (TS uses numeric indices vs PHP column string + row int), `setValue` (PHP supports optional binder), `setValueExplicit` (PHP has default type and returns `self`), `getDataValidation` (PHP returns `DataValidation` or throws), `setDataValidation` (PHP accepts null and returns `self`).
- Missing APIs: `getValueString`, `getCalculatedValueString`, `setCalculatedValue`, `getOldCalculatedValue`, `hasDataValidation`, `hasHyperlink`, `setHyperlink`, `getAppliedStyle`, `rebindParent`, `getParent`, `getWorksheetOrNull`, static `compareCells`, static `getValueBinder/setValueBinder`, formula attributes (`setFormulaAttributes`, `getFormulaAttributes`), `getIgnoredErrors`.
- Behavioral divergences: `isFormula` (PHP accounts for quotePrefix), `isLocked`/`isHiddenOnFormulaBar` depend on sheet protection in PHP; TS ignores.

### Comment (TS: `src/core/comment.ts` vs PHP: `php-src/src/PhpSpreadsheet/Comment.php`)
- Missing APIs: sizing/margins (`getWidth/setWidth`, `getHeight/setHeight`, `getMarginLeft/setMarginLeft`, `getMarginTop/setMarginTop`), fill color, alignment, textbox direction, background image APIs, `getHashCode`, `__clone`, `__toString`.

### DefinedName / NamedRange
- DefinedName missing APIs: `setName`, `setWorksheet`, `setLocalOnly`, `setScope`, `createInstance`, `testIfFormula`, `resolveName`. `isFormula` logic differs.
- NamedRange missing: `getCellsInRange`. `setRange` behavior differs (PHP ignores empty string).

### Hyperlink (TS: `src/core/hyperlink.ts` vs PHP: `php-src/src/PhpSpreadsheet/Cell/Hyperlink.php`)
- Missing APIs: `isInternal`, `getTypeHyperlink`, `getDisplay/setDisplay`, `getHashCode`.
- Signature mismatch: TS constructor includes `location` parameter; PHP constructor is `(url = '', tooltip = '')`.

### DataValidation (TS: `src/core/data-validation.ts` vs PHP: `php-src/src/PhpSpreadsheet/Cell/DataValidation.php`)
- Hash code differs: PHP includes class name in hash; TS concatenation does not.

### Value Binders (TS: `src/core/*-value-binder.ts` vs PHP: `php-src/src/PhpSpreadsheet/Cell/*ValueBinder.php`)
- Signature mismatch: Advanced binder default value param (PHP optional, TS required).
- Missing API: `DefaultValueBinder::setPreserveCr/getPreserveCr` and binding behaviors (DateTime, Stringable, BaseDrawing, locale numeric, newline wrap).

### Cell Collection (TS: `src/core/cell-collection.ts` vs PHP: `php-src/src/PhpSpreadsheet/Collection/Cells.php`)
- Major API mismatches: PHP active-cell semantics (`getCurrentCoordinate`, `getCurrentRow`, `getCurrentColumn`), `update`, `add` returns `Cell`, `delete`, `unsetWorksheetCells`, `cloneCellCollection`, `getSortedCoordinates`, factory (`CellsFactory::getInstance`). TS is a simple Map cache without these APIs.

## Phase 3: Worksheet Extras Parity Findings
### Dimensions (Row/Column)
- Missing unit conversion parameters: PHP `getRowHeight(?string $unitOfMeasure)` / `setRowHeight(float $height, ?string $unitOfMeasure)` and `getWidth(?string $unitOfMeasure)` / `setWidth(float $width, ?string $unitOfMeasure)` vs TS fixed numeric APIs.

### Header/Footer
- Missing header/footer image API (`addImage`, `removeImage`, `setImages`, `getImages`) and constants; missing `HeaderFooterDrawing` class in TS.

### Page Setup / Margins
- Missing `setPrintAreaByColumnAndRow` and `addPrintAreaByColumnAndRow` in TS.
- Range validation differences: PHP accepts `AddressRange|array|string`; TS only string.

### Sheet View / Pane
- No major public API gaps noted (minor typing differences).

### AutoFilter
- Range input types: PHP accepts `AddressRange|array|string`; TS only string.
- Missing `setRangeToMaxRow()` and `__clone()` behavior; `showHideRows()` returns `void` in TS vs `$this` in PHP.
- Collection type difference: TS uses `Map<string, Column>` vs PHP array keyed by column.

### Tables
- Missing classes: `Worksheet/Table/Column`, `Worksheet/Table/TableStyle`, `Worksheet/Table/TableDxfsStyle`.
- Missing or renamed APIs: `setName` validation/dup checks, `getShowHeaderRow/setShowHeaderRow`, `getShowTotalsRow/setShowTotalsRow` (TS uses `showHeader/showTotals`), `getAllowFilter/setAllowFilter`, `setRangeToMaxRow`, `getStyle/setStyle`, `getAutoFilter/setAutoFilter`, column helpers (`getColumnOffset/isColumnInRange/getColumnByOffset/setColumn/clearColumn/shiftColumn`), `getRowNumber`.
- Column model mismatch: TS `TableColumn` lacks filter/totals/formula/structured reference features from PHP.

### Drawings
- Missing classes: `MemoryDrawing`, `HeaderFooterDrawing`.
- BaseDrawing API gaps: `editAs` (`EDIT_AS_*`), `setEditAs`, `validEditAs`, image size/type (`imageWidth/imageHeight/type/setSizesAndType`), resizing and transforms (`resizeProportional`, `rotation`, flips, opacity, inCell, index, srcRect), `setWidthAndHeight`, `getHashCode` parity.
- Drawing API gaps: `getIndexedFilename`, `getMediaFilename`, `getIsURL`, `getImageTypeForSave`, `getImageFileExtensionForSave`, `getImageMimeType`, `setPath` options (`verifyFile`, `allowExternal`, etc.).

### Charts
- Missing classes: `Layout`, `Properties`, standalone `AxisText`.
- Chart object mismatches: constructor signature, missing `plotVisibleOnly`, `displayBlanksAs`, `chartAxisX/Y`, cell anchor setters, `oneCellAnchor`, `autoTitleDeleted`, fill/border/noFill/noBorder/roundedCorners APIs, rendered size setters, `refresh`/`render`.
- Axis: missing display units constants, `getFillColorObject` parity; type/options structure differs.
- DataSeries: chart type strings differ (`barChart` etc. in PHP), missing plot style, `refresh(Worksheet)`.
- DataSeriesValues: missing data values storage/refresh APIs, fill colors, scatter/bubble options.
- TrendLine: constant naming (`TRENDLINE_MOVING_AVERAGE` vs `TRENDLINE_MOVING_AVG`), method name differences (`getDispRSqr` vs `getDisplayRSquared`, `getDispEq` vs `getDisplayEquation`).
- Title/Legend: missing calculated title logic, position XL APIs, legend text, border/fill color APIs; position mapping differs.
- Status: completed parity for Chart/Axis/DataSeries/DataSeriesValues/TrendLine/Title/Legend, added Layout/Properties/GridLines, and updated XLSX reader/writer/test coverage accordingly.

## Phase 3: Style Parity Findings
### Missing PHP Style Modules
- NumberFormat helpers/wizards: `Style/NumberFormat/*` formatter classes and `Style/NumberFormat/Wizard/*` (JS only has `src/style/number-formatter.ts`).
- Conditional formatting extensions/merged style: `ConditionalFormatting/ConditionalDataBarExtension`, `ConditionalFormatting/ConditionalFormattingRuleExtension`, `ConditionalFormatting/MergedCellStyle`.

### Style Core (`src/style/style.ts` vs `Style/Style.php`)
- Conditional styles constructor missing `isConditional` flag; JS lacks `getConditionalStyles/setConditionalStyles`.
- `applyFromArray` lacks PHP advanced border region logic.
- `getSharedComponent` selection differs (PHP active cell vs JS selected cells).
- `getStyleArray` behavior differs (PHP wraps under `quotePrefix`).

### Alignment (`src/style/alignment.ts` vs `Style/Alignment.php`)
- Missing constants: `HORIZONTAL_ALIGNMENT_FOR_XLSX/HTML`, `VERTICAL_ALIGNMENT_FOR_XLSX/HTML`, `INDENT_UNITS_TO_PIXELS`, baseline/middle/sub/super aliases.
- `setIndent` constraints missing; `justifyLastLine` default `null` in PHP vs `false` in JS.
- Hash mismatch due to `justifyLastLine` handling.

### Font (`src/style/font.ts` vs `Style/Font.php`)
- Missing: `DEFAULT_FONT_NAME`, `autoColor`, `underlineColor`, `chartColor`, `setAutoColor/getAutoColor`, `setUnderlineColor`, `setChartColor`, `setChartColorFromObject`, `setHyperlinkTheme`.
- `setUnderline` boolean handling missing; `setScheme` validation missing.
- Hash mismatch: PHP includes auto/underline/chart colors; JS does not.

### Color/Theme (`src/style/color.ts` vs `Style/Color.php`)
- Missing: `getRed/getGreen/getBlue`, `setARGB(?string, bool $nullStringOkay)`, nullable `getARGB` for conditional styles.
- `hasChanged` updates missing; `setHyperlinkTheme` uses hard-coded values vs PHP theme keys.
- Theme mismatch: JS indexes theme colors by numeric id but `Theme.getThemeColors()` returns scheme-keyed record.
- Hash mismatch: JS includes `hasChanged`, PHP does not.

### Fill (`src/style/fill.ts` vs `Style/Fill.php`)
- Missing `colorsChanged` tracking, `startcolorIndex/endcolorIndex`, conditional fillType `null` behavior.
- Hash mismatch: PHP includes `colorsChanged`.

### Borders (`src/style/borders.ts`, `src/style/border.ts` vs `Style/Borders.php`, `Style/Border.php`)
- Conditional border defaults (`BORDER_OMIT`) missing in JS.
- Pseudo-borders supported in API but `getSharedComponent` throws for pseudo-borders.

### NumberFormat (`src/style/number-format.ts`, `src/style/number-formatter.ts` vs `Style/NumberFormat.php`)
- Missing built-in format registry, system format conversion, date/time arrays, `getFormatCode($extended)`, `convertSystemFormats`.
- `toFormattedString` is static in PHP; JS instance method only.
- `setBuiltInFormatCode` should also set formatCode; JS only sets builtIn code.
- Hash mismatch: PHP includes built-in format code; JS does not.

### Conditional Formatting (`src/style/conditional*.ts` vs `Style/Conditional*.php`)
- Missing `Conditional::isValidConditionType`, `Conditional::getStyle($cellData)` handling for color scales.
- Constant name differences (`OPERATOR_NOTCONTAINS` vs JS `OPERATOR_NOTCONTAINSTEXT`), extra constants in JS.
- `ConditionalColorScale` lacks prepare/eval APIs (`setScaleArray`, `getColorForValue`, etc.).
- `ConditionalDataBar` missing extension rule APIs.
- `ConditionalIconSet` auto-creates thresholds in JS (PHP does not).
- `CellMatcher` and `WizardAbstract` are stubbed (missing relative reference parsing and matching).
- Wizard API parity gaps: missing `fromConditional(...)`, `newRule(...)`, method alias differences, operator naming mismatch.

## Phase 3: Calculation Parity Findings
### Missing Core Classes / Engine Helpers
- Missing calculation classes: `CalculationBase`, `CalculationParserOnly`, `CalculationLocale`, `Category`, `Functions`, `FunctionArray`, `Exception`, `ExceptionHandler`.
- Missing engine helpers: `CyclicReferenceStack`, `Logger`, `ArrayArgumentHelper`, `ArrayArgumentProcessor`, `FormattedNumber`, `Engine/Operands/Operand`.

### Calculation API Mismatches (`src/calculation/calculation.ts` vs `Calculation/Calculation.php`)
- JS provides `calculateFormula(formula, worksheet?, cellID?)`; PHP provides `calculateFormula(formula, cellID?, cell?)` plus `calculateCellValue`, `parseFormula`, singleton `getInstance`, cache toggles, locale translation, array return mode, etc.
- Signature mismatch: JS `calculateFormula` uses `Worksheet` and `cellID`; PHP uses `cellID` and `Cell`.
- Missing cache APIs (`setCalculationCacheEnabled`, `enable/disableCalculationCache`, `clearCalculationCacheForWorksheet`) and locale APIs (`setLocale`, `translateFormulaToLocale`, etc.).

### Constants / Return Modes
- Missing constants: `RETURN_ARRAY_AS_*`, compatibility modes (`COMPATIBILITY_*`), return-date constants, category constants.
- JS `CalculationErrors` contains errors not mirrored as PHP constants (`GETTING_DATA`, `CIRCULAR`).

### Formula Parser / Tokenization Gaps
- Missing union/intersection operators and `:` range operator handling; PHP supports unionable commas.
- Scientific notation parsing not handled in JS parser.
- Structured reference parsing less robust in JS (nested brackets, TABLE_REFERENCE handling).
- Matrix literal conversion to `MKMATRIX()` and brace validation missing in JS.
- Locale translation for function names/constants missing in JS.

### Engine Behavior Differences
- Cyclic references: PHP uses `CyclicReferenceStack` with iteration limits/logging; JS uses a simple set and returns `#CIRCULAR!` immediately.
- Array return modes missing (PHP supports RETURN_ARRAY_AS_*).
- Branch pruning logic simplified in JS (no depth tracking as in PHP `BranchPruner`).
- Result wrapping/quote-prefix handling missing in JS (`wrapResult/unwrapResult`).

### Function Registry / Function Set Coverage
- PHP `FunctionArray` registry includes metadata (category, argument counts, call metadata); JS registry only has min/max args and implementation.
- JS implements a small subset of functions; many PHP categories and submodules are missing (Lookup/Ref, Statistical, Financial, Logical/Information/Web/Cube, etc.).

### Helpers
- PHP `Functions.php` helpers missing in JS: `flattenArray2`, `flattenArrayIndexed`, `flattenSingleValue`, `scalar`, `expandDefinedName`, `trimSheetFromCellReference`, `trimTrailingRange`, compatibility/date return handling.

## Phase 3: IO/XLSX Parity Findings
### Shared Interfaces
- `IReader`: JS lacks PHP read flags, `IReadFilter` interface, `setLoadSheetsOnly`, `setIncludeCharts`, `setAllowExternalImages`, `setCreateBlankSheetIfNoneRead`, and flag constants.
- `IWriter`: JS lacks include charts + disk caching APIs and save flags (`SAVE_WITH_CHARTS`, `DISABLE_PRECALCULATE_FORMULAE`).

### Xlsx Reader (`src/io/xlsx-reader.ts` vs `Reader/Xlsx.php`)
- JS adds buffer-based helpers (`loadFromBuffer`, `listWorksheet*FromBuffer`) not in PHP.
- Missing PHP features: read flags, external image handling, `setLoadSheetsOnly`, parseHuge/XML scanner, VBA/ribbon metadata, document properties, shared formula expansion, conditional styles reader, rich hyperlink reader.
- Style/theme reader is minimal vs PHP (`Styles`, `Theme` readers in PHP parse more features).
- Chart parsing is shallow in JS (placeholder discovery only).

### Xlsx Writer (`src/io/xlsx-writer.ts` vs `Writer/Xlsx.php`)
- JS lacks save flags, disk caching, forceFullCalc, dynamic arrays, explicitStyle0, restrictMaxColumnWidth.
- Missing write support: metadata, featurePropertyBag, ribbon/VBA rels, rich data, advanced drawing types, header/footer images, comment background images.
- Table writer is minimal (no table styles, advanced column features).

### XLSX Submodules
- JS reader parts are limited (`styles-reader`, `table-reader`); PHP has many additional reader parts (ConditionalStyles, Hyperlinks, Theme, WorkbookView, Properties, SharedFormula, AutoFilter, Namespaces, XmlScanner).
- JS writer parts omit PHP writers like `Metadata`, `FeaturePropertyBag`, `RelsRibbon`, `RelsVBA`, `RichDataDrawing`, `DefinedNames`, `FunctionPrefix`.

## Phase 3: Shared/Utils Parity Findings
### Missing PHP Shared/Helper Utilities (no TS counterpart)
- Shared: `Shared/Date`, `Shared/TimeZone`, `Shared/File`, `Shared/XMLWriter`, `Shared/Drawing`, `Shared/Font`, `Shared/CodePage`, `Shared/IntOrFloat`, `Shared/Xls`, `Shared/OLE*`, `Shared/Escher*`, `Shared/Trend/*`.
- Helper: `Helper/*` (Html, TextGrid, Size, Dimension, etc.).
- Factory/Settings: `IOFactory.php`, `Settings.php` (public APIs for reader/writer creation, locale, chart renderer, cache selection).

### PasswordHasher (`src/shared/password-hasher.ts` vs `Shared/PasswordHasher.php`)
- Algorithm mapping uses literal strings in TS vs PHP constants; error type differs (Error vs SpreadsheetException).

### StringHelper (`src/utils/string-helper.ts` vs `Shared/StringHelper.php`)
- TS implements only `controlCharacterPHP2OOXML`, `containsControlCharacters`, `formatNumber`.
- Missing public APIs: `controlCharacterOOXML2PHP`, `sanitizeUTF8`, `isUTF8`, encoding helpers, string case helpers, locale setters/getters (decimal/thousands/currency), SYLK conversion, numeric parsing helpers, string increment.
- `formatNumber` behavior differs (PHP normalizes decimal, allows string passthrough).

### Coordinate / Reference Helpers
- TS `src/utils/coordinate.ts` lacks `ReferenceHelper` APIs (insert/update formula references, range updates, named ranges); `resolveIntersection` is stubbed.

### HashTable (`src/common/hash-table.ts` vs `HashTable.php`)
- Missing: constructor array arg, `remove`, `clear`, `getByHashCode`, `toArray`, deep clone behavior.
- `getIndexForHashCode` throws in TS vs `false|int` in PHP.

### Settings / Cache Parity
- TS cache implementations (`src/caching/*`) lack global Settings API for cache/locale selection and chart renderer.

## Phase 4: Verification Notes
- All planned subsystems reviewed (core, worksheet extras, style, calculation, IO/XLSX, shared/utils).
- Required parity verification when implementing: `bunx tsc --noEmit`, `bun test`, and for XLSX writer changes run `verify-php/` scripts per repo guidelines.

## Remediation Plan (Based on Findings)
### Guiding Constraints
- XLSX-only reader/writer support is required.
- All public APIs must match PHP in naming, arguments, and return types.

### Phase 1: Public API Parity (Core)
- Spreadsheet: align return types (`setActiveSheetIndex`, `setActiveSheetIndexByName`, `setValueBinder`), add missing APIs (named formula/range, macros/ribbon, calculation hooks, sheet management, cell Xf helpers).
- Worksheet: add missing methods (cell lookup helpers, hyperlink and conditional styles APIs, table/chart collections, protection, calculation dimension helpers, active cell APIs), align `setTitle`, `getStyle`, `setCellValue` signatures.
- Cell: align constructor, `getColumn/getRow`, `setValue`, `setValueExplicit`, data validation and hyperlink APIs; add missing calculated-value and formula attribute methods.
- Comment/DefinedName/NamedRange/Hyperlink: add missing APIs and align constructors/constant names.
- CellCollection: implement Cells-like behaviors (active cell, sorting, cloning, delete/unset, factory).

### Phase 2: Worksheet Extras Parity
- Tables: add missing classes (`Table/Column`, `TableStyle`, `TableDxfsStyle`) and align APIs for table styles, columns, filters, and range management.
- Drawings: add `MemoryDrawing`, `HeaderFooterDrawing` and complete BaseDrawing/Drawing APIs.
- Charts: add missing classes (`Layout`, `Properties`, `AxisText`) and align chart/axis/data-series/legend/title APIs.
- AutoFilter / HeaderFooter: align range input types, add missing image APIs, clone behavior, and return types.

### Phase 3: Style Parity
- Implement missing NumberFormat formatter/wizard classes and complete `NumberFormat` built-in registry + system format conversions.
- Align conditional formatting (rule evaluation, color scale/data bar/icon set APIs, wizard factories, cell matcher).
- Fix hash code mismatches (Alignment, Color, Fill, NumberFormat, Font).
- Align Theme/Color logic and hyperlink theme behavior.

### Phase 4: Calculation Parity
- Implement missing calculation core classes (locale, category, function registry metadata, exceptions).
- Align Calculation public API and parser semantics (union/intersection/range operators, scientific notation, structured refs, matrix literals).
- Add array return modes, cyclic reference handling, and logger/branch pruning parity.
- Expand function coverage to match PHP categories, with metadata parity.

### Phase 5: IO/XLSX Parity (Within XLSX scope)
- Align IReader/IWriter interfaces with PHP (flags, include charts, read filters), keeping XLSX-only scope.
- Implement missing reader parts (conditional styles, hyperlinks, theme, shared formula) and writer parts (metadata, defined names, richer drawings/comments).
- Add missing writer options (forceFullCalc, explicitStyle0, restrictMaxColumnWidth) where applicable.

### Phase 6: Shared/Utils Parity
- Implement missing shared helpers needed by XLSX scope (Date/TimeZone/File/XMLWriter/Drawing/Font) where referenced by core/IO.
- Add `IOFactory` and `Settings` parity stubs (even if limited) to satisfy public API requirements.
- Complete `StringHelper`, `Coordinate/ReferenceHelper`, and `HashTable` APIs.

### Verification & Delivery
- For each subsystem: update tests or add new ones to match PHP behavior.
- Run `bunx tsc --noEmit`, `bun test`, and `verify-php/` scripts when XLSX writer changes.

## Technical Decisions
| Decision | Rationale |
|----------|-----------|
| Compare by subsystem (core, io, calculation, utils) | Mirrors project architecture for systematic parity checks |
| Track gaps as missing/partial/divergent | Enables clear remediation tasks |

## Issues Encountered
| Issue | Resolution |
|-------|------------|
|       |            |

## Resources
- `php-src/src/PhpSpreadsheet` (PHP reference implementation)
- `src/` (TypeScript implementation)

## Visual/Browser Findings
-
