# Cell Caching

Phpspreadsheet-js provides a pluggable cell caching system to optimize memory usage when working with large spreadsheets.

## Overview

By default, all cells are stored in memory using `MemoryCache`. For large datasets, you can use `QuickLRUCache` to limit memory usage through automatic eviction of least recently accessed cells.

## Cache Implementations

### MemoryCache (Default)

The default in-memory cache using native JavaScript `Map`. Best for:
- Small to medium spreadsheets (< 100,000 cells)
- Maximum performance
- Simple use cases

```typescript
import { MemoryCache } from 'phpspreadsheet-js/caching';

const cache = new MemoryCache();
worksheet.setCacheStrategy(cache);
```

### QuickLRUCache

Size-limited cache using the [quick-lru](https://github.com/sindresorhus/quick-lru) library. Best for:
- Large spreadsheets that exceed available memory
- Long-running services processing multiple files
- Predictable memory usage

```typescript
import { QuickLRUCache } from 'phpspreadsheet-js/caching';

const cache = new QuickLRUCache({
  maxSize: 10000,  // Keep 10,000 most recent cells in memory
  onEviction: (key, cell) => {
    console.log(`Cell ${key} evicted from cache`);
  }
});

worksheet.setCacheStrategy(cache);
```

**Features:**
- O(1) get/set operations
- Automatic eviction when maxSize is reached
- Eviction callbacks for cleanup
- Dynamic resize capability

## Usage Patterns

### Per-Worksheet Cache

Set cache for individual worksheets:

```typescript
import { Spreadsheet } from 'phpspreadsheet-js';
import { QuickLRUCache } from 'phpspreadsheet-js/caching';

const spreadsheet = new Spreadsheet();
const worksheet = spreadsheet.createSheet('Large Dataset');

// Use LRU cache for this worksheet only
const cache = new QuickLRUCache({ maxSize: 50000 });
worksheet.setCacheStrategy(cache);

// Fill with data - only 50,000 most recent cells stay in memory
for (let row = 1; row <= 1000; row++) {
  for (let col = 1; col <= 100; col++) {
    const cell = worksheet.getCell(row, col);
    cell.setValue(`Data ${row}-${col}`);
  }
}
```

### Global Default Cache

Set default cache for all new worksheets:

```typescript
import { Spreadsheet } from 'phpspreadsheet-js';
import { QuickLRUCache } from 'phpspreadsheet-js/caching';

const spreadsheet = new Spreadsheet();

// Set default cache for all future worksheets
const defaultCache = new QuickLRUCache({ maxSize: 10000 });
spreadsheet.setDefaultCacheStrategy(defaultCache);

// These worksheets will use the default cache automatically
const sheet1 = spreadsheet.createSheet('Sheet 1');
const sheet2 = spreadsheet.createSheet('Sheet 2');
```

**Note:** The default cache is applied to worksheets created *after* calling `setDefaultCacheStrategy()`. Existing worksheets are not affected.

### Hybrid Approach

Use different caches for different worksheets based on expected size:

```typescript
const spreadsheet = new Spreadsheet();

// Small sheet - use memory cache
const summarySheet = spreadsheet.createSheet('Summary');
summarySheet.setCacheStrategy(new MemoryCache());

// Large sheet - use LRU cache
const dataSheet = spreadsheet.createSheet('Data');
dataSheet.setCacheStrategy(new QuickLRUCache({ maxSize: 100000 }));
```

## Custom Cache Implementation

You can implement your own cache by implementing the `CellCache` interface:

```typescript
import type { CellCache } from 'phpspreadsheet-js/caching';
import type { Cell } from 'phpspreadsheet-js';

export class CustomCache implements CellCache {
  get(coordinate: string): Cell | undefined {
    // Your implementation
  }

  set(coordinate: string, cell: Cell): void {
    // Your implementation
  }

  has(coordinate: string): boolean {
    // Your implementation
  }

  delete(coordinate: string): void {
    // Your implementation
  }

  keys(): IterableIterator<string> {
    // Your implementation
  }

  values(): IterableIterator<Cell> {
    // Your implementation
  }

  size(): number {
    // Your implementation
  }

  clear(): void {
    // Your implementation
  }

  getBatch(coordinates: string[]): (Cell | undefined)[] {
    // Your implementation (optional optimization)
    return coordinates.map(coord => this.get(coord));
  }

  setBatch(entries: Array<[string, Cell]>): void {
    // Your implementation (optional optimization)
    for (const [coordinate, cell] of entries) {
      this.set(coordinate, cell);
    }
  }
}
```

## Performance Considerations

### When to Use MemoryCache

- Spreadsheet has < 100,000 cells
- You have plenty of available memory
- Maximum read/write performance is critical
- Simple usage patterns

### When to Use QuickLRUCache

- Spreadsheet has > 100,000 cells
- Running in memory-constrained environment (serverless, containers)
- Processing multiple large files in sequence
- Need predictable memory usage

### Memory Estimation

Approximate memory per cell:
- Empty cell: ~200 bytes
- String cell: ~300 bytes + string length
- Number cell: ~250 bytes
- Formula cell: ~400 bytes + formula length

Example: 100,000 cells with mixed data ≈ 30-50 MB

## API Reference

### MemoryCache

```typescript
class MemoryCache implements CellCache {
  constructor();
  get(coordinate: string): Cell | undefined;
  set(coordinate: string, cell: Cell): void;
  has(coordinate: string): boolean;
  delete(coordinate: string): void;
  keys(): IterableIterator<string>;
  values(): IterableIterator<Cell>;
  size(): number;
  clear(): void;
  getBatch(coordinates: string[]): (Cell | undefined)[];
  setBatch(entries: Array<[string, Cell]>): void;
}
```

### QuickLRUCache

```typescript
interface QuickLRUCacheOptions {
  maxSize: number;
  onEviction?: (key: string, cell: Cell) => void;
}

class QuickLRUCache implements CellCache {
  constructor(options: QuickLRUCacheOptions);
  get(coordinate: string): Cell | undefined;
  set(coordinate: string, cell: Cell): void;
  has(coordinate: string): boolean;
  delete(coordinate: string): void;
  keys(): IterableIterator<string>;
  values(): IterableIterator<Cell>;
  size(): number;
  clear(): void;
  getBatch(coordinates: string[]): (Cell | undefined)[];
  setBatch(entries: Array<[string, Cell]>): void;
  getMaxSize(): number;
  resize(maxSize: number): void;
}
```

### Worksheet

```typescript
class Worksheet {
  setCacheStrategy(cache: CellCache): this;
  getCacheStrategy(): CellCache;
}
```

### Spreadsheet

```typescript
class Spreadsheet {
  setDefaultCacheStrategy(cache: CellCache): this;
  getDefaultCacheStrategy(): CellCache | null;
}
```

## Backward Compatibility

All existing code continues to work without changes. The default `MemoryCache` maintains identical behavior to pre-caching versions. Opt-in to alternative caches by calling `setCacheStrategy()`.

## Examples

### Example 1: Processing Large CSV Files

```typescript
import { Spreadsheet } from 'phpspreadsheet-js';
import { QuickLRUCache } from 'phpspreadsheet-js/caching';
import { CsvReader } from 'phpspreadsheet-js/io';

const spreadsheet = new Spreadsheet();
spreadsheet.setDefaultCacheStrategy(
  new QuickLRUCache({ maxSize: 50000 })
);

// Process 1M row CSV without running out of memory
const worksheet = spreadsheet.createSheet('Data');
const reader = new CsvReader();
await reader.load('huge-file.csv', worksheet);
```

### Example 2: Server-Side Report Generation

```typescript
import { Spreadsheet } from 'phpspreadsheet-js';
import { QuickLRUCache } from 'phpspreadsheet-js/caching';

app.post('/generate-report', async (req, res) => {
  const spreadsheet = new Spreadsheet();
  
  // Use LRU to limit memory per request
  const worksheet = spreadsheet.createSheet('Report');
  worksheet.setCacheStrategy(
    new QuickLRUCache({ maxSize: 20000 })
  );
  
  // Generate large report...
  await generateReport(worksheet, req.body.data);
  
  const buffer = await spreadsheet.saveXlsx();
  res.send(buffer);
});
```

### Example 3: Batch Processing with Cleanup

```typescript
import { Spreadsheet } from 'phpspreadsheet-js';
import { QuickLRUCache } from 'phpspreadsheet-js/caching';

async function processFiles(files: string[]) {
  for (const file of files) {
    const spreadsheet = new Spreadsheet();
    
    // Fresh cache for each file
    const cache = new QuickLRUCache({
      maxSize: 30000,
      onEviction: (key, cell) => {
        // Optional: handle evicted cells
      }
    });
    
    spreadsheet.setDefaultCacheStrategy(cache);
    
    const worksheet = spreadsheet.createSheet('Data');
    await loadFile(file, worksheet);
    
    // Process and save...
    await processData(worksheet);
    
    // Cache automatically cleaned up when spreadsheet garbage collected
  }
}
```

## Troubleshooting

### High Memory Usage Despite LRU Cache

If memory usage remains high with QuickLRUCache:
1. Ensure you're not holding references to cells elsewhere
2. Check if formulas are creating circular references
3. Verify `maxSize` is appropriate for your dataset
4. Consider reducing batch operation sizes

### Performance Degradation

If operations slow down:
1. For small datasets (< 10k cells), use MemoryCache instead
2. Avoid excessive `resize()` calls on QuickLRUCache
3. Use batch operations (`getBatch`, `setBatch`) when possible

### Cache Not Applied

If cache doesn't seem to work:
1. Call `setCacheStrategy()` before adding cells
2. For default cache, call `setDefaultCacheStrategy()` before `createSheet()`
3. Verify cache instance is not null/undefined

## See Also

- [Architecture Overview](../architecture.md)
- [Performance Tuning](../performance.md)
- [API Reference](../api/index.md)
