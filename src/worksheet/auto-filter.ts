import { Worksheet } from '../core/worksheet.ts';
import { RichText } from '../rich-text/rich-text.ts';
import { Coordinate } from '../utils/coordinate.ts';
import { Column } from './auto-filter/column.ts';
import { Rule } from './auto-filter/column/rule.ts';

export class AutoFilter {
    #worksheet: Worksheet | null;
    #range: string;
    #columns: Map<string, Column> = new Map();
    #evaluated: boolean = false;

    constructor(range: string = '', worksheet: Worksheet | null = null) {
        if (range !== '') {
            const extracted = Worksheet.extractSheetTitle(range, true, true) as [string, string];
            this.#range = (extracted[1] ?? '').replace(/\$/g, '').toUpperCase();
        } else {
            this.#range = range;
        }
        this.#worksheet = worksheet;
    }

    public getEvaluated(): boolean {
        return this.#evaluated;
    }

    public setEvaluated(value: boolean): void {
        this.#evaluated = value;
    }

    public getParent(): Worksheet | null {
        return this.#worksheet;
    }

    public setParent(worksheet: Worksheet | null = null): this {
        this.#evaluated = false;
        this.#worksheet = worksheet;
        return this;
    }

    public setWorksheet(worksheet: Worksheet | null): this {
        return this.setParent(worksheet);
    }

    public getRange(): string {
        return this.#range;
    }

    public setRange(range: string | number[] = ''): this {
        this.#evaluated = false;

        if (range === '') {
            this.#columns.clear();
            this.#range = '';
            return this;
        }

        let rangeString = '';
        if (Array.isArray(range)) {
            if (range.length === 2) {
                rangeString = Coordinate.stringFromCoordinate(Number(range[0]), Number(range[1]));
            } else if (range.length === 4) {
                const start = Coordinate.stringFromCoordinate(Number(range[0]), Number(range[1]));
                const end = Coordinate.stringFromCoordinate(Number(range[2]), Number(range[3]));
                rangeString = `${start}:${end}`;
            } else {
                throw new Error('AutoFilter range array must have 2 or 4 entries.');
            }
        } else {
            rangeString = range;
        }

        const extracted = Worksheet.extractSheetTitle(rangeString, true, true) as [string, string];
        const normalized = (extracted[1] ?? '').replace(/\$/g, '').toUpperCase();
        if (/^[0-9]+$/.test(normalized) || /^[A-Z]+$/.test(normalized)) {
            throw new Error(`${rangeString} is an invalid range for AutoFilter`);
        }
        this.#range = normalized;

        // Discard any column rules that are no longer valid within this range
        const [rangeStart, rangeEnd] = Coordinate.rangeBoundaries(this.#range);
        for (const [key] of this.#columns) {
            const colIndex = Coordinate.columnIndexFromString(key);
            if (rangeStart![0]! > colIndex || rangeEnd![0]! < colIndex) {
                this.#columns.delete(key);
            }
        }

        return this;
    }

    public setRangeToMaxRow(): this {
        if (!this.#worksheet || this.#range === '') {
            return this;
        }
        const maxRow = this.#worksheet.getHighestRow();
        const updatedRange = this.#range.replace(/\d+$/, String(maxRow));
        if (updatedRange !== this.#range) {
            this.setRange(updatedRange);
        }
        return this;
    }

    public getColumns(): Map<string, Column> {
        return this.#columns;
    }

    public testColumnInRange(column: string): number {
        if (this.#range === '') {
            throw new Error('No autofilter range is defined.');
        }

        const columnIndex = Coordinate.columnIndexFromString(column);
        const [rangeStart, rangeEnd] = Coordinate.rangeBoundaries(this.#range);
        if (rangeStart![0]! > columnIndex || rangeEnd![0]! < columnIndex) {
            throw new Error('Column is outside of current autofilter range.');
        }

        return columnIndex - rangeStart![0]!;
    }

    public getColumnOffset(column: string): number {
        return this.testColumnInRange(column);
    }

    public getColumn(column: string): Column {
        column = column.toUpperCase();
        this.testColumnInRange(column);

        if (!this.#columns.has(column)) {
            this.#columns.set(column, new Column(column, this));
        }

        return this.#columns.get(column)!;
    }

    public getColumnByOffset(columnOffset: number): Column {
        const [rangeStart] = Coordinate.rangeBoundaries(this.#range);
        const pColumn = Coordinate.stringFromColumnIndex(rangeStart![0]! + columnOffset);

        return this.getColumn(pColumn);
    }

    public setColumn(columnObjectOrString: Column | string): this {
        this.#evaluated = false;
        let column: string;
        if (typeof columnObjectOrString === 'string') {
            column = columnObjectOrString.toUpperCase();
        } else {
            column = columnObjectOrString.getColumnIndex().toUpperCase();
        }

        this.testColumnInRange(column);

        if (typeof columnObjectOrString === 'string') {
            this.#columns.set(column, new Column(column, this));
        } else {
            columnObjectOrString.setParent(this);
            this.#columns.set(column, columnObjectOrString);
        }

        // Sort columns by index (A, B, C...)
        const sortedArray = Array.from(this.#columns.entries()).sort((a, b) => {
            const indexA = Coordinate.columnIndexFromString(a[0]);
            const indexB = Coordinate.columnIndexFromString(b[0]);
            return indexA - indexB;
        });
        this.#columns = new Map(sortedArray);

        return this;
    }

    public clearColumn(column: string): this {
        this.#evaluated = false;
        column = column.toUpperCase();
        this.testColumnInRange(column);

        this.#columns.delete(column);

        return this;
    }

    public shiftColumn(fromColumn: string, toColumn: string): this {
        this.#evaluated = false;
        fromColumn = fromColumn.toUpperCase();
        toColumn = toColumn.toUpperCase();

        const columnObj = this.#columns.get(fromColumn);
        if (columnObj) {
            columnObj.setParent(null);
            columnObj.setColumnIndex(toColumn);
            this.#columns.set(toColumn, columnObj);
            columnObj.setParent(this);
            this.#columns.delete(fromColumn);

            // Re-sort
            const sortedArray = Array.from(this.#columns.entries()).sort((a, b) => {
                const indexA = Coordinate.columnIndexFromString(a[0]);
                const indexB = Coordinate.columnIndexFromString(b[0]);
                return indexA - indexB;
            });
            this.#columns = new Map(sortedArray);
        }

        return this;
    }

    public clone(worksheet: Worksheet | null = null): AutoFilter {
        const cloned = new AutoFilter(this.#range, worksheet);
        cloned.setEvaluated(this.#evaluated);

        for (const [key, column] of this.#columns) {
            cloned.#columns.set(key, column.clone(cloned));
        }

        return cloned;
    }

    public toString(): string {
        return this.#range;
    }

    /**
     * Apply filters and hide rows.
     */
    public showHideRows(): void {
        if (this.#range === '' || this.#worksheet === null) {
            return;
        }

        if (this.#evaluated) {
            return;
        }

        const worksheet = this.#worksheet;
        let [[startColumn, startRow], [endColumn, endRow]] = Coordinate.rangeBoundaries(this.#range);
        endRow = this.#autoExtendRange(worksheet, startRow, endRow, startColumn, endColumn);
        this.#range = `${Coordinate.stringFromColumnIndex(startColumn)}${startRow}:${Coordinate.stringFromColumnIndex(endColumn)}${endRow}`;

        const headerDimension = worksheet.getRowDimension(startRow);
        headerDimension.setVisible(true);
        headerDimension.setVisibleAfterFilter(true);

        const columnTests = new Map<number, (value: unknown) => boolean>();
        for (const [columnId, column] of this.#columns.entries()) {
            const columnIndex = Coordinate.columnIndexFromString(columnId);
            if (columnIndex < startColumn || columnIndex > endColumn) {
                continue;
            }

            const test = this.#buildColumnTest(worksheet, column, columnIndex, startRow + 1, endRow);
            if (test) {
                columnTests.set(columnIndex, test);
            }
        }

        for (let row = startRow + 1; row <= endRow; row++) {
            let visible = true;
            for (const [columnIndex, test] of columnTests) {
                const coordinate = `${Coordinate.stringFromColumnIndex(columnIndex)}${row}`;
                const cell = worksheet.getCellCollection().get(coordinate);
                const value = cell ? cell.getCalculatedValue() : null;
                if (!test(value)) {
                    visible = false;
                    break;
                }
            }

            if (!visible) {
                const rowDimension = worksheet.getRowDimension(row);
                rowDimension.setVisible(false);
                rowDimension.setVisibleAfterFilter(false);
            } else if (worksheet.rowDimensionExists(row)) {
                const rowDimension = worksheet.getRowDimension(row);
                rowDimension.setVisible(true);
                rowDimension.setVisibleAfterFilter(true);
            }
        }

        this.setEvaluated(true);
    }

    #buildColumnTest(
        worksheet: Worksheet,
        column: Column,
        columnIndex: number,
        startRow: number,
        endRow: number,
    ): ((value: unknown) => boolean) | null {
        const filterType = column.getFilterType();
        const rules = column.getRules();

        if (filterType === Column.AUTOFILTER_FILTERTYPE_FILTER) {
            let ruleType: string | null = null;
            const ruleValues: unknown[] = [];
            for (const rule of rules) {
                ruleType = rule.getRuleType();
                ruleValues.push(rule.getValue());
            }

            const ruleDataSet = ruleValues.filter((value) => value);
            const blanks = ruleValues.length !== ruleDataSet.length;

            if (ruleType === Rule.AUTOFILTER_RULETYPE_FILTER) {
                return (value: unknown): boolean =>
                    AutoFilter.#filterTestInSimpleDataSet(value, {
                        filterValues: ruleDataSet.map((v) => String(v)),
                        blanks,
                    });
            }
            if (ruleType) {
                const argumentsSet = {
                    date: [] as string[],
                    time: [] as string[],
                    dateTime: [] as string[],
                };
                for (const ruleValue of ruleDataSet) {
                    if (typeof ruleValue !== 'object' || ruleValue === null) {
                        continue;
                    }
                    const value = ruleValue as Record<string, number>;
                    const year = value.year ? String(value.year).padStart(4, '0') : '';
                    const month = value.month ? String(value.month).padStart(2, '0') : '';
                    const day = value.day ? String(value.day).padStart(2, '0') : '';
                    const hour = value.hour ? String(value.hour).padStart(2, '0') : '';
                    const minute = value.minute ? String(value.minute).padStart(2, '0') : '';
                    const second = value.second ? String(value.second).padStart(2, '0') : '';
                    const date = `${year}${month}${day}`;
                    const time = `${hour}${minute}${second}`;
                    const dateTime = `${date}${time}`;
                    if (date !== '') argumentsSet.date.push(date);
                    if (time !== '') argumentsSet.time.push(time);
                    if (dateTime !== '') argumentsSet.dateTime.push(dateTime);
                }
                argumentsSet.date = argumentsSet.date.filter(Boolean);
                argumentsSet.time = argumentsSet.time.filter(Boolean);
                argumentsSet.dateTime = argumentsSet.dateTime.filter(Boolean);
                return (value: unknown): boolean =>
                    AutoFilter.#filterTestInDateGroupSet(value, {
                        filterValues: argumentsSet,
                        blanks,
                    });
            }
        }

        if (filterType === Column.AUTOFILTER_FILTERTYPE_CUSTOMFILTER) {
            const ruleValues: { operator: string; value: string | number }[] = [];
            let customRuleForBlanks = true;
            for (const rule of rules) {
                let ruleValue = rule.getValue();
                if (!Array.isArray(ruleValue) && typeof ruleValue !== 'number') {
                    const wildcard = this.#wildcardToRegex(String(ruleValue));
                    if (wildcard.trim() === '') {
                        customRuleForBlanks = true;
                    }
                    ruleValue = wildcard.trim();
                }
                ruleValues.push({ operator: rule.getOperator(), value: ruleValue as string | number });
            }
            const join = column.getJoin();
            return (value: unknown): boolean =>
                AutoFilter.#filterTestInCustomDataSet(value, {
                    filterRules: ruleValues,
                    join,
                    customRuleForBlanks,
                });
        }

        if (filterType === Column.AUTOFILTER_FILTERTYPE_DYNAMICFILTER) {
            const rule = rules[0];
            if (!rule) {
                return null;
            }

            const grouping = rule.getGrouping();
            if (
                grouping === Rule.AUTOFILTER_RULETYPE_DYNAMIC_ABOVEAVERAGE ||
                grouping === Rule.AUTOFILTER_RULETYPE_DYNAMIC_BELOWAVERAGE
            ) {
                const averageFormula = `=AVERAGE(${Coordinate.stringFromColumnIndex(columnIndex)}${startRow}:${Coordinate.stringFromColumnIndex(columnIndex)}${endRow})`;
                const calculation = worksheet.getParent()?.getCalculationEngine();
                let average = calculation?.calculateFormula(averageFormula, worksheet) ?? null;
                while (Array.isArray(average)) {
                    average = average.pop();
                }
                const operator =
                    grouping === Rule.AUTOFILTER_RULETYPE_DYNAMIC_ABOVEAVERAGE
                        ? Rule.AUTOFILTER_COLUMN_RULE_GREATERTHAN
                        : Rule.AUTOFILTER_COLUMN_RULE_LESSTHAN;
                return (value: unknown): boolean =>
                    AutoFilter.#filterTestInCustomDataSet(value, {
                        filterRules: [{ operator, value: Number(average) }],
                        join: Column.AUTOFILTER_COLUMN_JOIN_OR,
                    });
            }

            const periodMonths = this.#periodMonthsForGrouping(grouping);
            if (periodMonths !== null) {
                return (value: unknown): boolean => AutoFilter.#filterTestInPeriodDateSet(value, [...periodMonths]);
            }

            const rangeRule = this.#dynamicFilterDateRange(grouping, column);
            return (value: unknown): boolean => AutoFilter.#filterTestInCustomDataSet(value, rangeRule.arguments);
        }

        if (filterType === Column.AUTOFILTER_FILTERTYPE_TOPTENFILTER) {
            const rule = rules[0];
            if (!rule) {
                return null;
            }
            const dataRowCount = endRow - startRow + 1;
            let ruleValue = rule.getValue();
            const ruleOperator = rule.getOperator();
            const ruleType = rule.getGrouping();
            if (typeof ruleValue === 'number' && ruleOperator === Rule.AUTOFILTER_COLUMN_RULE_TOPTEN_PERCENT) {
                ruleValue = Math.floor(ruleValue * (dataRowCount / 100));
            }
            if (!Array.isArray(ruleValue) && Number(ruleValue) < 1) {
                ruleValue = 1;
            }
            if (!Array.isArray(ruleValue) && Number(ruleValue) > 500) {
                ruleValue = 500;
            }
            const maxVal = this.#calculateTopTenValue(
                Coordinate.stringFromColumnIndex(columnIndex),
                startRow + 1,
                endRow,
                ruleType,
                ruleValue,
            );
            if (maxVal === null || Number.isNaN(Number(maxVal))) {
                return () => false;
            }
            const operator =
                ruleType === Rule.AUTOFILTER_COLUMN_RULE_TOPTEN_TOP
                    ? Rule.AUTOFILTER_COLUMN_RULE_GREATERTHANOREQUAL
                    : Rule.AUTOFILTER_COLUMN_RULE_LESSTHANOREQUAL;
            column.setAttribute('maxVal', maxVal);
            return (value: unknown): boolean =>
                AutoFilter.#filterTestInCustomDataSet(value, {
                    filterRules: [{ operator, value: maxVal }],
                    join: Column.AUTOFILTER_COLUMN_JOIN_OR,
                });
        }

        return null;
    }

    #autoExtendRange(
        worksheet: Worksheet,
        startRow: number,
        endRow: number,
        startColumn: number,
        endColumn: number,
    ): number {
        if (startRow !== endRow) {
            return endRow;
        }
        const highestRow = worksheet.getHighestRow();
        for (let row = startRow + 1; row <= highestRow; row++) {
            if (this.#rowIsEmpty(worksheet, row, startColumn, endColumn)) {
                return row - 1;
            }
        }
        return highestRow;
    }

    #collectNumericValues(worksheet: Worksheet, columnIndex: number, startRow: number, endRow: number): number[] {
        const values: number[] = [];
        for (let row = startRow; row <= endRow; row++) {
            const coordinate = `${Coordinate.stringFromColumnIndex(columnIndex)}${row}`;
            const cell = worksheet.getCellCollection().get(coordinate);
            if (!cell) {
                continue;
            }
            const numericValue = this.#numericValue(cell.getCalculatedValue());
            if (numericValue !== null) {
                values.push(numericValue);
            }
        }
        return values;
    }

    #matchesCustomRule(value: unknown, rule: Rule): boolean {
        return this.#matchesCustomRuleValue(value, rule.getOperator(), rule.getValue());
    }

    #matchesCustomRuleValue(value: unknown, operator: string, ruleValue: unknown): boolean {
        if (this.#isEmpty(value)) {
            return this.#isEmpty(ruleValue);
        }

        if (typeof ruleValue === 'string' && this.#containsWildcard(ruleValue)) {
            const candidate = this.#stringValue(value);
            return this.#matchWildcard(candidate, ruleValue);
        }

        const numericValue = this.#numericValue(value);
        const numericRule = this.#numericValue(ruleValue);
        if (numericValue !== null && numericRule !== null) {
            return this.#compare(operator, numericValue, numericRule);
        }

        return this.#compare(operator, this.#stringValue(value), this.#stringValue(ruleValue));
    }

    #compare(operator: string, value: string | number, ruleValue: string | number): boolean {
        const comparison =
            typeof value === 'number' && typeof ruleValue === 'number'
                ? value - ruleValue
                : this.#compareStrings(String(value), String(ruleValue));

        switch (operator) {
            case Rule.AUTOFILTER_COLUMN_RULE_NOTEQUAL:
                return comparison !== 0;
            case Rule.AUTOFILTER_COLUMN_RULE_GREATERTHAN:
                return comparison > 0;
            case Rule.AUTOFILTER_COLUMN_RULE_GREATERTHANOREQUAL:
                return comparison >= 0;
            case Rule.AUTOFILTER_COLUMN_RULE_LESSTHAN:
                return comparison < 0;
            case Rule.AUTOFILTER_COLUMN_RULE_LESSTHANOREQUAL:
                return comparison <= 0;
            case Rule.AUTOFILTER_COLUMN_RULE_EQUAL:
            default:
                return comparison === 0;
        }
    }

    #collectDateGroupValues(rule: Rule, dateSet: Set<string>, timeSet: Set<string>, dateTimeSet: Set<string>): void {
        const value = rule.getValue() as Record<string, number>;
        const grouping = rule.getGrouping();

        const year = value.year ? String(value.year).padStart(4, '0') : '';
        const month = value.month ? String(value.month).padStart(2, '0') : '';
        const day = value.day ? String(value.day).padStart(2, '0') : '';
        const hour = value.hour ? String(value.hour).padStart(2, '0') : '';
        const minute = value.minute ? String(value.minute).padStart(2, '0') : '';
        const second = value.second ? String(value.second).padStart(2, '0') : '';

        const hasDate = year !== '' || month !== '' || day !== '';
        const hasTime = hour !== '' || minute !== '' || second !== '';

        if (hasDate && hasTime) {
            const base = `${year}${month}${day}${hour}${minute}${second}`;
            dateTimeSet.add(base.substring(0, this.#dateGroupPrefixLength(grouping)));
        } else if (hasDate) {
            const base = `${year}${month}${day}`;
            dateSet.add(base.substring(0, this.#dateGroupPrefixLength(grouping)));
        } else if (hasTime) {
            const base = `${hour}${minute}${second}`;
            timeSet.add(base.substring(0, this.#timeGroupPrefixLength(grouping)));
        }
    }

    #matchesDateGroup(value: unknown, dateSet: Set<string>, timeSet: Set<string>, dateTimeSet: Set<string>): boolean {
        const numericValue = this.#excelDateValue(value);
        if (numericValue === null) {
            return false;
        }

        const date = this.#excelDateToJsDate(numericValue);
        const dateString = `${date.getUTCFullYear().toString().padStart(4, '0')}${String(date.getUTCMonth() + 1).padStart(2, '0')}${String(date.getUTCDate()).padStart(2, '0')}`;
        const timeString = `${String(date.getUTCHours()).padStart(2, '0')}${String(date.getUTCMinutes()).padStart(2, '0')}${String(date.getUTCSeconds()).padStart(2, '0')}`;
        const dateTimeString = `${dateString}${timeString}`;

        for (const prefix of dateTimeSet) {
            if (dateTimeString.startsWith(prefix)) {
                return true;
            }
        }
        for (const prefix of dateSet) {
            if (dateString.startsWith(prefix)) {
                return true;
            }
        }
        for (const prefix of timeSet) {
            if (timeString.startsWith(prefix)) {
                return true;
            }
        }
        return false;
    }

    #periodMonthsForGrouping(grouping: string): Set<number> | null {
        if (grouping.startsWith('M')) {
            const month = Number(grouping.substring(1));
            if (Number.isFinite(month) && month >= 1 && month <= 12) {
                return new Set([month]);
            }
        }

        if (grouping.startsWith('Q')) {
            const quarter = Number(grouping.substring(1));
            if (Number.isFinite(quarter) && quarter >= 1 && quarter <= 4) {
                const startMonth = (quarter - 1) * 3 + 1;
                return new Set([startMonth, startMonth + 1, startMonth + 2]);
            }
        }

        return null;
    }

    #dynamicDateRange(grouping: string): { start: number; end: number } | null {
        const now = new Date();
        const today = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));

        const addDays = (date: Date, days: number): Date => {
            const next = new Date(date.getTime());
            next.setUTCDate(next.getUTCDate() + days);
            return next;
        };

        const startOfWeek = (date: Date): Date => {
            const weekday = date.getUTCDay();
            return addDays(date, -weekday);
        };

        const startOfMonth = (date: Date): Date => new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), 1));
        const startOfQuarter = (date: Date): Date => {
            const quarterStartMonth = Math.floor(date.getUTCMonth() / 3) * 3;
            return new Date(Date.UTC(date.getUTCFullYear(), quarterStartMonth, 1));
        };

        const startOfYear = (date: Date): Date => new Date(Date.UTC(date.getUTCFullYear(), 0, 1));

        let start: Date | null = null;
        let end: Date | null = null;

        switch (grouping) {
            case Rule.AUTOFILTER_RULETYPE_DYNAMIC_YESTERDAY:
                start = addDays(today, -1);
                end = today;
                break;
            case Rule.AUTOFILTER_RULETYPE_DYNAMIC_TODAY:
                start = today;
                end = addDays(today, 1);
                break;
            case Rule.AUTOFILTER_RULETYPE_DYNAMIC_TOMORROW:
                start = addDays(today, 1);
                end = addDays(today, 2);
                break;
            case Rule.AUTOFILTER_RULETYPE_DYNAMIC_THISWEEK:
                start = startOfWeek(today);
                end = addDays(start, 7);
                break;
            case Rule.AUTOFILTER_RULETYPE_DYNAMIC_LASTWEEK:
                end = startOfWeek(today);
                start = addDays(end, -7);
                break;
            case Rule.AUTOFILTER_RULETYPE_DYNAMIC_NEXTWEEK:
                start = addDays(startOfWeek(today), 7);
                end = addDays(start, 7);
                break;
            case Rule.AUTOFILTER_RULETYPE_DYNAMIC_THISMONTH:
                start = startOfMonth(today);
                end = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth() + 1, 1));
                break;
            case Rule.AUTOFILTER_RULETYPE_DYNAMIC_LASTMONTH:
                end = startOfMonth(today);
                start = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth() - 1, 1));
                break;
            case Rule.AUTOFILTER_RULETYPE_DYNAMIC_NEXTMONTH:
                start = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth() + 1, 1));
                end = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth() + 2, 1));
                break;
            case Rule.AUTOFILTER_RULETYPE_DYNAMIC_THISQUARTER:
                start = startOfQuarter(today);
                end = new Date(Date.UTC(start.getUTCFullYear(), start.getUTCMonth() + 3, 1));
                break;
            case Rule.AUTOFILTER_RULETYPE_DYNAMIC_LASTQUARTER: {
                const currentQuarterStart = startOfQuarter(today);
                start = new Date(
                    Date.UTC(currentQuarterStart.getUTCFullYear(), currentQuarterStart.getUTCMonth() - 3, 1),
                );
                end = currentQuarterStart;
                break;
            }
            case Rule.AUTOFILTER_RULETYPE_DYNAMIC_NEXTQUARTER: {
                const nextQuarterStart = new Date(
                    Date.UTC(startOfQuarter(today).getUTCFullYear(), startOfQuarter(today).getUTCMonth() + 3, 1),
                );
                start = nextQuarterStart;
                end = new Date(Date.UTC(nextQuarterStart.getUTCFullYear(), nextQuarterStart.getUTCMonth() + 3, 1));
                break;
            }
            case Rule.AUTOFILTER_RULETYPE_DYNAMIC_THISYEAR:
                start = startOfYear(today);
                end = new Date(Date.UTC(today.getUTCFullYear() + 1, 0, 1));
                break;
            case Rule.AUTOFILTER_RULETYPE_DYNAMIC_LASTYEAR:
                start = new Date(Date.UTC(today.getUTCFullYear() - 1, 0, 1));
                end = startOfYear(today);
                break;
            case Rule.AUTOFILTER_RULETYPE_DYNAMIC_NEXTYEAR:
                start = new Date(Date.UTC(today.getUTCFullYear() + 1, 0, 1));
                end = new Date(Date.UTC(today.getUTCFullYear() + 2, 0, 1));
                break;
            case Rule.AUTOFILTER_RULETYPE_DYNAMIC_YEARTODATE:
                start = startOfYear(today);
                end = addDays(today, 1);
                break;
            default:
                return null;
        }

        if (!start || !end) {
            return null;
        }

        return {
            start: this.#dateToExcelValue(start),
            end: this.#dateToExcelValue(end),
        };
    }

    #dateGroupPrefixLength(grouping: string): number {
        switch (grouping) {
            case Rule.AUTOFILTER_RULETYPE_DATEGROUP_YEAR:
                return 4;
            case Rule.AUTOFILTER_RULETYPE_DATEGROUP_MONTH:
                return 6;
            case Rule.AUTOFILTER_RULETYPE_DATEGROUP_DAY:
                return 8;
            case Rule.AUTOFILTER_RULETYPE_DATEGROUP_HOUR:
                return 10;
            case Rule.AUTOFILTER_RULETYPE_DATEGROUP_MINUTE:
                return 12;
            case Rule.AUTOFILTER_RULETYPE_DATEGROUP_SECOND:
                return 14;
            default:
                return 14;
        }
    }

    #timeGroupPrefixLength(grouping: string): number {
        switch (grouping) {
            case Rule.AUTOFILTER_RULETYPE_DATEGROUP_HOUR:
                return 2;
            case Rule.AUTOFILTER_RULETYPE_DATEGROUP_MINUTE:
                return 4;
            case Rule.AUTOFILTER_RULETYPE_DATEGROUP_SECOND:
                return 6;
            default:
                return 6;
        }
    }

    #isEmpty(value: unknown): boolean {
        return value === null || value === undefined || value === '';
    }

    #stringValue(value: unknown): string {
        if (value instanceof RichText) {
            return value.getPlainText();
        }
        return String(value ?? '');
    }

    #numericValue(value: unknown): number | null {
        if (typeof value === 'number' && !Number.isNaN(value)) {
            return value;
        }
        if (typeof value === 'string') {
            const numericValue = Number(value);
            if (!Number.isNaN(numericValue)) {
                return numericValue;
            }
        }
        return null;
    }

    #excelDateValue(value: unknown): number | null {
        const numericValue = this.#numericValue(value);
        if (numericValue !== null) {
            return numericValue;
        }
        if (value instanceof Date) {
            return this.#dateToExcelValue(value);
        }
        if (typeof value === 'string') {
            const parsed = new Date(value);
            if (!Number.isNaN(parsed.getTime())) {
                return this.#dateToExcelValue(parsed);
            }
        }
        return null;
    }

    #excelDateToJsDate(serial: number): Date {
        const base = Date.UTC(1899, 11, 30);
        const adjustedSerial = serial >= 60 ? serial - 1 : serial;
        return new Date(base + adjustedSerial * 86400000);
    }

    #dateToExcelValue(date: Date): number {
        const base = Date.UTC(1899, 11, 30);
        const serial = (date.getTime() - base) / 86400000;
        return serial >= 60 ? serial + 1 : serial;
    }

    #containsWildcard(value: string): boolean {
        return /[\*\?]/.test(value);
    }

    #matchWildcard(value: string, pattern: string): boolean {
        const regexPattern = pattern
            .replace(/([.+^${}()|[\]\\])/g, '\\$1')
            .replace(/~([*?~])/g, '$1')
            .replace(/\*/g, '.*')
            .replace(/\?/g, '.');
        const regex = new RegExp(`^${regexPattern}$`, 'i');
        return regex.test(value);
    }

    #wildcardToRegex(value: string): string {
        return value
            .replace(/([.+^${}()|[\]\\])/g, '\\$1')
            .replace(/~([*?~])/g, '$1')
            .replace(/\*/g, '.*')
            .replace(/\?/g, '.');
    }

    #compareStrings(value: string, ruleValue: string): number {
        return value.localeCompare(ruleValue, undefined, { sensitivity: 'accent' });
    }

    static #filterTestInSimpleDataSet(
        cellValue: unknown,
        dataSet: { blanks: boolean; filterValues: string[] },
    ): boolean {
        if (cellValue === '' || cellValue === null || cellValue === undefined) {
            return dataSet.blanks;
        }
        return dataSet.filterValues.includes(String(cellValue));
    }

    static #filterTestInDateGroupSet(
        cellValue: unknown,
        dataSet: { blanks: boolean; filterValues: { date: string[]; time: string[]; dateTime: string[] } },
    ): boolean {
        if (cellValue === '' || cellValue === null || cellValue === undefined) {
            return dataSet.blanks;
        }
        const numericValue = typeof cellValue === 'number' ? cellValue : Number(cellValue);
        if (!Number.isFinite(numericValue)) {
            return false;
        }
        const date = AutoFilter.#excelDateToJsDateStatic(numericValue);
        let dtVal = '';
        let dateSet = dataSet.filterValues.dateTime;
        if (numericValue < 1) {
            dtVal = `${String(date.getUTCHours()).padStart(2, '0')}${String(date.getUTCMinutes()).padStart(2, '0')}${String(
                date.getUTCSeconds(),
            ).padStart(2, '0')}`;
            dateSet = dataSet.filterValues.time;
        } else if (numericValue === Math.floor(numericValue)) {
            dtVal = `${date.getUTCFullYear().toString().padStart(4, '0')}${String(date.getUTCMonth() + 1).padStart(2, '0')}${String(
                date.getUTCDate(),
            ).padStart(2, '0')}`;
            dateSet = dataSet.filterValues.date;
        } else {
            dtVal = `${date.getUTCFullYear().toString().padStart(4, '0')}${String(date.getUTCMonth() + 1).padStart(2, '0')}${String(
                date.getUTCDate(),
            ).padStart(
                2,
                '0',
            )}${String(date.getUTCHours()).padStart(2, '0')}${String(date.getUTCMinutes()).padStart(2, '0')}${String(
                date.getUTCSeconds(),
            ).padStart(2, '0')}`;
            dateSet = dataSet.filterValues.dateTime;
        }
        return dateSet.some((dateValue) => dtVal.startsWith(dateValue));
    }

    static #filterTestInCustomDataSet(
        cellValue: unknown,
        ruleSet: {
            filterRules: { operator: string; value: string | number }[];
            join: string;
            customRuleForBlanks?: boolean;
        },
    ): boolean {
        if (!ruleSet.customRuleForBlanks) {
            if (cellValue === '' || cellValue === null || cellValue === undefined) {
                return false;
            }
        }
        let returnVal = ruleSet.join === Column.AUTOFILTER_COLUMN_JOIN_AND;
        for (const rule of ruleSet.filterRules) {
            const ruleValue = rule.value;
            const operator = rule.operator;
            let retVal = false;
            if (typeof ruleValue === 'number' || (typeof ruleValue === 'string' && !Number.isNaN(Number(ruleValue)))) {
                const numericTest = typeof cellValue === 'number' || !Number.isNaN(Number(cellValue));
                const numericCell = Number(cellValue);
                const numericRule = Number(ruleValue);
                switch (operator) {
                    case Rule.AUTOFILTER_COLUMN_RULE_EQUAL:
                        retVal = numericTest && numericCell === numericRule;
                        break;
                    case Rule.AUTOFILTER_COLUMN_RULE_NOTEQUAL:
                        retVal = !numericTest || numericCell !== numericRule;
                        break;
                    case Rule.AUTOFILTER_COLUMN_RULE_GREATERTHAN:
                        retVal = numericTest && numericCell > numericRule;
                        break;
                    case Rule.AUTOFILTER_COLUMN_RULE_GREATERTHANOREQUAL:
                        retVal = numericTest && numericCell >= numericRule;
                        break;
                    case Rule.AUTOFILTER_COLUMN_RULE_LESSTHAN:
                        retVal = numericTest && numericCell < numericRule;
                        break;
                    case Rule.AUTOFILTER_COLUMN_RULE_LESSTHANOREQUAL:
                        retVal = numericTest && numericCell <= numericRule;
                        break;
                }
            } else if (ruleValue === '') {
                retVal =
                    operator === Rule.AUTOFILTER_COLUMN_RULE_EQUAL
                        ? cellValue === '' || cellValue === null || cellValue === undefined
                        : operator === Rule.AUTOFILTER_COLUMN_RULE_NOTEQUAL
                          ? cellValue !== ''
                          : true;
            } else {
                const cellValueString = String(cellValue ?? '');
                const regex = new RegExp(`^${ruleValue}$`, 'i');
                switch (operator) {
                    case Rule.AUTOFILTER_COLUMN_RULE_EQUAL:
                        retVal = regex.test(cellValueString);
                        break;
                    case Rule.AUTOFILTER_COLUMN_RULE_NOTEQUAL:
                        retVal = !regex.test(cellValueString);
                        break;
                    case Rule.AUTOFILTER_COLUMN_RULE_GREATERTHAN:
                        retVal =
                            cellValueString.localeCompare(String(ruleValue), undefined, { sensitivity: 'accent' }) > 0;
                        break;
                    case Rule.AUTOFILTER_COLUMN_RULE_GREATERTHANOREQUAL:
                        retVal =
                            cellValueString.localeCompare(String(ruleValue), undefined, { sensitivity: 'accent' }) >= 0;
                        break;
                    case Rule.AUTOFILTER_COLUMN_RULE_LESSTHAN:
                        retVal =
                            cellValueString.localeCompare(String(ruleValue), undefined, { sensitivity: 'accent' }) < 0;
                        break;
                    case Rule.AUTOFILTER_COLUMN_RULE_LESSTHANOREQUAL:
                        retVal =
                            cellValueString.localeCompare(String(ruleValue), undefined, { sensitivity: 'accent' }) <= 0;
                        break;
                }
            }
            if (ruleSet.join === Column.AUTOFILTER_COLUMN_JOIN_OR) {
                returnVal = returnVal || retVal;
                if (returnVal) {
                    return returnVal;
                }
            } else {
                returnVal = returnVal && retVal;
            }
        }
        return returnVal;
    }

    static #filterTestInPeriodDateSet(cellValue: unknown, monthSet: number[]): boolean {
        if (cellValue === '' || cellValue === null || cellValue === undefined) {
            return false;
        }
        if (typeof cellValue === 'number') {
            const dateObject = AutoFilter.#excelDateToJsDateStatic(cellValue);
            const dateValue = dateObject.getUTCMonth() + 1;
            return monthSet.includes(dateValue);
        }
        return false;
    }

    #dynamicFilterDateRange(
        grouping: string,
        column: Column,
    ): {
        method: 'filterTestInCustomDataSet';
        arguments: { filterRules: { operator: string; value: number }[]; join: string };
    } {
        const range = this.#dynamicDateRange(grouping);
        if (!range) {
            return {
                method: 'filterTestInCustomDataSet',
                arguments: { filterRules: [], join: Column.AUTOFILTER_COLUMN_JOIN_AND },
            };
        }
        column.setAttributes({ val: range.start, maxVal: range.end });
        const ruleValues = [
            { operator: Rule.AUTOFILTER_COLUMN_RULE_GREATERTHANOREQUAL, value: range.start },
            { operator: Rule.AUTOFILTER_COLUMN_RULE_LESSTHAN, value: range.end },
        ];
        return {
            method: 'filterTestInCustomDataSet',
            arguments: { filterRules: ruleValues, join: Column.AUTOFILTER_COLUMN_JOIN_AND },
        };
    }

    #calculateTopTenValue(
        columnId: string,
        startRow: number,
        endRow: number,
        ruleType: string | null,
        ruleValue: unknown,
    ): number | null {
        if (!this.#worksheet) {
            return null;
        }
        const range = `${columnId}${startRow}:${columnId}${endRow}`;
        const dataValues = this.#worksheet
            .rangeToArray(range, null, true, false)
            .flat()
            .filter((value: unknown) => value !== null && value !== '');
        if (ruleType === Rule.AUTOFILTER_COLUMN_RULE_TOPTEN_TOP) {
            dataValues.sort((a: unknown, b: unknown) => Number(b) - Number(a));
        } else {
            dataValues.sort((a: unknown, b: unknown) => Number(a) - Number(b));
        }
        const numericRule = typeof ruleValue === 'number' ? ruleValue : Number(ruleValue);
        if (!Number.isFinite(numericRule)) {
            return null;
        }
        const slice = dataValues.slice(0, numericRule);
        const retVal = slice.pop();
        return typeof retVal === 'number' ? retVal : Number(retVal);
    }

    #rowIsEmpty(worksheet: Worksheet, row: number, startColumn: number, endColumn: number): boolean {
        for (let col = startColumn; col <= endColumn; col++) {
            const coordinate = `${Coordinate.stringFromColumnIndex(col)}${row}`;
            const cell = worksheet.getCellCollection().get(coordinate);
            const value = cell ? cell.getValue() : null;
            if (!(value === null || value === '')) {
                return false;
            }
        }
        return true;
    }

    static #excelDateToJsDateStatic(serial: number): Date {
        const base = Date.UTC(1899, 11, 30);
        const adjustedSerial = serial >= 60 ? serial - 1 : serial;
        return new Date(base + adjustedSerial * 86400000);
    }
}
