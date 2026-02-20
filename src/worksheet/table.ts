import { Worksheet } from '../core/worksheet.ts';
import { Coordinate } from '../utils/coordinate.ts';
import { AutoFilter } from './auto-filter.ts';
import { TableStyle } from './table-style.ts';

/**
 * Table Column.
 */
export class TableColumn {
    #name: string;
    #index: number;
    #showFilterButton: boolean = true;
    #totalsRowLabel: string | null = null;
    #totalsRowFunction: string | null = null;
    #totalsRowFormula: string | null = null;
    #columnFormula: string | null = null;
    #table: Table | null = null;

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

    public getColumnIndex(): string {
        return Coordinate.stringFromColumnIndex(this.#index + 1);
    }

    public getShowFilterButton(): boolean {
        return this.#showFilterButton;
    }

    public setShowFilterButton(value: boolean): this {
        this.#showFilterButton = value;
        return this;
    }

    public getTotalsRowLabel(): string | null {
        return this.#totalsRowLabel;
    }

    public setTotalsRowLabel(label: string | null): this {
        this.#totalsRowLabel = label;
        return this;
    }

    public getTotalsRowFunction(): string | null {
        return this.#totalsRowFunction;
    }

    public setTotalsRowFunction(functionName: string | null): this {
        this.#totalsRowFunction = functionName;
        return this;
    }

    public getTotalsRowFormula(): string | null {
        return this.#totalsRowFormula;
    }

    public setTotalsRowFormula(formula: string | null): this {
        this.#totalsRowFormula = formula;
        return this;
    }

    public getColumnFormula(): string | null {
        return this.#columnFormula;
    }

    public setColumnFormula(formula: string | null): this {
        this.#columnFormula = formula;
        return this;
    }

    public getTable(): Table | null {
        return this.#table;
    }

    public setTable(table: Table | null): this {
        this.#table = table;
        return this;
    }

    public static updateStructuredReferences(worksheet: Worksheet, oldTitle: string, newTitle: string): void {
        if (oldTitle.toLowerCase() === newTitle.toLowerCase()) {
            return;
        }
        const workbook = worksheet.getParent();
        if (!workbook) {
            return;
        }
        const pattern = new RegExp(`\[(?:@?)${oldTitle.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\]`, 'gi');
        for (const sheet of workbook.getAllSheets()) {
            for (const coordinate of sheet.getCoordinates(false)) {
                const cell = sheet.getCellOrNull(coordinate);
                if (!cell || cell.getDataType() !== 'f') {
                    continue;
                }
                const value = String(cell.getValue());
                const updated = value.replace(pattern, `[${newTitle}]`);
                if (updated !== value) {
                    cell.setValueExplicit(updated, 'f');
                }
            }
        }

        for (const namedFormula of workbook.getNamedFormulae()) {
            const formula = namedFormula.getFormula();
            const updated = formula.replace(pattern, `[${newTitle}]`);
            if (updated !== formula) {
                namedFormula.setFormula(updated);
            }
        }
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
    #allowFilter: boolean = true;
    #autoFilter: AutoFilter;
    #style: TableStyle;

    constructor(name: string, range: string, worksheet: Worksheet) {
        this.#name = name;
        this.#range = range;
        this.#worksheet = worksheet;
        this.#style = new TableStyle();
        this.#style.setTable(this);
        this.#autoFilter = new AutoFilter(range, worksheet);
    }

    public getName(): string {
        return this.#name;
    }

    public setName(name: string): this {
        if (name === '') {
            throw new Error('Table name cannot be empty.');
        }
        const upperName = name.toUpperCase();
        if (upperName === 'C' || upperName === 'R') {
            throw new Error('Table name cannot be C or R.');
        }
        if (name.length > 255) {
            throw new Error('Table name cannot be longer than 255 characters.');
        }
        if (/^[A-Za-z]+\d+$/.test(name)) {
            throw new Error('Table name cannot be a valid cell reference.');
        }
        if (!/^[A-Za-z_\\][\p{L}\p{M}0-9._\\]*$/u.test(name)) {
            throw new Error(`Table name ${name} is not valid.`);
        }
        const worksheet = this.#worksheet;
        const parent = worksheet.getParent();
        if (parent) {
            const existing = parent.getTableByName(name);
            if (existing && existing !== this) {
                throw new Error(`Table name ${name} is already in use.`);
            }
        }
        const oldName = this.#name;
        this.#name = name;
        TableColumn.updateStructuredReferences(worksheet, oldName, name);
        return this;
    }

    public getRange(): string {
        return this.#range;
    }

    public setRange(range: string): this {
        if (range === '') {
            throw new Error('Table range cannot be empty.');
        }
        const upperRange = range.toUpperCase().replace(/\$/g, '');
        if (!upperRange.includes(':')) {
            throw new Error('Table range must be a cell range.');
        }
        this.#range = upperRange;
        this.#autoFilter.setRange(upperRange);
        if (this.#worksheet) {
            this.setTableColumns();
        }
        return this;
    }

    public setRangeToMaxRow(): this {
        const worksheet = this.#worksheet;
        if (!worksheet || this.#range === '') {
            return this;
        }
        const maxRow = worksheet.getHighestRow();
        const updatedRange = this.#range.replace(/\d+$/, String(maxRow));
        if (updatedRange !== this.#range) {
            this.setRange(updatedRange);
        }
        return this;
    }

    public getWorksheet(): Worksheet {
        return this.#worksheet;
    }

    public setWorksheet(worksheet: Worksheet): this {
        this.#worksheet = worksheet;
        this.#autoFilter.setWorksheet(worksheet);
        this.setTableColumns();
        return this;
    }

    public addColumn(name: string): TableColumn {
        const column = new TableColumn(name, this.#columns.length);
        column.setTable(this);
        this.#columns.push(column);
        return column;
    }

    public getColumns(): TableColumn[] {
        return this.#columns;
    }

    public setColumns(columns: TableColumn[]): this {
        this.#columns = columns;
        for (const column of this.#columns) {
            column.setTable(this);
        }
        return this;
    }

    public getColumn(name: string): TableColumn | undefined {
        return this.#columns.find((col) => col.getName() === name);
    }

    public getColumnOffset(column: string): number | false {
        const columnIndex = this.#columns.findIndex((col) => col.getName() === column);
        return columnIndex === -1 ? false : columnIndex;
    }

    public isColumnInRange(column: string): boolean {
        return this.getColumnOffset(column) !== false;
    }

    public getColumnByOffset(columnOffset: number): TableColumn | false {
        return this.#columns[columnOffset] ?? false;
    }

    public setColumn(columnName: string, column: TableColumn): this {
        const index = this.getColumnOffset(columnName);
        if (index === false) {
            throw new Error(`Column ${columnName} is not in table.`);
        }
        column.setTable(this);
        this.#columns[index] = column;
        return this;
    }

    public clearColumn(columnName: string): this {
        const index = this.getColumnOffset(columnName);
        if (index === false) {
            throw new Error(`Column ${columnName} is not in table.`);
        }
        this.#columns.splice(index, 1);
        return this;
    }

    public shiftColumn(columnName: string, num: number): this {
        const index = this.getColumnOffset(columnName);
        if (index === false) {
            throw new Error(`Column ${columnName} is not in table.`);
        }
        const newIndex = index + num;
        if (newIndex < 0 || newIndex >= this.#columns.length) {
            throw new Error('Column shift is out of range.');
        }
        const [column] = this.#columns.splice(index, 1);
        this.#columns.splice(newIndex, 0, column!);
        return this;
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

    public getShowTotalsRow(): boolean {
        return this.getShowTotals();
    }

    public setShowTotalsRow(show: boolean): this {
        this.showTotals(show);
        return this;
    }

    public getShowTotals(): boolean {
        return this.#showTotals;
    }

    public showHeader(show: boolean): void {
        this.#showHeader = show;
    }

    public getShowHeaderRow(): boolean {
        return this.getShowHeader();
    }

    public setShowHeaderRow(show: boolean): this {
        this.showHeader(show);
        return this;
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

    private setTableColumns(): void {
        if (this.#columns.length > 0) {
            return;
        }
        const [[startCol], [endCol]] = this.getRangeBoundaries();
        const columnCount = Math.max(1, endCol - startCol + 1);
        for (let i = 0; i < columnCount; i++) {
            this.addColumn(`Column${i + 1}`);
        }
    }

    public getRowNumber(): number {
        const [[, startRow]] = this.getRangeBoundaries();
        return this.#showHeader ? startRow : startRow + 1;
    }

    public getRowIdentifier(): string {
        return String(this.getRowNumber());
    }

    public getAllowFilter(): boolean {
        return this.#allowFilter;
    }

    public setAllowFilter(allowFilter: boolean): this {
        this.#allowFilter = allowFilter;
        return this;
    }

    public getStyle(): TableStyle {
        return this.#style;
    }

    public setStyle(style: TableStyle): this {
        this.#style = style;
        style.setTable(this);
        return this;
    }

    public getAutoFilter(): AutoFilter {
        return this.#autoFilter;
    }

    public setAutoFilter(autoFilter: AutoFilter): this {
        this.#autoFilter = autoFilter;
        return this;
    }
}
