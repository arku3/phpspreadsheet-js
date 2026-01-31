# PHP vs TS Parity Map: Reader

| PHP file | PHP symbol | TS match (exists) | TS symbols | Status | TS candidates (first 5) |
|---|---|---|---|---|---|
| `php-src/src/PhpSpreadsheet/Reader/BaseReader.php` | `class BaseReader` |  |  | missing | src/io/base-reader/base-reader.ts<br>src/io/base-reader.ts |
| `php-src/src/PhpSpreadsheet/Reader/Csv.php` | `class Csv` |  |  | missing | src/io/csv/csv.ts<br>src/io/csv.ts |
| `php-src/src/PhpSpreadsheet/Reader/Csv/Delimiter.php` | `class Delimiter` |  |  | missing | src/io/csv/delimiter/delimiter.ts<br>src/io/delimiter.ts |
| `php-src/src/PhpSpreadsheet/Reader/DefaultReadFilter.php` | `class DefaultReadFilter` |  |  | missing | src/io/default-read-filter/default-read-filter.ts<br>src/io/default-read-filter.ts |
| `php-src/src/PhpSpreadsheet/Reader/Exception.php` | `class Exception` |  |  | missing | src/io/exception/exception.ts<br>src/io/exception.ts |
| `php-src/src/PhpSpreadsheet/Reader/Gnumeric.php` | `class Gnumeric` |  |  | missing | src/io/gnumeric/gnumeric.ts<br>src/io/gnumeric.ts |
| `php-src/src/PhpSpreadsheet/Reader/Gnumeric/PageSetup.php` | `class PageSetup` |  |  | missing | src/io/gnumeric/page-setup/page-setup.ts<br>src/io/page-setup.ts |
| `php-src/src/PhpSpreadsheet/Reader/Gnumeric/Properties.php` | `class Properties` |  |  | missing | src/io/gnumeric/properties/properties.ts<br>src/io/properties.ts |
| `php-src/src/PhpSpreadsheet/Reader/Gnumeric/Styles.php` | `class Styles` |  |  | missing | src/io/gnumeric/styles/styles.ts<br>src/io/styles.ts |
| `php-src/src/PhpSpreadsheet/Reader/Html.php` | `class Html` |  |  | missing | src/io/html/html.ts<br>src/io/html.ts |
| `php-src/src/PhpSpreadsheet/Reader/IReader.php` | `interface IReader` | `src/io/i-reader.ts` | `interface IReader`<br>`interface WorksheetInfo` | matched | src/io/i-reader/i-reader.ts<br>src/io/i-reader.ts |
| `php-src/src/PhpSpreadsheet/Reader/IReadFilter.php` | `interface IReadFilter` |  |  | missing | src/io/i-read-filter/i-read-filter.ts<br>src/io/i-read-filter.ts |
| `php-src/src/PhpSpreadsheet/Reader/Ods.php` | `class Ods` |  |  | missing | src/io/ods/ods.ts<br>src/io/ods.ts |
| `php-src/src/PhpSpreadsheet/Reader/Ods/AutoFilter.php` | `class AutoFilter` |  |  | missing | src/io/ods/auto-filter/auto-filter.ts<br>src/io/auto-filter.ts |
| `php-src/src/PhpSpreadsheet/Reader/Ods/BaseLoader.php` | `class BaseLoader` |  |  | missing | src/io/ods/base-loader/base-loader.ts<br>src/io/base-loader.ts |
| `php-src/src/PhpSpreadsheet/Reader/Ods/DefinedNames.php` | `class DefinedNames` |  |  | missing | src/io/ods/defined-names/defined-names.ts<br>src/io/defined-names.ts |
| `php-src/src/PhpSpreadsheet/Reader/Ods/FormulaTranslator.php` | `class FormulaTranslator` |  |  | missing | src/io/ods/formula-translator/formula-translator.ts<br>src/io/formula-translator.ts |
| `php-src/src/PhpSpreadsheet/Reader/Ods/PageSettings.php` | `class PageSettings` |  |  | missing | src/io/ods/page-settings/page-settings.ts<br>src/io/page-settings.ts |
| `php-src/src/PhpSpreadsheet/Reader/Ods/Properties.php` | `class Properties` |  |  | missing | src/io/ods/properties/properties.ts<br>src/io/properties.ts |
| `php-src/src/PhpSpreadsheet/Reader/Security/XmlScanner.php` | `class XmlScanner` |  |  | missing | src/io/security/xml-scanner/xml-scanner.ts<br>src/io/xml-scanner.ts |
| `php-src/src/PhpSpreadsheet/Reader/Slk.php` | `class Slk` |  |  | missing | src/io/slk/slk.ts<br>src/io/slk.ts |
| `php-src/src/PhpSpreadsheet/Reader/Xls.php` | `class Xls` |  |  | missing | src/io/xls/xls.ts<br>src/io/xls.ts |
| `php-src/src/PhpSpreadsheet/Reader/Xls/Biff5.php` | `class Biff5` |  |  | missing | src/io/xls/biff5/biff5.ts<br>src/io/biff5.ts |
| `php-src/src/PhpSpreadsheet/Reader/Xls/Biff8.php` | `class Biff8` |  |  | missing | src/io/xls/biff8/biff8.ts<br>src/io/biff8.ts |
| `php-src/src/PhpSpreadsheet/Reader/Xls/Color.php` | `class Color` |  |  | missing | src/io/xls/color/color.ts<br>src/io/color.ts |
| `php-src/src/PhpSpreadsheet/Reader/Xls/Color/BIFF5.php` | `class BIFF5` |  |  | missing | src/io/xls/color/bif-f5/bif-f5.ts<br>src/io/bif-f5.ts |
| `php-src/src/PhpSpreadsheet/Reader/Xls/Color/BIFF8.php` | `class BIFF8` |  |  | missing | src/io/xls/color/bif-f8/bif-f8.ts<br>src/io/bif-f8.ts |
| `php-src/src/PhpSpreadsheet/Reader/Xls/Color/BuiltIn.php` | `class BuiltIn` |  |  | missing | src/io/xls/color/built-in/built-in.ts<br>src/io/built-in.ts |
| `php-src/src/PhpSpreadsheet/Reader/Xls/ConditionalFormatting.php` | `class ConditionalFormatting` |  |  | missing | src/io/xls/conditional-formatting/conditional-formatting.ts<br>src/io/conditional-formatting.ts |
| `php-src/src/PhpSpreadsheet/Reader/Xls/DataValidationHelper.php` | `class DataValidationHelper` |  |  | missing | src/io/xls/data-validation-helper/data-validation-helper.ts<br>src/io/data-validation-helper.ts |
| `php-src/src/PhpSpreadsheet/Reader/Xls/ErrorCode.php` | `class ErrorCode` |  |  | missing | src/io/xls/error-code/error-code.ts<br>src/io/error-code.ts |
| `php-src/src/PhpSpreadsheet/Reader/Xls/Escher.php` | `class Escher` |  |  | missing | src/io/xls/escher/escher.ts<br>src/io/escher.ts |
| `php-src/src/PhpSpreadsheet/Reader/Xls/ListFunctions.php` | `class ListFunctions` |  |  | missing | src/io/xls/list-functions/list-functions.ts<br>src/io/list-functions.ts |
| `php-src/src/PhpSpreadsheet/Reader/Xls/LoadSpreadsheet.php` | `class LoadSpreadsheet` |  |  | missing | src/io/xls/load-spreadsheet/load-spreadsheet.ts<br>src/io/load-spreadsheet.ts |
| `php-src/src/PhpSpreadsheet/Reader/Xls/Mappings.php` | `class Mappings` |  |  | missing | src/io/xls/mappings/mappings.ts<br>src/io/mappings.ts |
| `php-src/src/PhpSpreadsheet/Reader/Xls/MD5.php` | `class MD5` |  |  | missing | src/io/xls/m-d5/m-d5.ts<br>src/io/m-d5.ts |
| `php-src/src/PhpSpreadsheet/Reader/Xls/RC4.php` | `class RC4` |  |  | missing | src/io/xls/r-c4/r-c4.ts<br>src/io/r-c4.ts |
| `php-src/src/PhpSpreadsheet/Reader/Xls/Style/Border.php` | `class Border` |  |  | missing | src/io/xls/style/border/border.ts<br>src/io/border.ts |
| `php-src/src/PhpSpreadsheet/Reader/Xls/Style/CellAlignment.php` | `class CellAlignment` |  |  | missing | src/io/xls/style/cell-alignment/cell-alignment.ts<br>src/io/cell-alignment.ts |
| `php-src/src/PhpSpreadsheet/Reader/Xls/Style/CellFont.php` | `class CellFont` |  |  | missing | src/io/xls/style/cell-font/cell-font.ts<br>src/io/cell-font.ts |
| `php-src/src/PhpSpreadsheet/Reader/Xls/Style/FillPattern.php` | `class FillPattern` |  |  | missing | src/io/xls/style/fill-pattern/fill-pattern.ts<br>src/io/fill-pattern.ts |
| `php-src/src/PhpSpreadsheet/Reader/XlsBase.php` | `class XlsBase` |  |  | missing | src/io/xls-base/xls-base.ts<br>src/io/xls-base.ts |
| `php-src/src/PhpSpreadsheet/Reader/Xlsx.php` | `class Xlsx` | `src/io/xlsx-reader.ts` | `class XlsxReader` | matched | src/io/xlsx-reader.ts |
| `php-src/src/PhpSpreadsheet/Reader/Xlsx/AutoFilter.php` | `class AutoFilter` | `src/io/xlsx-reader.ts` | `class XlsxReader` | matched | src/io/xlsx-reader.ts<br>src/io/xlsx/auto-filter.ts |
| `php-src/src/PhpSpreadsheet/Reader/Xlsx/BaseParserClass.php` | `class BaseParserClass` | `src/io/xlsx-reader.ts` | `class XlsxReader` | matched | src/io/xlsx-reader.ts<br>src/io/xlsx/base-parser-class.ts |
| `php-src/src/PhpSpreadsheet/Reader/Xlsx/Chart.php` | `class Chart` | `src/io/xlsx-reader.ts` | `class XlsxReader` | matched | src/io/xlsx-reader.ts<br>src/io/xlsx/chart.ts |
| `php-src/src/PhpSpreadsheet/Reader/Xlsx/ColumnAndRowAttributes.php` | `class ColumnAndRowAttributes` | `src/io/xlsx-reader.ts` | `class XlsxReader` | matched | src/io/xlsx-reader.ts<br>src/io/xlsx/column-and-row-attributes.ts |
| `php-src/src/PhpSpreadsheet/Reader/Xlsx/ConditionalStyles.php` | `class ConditionalStyles` | `src/io/xlsx-reader.ts` | `class XlsxReader` | matched | src/io/xlsx-reader.ts<br>src/io/xlsx/conditional-styles.ts |
| `php-src/src/PhpSpreadsheet/Reader/Xlsx/DataValidations.php` | `class DataValidations` | `src/io/xlsx-reader.ts` | `class XlsxReader` | matched | src/io/xlsx-reader.ts<br>src/io/xlsx/data-validations.ts |
| `php-src/src/PhpSpreadsheet/Reader/Xlsx/Hyperlinks.php` | `class Hyperlinks` | `src/io/xlsx-reader.ts` | `class XlsxReader` | matched | src/io/xlsx-reader.ts<br>src/io/xlsx/hyperlinks.ts |
| `php-src/src/PhpSpreadsheet/Reader/Xlsx/Namespaces.php` | `class Namespaces` | `src/io/xlsx-reader.ts` | `class XlsxReader` | matched | src/io/xlsx-reader.ts<br>src/io/xlsx/namespaces.ts |
| `php-src/src/PhpSpreadsheet/Reader/Xlsx/PageSetup.php` | `class PageSetup` | `src/io/xlsx-reader.ts` | `class XlsxReader` | matched | src/io/xlsx-reader.ts<br>src/io/xlsx/page-setup.ts |
| `php-src/src/PhpSpreadsheet/Reader/Xlsx/Properties.php` | `class Properties` | `src/io/xlsx-reader.ts` | `class XlsxReader` | matched | src/io/xlsx-reader.ts<br>src/io/xlsx/properties.ts |
| `php-src/src/PhpSpreadsheet/Reader/Xlsx/SharedFormula.php` | `class SharedFormula` | `src/io/xlsx-reader.ts` | `class XlsxReader` | matched | src/io/xlsx-reader.ts<br>src/io/xlsx/shared-formula.ts |
| `php-src/src/PhpSpreadsheet/Reader/Xlsx/SheetViewOptions.php` | `class SheetViewOptions` | `src/io/xlsx-reader.ts` | `class XlsxReader` | matched | src/io/xlsx-reader.ts<br>src/io/xlsx/sheet-view-options.ts |
| `php-src/src/PhpSpreadsheet/Reader/Xlsx/SheetViews.php` | `class SheetViews` | `src/io/xlsx-reader.ts` | `class XlsxReader` | matched | src/io/xlsx-reader.ts<br>src/io/xlsx/sheet-views.ts |
| `php-src/src/PhpSpreadsheet/Reader/Xlsx/Styles.php` | `class Styles` | `src/io/xlsx-reader.ts`<br>`src/io/xlsx/styles.ts` | `class Styles`<br>`class XlsxReader` | ambiguous | src/io/xlsx-reader.ts<br>src/io/xlsx/styles.ts |
| `php-src/src/PhpSpreadsheet/Reader/Xlsx/TableReader.php` | `class TableReader` | `src/io/xlsx-reader.ts` | `class XlsxReader` | matched | src/io/xlsx-reader.ts<br>src/io/xlsx/table-reader.ts |
| `php-src/src/PhpSpreadsheet/Reader/Xlsx/Theme.php` | `class Theme` | `src/io/xlsx-reader.ts`<br>`src/io/xlsx/theme.ts` | `class Theme`<br>`class XlsxReader` | ambiguous | src/io/xlsx-reader.ts<br>src/io/xlsx/theme.ts |
| `php-src/src/PhpSpreadsheet/Reader/Xlsx/WorkbookView.php` | `class WorkbookView` | `src/io/xlsx-reader.ts` | `class XlsxReader` | matched | src/io/xlsx-reader.ts<br>src/io/xlsx/workbook-view.ts |
| `php-src/src/PhpSpreadsheet/Reader/Xml.php` | `class Xml` |  |  | missing | src/io/xml/xml.ts<br>src/io/xml.ts |
| `php-src/src/PhpSpreadsheet/Reader/Xml/DataValidations.php` | `class DataValidations` |  |  | missing | src/io/xml/data-validations/data-validations.ts<br>src/io/data-validations.ts |
| `php-src/src/PhpSpreadsheet/Reader/Xml/PageSettings.php` | `class PageSettings` |  |  | missing | src/io/xml/page-settings/page-settings.ts<br>src/io/page-settings.ts |
| `php-src/src/PhpSpreadsheet/Reader/Xml/Properties.php` | `class Properties` |  |  | missing | src/io/xml/properties/properties.ts<br>src/io/properties.ts |
| `php-src/src/PhpSpreadsheet/Reader/Xml/Style.php` | `class Style` |  |  | missing | src/io/xml/style/style.ts<br>src/io/style.ts |
| `php-src/src/PhpSpreadsheet/Reader/Xml/Style/Alignment.php` | `class Alignment` |  |  | missing | src/io/xml/style/alignment/alignment.ts<br>src/io/alignment.ts |
| `php-src/src/PhpSpreadsheet/Reader/Xml/Style/Border.php` | `class Border` |  |  | missing | src/io/xml/style/border/border.ts<br>src/io/border.ts |
| `php-src/src/PhpSpreadsheet/Reader/Xml/Style/Fill.php` | `class Fill` |  |  | missing | src/io/xml/style/fill/fill.ts<br>src/io/fill.ts |
| `php-src/src/PhpSpreadsheet/Reader/Xml/Style/Font.php` | `class Font` |  |  | missing | src/io/xml/style/font/font.ts<br>src/io/font.ts |
| `php-src/src/PhpSpreadsheet/Reader/Xml/Style/NumberFormat.php` | `class NumberFormat` |  |  | missing | src/io/xml/style/number-format/number-format.ts<br>src/io/number-format.ts |
| `php-src/src/PhpSpreadsheet/Reader/Xml/Style/StyleBase.php` | `class StyleBase` |  |  | missing | src/io/xml/style/style-base/style-base.ts<br>src/io/style-base.ts |
