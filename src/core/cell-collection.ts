import { Worksheet } from './worksheet.ts';
import { Coordinate } from '../utils/coordinate.ts';
import { Cell } from './cell.ts';

/**
 * Collection of cells for a Worksheet.
 * Uses a Map for sparse grid storage.
 */
export class CellCollection {
    #cells: Map<string, Cell> = new Map();

    /**
     * Add or update a cell.
     */
    public add(coordinate: string, cell: Cell): void {
        this.#cells.set(coordinate.toUpperCase(), cell);
    }

    /**
     * Get a cell by coordinate.
     */
    public get(coordinate: string): Cell | undefined {
        return this.#cells.get(coordinate.toUpperCase());
    }

    /**
     * Check if a cell exists.
     */
    public has(coordinate: string): boolean {
        return this.#cells.has(coordinate.toUpperCase());
    }

    /**
     * Remove a cell.
     */
    public delete(coordinate: string): void {
        this.#cells.delete(coordinate.toUpperCase());
    }

    /**
     * Get all coordinates that have cells.
     */
    public getCoordinates(): string[] {
        return Array.from(this.#cells.keys());
    }

    /**
     * Get all cells.
     */
    public getCells(): Cell[] {
        return Array.from(this.#cells.values());
    }

    /**
     * Get highest worksheet column and highest row that have cell records.
     *
     * @returns Highest column name and highest row number
     */
    public getHighestRowAndColumn(): { row: number; column: string } {
        let maxRow = 1;
        let maxColumnIndex = 1;

        for (const coordinate of this.#cells.keys()) {
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
        for (const [coordinate] of this.#cells.entries()) {
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
        for (const coordinate of this.#cells.keys()) {
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
        for (const coordinate of this.#cells.keys()) {
            const [, rowIndex] = Coordinate.indexesFromString(coordinate);
            if (rowIndex === row) {
                coordsToDelete.push(coordinate);
            }
        }
        for (const coord of coordsToDelete) {
            this.#cells.delete(coord);
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
        for (const coordinate of this.#cells.keys()) {
            const [colIndex] = Coordinate.indexesFromString(coordinate);
            if (colIndex === targetColIndex) {
                coordsToDelete.push(coordinate);
            }
        }
        for (const coord of coordsToDelete) {
            this.#cells.delete(coord);
        }
    }
}
