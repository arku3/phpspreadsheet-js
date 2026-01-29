import { Spreadsheet } from './spreadsheet.ts';
import { CellCollection } from './cell-collection.ts';
import { Cell, DataType } from './cell.ts';
import { Coordinate } from '../utils/coordinate.ts';
import { Style } from '../style/style.ts';
import { Table } from '../worksheet/table.ts';
import { PageSetup } from '../worksheet/page-setup.ts';
import { PageMargins } from '../worksheet/page-margins.ts';

/**
 * Worksheet in a Spreadsheet.
 */
export class Worksheet {
    // Sheet state constants
    public static readonly SHEETSTATE_VISIBLE = 'visible';
    public static readonly SHEETSTATE_HIDDEN = 'hidden';
    public static readonly SHEETSTATE_VERYHIDDEN = 'veryHidden';

    #parent: Spreadsheet;
    #title: string;
    #cellCollection: CellCollection;
    #selectedCells: string = 'A1';
    #sheetState: string = Worksheet.SHEETSTATE_VISIBLE;
    #tables: Table[] = [];
    #pageSetup: PageSetup;
    #pageMargins: PageMargins;

    constructor(parent: Spreadsheet, title: string = 'Worksheet') {
        this.#parent = parent;
        this.#title = title;
        this.#cellCollection = new CellCollection();
        this.#pageSetup = new PageSetup();
        this.#pageMargins = new PageMargins();
    }

    /**
     * Get sheet state.
     */
    public getSheetState(): string {
        return this.#sheetState;
    }

    /**
     * Set sheet state.
     */
    public setSheetState(state: string): this {
        this.#sheetState = state;
        return this;
    }

    /**
     * Get parent spreadsheet.
     */
    public getParent(): Spreadsheet {
        return this.#parent;
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
     * Get selected cells.
     */
    public getSelectedCells(): string {
        return this.#selectedCells;
    }

    /**
     * Set selected cells.
     */
    public setSelectedCells(coordinate: string): this {
        this.#selectedCells = coordinate.toUpperCase();
        return this;
    }

    /**
     * Get active cell.
     */
    public getActiveCell(): string {
        const ranges = this.#selectedCells.split(/[\s,]+/);
        const first = ranges[0] ?? 'A1';
        if (first.includes(':')) {
            return first.split(':')[0]!.toUpperCase();
        }
        return first.toUpperCase();
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
        this.#parent.clearCalculationCache();
        return this;
    }

    /**
     * Get style for cell at coordinate.
     */
    public getStyle(coordinate: string): Style {
        this.setSelectedCells(coordinate);
        return this.#parent.getCellXfSupervisor();
    }

    /**
     * Get cell collection.
     */
    public getCellCollection(): CellCollection {
        return this.#cellCollection;
    }

    /**
     * Add table.
     */
    public addTable(table: Table): void {
        this.#tables.push(table);
    }

    /**
     * Get tables.
     */
    public getTables(): Table[] {
        return this.#tables;
    }

    /**
     * Get Page Setup.
     */
    public getPageSetup(): PageSetup {
        return this.#pageSetup;
    }

    /**
     * Set Page Setup.
     */
    public setPageSetup(pageSetup: PageSetup): this {
        this.#pageSetup = pageSetup;
        return this;
    }

    /**
     * Get Page Margins.
     */
    public getPageMargins(): PageMargins {
        return this.#pageMargins;
    }

    /**
     * Set Page Margins.
     */
    public setPageMargins(pageMargins: PageMargins): this {
        this.#pageMargins = pageMargins;
        return this;
    }

    /**
     * Get table by name.
     */
    public getTableByName(name: string): Table | undefined {
        const searchName = name.toUpperCase();
        return this.#tables.find(table => table.getName().toUpperCase() === searchName);
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
