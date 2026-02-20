import { Cell } from '../../core/cell.ts';
import { Worksheet } from '../../core/worksheet.ts';
import { Coordinate } from '../../utils/coordinate.ts';
import { Conditional } from '../conditional.ts';

export class CellMatcher {
    public static readonly COMPARISON_OPERATORS: Record<string, string> = {
        [Conditional.OPERATOR_EQUAL]: '=',
        [Conditional.OPERATOR_GREATERTHAN]: '>',
        [Conditional.OPERATOR_GREATERTHANOREQUAL]: '>=',
        [Conditional.OPERATOR_LESSTHAN]: '<',
        [Conditional.OPERATOR_LESSTHANOREQUAL]: '<=',
        [Conditional.OPERATOR_NOTEQUAL]: '<>',
    };

    public static readonly COMPARISON_RANGE_OPERATORS: Record<string, string> = {
        [Conditional.OPERATOR_BETWEEN]: 'IF(AND(A1>=%s,A1<=%s),TRUE,FALSE)',
        [Conditional.OPERATOR_NOTBETWEEN]: 'IF(AND(A1>=%s,A1<=%s),FALSE,TRUE)',
    };

    public static readonly COMPARISON_DUPLICATES_OPERATORS: Record<string, string> = {
        [Conditional.CONDITION_DUPLICATES]: "COUNTIF('%s'!%s,%s)>1",
        [Conditional.CONDITION_UNIQUE]: "COUNTIF('%s'!%s,%s)=1",
    };

    protected cell: Cell;
    protected worksheet: Worksheet;
    protected cellRow: number;
    protected cellColumn: number;
    protected conditionalRange: string = '';
    protected referenceCell: string = 'A1';
    protected referenceRow: number = 1;
    protected referenceColumn: number = 1;

    constructor(cell: Cell, conditionalRange: string) {
        this.cell = cell;
        this.worksheet = cell.getWorksheet();
        this.cellColumn = cell.getColumnIndex() + 1; // 1-indexed for matching PHP logic
        this.cellRow = cell.getRow();
        this.setReferenceCellForExpressions(conditionalRange);
    }

    protected setReferenceCellForExpressions(conditionalRange: string): void {
        const splitRange = Coordinate.splitRange(conditionalRange.replace(/\$/g, '').toUpperCase());
        const firstRange = splitRange[0];
        if (firstRange && firstRange[0]) {
            this.referenceCell = firstRange[0];
            [this.referenceColumn, this.referenceRow] = Coordinate.indexesFromString(this.referenceCell);
        }

        const absoluteRanges: string[] = [];
        for (const rangeSet of splitRange) {
            const absoluteRange = rangeSet.map((coord) => Coordinate.absoluteCoordinate(coord)).join(':');
            absoluteRanges.push(absoluteRange);
        }
        this.conditionalRange = absoluteRanges.join(',');
    }

    public evaluateConditional(conditional: Conditional): boolean {
        // Refresh cell in case calculations modified it
        const cellAddress = Coordinate.stringFromCoordinate(this.cellColumn, this.cellRow);
        this.cell = this.worksheet.getCell(cellAddress);

        switch (conditional.getConditionType()) {
            case Conditional.CONDITION_CELLIS:
                return this.processOperatorComparison(conditional);
            case Conditional.CONDITION_DUPLICATES:
            case Conditional.CONDITION_UNIQUE:
                return this.processDuplicatesComparison(conditional);
            case Conditional.CONDITION_CONTAINSTEXT:
            case Conditional.CONDITION_NOTCONTAINSTEXT:
            case Conditional.CONDITION_BEGINSWITH:
            case Conditional.CONDITION_ENDSWITH:
            case Conditional.CONDITION_CONTAINSBLANKS:
            case Conditional.CONDITION_NOTCONTAINSBLANKS:
            case Conditional.CONDITION_CONTAINSERRORS:
            case Conditional.CONDITION_NOTCONTAINSERRORS:
            case Conditional.CONDITION_TIMEPERIOD:
            case Conditional.CONDITION_EXPRESSION:
                return this.processExpression(conditional);
            default:
                return false;
        }
    }

    protected wrapValue(value: any): string | number {
        if (typeof value === 'number') return value;
        if (typeof value === 'boolean') return value ? 'TRUE' : 'FALSE';
        if (value === null) return 'NULL';
        return '"' + String(value).replace(/"/g, '""') + '"';
    }

    protected wrapCellValue(): string | number {
        return this.wrapValue(this.cell.getCalculatedValue());
    }

    protected processOperatorComparison(conditional: Conditional): boolean {
        const operatorType = conditional.getOperatorType();
        if (CellMatcher.COMPARISON_RANGE_OPERATORS[operatorType]) {
            return this.processRangeOperator(conditional);
        }

        const operator = CellMatcher.COMPARISON_OPERATORS[operatorType];
        if (!operator) return false;

        const conditions = this.adjustConditionsForCellReferences(conditional.getConditions());
        const val1 = this.wrapCellValue();
        const val2 = conditions[conditions.length - 1];
        const expression = `=${val1}${operator}${val2}`;

        return this.evaluateExpression(expression);
    }

    protected processRangeOperator(conditional: Conditional): boolean {
        const conditions = this.adjustConditionsForCellReferences(conditional.getConditions());
        conditions.sort();

        let expression = CellMatcher.COMPARISON_RANGE_OPERATORS[conditional.getOperatorType()]!;
        expression = expression.replace(/\bA1\b/gi, String(this.wrapCellValue()));

        const safeConditions = [...conditions];
        expression = `=${expression.replace(/%s/g, () => String(safeConditions.shift()))}`;

        return this.evaluateExpression(expression);
    }

    protected processDuplicatesComparison(conditional: Conditional): boolean {
        const worksheetName = this.worksheet.getTitle();
        const expression = `=${CellMatcher.COMPARISON_DUPLICATES_OPERATORS[conditional.getConditionType()]}`
            .replace('%s', worksheetName)
            .replace('%s', this.conditionalRange)
            .replace('%s', String(this.wrapValue(this.cell.getCalculatedValue())));

        return this.evaluateExpression(expression);
    }

    protected processExpression(conditional: Conditional): boolean {
        const conditions = this.adjustConditionsForCellReferences(conditional.getConditions());
        let expression = conditions[conditions.length - 1] as string;

        const cellValue = this.wrapCellValue();
        expression = `=${expression.replace(new RegExp('\\b' + this.referenceCell + '\\b', 'gi'), String(cellValue))}`;

        return this.evaluateExpression(expression);
    }

    protected evaluateExpression(expression: string): boolean {
        try {
            const parent = this.worksheet.getParent();
            if (!parent) {
                return false;
            }
            const calculation = parent.getCalculationEngine();
            calculation.flushInstance();
            return Boolean(calculation.calculateFormula(expression, this.worksheet, this.cell.getCoordinate()));
        } catch (e) {
            return false;
        }
    }

    protected adjustConditionsForCellReferences(conditions: (string | number)[]): (string | number)[] {
        return conditions.map((condition) => {
            if (typeof condition === 'string') {
                return this.cellConditionCheck(condition);
            }
            return condition;
        });
    }

    protected cellConditionCheck(condition: string): string {
        return condition;
    }
}
