# Cell Caching - Research Findings

**Session:** cell-caching-impl-2026-02-02  
**Phase:** Research

## PhpSpreadsheet Caching Investigation

### PhpSpreadsheet Approach
- Uses `Cells` class with configurable `cache` property
- Default: `Memory` cache (PHP arrays)
- Alternative: `APCu`, `Redis`, `Memcache` adapters
- Interface: `CacheInterface` with `get()`, `set()`, `delete()`, `clear()`

### Key Insights from PhpSpreadsheet
1. **Cell Coordinate Index**: Maintains separate index of populated cells for iteration
2. **Lazy Loading**: Cache adapter handles serialization transparently
3. **Batch Operations**: No native batch support - loops over individual cells
4. **Memory Management**: Relies on PHP garbage collection

## Current phpspreadsheet-js Implementation

### CellCollection (src/core/cell-collection.ts)
- Uses native JavaScript `Map<string, Cell>`
- Stores all cells in memory
- No eviction strategy
- Coordinate-based lookup: O(1)
- Memory grows linearly with cell count

### Cell Structure (src/core/cell.ts)
```typescript
class Cell {
  #value: CellValue
  #calculatedValue: unknown
  #formula: string | null
  #style: CellStyle | null
  #dataType: DataType
  #worksheet: Worksheet
}
```

### Worksheet Integration
- CellCollection owned by Worksheet
- Direct access via `worksheet.getCell()`
- No abstraction layer for storage

## Cache Strategy Options

### Option 1: Synchronous Interface (Recommended for v1)
- **Pros**: Simple, backward compatible, no async/await changes needed
- **Cons**: Blocking I/O for FileSystem/Redis caches
- **Use Case**: Most spreadsheet operations are synchronous

### Option 2: Asynchronous Interface
- **Pros**: Non-blocking I/O, better for external caches
- **Cons**: Breaking change to all cell access code
- **Use Case**: Server-side processing with Redis

### Decision: Start with sync, add async adapter later

## Serialization Benchmark Candidates

1. **JSON**: Native, readable, ~2x storage overhead
2. **MessagePack**: Binary, compact, fast, requires library
3. **BSON**: Binary JSON, MongoDB compatible
4. **V8 Serialize**: Bun/Node native, fast but Node-specific

## Recommended Cell Batch Size

Based on typical spreadsheet access patterns:
- **Read batch**: 1000 cells (common range operations)
- **Write batch**: 100-500 cells (formula fills)
- **Cache line**: 64-256 cells (spatial locality)

## Memory Estimation

Typical cell memory footprint:
- Empty cell: ~200 bytes (object overhead)
- Number cell: ~250 bytes
- String cell: ~300 bytes + string length
- Formula cell: ~400 bytes + formula length

**1 million cells**: ~250-400 MB (rough estimate)

## Research Conclusions

1. **Interface**: Synchronous first, extensible to async
2. **Default**: MemoryCache (current behavior, zero overhead)
3. **LRU**: Size-based eviction (cell count, not memory bytes)
4. **Serialization**: JSON for v1 (simplicity), MessagePack for v2
5. **Batching**: Implement batch operations for efficiency
6. **Integration**: Refactor CellCollection to use strategy pattern

## Next Steps

Proceed to Stakeholder Interview phase to validate assumptions.
