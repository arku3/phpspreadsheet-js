import QuickLRU from 'quick-lru';
import type { Cell } from '../core/cell';
import type { CellCache } from './cell-cache';

export interface QuickLRUCacheOptions {
    maxSize: number;
    onEviction?: (key: string, cell: Cell) => void;
}

/**
 * QuickLRU cache implementation using the quick-lru library.
 *
 * This cache limits memory usage by evicting the least recently accessed cells
 * when the size limit is exceeded. Ideal for medium-sized datasets that don't
 * fit comfortably in memory but don't require disk storage.
 *
 * Uses the quick-lru library which provides O(1) get/set operations and
 * maintains both "recent" and "old" storage for optimal memory usage.
 *
 * Characteristics:
 * - Configurable max size (cell count)
 * - O(1) get/set operations
 * - Automatic eviction of old entries
 * - Optional eviction callback for cleanup
 * - Resize capability
 *
 * Example:
 * ```typescript
 * const cache = new QuickLRUCache({ maxSize: 10000 });
 * worksheet.setCacheStrategy(cache);
 * ```
 */
export class QuickLRUCache implements CellCache {
    #cache: QuickLRU<string, Cell>;
    #onEviction?: (key: string, cell: Cell) => void;

    constructor(options: QuickLRUCacheOptions) {
        if (options.maxSize <= 0) {
            throw new Error('maxSize must be greater than 0');
        }

        this.#onEviction = options.onEviction;
        this.#cache = new QuickLRU({
            maxSize: options.maxSize,
            onEviction: options.onEviction ? (key, cell) => options.onEviction!(key, cell) : undefined,
        });
    }

    /**
     * Get a cell by coordinate.
     */
    get(coordinate: string): Cell | undefined {
        return this.#cache.get(coordinate);
    }

    /**
     * Store a cell at the given coordinate.
     */
    set(coordinate: string, cell: Cell): void {
        this.#cache.set(coordinate, cell);
    }

    /**
     * Check if a cell exists.
     */
    has(coordinate: string): boolean {
        return this.#cache.has(coordinate);
    }

    /**
     * Remove a cell.
     */
    delete(coordinate: string): void {
        this.#cache.delete(coordinate);
    }

    /**
     * Get all cached coordinates.
     * Note: quick-lru supports this via keys() iterator.
     */
    keys(): IterableIterator<string> {
        return this.#cache.keys();
    }

    /**
     * Get all cached cells.
     * Note: quick-lru supports this via values() iterator.
     */
    values(): IterableIterator<Cell> {
        return this.#cache.values();
    }

    /**
     * Get cell count.
     */
    size(): number {
        return this.#cache.size;
    }

    /**
     * Clear all cells.
     */
    clear(): void {
        this.#cache.clear();
    }

    /**
     * Batch get - optimized for LRU cache.
     */
    getBatch(coordinates: string[]): (Cell | undefined)[] {
        return coordinates.map((coord) => this.#cache.get(coord));
    }

    /**
     * Batch set - optimized for LRU cache.
     */
    setBatch(entries: Array<[string, Cell]>): void {
        for (const [coordinate, cell] of entries) {
            this.#cache.set(coordinate, cell);
        }
    }

    /**
     * Get the maximum size limit.
     */
    getMaxSize(): number {
        return this.#cache.maxSize;
    }

    /**
     * Resize the cache. This will evict items if the new size is smaller.
     */
    resize(maxSize: number): void {
        if (maxSize <= 0) {
            throw new Error('maxSize must be greater than 0');
        }
        this.#cache.resize(maxSize);
    }
}
