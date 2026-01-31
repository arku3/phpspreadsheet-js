# PHP vs TS Parity Map: Writer

| PHP file | PHP symbol | TS match (exists) | TS symbols | Status | TS candidates (first 5) |
|---|---|---|---|---|---|
| `php-src/src/PhpSpreadsheet/Writer/BaseWriter.php` | `class BaseWriter` |  |  | missing | src/io/base-writer/base-writer.ts<br>src/io/base-writer.ts |
| `php-src/src/PhpSpreadsheet/Writer/Csv.php` | `class Csv` |  |  | missing | src/io/csv/csv.ts<br>src/io/csv.ts |
| `php-src/src/PhpSpreadsheet/Writer/Exception.php` | `class Exception` |  |  | missing | src/io/exception/exception.ts<br>src/io/exception.ts |
| `php-src/src/PhpSpreadsheet/Writer/Html.php` | `class Html` |  |  | missing | src/io/html/html.ts<br>src/io/html.ts |
| `php-src/src/PhpSpreadsheet/Writer/IWriter.php` | `interface IWriter` | `src/io/i-writer.ts` | `interface IWriter` | matched | src/io/i-writer/i-writer.ts<br>src/io/i-writer.ts |
| `php-src/src/PhpSpreadsheet/Writer/Ods.php` | `class Ods` |  |  | missing | src/io/ods/ods.ts<br>src/io/ods.ts |
| `php-src/src/PhpSpreadsheet/Writer/Ods/AutoFilters.php` | `class AutoFilters` |  |  | missing | src/io/ods/auto-filters/auto-filters.ts<br>src/io/auto-filters.ts |
| `php-src/src/PhpSpreadsheet/Writer/Ods/Cell/Comment.php` | `class Comment` |  |  | missing | src/io/ods/cell/comment/comment.ts<br>src/io/comment.ts |
| `php-src/src/PhpSpreadsheet/Writer/Ods/Cell/Style.php` | `class Style` |  |  | missing | src/io/ods/cell/style/style.ts<br>src/io/style.ts |
| `php-src/src/PhpSpreadsheet/Writer/Ods/Content.php` | `class Content` |  |  | missing | src/io/ods/content/content.ts<br>src/io/content.ts |
| `php-src/src/PhpSpreadsheet/Writer/Ods/Formula.php` | `class Formula` |  |  | missing | src/io/ods/formula/formula.ts<br>src/io/formula.ts |
| `php-src/src/PhpSpreadsheet/Writer/Ods/Meta.php` | `class Meta` |  |  | missing | src/io/ods/meta/meta.ts<br>src/io/meta.ts |
| `php-src/src/PhpSpreadsheet/Writer/Ods/MetaInf.php` | `class MetaInf` |  |  | missing | src/io/ods/meta-inf/meta-inf.ts<br>src/io/meta-inf.ts |
| `php-src/src/PhpSpreadsheet/Writer/Ods/Mimetype.php` | `class Mimetype` |  |  | missing | src/io/ods/mimetype/mimetype.ts<br>src/io/mimetype.ts |
| `php-src/src/PhpSpreadsheet/Writer/Ods/NamedExpressions.php` | `class NamedExpressions` |  |  | missing | src/io/ods/named-expressions/named-expressions.ts<br>src/io/named-expressions.ts |
| `php-src/src/PhpSpreadsheet/Writer/Ods/Settings.php` | `class Settings` |  |  | missing | src/io/ods/settings/settings.ts<br>src/io/settings.ts |
| `php-src/src/PhpSpreadsheet/Writer/Ods/Styles.php` | `class Styles` |  |  | missing | src/io/ods/styles/styles.ts<br>src/io/styles.ts |
| `php-src/src/PhpSpreadsheet/Writer/Ods/Thumbnails.php` | `class Thumbnails` |  |  | missing | src/io/ods/thumbnails/thumbnails.ts<br>src/io/thumbnails.ts |
| `php-src/src/PhpSpreadsheet/Writer/Ods/WriterPart.php` | `class WriterPart` |  |  | missing | src/io/ods/writer-part/writer-part.ts<br>src/io/writer-part.ts |
| `php-src/src/PhpSpreadsheet/Writer/Pdf.php` | `class Pdf` |  |  | missing | src/io/pdf/pdf.ts<br>src/io/pdf.ts |
| `php-src/src/PhpSpreadsheet/Writer/Pdf/Dompdf.php` | `class Dompdf` |  |  | missing | src/io/pdf/dompdf/dompdf.ts<br>src/io/dompdf.ts |
| `php-src/src/PhpSpreadsheet/Writer/Pdf/Mpdf.php` | `class Mpdf` |  |  | missing | src/io/pdf/mpdf/mpdf.ts<br>src/io/mpdf.ts |
| `php-src/src/PhpSpreadsheet/Writer/Pdf/Tcpdf.php` | `class Tcpdf` |  |  | missing | src/io/pdf/tcpdf/tcpdf.ts<br>src/io/tcpdf.ts |
| `php-src/src/PhpSpreadsheet/Writer/Pdf/TcpdfNoDie.php` | `class TcpdfNoDie` |  |  | missing | src/io/pdf/tcpdf-no-die/tcpdf-no-die.ts<br>src/io/tcpdf-no-die.ts |
| `php-src/src/PhpSpreadsheet/Writer/Xls.php` | `class Xls` |  |  | missing | src/io/xls/xls.ts<br>src/io/xls.ts |
| `php-src/src/PhpSpreadsheet/Writer/Xls/BIFFwriter.php` | `class BIFFwriter` |  |  | missing | src/io/xls/bif-fwriter/bif-fwriter.ts<br>src/io/bif-fwriter.ts |
| `php-src/src/PhpSpreadsheet/Writer/Xls/CellDataValidation.php` | `class CellDataValidation` |  |  | missing | src/io/xls/cell-data-validation/cell-data-validation.ts<br>src/io/cell-data-validation.ts |
| `php-src/src/PhpSpreadsheet/Writer/Xls/ConditionalHelper.php` | `class ConditionalHelper` |  |  | missing | src/io/xls/conditional-helper/conditional-helper.ts<br>src/io/conditional-helper.ts |
| `php-src/src/PhpSpreadsheet/Writer/Xls/ErrorCode.php` | `class ErrorCode` |  |  | missing | src/io/xls/error-code/error-code.ts<br>src/io/error-code.ts |
| `php-src/src/PhpSpreadsheet/Writer/Xls/Escher.php` | `class Escher` |  |  | missing | src/io/xls/escher/escher.ts<br>src/io/escher.ts |
| `php-src/src/PhpSpreadsheet/Writer/Xls/Font.php` | `class Font` |  |  | missing | src/io/xls/font/font.ts<br>src/io/font.ts |
| `php-src/src/PhpSpreadsheet/Writer/Xls/Parser.php` | `class Parser` |  |  | missing | src/io/xls/parser/parser.ts<br>src/io/parser.ts |
| `php-src/src/PhpSpreadsheet/Writer/Xls/Style/CellAlignment.php` | `class CellAlignment` |  |  | missing | src/io/xls/style/cell-alignment/cell-alignment.ts<br>src/io/cell-alignment.ts |
| `php-src/src/PhpSpreadsheet/Writer/Xls/Style/CellBorder.php` | `class CellBorder` |  |  | missing | src/io/xls/style/cell-border/cell-border.ts<br>src/io/cell-border.ts |
| `php-src/src/PhpSpreadsheet/Writer/Xls/Style/CellFill.php` | `class CellFill` |  |  | missing | src/io/xls/style/cell-fill/cell-fill.ts<br>src/io/cell-fill.ts |
| `php-src/src/PhpSpreadsheet/Writer/Xls/Workbook.php` | `class Workbook` |  |  | missing | src/io/xls/workbook/workbook.ts<br>src/io/workbook.ts |
| `php-src/src/PhpSpreadsheet/Writer/Xls/Worksheet.php` | `class Worksheet` |  |  | missing | src/io/xls/worksheet/worksheet.ts<br>src/io/worksheet.ts |
| `php-src/src/PhpSpreadsheet/Writer/Xls/Xf.php` | `class Xf` |  |  | missing | src/io/xls/xf/xf.ts<br>src/io/xf.ts |
| `php-src/src/PhpSpreadsheet/Writer/Xlsx.php` | `class Xlsx` | `src/io/xlsx-writer.ts` | `class XlsxWriter` | matched | src/io/xlsx-writer.ts |
| `php-src/src/PhpSpreadsheet/Writer/Xlsx/AutoFilter.php` | `class AutoFilter` |  |  | missing | src/io/xlsx/auto-filter.ts<br>src/io/xlsx/auto-filter.ts |
| `php-src/src/PhpSpreadsheet/Writer/Xlsx/Chart.php` | `class Chart` |  |  | missing | src/io/xlsx/chart.ts<br>src/io/xlsx/chart.ts |
| `php-src/src/PhpSpreadsheet/Writer/Xlsx/Comments.php` | `class Comments` | `src/io/xlsx/comments.ts`<br>`src/io/xlsx/comments.ts` | `class Comments` | ambiguous | src/io/xlsx/comments.ts<br>src/io/xlsx/comments.ts |
| `php-src/src/PhpSpreadsheet/Writer/Xlsx/ContentTypes.php` | `class ContentTypes` | `src/io/xlsx/content-types.ts`<br>`src/io/xlsx/content-types.ts` | `class ContentTypes` | ambiguous | src/io/xlsx/content-types.ts<br>src/io/xlsx/content-types.ts |
| `php-src/src/PhpSpreadsheet/Writer/Xlsx/DefinedNames.php` | `class DefinedNames` |  |  | missing | src/io/xlsx/defined-names.ts<br>src/io/xlsx/defined-names.ts |
| `php-src/src/PhpSpreadsheet/Writer/Xlsx/DocProps.php` | `class DocProps` | `src/io/xlsx/doc-props.ts`<br>`src/io/xlsx/doc-props.ts` | `class DocProps` | ambiguous | src/io/xlsx/doc-props.ts<br>src/io/xlsx/doc-props.ts |
| `php-src/src/PhpSpreadsheet/Writer/Xlsx/Drawing.php` | `class Drawing` |  |  | missing | src/io/xlsx/drawing.ts<br>src/io/xlsx/drawing.ts |
| `php-src/src/PhpSpreadsheet/Writer/Xlsx/FeaturePropertyBag.php` | `class FeaturePropertyBag` |  |  | missing | src/io/xlsx/feature-property-bag.ts<br>src/io/xlsx/feature-property-bag.ts |
| `php-src/src/PhpSpreadsheet/Writer/Xlsx/FunctionPrefix.php` | `class FunctionPrefix` |  |  | missing | src/io/xlsx/function-prefix.ts<br>src/io/xlsx/function-prefix.ts |
| `php-src/src/PhpSpreadsheet/Writer/Xlsx/Metadata.php` | `class Metadata` |  |  | missing | src/io/xlsx/metadata.ts<br>src/io/xlsx/metadata.ts |
| `php-src/src/PhpSpreadsheet/Writer/Xlsx/Rels.php` | `class Rels` | `src/io/xlsx/rels.ts`<br>`src/io/xlsx/rels.ts` | `class Rels` | ambiguous | src/io/xlsx/rels.ts<br>src/io/xlsx/rels.ts |
| `php-src/src/PhpSpreadsheet/Writer/Xlsx/RelsRibbon.php` | `class RelsRibbon` |  |  | missing | src/io/xlsx/rels-ribbon.ts<br>src/io/xlsx/rels-ribbon.ts |
| `php-src/src/PhpSpreadsheet/Writer/Xlsx/RelsVBA.php` | `class RelsVBA` |  |  | missing | src/io/xlsx/rels-vba.ts<br>src/io/xlsx/rels-vba.ts |
| `php-src/src/PhpSpreadsheet/Writer/Xlsx/RichDataDrawing.php` | `class RichDataDrawing` |  |  | missing | src/io/xlsx/rich-data-drawing.ts<br>src/io/xlsx/rich-data-drawing.ts |
| `php-src/src/PhpSpreadsheet/Writer/Xlsx/StringTable.php` | `class StringTable` | `src/io/xlsx/string-table.ts`<br>`src/io/xlsx/string-table.ts` | `class StringTable` | ambiguous | src/io/xlsx/string-table.ts<br>src/io/xlsx/string-table.ts |
| `php-src/src/PhpSpreadsheet/Writer/Xlsx/Style.php` | `class Style` |  |  | missing | src/io/xlsx/style.ts<br>src/io/xlsx/style.ts |
| `php-src/src/PhpSpreadsheet/Writer/Xlsx/Table.php` | `class Table` |  |  | missing | src/io/xlsx/table.ts<br>src/io/xlsx/table.ts |
| `php-src/src/PhpSpreadsheet/Writer/Xlsx/Theme.php` | `class Theme` | `src/io/xlsx/theme.ts`<br>`src/io/xlsx/theme.ts` | `class Theme` | ambiguous | src/io/xlsx/theme.ts<br>src/io/xlsx/theme.ts |
| `php-src/src/PhpSpreadsheet/Writer/Xlsx/Workbook.php` | `class Workbook` | `src/io/xlsx/workbook.ts`<br>`src/io/xlsx/workbook.ts` | `class Workbook` | ambiguous | src/io/xlsx/workbook.ts<br>src/io/xlsx/workbook.ts |
| `php-src/src/PhpSpreadsheet/Writer/Xlsx/Worksheet.php` | `class Worksheet` | `src/io/xlsx/worksheet.ts`<br>`src/io/xlsx/worksheet.ts` | `class Worksheet` | ambiguous | src/io/xlsx/worksheet.ts<br>src/io/xlsx/worksheet.ts |
| `php-src/src/PhpSpreadsheet/Writer/Xlsx/WriterPart.php` | `class WriterPart` | `src/io/xlsx/writer-part.ts`<br>`src/io/xlsx/writer-part.ts` |  | ambiguous | src/io/xlsx/writer-part.ts<br>src/io/xlsx/writer-part.ts |
| `php-src/src/PhpSpreadsheet/Writer/ZipStream0.php` | `class ZipStream0` |  |  | missing | src/io/zip-stream0/zip-stream0.ts<br>src/io/zip-stream0.ts |
| `php-src/src/PhpSpreadsheet/Writer/ZipStream2.php` | `class ZipStream2` |  |  | missing | src/io/zip-stream2/zip-stream2.ts<br>src/io/zip-stream2.ts |
| `php-src/src/PhpSpreadsheet/Writer/ZipStream3.php` | `class ZipStream3` |  |  | missing | src/io/zip-stream3/zip-stream3.ts<br>src/io/zip-stream3.ts |
