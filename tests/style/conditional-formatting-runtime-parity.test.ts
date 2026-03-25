import { describe, expect, it } from 'bun:test';
import { Spreadsheet } from '../../src/core/spreadsheet.ts';
import { Color } from '../../src/style/color.ts';
import { CellMatcher } from '../../src/style/conditional-formatting/cell-matcher.ts';
import { CellStyleAssessor } from '../../src/style/conditional-formatting/cell-style-assessor.ts';
import { ConditionalColorScale } from '../../src/style/conditional-formatting/conditional-color-scale.ts';
import { ConditionalFormatValueObject } from '../../src/style/conditional-formatting/conditional-format-value-object.ts';
import { Expression } from '../../src/style/conditional-formatting/wizard/expression.ts';
import { Conditional } from '../../src/style/conditional.ts';

const currentExcelDay = (): number => {
    const now = new Date();
    const todayUtc = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
    const excelEpochUtc = Date.UTC(1899, 11, 30);
    return Math.floor((todayUtc - excelEpochUtc) / (24 * 60 * 60 * 1000));
};

const excelDayFromUtcDate = (date: Date): number => {
    const excelEpochUtc = Date.UTC(1899, 11, 30);
    const utcDate = Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate());
    return Math.floor((utcDate - excelEpochUtc) / (24 * 60 * 60 * 1000));
};

const startOfWeekUtc = (date: Date): Date => {
    const start = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
    start.setUTCDate(start.getUTCDate() - start.getUTCDay());
    return start;
};

describe('Conditional Formatting Runtime Parity', () => {
    it('should evaluate relative expression references without rewriting quoted cell-like text', () => {
        const spreadsheet = new Spreadsheet();
        const sheet = spreadsheet.getActiveSheet();
        sheet.setCellValue('B2', 'A1');

        const conditional = new Expression('B2').formula('A1="A1"').getConditional();
        const matcher = new CellMatcher(sheet.getCell('B2'), 'B2');

        expect(matcher.evaluateConditional(conditional)).toBe(true);
    });

    it('should evaluate text conditions directly like PhpSpreadsheet runtime matching', () => {
        const spreadsheet = new Spreadsheet();
        const sheet = spreadsheet.getActiveSheet();
        sheet.setCellValue('B2', 'foobar');
        sheet.setCellValue('C2', 'bar');
        sheet.setCellValue('D2', 'FoObAr');
        sheet.setCellValue('E2', 'FoObAr');
        sheet.setCellValue('F2', 'FoObAr');

        const contains = new Conditional();
        contains.setConditionType(Conditional.CONDITION_CONTAINSTEXT);
        contains.setText('foo');
        contains.setConditions(['NOT(ISERROR(SEARCH("foo",B2)))']);

        const notContains = new Conditional();
        notContains.setConditionType(Conditional.CONDITION_NOTCONTAINSTEXT);
        notContains.setText('foo');
        notContains.setConditions(['ISERROR(SEARCH("foo",C2))']);

        const beginsWith = new Conditional();
        beginsWith.setConditionType(Conditional.CONDITION_BEGINSWITH);
        beginsWith.setText('foo');

        const endsWith = new Conditional();
        endsWith.setConditionType(Conditional.CONDITION_ENDSWITH);
        endsWith.setText('bar');

        expect(new CellMatcher(sheet.getCell('B2'), 'B2').evaluateConditional(contains)).toBe(true);
        expect(new CellMatcher(sheet.getCell('C2'), 'C2').evaluateConditional(notContains)).toBe(true);
        expect(new CellMatcher(sheet.getCell('D2'), 'D2').evaluateConditional(contains)).toBe(true);
        expect(new CellMatcher(sheet.getCell('E2'), 'E2').evaluateConditional(beginsWith)).toBe(true);
        expect(new CellMatcher(sheet.getCell('F2'), 'F2').evaluateConditional(endsWith)).toBe(true);
    });

    it('should evaluate blank and not-blank conditions directly like PhpSpreadsheet runtime matching', () => {
        const spreadsheet = new Spreadsheet();
        const sheet = spreadsheet.getActiveSheet();
        sheet.setCellValue('B2', '');
        sheet.setCellValue('C2', '  ');
        sheet.setCellValue('D2', 'value');

        const blank = new Conditional();
        blank.setConditionType(Conditional.CONDITION_CONTAINSBLANKS);
        blank.setConditions(['LEN(TRIM(B2))=0']);

        const notBlank = new Conditional();
        notBlank.setConditionType(Conditional.CONDITION_NOTCONTAINSBLANKS);
        notBlank.setConditions(['LEN(TRIM(D2))>0']);

        expect(new CellMatcher(sheet.getCell('B2'), 'B2').evaluateConditional(blank)).toBe(true);
        expect(new CellMatcher(sheet.getCell('C2'), 'C2').evaluateConditional(blank)).toBe(true);
        expect(new CellMatcher(sheet.getCell('D2'), 'D2').evaluateConditional(notBlank)).toBe(true);
    });

    it('should evaluate error and not-error conditions directly like PhpSpreadsheet runtime matching', () => {
        const spreadsheet = new Spreadsheet();
        const sheet = spreadsheet.getActiveSheet();
        sheet.setCellValue('B2', '#DIV/0!');
        sheet.setCellValue('C2', 'value');

        const containsErrors = new Conditional();
        containsErrors.setConditionType(Conditional.CONDITION_CONTAINSERRORS);
        containsErrors.setConditions(['ISERROR(B2)']);

        const notContainsErrors = new Conditional();
        notContainsErrors.setConditionType(Conditional.CONDITION_NOTCONTAINSERRORS);
        notContainsErrors.setConditions(['NOT(ISERROR(C2))']);

        expect(new CellMatcher(sheet.getCell('B2'), 'B2').evaluateConditional(containsErrors)).toBe(true);
        expect(new CellMatcher(sheet.getCell('C2'), 'C2').evaluateConditional(notContainsErrors)).toBe(true);
    });

    it('should evaluate key time-period rules directly like PhpSpreadsheet runtime matching', () => {
        const spreadsheet = new Spreadsheet();
        const sheet = spreadsheet.getActiveSheet();
        const today = currentExcelDay();
        sheet.setCellValue('B2', today);
        sheet.setCellValue('C2', today - 1);
        sheet.setCellValue('D2', today - 6);

        const todayConditional = new Conditional();
        todayConditional.setConditionType(Conditional.CONDITION_TIMEPERIOD);
        todayConditional.setText(Conditional.TIMEPERIOD_TODAY);

        const yesterdayConditional = new Conditional();
        yesterdayConditional.setConditionType(Conditional.CONDITION_TIMEPERIOD);
        yesterdayConditional.setText(Conditional.TIMEPERIOD_YESTERDAY);

        const last7DaysConditional = new Conditional();
        last7DaysConditional.setConditionType(Conditional.CONDITION_TIMEPERIOD);
        last7DaysConditional.setText(Conditional.TIMEPERIOD_LAST_7_DAYS);

        expect(new CellMatcher(sheet.getCell('B2'), 'B2').evaluateConditional(todayConditional)).toBe(true);
        expect(new CellMatcher(sheet.getCell('C2'), 'C2').evaluateConditional(yesterdayConditional)).toBe(true);
        expect(new CellMatcher(sheet.getCell('D2'), 'D2').evaluateConditional(last7DaysConditional)).toBe(true);
    });

    it('should evaluate week and month time-period rules directly like PhpSpreadsheet runtime matching', () => {
        const spreadsheet = new Spreadsheet();
        const sheet = spreadsheet.getActiveSheet();
        const now = new Date();
        const startOfThisWeek = startOfWeekUtc(now);
        const thisWeek = excelDayFromUtcDate(startOfThisWeek);
        const lastWeek = excelDayFromUtcDate(
            new Date(
                Date.UTC(
                    startOfThisWeek.getUTCFullYear(),
                    startOfThisWeek.getUTCMonth(),
                    startOfThisWeek.getUTCDate() - 7,
                ),
            ),
        );
        const nextWeek = excelDayFromUtcDate(
            new Date(
                Date.UTC(
                    startOfThisWeek.getUTCFullYear(),
                    startOfThisWeek.getUTCMonth(),
                    startOfThisWeek.getUTCDate() + 7,
                ),
            ),
        );
        const thisMonth = excelDayFromUtcDate(new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1)));
        const lastMonth = excelDayFromUtcDate(new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 1, 1)));
        const nextMonth = excelDayFromUtcDate(new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1)));

        sheet.setCellValue('B2', thisWeek);
        sheet.setCellValue('C2', lastWeek);
        sheet.setCellValue('D2', nextWeek);
        sheet.setCellValue('E2', thisMonth);
        sheet.setCellValue('F2', lastMonth);
        sheet.setCellValue('G2', nextMonth);

        const thisWeekConditional = new Conditional();
        thisWeekConditional.setConditionType(Conditional.CONDITION_TIMEPERIOD);
        thisWeekConditional.setText(Conditional.TIMEPERIOD_THIS_WEEK);

        const lastWeekConditional = new Conditional();
        lastWeekConditional.setConditionType(Conditional.CONDITION_TIMEPERIOD);
        lastWeekConditional.setText(Conditional.TIMEPERIOD_LAST_WEEK);

        const nextWeekConditional = new Conditional();
        nextWeekConditional.setConditionType(Conditional.CONDITION_TIMEPERIOD);
        nextWeekConditional.setText(Conditional.TIMEPERIOD_NEXT_WEEK);

        const thisMonthConditional = new Conditional();
        thisMonthConditional.setConditionType(Conditional.CONDITION_TIMEPERIOD);
        thisMonthConditional.setText(Conditional.TIMEPERIOD_THIS_MONTH);

        const lastMonthConditional = new Conditional();
        lastMonthConditional.setConditionType(Conditional.CONDITION_TIMEPERIOD);
        lastMonthConditional.setText(Conditional.TIMEPERIOD_LAST_MONTH);

        const nextMonthConditional = new Conditional();
        nextMonthConditional.setConditionType(Conditional.CONDITION_TIMEPERIOD);
        nextMonthConditional.setText(Conditional.TIMEPERIOD_NEXT_MONTH);

        expect(new CellMatcher(sheet.getCell('B2'), 'B2').evaluateConditional(thisWeekConditional)).toBe(true);
        expect(new CellMatcher(sheet.getCell('C2'), 'C2').evaluateConditional(lastWeekConditional)).toBe(true);
        expect(new CellMatcher(sheet.getCell('D2'), 'D2').evaluateConditional(nextWeekConditional)).toBe(true);
        expect(new CellMatcher(sheet.getCell('E2'), 'E2').evaluateConditional(thisMonthConditional)).toBe(true);
        expect(new CellMatcher(sheet.getCell('F2'), 'F2').evaluateConditional(lastMonthConditional)).toBe(true);
        expect(new CellMatcher(sheet.getCell('G2'), 'G2').evaluateConditional(nextMonthConditional)).toBe(true);
    });

    it('should stop merging styles after a matching stopIfTrue rule', () => {
        const spreadsheet = new Spreadsheet();
        const sheet = spreadsheet.getActiveSheet();
        sheet.setCellValue('B2', 10);

        const first = new Conditional();
        first.setConditionType(Conditional.CONDITION_CELLIS);
        first.setOperatorType(Conditional.OPERATOR_EQUAL);
        first.setConditions([10]);
        first.setStopIfTrue(true);
        first.getStyle().getFont().setBold(true);

        const second = new Conditional();
        second.setConditionType(Conditional.CONDITION_CELLIS);
        second.setOperatorType(Conditional.OPERATOR_EQUAL);
        second.setConditions([10]);
        second.getStyle().getFont().setItalic(true);

        const assessor = new CellStyleAssessor(sheet.getCell('B2'), 'B2');
        const style = assessor.matchConditions([first, second]);

        expect(style.getFont().getBold()).toBe(true);
        expect(style.getFont().getItalic()).not.toBe(true);
    });

    it('should return null when no runtime conditional styles match', () => {
        const spreadsheet = new Spreadsheet();
        const sheet = spreadsheet.getActiveSheet();
        sheet.setCellValue('B2', 10);

        const conditional = new Conditional();
        conditional.setConditionType(Conditional.CONDITION_CELLIS);
        conditional.setOperatorType(Conditional.OPERATOR_GREATERTHAN);
        conditional.setConditions([20]);

        const assessor = new CellStyleAssessor(sheet.getCell('B2'), 'B2');

        expect(assessor.matchConditionsReturnNullIfNoneMatched([conditional], '10')).toBeNull();
    });

    it('should evaluate relative between comparisons numerically like PhpSpreadsheet', () => {
        const spreadsheet = new Spreadsheet();
        const sheet = spreadsheet.getActiveSheet();
        sheet.setCellValue('A1', 5);
        sheet.setCellValue('B1', 15);
        sheet.setCellValue('B2', 10);

        const conditional = new Conditional();
        conditional.setConditionType(Conditional.CONDITION_CELLIS);
        conditional.setOperatorType(Conditional.OPERATOR_BETWEEN);
        conditional.setConditions(['A1', 'B1']);

        const matcher = new CellMatcher(sheet.getCell('B2'), 'B2');

        expect(matcher.evaluateConditional(conditional)).toBe(true);
    });

    it('should merge later matching conditional styles when stopIfTrue is false', () => {
        const spreadsheet = new Spreadsheet();
        const sheet = spreadsheet.getActiveSheet();
        sheet.setCellValue('B2', 10);

        const first = new Conditional();
        first.setConditionType(Conditional.CONDITION_CELLIS);
        first.setOperatorType(Conditional.OPERATOR_EQUAL);
        first.setConditions([10]);
        first.getStyle().getFont().setBold(true);

        const second = new Conditional();
        second.setConditionType(Conditional.CONDITION_CELLIS);
        second.setOperatorType(Conditional.OPERATOR_EQUAL);
        second.setConditions([10]);
        second.getStyle().getFont().setItalic(true);

        const assessor = new CellStyleAssessor(sheet.getCell('B2'), 'B2');
        const style = assessor.matchConditions([first, second]);

        expect(style.getFont().getBold()).toBe(true);
        expect(style.getFont().getItalic()).toBe(true);
    });

    it('should use PHP-like truncation and multi-range values for color scales', () => {
        const spreadsheet = new Spreadsheet();
        const sheet = spreadsheet.getActiveSheet();
        sheet.setCellValue('B2', 1);
        sheet.setCellValue('B3', 3);
        sheet.setCellValue('D2', 7);
        sheet.setCellValue('D3', 9);

        const colorScale = new ConditionalColorScale()
            .setMinimumConditionalFormatValueObject(new ConditionalFormatValueObject('min'))
            .setMaximumConditionalFormatValueObject(new ConditionalFormatValueObject('max'))
            .setMinimumColor(new Color('FF000000'))
            .setMaximumColor(new Color('FFFFFFFF'))
            .setSqRef('B2:B3,D2:D3', sheet)
            .setScaleArray();

        expect(colorScale.getColorForValue(5)).toBe('FF7F7F7F');

        const conditional = new Conditional();
        conditional.setConditionType(Conditional.CONDITION_COLORSCALE);
        conditional.setColorScale(colorScale);

        const assessed = new CellStyleAssessor(sheet.getCell('D2'), 'B2:B3,D2:D3').matchConditions([conditional]);
        expect(assessed.getFill().getFillType()).toBe('solid');
        expect(assessed.getFill().getStartColor().getARGB()).toBe('FFBFBFBF');
    });

    it('should treat numeric strings as numeric for color-scale runtime matching', () => {
        const spreadsheet = new Spreadsheet();
        const sheet = spreadsheet.getActiveSheet();
        sheet.setCellValueExplicit('B2', '7');
        sheet.setCellValue('B3', 3);
        sheet.setCellValue('B4', 9);

        const colorScale = new ConditionalColorScale()
            .setMinimumConditionalFormatValueObject(new ConditionalFormatValueObject('min'))
            .setMaximumConditionalFormatValueObject(new ConditionalFormatValueObject('max'))
            .setMinimumColor(new Color('FF000000'))
            .setMaximumColor(new Color('FFFFFFFF'))
            .setSqRef('B2:B4', sheet)
            .setScaleArray();

        const conditional = new Conditional();
        conditional.setConditionType(Conditional.CONDITION_COLORSCALE);
        conditional.setColorScale(colorScale);

        expect(new CellMatcher(sheet.getCell('B2'), 'B2:B4').evaluateConditional(conditional)).toBe(true);

        const assessed = new CellStyleAssessor(sheet.getCell('B2'), 'B2:B4').matchConditions([conditional]);
        expect(assessed.getFill().getFillType()).toBe('solid');
        expect(assessed.getFill().getStartColor().getARGB()).toBe('FFA9A9A9');
    });

    it('should treat explicit numeric strings as numeric for cellIs comparisons', () => {
        const spreadsheet = new Spreadsheet();
        const sheet = spreadsheet.getActiveSheet();
        sheet.setCellValueExplicit('B2', '7');
        sheet.setCellValueExplicit('C2', '10');

        const equal = new Conditional();
        equal.setConditionType(Conditional.CONDITION_CELLIS);
        equal.setOperatorType(Conditional.OPERATOR_EQUAL);
        equal.setConditions([7]);

        const between = new Conditional();
        between.setConditionType(Conditional.CONDITION_CELLIS);
        between.setOperatorType(Conditional.OPERATOR_BETWEEN);
        between.setConditions([5, 15]);

        expect(new CellMatcher(sheet.getCell('B2'), 'B2').evaluateConditional(equal)).toBe(true);
        expect(new CellMatcher(sheet.getCell('C2'), 'C2').evaluateConditional(between)).toBe(true);
    });

    it('should match duplicate and unique rules with mixed numeric and numeric-string values', () => {
        const spreadsheet = new Spreadsheet();
        const duplicateSheet = spreadsheet.getActiveSheet();
        duplicateSheet.setCellValueExplicit('B2', '7');
        duplicateSheet.setCellValue('B3', 7);

        const duplicate = new Conditional();
        duplicate.setConditionType(Conditional.CONDITION_DUPLICATES);

        expect(new CellMatcher(duplicateSheet.getCell('B2'), 'B2:B3').evaluateConditional(duplicate)).toBe(true);
        expect(new CellMatcher(duplicateSheet.getCell('B3'), 'B2:B3').evaluateConditional(duplicate)).toBe(true);

        const uniqueSheet = spreadsheet.createSheet();
        uniqueSheet.setCellValueExplicit('B2', '7');
        uniqueSheet.setCellValue('B3', 8);

        const unique = new Conditional();
        unique.setConditionType(Conditional.CONDITION_UNIQUE);

        expect(new CellMatcher(uniqueSheet.getCell('B2'), 'B2:B3').evaluateConditional(unique)).toBe(true);
        expect(new CellMatcher(uniqueSheet.getCell('B3'), 'B2:B3').evaluateConditional(unique)).toBe(true);
    });

    it('should coerce mixed color-scale sqref values like PhpSpreadsheet instead of producing NaN', () => {
        const spreadsheet = new Spreadsheet();
        const sheet = spreadsheet.getActiveSheet();
        sheet.setCellValueExplicit('B2', '7');
        sheet.setCellValue('B3', 'text');
        sheet.setCellValue('B4', 9);

        const colorScale = new ConditionalColorScale()
            .setMinimumConditionalFormatValueObject(new ConditionalFormatValueObject('min'))
            .setMaximumConditionalFormatValueObject(new ConditionalFormatValueObject('max'))
            .setMinimumColor(new Color('FF000000'))
            .setMaximumColor(new Color('FFFFFFFF'))
            .setSqRef('B2:B4', sheet)
            .setScaleArray();

        expect(colorScale.getColorForValue(7)).toBe('FFC6C6C6');
        expect(colorScale.getColorForValue(9)).toBe('FFFFFFFF');
    });

    it('should return the base style when no conditional styles apply through getAppliedStyle', () => {
        const spreadsheet = new Spreadsheet();
        const sheet = spreadsheet.getActiveSheet();
        sheet.getCell('B2').getStyle().getFont().setBold(true);

        expect(sheet.getCell('B2').getAppliedStyle().getFont().getBold()).toBe(true);
    });

    it('should apply matching conditional styles through Cell.getAppliedStyle', () => {
        const spreadsheet = new Spreadsheet();
        const sheet = spreadsheet.getActiveSheet();
        sheet.setCellValue('B2', 10);

        const conditional = new Conditional();
        conditional.setConditionType(Conditional.CONDITION_CELLIS);
        conditional.setOperatorType(Conditional.OPERATOR_EQUAL);
        conditional.setConditions([10]);
        conditional.getStyle().getFont().setBold(true);

        sheet.setConditionalStyles('B2', [conditional]);

        expect(sheet.getCell('B2').getAppliedStyle().getFont().getBold()).toBe(true);
    });

    it('should apply numeric-string cellIs rules through Cell.getAppliedStyle', () => {
        const spreadsheet = new Spreadsheet();
        const sheet = spreadsheet.getActiveSheet();
        sheet.setCellValueExplicit('B2', '7');

        const conditional = new Conditional();
        conditional.setConditionType(Conditional.CONDITION_CELLIS);
        conditional.setOperatorType(Conditional.OPERATOR_EQUAL);
        conditional.setConditions([7]);
        conditional.getStyle().getFont().setBold(true);

        sheet.setConditionalStyles('B2', [conditional]);

        expect(sheet.getCell('B2').getAppliedStyle().getFont().getBold()).toBe(true);
    });

    it('should respect stopIfTrue when applying conditional styles through Cell.getAppliedStyle', () => {
        const spreadsheet = new Spreadsheet();
        const sheet = spreadsheet.getActiveSheet();
        sheet.setCellValue('B2', 10);

        const first = new Conditional();
        first.setConditionType(Conditional.CONDITION_CELLIS);
        first.setOperatorType(Conditional.OPERATOR_EQUAL);
        first.setConditions([10]);
        first.setStopIfTrue(true);
        first.getStyle().getFont().setBold(true);

        const second = new Conditional();
        second.setConditionType(Conditional.CONDITION_CELLIS);
        second.setOperatorType(Conditional.OPERATOR_EQUAL);
        second.setConditions([10]);
        second.getStyle().getFont().setItalic(true);

        sheet.setConditionalStyles('B2', [first, second]);

        const applied = sheet.getCell('B2').getAppliedStyle();
        expect(applied.getFont().getBold()).toBe(true);
        expect(applied.getFont().getItalic()).not.toBe(true);
    });

    it('should apply color-scale fills for numeric-string cells through Cell.getAppliedStyle', () => {
        const spreadsheet = new Spreadsheet();
        const sheet = spreadsheet.getActiveSheet();
        sheet.setCellValueExplicit('B2', '7');
        sheet.setCellValue('B3', 3);
        sheet.setCellValue('B4', 9);

        const colorScale = new ConditionalColorScale()
            .setMinimumConditionalFormatValueObject(new ConditionalFormatValueObject('min'))
            .setMaximumConditionalFormatValueObject(new ConditionalFormatValueObject('max'))
            .setMinimumColor(new Color('FF000000'))
            .setMaximumColor(new Color('FFFFFFFF'))
            .setSqRef('B2:B4', sheet)
            .setScaleArray();

        const conditional = new Conditional();
        conditional.setConditionType(Conditional.CONDITION_COLORSCALE);
        conditional.setColorScale(colorScale);

        sheet.setConditionalStyles('B2:B4', [conditional]);

        const applied = sheet.getCell('B2').getAppliedStyle();
        expect(applied.getFill().getFillType()).toBe('solid');
        expect(applied.getFill().getStartColor().getARGB()).toBe('FFA9A9A9');
    });

    it('should honor worksheet conditional range semantics through Cell.getAppliedStyle', () => {
        const spreadsheet = new Spreadsheet();
        const sheet = spreadsheet.getActiveSheet();
        sheet.setCellValue('A2', 2);
        sheet.setCellValue('B2', 2);

        const conditional = new Conditional();
        conditional.setConditionType(Conditional.CONDITION_CELLIS);
        conditional.setOperatorType(Conditional.OPERATOR_EQUAL);
        conditional.setConditions([2]);
        conditional.getStyle().getFont().setBold(true);

        sheet.setConditionalStyles('A1:C3 B1:B3', [conditional]);

        expect(sheet.getCell('A2').getAppliedStyle().getFont().getBold()).not.toBe(true);
        expect(sheet.getCell('B2').getAppliedStyle().getFont().getBold()).toBe(true);
    });
});
