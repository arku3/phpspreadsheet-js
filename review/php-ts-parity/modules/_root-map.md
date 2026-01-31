# PHP vs TS Parity Map: _root

| PHP file | PHP symbol | TS match (exists) | TS symbols | Status | TS candidates (first 5) |
|---|---|---|---|---|---|
| `php-src/src/PhpSpreadsheet/CellReferenceHelper.php` | `class CellReferenceHelper` |  |  | missing | src/core/cell-reference-helper.ts<br>src/utils/cell-reference-helper.ts<br>src/shared/cell-reference-helper.ts<br>src/common/cell-reference-helper.ts<br>src/worksheet/cell-reference-helper.ts |
| `php-src/src/PhpSpreadsheet/Comment.php` | `class Comment` | `src/core/comment.ts` | `class Comment`<br>`interface CommentPosition` | matched | src/core/comment.ts |
| `php-src/src/PhpSpreadsheet/DefinedName.php` | `class DefinedName` | `src/core/defined-name.ts` |  | matched | src/core/defined-name.ts |
| `php-src/src/PhpSpreadsheet/Exception.php` | `class Exception` |  |  | missing | src/core/errors.ts |
| `php-src/src/PhpSpreadsheet/HashTable.php` | `class HashTable` | `src/common/hash-table.ts` | `class HashTable` | matched | src/common/hash-table.ts |
| `php-src/src/PhpSpreadsheet/IComparable.php` | `interface IComparable` |  |  | missing | src/core/i-comparable.ts<br>src/utils/i-comparable.ts<br>src/shared/i-comparable.ts<br>src/common/i-comparable.ts<br>src/worksheet/i-comparable.ts |
| `php-src/src/PhpSpreadsheet/IOFactory.php` | `class IOFactory` |  |  | missing | src/io/io-factory.ts |
| `php-src/src/PhpSpreadsheet/NamedFormula.php` | `class NamedFormula` |  |  | missing | src/core/named-formula.ts |
| `php-src/src/PhpSpreadsheet/NamedRange.php` | `class NamedRange` | `src/core/named-range.ts` | `class NamedRange` | matched | src/core/named-range.ts |
| `php-src/src/PhpSpreadsheet/ReferenceHelper.php` | `class ReferenceHelper` |  |  | missing | src/core/reference-helper.ts<br>src/utils/reference-helper.ts<br>src/shared/reference-helper.ts<br>src/common/reference-helper.ts<br>src/worksheet/reference-helper.ts |
| `php-src/src/PhpSpreadsheet/Settings.php` | `class Settings` |  |  | missing | src/core/settings.ts<br>src/core/spreadsheet-settings.ts |
| `php-src/src/PhpSpreadsheet/Spreadsheet.php` | `class Spreadsheet` | `src/core/spreadsheet.ts` | `class Spreadsheet` | matched | src/core/spreadsheet.ts |
| `php-src/src/PhpSpreadsheet/Theme.php` | `class Theme` | `src/style/theme.ts` | `class Theme` | matched | src/style/theme.ts |
