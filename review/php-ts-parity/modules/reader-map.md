# PHP vs TS Parity Map: Reader

| PHP file | PHP symbol | TS match (exists) | TS symbols | Status | TS candidates (first 5) |
|---|---|---|---|---|---|
| `php-src/src/PhpSpreadsheet/Reader/BaseReader.php` | `class BaseReader` |  |  | missing | src/io/base-reader/base-reader.ts<br>src/io/base-reader.ts |
| `php-src/src/PhpSpreadsheet/Reader/DefaultReadFilter.php` | `class DefaultReadFilter` |  |  | missing | src/io/default-read-filter/default-read-filter.ts<br>src/io/default-read-filter.ts |
| `php-src/src/PhpSpreadsheet/Reader/Exception.php` | `class Exception` |  |  | missing | src/io/exception/exception.ts<br>src/io/exception.ts |
| `php-src/src/PhpSpreadsheet/Reader/IReader.php` | `interface IReader` | `src/io/i-reader.ts` | `interface IReader`<br>`interface WorksheetInfo` | matched | src/io/i-reader/i-reader.ts<br>src/io/i-reader.ts |
| `php-src/src/PhpSpreadsheet/Reader/IReadFilter.php` | `interface IReadFilter` |  |  | missing | src/io/i-read-filter/i-read-filter.ts<br>src/io/i-read-filter.ts |
| `php-src/src/PhpSpreadsheet/Reader/Security/XmlScanner.php` | `class XmlScanner` |  |  | missing | src/io/security/xml-scanner/xml-scanner.ts<br>src/io/xml-scanner.ts |
| `php-src/src/PhpSpreadsheet/Reader/Xlsx.php` | `class Xlsx` | `src/io/xlsx-reader.ts` | `class XlsxReader` | matched | src/io/xlsx-reader.ts |
| `php-src/src/PhpSpreadsheet/Reader/Xlsx/AutoFilter.php` | `class AutoFilter` |  |  | missing | src/io/xlsx/auto-filter.ts |
| `php-src/src/PhpSpreadsheet/Reader/Xlsx/BaseParserClass.php` | `class BaseParserClass` |  |  | missing | src/io/xlsx/base-parser-class.ts |
| `php-src/src/PhpSpreadsheet/Reader/Xlsx/Chart.php` | `class Chart` |  |  | missing | src/io/xlsx/chart.ts |
| `php-src/src/PhpSpreadsheet/Reader/Xlsx/ColumnAndRowAttributes.php` | `class ColumnAndRowAttributes` |  |  | missing | src/io/xlsx/column-and-row-attributes.ts |
| `php-src/src/PhpSpreadsheet/Reader/Xlsx/ConditionalStyles.php` | `class ConditionalStyles` |  |  | missing | src/io/xlsx/conditional-styles.ts |
| `php-src/src/PhpSpreadsheet/Reader/Xlsx/DataValidations.php` | `class DataValidations` |  |  | missing | src/io/xlsx/data-validations.ts |
| `php-src/src/PhpSpreadsheet/Reader/Xlsx/Hyperlinks.php` | `class Hyperlinks` |  |  | missing | src/io/xlsx/hyperlinks.ts |
| `php-src/src/PhpSpreadsheet/Reader/Xlsx/Namespaces.php` | `class Namespaces` |  |  | missing | src/io/xlsx/namespaces.ts |
| `php-src/src/PhpSpreadsheet/Reader/Xlsx/PageSetup.php` | `class PageSetup` |  |  | missing | src/io/xlsx/page-setup.ts |
| `php-src/src/PhpSpreadsheet/Reader/Xlsx/Properties.php` | `class Properties` |  |  | missing | src/io/xlsx/properties.ts |
| `php-src/src/PhpSpreadsheet/Reader/Xlsx/SharedFormula.php` | `class SharedFormula` |  |  | missing | src/io/xlsx/shared-formula.ts |
| `php-src/src/PhpSpreadsheet/Reader/Xlsx/SheetViewOptions.php` | `class SheetViewOptions` |  |  | missing | src/io/xlsx/sheet-view-options.ts |
| `php-src/src/PhpSpreadsheet/Reader/Xlsx/SheetViews.php` | `class SheetViews` |  |  | missing | src/io/xlsx/sheet-views.ts |
| `php-src/src/PhpSpreadsheet/Reader/Xlsx/Styles.php` | `class Styles` | `src/io/xlsx/styles.ts` | `class Styles` | matched | src/io/xlsx/styles.ts |
| `php-src/src/PhpSpreadsheet/Reader/Xlsx/TableReader.php` | `class TableReader` |  |  | missing | src/io/xlsx/table-reader.ts |
| `php-src/src/PhpSpreadsheet/Reader/Xlsx/Theme.php` | `class Theme` | `src/io/xlsx/theme.ts` | `class Theme` | matched | src/io/xlsx/theme.ts |
| `php-src/src/PhpSpreadsheet/Reader/Xlsx/WorkbookView.php` | `class WorkbookView` |  |  | missing | src/io/xlsx/workbook-view.ts |
