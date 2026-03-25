import { Worksheet } from '../core/worksheet.ts';
import { Coordinate } from '../utils/coordinate.ts';
import { countCharactersDbcs } from '../utils/string-helper.ts';
import { AutoFilter } from './auto-filter.ts';
import { TableStyle } from './table-style.ts';

/**
 * Table Column.
 */
export class TableColumn {
    #name: string;
    #columnIndex: string;
    #showFilterButton: boolean = true;
    #totalsRowLabel: string | null = null;
    #totalsRowFunction: string | null = null;
    #totalsRowFormula: string | null = null;
    #columnFormula: string | null = null;
    #table: Table | null = null;

    constructor(columnIndex: string, table: Table | null = null) {
        this.#name = '';
        this.#columnIndex = columnIndex;
        this.#table = table;
    }

    public getName(): string {
        return this.#name;
    }

    public setName(name: string): this {
        this.#name = name;
        return this;
    }

    public getIndex(): string {
        return this.#columnIndex;
    }

    public getColumnIndex(): string {
        return this.#columnIndex;
    }

    public setColumnIndex(column: string): this {
        const normalized = column.toUpperCase();
        if (this.#table) {
            this.#table.isColumnInRange(normalized);
        }
        this.#columnIndex = normalized;
        return this;
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

    public static updateStructuredReferences(
        worksheet: Worksheet | null,
        oldTitle: string | null,
        newTitle: string | null,
    ): void {
        if (!worksheet || !oldTitle || oldTitle === '' || newTitle === null) {
            return;
        }
        const workbook = worksheet.getParent();
        if (!workbook) {
            return;
        }
        const escaped = oldTitle.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const pattern = new RegExp(`\[(@?)${escaped}\]`, 'gi');
        for (const sheet of workbook.getAllSheets()) {
            for (const coordinate of sheet.getCoordinates(false)) {
                const cell = sheet.getCellOrNull(coordinate);
                if (!cell || cell.getDataType() !== 'f') {
                    continue;
                }
                const value = String(cell.getValue());
                const updated = value.replace(pattern, `[$1${newTitle}]`);
                if (updated !== value) {
                    cell.setValueExplicit(updated, 'f');
                }
            }
        }

        for (const namedFormula of workbook.getNamedFormulae()) {
            const formula = namedFormula.getFormula();
            const updated = formula.replace(pattern, `[$1${newTitle}]`);
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
    #name: string = '';
    #range: string = '';
    #worksheet: Worksheet | null = null;
    #columns: Map<string, TableColumn> = new Map();
    #showTotals: boolean = false;
    #showHeader: boolean = true;
    #allowFilter: boolean = true;
    #autoFilter: AutoFilter;
    #style: TableStyle;

    constructor(range: string = '', name: string = '', worksheet: Worksheet | null = null) {
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
        if (countCharactersDbcs(name) > 255) {
            throw new Error('Table name cannot be longer than 255 characters.');
        }
        if (/^[A-Za-z]+\d+$/.test(name)) {
            throw new Error('Table name cannot be a valid cell reference.');
        }
        if (!/^[A-Za-z_\\][\p{L}\p{M}0-9._\\]*$/u.test(name)) {
            throw new Error(`Table name ${name} is not valid.`);
        }
        const worksheet = this.#worksheet;
        const oldName = this.#name;
        this.checkForDuplicateTableNames(worksheet, name);
        TableColumn.updateStructuredReferences(worksheet, oldName, name);
        this.#name = name;
        return this;
    }

    public getRange(): string {
        return this.#range;
    }

    public setRange(range: string): this {
        if (range === '') {
            this.#range = '';
            this.#columns.clear();
            this.#autoFilter.setRange('');
            return this;
        }

        const rawRange = range.toUpperCase();
        const sheetSplit = rawRange.split('!');
        const upperRange = (sheetSplit[1] ?? rawRange).replace(/\$/g, '');
        if (!upperRange.includes(':')) {
            throw new Error('Table range must be a cell range.');
        }

        const [[startCol, startRow], [endCol, endRow]] = Coordinate.rangeBoundaries(upperRange);
        const width = Math.abs(endCol - startCol) + 1;
        const height = Math.abs(endRow - startRow) + 1;
        if (width < 1 || height < 1) {
            throw new Error('Table range must be at least one cell.');
        }

        this.#range = upperRange;
        this.#autoFilter.setRange(upperRange);

        for (const [columnIndex] of this.#columns) {
            const columnOffset = Coordinate.columnIndexFromString(columnIndex);
            if (columnOffset < startCol || columnOffset > endCol) {
                this.#columns.delete(columnIndex);
            }
        }

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

    public getWorksheet(): Worksheet | null {
        return this.#worksheet;
    }

    public setWorksheet(worksheet: Worksheet | null): this {
        if (this.#name !== '' && worksheet) {
            this.checkForDuplicateTableNames(worksheet, this.#name);
        }
        this.#worksheet = worksheet;
        this.#autoFilter.setWorksheet(worksheet);
        if (worksheet) {
            this.setTableColumns();
        }
        return this;
    }

    public addColumn(name: string): TableColumn {
        if (!this.#range) {
            const columnIndex = Coordinate.stringFromColumnIndex(this.#columns.size + 1);
            const column = new TableColumn(columnIndex, this);
            column.setName(name);
            this.#columns.set(columnIndex, column);
            this.sortColumns();
            return column;
        }

        const [[startCol], [endCol]] = this.getRangeBoundaries();
        const columnOffset = this.#columns.size;
        const maxOffset = Math.max(1, endCol - startCol + 1);
        const columnIndex = Coordinate.stringFromColumnIndex(startCol + Math.min(columnOffset, maxOffset - 1));
        const column = new TableColumn(columnIndex, this);
        column.setName(name);
        this.#columns.set(columnIndex, column);
        this.sortColumns();
        return column;
    }

    public getColumns(): Map<string, TableColumn> {
        return this.#columns;
    }

    public setColumns(columns: TableColumn[]): this {
        this.#columns.clear();
        for (const column of columns) {
            column.setTable(this);
            this.#columns.set(column.getColumnIndex(), column);
        }
        this.sortColumns();
        return this;
    }

    public getColumn(column: string): TableColumn {
        const normalized = column.toUpperCase();
        this.isColumnInRange(normalized);
        const existing = this.#columns.get(normalized);
        if (existing) {
            return existing;
        }
        const newColumn = new TableColumn(normalized, this);
        this.#columns.set(normalized, newColumn);
        this.sortColumns();
        return newColumn;
    }

    public getColumnOffset(column: string): number {
        return this.isColumnInRange(column.toUpperCase());
    }

    public isColumnInRange(column: string): number {
        if (this.#range === '') {
            throw new Error('Table range is not set.');
        }
        const normalized = column.toUpperCase();
        const [[startCol], [endCol]] = this.getRangeBoundaries();
        const columnIndex = Coordinate.columnIndexFromString(normalized);
        if (columnIndex < startCol || columnIndex > endCol) {
            throw new Error(`Column ${normalized} is not in table range.`);
        }
        return columnIndex - startCol;
    }

    public getColumnByOffset(columnOffset: number): TableColumn {
        const [[startCol]] = this.getRangeBoundaries();
        const columnIndex = Coordinate.stringFromColumnIndex(startCol + columnOffset);
        return this.getColumn(columnIndex);
    }

    public setColumn(columnObjectOrString: TableColumn | string): this {
        let column: string;

        if (typeof columnObjectOrString === 'string' && columnObjectOrString !== '') {
            column = columnObjectOrString.toUpperCase();
        } else if (columnObjectOrString instanceof TableColumn) {
            column = columnObjectOrString.getColumnIndex().toUpperCase();
        } else {
            throw new Error('Column is not within the table range.');
        }

        this.isColumnInRange(column);

        if (typeof columnObjectOrString === 'string') {
            this.#columns.set(column, new TableColumn(column, this));
        } else {
            columnObjectOrString.setTable(this);
            this.#columns.set(column, columnObjectOrString);
        }

        this.sortColumns();
        return this;
    }

    public clearColumn(columnName: string): this {
        const normalized = columnName.toUpperCase();
        this.isColumnInRange(normalized);
        this.#columns.delete(normalized);
        return this;
    }

    public shiftColumn(columnName: string, newColumn: string): this {
        const normalized = columnName.toUpperCase();
        const to = newColumn.toUpperCase();
        const column = this.#columns.get(normalized);
        if (column) {
            column.setTable(null);
            column.setColumnIndex(to);
            this.#columns.set(to, column);
            column.setTable(this);
            this.#columns.delete(normalized);

            this.sortColumns();
        }
        return this;
    }

    public updateColumnName(oldName: string, newName: string): boolean {
        const oldValue = oldName.toLowerCase();
        for (const column of this.#columns.values()) {
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
        if (this.#columns.size > 0) {
            return;
        }
        const [[startCol], [endCol]] = this.getRangeBoundaries();
        const columnCount = Math.max(1, endCol - startCol + 1);
        for (let i = 0; i < columnCount; i++) {
            const columnIndex = Coordinate.stringFromColumnIndex(startCol + i);
            const column = new TableColumn(columnIndex, this);
            column.setName(`Column${i + 1}`);
            this.#columns.set(columnIndex, column);
        }
        this.sortColumns();
    }

    public getRowNumber(coordinate: string): number {
        const [[, startRow]] = this.getRangeBoundaries();
        const [, row] = Coordinate.coordinateFromString(coordinate);
        return row - startRow;
    }

    public getRowIdentifier(): string {
        return String(this.getRange());
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

    private checkForDuplicateTableNames(worksheet: Worksheet | null, name: string): void {
        if (!worksheet) {
            return;
        }
        const workbook = worksheet.getParent();
        if (!workbook) {
            return;
        }
        const targetName = name.toLowerCase();
        for (const sheet of workbook.getAllSheets()) {
            for (const table of sheet.getTables()) {
                if (table !== this && table.getName().toLowerCase() === targetName) {
                    throw new Error(`Table name ${name} is already in use.`);
                }
            }
        }
    }

    private sortColumns(): void {
        const sortedEntries = [...this.#columns.entries()].sort(
            ([left], [right]) => Coordinate.columnIndexFromString(left) - Coordinate.columnIndexFromString(right),
        );
        this.#columns.clear();
        for (const [key, value] of sortedEntries) {
            this.#columns.set(key, value);
        }
    }
}
