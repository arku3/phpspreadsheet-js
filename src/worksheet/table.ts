import { Worksheet } from '../core/worksheet.ts';
import { Coordinate } from '../utils/coordinate.ts';

/**
 * Table Column.
 */
export class TableColumn {
    #name: string;
    #index: number;

    constructor(name: string, index: number) {
        this.#name = name;
        this.#index = index;
    }

    public getName(): string {
        return this.#name;
    }

    public setName(name: string): void {
        this.#name = name;
    }

    public getIndex(): number {
        return this.#index;
    }
}

/**
 * Excel Table.
 */
export class Table {
    #name: string;
    #range: string;
    #worksheet: Worksheet;
    #columns: TableColumn[] = [];
    #showTotals: boolean = false;
    #showHeader: boolean = true;

    constructor(name: string, range: string, worksheet: Worksheet) {
        this.#name = name;
        this.#range = range;
        this.#worksheet = worksheet;
    }

    public getName(): string {
        return this.#name;
    }

    public getRange(): string {
        return this.#range;
    }

    public getWorksheet(): Worksheet {
        return this.#worksheet;
    }

    public addColumn(name: string): void {
        this.#columns.push(new TableColumn(name, this.#columns.length));
    }

    public getColumns(): TableColumn[] {
        return this.#columns;
    }

    public getColumn(name: string): TableColumn | undefined {
        return this.#columns.find((col) => col.getName() === name);
    }

    public updateColumnName(oldName: string, newName: string): boolean {
        const oldValue = oldName.toLowerCase();
        for (const column of this.#columns) {
            if (column.getName().toLowerCase() === oldValue) {
                column.setName(newName);
                return true;
            }
        }
        return false;
    }

    public showTotals(show: boolean): void {
        this.#showTotals = show;
    }

    public getShowTotals(): boolean {
        return this.#showTotals;
    }

    public showHeader(show: boolean): void {
        this.#showHeader = show;
    }

    public getShowHeader(): boolean {
        return this.#showHeader;
    }

    public getRangeBoundaries(): [[number, number], [number, number]] {
        const [start, end] = this.#range.split(':');
        const [startColRaw, startRow] = Coordinate.coordinateFromString(start!);
        const [endColRaw, endRow] = Coordinate.coordinateFromString(end!);

        const startCol = Coordinate.columnIndexFromString(startColRaw);
        const endCol = Coordinate.columnIndexFromString(endColRaw);

        return [
            [startCol, startRow],
            [endCol, endRow],
        ];
    }
}
