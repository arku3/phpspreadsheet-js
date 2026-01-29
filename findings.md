# Findings - Parity Review (TS vs PHP)

## 1. Style Module
- **Font**: Missing theme-specific properties (Latin, EastAsian, etc.).
- **NumberFormat**: Missing `toFormattedString` rendering engine. Currently only a data container.
- **Color**: `setTint` removed for I/O parity, but PHP maintains it internally.

## 2. Core Module
- **Worksheet**: Missing `getHighestRow`/`getHighestColumn` and row/column manipulation (insert/delete).
- **Cell**: Missing merged cell state (`isInMergeRange`), data validation, and hyperlinks.
- **Memory**: Circular reference management (PHP `disconnect` logic) is absent in TS.

## 3. I/O Module (XLSX Writer)
- **Missing Parts**: Charts, Drawings, Tables, and Comments are not implemented.
- **Shared Strings**: Missing control character sanitization (`controlCharacterPHP2OOXML`).
- **Extensibility**: Relationship IDs are hardcoded, making it difficult to add new parts.

## 4. Calculation Module
- **Engine**: Parser and Tokenizer are high-parity.
- **Functions**: Only ~15% coverage (Core subset). Missing ~300+ functions (Financial, Engineering, Statistical).
