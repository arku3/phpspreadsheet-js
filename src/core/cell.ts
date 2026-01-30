import { Worksheet } from './worksheet.ts';
import { Coordinate } from '../utils/coordinate.ts';
import { Style } from '../style/style.ts';
import { Protection } from '../style/protection.ts';
import { Hyperlink } from './hyperlink.ts';
import type { Comment } from './comment.ts';

/**
 * Cell data types.
 */
export const DataType = {
    TYPE_STRING: 's',
    TYPE_FORMULA: 'f',
    TYPE_NUMERIC: 'n',
    TYPE_BOOL: 'b',
    TYPE_NULL: 'null',
    TYPE_INLINE: 'inlineStr',
    TYPE_ERROR: 'e',
} as const;

export type TDataType = typeof DataType[keyof typeof DataType];

/**
 * Cell in a Worksheet.
 */
export class Cell {
    #value: any;
    #calculatedValue: any;
    #dataType: TDataType;
    #worksheet: Worksheet;
    #column: number;
    #row: number;
    #xfIndex: number = 0;

    #hyperlink: Hyperlink | null = null;

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

    /**
     * Get calculated value.
     */
    public getCalculatedValue(): any {
        if (this.#dataType === DataType.TYPE_FORMULA) {
            if (this.#calculatedValue === undefined) {
                const calculation = this.#worksheet.getParent().getCalculationEngine();
                this.#calculatedValue = calculation.calculateFormula(this.#value, this.#worksheet, this.getCoordinate());
            }
            return this.#calculatedValue;
        }
        return this.#value;
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
    public setValue(value: any): void {
        const binder = this.#worksheet.getParent().getValueBinder();
        binder.bindValue(this, value);
    }

    /**
     * Set value explicit.
     */
    public setValueExplicit(value: any, dataType: TDataType): void {
        this.#value = value;
        this.#dataType = dataType;
        this.#calculatedValue = undefined;
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
     * Get column (0-indexed).
     */
    public getColumn(): number {
        return this.#column;
    }

    /**
     * Set column (0-indexed).
     */
    public setColumn(column: number): void {
        this.#column = column;
    }

    /**
     * Get row (0-indexed).
     */
    public getRow(): number {
        return this.#row;
    }

    /**
     * Set row (0-indexed).
     */
    public setRow(row: number): void {
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
        // Match PhpSpreadsheet behavior: Cell::getStyle() returns a supervisor style
        // bound to this cell coordinate, so mutations create/update an xf entry and
        // update this cell's xfIndex rather than mutating a shared Style instance.
        return this.#worksheet.getStyle(this.getCoordinate());
    }

    /**
     * Get parent worksheet.
     */
    public getWorksheet(): Worksheet {
        return this.#worksheet;
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

        return cellColIndex >= minCol && 
               cellColIndex <= maxCol && 
               cellRowNum >= minRow && 
               cellRowNum <= maxRow;
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
        return this.#dataType === DataType.TYPE_FORMULA;
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
    public getHyperlink(): any {
        if (this.#hyperlink === null) {
            this.#hyperlink = new Hyperlink();
        }
        return this.#hyperlink;
    }

    /**
     * True if a real hyperlink is present.
     */
    public hasHyperlink(): boolean {
        return this.#hyperlink !== null && !this.#hyperlink.isEmpty();
    }

    /**
     * Get the data validation for this cell.
     * 
     * @returns The data validation object or null if no validation
     */
    public getDataValidation(): any {
        // Import is handled via type-only to avoid circular dependency issues
        // The actual DataValidation class is available at runtime via the Worksheet
        return this.#worksheet.getDataValidation(this.getCoordinate());
    }

    /**
     * Set the data validation for this cell.
     * 
     * @param dataValidation Data validation object
     * @returns this
     */
    public setDataValidation(dataValidation: any): this {
        this.#worksheet.setDataValidation(this.getCoordinate(), dataValidation);
        return this;
    }

    /**
     * Get classic comment for this cell.
     *
     * @param create If true, create and attach a comment when absent
     */
    public getComment(create: boolean = true): Comment {
        return this.#worksheet.getComment(this.getCoordinate(), create);
    }

    /**
     * Try get classic comment for this cell.
     */
    public tryGetComment(): Comment | null {
        return this.#worksheet.tryGetComment(this.getCoordinate());
    }

    /**
     * True if this cell has a classic comment.
     */
    public hasComment(): boolean {
        return this.#worksheet.hasComment(this.getCoordinate());
    }

    /**
     * Remove the classic comment from this cell.
     */
    public removeComment(): this {
        this.#worksheet.removeComment(this.getCoordinate());
        return this;
    }
}
