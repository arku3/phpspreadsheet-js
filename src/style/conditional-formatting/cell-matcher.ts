import { Cell, DataType } from '../../core/cell.ts';
import { Worksheet } from '../../core/worksheet.ts';
import { Coordinate } from '../../utils/coordinate.ts';
import { Conditional } from '../conditional.ts';

export class CellMatcher {
    protected static isNumericValue(value: unknown): boolean {
        if (typeof value === 'number') {
            return Number.isFinite(value);
        }

        if (typeof value === 'string') {
            const trimmed = value.trim();
            return trimmed !== '' && Number.isFinite(Number(trimmed));
        }

        return false;
    }

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
            case Conditional.CONDITION_COLORSCALE:
                return this.processColorScale(conditional);
            case Conditional.CONDITION_DUPLICATES:
            case Conditional.CONDITION_UNIQUE:
                return this.processDuplicatesComparison(conditional);
            case Conditional.CONDITION_CONTAINSTEXT:
            case Conditional.CONDITION_NOTCONTAINSTEXT:
            case Conditional.CONDITION_BEGINSWITH:
            case Conditional.CONDITION_ENDSWITH:
                return this.processTextCondition(conditional);
            case Conditional.CONDITION_CONTAINSBLANKS:
            case Conditional.CONDITION_NOTCONTAINSBLANKS:
                return this.processBlankCondition(conditional);
            case Conditional.CONDITION_CONTAINSERRORS:
            case Conditional.CONDITION_NOTCONTAINSERRORS:
                return this.processErrorCondition(conditional);
            case Conditional.CONDITION_TIMEPERIOD:
                return this.processTimePeriodCondition(conditional);
            case Conditional.CONDITION_EXPRESSION:
                return this.processExpression(conditional);
            default:
                return false;
        }
    }

    protected processColorScale(conditional: Conditional): boolean {
        const colorScale = conditional.getColorScale();
        if (!colorScale || !colorScale.colorScaleReadyForUse()) {
            return false;
        }
        const value = this.cell.getCalculatedValue();
        return CellMatcher.isNumericValue(value);
    }

    protected wrapValue(value: any): string | number {
        if (CellMatcher.isNumericValue(value)) {
            return typeof value === 'number' ? value : String(value).trim();
        }
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
        conditions.sort((left, right) => Number(left) - Number(right));

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
            .replace('%s', this.cellConditionCheck(this.cell.getCalculatedValueString()));

        return this.evaluateExpression(expression);
    }

    protected processTextCondition(conditional: Conditional): boolean {
        const cellValue = this.cell.getCalculatedValue();
        const haystack = (cellValue == null ? '' : String(cellValue)).toLowerCase();
        const needle = this.extractConditionText(conditional).toLowerCase();

        switch (conditional.getConditionType()) {
            case Conditional.CONDITION_CONTAINSTEXT:
                return haystack.includes(needle);
            case Conditional.CONDITION_NOTCONTAINSTEXT:
                return !haystack.includes(needle);
            case Conditional.CONDITION_BEGINSWITH:
                return haystack.startsWith(needle);
            case Conditional.CONDITION_ENDSWITH:
                return haystack.endsWith(needle);
            default:
                return false;
        }
    }

    protected extractConditionText(conditional: Conditional): string {
        const directText = conditional.getText();
        if (directText) {
            return directText;
        }

        const condition = String(conditional.getConditions()[0] ?? '');
        const match = condition.match(/"((?:[^"]|"")*)"/);
        return match ? match[1]!.replace(/""/g, '"') : '';
    }

    protected processBlankCondition(conditional: Conditional): boolean {
        const cellValue = this.cell.getCalculatedValue();
        const trimmed = cellValue == null ? '' : String(cellValue).trim();
        const isBlank = trimmed.length === 0;

        return conditional.getConditionType() === Conditional.CONDITION_CONTAINSBLANKS ? isBlank : !isBlank;
    }

    protected processErrorCondition(conditional: Conditional): boolean {
        const value = this.cell.getCalculatedValue();
        const isError =
            this.cell.getDataType() === DataType.TYPE_ERROR ||
            ['#NULL!', '#DIV/0!', '#VALUE!', '#REF!', '#NAME?', '#NUM!', '#N/A'].includes(String(value));

        return conditional.getConditionType() === Conditional.CONDITION_CONTAINSERRORS ? isError : !isError;
    }

    protected processTimePeriodCondition(conditional: Conditional): boolean {
        const value = this.cell.getCalculatedValue();
        if (typeof value !== 'number' || !Number.isFinite(value)) {
            return false;
        }

        const cellDay = Math.floor(value);
        const today = CellMatcher.currentExcelDay();

        switch (conditional.getText()) {
            case Conditional.TIMEPERIOD_YESTERDAY:
                return cellDay === today - 1;
            case Conditional.TIMEPERIOD_TODAY:
                return cellDay === today;
            case Conditional.TIMEPERIOD_TOMORROW:
                return cellDay === today + 1;
            case Conditional.TIMEPERIOD_LAST_7_DAYS:
                return today - cellDay <= 6 && cellDay <= today;
            case Conditional.TIMEPERIOD_LAST_WEEK:
                return this.isInWeekOffset(cellDay, -1);
            case Conditional.TIMEPERIOD_THIS_WEEK:
                return this.isInWeekOffset(cellDay, 0);
            case Conditional.TIMEPERIOD_NEXT_WEEK:
                return this.isInWeekOffset(cellDay, 1);
            case Conditional.TIMEPERIOD_LAST_MONTH:
                return this.isInMonthOffset(cellDay, -1);
            case Conditional.TIMEPERIOD_THIS_MONTH:
                return this.isInMonthOffset(cellDay, 0);
            case Conditional.TIMEPERIOD_NEXT_MONTH:
                return this.isInMonthOffset(cellDay, 1);
            default:
                return this.processExpression(conditional);
        }
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

    protected static currentExcelDay(): number {
        const now = new Date();
        const todayUtc = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
        const excelEpochUtc = Date.UTC(1899, 11, 30);
        return Math.floor((todayUtc - excelEpochUtc) / (24 * 60 * 60 * 1000));
    }

    protected isInWeekOffset(cellDay: number, weekOffset: number): boolean {
        const todayDate = CellMatcher.excelDayToUtcDate(CellMatcher.currentExcelDay());
        const startOfThisWeek = CellMatcher.startOfWeek(todayDate);
        const startOfTargetWeek = new Date(startOfThisWeek.getTime());
        startOfTargetWeek.setUTCDate(startOfTargetWeek.getUTCDate() + weekOffset * 7);
        const endOfTargetWeek = new Date(startOfTargetWeek.getTime());
        endOfTargetWeek.setUTCDate(endOfTargetWeek.getUTCDate() + 6);

        const cellDate = CellMatcher.excelDayToUtcDate(cellDay);
        return cellDate >= startOfTargetWeek && cellDate <= endOfTargetWeek;
    }

    protected isInMonthOffset(cellDay: number, monthOffset: number): boolean {
        const todayDate = CellMatcher.excelDayToUtcDate(CellMatcher.currentExcelDay());
        const targetStart = new Date(Date.UTC(todayDate.getUTCFullYear(), todayDate.getUTCMonth() + monthOffset, 1));
        const targetEnd = new Date(Date.UTC(todayDate.getUTCFullYear(), todayDate.getUTCMonth() + monthOffset + 1, 0));

        const cellDate = CellMatcher.excelDayToUtcDate(cellDay);
        return cellDate >= targetStart && cellDate <= targetEnd;
    }

    protected static excelDayToUtcDate(day: number): Date {
        const excelEpochUtc = Date.UTC(1899, 11, 30);
        return new Date(excelEpochUtc + day * 24 * 60 * 60 * 1000);
    }

    protected static startOfWeek(date: Date): Date {
        const start = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
        start.setUTCDate(start.getUTCDate() - start.getUTCDay());
        return start;
    }

    protected adjustConditionsForCellReferences(
        conditions: (string | number | boolean)[],
    ): (string | number | boolean)[] {
        return conditions.map((condition) => {
            if (typeof condition === 'string') {
                return this.cellConditionCheck(condition);
            }
            return condition;
        });
    }

    protected cellConditionCheck(condition: string): string {
        const regexp = /((?:'[^']+'|[A-Za-z0-9_]+)!|)?(\$?)([A-Z]{1,3})(\$?)(\d+)/g;

        return condition
            .split('"')
            .map((segment, index) => {
                if (index % 2 === 1) {
                    return segment;
                }

                return segment.replace(
                    regexp,
                    (
                        _match,
                        worksheetRef: string | undefined,
                        colDollar: string,
                        colLetters: string,
                        rowDollar: string,
                        rowDigits: string,
                    ) => {
                        let colIndex = Coordinate.columnIndexFromString(colLetters);
                        let rowIndex = Number(rowDigits);

                        if (colDollar !== '$') {
                            colIndex += this.cellColumn - this.referenceColumn;
                        }
                        if (rowDollar !== '$') {
                            rowIndex += this.cellRow - this.referenceRow;
                        }

                        const coordinate = `${Coordinate.stringFromColumnIndex(Math.max(1, colIndex))}${Math.max(1, rowIndex)}`;
                        const worksheetName = worksheetRef?.slice(0, -1);
                        const targetWorksheet = worksheetName
                            ? (this.worksheet.getParent()?.getSheetByName(worksheetName.replace(/^'|'$/g, '')) ?? null)
                            : this.worksheet;

                        if (!targetWorksheet) {
                            return String(this.wrapValue(null));
                        }

                        return String(this.wrapValue(targetWorksheet.getCell(coordinate).getCalculatedValue()));
                    },
                );
            })
            .join('"');
    }
}
