# Cell Caching Implementation - Detailed Plan

**Session:** cell-caching-impl-2026-02-02  
**Status:** Planning Complete - Ready for Implementation

## Executive Summary

Implement a pluggable cell caching system that allows phpspreadsheet-js to efficiently handle spreadsheets from small (<1k cells) to very large (>10M cells). The system uses a strategy pattern with transparent API, starting with synchronous implementations for backward compatibility.

## Architecture Decisions

### 1. Interface Design: Synchronous with Async Extension Point
- **Primary Interface**: Synchronous (`get`, `set`, `delete`)
- **Future Extension**: Async adapter wrapper for external caches
- **Rationale**: Maintains backward compatibility; 95% of use cases are synchronous

### 2. Cache Implementations (Priority Order)
1. **MemoryCache** (P0): Refactor current Map implementation
2. **QuickLRUCache** (P1): Size-limited with eviction
3. **FileSystemCache** (P1): Disk-backed for very large datasets
4. **RedisCache** (P2): External distributed cache (future)

### 3. Serialization Strategy
- **In-Memory**: No serialization (fastest)
- **LRU**: Reference-based (no serialization)
- **FileSystem**: JSON with optional compression
- **Rationale**: JSON balances readability, portability, and performance

### 4. Integration Strategy
- CellCollection becomes a thin wrapper around cache strategy
- Default: MemoryCache (zero migration cost)
- Opt-in via `Worksheet.setCacheStrategy()`
- Global default via `Spreadsheet.setDefaultCacheStrategy()`

## Implementation Roadmap

### Phase 1: Interface & MemoryCache (Foundation)
**Estimated: 2-3 hours**

#### Tasks:
1. **Define CellCache Interface** (`src/caching/cell-cache.ts`)
   - Core methods: get, set, has, delete, clear
   - Batch methods: getBatch, setBatch
   - Lifecycle: flush (optional), close (optional)
   - Metadata: size, keys iterator

2. **Create MemoryCache Implementation** (`src/caching/memory-cache.ts`)
   - Refactor existing Map-based storage
   - Implement all CellCache methods
   - Zero serialization overhead
   - 100% backward compatible

3. **Update CellCollection** (`src/core/cell-collection.ts`)
   - Add `#cache: CellCache` private field
   - Default to MemoryCache in constructor
   - Add `setCacheStrategy()` method
   - Delegate all operations to cache

4. **Update Worksheet** (`src/core/worksheet.ts`)
   - Add `setCacheStrategy(strategy: CellCache)` method
   - Pass through to CellCollection
   - Document usage

5. **Tests** (`tests/caching/`)
   - CellCache interface compliance tests
   - MemoryCache unit tests
   - CellCollection integration tests
   - Backward compatibility tests

### Phase 2: QuickLRUCache (Eviction)
**Estimated: 3-4 hours**

#### Tasks:
1. **Implement QuickLRUCache** (`src/caching/quick-lru-cache.ts`)
   - Use Map for O(1) access
   - Track access order with linked list or timestamps
   - Configurable max size (cell count)
   - Eviction callback support

2. **Add Configuration Options**
   - `maxSize: number` - maximum cells to keep in memory
   - `onEviction?: (key: string, cell: Cell) => void` - callback

3. **Tests**
   - LRU eviction order tests
   - Size limit enforcement tests
   - Performance benchmarks vs MemoryCache

### Phase 3: FileSystemCache (Persistence)
**Estimated: 4-5 hours**

#### Tasks:
1. **Implement FileSystemCache** (`src/caching/filesystem-cache.ts`)
   - Directory structure: `<tempDir>/<spreadsheetId>/<worksheetId>/`
   - File naming: `<cellCoordinate>.json`
   - Lazy loading with in-memory index
   - Batch read/write operations

2. **Cell Serialization** (`src/caching/serialization.ts`)
   - `serializeCell(cell: Cell): string`
   - `deserializeCell(data: string, worksheet: Worksheet): Cell`
   - Handle all cell types (value, formula, style, metadata)
   - Compression option (gzip)

3. **LRU + FileSystem Hybrid** (`src/caching/tiered-cache.ts`)
   - Two-tier: hot cells in LRU, cold cells on disk
   - Automatic promotion/demotion
   - Configurable hot cache size

4. **Tests**
   - File system operations tests
   - Serialization round-trip tests
   - Tiered cache behavior tests
   - Cleanup on dispose tests

### Phase 4: Integration & Polish
**Estimated: 2-3 hours**

#### Tasks:
1. **Spreadsheet-Level Configuration**
   - `Spreadsheet.setDefaultCacheStrategy(strategy: CellCache)`
   - `Spreadsheet.setDefaultCacheOptions(options: CacheOptions)`

2. **Documentation**
   - API documentation for all cache implementations
   - Usage examples (small, medium, large datasets)
   - Performance tuning guide
   - Migration guide from default behavior

3. **Performance Benchmarks** (`benchmarks/caching/`)
   - Memory usage vs cell count
   - Read/write throughput
   - Comparison: MemoryCache vs QuickLRUCache vs FileSystemCache
   - Real-world spreadsheet scenarios

4. **Final Integration Tests**
   - End-to-end round-trip tests
   - Concurrent access tests
   - Error handling tests
   - Resource cleanup tests

## File Structure

```
src/
  caching/
    index.ts              # Public exports
    cell-cache.ts         # Interface definition
    memory-cache.ts       # Default in-memory cache
    lru-cache.ts          # Size-limited cache
    filesystem-cache.ts   # Disk-backed cache
    tiered-cache.ts       # LRU + FileSystem hybrid
    serialization.ts      # Cell serialization helpers
    types.ts              # Shared type definitions
tests/
  caching/
    cell-cache.test.ts
    memory-cache.test.ts
    lru-cache.test.ts
    filesystem-cache.test.ts
    tiered-cache.test.ts
    integration.test.ts
benchmarks/
  caching/
    memory-usage.ts
    throughput.ts
    comparison.ts
```

## Testing Strategy

### Unit Tests
- Each cache implementation tested in isolation
- Interface compliance via shared test suite
- Edge cases: empty cache, single cell, max capacity

### Integration Tests
- CellCollection with different cache strategies
- Worksheet read/write operations
- Formula recalculation with swapped cells
- Style application with cached cells

### Performance Tests
- Benchmark current (Map) vs new implementations
- Measure memory usage at various cell counts
- Test large file I/O performance

### Compatibility Tests
- Ensure existing code works without changes
- Verify all existing tests pass
- Test migration path (setCacheStrategy on existing worksheets)

## Risk Mitigation

### Risk 1: Performance Regression
- **Mitigation**: MemoryCache maintains current performance
- **Test**: Benchmark before/after for typical workloads
- **Fallback**: Easy to revert to pure Map if needed

### Risk 2: Breaking Changes
- **Mitigation**: Default to MemoryCache (identical behavior)
- **Test**: All existing tests pass without modification
- **Strategy**: Opt-in only, no forced migration

### Risk 3: Complex Serialization
- **Mitigation**: Start with simple JSON, expand later
- **Test**: Round-trip all cell types
- **Fallback**: Support pluggable serializers

### Risk 4: FileSystemCache Cleanup
- **Mitigation**: Automatic temp dir cleanup on Spreadsheet.dispose()
- **Test**: Verify no orphaned files
- **Strategy**: Use OS temp directory with unique IDs

## Success Metrics

1. **Backward Compatibility**: 100% of existing tests pass without changes
2. **Memory Efficiency**: QuickLRUCache reduces memory by 50%+ when limited
3. **Large Dataset Support**: FileSystemCache handles 10M+ cells
4. **Performance**: No regression for <100k cells (typical use case)
5. **Code Quality**: 100% test coverage for caching module

## Timeline Estimate

- **Phase 1**: 2-3 hours (Foundation)
- **Phase 2**: 3-4 hours (LRU)
- **Phase 3**: 4-5 hours (FileSystem)
- **Phase 4**: 2-3 hours (Integration)
- **Total**: ~12-15 hours of focused work
- **Realistic**: 2-3 days with reviews and testing

## Next Actions

1. ✅ Create detailed implementation plan (this document)
2. ⏩ Begin Phase 1: Define CellCache interface
3. Review plan with team (if applicable)
4. Start implementation with MemoryCache refactoring
5. Commit after each phase completion

## Notes

- Planning methodology: Gepetto-style structured planning
- Based on PhpSpreadsheet patterns but adapted for JavaScript/Bun
- Prioritizes backward compatibility and incremental adoption
- Leaves room for future async and distributed cache support
