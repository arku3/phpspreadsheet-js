import type { Cell } from '../core/cell';
import type { CellCache } from './cell-cache';

/**
 * In-memory cell cache using native JavaScript Map.
 *
 * This is the default caching strategy with zero overhead.
 * It maintains backward compatibility with existing code.
 *
 * Characteristics:
 * - Fastest possible access (O(1))
 * - No serialization overhead
 * - Memory grows linearly with cell count
 * - No eviction (all cells kept in memory)
 */
export class MemoryCache implements CellCache {
    #cache: Map<string, Cell>;

    constructor() {
        this.#cache = new Map();
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
     */
    keys(): IterableIterator<string> {
        return this.#cache.keys();
    }

    /**
     * Get all cached cells.
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
     * Batch get - optimized for Map.
     */
    getBatch(coordinates: string[]): (Cell | undefined)[] {
        return coordinates.map((coord) => this.#cache.get(coord));
    }

    /**
     * Batch set - optimized for Map.
     */
    setBatch(entries: Array<[string, Cell]>): void {
        for (const [coordinate, cell] of entries) {
            this.#cache.set(coordinate, cell);
        }
    }
}
