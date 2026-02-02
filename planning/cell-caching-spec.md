# Cell Caching System - Design Specification

## Overview
Implement a pluggable cell caching system for phpspreadsheet-js to handle large datasets that exceed available memory. The system should be transparent to users while providing configurable caching strategies.

## Requirements

### Core Requirements
1. **Pluggable Architecture**: Support multiple cache implementations
   - In-memory cache (current default behavior)
   - LRU cache with configurable size limits
   - External cache (filesystem, Redis)
   - Memory-mapped storage

2. **Transparent Interface**: Cell access API remains unchanged
   - Worksheets still access cells via `getCell()`, `setCell()`
   - Caching happens transparently behind CellCollection
   - No breaking changes to existing code

3. **Configurable Strategy**: Users can specify caching approach
   - Global default per Spreadsheet instance
   - Per-Worksheet override capability
   - Runtime configuration changes

4. **Performance Optimizations**
   - Batch loading/saving to minimize I/O
   - Predictive prefetching for sequential access patterns
   - Lazy evaluation for computed values
   - Compression for serialized cell data

### Cache Interface Design

```typescript
interface CellCache {
  get(coordinate: string): Cell | undefined | Promise<Cell | undefined>;
  set(coordinate: string, cell: Cell): void | Promise<void>;
  has(coordinate: string): boolean | Promise<boolean>;
  delete(coordinate: string): void | Promise<void>;
  keys(): IterableIterator<string> | Promise<IterableIterator<string>>;
  values(): IterableIterator<Cell> | Promise<IterableIterator<Cell>>;
  size(): number | Promise<number>;
  clear(): void | Promise<void>;
  
  // Batch operations for efficiency
  getBatch(coordinates: string[]): (Cell | undefined)[] | Promise<(Cell | undefined)[]>;
  setBatch(entries: Array<[string, Cell]>): void | Promise<void>;
  
  // Lifecycle hooks
  flush?(): void | Promise<void>;
  close?(): void | Promise<void>;
}
```

### Cache Implementations

#### 1. MemoryCache (current behavior)
- Use native Map for storage
- No serialization overhead
- Fastest access for small datasets

#### 2. QuickLRUCache
- Least Recently Used eviction
- Configurable max size (cell count or memory bytes)
- Two-tier: hot cells in Map, cold cells in LRU
- Automatic overflow to secondary cache if configured

#### 3. FileSystemCache
- Serialize cells to temp files
- Directory structure: `<temp-dir>/<spreadsheet-id>/<worksheet-index>/<cell-coordinate>.cell`
- Use streaming for batch operations
- Cleanup on Spreadsheet disposal

#### 4. RedisCache (optional)
- External Redis server support
- Cluster-aware for horizontal scaling
- TTL support for automatic cleanup

### Integration Points

1. **CellCollection**: Refactor to use cache interface instead of direct Map
2. **Worksheet**: Add `setCacheStrategy()` method
3. **Spreadsheet**: Add global default cache configuration
4. **Cell Serialization**: Implement efficient binary or JSON serialization

### Use Cases

1. **Small Spreadsheets (< 100k cells)**: MemoryCache (default)
2. **Medium Spreadsheets (100k - 1M cells)**: QuickLRUCache with 50k hot cell limit
3. **Large Spreadsheets (1M+ cells)**: FileSystemCache with LRU front-end
4. **Distributed Processing**: RedisCache for shared state

### Performance Considerations

- Minimize serialization/deserialization overhead
- Use binary formats (MessagePack, BSON) for external caches
- Implement cell metadata caching separately from cell values
- Consider compression for storage (gzip, zstd)
- Batch operations for reading/writing ranges

### Testing Requirements

1. Unit tests for each cache implementation
2. Integration tests with various dataset sizes
3. Memory usage benchmarks
4. Performance benchmarks (read/write throughput)
5. Stress tests with concurrent access

### Migration Path

- Default behavior: MemoryCache (current Map implementation)
- Existing code works without changes
- Opt-in via `Spreadsheet.setDefaultCache()` or `Worksheet.setCacheStrategy()`
