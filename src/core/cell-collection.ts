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
     * Get total cell count.
     */
    public count(): number {
        return this.#cells.size;
    }
}
