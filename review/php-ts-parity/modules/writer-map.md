# PHP vs TS Parity Map: Writer

| PHP file | PHP symbol | TS match (exists) | TS symbols | Status | TS candidates (first 5) |
|---|---|---|---|---|---|
| `php-src/src/PhpSpreadsheet/Writer/BaseWriter.php` | `class BaseWriter` |  |  | missing | src/io/base-writer/base-writer.ts<br>src/io/base-writer.ts |
| `php-src/src/PhpSpreadsheet/Writer/Exception.php` | `class Exception` |  |  | missing | src/io/exception/exception.ts<br>src/io/exception.ts |
| `php-src/src/PhpSpreadsheet/Writer/IWriter.php` | `interface IWriter` | `src/io/i-writer.ts` | `interface IWriter` | matched | src/io/i-writer/i-writer.ts<br>src/io/i-writer.ts |
| `php-src/src/PhpSpreadsheet/Writer/Xlsx.php` | `class Xlsx` | `src/io/xlsx-writer.ts` | `class XlsxWriter` | matched | src/io/xlsx-writer.ts |
| `php-src/src/PhpSpreadsheet/Writer/Xlsx/AutoFilter.php` | `class AutoFilter` |  |  | missing | src/io/xlsx/auto-filter.ts |
| `php-src/src/PhpSpreadsheet/Writer/Xlsx/Chart.php` | `class Chart` |  |  | missing | src/io/xlsx/chart.ts |
| `php-src/src/PhpSpreadsheet/Writer/Xlsx/Comments.php` | `class Comments` | `src/io/xlsx/comments.ts` | `class Comments` | matched | src/io/xlsx/comments.ts |
| `php-src/src/PhpSpreadsheet/Writer/Xlsx/ContentTypes.php` | `class ContentTypes` | `src/io/xlsx/content-types.ts` | `class ContentTypes` | matched | src/io/xlsx/content-types.ts |
| `php-src/src/PhpSpreadsheet/Writer/Xlsx/DefinedNames.php` | `class DefinedNames` |  |  | missing | src/io/xlsx/defined-names.ts |
| `php-src/src/PhpSpreadsheet/Writer/Xlsx/DocProps.php` | `class DocProps` | `src/io/xlsx/doc-props.ts` | `class DocProps` | matched | src/io/xlsx/doc-props.ts |
| `php-src/src/PhpSpreadsheet/Writer/Xlsx/Drawing.php` | `class Drawing` |  |  | missing | src/io/xlsx/drawing.ts |
| `php-src/src/PhpSpreadsheet/Writer/Xlsx/FeaturePropertyBag.php` | `class FeaturePropertyBag` |  |  | missing | src/io/xlsx/feature-property-bag.ts |
| `php-src/src/PhpSpreadsheet/Writer/Xlsx/FunctionPrefix.php` | `class FunctionPrefix` |  |  | missing | src/io/xlsx/function-prefix.ts |
| `php-src/src/PhpSpreadsheet/Writer/Xlsx/Metadata.php` | `class Metadata` |  |  | missing | src/io/xlsx/metadata.ts |
| `php-src/src/PhpSpreadsheet/Writer/Xlsx/Rels.php` | `class Rels` | `src/io/xlsx/rels.ts` | `class Rels` | matched | src/io/xlsx/rels.ts |
| `php-src/src/PhpSpreadsheet/Writer/Xlsx/RelsRibbon.php` | `class RelsRibbon` |  |  | missing | src/io/xlsx/rels-ribbon.ts |
| `php-src/src/PhpSpreadsheet/Writer/Xlsx/RelsVBA.php` | `class RelsVBA` |  |  | missing | src/io/xlsx/rels-vba.ts |
| `php-src/src/PhpSpreadsheet/Writer/Xlsx/RichDataDrawing.php` | `class RichDataDrawing` |  |  | missing | src/io/xlsx/rich-data-drawing.ts |
| `php-src/src/PhpSpreadsheet/Writer/Xlsx/StringTable.php` | `class StringTable` | `src/io/xlsx/string-table.ts` | `class StringTable` | matched | src/io/xlsx/string-table.ts |
| `php-src/src/PhpSpreadsheet/Writer/Xlsx/Style.php` | `class Style` |  |  | missing | src/io/xlsx/style.ts |
| `php-src/src/PhpSpreadsheet/Writer/Xlsx/Table.php` | `class Table` |  |  | missing | src/io/xlsx/table.ts |
| `php-src/src/PhpSpreadsheet/Writer/Xlsx/Theme.php` | `class Theme` | `src/io/xlsx/theme.ts` | `class Theme` | matched | src/io/xlsx/theme.ts |
| `php-src/src/PhpSpreadsheet/Writer/Xlsx/Workbook.php` | `class Workbook` | `src/io/xlsx/workbook.ts` | `class Workbook` | matched | src/io/xlsx/workbook.ts |
| `php-src/src/PhpSpreadsheet/Writer/Xlsx/Worksheet.php` | `class Worksheet` | `src/io/xlsx/worksheet.ts` | `class Worksheet` | matched | src/io/xlsx/worksheet.ts |
| `php-src/src/PhpSpreadsheet/Writer/Xlsx/WriterPart.php` | `class WriterPart` | `src/io/xlsx/writer-part.ts` |  | matched | src/io/xlsx/writer-part.ts |
| `php-src/src/PhpSpreadsheet/Writer/ZipStream0.php` | `class ZipStream0` |  |  | missing | src/io/zip-stream0/zip-stream0.ts<br>src/io/zip-stream0.ts |
| `php-src/src/PhpSpreadsheet/Writer/ZipStream2.php` | `class ZipStream2` |  |  | missing | src/io/zip-stream2/zip-stream2.ts<br>src/io/zip-stream2.ts |
| `php-src/src/PhpSpreadsheet/Writer/ZipStream3.php` | `class ZipStream3` |  |  | missing | src/io/zip-stream3/zip-stream3.ts<br>src/io/zip-stream3.ts |
