import { DefaultValueBinder } from './default-value-binder.ts';

/**
 * Advanced Value Binder.
 */
export class AdvancedValueBinder extends DefaultValueBinder {
    /**
     * Bind value to a cell.
     *
     * @param cell Cell to bind value to
     * @param value Value to bind in cell
     */
    public override bindValue(cell: Cell, value: any): boolean {
        if (typeof value === 'string') {
            const valueUpper = value.toUpperCase();

            // Boolean detection
            if (valueUpper === 'TRUE' || valueUpper === 'FALSE') {
                cell.setValueExplicit(valueUpper === 'TRUE', DataType.TYPE_BOOL);
                return true;
            }

            // Percentage detection
            const percentageMatch = value.match(/^\-?\d*\.?\d*\s?\%$/);
            if (percentageMatch) {
                const numericValue = parseFloat(value.replace('%', '')) / 100;
                cell.setValueExplicit(numericValue, DataType.TYPE_NUMERIC);
                // In a real implementation, we would set the number format here
                // cell.getStyle().getNumberFormat().setFormatCode(NumberFormat.FORMAT_PERCENTAGE_00);
                return true;
            }

            // Currency detection (very basic for now)
            const currencyMatch = value.match(/^\$\s?\-?\d*\.?\d*$/);
            if (currencyMatch) {
                const numericValue = parseFloat(value.replace('$', ''));
                cell.setValueExplicit(numericValue, DataType.TYPE_NUMERIC);
                return true;
            }
        }

        return super.bindValue(cell, value);
    }
}

import { Cell, DataType } from './cell.ts';
