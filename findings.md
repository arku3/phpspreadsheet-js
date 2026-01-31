# Findings - Parity Review (TS vs PHP)

## Current Gaps (Highest Priority)

## 1. Memory & Disposal
- **Cell/Worksheet disconnect**: Implemented `Worksheet.disconnectCells()` / `Spreadsheet.disconnectWorksheets()` cycle breaking; keep extending as new backrefs (drawings/charts) are added.

## 2. I/O Module (XLSX)
- **Drawings / Images**: Worksheet drawings/images (DrawingML) read/write is implemented (classic images).
- **Charts**: Embedded charts read/write is implemented at a minimal level (relationship chain + basic metadata); chart feature parity is still incomplete.
- **Comments**: Classic comments/notes read/write is implemented. Threaded comments are not implemented.
- **VML pass-through**: If a worksheet contains legacy VML shapes that are not notes, round-trip preservation is not fully implemented.

## 3. Calculation Module
- **Function coverage**: Major categories exist, but there are still many Excel functions missing vs PhpSpreadsheet.
- **Edge-case parity**: Continue aligning function semantics and error propagation to PhpSpreadsheet.

## 4. Performance & Scalability
- **Cell caching**: Pluggable caching for large datasets remains unimplemented.
