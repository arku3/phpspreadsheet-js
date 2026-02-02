import type { Cell } from '../core/cell';

/**
 * Interface for cell caching strategies.
 *
 * Implementations must handle storage and retrieval of Cell objects
 * by their coordinate string (e.g., "A1", "B2").
 *
 * All operations are synchronous. For async caches, use an adapter
 * that buffers operations.
 */
export interface CellCache {
    /**
     * Get a cell by coordinate.
     * @param coordinate - Cell coordinate string (e.g., "A1")
     * @returns The Cell if found, undefined otherwise
     */
    get(coordinate: string): Cell | undefined;

    /**
     * Store a cell at the given coordinate.
     * @param coordinate - Cell coordinate string
     * @param cell - Cell to store
     */
    set(coordinate: string, cell: Cell): void;

    /**
     * Check if a cell exists at the given coordinate.
     * @param coordinate - Cell coordinate string
     * @returns true if cell exists, false otherwise
     */
    has(coordinate: string): boolean;

    /**
     * Remove a cell from the cache.
     * @param coordinate - Cell coordinate string
     */
    delete(coordinate: string): void;

    /**
     * Get all cached cell coordinates.
     * @returns Iterator of coordinate strings
     */
    keys(): IterableIterator<string>;

    /**
     * Get all cached cells.
     * @returns Iterator of Cell objects
     */
    values(): IterableIterator<Cell>;

    /**
     * Get the number of cached cells.
     * @returns Cell count
     */
    size(): number;

    /**
     * Remove all cells from the cache.
     */
    clear(): void;

    /**
     * Get multiple cells in a batch operation.
     * Default implementation iterates and calls get() for each.
     * Override for optimized batch retrieval.
     *
     * @param coordinates - Array of coordinate strings
     * @returns Array of Cells (undefined for missing)
     */
    getBatch(coordinates: string[]): (Cell | undefined)[];

    /**
     * Store multiple cells in a batch operation.
     * Default implementation iterates and calls set() for each.
     * Override for optimized batch storage.
     *
     * @param entries - Array of [coordinate, cell] tuples
     */
    setBatch(entries: Array<[string, Cell]>): void;

    /**
     * Flush any pending writes to persistent storage.
     * Optional - only relevant for disk-backed caches.
     */
    flush?(): void;

    /**
     * Close the cache and release resources.
     * Optional - called when Spreadsheet is disposed.
     */
    close?(): void;
}
