import { RichText } from '../rich-text/rich-text.ts';
import { Cell, DataType, type TDataType } from './cell.ts';
import type { IValueBinder } from './i-value-binder.ts';

/**
 * Default Value Binder.
 */
export class DefaultValueBinder implements IValueBinder {
    private static readonly FIFTEEN_NINES = 999_999_999_999_999;
    #preserveCr: boolean = false;

    public getPreserveCr(): boolean {
        return this.#preserveCr;
    }

    public setPreserveCr(preserveCr: boolean): void {
        this.#preserveCr = preserveCr;
    }

    /**
     * Bind value to a cell.
     *
     * @param cell Cell to bind value to
     * @param value Value to bind in cell
     */
    public bindValue(cell: Cell, value: any): boolean {
        // Match the value against a few data types
        let dataType = DefaultValueBinder.dataTypeForValue(value);
        if (dataType === DataType.TYPE_NUMERIC && typeof value === 'string') {
            value = parseFloat(value);
        }
        cell.setValueExplicit(value, dataType as TDataType);

        return true;
    }

    /**
     * DataType for value.
     */
    public static dataTypeForValue(value: any): TDataType {
        // Match the value against a few data types
        if (value === null) {
            return DataType.TYPE_NULL;
        }

        if (value instanceof RichText) {
            return DataType.TYPE_INLINE;
        }

        if (typeof value === 'number') {
            if (Number.isInteger(value) && Math.abs(value) > DefaultValueBinder.FIFTEEN_NINES) {
                return DataType.TYPE_STRING;
            }
            return DataType.TYPE_NUMERIC;
        }

        if (typeof value === 'boolean') {
            return DataType.TYPE_BOOL;
        }

        if (value === '') {
            return DataType.TYPE_STRING;
        }

        if (typeof value === 'string') {
            if (value.length > 1 && value[0] === '=') {
                return DataType.TYPE_FORMULA;
            }

            // Numeric string check
            if (/^[\+\-]?(\d+\.?\d*|\d*\.?\d+)([Ee][\-\+]?[0-2]?\d{1,3})?$/.test(value)) {
                const tValue = value.replace(/^[\+\-]/, '');
                if (tValue.length > 1 && tValue[0] === '0' && tValue[1] !== '.') {
                    return DataType.TYPE_STRING;
                }

                const numericValue = Number(value);
                if (!isNaN(numericValue) && isFinite(numericValue)) {
                    if (!/[eE.]/.test(value)) {
                        if (Math.abs(numericValue) > DefaultValueBinder.FIFTEEN_NINES) {
                            return DataType.TYPE_STRING;
                        }
                    }
                    return DataType.TYPE_NUMERIC;
                }
            }

            // Error code check
            const errorCodes: Record<string, TDataType> = {
                '#NULL!': DataType.TYPE_ERROR,
                '#DIV/0!': DataType.TYPE_ERROR,
                '#VALUE!': DataType.TYPE_ERROR,
                '#REF!': DataType.TYPE_ERROR,
                '#NAME?': DataType.TYPE_ERROR,
                '#NUM!': DataType.TYPE_ERROR,
                '#N/A': DataType.TYPE_ERROR,
            };
            if (errorCodes[value.toUpperCase()]) {
                return errorCodes[value.toUpperCase()]!;
            }

            return DataType.TYPE_STRING;
        }

        return DataType.TYPE_STRING;
    }
}
