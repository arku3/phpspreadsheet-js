import { Spreadsheet } from './spreadsheet.ts';
import { CellCollection } from './cell-collection.ts';
import { Cell, DataType } from './cell.ts';
import { Coordinate } from '../utils/coordinate.ts';

import { Table } from '../worksheet/table.ts';

/**
 * Worksheet in a Spreadsheet.
 */
export class Worksheet {
    #spreadsheet: Spreadsheet;
    #title: string;
    #cellCollection: CellCollection;
    #tables: Table[] = [];

    constructor(spreadsheet: Spreadsheet, title: string = 'Worksheet') {
        this.#spreadsheet = spreadsheet;
        this.#title = title;
        this.#cellCollection = new CellCollection();
    }

    /**
     * Get tables.
     */
    public getTables(): Table[] {
        return this.#tables;
    }

    /**
     * Add table.
     */
    public addTable(table: Table): void {
        this.#tables.push(table);
    }

    /**
     * Get table by name.
     */
    public getTableByName(name: string): Table | undefined {
        return this.#tables.find(table => table.getName() === name);
    }


    /**
     * Get parent spreadsheet.
     */
    public getParent(): Spreadsheet {
        return this.#spreadsheet;
    }

    /**
     * Get title.
     */
    public getTitle(): string {
        return this.#title;
    }

    /**
     * Set title.
     */
    public setTitle(title: string): void {
        this.#title = title;
    }

    /**
     * Get cell by coordinate.
     */
    public getCell(coordinate: string): Cell {
        let cell = this.#cellCollection.get(coordinate);
        if (!cell) {
            const [col, row] = Coordinate.coordinateFromString(coordinate);
            cell = new Cell(null, DataType.TYPE_NULL, this, col, row);
            this.#cellCollection.add(coordinate, cell);
        }
        return cell;
    }

    /**
     * Set cell value.
     */
    public setCellValue(coordinate: string, value: any): Worksheet {
        const cell = this.getCell(coordinate);
        cell.setValue(value);
        this.#spreadsheet.clearCalculationCache();
        return this;
    }

    /**
     * Get cell collection.
     */
    public getCellCollection(): CellCollection {
        return this.#cellCollection;
    }

    /**
     * Clear calculation cache.
     */
    public clearCalculationCache(): void {
        const coordinates = this.#cellCollection.getCoordinates();
        for (const coord of coordinates) {
            this.#cellCollection.get(coord)?.clearCalculationCache();
        }
    }
}
