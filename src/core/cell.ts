import { Worksheet } from './worksheet.ts';
import { Coordinate } from '../utils/coordinate.ts';
import { RichText } from '../rich-text/rich-text.ts';
import { Style } from '../style/style.ts';

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

    constructor(value: any, dataType: TDataType, worksheet: Worksheet, column: number, row: number) {
        this.#value = value;
        this.#dataType = dataType;
        this.#worksheet = worksheet;
        this.#column = column;
        this.#row = row;
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
        return Coordinate.stringFromCoordinate(this.#column, this.#row);
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
     * Get row (0-indexed).
     */
    public getRow(): number {
        return this.#row;
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
        return this.#worksheet.getParent().getCellXfByIndex(this.#xfIndex);
    }

    /**
     * Set parent worksheet.
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
}
