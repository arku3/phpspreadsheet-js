import { Coordinate } from '../../../utils/coordinate.ts';
import { Style } from '../../style.ts';
import { Conditional } from '../../conditional.ts';

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
        // Simple port: replace relative references based on reference cell
        // In a real implementation, we'd use the FormulaParser or a more robust regex
        // For now, we follow the PHP logic of adjusting based on top-left of range
        
        // Note: Calculation.CALCULATION_REGEXP_CELLREF_RELATIVE is not exposed in TS yet.
        // We will use a simplified approach or implement the regex here.
        return condition; 
    }

    protected adjustConditionsForCellReferences(conditions: (string | number)[]): (string | number)[] {
        return conditions.map(condition => {
            if (typeof condition === 'string') {
                return this.cellConditionCheck(condition);
            }
            return condition;
        });
    }
}
