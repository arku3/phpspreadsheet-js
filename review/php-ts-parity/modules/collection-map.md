# PHP vs TS Parity Map: Collection

| PHP file | PHP symbol | TS match (exists) | TS symbols | Status | TS candidates (first 5) |
|---|---|---|---|---|---|
| `php-src/src/PhpSpreadsheet/Collection/Cells.php` | `class Cells` | `src/core/cell-collection.ts` | `class CellCollection` | matched | src/core/cell-collection.ts |
| `php-src/src/PhpSpreadsheet/Collection/CellsFactory.php` | `class CellsFactory` |  |  | missing | src/common/cells-factory/cells-factory.ts<br>src/core/cells-factory/cells-factory.ts<br>src/common/cells-factory.ts<br>src/core/cells-factory.ts |
| `php-src/src/PhpSpreadsheet/Collection/Memory/SimpleCache1.php` | `class SimpleCache1` |  |  | missing | src/common/memory/simple-cache1/simple-cache1.ts<br>src/core/memory/simple-cache1/simple-cache1.ts<br>src/common/simple-cache1.ts<br>src/core/simple-cache1.ts |
| `php-src/src/PhpSpreadsheet/Collection/Memory/SimpleCache3.php` | `class SimpleCache3` |  |  | missing | src/common/memory/simple-cache3/simple-cache3.ts<br>src/core/memory/simple-cache3/simple-cache3.ts<br>src/common/simple-cache3.ts<br>src/core/simple-cache3.ts |
