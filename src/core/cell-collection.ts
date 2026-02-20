import type { CellCache } from '../caching/cell-cache.ts';
import { MemoryCache } from '../caching/memory-cache.ts';
import { Coordinate } from '../utils/coordinate.ts';
import { Cell } from './cell.ts';
import { Worksheet } from './worksheet.ts';

/**
 * Collection of cells for a Worksheet.
 * Uses a pluggable caching strategy for storage.
 * Default: MemoryCache (in-memory Map)
 */
export class CellCollection {
    #cache: CellCache;
    #parent: Worksheet;
    #currentCoordinate: string | null = null;
    #currentCell: Cell | null = null;

    constructor(parent: Worksheet, cache?: CellCache) {
        this.#parent = parent;
        this.#cache = cache ?? new MemoryCache();
    }

    public getParent(): Worksheet {
        return this.#parent;
    }

    /**
     * Set the caching strategy.
     * Note: Changing strategy does not migrate existing cells.
     * Call this before adding cells, or migrate manually.
     */
    public setCacheStrategy(cache: CellCache): void {
        this.#cache = cache;
    }

    /**
     * Get the current cache strategy.
     */
    public getCacheStrategy(): CellCache {
        return this.#cache;
    }

    /**
     * Iterate over cells without allocating an array.
     */
    public values(): IterableIterator<Cell> {
        return this.#cache.values();
    }

    /**
     * Add or update a cell.
     */
    public add(coordinate: string, cell: Cell): Cell {
        const key = coordinate.toUpperCase();
        this.#cache.set(key, cell);
        this.#currentCoordinate = key;
        this.#currentCell = cell;
        return cell;
    }

    /**
     * Get a cell by coordinate.
     */
    public get(coordinate: string): Cell | undefined {
        const key = coordinate.toUpperCase();
        const cell = this.#cache.get(key);
        if (cell) {
            this.#currentCoordinate = key;
            this.#currentCell = cell;
        }
        return cell;
    }

    /**
     * Check if a cell exists.
     */
    public has(coordinate: string): boolean {
        return this.#cache.has(coordinate.toUpperCase());
    }

    /**
     * Remove a cell.
     */
    public delete(coordinate: string): boolean {
        const key = coordinate.toUpperCase();
        const existed = this.#cache.has(key);
        this.#cache.delete(key);
        if (this.#currentCoordinate === key) {
            this.#currentCoordinate = null;
            this.#currentCell = null;
        }
        return existed;
    }

    public setCurrentCellDirty(): void {
        this.#currentCoordinate = null;
        this.#currentCell = null;
    }

    /**
     * Get all coordinates that have cells.
     */
    public getCoordinates(): string[] {
        return Array.from(this.#cache.keys());
    }

    public getSortedCoordinates(): string[] {
        return [...this.#cache.keys()].sort((a, b) => {
            const [colA, rowA] = Coordinate.indexesFromString(a);
            const [colB, rowB] = Coordinate.indexesFromString(b);
            if (rowA !== rowB) {
                return rowA - rowB;
            }
            return colA - colB;
        });
    }

    public getCurrentCoordinate(): string | null {
        return this.#currentCoordinate;
    }

    public getCurrentRow(): number | null {
        if (!this.#currentCoordinate) {
            return null;
        }
        const [, rowIndex] = Coordinate.indexesFromString(this.#currentCoordinate);
        return rowIndex;
    }

    public getCurrentColumn(): string | null {
        if (!this.#currentCoordinate) {
            return null;
        }
        const [colIndex] = Coordinate.indexesFromString(this.#currentCoordinate);
        return Coordinate.stringFromColumnIndex(colIndex);
    }

    public getCurrentCell(): Cell | null {
        return this.#currentCell;
    }

    public update(cell: Cell): Cell {
        const coordinate = cell.getCoordinate().toUpperCase();
        this.#cache.set(coordinate, cell);
        this.#currentCoordinate = coordinate;
        this.#currentCell = cell;
        return cell;
    }

    public cloneCellCollection(worksheet: Worksheet): CellCollection {
        const collection = new CellCollection(worksheet);
        for (const key of this.#cache.keys()) {
            const cell = this.#cache.get(key);
            if (cell) {
                collection.add(key, cell);
            }
        }
        return collection;
    }

    public unsetWorksheetCells(): void {
        for (const cell of this.#cache.values()) {
            cell.detach();
        }
        this.#cache.clear();
        this.#currentCoordinate = null;
        this.#currentCell = null;
    }

    /**
     * Get all cells.
     */
    public getCells(): Cell[] {
        return Array.from(this.#cache.values());
    }

    /**
     * Get highest worksheet column and highest row that have cell records.
     *
     * @returns Highest column name and highest row number
     */
    public getHighestRowAndColumn(): { row: number; column: string } {
        let maxRow = 1;
        let maxColumnIndex = 1;

        for (const coordinate of this.#cache.keys()) {
            const [columnIndex, rowIndex] = Coordinate.indexesFromString(coordinate);
            if (rowIndex > maxRow) {
                maxRow = rowIndex;
            }
            if (columnIndex > maxColumnIndex) {
                maxColumnIndex = columnIndex;
            }
        }

        return {
            row: maxRow,
            column: Coordinate.stringFromColumnIndex(maxColumnIndex),
        };
    }

    /**
     * Get highest worksheet column.
     *
     * @param row Return the highest column for the specified row,
     *            or the highest column of any row if no row number is passed
     * @returns Highest column name
     */
    public getHighestColumn(row: number | null = null): string {
        if (row === null) {
            return this.getHighestRowAndColumn().column;
        }

        let maxColumnIndex = 1;
        for (const coordinate of this.#cache.keys()) {
            const [columnIndex, rowIndex] = Coordinate.indexesFromString(coordinate);
            if (rowIndex === row) {
                if (columnIndex > maxColumnIndex) {
                    maxColumnIndex = columnIndex;
                }
            }
        }

        return Coordinate.stringFromColumnIndex(maxColumnIndex);
    }

    /**
     * Get highest worksheet row.
     *
     * @param column Return the highest row for the specified column,
     *               or the highest row of any column if no column letter is passed
     * @returns Highest row number
     */
    public getHighestRow(column: string | null = null): number {
        if (column === null) {
            return this.getHighestRowAndColumn().row;
        }

        const columnIndexToMatch = Coordinate.columnIndexFromString(column);
        let maxRow = 1;
        for (const coordinate of this.#cache.keys()) {
            const [columnIndex, rowIndex] = Coordinate.indexesFromString(coordinate);
            if (columnIndex === columnIndexToMatch) {
                if (rowIndex > maxRow) {
                    maxRow = rowIndex;
                }
            }
        }

        return maxRow;
    }

    /**
     * Remove all cells in a specific row.
     *
     * @param row Row number to remove
     */
    public removeRow(row: number): void {
        const coordsToDelete: string[] = [];
        for (const coordinate of this.#cache.keys()) {
            const [, rowIndex] = Coordinate.indexesFromString(coordinate);
            if (rowIndex === row) {
                coordsToDelete.push(coordinate);
            }
        }
        for (const coord of coordsToDelete) {
            this.#cache.delete(coord);
        }
    }

    /**
     * Remove all cells in a specific column.
     *
     * @param column Column letter to remove
     */
    public removeColumn(column: string): void {
        const targetColIndex = Coordinate.columnIndexFromString(column);
        const coordsToDelete: string[] = [];
        for (const coordinate of this.#cache.keys()) {
            const [colIndex] = Coordinate.indexesFromString(coordinate);
            if (colIndex === targetColIndex) {
                coordsToDelete.push(coordinate);
            }
        }
        for (const coord of coordsToDelete) {
            this.#cache.delete(coord);
        }
    }

    /**
     * Clear all cells from the collection.
     *
     * Note: this only removes cells from the collection; it does not detach
     * the cells from their worksheet. Use Worksheet.disconnectCells() when
     * you need to actively break circular references.
     */
    public clear(): void {
        this.#cache.clear();
    }

    /**
     * Get the number of cells in the collection.
     */
    public getCount(): number {
        return this.#cache.size();
    }
}
