import type { CellCache } from '../caching/cell-cache.ts';
import { Alignment } from '../style/alignment.ts';
import { Color } from '../style/color.ts';
import { Conditional } from '../style/conditional.ts';
import { Font } from '../style/font.ts';
import { Style } from '../style/style.ts';
import { Coordinate } from '../utils/coordinate.ts';
import { AutoFilter } from '../worksheet/auto-filter.ts';
import { Chart } from '../worksheet/chart/chart.ts';
import { ColumnDimension } from '../worksheet/column-dimension.ts';
import type { BaseDrawing } from '../worksheet/drawing/base-drawing.ts';
import { HeaderFooter } from '../worksheet/header-footer.ts';
import { PageMargins } from '../worksheet/page-margins.ts';
import { PageSetup } from '../worksheet/page-setup.ts';
import { Pane } from '../worksheet/pane.ts';
import { RowDimension } from '../worksheet/row-dimension.ts';
import { SheetView } from '../worksheet/sheet-view.ts';
import { Table } from '../worksheet/table.ts';
import { CellCollection } from './cell-collection.ts';
import { Cell, DataType, type TDataType } from './cell.ts';
import { CellsFactory } from './cells-factory.ts';
import { Comment } from './comment.ts';
import { DataValidation } from './data-validation.ts';
import { Hyperlink } from './hyperlink.ts';
import type { IValueBinder } from './i-value-binder.ts';
import { ProtectedRange } from './protected-range.ts';
import { Spreadsheet } from './spreadsheet.ts';

/**
 * Worksheet in a Spreadsheet.
 */
export class Worksheet {
    public static readonly INVALID_CHARACTERS: string[] = ['*', ':', '/', '\\', '?', '[', ']'];
    public static readonly SHEET_TITLE_MAXIMUM_LENGTH: number = 31;

    public static getInvalidCharacters(): string[] {
        return Worksheet.INVALID_CHARACTERS;
    }
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

    // Page breaks
    public static readonly BREAK_ROW = 'row';
    public static readonly BREAK_COLUMN = 'column';

    static readonly #VALID_FROZEN_STATE = [Worksheet.PANE_FROZEN, Worksheet.PANE_FROZENSPLIT];

    #parent: Spreadsheet | null;
    #title: string;
    #cellCollection: CellCollection;
    #selectedCells: string = 'A1';
    #sheetState: string = Worksheet.SHEETSTATE_VISIBLE;
    #tables: Table[] = [];
    #pageSetup: PageSetup;
    #pageMargins: PageMargins;
    #headerFooter: HeaderFooter;
    #breaks: Map<string, string> = new Map();
    #sheetView: SheetView;
    #autoFilter: AutoFilter;

    /**
     * Sparse collection of worksheet drawings (images/shapes), stored in insertion order.
     */
    #drawingCollection: BaseDrawing[] = [];

    /**
     * Sparse collection of worksheet charts, stored in insertion order.
     */
    #chartCollection: Chart[] = [];

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
     * Worksheet code name (VBA / internal code name).
     *
     * Reader note: this is distinct from the sheet title.
     */
    #codeName: string | null = null;

    /**
     * Worksheet tab color.
     *
     * This models the OOXML `sheetPr/tabColor` element.
     *
     * When `null`, the tab color is considered unset.
     */
    #tabColor: Color | null = null;

    /**
     * Outline summaries placement.
     *
     * These model the OOXML `sheetPr/outlinePr` attributes.
     */
    #showSummaryRight: boolean = true;
    #showSummaryBelow: boolean = true;

    /**
     * Print gridlines.
     *
     * This models the OOXML `printOptions` gridlines behavior.
     */
    #printGridlines: boolean = false;

    /**
     * Merge cells array.
     */
    #mergeCells: Record<string, string> = {};

    /**
     * Collection of row dimensions.
     */
    #rowDimensions: Map<number, RowDimension> = new Map();

    /**
     * Collection of conditional styles.
     */
    #conditionalStylesCollection: Map<string, Conditional[]> = new Map();

    /**
     * Collection of data validations.
     */
    #dataValidationCollection: Map<string, DataValidation> = new Map();

    /**
     * Protected cell ranges.
     */
    #protectedCells: Map<string, ProtectedRange> = new Map();

    /**
     * Sparse collection of classic cell comments, keyed by A1 coordinate (no $).
     */
    #comments: Map<string, Comment> = new Map();
    #hyperlinkCollection: Map<string, Hyperlink> = new Map();

    /**
     * Default column dimension.
     */
    #defaultColumnDimension: ColumnDimension;

    /**
     * Collection of column dimensions.
     */
    #columnDimensions: Map<string, ColumnDimension> = new Map();

    /**
     * Default row dimension.
     */
    #defaultRowDimension: RowDimension;

    constructor(parent: Spreadsheet, title: string = 'Worksheet') {
        this.#parent = parent;
        this.#title = title;
        // Match PhpSpreadsheet: default codeName is derived from the title.
        this.setCodeName(this.#title);
        this.#cellCollection = CellsFactory.getInstance(this, parent.getDefaultCacheStrategy());
        this.#pageSetup = new PageSetup();
        this.#pageMargins = new PageMargins();
        this.#headerFooter = new HeaderFooter();
        this.#sheetView = new SheetView();
        this.#autoFilter = new AutoFilter('', this);
        this.#defaultColumnDimension = new ColumnDimension(null);
        this.#defaultRowDimension = new RowDimension(null);
    }

    /**
     * Get worksheet code name.
     */
    public getCodeName(): string | null {
        return this.#codeName;
    }

    /**
     * Set worksheet code name.
     */
    public setCodeName(codeName: string): this {
        const trimmed = codeName.trim();
        if (trimmed.length === 0) {
            throw new Error('Sheet code name cannot be empty.');
        }
        if (
            Worksheet.INVALID_CHARACTERS.some((char) => trimmed.includes(char)) ||
            trimmed.startsWith("'") ||
            trimmed.endsWith("'")
        ) {
            throw new Error('Invalid character found in sheet code name');
        }
        if (trimmed.length > Worksheet.SHEET_TITLE_MAXIMUM_LENGTH) {
            throw new Error(`Maximum ${Worksheet.SHEET_TITLE_MAXIMUM_LENGTH} characters allowed in sheet code name.`);
        }

        let uniqueCodeName = trimmed;
        if (this.#parent) {
            let i = 1;
            while (true) {
                const existing = this.#parent.getSheetByCodeName(uniqueCodeName);
                if (!existing || existing === this) {
                    break;
                }
                const suffix = `_${i}`;
                let base = trimmed;
                if (base.length + suffix.length > Worksheet.SHEET_TITLE_MAXIMUM_LENGTH) {
                    base = base.slice(0, Worksheet.SHEET_TITLE_MAXIMUM_LENGTH - suffix.length);
                }
                uniqueCodeName = `${base}${suffix}`;
                i += 1;
            }
        }

        this.#codeName = uniqueCodeName;
        return this;
    }

    public hasCodeName(): boolean {
        return this.#codeName !== null;
    }

    /**
     * Get worksheet tab color.
     */
    public getTabColor(): Color {
        if (this.#tabColor === null) {
            this.#tabColor = new Color();
        }
        return this.#tabColor;
    }

    /**
     * Reset worksheet tab color.
     *
     * After calling this, the tab color is considered unset until `getTabColor()` is accessed.
     */
    public resetTabColor(): this {
        this.#tabColor = null;
        return this;
    }

    /**
     * True if a worksheet tab color has been set.
     */
    public isTabColorSet(): boolean {
        return this.#tabColor !== null;
    }

    /**
     * Get show summary right.
     */
    public getShowSummaryRight(): boolean {
        return this.#showSummaryRight;
    }

    /**
     * Set show summary right.
     */
    public setShowSummaryRight(value: boolean): this {
        this.#showSummaryRight = value;
        return this;
    }

    /**
     * Get show summary below.
     */
    public getShowSummaryBelow(): boolean {
        return this.#showSummaryBelow;
    }

    /**
     * Set show summary below.
     */
    public setShowSummaryBelow(value: boolean): this {
        this.#showSummaryBelow = value;
        return this;
    }

    /**
     * Get print gridlines.
     */
    public getPrintGridlines(): boolean {
        return this.#printGridlines;
    }

    /**
     * Set print gridlines.
     */
    public setPrintGridlines(value: boolean): this {
        this.#printGridlines = value;
        return this;
    }

    static readonly #MAX_COLUMN_INDEX = 16384;
    static readonly #MAX_ROW_INDEX = 1048576;

    /**
     * Normalize a top-left style coordinate (A1) or return null if invalid.
     *
     * Intended for reader implementations: do not poison worksheet state
     * with invalid coordinates.
     */
    static #tryNormalizeTopLeftA1Coordinate(cellCoordinate: string): string | null {
        const cleaned = cellCoordinate.trim().replace(/\$/g, '').toUpperCase();
        if (cleaned === '') return null;
        if (cleaned.includes('!')) return null;
        if (cleaned.includes(':') || cleaned.includes(',') || /\s/.test(cleaned)) return null;

        const match = cleaned.match(/^([A-Z]{1,3})(\d{1,7})$/);
        if (!match) return null;

        const col = match[1]!;
        const row = Number.parseInt(match[2]!, 10);
        if (!Number.isFinite(row) || row < 1 || row > Worksheet.#MAX_ROW_INDEX) return null;

        const colIdx = Coordinate.columnIndexFromString(col);
        if (colIdx < 1 || colIdx > Worksheet.#MAX_COLUMN_INDEX) return null;

        return `${col}${row}`;
    }

    static #normalizeCellCoordinateInput(coordinate: string | [string | number, number]): string {
        if (Array.isArray(coordinate)) {
            const [column, row] = coordinate;
            if (!Number.isFinite(row) || row < 1) {
                throw new Error('Row and Column Ids must be positive integer values');
            }
            if (typeof column === 'number' && (!Number.isFinite(column) || column < 1)) {
                throw new Error('Row and Column Ids must be positive integer values');
            }
            const columnLetters =
                typeof column === 'number' ? Coordinate.stringFromColumnIndex(column) : String(column).toUpperCase();
            if (!/^[A-Z]+$/.test(columnLetters)) {
                throw new Error('Row and Column Ids must be positive integer values');
            }
            return `${columnLetters}${row}`;
        }

        const original = coordinate;
        let normalized = coordinate.trim();
        if (normalized.length === 0) {
            throw new Error('Cell coordinate can not be zero-length string');
        }
        if (normalized.includes('!')) {
            const parts = normalized.split('!');
            normalized = parts[parts.length - 1] ?? '';
        }
        if (normalized.includes(':') || normalized.includes(',')) {
            throw new Error('Cell coordinate string can not be a range of cells');
        }
        normalized = normalized.replace(/\$/g, '').toUpperCase();
        const match = normalized.match(/^([A-Z]+)([1-9]\d*)$/);
        if (!match) {
            throw new Error(`Invalid cell coordinate ${original}`);
        }
        const colLetters = match[1]!;
        const rowValue = Number.parseInt(match[2]!, 10);
        const colIndex = Coordinate.columnIndexFromString(colLetters);
        if (
            !Number.isFinite(rowValue) ||
            rowValue < 1 ||
            rowValue > Worksheet.#MAX_ROW_INDEX ||
            colIndex < 1 ||
            colIndex > Worksheet.#MAX_COLUMN_INDEX
        ) {
            throw new Error(`Invalid cell coordinate ${original}`);
        }
        return normalized;
    }

    /**
     * Get a readonly view of all drawings on this worksheet.
     */
    public getDrawingCollection(): ReadonlyArray<BaseDrawing> {
        return this.#drawingCollection;
    }

    /**
     * Get in-cell drawing collection.
     */
    public getInCellDrawingCollection(): ReadonlyArray<BaseDrawing> {
        return this.#drawingCollection;
    }

    /**
     * Get a readonly view of all charts on this worksheet.
     */
    public getChartCollection(): readonly Chart[] {
        return this.#chartCollection;
    }

    public getChartCount(): number {
        return this.#chartCollection.length;
    }

    public getChartByIndex(index: number | null): Chart | false {
        const chartCount = this.#chartCollection.length;
        if (chartCount === 0) {
            return false;
        }
        let chartIndex = index ?? chartCount - 1;
        if (!this.#chartCollection[chartIndex]) {
            return false;
        }
        return this.#chartCollection[chartIndex]!;
    }

    public getChartNames(): string[] {
        return this.#chartCollection.map((chart) => chart.getName());
    }

    public getChartByName(chartName: string): Chart | false {
        for (const chart of this.#chartCollection) {
            if (chart.getName() === chartName) {
                return chart;
            }
        }
        return false;
    }

    public getChartByNameOrThrow(chartName: string): Chart {
        const chart = this.getChartByName(chartName);
        if (chart !== false) {
            return chart;
        }
        throw new Error(`Sheet does not have a chart named ${chartName}.`);
    }

    /**
     * Add a chart to this worksheet.
     *
     * If the chart is already attached to a different worksheet, this will throw.
     */
    public addChart(chart: Chart): void {
        const existingWorksheet = chart.getWorksheet();
        if (existingWorksheet !== null && existingWorksheet !== this) {
            throw new Error('A Worksheet has already been assigned. Charts can only exist on one Worksheet.');
        }

        if (!this.#chartCollection.includes(chart)) {
            this.#chartCollection.push(chart);
        }
        chart.setWorksheet(this);
    }

    /**
     * Remove a chart from this worksheet.
     */
    public removeChart(chart: Chart): void {
        const idx = this.#chartCollection.indexOf(chart);
        if (idx >= 0) {
            this.#chartCollection.splice(idx, 1);
        }
        if (chart.getWorksheet() === this) {
            chart.detach();
        }
    }

    /**
     * Add a drawing to this worksheet.
     *
     * If the drawing is already attached to a different worksheet, this will throw.
     */
    public addDrawing(drawing: BaseDrawing): this {
        const existingWorksheet = drawing.getWorksheet();
        if (existingWorksheet !== null && existingWorksheet !== this) {
            throw new Error('A Worksheet has already been assigned. Drawings can only exist on one Worksheet.');
        }

        if (!this.#drawingCollection.includes(drawing)) {
            this.#drawingCollection.push(drawing);
        }
        drawing.setWorksheet(this);

        // Ensure the anchor cell exists, matching PhpSpreadsheet behavior.
        // (IO can rely on this later when writing anchors.)
        this.getCell(drawing.getCoordinates());
        return this;
    }

    /**
     * Remove a drawing from this worksheet.
     */
    public removeDrawing(drawing: BaseDrawing): this {
        const idx = this.#drawingCollection.indexOf(drawing);
        if (idx >= 0) {
            this.#drawingCollection.splice(idx, 1);
        }
        if (drawing.getWorksheet() === this) {
            drawing.detach();
        }
        return this;
    }

    /**
     * Normalize a cell coordinate for comment access.
     *
     * PhpSpreadsheet constraints:
     * - must not be a range
     * - must not be an absolute reference (no '$')
     */
    static #normalizeCommentCoordinate(cellCoordinate: string): string {
        const coordinate = cellCoordinate.toUpperCase();
        if (Coordinate.coordinateIsRange(coordinate)) {
            throw new Error('Cell coordinate string can not be a range of cells.');
        }
        if (coordinate.includes('!')) {
            throw new Error('Cell coordinate must not include a worksheet reference.');
        }
        if (coordinate.includes('$')) {
            throw new Error('Cell coordinate string must not be absolute.');
        }
        if (coordinate.length === 0) {
            throw new Error('Cell coordinate can not be zero-length string.');
        }
        if (!/^[A-Z]+\d+$/.test(coordinate)) {
            throw new Error('Cell coordinate string is not a valid A1 reference.');
        }
        return coordinate;
    }

    /**
     * Get comment for a cell.
     *
     * @param cellCoordinate Cell coordinate (e.g. 'A1')
     * @param create If true, create and attach a comment when absent
     */
    public getComment(cellCoordinate: string, create: boolean = true): Comment {
        const coord = Worksheet.#normalizeCommentCoordinate(cellCoordinate);
        const existing = this.#comments.get(coord);
        if (existing) {
            return existing;
        }

        const comment = new Comment();
        if (create) {
            this.#comments.set(coord, comment);
        }
        return comment;
    }

    /**
     * Try get comment for a cell.
     *
     * @param cellCoordinate Cell coordinate (e.g. 'A1')
     */
    public tryGetComment(cellCoordinate: string): Comment | null {
        const coord = Worksheet.#normalizeCommentCoordinate(cellCoordinate);
        return this.#comments.get(coord) ?? null;
    }

    /**
     * True if a comment is present for the cell.
     *
     * @param cellCoordinate Cell coordinate (e.g. 'A1')
     */
    public hasComment(cellCoordinate: string): boolean {
        const coord = Worksheet.#normalizeCommentCoordinate(cellCoordinate);
        return this.#comments.has(coord);
    }

    /**
     * Remove a comment from a cell.
     *
     * @param cellCoordinate Cell coordinate (e.g. 'A1')
     */
    public removeComment(cellCoordinate: string): this {
        const coord = Worksheet.#normalizeCommentCoordinate(cellCoordinate);
        this.#comments.delete(coord);
        return this;
    }

    /**
     * Get a readonly view of all comments, keyed by A1 coordinate.
     */
    public getComments(): ReadonlyMap<string, Comment> {
        return this.#comments;
    }

    /**
     * Replace the full comment map.
     *
     * Intended for reader implementations.
     */
    public setComments(comments: Map<string, Comment>): this {
        this.#comments = comments;
        return this;
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
    public getParent(): Spreadsheet | null {
        return this.#parent;
    }

    /**
     * Set parent spreadsheet.
     */
    public setParent(parent: Spreadsheet): this {
        this.#parent = parent;
        return this;
    }

    /**
     * Rebind worksheet to a new parent spreadsheet.
     */
    public rebindParent(parent: Spreadsheet): this {
        if (this.#parent) {
            const definedNames = this.#parent.getDefinedNames();
            for (const definedName of definedNames) {
                parent.addDefinedName(definedName);
            }

            const index = this.#parent.getIndex(this, true);
            if (index >= 0) {
                this.#parent.removeSheetByIndex(index);
            }
        }

        this.#parent = parent;
        return this;
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
    public setTitle(title: string, _updateFormulaCellReferences: boolean = true, _validate: boolean = true): this {
        const validatedTitle = _validate ? Worksheet.#checkSheetTitle(title) : title;
        const previousTitle = this.#title;
        this.#title = validatedTitle;
        if (this.#codeName === null || this.#codeName === previousTitle) {
            this.setCodeName(validatedTitle);
        }
        return this;
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
        if (!coordinate) {
            throw new Error('Cell coordinate can not be zero-length string');
        }
        this.#selectedCells = coordinate.toUpperCase();
        this.#setSelectedCellsActivePane();
        return this;
    }

    public setSelectedCell(cell: string): this {
        return this.setSelectedCells(cell);
    }

    /**
     * Set the cell caching strategy for this worksheet.
     * Note: This should be called before adding cells to the worksheet.
     * Changing the cache strategy does not migrate existing cells.
     *
     * @param cache - CellCache implementation to use
     * @returns this
     */
    public setCacheStrategy(cache: CellCache): this {
        this.#cellCollection.setCacheStrategy(cache);
        return this;
    }

    /**
     * Get the current cell caching strategy.
     * @returns Current CellCache implementation
     */
    public getCacheStrategy(): CellCache {
        return this.#cellCollection.getCacheStrategy();
    }

    public getCacheStrategyOrNull(): CellCache | null {
        return this.#cellCollection.getCacheStrategy();
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

    public setActiveCell(cell: string): this {
        return this.setSelectedCells(cell);
    }

    static #checkSheetTitle(sheetTitle: string): string {
        if (Worksheet.INVALID_CHARACTERS.some((char) => sheetTitle.includes(char))) {
            throw new Error('Invalid character found in sheet title');
        }
        if (sheetTitle.length > Worksheet.SHEET_TITLE_MAXIMUM_LENGTH) {
            throw new Error(`Maximum ${Worksheet.SHEET_TITLE_MAXIMUM_LENGTH} characters allowed in sheet title.`);
        }
        return sheetTitle;
    }

    static #normalizeRangeInput(range: string | [number, number] | [number, number, number, number]): string {
        if (Array.isArray(range)) {
            if (range.length === 2) {
                const [col, row] = range;
                return Worksheet.#normalizeCellCoordinateInput([col, row]);
            }
            if (range.length === 4) {
                const [fromCol, fromRow, toCol, toRow] = range;
                const start = Worksheet.#normalizeCellCoordinateInput([fromCol, fromRow]);
                const end = Worksheet.#normalizeCellCoordinateInput([toCol, toRow]);
                return `${start}:${end}`;
            }
            throw new Error('Cell coordinate string is not a valid A1 reference.');
        }

        const trimmed = range.trim();
        if (trimmed.length === 0) {
            throw new Error('Cell coordinate can not be zero-length string');
        }
        let normalized = trimmed;
        if (normalized.includes('!')) {
            const parts = normalized.split('!');
            normalized = parts[parts.length - 1] ?? '';
        }
        if (normalized.includes(':')) {
            const [start, end] = normalized.split(':');
            if (!start || !end) {
                throw new Error('Cell coordinate string can not be a range of cells');
            }
            const normalizedStart = Worksheet.#normalizeCellCoordinateInput(start);
            const normalizedEnd = Worksheet.#normalizeCellCoordinateInput(end);
            return `${normalizedStart}:${normalizedEnd}`;
        }
        return Worksheet.#normalizeCellCoordinateInput(normalized);
    }

    /**
     * Get cell by coordinate.
     */
    public getCell(coordinate: string | [string | number, number]): Cell {
        if (typeof coordinate === 'string') {
            let trimmed = coordinate.trim();
            if (trimmed.includes('!')) {
                if (!this.#parent) {
                    throw new Error('Worksheet has no parent spreadsheet.');
                }
                const parts = trimmed.split('!');
                const cellRef = parts.pop() ?? '';
                const sheetNameRaw = parts.join('!');
                const sheetName = sheetNameRaw.replace(/^'+|'+$/g, '');
                const sheet = this.#parent.getSheetByName(sheetName);
                if (!sheet) {
                    throw new Error(`Sheet "${sheetName}" does not exist.`);
                }
                return sheet.getCell(cellRef);
            }

            if (this.#parent) {
                const namedRange = this.#parent.getNamedRange(trimmed, this);
                if (namedRange) {
                    let rangeRef = namedRange.getRange();
                    if (rangeRef.includes('!')) {
                        const rangeParts = rangeRef.split('!');
                        rangeRef = rangeParts.pop() ?? '';
                    }
                    const topLeft = rangeRef.split(':')[0] ?? rangeRef;
                    const rangeSheet = namedRange.getWorksheet();
                    if (rangeSheet && rangeSheet !== this) {
                        return rangeSheet.getCell(topLeft);
                    }
                    trimmed = topLeft;
                }
            }

            const normalized = Worksheet.#normalizeCellCoordinateInput(trimmed);
            const cell = this.#cellCollection.get(normalized);
            if (cell) {
                return cell;
            }
            return this.createNewCell(normalized);
        }

        const normalized = Worksheet.#normalizeCellCoordinateInput(coordinate);
        const cell = this.#cellCollection.get(normalized);
        if (cell) {
            return cell;
        }
        return this.createNewCell(normalized);
    }

    public getCellOrNull(coordinate: string | [string | number, number]): Cell | null {
        if (typeof coordinate === 'string') {
            let trimmed = coordinate.trim();
            if (trimmed.includes('!')) {
                if (!this.#parent) {
                    throw new Error('Worksheet has no parent spreadsheet.');
                }
                const parts = trimmed.split('!');
                const cellRef = parts.pop() ?? '';
                const sheetNameRaw = parts.join('!');
                const sheetName = sheetNameRaw.replace(/^'+|'+$/g, '');
                const sheet = this.#parent.getSheetByName(sheetName);
                if (!sheet) {
                    throw new Error(`Sheet "${sheetName}" does not exist.`);
                }
                return sheet.getCellOrNull(cellRef);
            }

            if (this.#parent) {
                const namedRange = this.#parent.getNamedRange(trimmed, this);
                if (namedRange) {
                    let rangeRef = namedRange.getRange();
                    if (rangeRef.includes('!')) {
                        const rangeParts = rangeRef.split('!');
                        rangeRef = rangeParts.pop() ?? '';
                    }
                    const topLeft = rangeRef.split(':')[0] ?? rangeRef;
                    const rangeSheet = namedRange.getWorksheet();
                    if (rangeSheet && rangeSheet !== this) {
                        return rangeSheet.getCellOrNull(topLeft);
                    }
                    trimmed = topLeft;
                }
            }

            const normalized = Worksheet.#normalizeCellCoordinateInput(trimmed);
            return this.#cellCollection.get(normalized) ?? null;
        }

        const normalized = Worksheet.#normalizeCellCoordinateInput(coordinate);
        return this.#cellCollection.get(normalized) ?? null;
    }

    /**
     * Create a new cell at coordinate.
     */
    public createNewCell(coordinate: string | [string | number, number]): Cell {
        const normalized = Worksheet.#normalizeCellCoordinateInput(coordinate);
        const existing = this.#cellCollection.get(normalized);
        if (existing) {
            return existing;
        }
        const [colIndex, rowIndex] = Coordinate.indexesFromString(normalized);
        const cell = new Cell(null, DataType.TYPE_NULL, this, Coordinate.stringFromColumnIndex(colIndex), rowIndex);
        this.#cellCollection.add(normalized, cell);

        const rowDimension = this.#rowDimensions.get(rowIndex);
        if (rowDimension) {
            const rowXf = rowDimension.getXfIndex();
            if (rowXf !== null && rowXf > 0) {
                cell.setXfIndex(rowXf);
                return cell;
            }
        }

        const columnKey = Coordinate.stringFromColumnIndex(colIndex);
        const columnDimension = this.#columnDimensions.get(columnKey);
        if (columnDimension) {
            const colXf = columnDimension.getXfIndex();
            if (colXf !== null && colXf > 0) {
                cell.setXfIndex(colXf);
            }
        }

        return cell;
    }

    /**
     * Does the cell exist?
     */
    public cellExists(coordinate: string | [string | number, number]): boolean {
        const cell = this.getCellOrNull(coordinate);
        return cell !== null;
    }

    /**
     * Get all coordinates with values.
     */
    public getCoordinates(sorted: boolean = true): string[] {
        const coordinates = [...this.#cellCollection.getCoordinates()];
        if (!sorted) {
            return coordinates;
        }
        return coordinates.sort((a, b) => {
            const [colA, rowA] = Coordinate.indexesFromString(a);
            const [colB, rowB] = Coordinate.indexesFromString(b);
            if (rowA !== rowB) {
                return rowA - rowB;
            }
            return colA - colB;
        });
    }

    /**
     * Set cell value.
     */
    public setCellValue(
        coordinate: string | [string | number, number],
        value: any,
        binder: IValueBinder | null = null,
    ): Worksheet {
        if (!this.#parent) {
            throw new Error('Worksheet has no parent spreadsheet.');
        }
        const cell = this.getCell(coordinate);
        cell.setValue(value, binder);
        this.#parent.clearCalculationCache();
        return this;
    }

    /**
     * Set cell value explicitly.
     */
    public setCellValueExplicit(
        coordinate: string | [string | number, number],
        value: any,
        dataType: TDataType = DataType.TYPE_STRING,
    ): Worksheet {
        if (!this.#parent) {
            throw new Error('Worksheet has no parent spreadsheet.');
        }
        const cell = this.getCell(coordinate);
        cell.setValueExplicit(value, dataType);
        this.#parent.clearCalculationCache();
        return this;
    }

    /**
     * Get style for cell at coordinate.
     */
    public getStyle(coordinate: string): Style {
        if (!this.#parent) {
            throw new Error('Worksheet has no parent spreadsheet.');
        }
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
     * Get Header/Footer settings.
     */
    public getHeaderFooter(): HeaderFooter {
        return this.#headerFooter;
    }

    /**
     * Set Header/Footer settings.
     */
    public setHeaderFooter(headerFooter: HeaderFooter): this {
        this.#headerFooter = headerFooter;
        return this;
    }

    /**
     * Set a manual page break.
     */
    public setBreak(cellCoordinate: string, breakType: string): this {
        if (breakType !== Worksheet.BREAK_ROW && breakType !== Worksheet.BREAK_COLUMN) {
            return this;
        }

        const normalized = Worksheet.#tryNormalizeTopLeftA1Coordinate(cellCoordinate);
        if (!normalized) {
            return this;
        }

        this.#breaks.set(normalized, breakType);
        return this;
    }

    /**
     * Get all manual page breaks as a coordinate -> type map.
     */
    public getBreaks(): ReadonlyMap<string, string> {
        return this.#breaks;
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

    public getRowStyle(row: number): Style | null {
        const parent = this.#parent;
        if (!parent) {
            return null;
        }
        const rowDimension = this.#rowDimensions.get(row);
        return parent.getCellXfByIndexOrNull(rowDimension?.getXfIndex() ?? null);
    }

    /**
     * Get column dimensions.
     */
    public getColumnDimensions(): Map<string, ColumnDimension> {
        const sorted = [...this.#columnDimensions.values()].sort((a, b) => {
            return a.getColumnNumeric() - b.getColumnNumeric();
        });
        const map = new Map<string, ColumnDimension>();
        for (const dimension of sorted) {
            const key = dimension.getColumnIndex();
            if (key) {
                map.set(key, dimension);
            }
        }
        return map;
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

    public getColumnStyle(column: string): Style | null {
        const parent = this.#parent;
        if (!parent) {
            return null;
        }
        const columnKey = column.toUpperCase();
        const columnDimension = this.#columnDimensions.get(columnKey);
        return parent.getCellXfByIndexOrNull(columnDimension?.getXfIndex() ?? null);
    }

    /**
     * Get table by name.
     *
     * @param name Table name
     */
    public getTableByName(name: string): Table | undefined {
        const searchName = name.toUpperCase();
        return this.#tables.find((table) => table.getName().toUpperCase() === searchName);
    }

    public getTableNames(): string[] {
        return this.#tables.map((table) => table.getName());
    }

    public removeTableByName(name: string): boolean {
        const searchName = name.toUpperCase();
        const index = this.#tables.findIndex((table) => table.getName().toUpperCase() === searchName);
        if (index === -1) {
            return false;
        }
        this.#tables.splice(index, 1);
        return true;
    }

    public removeTableCollection(): void {
        this.#tables = [];
    }

    public refreshColumnDimensions(): this {
        const refreshed = new Map<string, ColumnDimension>();
        for (const [key, dimension] of this.#columnDimensions.entries()) {
            const columnIndex = dimension.getColumnIndex() ?? key;
            refreshed.set(columnIndex, dimension);
        }
        this.#columnDimensions = refreshed;
        return this;
    }

    public refreshRowDimensions(): this {
        const refreshed = new Map<number, RowDimension>();
        for (const [key, dimension] of this.#rowDimensions.entries()) {
            const rowIndex = dimension.getRowIndex() ?? key;
            refreshed.set(rowIndex, dimension);
        }
        this.#rowDimensions = refreshed;
        return this;
    }

    public calculateWorksheetDimension(): string {
        return `A1:${this.getHighestColumn()}${this.getHighestRow()}`;
    }

    public calculateWorksheetDataDimension(): string {
        return `A1:${this.getHighestDataColumn()}${this.getHighestDataRow()}`;
    }

    public calculateColumnWidths(): this {
        const workbook = this.#parent;
        if (!workbook) {
            return this;
        }

        const activeSheetIndex = workbook.getActiveSheetIndex();
        const selectedCells = this.getSelectedCells();

        const autoSizes = new Map<string, number>();
        for (const [key, dimension] of this.#columnDimensions.entries()) {
            if (dimension.getAutoSize()) {
                autoSizes.set(key, -1);
            }
        }

        if (autoSizes.size === 0) {
            return this;
        }

        const activePane = this.getActivePane();
        const mergeCells = this.getMergeCells();
        const isMergeCell = new Set<string>();
        for (const range of Object.keys(mergeCells)) {
            const [[startCol, startRow], [endCol, endRow]] = Coordinate.rangeBoundaries(range);
            for (let row = startRow; row <= endRow; row++) {
                for (let col = startCol; col <= endCol; col++) {
                    isMergeCell.add(`${Coordinate.stringFromColumnIndex(col)}${row}`);
                }
            }
        }

        const autoFilterIndentRanges: string[] = [];
        const autoFilterRange = this.#autoFilter.getRange();
        if (autoFilterRange) {
            const [[startCol, startRow], [endCol]] = Coordinate.rangeBoundaries(autoFilterRange);
            autoFilterIndentRanges.push(
                `${Coordinate.stringFromColumnIndex(startCol)}${startRow}:${Coordinate.stringFromColumnIndex(endCol)}${startRow}`,
            );
        }
        for (const table of this.#tables) {
            if (!table.getShowHeader()) {
                continue;
            }
            const [[startCol, startRow], [endCol]] = table.getRangeBoundaries();
            autoFilterIndentRanges.push(
                `${Coordinate.stringFromColumnIndex(startCol)}${startRow}:${Coordinate.stringFromColumnIndex(endCol)}${startRow}`,
            );
        }

        const defaultFont = workbook.getDefaultStyle().getFont();

        for (const coordinate of this.getCoordinates(false)) {
            const cell = this.getCellOrNull(coordinate);
            if (!cell) {
                continue;
            }
            const column = cell.getColumn();
            if (!autoSizes.has(column)) {
                continue;
            }

            let isMergedButProceed = false;
            if (isMergeCell.has(coordinate)) {
                if (cell.isMergeRangeValueCell()) {
                    const mergeRange = cell.getMergeRange();
                    if (mergeRange) {
                        const [[startCol, startRow], [endCol]] = Coordinate.rangeBoundaries(mergeRange);
                        if (startCol === endCol) {
                            isMergedButProceed = true;
                        }
                    }
                }
                if (!isMergedButProceed) {
                    continue;
                }
            }

            let filterAdjustment = false;
            for (const range of autoFilterIndentRanges) {
                if (cell.isInRange(range)) {
                    filterAdjustment = true;
                    break;
                }
            }

            const alignment = cell.getStyle().getAlignment();
            const indentAdjustment =
                alignment.getIndent() + (alignment.getHorizontal() === Alignment.HORIZONTAL_CENTER ? 1 : 0);

            const cellValue = cell.getFormattedValue();
            if (cellValue === '') {
                continue;
            }

            const cellFont = cell.getStyle().getFont();
            const columnWidth = Font.calculateColumnWidth(
                cellFont,
                cellValue,
                alignment.getTextRotation() ?? 0,
                defaultFont,
                filterAdjustment,
                indentAdjustment,
            );
            const currentWidth = autoSizes.get(column) ?? -1;
            const roundedWidth = Math.round(columnWidth * 1000) / 1000;
            if (roundedWidth > currentWidth) {
                autoSizes.set(column, roundedWidth);
            }
        }

        for (const [column, width] of autoSizes) {
            const dimension = this.getColumnDimension(column);
            const finalWidth = width < 0 ? Font.getDefaultColumnWidthByFont(defaultFont) : width;
            dimension.setWidth(finalWidth);
        }

        this.setSelectedCells(selectedCells);
        this.setActivePane(activePane);
        workbook.setActiveSheetIndex(activeSheetIndex);

        return this;
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
     * Set sheet view.
     */
    public setSheetView(sheetView: SheetView): this {
        this.#sheetView = sheetView;
        return this;
    }

    /**
     * Set freeze pane.
     *
     * @param coordinate Cell coordinate (e.g. 'A1')
     * @param topLeftCell Top left cell (e.g. 'A1')
     * @param frozenSplit Whether to use frozen split
     */
    public freezePane(
        coordinate: string | null,
        topLeftCell: string | null = null,
        frozenSplit: boolean = false,
    ): this {
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

        let topLeftAddr = topLeftCell ? Worksheet.#tryNormalizeTopLeftA1Coordinate(topLeftCell) : null;

        if (cellAddress !== null && topLeftAddr === null) {
            // Match PhpSpreadsheet: default top-left cell to the freeze coordinate.
            topLeftAddr = cellAddress;
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
            this.#xSplit = colIndex - 1;
            this.#ySplit = rowIndex - 1;

            if (this.#xSplit > 0 || this.#ySplit > 0) {
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
                activePane = rowT <= rowC ? 'topLeft' : 'bottomLeft';
            } else if (rowC === 1) {
                activePane = colT <= colC ? 'topLeft' : 'topRight';
            } else if (rowT <= rowC) {
                activePane = colT <= colC ? 'topLeft' : 'topRight';
            } else {
                activePane = colT <= colC ? 'bottomLeft' : 'bottomRight';
            }

            this.setActivePane(activePane);
            this.#panes[activePane] = new Pane(activePane, this.#selectedCells, this.getActiveCell());
        }
    }

    /**
     * Set active pane.
     */
    public setActivePane(activePane: string): this {
        this.#activePane = activePane in this.#panes ? activePane : '';
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
            this.freezePane(
                Coordinate.stringFromColumnIndexAndRow(this.#xSplit + 1, this.#ySplit + 1),
                this.#topLeftCell,
                this.#paneState === Worksheet.PANE_FROZENSPLIT,
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
            this.freezePane(
                Coordinate.stringFromColumnIndexAndRow(this.#xSplit + 1, this.#ySplit + 1),
                this.#topLeftCell,
                this.#paneState === Worksheet.PANE_FROZENSPLIT,
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
     * Set a pane object for a specific position.
     *
     * Intended for reader implementations.
     */
    public setPane(position: string, pane: Pane | null): this {
        if (position in this.#panes) {
            this.#panes[position] = pane;
        }
        return this;
    }

    /**
     * Get pane top left cell.
     */
    public getPaneTopLeftCell(): string {
        return this.#paneTopLeftCell;
    }

    /**
     * Set pane top left cell.
     *
     * Intended for reader implementations.
     */
    public setPaneTopLeftCell(paneTopLeftCell: string): this {
        const normalized = Worksheet.#tryNormalizeTopLeftA1Coordinate(paneTopLeftCell);
        if (normalized === null) {
            return this;
        }
        this.#paneTopLeftCell = normalized;
        return this;
    }

    /**
     * Get top left cell.
     */
    public getTopLeftCell(): string {
        return this.#topLeftCell;
    }

    /**
     * Set top left cell.
     *
     * Intended for reader implementations.
     */
    public setTopLeftCell(topLeftCell: string): this {
        const normalized = Worksheet.#tryNormalizeTopLeftA1Coordinate(topLeftCell);
        if (normalized === null) {
            return this;
        }
        this.#topLeftCell = normalized;
        return this;
    }

    /**
     * Use panes.
     */
    public usesPanes(): boolean {
        return this.#xSplit > 0 || this.#ySplit > 0;
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
    public setAutoFilter(autoFilter: AutoFilter | string | [number, number] | [number, number, number, number]): this {
        if (autoFilter instanceof AutoFilter) {
            this.#autoFilter = autoFilter;
            return this;
        }
        const range = Worksheet.#normalizeRangeInput(autoFilter);
        this.#autoFilter.setRange(range);
        return this;
    }

    public setAutoFilterRange(range: string | [number, number] | [number, number, number, number]): this {
        const normalized = Worksheet.#normalizeRangeInput(range);
        this.#autoFilter.setRange(normalized);
        return this;
    }

    public removeAutoFilter(): this {
        this.#autoFilter.setRange('');
        return this;
    }

    public protectCells(
        range: string | [number, number] | [number, number, number, number],
        password: string = '',
        alreadyHashed: boolean = false,
        name: string = '',
        securityDescriptor: string = '',
    ): this {
        const normalized = Worksheet.#normalizeRangeInput(range);
        const protectedRange = ProtectedRange.create(normalized, password, alreadyHashed, name, securityDescriptor);
        this.#protectedCells.set(normalized, protectedRange);
        return this;
    }

    public unprotectCells(range: string | [number, number] | [number, number, number, number]): this {
        const normalized = Worksheet.#normalizeRangeInput(range);
        if (!this.#protectedCells.has(normalized)) {
            throw new Error(`Cell range ${normalized} not known as protected.`);
        }
        this.#protectedCells.delete(normalized);
        return this;
    }

    public getProtectedCellRanges(): ProtectedRange[] {
        return [...this.#protectedCells.values()];
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

    static #conditionalPriorityComparator(condA: Conditional, condB: Conditional): number {
        const a = condA.getPriority();
        const b = condB.getPriority();

        if (a === b) {
            return 0;
        }
        if (a === 0) {
            return 1;
        }
        if (b === 0) {
            return -1;
        }

        return a < b ? -1 : 1;
    }

    static #coordinateIsInsideRange(range: string, coordinate: string): boolean {
        const [[startCol, startRow], [endCol, endRow]] = Coordinate.rangeBoundaries(range);
        const [[cellCol, cellRow]] = Coordinate.rangeBoundaries(coordinate);

        const minCol = Math.min(startCol, endCol);
        const maxCol = Math.max(startCol, endCol);
        const minRow = Math.min(startRow, endRow);
        const maxRow = Math.max(startRow, endRow);

        return cellCol >= minCol && cellCol <= maxCol && cellRow >= minRow && cellRow <= maxRow;
    }

    /**
     * Get conditional styles.
     *
     * @param range Range (e.g. 'A1:A10')
     */
    public getConditionalStyles(range: string, firstOnly: boolean = true): Conditional[] {
        const coordinate = range.toUpperCase();
        if (/[: ,]/.test(coordinate)) {
            return this.#conditionalStylesCollection.get(coordinate) ?? [];
        }

        const conditionalStyles = new Map<string, Conditional[]>();
        for (const [keyStylesOrig, conditionalRange] of this.#conditionalStylesCollection.entries()) {
            const keyStyles = Coordinate.resolveUnionAndIntersection(keyStylesOrig);
            const keyParts = keyStyles.split(',');
            for (const keyPartRaw of keyParts) {
                const keyPart = keyPartRaw.trim();
                if (keyPart === '') {
                    continue;
                }

                if (keyPart === coordinate) {
                    if (firstOnly) {
                        return conditionalRange;
                    }
                    conditionalStyles.set(keyStylesOrig, conditionalRange);
                    break;
                }

                if (keyPart.includes(':') && Worksheet.#coordinateIsInsideRange(keyPart, coordinate)) {
                    if (firstOnly) {
                        return conditionalRange;
                    }
                    conditionalStyles.set(keyStylesOrig, conditionalRange);
                    break;
                }
            }
        }

        const outArray = [...conditionalStyles.values()].flat();
        outArray.sort(Worksheet.#conditionalPriorityComparator);

        return outArray;
    }

    public getConditionalRange(coordinate: string): string | null {
        const cellCoordinate = coordinate.toUpperCase();
        for (const conditionalRange of this.#conditionalStylesCollection.keys()) {
            const cellBlocks = Coordinate.resolveUnionAndIntersection(conditionalRange).split(',');
            for (const cellBlockRaw of cellBlocks) {
                const cellBlock = cellBlockRaw.trim();
                if (cellBlock !== '' && Worksheet.#coordinateIsInsideRange(cellBlock, cellCoordinate)) {
                    return conditionalRange;
                }
            }
        }

        return null;
    }

    public conditionalStylesExists(coordinate: string): boolean {
        return this.getConditionalStyles(coordinate).length > 0;
    }

    public removeConditionalStyles(coordinate: string): this {
        this.#conditionalStylesCollection.delete(coordinate.toUpperCase());
        return this;
    }

    /**
     * Get conditional styles collection.
     */
    public getConditionalStylesCollection(): Map<string, Conditional[]> {
        return this.#conditionalStylesCollection;
    }

    /**
     * Get data validation.
     *
     * @param cellCoordinate Cell coordinate (e.g. 'A1')
     * @returns Data validation for the cell, or null if none
     */
    public getDataValidation(cellCoordinate: string): DataValidation | null {
        const cellAddress = cellCoordinate.toUpperCase();
        if (this.#dataValidationCollection.has(cellAddress)) {
            return this.#dataValidationCollection.get(cellAddress) ?? null;
        }
        return null;
    }

    public getHyperlink(cellCoordinate: string): Hyperlink {
        const cellAddress = cellCoordinate.toUpperCase();
        const hyperlink = this.#hyperlinkCollection.get(cellAddress);
        if (hyperlink) {
            return hyperlink;
        }
        const newHyperlink = new Hyperlink();
        this.#hyperlinkCollection.set(cellAddress, newHyperlink);
        return newHyperlink;
    }

    public setHyperlink(cellCoordinate: string, hyperlink: Hyperlink | null): this {
        const cellAddress = cellCoordinate.toUpperCase();
        if (hyperlink === null) {
            this.#hyperlinkCollection.delete(cellAddress);
            return this;
        }
        this.#hyperlinkCollection.set(cellAddress, hyperlink);
        return this;
    }

    public hyperlinkExists(cellCoordinate: string): boolean {
        const hyperlink = this.#hyperlinkCollection.get(cellCoordinate.toUpperCase());
        return hyperlink !== undefined && !hyperlink.isEmpty();
    }

    /**
     * Set data validation.
     *
     * @param cellCoordinate Cell coordinate (e.g. 'A1')
     * @param dataValidation Data validation object
     * @returns this
     */
    public setDataValidation(cellCoordinate: string, dataValidation: DataValidation): this {
        this.#dataValidationCollection.set(cellCoordinate.toUpperCase(), dataValidation);
        return this;
    }

    /**
     * Check if a cell has data validation.
     *
     * @param cellCoordinate Cell coordinate (e.g. 'A1')
     * @returns True if the cell has data validation
     */
    public dataValidationExists(cellCoordinate: string): boolean {
        return this.#dataValidationCollection.has(cellCoordinate.toUpperCase());
    }

    /**
     * Get data validation collection.
     *
     * @returns Map of cell coordinates to data validations
     */
    public getDataValidationCollection(): Map<string, DataValidation> {
        return this.#dataValidationCollection;
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

    public duplicateConditionalStyle(styles: Conditional[], range: string = ''): this {
        for (const cellStyle of styles) {
            if (!(cellStyle instanceof Conditional)) {
                throw new Error('Style is not a conditional style');
            }
        }

        if (range === '') {
            return this;
        }

        const [[startCol, startRow], [endCol, endRow]] = Coordinate.rangeBoundaries(`${range}:${range}`);
        const minCol = Math.min(startCol, endCol);
        const maxCol = Math.max(startCol, endCol);
        const minRow = Math.min(startRow, endRow);
        const maxRow = Math.max(startRow, endRow);

        for (let col = minCol; col <= maxCol; ++col) {
            for (let row = minRow; row <= maxRow; ++row) {
                this.setConditionalStyles(`${Coordinate.stringFromColumnIndex(col)}${row}`, styles);
            }
        }

        return this;
    }

    /**
     * Get highest worksheet column.
     *
     * @param row Return the data highest column for the specified row,
     *            or the highest column of any row if no row number is passed
     * @returns Highest column name
     */
    public getHighestColumn(row: number | null = null): string {
        return this.#cellCollection.getHighestColumn(row);
    }

    /**
     * Get highest worksheet column that contains data.
     *
     * @param row Return the highest data column for the specified row,
     *            or the highest data column of any row if no row number is passed
     * @returns Highest column name that contains data
     */
    public getHighestDataColumn(row: number | null = null): string {
        return this.#cellCollection.getHighestColumn(row);
    }

    /**
     * Get highest worksheet row.
     *
     * @param column Return the highest data row for the specified column,
     *               or the highest row of any column if no column letter is passed
     * @returns Highest row number
     */
    public getHighestRow(column: string | null = null): number {
        return this.#cellCollection.getHighestRow(column);
    }

    /**
     * Get highest worksheet row that contains data.
     *
     * @param column Return the highest data row for the specified column,
     *               or the highest row of any column if no column letter is passed
     * @returns Highest row number that contains data
     */
    public getHighestDataRow(column: string | null = null): number {
        return this.#cellCollection.getHighestRow(column);
    }

    /**
     * Get highest worksheet column and highest row that have cell records.
     *
     * @returns Highest column name and highest row number
     */
    public getHighestRowAndColumn(): { row: number; column: string } {
        return this.#cellCollection.getHighestRowAndColumn();
    }

    /**
     * Import data from an array into the worksheet.
     *
     * @param source The source data
     * @param nullValue The value in the array that should be treated as a null/empty cell
     * @param startCell The top-left coordinate where insertion begins
     * @param strictNullComparison If true, uses strict comparison for nullValue
     */
    public fromArray(
        source: any[],
        nullValue: any = null,
        startCell: string = 'A1',
        strictNullComparison: boolean = false,
    ): this {
        // 1D to 2D conversion if needed
        const data = Array.isArray(source[0]) ? source : [source];
        const [startColIndex, startRowIndex] = Coordinate.indexesFromString(startCell);
        let currentStartRow = startRowIndex;

        for (const rowData of data) {
            let currentColIndex = startColIndex;
            for (const cellValue of rowData) {
                const matchesNull = strictNullComparison ? cellValue === nullValue : cellValue == nullValue;

                if (!matchesNull) {
                    const coord = `${Coordinate.stringFromColumnIndex(currentColIndex)}${currentStartRow}`;
                    this.getCell(coord).setValue(cellValue);
                }
                currentColIndex++;
            }
            currentStartRow++;
        }
        return this;
    }

    /**
     * Extract a range of cell values into a 2D array.
     *
     * @param range Cell range (e.g. 'A1:C5')
     * @param nullValue Value to return if a cell is empty or doesn't exist
     * @param calculateFormulas Whether to evaluate formulas
     * @param formatData Whether to apply number formatting (Currently ignored - logic not implemented)
     * @param returnCellRef If true, return array with cell coordinates as keys
     * @param ignoreHidden If true, skip hidden rows and columns
     */
    public rangeToArray(
        range: string,
        nullValue: any = null,
        calculateFormulas: boolean = true,
        formatData: boolean = true,
        returnCellRef: boolean = false,
        ignoreHidden: boolean = false,
    ): any {
        const [[minCol, minRow], [maxCol, maxRow]] = Coordinate.rangeBoundaries(range);
        const returnValue: any = returnCellRef ? {} : [];

        for (let row = minRow; row <= maxRow; row++) {
            if (ignoreHidden && this.rowDimensionExists(row) && !this.getRowDimension(row).getVisible()) {
                continue;
            }

            const rowRef = returnCellRef ? row.toString() : row - minRow;
            const rowData: any = returnCellRef ? {} : [];

            for (let col = minCol; col <= maxCol; col++) {
                const colStr = Coordinate.stringFromColumnIndex(col);
                if (
                    ignoreHidden &&
                    this.columnDimensionExists(colStr) &&
                    !this.getColumnDimension(colStr).getVisible()
                ) {
                    continue;
                }

                const colRef = returnCellRef ? colStr : col - minCol;
                const cell = this.#cellCollection.get(colStr + row);
                const value = this.#cellToArray(cell, calculateFormulas, formatData, nullValue);

                if (returnCellRef) {
                    (rowData as any)[colRef] = value;
                } else {
                    (rowData as any).push(value);
                }
            }

            if (returnCellRef) {
                (returnValue as any)[rowRef] = rowData;
            } else {
                (returnValue as any).push(rowData);
            }
        }

        return returnValue;
    }

    /**
     * Helper method for rangeToArray to process individual cell values.
     */
    #cellToArray(cell: Cell | undefined, calculateFormulas: boolean, _formatData: boolean, nullValue: any): any {
        if (!cell || cell.getValue() === null) {
            return nullValue;
        }

        const cellValue = cell.getValue();

        if (calculateFormulas && cell.getDataType() === DataType.TYPE_FORMULA) {
            return cell.getCalculatedValue();
        }

        // TODO: Implement formatting logic when NumberFormat engine is ready
        return cellValue;
    }

    /**
     * Extract the full worksheet range into a 2D array.
     */
    public toArray(
        nullValue: any = null,
        calculateFormulas: boolean = true,
        formatData: boolean = true,
        returnCellRef: boolean = false,
        ignoreHidden: boolean = false,
    ): any {
        const highest = this.getHighestRowAndColumn();
        const range = `A1:${highest.column}${highest.row}`;
        return this.rangeToArray(range, nullValue, calculateFormulas, formatData, returnCellRef, ignoreHidden);
    }

    /**
     * Insert a new row(s) before a specific row.
     *
     * @param before Row number to insert before
     * @param numberOfRows Number of rows to insert
     */
    public insertNewRowBefore(before: number, numberOfRows: number = 1): this {
        if (before < 1) {
            throw new Error('Rows can only be inserted before at least row 1.');
        }

        // Shift cells down
        this.#shiftCellsDown(before, numberOfRows);

        // Adjust merge cells
        this.#adjustMergeCellsAfterRowInsert(before, numberOfRows);

        // Adjust row dimensions
        this.#adjustRowDimensionsAfterInsert(before, numberOfRows);

        // Clear calculation cache
        this.clearCalculationCache();

        return this;
    }

    /**
     * Insert a new column(s) before a specific column.
     *
     * @param before Column letter to insert before (e.g. 'A')
     * @param numberOfColumns Number of columns to insert
     */
    public insertNewColumnBefore(before: string, numberOfColumns: number = 1): this {
        const beforeIndex = Coordinate.columnIndexFromString(before);
        if (beforeIndex < 1) {
            throw new Error('Columns can only be inserted before at least column A.');
        }

        // Shift cells right
        this.#shiftCellsRight(before, numberOfColumns);

        // Adjust merge cells
        this.#adjustMergeCellsAfterColumnInsert(before, numberOfColumns);

        // Adjust column dimensions
        this.#adjustColumnDimensionsAfterInsert(before, numberOfColumns);

        // Clear calculation cache
        this.clearCalculationCache();

        return this;
    }

    /**
     * Remove row(s) from the worksheet.
     *
     * @param row Row number to start removing from
     * @param numberOfRows Number of rows to remove
     */
    public removeRow(row: number, numberOfRows: number = 1): this {
        // Clean up merge cells that overlap with deleted rows
        this.#cleanupMergeCellsForRowDelete(row, numberOfRows);

        // Save and remove affected row dimensions
        const savedDimensions = this.#saveAndRemoveRowDimensions(row, numberOfRows);

        // Remove cells in the deleted rows
        for (let i = 0; i < numberOfRows; i++) {
            this.#cellCollection.removeRow(row + i);
        }

        // Shift remaining cells up
        this.#shiftCellsUp(row + numberOfRows, numberOfRows);

        // Restore row dimensions with adjusted indices
        this.#restoreRowDimensions(savedDimensions, row, -numberOfRows);

        // Clear calculation cache
        this.clearCalculationCache();

        return this;
    }

    /**
     * Remove column(s) from the worksheet.
     *
     * @param column Column letter to start removing from (e.g. 'A')
     * @param numberOfColumns Number of columns to remove
     */
    public removeColumn(column: string, numberOfColumns: number = 1): this {
        const startColIndex = Coordinate.columnIndexFromString(column);

        // Clean up merge cells that overlap with deleted columns
        this.#cleanupMergeCellsForColumnDelete(column, numberOfColumns);

        // Save and remove affected column dimensions
        const savedDimensions = this.#saveAndRemoveColumnDimensions(column, numberOfColumns);

        // Remove cells in the deleted columns
        for (let i = 0; i < numberOfColumns; i++) {
            const colToRemove = Coordinate.stringFromColumnIndex(startColIndex + i);
            this.#cellCollection.removeColumn(colToRemove);
        }

        // Shift remaining cells left
        const colAfterDeleted = Coordinate.stringFromColumnIndex(startColIndex + numberOfColumns);
        this.#shiftCellsLeft(colAfterDeleted, numberOfColumns);

        // Restore column dimensions with adjusted indices
        this.#restoreColumnDimensions(savedDimensions, column, -numberOfColumns);

        // Clear calculation cache
        this.clearCalculationCache();

        return this;
    }

    /**
     * Shift cells down when inserting rows.
     */
    #shiftCellsDown(beforeRow: number, numberOfRows: number): void {
        const cellsToMove: Array<{ oldCoord: string; cell: Cell }> = [];

        // Collect cells that need to be moved (from bottom to top)
        for (const coordinate of this.#cellCollection.getCoordinates()) {
            const [colIndex, rowIndex] = Coordinate.indexesFromString(coordinate);
            if (rowIndex >= beforeRow) {
                const cell = this.#cellCollection.get(coordinate);
                if (cell) {
                    cellsToMove.push({ oldCoord: coordinate, cell });
                }
            }
        }

        // Sort by row descending to avoid overwriting
        cellsToMove.sort((a, b) => {
            const [, rowA] = Coordinate.indexesFromString(a.oldCoord);
            const [, rowB] = Coordinate.indexesFromString(b.oldCoord);
            return rowB - rowA;
        });

        // Move cells
        for (const { oldCoord, cell } of cellsToMove) {
            const [colIndex, rowIndex] = Coordinate.indexesFromString(oldCoord);
            const newRow = rowIndex + numberOfRows;
            const newCoord = `${Coordinate.stringFromColumnIndex(colIndex)}${newRow}`;

            this.#cellCollection.delete(oldCoord);
            cell.setRowIndex(newRow - 1); // Convert to 0-indexed
            this.#cellCollection.add(newCoord, cell);
        }
    }

    /**
     * Shift cells right when inserting columns.
     */
    #shiftCellsRight(beforeCol: string, numberOfCols: number): void {
        const beforeColIndex = Coordinate.columnIndexFromString(beforeCol);
        const cellsToMove: Array<{ oldCoord: string; cell: Cell }> = [];

        // Collect cells that need to be moved (from right to left)
        for (const coordinate of this.#cellCollection.getCoordinates()) {
            const [colIndex] = Coordinate.indexesFromString(coordinate);
            if (colIndex >= beforeColIndex) {
                const cell = this.#cellCollection.get(coordinate);
                if (cell) {
                    cellsToMove.push({ oldCoord: coordinate, cell });
                }
            }
        }

        // Sort by column descending to avoid overwriting
        cellsToMove.sort((a, b) => {
            const [colA] = Coordinate.indexesFromString(a.oldCoord);
            const [colB] = Coordinate.indexesFromString(b.oldCoord);
            return colB - colA;
        });

        // Move cells
        for (const { oldCoord, cell } of cellsToMove) {
            const [colIndex, rowIndex] = Coordinate.indexesFromString(oldCoord);
            const newCol = colIndex + numberOfCols;
            const newCoord = `${Coordinate.stringFromColumnIndex(newCol)}${rowIndex}`;

            this.#cellCollection.delete(oldCoord);
            cell.setColumnIndex(newCol - 1); // Convert to 0-indexed
            this.#cellCollection.add(newCoord, cell);
        }
    }

    /**
     * Shift cells up when removing rows.
     */
    #shiftCellsUp(fromRow: number, numberOfRows: number): void {
        const cellsToMove: Array<{ oldCoord: string; cell: Cell }> = [];

        // Collect cells that need to be moved (from top to bottom of affected area)
        for (const coordinate of this.#cellCollection.getCoordinates()) {
            const [colIndex, rowIndex] = Coordinate.indexesFromString(coordinate);
            if (rowIndex >= fromRow) {
                const cell = this.#cellCollection.get(coordinate);
                if (cell) {
                    cellsToMove.push({ oldCoord: coordinate, cell });
                }
            }
        }

        // Sort by row ascending
        cellsToMove.sort((a, b) => {
            const [, rowA] = Coordinate.indexesFromString(a.oldCoord);
            const [, rowB] = Coordinate.indexesFromString(b.oldCoord);
            return rowA - rowB;
        });

        // Move cells
        for (const { oldCoord, cell } of cellsToMove) {
            const [colIndex, rowIndex] = Coordinate.indexesFromString(oldCoord);
            const newRow = rowIndex - numberOfRows;
            if (newRow < 1) continue; // Don't move into invalid rows

            const newCoord = `${Coordinate.stringFromColumnIndex(colIndex)}${newRow}`;

            this.#cellCollection.delete(oldCoord);
            cell.setRowIndex(newRow - 1); // Convert to 0-indexed
            this.#cellCollection.add(newCoord, cell);
        }
    }

    /**
     * Shift cells left when removing columns.
     */
    #shiftCellsLeft(fromCol: string, numberOfCols: number): void {
        const fromColIndex = Coordinate.columnIndexFromString(fromCol);
        const cellsToMove: Array<{ oldCoord: string; cell: Cell }> = [];

        // Collect cells that need to be moved (from left to right of affected area)
        for (const coordinate of this.#cellCollection.getCoordinates()) {
            const [colIndex] = Coordinate.indexesFromString(coordinate);
            if (colIndex >= fromColIndex) {
                const cell = this.#cellCollection.get(coordinate);
                if (cell) {
                    cellsToMove.push({ oldCoord: coordinate, cell });
                }
            }
        }

        // Sort by column ascending
        cellsToMove.sort((a, b) => {
            const [colA] = Coordinate.indexesFromString(a.oldCoord);
            const [colB] = Coordinate.indexesFromString(b.oldCoord);
            return colA - colB;
        });

        // Move cells
        for (const { oldCoord, cell } of cellsToMove) {
            const [colIndex, rowIndex] = Coordinate.indexesFromString(oldCoord);
            const newCol = colIndex - numberOfCols;
            if (newCol < 1) continue; // Don't move into invalid columns

            const newCoord = `${Coordinate.stringFromColumnIndex(newCol)}${rowIndex}`;

            this.#cellCollection.delete(oldCoord);
            cell.setColumnIndex(newCol - 1); // Convert to 0-indexed
            this.#cellCollection.add(newCoord, cell);
        }
    }

    /**
     * Adjust merge cells after row insert.
     */
    #adjustMergeCellsAfterRowInsert(beforeRow: number, numberOfRows: number): void {
        const newMergeCells: Record<string, string> = {};

        for (const [range] of Object.entries(this.#mergeCells)) {
            const [[startCol, startRow], [endCol, endRow]] = Coordinate.rangeBoundaries(range);

            if (endRow < beforeRow) {
                // Range entirely before insertion - unchanged
                newMergeCells[range] = range;
            } else if (startRow >= beforeRow) {
                // Range entirely after insertion - shift down
                const newStartRow = startRow + numberOfRows;
                const newEndRow = endRow + numberOfRows;
                const newRange = `${Coordinate.stringFromColumnIndex(startCol)}${newStartRow}:${Coordinate.stringFromColumnIndex(endCol)}${newEndRow}`;
                newMergeCells[newRange] = newRange;
            } else {
                // Range straddles insertion - expand
                const newEndRow = endRow + numberOfRows;
                const newRange = `${Coordinate.stringFromColumnIndex(startCol)}${startRow}:${Coordinate.stringFromColumnIndex(endCol)}${newEndRow}`;
                newMergeCells[newRange] = newRange;
            }
        }

        this.#mergeCells = newMergeCells;
    }

    /**
     * Adjust merge cells after column insert.
     */
    #adjustMergeCellsAfterColumnInsert(beforeCol: string, numberOfCols: number): void {
        const beforeColIndex = Coordinate.columnIndexFromString(beforeCol);
        const newMergeCells: Record<string, string> = {};

        for (const [range] of Object.entries(this.#mergeCells)) {
            const [[startCol, startRow], [endCol, endRow]] = Coordinate.rangeBoundaries(range);

            if (endCol < beforeColIndex) {
                // Range entirely before insertion - unchanged
                newMergeCells[range] = range;
            } else if (startCol >= beforeColIndex) {
                // Range entirely after insertion - shift right
                const newStartCol = startCol + numberOfCols;
                const newEndCol = endCol + numberOfCols;
                const newRange = `${Coordinate.stringFromColumnIndex(newStartCol)}${startRow}:${Coordinate.stringFromColumnIndex(newEndCol)}${endRow}`;
                newMergeCells[newRange] = newRange;
            } else {
                // Range straddles insertion - expand
                const newEndCol = endCol + numberOfCols;
                const newRange = `${Coordinate.stringFromColumnIndex(startCol)}${startRow}:${Coordinate.stringFromColumnIndex(newEndCol)}${endRow}`;
                newMergeCells[newRange] = newRange;
            }
        }

        this.#mergeCells = newMergeCells;
    }

    /**
     * Clean up merge cells for row deletion.
     */
    #cleanupMergeCellsForRowDelete(startRow: number, numberOfRows: number): void {
        const newMergeCells: Record<string, string> = {};
        const endRow = startRow + numberOfRows - 1;

        for (const [range] of Object.entries(this.#mergeCells)) {
            const [[startCol, rangeStartRow], [endCol, rangeEndRow]] = Coordinate.rangeBoundaries(range);

            if (rangeEndRow < startRow) {
                // Range entirely before deletion - unchanged
                newMergeCells[range] = range;
            } else if (rangeStartRow > endRow) {
                // Range entirely after deletion - shift up
                const newStartRow = rangeStartRow - numberOfRows;
                const newEndRow = rangeEndRow - numberOfRows;
                const newRange = `${Coordinate.stringFromColumnIndex(startCol)}${newStartRow}:${Coordinate.stringFromColumnIndex(endCol)}${newEndRow}`;
                newMergeCells[newRange] = newRange;
            } else if (rangeStartRow >= startRow && rangeEndRow <= endRow) {
                // Range entirely within deleted area - remove
                continue;
            } else {
                // Range partially overlaps - adjust or remove
                if (rangeStartRow < startRow && rangeEndRow > endRow) {
                    // Range extends before and after - shrink
                    const newEndRow = rangeEndRow - numberOfRows;
                    const newRange = `${Coordinate.stringFromColumnIndex(startCol)}${rangeStartRow}:${Coordinate.stringFromColumnIndex(endCol)}${newEndRow}`;
                    newMergeCells[newRange] = newRange;
                } else if (rangeStartRow >= startRow) {
                    // Range starts within deleted area - move start
                    const newStartRow = endRow + 1 - numberOfRows;
                    const newEndRow = rangeEndRow - numberOfRows;
                    if (newStartRow <= newEndRow) {
                        const newRange = `${Coordinate.stringFromColumnIndex(startCol)}${newStartRow}:${Coordinate.stringFromColumnIndex(endCol)}${newEndRow}`;
                        newMergeCells[newRange] = newRange;
                    }
                } else {
                    // Range ends within deleted area - shrink end
                    const newEndRow = startRow - 1;
                    const newRange = `${Coordinate.stringFromColumnIndex(startCol)}${rangeStartRow}:${Coordinate.stringFromColumnIndex(endCol)}${newEndRow}`;
                    newMergeCells[newRange] = newRange;
                }
            }
        }

        this.#mergeCells = newMergeCells;
    }

    /**
     * Clean up merge cells for column deletion.
     */
    #cleanupMergeCellsForColumnDelete(startCol: string, numberOfCols: number): void {
        const startColIndex = Coordinate.columnIndexFromString(startCol);
        const endColIndex = startColIndex + numberOfCols - 1;
        const newMergeCells: Record<string, string> = {};

        for (const [range] of Object.entries(this.#mergeCells)) {
            const [[rangeStartCol, startRow], [rangeEndCol, endRow]] = Coordinate.rangeBoundaries(range);

            if (rangeEndCol < startColIndex) {
                // Range entirely before deletion - unchanged
                newMergeCells[range] = range;
            } else if (rangeStartCol > endColIndex) {
                // Range entirely after deletion - shift left
                const newStartCol = rangeStartCol - numberOfCols;
                const newEndCol = rangeEndCol - numberOfCols;
                const newRange = `${Coordinate.stringFromColumnIndex(newStartCol)}${startRow}:${Coordinate.stringFromColumnIndex(newEndCol)}${endRow}`;
                newMergeCells[newRange] = newRange;
            } else if (rangeStartCol >= startColIndex && rangeEndCol <= endColIndex) {
                // Range entirely within deleted area - remove
                continue;
            } else {
                // Range partially overlaps - adjust or remove
                if (rangeStartCol < startColIndex && rangeEndCol > endColIndex) {
                    // Range extends before and after - shrink
                    const newEndCol = rangeEndCol - numberOfCols;
                    const newRange = `${Coordinate.stringFromColumnIndex(rangeStartCol)}${startRow}:${Coordinate.stringFromColumnIndex(newEndCol)}${endRow}`;
                    newMergeCells[newRange] = newRange;
                } else if (rangeStartCol >= startColIndex) {
                    // Range starts within deleted area - move start
                    const newStartCol = endColIndex + 1 - numberOfCols;
                    const newEndCol = rangeEndCol - numberOfCols;
                    if (newStartCol <= newEndCol) {
                        const newRange = `${Coordinate.stringFromColumnIndex(newStartCol)}${startRow}:${Coordinate.stringFromColumnIndex(newEndCol)}${endRow}`;
                        newMergeCells[newRange] = newRange;
                    }
                } else {
                    // Range ends within deleted area - shrink end
                    const newEndCol = startColIndex - 1;
                    const newRange = `${Coordinate.stringFromColumnIndex(rangeStartCol)}${startRow}:${Coordinate.stringFromColumnIndex(newEndCol)}${endRow}`;
                    newMergeCells[newRange] = newRange;
                }
            }
        }

        this.#mergeCells = newMergeCells;
    }

    /**
     * Adjust row dimensions after insert.
     */
    #adjustRowDimensionsAfterInsert(beforeRow: number, numberOfRows: number): void {
        const newDimensions = new Map<number, RowDimension>();

        for (const [row, dimension] of this.#rowDimensions.entries()) {
            if (row < beforeRow) {
                // Dimensions before insertion point - unchanged
                newDimensions.set(row, dimension);
            } else {
                // Dimensions at or after insertion point - shift down
                const newRow = row + numberOfRows;
                dimension.setRowIndex(newRow);
                newDimensions.set(newRow, dimension);
            }
        }

        this.#rowDimensions = newDimensions;
    }

    /**
     * Adjust column dimensions after insert.
     */
    #adjustColumnDimensionsAfterInsert(beforeCol: string, numberOfCols: number): void {
        const beforeColIndex = Coordinate.columnIndexFromString(beforeCol);
        const newDimensions = new Map<string, ColumnDimension>();

        for (const [col, dimension] of this.#columnDimensions.entries()) {
            const colIndex = Coordinate.columnIndexFromString(col);
            if (colIndex < beforeColIndex) {
                // Dimensions before insertion point - unchanged
                newDimensions.set(col, dimension);
            } else {
                // Dimensions at or after insertion point - shift right
                const newColIndex = colIndex + numberOfCols;
                const newCol = Coordinate.stringFromColumnIndex(newColIndex);
                dimension.setColumnIndex(newCol);
                newDimensions.set(newCol, dimension);
            }
        }

        this.#columnDimensions = newDimensions;
    }

    /**
     * Save and remove row dimensions for a range.
     */
    #saveAndRemoveRowDimensions(startRow: number, numberOfRows: number): Map<number, RowDimension> {
        const saved = new Map<number, RowDimension>();
        const endRow = startRow + numberOfRows;

        for (let row = endRow; row <= this.getHighestRow(); row++) {
            const dimension = this.#rowDimensions.get(row);
            if (dimension) {
                saved.set(row, dimension);
            }
        }

        // Remove dimensions in the deleted range
        for (let i = 0; i < numberOfRows; i++) {
            this.#rowDimensions.delete(startRow + i);
        }

        return saved;
    }

    /**
     * Save and remove column dimensions for a range.
     */
    #saveAndRemoveColumnDimensions(startCol: string, numberOfCols: number): Map<string, ColumnDimension> {
        const saved = new Map<string, ColumnDimension>();
        const startColIndex = Coordinate.columnIndexFromString(startCol);
        const endColIndex = startColIndex + numberOfCols;
        const highestColIndex = Coordinate.columnIndexFromString(this.getHighestColumn());

        for (let col = endColIndex; col <= highestColIndex; col++) {
            const colLetter = Coordinate.stringFromColumnIndex(col);
            const dimension = this.#columnDimensions.get(colLetter);
            if (dimension) {
                saved.set(colLetter, dimension);
            }
        }

        // Remove dimensions in the deleted range
        for (let i = 0; i < numberOfCols; i++) {
            const colToRemove = Coordinate.stringFromColumnIndex(startColIndex + i);
            this.#columnDimensions.delete(colToRemove);
        }

        return saved;
    }

    /**
     * Restore row dimensions with adjusted indices.
     */
    #restoreRowDimensions(saved: Map<number, RowDimension>, startRow: number, rowDelta: number): void {
        for (const [oldRow, dimension] of saved.entries()) {
            const newRow = oldRow + rowDelta;
            if (newRow >= startRow) {
                dimension.setRowIndex(newRow);
                this.#rowDimensions.set(newRow, dimension);
            }
        }
    }

    /**
     * Restore column dimensions with adjusted indices.
     */
    #restoreColumnDimensions(saved: Map<string, ColumnDimension>, startCol: string, colDelta: number): void {
        const startColIndex = Coordinate.columnIndexFromString(startCol);

        for (const [oldCol, dimension] of saved.entries()) {
            const oldColIndex = Coordinate.columnIndexFromString(oldCol);
            const newColIndex = oldColIndex + colDelta;
            if (newColIndex >= startColIndex) {
                const newCol = Coordinate.stringFromColumnIndex(newColIndex);
                dimension.setColumnIndex(newCol);
                this.#columnDimensions.set(newCol, dimension);
            }
        }
    }

    /**
     * Disconnect cells from this worksheet.
     *
     * This method breaks the circular references between cells and this worksheet
     * to prevent memory leaks. Any retained Cell instances will be detached so they
     * no longer keep this Worksheet/Spreadsheet alive.
     *
     * @returns void
     */
    public disconnectCells(): void {
        // Detach any retained Cell instances to break Worksheet <-> Cell cycles.
        for (const cell of this.#cellCollection.values()) {
            cell.detach();
        }

        // Clear all cells from the collection.
        this.#cellCollection.clear();

        // Detach other large backrefs where trivial.
        this.#autoFilter.setParent(null);
        this.#tables = [];

        // Detach drawings to break Worksheet <-> Drawing cycles.
        for (const drawing of this.#drawingCollection) {
            drawing.detach();
        }
        this.#drawingCollection = [];
    }
}
