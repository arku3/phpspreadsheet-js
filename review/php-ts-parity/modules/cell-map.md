# PHP vs TS Parity Map: Cell

| PHP file | PHP symbol | TS match (exists) | TS symbols | Status | TS candidates (first 5) |
|---|---|---|---|---|---|
| `php-src/src/PhpSpreadsheet/Cell/AddressHelper.php` | `class AddressHelper` |  |  | missing | src/core/address-helper/address-helper.ts<br>src/utils/address-helper/address-helper.ts<br>src/core/address-helper.ts<br>src/utils/address-helper.ts |
| `php-src/src/PhpSpreadsheet/Cell/AddressRange.php` | `interface AddressRange` |  |  | missing | src/core/address-range/address-range.ts<br>src/utils/address-range/address-range.ts<br>src/core/address-range.ts<br>src/utils/address-range.ts |
| `php-src/src/PhpSpreadsheet/Cell/AdvancedValueBinder.php` | `class AdvancedValueBinder` | `src/core/advanced-value-binder.ts` | `class AdvancedValueBinder` | matched | src/core/advanced-value-binder/advanced-value-binder.ts<br>src/utils/advanced-value-binder/advanced-value-binder.ts<br>src/core/advanced-value-binder.ts<br>src/utils/advanced-value-binder.ts |
| `php-src/src/PhpSpreadsheet/Cell/Cell.php` | `class Cell` | `src/core/cell.ts` | `class Cell`<br>`const DataType`<br>`type TDataType` | matched | src/core/cell.ts |
| `php-src/src/PhpSpreadsheet/Cell/CellAddress.php` | `class CellAddress` |  |  | missing | src/core/cell-address/cell-address.ts<br>src/utils/cell-address/cell-address.ts<br>src/core/cell-address.ts<br>src/utils/cell-address.ts |
| `php-src/src/PhpSpreadsheet/Cell/CellRange.php` | `class CellRange` |  |  | missing | src/core/cell-range/cell-range.ts<br>src/utils/cell-range/cell-range.ts<br>src/core/cell-range.ts<br>src/utils/cell-range.ts |
| `php-src/src/PhpSpreadsheet/Cell/ColumnRange.php` | `class ColumnRange` |  |  | missing | src/core/column-range/column-range.ts<br>src/utils/column-range/column-range.ts<br>src/core/column-range.ts<br>src/utils/column-range.ts |
| `php-src/src/PhpSpreadsheet/Cell/Coordinate.php` | `class Coordinate` | `src/utils/coordinate.ts` | `class Coordinate` | matched | src/utils/coordinate.ts |
| `php-src/src/PhpSpreadsheet/Cell/DataType.php` | `class DataType` |  |  | missing | src/core/data-type.ts |
| `php-src/src/PhpSpreadsheet/Cell/DataValidation.php` | `class DataValidation` | `src/core/data-validation.ts` | `class DataValidation` | matched | src/core/data-validation.ts |
| `php-src/src/PhpSpreadsheet/Cell/DataValidator.php` | `class DataValidator` |  |  | missing | src/core/data-validator/data-validator.ts<br>src/utils/data-validator/data-validator.ts<br>src/core/data-validator.ts<br>src/utils/data-validator.ts |
| `php-src/src/PhpSpreadsheet/Cell/DefaultValueBinder.php` | `class DefaultValueBinder` | `src/core/default-value-binder.ts` | `class DefaultValueBinder` | matched | src/core/default-value-binder/default-value-binder.ts<br>src/utils/default-value-binder/default-value-binder.ts<br>src/core/default-value-binder.ts<br>src/utils/default-value-binder.ts |
| `php-src/src/PhpSpreadsheet/Cell/Hyperlink.php` | `class Hyperlink` | `src/core/hyperlink.ts` | `class Hyperlink` | matched | src/core/hyperlink.ts |
| `php-src/src/PhpSpreadsheet/Cell/IgnoredErrors.php` | `class IgnoredErrors` |  |  | missing | src/core/ignored-errors/ignored-errors.ts<br>src/utils/ignored-errors/ignored-errors.ts<br>src/core/ignored-errors.ts<br>src/utils/ignored-errors.ts |
| `php-src/src/PhpSpreadsheet/Cell/IValueBinder.php` | `interface IValueBinder` | `src/core/i-value-binder.ts` | `interface IValueBinder` | matched | src/core/i-value-binder/i-value-binder.ts<br>src/utils/i-value-binder/i-value-binder.ts<br>src/core/i-value-binder.ts<br>src/utils/i-value-binder.ts |
| `php-src/src/PhpSpreadsheet/Cell/RowRange.php` | `class RowRange` |  |  | missing | src/core/row-range/row-range.ts<br>src/utils/row-range/row-range.ts<br>src/core/row-range.ts<br>src/utils/row-range.ts |
| `php-src/src/PhpSpreadsheet/Cell/StringValueBinder.php` | `class StringValueBinder` |  |  | missing | src/core/string-value-binder/string-value-binder.ts<br>src/utils/string-value-binder/string-value-binder.ts<br>src/core/string-value-binder.ts<br>src/utils/string-value-binder.ts |
