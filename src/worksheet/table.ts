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
        return this.#columns.find(col => col.getName() === name);
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
        const [startCol, startRow] = Coordinate.coordinateFromString(start!);
        const [endCol, endRow] = Coordinate.coordinateFromString(end!);
        return [[startCol, startRow], [endCol, endRow]];
    }
}
