/**
 * Performance benchmarks for cell caching strategies.
 * Compares MemoryCache vs QuickLRUCache across various workloads.
 */

import { MemoryCache } from '../src/caching/memory-cache';
import { QuickLRUCache } from '../src/caching/quick-lru-cache';
import { Cell, DataType } from '../src/core/cell';
import { Worksheet } from '../src/core/worksheet';
import { Spreadsheet } from '../src/core/spreadsheet';

interface BenchmarkResult {
  name: string;
  ops: number;
  time: number;
  memoryBefore: number;
  memoryAfter: number;
}

function createTestCell(worksheet: Worksheet): Cell {
  return new Cell(null, DataType.TYPE_STRING, worksheet, 1, 1);
}

function formatNumber(num: number): string {
  return num.toLocaleString();
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

async function runBenchmark(
  name: string,
  fn: () => void,
  iterations: number
): Promise<BenchmarkResult> {
  const memoryBefore = process.memoryUsage().heapUsed;
  const start = performance.now();
  
  for (let i = 0; i < iterations; i++) {
    fn();
  }
  
  const end = performance.now();
  const memoryAfter = process.memoryUsage().heapUsed;
  
  return {
    name,
    ops: Math.round(iterations / ((end - start) / 1000)),
    time: end - start,
    memoryBefore,
    memoryAfter,
  };
}

async function benchmarkCache(cache: MemoryCache | QuickLRUCache, name: string) {
  console.log(`\n${'='.repeat(60)}`);
  console.log(`Benchmarking: ${name}`);
  console.log('='.repeat(60));

  const spreadsheet = new Spreadsheet();
  const worksheet = spreadsheet.createSheet('Benchmark');
  worksheet.setCacheStrategy(cache);

  // Benchmark 1: Sequential write (1000 cells)
  const writeResult = await runBenchmark(
    'Sequential Write (1000 cells)',
    () => {
      for (let i = 0; i < 1000; i++) {
        const cell = createTestCell(worksheet);
        cell.setValue(`Value ${i}`);
        cache.set(`A${i}`, cell);
      }
    },
    10
  );
  console.log(`\n${writeResult.name}:`);
  console.log(`  Operations/sec: ${formatNumber(writeResult.ops)}`);
  console.log(`  Time: ${writeResult.time.toFixed(2)}ms`);
  console.log(`  Memory delta: ${formatBytes(writeResult.memoryAfter - writeResult.memoryBefore)}`);

  // Benchmark 2: Random read (1000 lookups)
  const readResult = await runBenchmark(
    'Random Read (1000 lookups)',
    () => {
      for (let i = 0; i < 1000; i++) {
        const coord = `A${Math.floor(Math.random() * 1000)}`;
        cache.get(coord);
      }
    },
    100
  );
  console.log(`\n${readResult.name}:`);
  console.log(`  Operations/sec: ${formatNumber(readResult.ops)}`);
  console.log(`  Time: ${readResult.time.toFixed(2)}ms`);

  // Benchmark 3: Batch operations
  const batchResult = await runBenchmark(
    'Batch Operations (100 sets)',
    () => {
      const entries: Array<[string, Cell]> = [];
      for (let i = 0; i < 100; i++) {
        const cell = createTestCell(worksheet);
        cell.setValue(`Batch ${i}`);
        entries.push([`B${i}`, cell]);
      }
      cache.setBatch(entries);
    },
    100
  );
  console.log(`\n${batchResult.name}:`);
  console.log(`  Operations/sec: ${formatNumber(batchResult.ops)}`);
  console.log(`  Time: ${batchResult.time.toFixed(2)}ms`);

  // Clear for next benchmark
  cache.clear();
}

async function benchmarkLRUEviction() {
  console.log(`\n${'='.repeat(60)}`);
  console.log('Benchmarking: QuickLRUCache Eviction Behavior');
  console.log('='.repeat(60));

  const spreadsheet = new Spreadsheet();
  const worksheet = spreadsheet.createSheet('LRU Benchmark');
  const cache = new QuickLRUCache({ maxSize: 100 });
  worksheet.setCacheStrategy(cache);

  // Benchmark: Write beyond capacity
  const evictionResult = await runBenchmark(
    'Write with Eviction (500 cells, maxSize=100)',
    () => {
      for (let i = 0; i < 500; i++) {
        const cell = createTestCell(worksheet);
        cell.setValue(`Value ${i}`);
        cache.set(`A${i}`, cell);
      }
    },
    50
  );
  console.log(`\n${evictionResult.name}:`);
  console.log(`  Operations/sec: ${formatNumber(evictionResult.ops)}`);
  console.log(`  Time: ${evictionResult.time.toFixed(2)}ms`);
  console.log(`  Final cache size: ${cache.size()} (limited by maxSize)`);
}

async function main() {
  console.log('Cell Caching Performance Benchmarks');
  console.log('====================================');
  console.log(`Node version: ${process.version}`);
  console.log(`Platform: ${process.platform}`);
  console.log(`Date: ${new Date().toISOString()}`);

  // Benchmark MemoryCache
  const memoryCache = new MemoryCache();
  await benchmarkCache(memoryCache, 'MemoryCache');

  // Benchmark QuickLRUCache
  const lruCache = new QuickLRUCache({ maxSize: 10000 });
  await benchmarkCache(lruCache, 'QuickLRUCache (maxSize=10000)');

  // Benchmark eviction behavior
  await benchmarkLRUEviction();

  console.log(`\n${'='.repeat(60)}`);
  console.log('Benchmarks Complete');
  console.log('='.repeat(60));
}

main().catch(console.error);
