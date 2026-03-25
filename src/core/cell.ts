import { isError } from '../calculation/calculation-errors.ts';
import { convertIsoDate } from '../shared/date.ts';
import { CellStyleAssessor } from '../style/conditional-formatting/cell-style-assessor.ts';
import { Protection } from '../style/protection.ts';
import { Style } from '../style/style.ts';
import { Coordinate } from '../utils/coordinate.ts';
import type { Comment } from './comment.ts';
import { DefaultValueBinder } from './default-value-binder.ts';
import { Hyperlink } from './hyperlink.ts';
import type { IValueBinder } from './i-value-binder.ts';
import { Worksheet } from './worksheet.ts';

/**
 * Cell data types.
 */
export const DataType = {
    TYPE_STRING2: 'str',
    TYPE_STRING: 's',
    TYPE_FORMULA: 'f',
    TYPE_NUMERIC: 'n',
    TYPE_BOOL: 'b',
    TYPE_NULL: 'null',
    TYPE_INLINE: 'inlineStr',
    TYPE_ERROR: 'e',
    TYPE_ISO_DATE: 'd',
    TYPE_DRAWING_IN_CELL: 'drawingCell',
} as const;

export type TDataType = (typeof DataType)[keyof typeof DataType];

/**
 * Cell in a Worksheet.
 */
export class Cell {
    static #valueBinder: IValueBinder | null = null;
    static #valueBinderInitialized: boolean = false;
    #value: any;
    #calculatedValue: any;
    #dataType: TDataType;
    #worksheet: Worksheet | null;
    #column: number;
    #row: number;
    #xfIndex: number = 0;

    #isDetached: boolean = false;

    #hyperlink: Hyperlink | null = null;
    #formulaAttributes: Record<string, unknown> | null = null;
    #ignoredErrors: Record<string, unknown> = {};
    #oldCalculatedValue: any = null;

    public static getValueBinder(): IValueBinder | null {
        if (!Cell.#valueBinderInitialized) {
            Cell.#valueBinder = new DefaultValueBinder();
            Cell.#valueBinderInitialized = true;
        }
        return Cell.#valueBinder;
    }

    public static setValueBinder(binder: IValueBinder | null): void {
        Cell.#valueBinder = binder;
        Cell.#valueBinderInitialized = true;
    }

    constructor(value: any, dataType: TDataType, worksheet: Worksheet, column: string | number, row: number) {
        this.#value = value;
        this.#dataType = dataType;
        this.#worksheet = worksheet;
        if (typeof column === 'string') {
            this.#column = Coordinate.columnIndexFromString(column) - 1;
        } else {
            this.#column = column;
        }
        this.#row = row - 1; // Internal storage is 0-indexed
    }

    /**
     * Get value.
     */
    public getValue(): any {
        return this.#value;
    }

    public getValueString(): string {
        const value = this.getValue();
        return value === null || value === undefined ? '' : String(value);
    }

    /**
     * Get calculated value.
     */
    public getCalculatedValue(): any {
        this.#assertAttached('getCalculatedValue');
        if (this.#dataType === DataType.TYPE_FORMULA) {
            if (this.#calculatedValue === undefined) {
                const worksheet = this.#worksheet;
                if (!worksheet) {
                    this.#throwDetached('getCalculatedValue');
                }
                const parent = worksheet.getParent();
                if (!parent) {
                    this.#throwDetached('getCalculatedValue');
                }
                const calculation = parent.getCalculationEngine();
                this.#calculatedValue = calculation.calculateFormula(this.#value, worksheet, this.getCoordinate());
            }
            return this.#calculatedValue;
        }
        return this.#value;
    }

    public getCalculatedValueString(): string {
        const value = this.getCalculatedValue();
        return value === null || value === undefined ? '' : String(value);
    }

    public setCalculatedValue(value: any): this {
        this.#oldCalculatedValue = this.#calculatedValue;
        this.#calculatedValue = value;
        return this;
    }

    public getOldCalculatedValue(): any {
        return this.#oldCalculatedValue;
    }

    /**
     * Get coordinate.
     */
    public getCoordinate(): string {
        return Coordinate.stringFromCoordinate(this.#column + 1, this.#row + 1);
    }

    /**
     * Set value.
     */
    public setValue(value: any, binder: IValueBinder | null = null): this {
        this.#assertAttached('setValue');
        const worksheet = this.#worksheet;
        if (!worksheet) {
            this.#throwDetached('setValue');
        }
        if (this.hasHyperlink()) {
            worksheet.setHyperlink(this.getCoordinate(), null);
            this.#hyperlink = null;
        }
        const activeBinder = binder ?? worksheet.getParent()?.getValueBinder() ?? Cell.getValueBinder();
        if (!activeBinder) {
            throw new Error('Value Binder is not set.');
        }
        if (!activeBinder.bindValue(this, value)) {
            throw new Error('Value could not be bound to cell.');
        }
        return this;
    }

    /**
     * Set value explicit.
     */
    public setValueExplicit(value: any, dataType: TDataType = DataType.TYPE_STRING): this {
        if (this.#worksheet && this.hasHyperlink()) {
            this.#worksheet.setHyperlink(this.getCoordinate(), null);
            this.#hyperlink = null;
        }
        const oldValue = this.#value;
        let normalizedValue = value;
        let normalizedType: TDataType = dataType;
        const binder = this.#worksheet?.getParent()?.getValueBinder() ?? Cell.getValueBinder();
        const preserveCr = binder?.getPreserveCr() ?? false;

        const switchType = dataType === DataType.TYPE_STRING2 ? DataType.TYPE_STRING : dataType;

        switch (switchType) {
            case DataType.TYPE_NULL:
                normalizedValue = null;
                break;
            case DataType.TYPE_STRING:
                if (dataType === DataType.TYPE_STRING2) {
                    normalizedType = DataType.TYPE_STRING;
                }
                if (typeof normalizedValue === 'string' && normalizedValue.startsWith('=')) {
                    this.getStyle().setQuotePrefix(true);
                }
                if (typeof normalizedValue === 'string' && normalizedValue.startsWith("'")) {
                    this.getStyle().setQuotePrefix(true);
                    normalizedValue = normalizedValue.slice(1);
                }
                normalizedValue = Cell.#checkString(normalizedValue, preserveCr);
                break;
            case DataType.TYPE_INLINE:
                normalizedValue = Cell.#checkString(normalizedValue, preserveCr);
                break;
            case DataType.TYPE_NUMERIC:
                if (normalizedValue === null) {
                    normalizedValue = 0;
                    break;
                }
                if (typeof normalizedValue === 'boolean') {
                    normalizedValue = normalizedValue ? 1 : 0;
                    break;
                }
                if (typeof normalizedValue !== 'number' && typeof normalizedValue !== 'string') {
                    throw new Error('Value is not numeric.');
                }
                if (typeof normalizedValue === 'string' && normalizedValue.trim() === '') {
                    throw new Error('Value is not numeric.');
                }
                const numericValue = Number(normalizedValue);
                if (!Number.isFinite(numericValue)) {
                    throw new Error('Value is not numeric.');
                }
                normalizedValue = numericValue;
                break;
            case DataType.TYPE_FORMULA:
                normalizedValue = normalizedValue === null ? '' : String(normalizedValue);
                break;
            case DataType.TYPE_BOOL:
                normalizedValue = Boolean(normalizedValue);
                break;
            case DataType.TYPE_ISO_DATE:
                normalizedValue = convertIsoDate(normalizedValue);
                normalizedType = DataType.TYPE_NUMERIC;
                break;
            case DataType.TYPE_DRAWING_IN_CELL:
                if (!Cell.#isDrawingInCell(normalizedValue)) {
                    throw new Error('Value is not a valid drawing for a cell.');
                }
                break;
            case DataType.TYPE_ERROR:
                normalizedValue = Cell.#checkErrorCode(normalizedValue);
                break;
            default:
                throw new Error(`Invalid data type '${dataType}'.`);
        }

        this.#value = normalizedValue;
        this.#dataType = normalizedType;
        this.#calculatedValue = undefined;

        if (this.#worksheet) {
            const oldText = oldValue === null || oldValue === undefined ? '' : String(oldValue);
            const newText = normalizedValue === null || normalizedValue === undefined ? '' : String(normalizedValue);
            if (oldText.toLowerCase() !== newText.toLowerCase()) {
                const tables = this.#worksheet.getTables();
                const [cellCol, cellRow] = Coordinate.indexesFromString(this.getCoordinate());
                for (const table of tables) {
                    const boundaries = table.getRangeBoundaries();
                    const [[minCol, minRow], [maxCol, maxRow]] = boundaries;
                    if (cellCol >= minCol && cellCol <= maxCol && cellRow >= minRow && cellRow <= maxRow) {
                        if (cellRow === minRow) {
                            table.updateColumnName(oldText, newText);
                        }
                        break;
                    }
                }
            }
        }
        return this;
    }

    static #checkString(value: unknown, preserveCr: boolean = false): string {
        let stringValue = value === null || value === undefined ? '' : String(value);
        if (!preserveCr) {
            stringValue = stringValue.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
        }
        if (stringValue.length > 32767) {
            stringValue = stringValue.slice(0, 32767);
        }
        return stringValue;
    }

    static #checkErrorCode(value: unknown): string {
        if (isError(value)) {
            return String(value);
        }
        if (typeof value === 'string' && value.toUpperCase() === '#CALC!') {
            return '#CALC!';
        }
        return '#NULL!';
    }

    static #isDrawingInCell(value: unknown): value is { getImageIndex: () => number; getCoordinates: () => string } {
        if (!value || typeof value !== 'object') {
            return false;
        }
        const candidate = value as { getImageIndex?: unknown; getCoordinates?: unknown };
        return typeof candidate.getImageIndex === 'function' && typeof candidate.getCoordinates === 'function';
    }

    /**
     * Get data type.
     */
    public getDataType(): TDataType {
        return this.#dataType;
    }

    /**
     * Set data type.
     */
    public setDataType(dataType: TDataType): void {
        this.#dataType = dataType;
    }

    /**
     * Get column (A1 column string).
     */
    public getColumn(): string {
        return Coordinate.stringFromColumnIndex(this.#column + 1);
    }

    /**
     * Get column index (0-indexed).
     */
    public getColumnIndex(): number {
        return this.#column;
    }

    /**
     * Set column index (0-indexed).
     */
    public setColumnIndex(column: number): void {
        this.#column = column;
    }

    /**
     * Get row (1-indexed).
     */
    public getRow(): number {
        return this.#row + 1;
    }

    /**
     * Get row index (0-indexed).
     */
    public getRowIndex(): number {
        return this.#row;
    }

    /**
     * Set row index (0-indexed).
     */
    public setRowIndex(row: number): void {
        this.#row = row;
    }

    /**
     * Get Xf index.
     */
    public getXfIndex(): number {
        return this.#xfIndex;
    }

    /**
     * Set Xf index.
     */
    public setXfIndex(index: number): void {
        this.#xfIndex = index;
    }

    /**
     * Get cell style.
     */
    public getStyle(): Style {
        this.#assertAttached('getStyle');
        // Match PhpSpreadsheet behavior: Cell::getStyle() returns a supervisor style
        // bound to this cell coordinate, so mutations create/update an xf entry and
        // update this cell's xfIndex rather than mutating a shared Style instance.
        const worksheet = this.#worksheet;
        if (!worksheet) {
            this.#throwDetached('getStyle');
        }
        return worksheet.getStyle(this.getCoordinate());
    }

    /**
     * Get parent worksheet.
     */
    public getWorksheet(): Worksheet {
        this.#assertAttached('getWorksheet');
        const worksheet = this.#worksheet;
        if (!worksheet) {
            this.#throwDetached('getWorksheet');
        }
        return worksheet;
    }

    /**
     * Detach this cell from its worksheet.
     *
     * This is primarily intended for memory-management cleanup when a worksheet
     * is being disconnected. A detached cell becomes unusable for worksheet-
     * dependent operations.
     */
    public detach(): void {
        if (this.#isDetached) {
            return;
        }

        this.#isDetached = true;
        this.#calculatedValue = undefined;
        this.#worksheet = null;
    }

    /**
     * Clear calculation cache.
     */
    public clearCalculationCache(): void {
        this.#calculatedValue = undefined;
    }

    /**
     * Check if this cell is in a merged range.
     *
     * @returns True if cell is in a merge range
     */
    public isInMergeRange(): boolean {
        return this.getMergeRange() !== null;
    }

    /**
     * Check if this cell is the master (top-left) cell in a merged range.
     *
     * @returns True if this is the master cell holding the value
     */
    public isMergeRangeValueCell(): boolean {
        const mergeRange = this.getMergeRange();
        if (!mergeRange) {
            return false;
        }

        const split = Coordinate.splitRange(mergeRange);
        const firstPair = split[0];
        if (!firstPair || firstPair.length < 2) {
            return false;
        }
        const [startCell] = firstPair;
        return this.getCoordinate() === startCell;
    }

    /**
     * Get the merge range if this cell is in one.
     *
     * @returns The merge range string (e.g., 'A1:B2') or null
     */
    public getMergeRange(): string | null {
        const worksheet = this.getWorksheet();
        const mergeCells = worksheet.getMergeCells();

        for (const mergeRange of Object.values(mergeCells)) {
            if (this.isInRange(mergeRange)) {
                return mergeRange;
            }
        }

        return null;
    }

    /**
     * Check if this cell is within a given range.
     *
     * @param range The range to check (e.g., 'A1:B2')
     * @returns True if cell is in the range
     */
    public isInRange(range: string): boolean {
        const match = this.getCoordinate().match(/^([A-Z]+)(\d+)$/);
        if (!match) return false;

        const cellCol = match[1]!;
        const cellRow = match[2]!;
        const cellColIndex = Coordinate.columnIndexFromString(cellCol);
        const cellRowNum = parseInt(cellRow, 10);

        const [[minCol, minRow], [maxCol, maxRow]] = Coordinate.rangeBoundaries(range);

        return cellColIndex >= minCol && cellColIndex <= maxCol && cellRowNum >= minRow && cellRowNum <= maxRow;
    }

    /**
     * Get the formatted value of this cell.
     *
     * @returns The formatted value as string
     */
    public getFormattedValue(): string {
        const value = this.getValue();

        if (value === null || value === undefined) {
            return '';
        }

        // Use the cell's style number format to format the value
        const numberFormat = this.getStyle().getNumberFormat();
        return numberFormat.toFormattedString(value);
    }

    /**
     * Check if this cell contains a formula.
     *
     * @returns True if cell contains a formula
     */
    public isFormula(): boolean {
        return this.#dataType === DataType.TYPE_FORMULA && this.getStyle().getQuotePrefix() === false;
    }

    public getAppliedStyle(): Style {
        const worksheet = this.getWorksheet();
        const coordinate = this.getCoordinate();

        if (worksheet.conditionalStylesExists(coordinate) === false) {
            return this.getStyle();
        }

        const range = worksheet.getConditionalRange(coordinate);
        if (range === null) {
            return this.getStyle();
        }

        const matcher = new CellStyleAssessor(this, range);
        return matcher.matchConditions(worksheet.getConditionalStyles(coordinate));
    }

    public rebindParent(worksheet: Worksheet): this {
        this.#worksheet = worksheet;
        worksheet.getCellCollection().update(this);
        return this;
    }

    /**
     * Check if this cell is locked (for sheet protection).
     *
     * Returns true if the sheet is protected and this cell is NOT locked,
     * meaning it can be edited. Returns false if the sheet is not protected
     * or if the cell is explicitly locked.
     *
     * @returns True if the cell is locked for editing under sheet protection
     */
    public isLocked(): boolean {
        // Get protection from cell style
        const protection = this.getStyle().getProtection();

        // If protection is not set (unprotected), return false
        if (protection.getLocked() === Protection.PROTECTION_UNPROTECTED) {
            return false;
        }

        // Default behavior: cell is locked
        return true;
    }

    /**
     * Check if this cell's formula is hidden on the formula bar
     * when the sheet is protected.
     *
     * @returns True if formula should be hidden when sheet is protected
     */
    public isHiddenOnFormulaBar(): boolean {
        // Get protection from cell style
        const protection = this.getStyle().getProtection();

        // If protection is not set (unprotected), return false
        if (protection.getHidden() === Protection.PROTECTION_UNPROTECTED) {
            return false;
        }

        // Default behavior: formula is not hidden
        return true;
    }

    /**
     * Get the hyperlink for this cell.
     *
     * @returns The hyperlink object or null if no hyperlink
     */
    public getHyperlink(): Hyperlink {
        this.#assertAttached('getHyperlink');
        const worksheet = this.#worksheet;
        if (!worksheet) {
            this.#throwDetached('getHyperlink');
        }
        return worksheet.getHyperlink(this.getCoordinate());
    }

    public setHyperlink(hyperlink: Hyperlink | null): this {
        this.#assertAttached('setHyperlink');
        const worksheet = this.#worksheet;
        if (!worksheet) {
            this.#throwDetached('setHyperlink');
        }
        worksheet.setHyperlink(this.getCoordinate(), hyperlink);
        return this;
    }

    /**
     * True if a real hyperlink is present.
     */
    public hasHyperlink(): boolean {
        const worksheet = this.#worksheet;
        if (!worksheet) {
            this.#throwDetached('hasHyperlink');
        }
        return worksheet.hyperlinkExists(this.getCoordinate());
    }

    public getWorksheetOrNull(): Worksheet | null {
        return this.#worksheet;
    }

    /**
     * Get the data validation for this cell.
     *
     * @returns The data validation object or null if no validation
     */
    public getDataValidation(): any {
        this.#assertAttached('getDataValidation');
        const worksheet = this.#worksheet;
        if (!worksheet) {
            this.#throwDetached('getDataValidation');
        }
        // Import is handled via type-only to avoid circular dependency issues
        // The actual DataValidation class is available at runtime via the Worksheet
        return worksheet.getDataValidation(this.getCoordinate());
    }

    public hasDataValidation(): boolean {
        this.#assertAttached('hasDataValidation');
        const worksheet = this.#worksheet;
        if (!worksheet) {
            this.#throwDetached('hasDataValidation');
        }
        return worksheet.dataValidationExists(this.getCoordinate());
    }

    /**
     * Set the data validation for this cell.
     *
     * @param dataValidation Data validation object
     * @returns this
     */
    public setDataValidation(dataValidation: any): this {
        this.#assertAttached('setDataValidation');
        const worksheet = this.#worksheet;
        if (!worksheet) {
            this.#throwDetached('setDataValidation');
        }
        worksheet.setDataValidation(this.getCoordinate(), dataValidation);
        return this;
    }

    public setFormulaAttributes(attributes: Record<string, unknown> | null = null): this {
        this.#formulaAttributes = attributes;
        return this;
    }

    public getFormulaAttributes(): Record<string, unknown> | null {
        return this.#formulaAttributes;
    }

    public getIgnoredErrors(): Record<string, unknown> {
        return this.#ignoredErrors;
    }

    public static compareCells(a: Cell, b: Cell): number {
        if (a.getRow() < b.getRow()) {
            return -1;
        }
        if (a.getRow() > b.getRow()) {
            return 1;
        }
        const colA = Coordinate.columnIndexFromString(a.getColumn());
        const colB = Coordinate.columnIndexFromString(b.getColumn());
        if (colA < colB) {
            return -1;
        }
        if (colA > colB) {
            return 1;
        }
        return 0;
    }

    /**
     * Get classic comment for this cell.
     *
     * @param create If true, create and attach a comment when absent
     */
    public getComment(create: boolean = true): Comment {
        this.#assertAttached('getComment');
        const worksheet = this.#worksheet;
        if (!worksheet) {
            this.#throwDetached('getComment');
        }
        return worksheet.getComment(this.getCoordinate(), create);
    }

    /**
     * Try get classic comment for this cell.
     */
    public tryGetComment(): Comment | null {
        this.#assertAttached('tryGetComment');
        const worksheet = this.#worksheet;
        if (!worksheet) {
            this.#throwDetached('tryGetComment');
        }
        return worksheet.tryGetComment(this.getCoordinate());
    }

    /**
     * True if this cell has a classic comment.
     */
    public hasComment(): boolean {
        this.#assertAttached('hasComment');
        const worksheet = this.#worksheet;
        if (!worksheet) {
            this.#throwDetached('hasComment');
        }
        return worksheet.hasComment(this.getCoordinate());
    }

    /**
     * Remove the classic comment from this cell.
     */
    public removeComment(): this {
        this.#assertAttached('removeComment');
        const worksheet = this.#worksheet;
        if (!worksheet) {
            this.#throwDetached('removeComment');
        }
        worksheet.removeComment(this.getCoordinate());
        return this;
    }

    #assertAttached(method: string): void {
        if (this.#isDetached || this.#worksheet === null) {
            this.#throwDetached(method);
        }
    }

    #throwDetached(method: string): never {
        throw new Error(`Cell is detached; ${method}() can not be called.`);
    }
}
