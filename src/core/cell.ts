import { Worksheet } from './worksheet.ts';

/**
 * Cell data types.
 */
export enum DataType {
    TYPE_STRING = 's',
    TYPE_FORMULA = 'f',
    TYPE_NUMERIC = 'n',
    TYPE_BOOL = 'b',
    TYPE_NULL = 'null',
    TYPE_INLINE = 'inlineStr',
    TYPE_ERROR = 'e',
}

/**
 * Cell in a Worksheet.
 */
export class Cell {
    #value: any;
    #calculatedValue: any;
    #dataType: DataType;
    #worksheet: Worksheet;
    #column: number;
    #row: number;
    #xfIndex: number = 0;

    constructor(value: any, dataType: DataType, worksheet: Worksheet, column: number, row: number) {
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
     * Set value.
     */
    public setValue(value: any): void {
        this.#value = value;
        // In a real implementation, we'd also detect the data type here if not provided
    }

    /**
     * Get data type.
     */
    public getDataType(): DataType {
        return this.#dataType;
    }

    /**
     * Set data type.
     */
    public setDataType(dataType: DataType): void {
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
     * Get parent worksheet.
     */
    public getWorksheet(): Worksheet {
        return this.#worksheet;
    }
}
