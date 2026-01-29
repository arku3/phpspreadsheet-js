import { Spreadsheet } from './spreadsheet.ts';
import { CellCollection } from './cell-collection.ts';
import { Cell, DataType } from './cell.ts';
import { Coordinate } from '../utils/coordinate.ts';
import { Style } from '../style/style.ts';
import { Conditional } from '../style/conditional.ts';
import { Table } from '../worksheet/table.ts';
import { PageSetup } from '../worksheet/page-setup.ts';
import { PageMargins } from '../worksheet/page-margins.ts';
import { ColumnDimension } from '../worksheet/column-dimension.ts';
import { RowDimension } from '../worksheet/row-dimension.ts';
import { SheetView } from '../worksheet/sheet-view.ts';
import { Pane } from '../worksheet/pane.ts';
import { AutoFilter } from '../worksheet/auto-filter.ts';

/**
 * Worksheet in a Spreadsheet.
 */
export class Worksheet {
    // Sheet state constants
    public static readonly SHEETSTATE_VISIBLE = 'visible';
    public static readonly SHEETSTATE_HIDDEN = 'hidden';
    public static readonly SHEETSTATE_VERYHIDDEN = 'veryHidden';

    // Merge cell behaviour constants
    public static readonly MERGE_CELL_CONTENT_EMPTY = 'empty';
    public static readonly MERGE_CELL_CONTENT_HIDE = 'hide';
    public static readonly MERGE_CELL_CONTENT_MERGE = 'merge';

    // Pane state constants
    public static readonly PANE_FROZEN = 'frozen';
    public static readonly PANE_FROZENSPLIT = 'frozenSplit';

    static readonly #VALID_FROZEN_STATE = [
        Worksheet.PANE_FROZEN,
        Worksheet.PANE_FROZENSPLIT,
    ];

    #parent: Spreadsheet;
    #title: string;
    #cellCollection: CellCollection;
    #selectedCells: string = 'A1';
    #sheetState: string = Worksheet.SHEETSTATE_VISIBLE;
    #tables: Table[] = [];
    #pageSetup: PageSetup;
    #pageMargins: PageMargins;
    #sheetView: SheetView;
    #autoFilter: AutoFilter;

    #freezePane: string | null = null;
    #paneTopLeftCell: string = 'A1';
    #topLeftCell: string = 'A1';
    #paneState: string = '';
    #xSplit: number = 0;
    #ySplit: number = 0;
    #activePane: string = '';
    #panes: Record<string, Pane | null> = {
        bottomRight: null,
        bottomLeft: null,
        topRight: null,
        topLeft: null,
    };
    #showGridlines: boolean = true;
    #showRowColHeaders: boolean = true;
    #rightToLeft: boolean = false;

    /**
     * Merge cells array.
     */
    #mergeCells: Record<string, string> = {};

    /**
     * Column dimensions.
     */
    #columnDimensions: Map<string, ColumnDimension> = new Map();

    /**
     * Conditional styles.
     */
    #conditionalStylesCollection: Map<string, Conditional[]> = new Map();

    /**
     * Default column dimension.
     */
    #defaultColumnDimension: ColumnDimension;

    /**
     * Row dimensions.
     */
    #rowDimensions: Map<number, RowDimension> = new Map();

    /**
     * Default row dimension.
     */
    #defaultRowDimension: RowDimension;

    constructor(parent: Spreadsheet, title: string = 'Worksheet') {
        this.#parent = parent;
        this.#title = title;
        this.#cellCollection = new CellCollection();
        this.#pageSetup = new PageSetup();
        this.#pageMargins = new PageMargins();
        this.#sheetView = new SheetView();
        this.#autoFilter = new AutoFilter('', this);
        this.#defaultColumnDimension = new ColumnDimension(null);
        this.#defaultRowDimension = new RowDimension(null);
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
     * Get row dimensions.
     */
    public getRowDimensions(): Map<number, RowDimension> {
        return this.#rowDimensions;
    }

    /**
     * Get default row dimension.
     */
    public getDefaultRowDimension(): RowDimension {
        return this.#defaultRowDimension;
    }

    /**
     * Get row dimension.
     *
     * @param row Numeric row index
     */
    public getRowDimension(row: number): RowDimension {
        let dimension = this.#rowDimensions.get(row);
        if (!dimension) {
            dimension = new RowDimension(row);
            this.#rowDimensions.set(row, dimension);
        }
        return dimension;
    }

    /**
     * Check if row dimension exists.
     *
     * @param row Numeric row index
     */
    public rowDimensionExists(row: number): boolean {
        return this.#rowDimensions.has(row);
    }

    /**
     * Get column dimensions.
     */
    public getColumnDimensions(): Map<string, ColumnDimension> {
        return this.#columnDimensions;
    }

    /**
     * Get default column dimension.
     */
    public getDefaultColumnDimension(): ColumnDimension {
        return this.#defaultColumnDimension;
    }

    /**
     * Get column dimension.
     *
     * @param column Column index (e.g. 'A')
     */
    public getColumnDimension(column: string): ColumnDimension {
        column = column.toUpperCase();
        let dimension = this.#columnDimensions.get(column);
        if (!dimension) {
            dimension = new ColumnDimension(column);
            this.#columnDimensions.set(column, dimension);
        }
        return dimension;
    }

    /**
     * Get column dimension by numeric index.
     *
     * @param columnIndex Numeric column index (1-based)
     */
    public getColumnDimensionByColumn(columnIndex: number): ColumnDimension {
        return this.getColumnDimension(Coordinate.stringFromColumnIndex(columnIndex));
    }

    /**
     * Check if column dimension exists.
     *
     * @param column Column index (e.g. 'A')
     */
    public columnDimensionExists(column: string): boolean {
        return this.#columnDimensions.has(column.toUpperCase());
    }

    /**
     * Get table by name.
     *
     * @param name Table name
     */
    public getTableByName(name: string): Table | undefined {
        const searchName = name.toUpperCase();
        return this.#tables.find(table => table.getName().toUpperCase() === searchName);
    }

    /**
     * Garbage collect.
     */
    public garbageCollect(): this {
        return this;
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

    /**
     * Merge cells.
     *
     * @param range A simple string containing a Cell range like 'A1:E10'
     * @param behaviour Merge cell behaviour
     */
    public mergeCells(range: string, behaviour: string = Worksheet.MERGE_CELL_CONTENT_EMPTY): this {
        range = range.toUpperCase();
        if (!range.includes(':')) {
            range = `${range}:${range}`;
        }

        const match = range.match(/^([A-Z]+)(\d+):([A-Z]+)(\d+)$/);
        if (!match) {
            throw new Error('Merge must be on a valid range of cells.');
        }

        const [, startCol, startRowStr, endCol, endRowStr] = match;
        const startRow = parseInt(startRowStr!, 10);
        const endRow = parseInt(endRowStr!, 10);
        const startColIndex = Coordinate.columnIndexFromString(startCol!);
        const endColIndex = Coordinate.columnIndexFromString(endCol!);

        if (startRow === endRow && startColIndex === endColIndex) {
            return this;
        }

        this.#mergeCells[range] = range;

        // create upper left cell if it does not already exist
        const upperLeft = `${startCol}${startRow}`;
        this.getCell(upperLeft);

        if (behaviour !== Worksheet.MERGE_CELL_CONTENT_HIDE) {
            // Blank out the rest of the cells in the range
            for (let row = startRow; row <= endRow; row++) {
                for (let col = startColIndex; col <= endColIndex; col++) {
                    const coordinate = `${Coordinate.stringFromColumnIndex(col)}${row}`;
                    if (coordinate !== upperLeft) {
                        this.getCell(coordinate).setValue(null);
                    }
                }
            }
        }

        return this;
    }

    /**
     * Unmerge cells.
     *
     * @param range A simple string containing a Cell range like 'A1:E10'
     */
    public unmergeCells(range: string): this {
        range = range.toUpperCase();
        if (this.#mergeCells[range]) {
            delete this.#mergeCells[range];
        } else {
            throw new Error(`Cell range ${range} not known as merged.`);
        }

        return this;
    }

    /**
     * Get merge cells array.
     */
    public getMergeCells(): Record<string, string> {
        return this.#mergeCells;
    }

    /**
     * Get sheet view.
     */
    public getSheetView(): SheetView {
        return this.#sheetView;
    }

    /**
     * Set freeze pane.
     *
     * @param coordinate Cell coordinate (e.g. 'A1')
     * @param topLeftCell Top left cell (e.g. 'A1')
     * @param frozenSplit Whether to use frozen split
     */
    public freezePane(coordinate: string | null, topLeftCell: string | null = null, frozenSplit: boolean = false): this {
        this.#panes = {
            bottomRight: null,
            bottomLeft: null,
            topRight: null,
            topLeft: null,
        };

        let cellAddress = coordinate ? coordinate.toUpperCase() : null;
        if (cellAddress !== null && cellAddress.includes(':')) {
            throw new Error('Freeze pane can not be set on a range of cells.');
        }

        let topLeftAddr = topLeftCell ? topLeftCell.toUpperCase() : null;

        if (cellAddress !== null && topLeftAddr === null) {
            topLeftAddr = 'A1';
        }

        this.#paneTopLeftCell = topLeftAddr ?? 'A1';
        this.#freezePane = cellAddress;
        this.#topLeftCell = this.#paneTopLeftCell;

        if (cellAddress === null) {
            this.#paneState = '';
            this.#xSplit = 0;
            this.#ySplit = 0;
            this.#activePane = '';
        } else {
            const [colIndex, rowIndex] = Coordinate.indexesFromString(cellAddress);
            const [startColIndex, startRowIndex] = Coordinate.indexesFromString(this.#paneTopLeftCell);
            this.#xSplit = Math.max(0, colIndex - startColIndex);
            this.#ySplit = Math.max(0, rowIndex - startRowIndex);

            if (colIndex > startColIndex || rowIndex > startRowIndex) {
                this.#paneState = frozenSplit ? Worksheet.PANE_FROZENSPLIT : Worksheet.PANE_FROZEN;
                this.#setSelectedCellsActivePane();
            } else {
                this.#paneState = '';
                this.#freezePane = null;
                this.#activePane = '';
            }
        }

        return this;
    }

    /**
     * Unfreeze pane.
     */
    public unfreezePane(): this {
        return this.freezePane(null);
    }

    /**
     * Set freeze pane.
     *
     * @param range Range (e.g. 'A1')
     * @param topLeftCell Top left cell (e.g. 'A1')
     * @deprecated Use freezePane() instead
     */
    public setFreezePane(range: string, topLeftCell: string | null = null): this {
        return this.freezePane(range, topLeftCell);
    }

    /**
     * Get freeze pane.
     */
    public getFreezePane(): string | null {
        return this.#freezePane;
    }

    /**
     * Set selected cells active pane.
     */
    #setSelectedCellsActivePane(): void {
        if (this.#freezePane) {
            const [colC, rowC] = Coordinate.indexesFromString(this.#freezePane);
            const [colT, rowT] = Coordinate.indexesFromString(this.getActiveCell());

            let activePane: string;
            if (colC === 1) {
                activePane = (rowT <= rowC) ? 'topLeft' : 'bottomLeft';
            } else if (rowC === 1) {
                activePane = (colT <= colC) ? 'topLeft' : 'topRight';
            } else if (rowT <= rowC) {
                activePane = (colT <= colC) ? 'topLeft' : 'topRight';
            } else {
                activePane = (colT <= colC) ? 'bottomLeft' : 'bottomRight';
            }

            this.setActivePane(activePane);
            this.#panes[activePane] = new Pane(activePane, this.#selectedCells, this.getActiveCell());
        }
    }

    /**
     * Set active pane.
     */
    public setActivePane(activePane: string): this {
        this.#activePane = (activePane in this.#panes) ? activePane : '';
        return this;
    }

    /**
     * Get active pane.
     */
    public getActivePane(): string {
        return this.#activePane;
    }

    /**
     * Get x split.
     */
    public getXSplit(): number {
        return this.#xSplit;
    }

    /**
     * Set x split.
     */
    public setXSplit(xSplit: number): this {
        this.#xSplit = xSplit;
        if (Worksheet.#VALID_FROZEN_STATE.includes(this.#paneState)) {
            const [baseCol, baseRow] = Coordinate.indexesFromString(this.#paneTopLeftCell);
            this.freezePane(
                Coordinate.stringFromCoordinate(baseCol + this.#xSplit - 1, baseRow + this.#ySplit - 1),
                this.#topLeftCell,
                this.#paneState === Worksheet.PANE_FROZENSPLIT
            );
        }
        return this;
    }

    /**
     * Get y split.
     */
    public getYSplit(): number {
        return this.#ySplit;
    }

    /**
     * Set y split.
     */
    public setYSplit(ySplit: number): this {
        this.#ySplit = ySplit;
        if (Worksheet.#VALID_FROZEN_STATE.includes(this.#paneState)) {
            const [baseCol, baseRow] = Coordinate.indexesFromString(this.#paneTopLeftCell);
            this.freezePane(
                Coordinate.stringFromCoordinate(baseCol + this.#xSplit - 1, baseRow + this.#ySplit - 1),
                this.#topLeftCell,
                this.#paneState === Worksheet.PANE_FROZENSPLIT
            );
        }
        return this;
    }

    /**
     * Get panes.
     */
    public getPanes(): Record<string, Pane | null> {
        return this.#panes;
    }

    /**
     * Get pane top left cell.
     */
    public getPaneTopLeftCell(): string {
        return this.#paneTopLeftCell;
    }

    /**
     * Get top left cell.
     */
    public getTopLeftCell(): string {
        return this.#topLeftCell;
    }

    /**
     * Use panes.
     */
    public usesPanes(): boolean {
        return this.#freezePane !== null || this.#xSplit > 0 || this.#ySplit > 0;
    }

    /**
     * Get pane state.
     */
    public getPaneState(): string {
        return this.#paneState;
    }

    /**
     * Set pane state.
     */
    public setPaneState(paneState: string): this {
        this.#paneState = paneState;
        return this;
    }

    /**
     * Get show gridlines.
     */
    public getShowGridlines(): boolean {
        return this.#showGridlines;
    }

    /**
     * Set show gridlines.
     */
    public setShowGridlines(showGridlines: boolean): this {
        this.#showGridlines = showGridlines;
        return this;
    }

    /**
     * Get show row column headers.
     */
    public getShowRowColHeaders(): boolean {
        return this.#showRowColHeaders;
    }

    /**
     * Set show row column headers.
     */
    public setShowRowColHeaders(showRowColHeaders: boolean): this {
        this.#showRowColHeaders = showRowColHeaders;
        return this;
    }

    /**
     * Get auto filter.
     */
    public getAutoFilter(): AutoFilter {
        return this.#autoFilter;
    }

    /**
     * Set auto filter.
     */
    public setAutoFilter(autoFilter: AutoFilter | string): this {
        if (typeof autoFilter === 'string') {
            this.#autoFilter.setRange(autoFilter);
        } else {
            this.#autoFilter = autoFilter;
        }
        return this;
    }

    /**
     * Get right to left.
     */
    public getRightToLeft(): boolean {
        return this.#rightToLeft;
    }

    /**
     * Set right to left.
     */
    public setRightToLeft(rightToLeft: boolean): this {
        this.#rightToLeft = rightToLeft;
        return this;
    }

    /**
     * Set conditional styles.
     *
     * @param range Range (e.g. 'A1:A10')
     * @param styles Array of conditional styles
     */
    public setConditionalStyles(range: string, styles: Conditional[]): this {
        this.#conditionalStylesCollection.set(range.toUpperCase(), styles);
        return this;
    }

    /**
     * Get conditional styles.
     *
     * @param range Range (e.g. 'A1:A10')
     */
    public getConditionalStyles(range: string): Conditional[] {
        return this.#conditionalStylesCollection.get(range.toUpperCase()) ?? [];
    }

    /**
     * Get conditional styles collection.
     */
    public getConditionalStylesCollection(): Map<string, Conditional[]> {
        return this.#conditionalStylesCollection;
    }

    /**
     * Add conditional styles.
     *
     * @param range Range (e.g. 'A1:A10')
     * @param style Conditional style
     * @deprecated Use setConditionalStyles() instead to match PHP API
     */
    public addConditionalFormatting(range: string, style: Conditional): this {
        const styles = this.getConditionalStyles(range);
        styles.push(style);
        this.setConditionalStyles(range, styles);
        return this;
    }

    /**
     * Check if conditional styles exist for a range.
     *
     * @param range Range (e.g. 'A1:A10')
     */
    public hasConditionalStyles(range: string): boolean {
        return this.#conditionalStylesCollection.has(range.toUpperCase());
    }
}
