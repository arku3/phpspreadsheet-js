import { Coordinate } from '../../../utils/coordinate.ts';
import { Conditional } from '../../conditional.ts';
import { Style } from '../../style.ts';

export abstract class WizardAbstract {
    protected style: Style | null = null;
    protected cellRange: string;
    protected referenceCell: string = 'A1';
    protected referenceRow: number = 1;
    protected referenceColumn: number = 1;
    protected stopIfTrue: boolean = false;

    constructor(cellRange: string) {
        this.cellRange = cellRange;
        this.setCellRange(cellRange);
    }

    public getCellRange(): string {
        return this.cellRange;
    }

    public setCellRange(cellRange: string): void {
        this.cellRange = cellRange;
        this.setReferenceCellForExpressions(cellRange);
    }

    protected setReferenceCellForExpressions(conditionalRange: string): void {
        const splitRange = Coordinate.splitRange(conditionalRange.replace(/\$/g, '').toUpperCase());
        const firstRange = splitRange[0];
        if (firstRange && firstRange[0]) {
            this.referenceCell = firstRange[0];
            [this.referenceColumn, this.referenceRow] = Coordinate.indexesFromString(this.referenceCell);
        }
    }

    public getStopIfTrue(): boolean {
        return this.stopIfTrue;
    }

    public setStopIfTrue(stopIfTrue: boolean): void {
        this.stopIfTrue = stopIfTrue;
    }

    public getStyle(): Style {
        if (!this.style) {
            this.style = new Style(false);
        }
        return this.style;
    }

    public setStyle(style: Style): void {
        this.style = style;
    }

    /**
     * Helper to adjust cell references in a condition string.
     * Ported from PHP's cellConditionCheck.
     */
    protected cellConditionCheck(condition: string): string {
        const rowAdjustment = this.referenceRow - 1;
        const columnAdjustment = this.referenceColumn - 1;
        const regexp = /((?:'[^']+'|[A-Za-z0-9_]+)!|)(\$?[A-Z]{1,3}\$?\d+)/g;

        return condition.replace(regexp, (_match, worksheetRef: string, cellRef: string) => {
            const adjustedCell = this.conditionCellAdjustment(cellRef, rowAdjustment, columnAdjustment);
            return `${worksheetRef}${adjustedCell}`;
        });
    }

    protected conditionCellAdjustment(cellAddress: string, rowAdjustment: number, columnAdjustment: number): string {
        const match = cellAddress.match(/^(\$?)([A-Z]{1,3})(\$?)(\d+)$/);
        if (!match) {
            return cellAddress;
        }
        const [, colDollar, colLetters, rowDollar, rowDigits] = match;

        let colIndex = Coordinate.columnIndexFromString(colLetters ?? 'A');
        let rowIndex = Number(rowDigits ?? '1');

        if (colDollar !== '$') {
            colIndex -= columnAdjustment;
        }
        if (rowDollar !== '$') {
            rowIndex -= rowAdjustment;
        }

        colIndex = Math.max(1, colIndex);
        rowIndex = Math.max(1, rowIndex);

        const resultColumn = `${colDollar}${Coordinate.stringFromColumnIndex(colIndex)}`;
        const resultRow = `${rowDollar}${rowIndex}`;
        return `${resultColumn}${resultRow}`;
    }

    protected adjustConditionsForCellReferences(conditions: (string | number)[]): (string | number)[] {
        return conditions.map((condition) => {
            if (typeof condition === 'string') {
                return this.cellConditionCheck(condition);
            }
            return condition;
        });
    }
}
