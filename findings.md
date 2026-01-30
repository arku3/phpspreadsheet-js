# Findings - Parity Review (TS vs PHP)

## Current Gaps (Highest Priority)

## 1. Memory & Disposal
- **Cell/Worksheet disconnect**: Circular reference breaking is still incomplete (need `disconnectCells()` and wiring through disposal paths).

## 2. I/O Module (XLSX)
- **Drawings / Images**: Worksheet drawings and images are not implemented.
- **Charts**: Not implemented.
- **Comments**: Classic comments/notes read/write is implemented. Threaded comments are not implemented.
- **VML pass-through**: If a worksheet contains legacy VML shapes that are not notes, round-trip preservation is not fully implemented.

## 3. Calculation Module
- **Function coverage**: Major categories exist, but there are still many Excel functions missing vs PhpSpreadsheet.
- **Edge-case parity**: Continue aligning function semantics and error propagation to PhpSpreadsheet.

## 4. Performance & Scalability
- **Cell caching**: Pluggable caching for large datasets remains unimplemented.
