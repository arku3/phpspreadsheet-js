import { Cell } from '../../core/cell.ts';
import { Conditional } from '../conditional.ts';
import { Style } from '../style.ts';
import { CellMatcher } from './cell-matcher.ts';
import { StyleMerger } from './style-merger.ts';

export class CellStyleAssessor {
    protected cellMatcher: CellMatcher;
    protected styleMerger: StyleMerger;
    protected cell: Cell;

    constructor(cell: Cell, conditionalRange: string) {
        this.cell = cell;
        // In our TS implementation, CellMatcher might need the cell and range
        // to evaluate relative formulas and cross-cell logic.
        this.cellMatcher = new CellMatcher(cell, conditionalRange);
        this.styleMerger = new StyleMerger(cell.getStyle());
    }

    /**
     * Evaluate conditional styles and return the merged result.
     */
    public matchConditions(conditionalStyles: Conditional[] = []): Style {
        for (const conditional of conditionalStyles) {
            if (this.cellMatcher.evaluateConditional(conditional)) {
                // Merge the conditional style into the base style
                this.styleMerger.mergeStyle(conditional.getStyle(this.cell.getValue()));

                if (conditional.getStopIfTrue()) {
                    break;
                }
            }
        }

        return this.styleMerger.getStyle();
    }

    public matchConditionsReturnNullIfNoneMatched(
        conditionalStyles: Conditional[],
        cellData: string,
        stopAtFirstMatch: boolean = false,
    ): Style | null {
        let matched = false;
        const numeric = Number(cellData);
        for (const conditional of conditionalStyles) {
            if (this.cellMatcher.evaluateConditional(conditional)) {
                matched = true;
                this.styleMerger.mergeStyle(conditional.getStyle(numeric));
                if (conditional.getStopIfTrue() || stopAtFirstMatch) {
                    break;
                }
            }
        }
        if (matched) {
            return this.styleMerger.getStyle();
        }
        return null;
    }
}
