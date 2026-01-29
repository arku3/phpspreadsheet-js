import { Cell } from './cell.ts';

/**
 * Value Binder Interface.
 */
export interface IValueBinder {
    /**
     * Bind value to a cell.
     *
     * @param cell Cell to bind value to
     * @param value Value to bind in cell
     */
    bindValue(cell: Cell, value: any): boolean;
}
