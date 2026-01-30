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
        this.#range = range;
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

    public getRange(): string {
        return this.#range;
    }

    public setRange(range: string = ''): this {
        this.#evaluated = false;

        if (range === '') {
            this.#columns.clear();
            this.#range = '';
            return this;
        }

        // Basic validation: must contain ':'
        if (!range.includes(':')) {
            throw new Error(`${range} is an invalid range for AutoFilter`);
        }

        this.#range = range.toUpperCase();

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
        let [[startColumn, startRow], [endColumn, endRow]] = Coordinate.rangeBoundaries(
            this.#range,
        );

        if (startRow === endRow) {
            endRow = this.#autoExtendRange(worksheet, startRow, startColumn, endColumn);
            this.#range = `${Coordinate.stringFromColumnIndex(startColumn)}${startRow}:${Coordinate.stringFromColumnIndex(endColumn)}${endRow}`;
        }

        const headerDimension = worksheet.getRowDimension(startRow);
        headerDimension.setVisible(true);
        headerDimension.setVisibleAfterFilter(true);

        const columnTests = new Map<number, (value: unknown) => boolean>();
        for (const [columnId, column] of this.#columns.entries()) {
            const columnIndex = Coordinate.columnIndexFromString(columnId);
            if (columnIndex < startColumn || columnIndex > endColumn) {
                continue;
            }

            const test = this.#buildColumnTest(
                worksheet,
                column,
                columnIndex,
                startRow + 1,
                endRow,
            );
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
            const filterValues = new Set<string>();
            const dateTimeSet = new Set<string>();
            const dateSet = new Set<string>();
            const timeSet = new Set<string>();

            for (const rule of rules) {
                if (rule.getRuleType() === Rule.AUTOFILTER_RULETYPE_FILTER) {
                    filterValues.add(String(rule.getValue()));
                } else if (rule.getRuleType() === Rule.AUTOFILTER_RULETYPE_DATEGROUP) {
                    this.#collectDateGroupValues(rule, dateSet, timeSet, dateTimeSet);
                }
            }

            const allowBlanks = Boolean(column.getAttribute('blank'));

            return (value: unknown): boolean => {
                if (this.#isEmpty(value)) {
                    return allowBlanks;
                }

                if (dateSet.size > 0 || timeSet.size > 0 || dateTimeSet.size > 0) {
                    return this.#matchesDateGroup(value, dateSet, timeSet, dateTimeSet);
                }

                if (filterValues.size === 0) {
                    return true;
                }

                const candidate = this.#stringValue(value);
                return filterValues.has(candidate);
            };
        }

        if (filterType === Column.AUTOFILTER_FILTERTYPE_CUSTOMFILTER) {
            const joinAnd = column.getJoin() === Column.AUTOFILTER_COLUMN_JOIN_AND;
            return (value: unknown): boolean => {
                if (rules.length === 0) {
                    return true;
                }

                const results = rules.map((rule) => this.#matchesCustomRule(value, rule));
                return joinAnd ? results.every(Boolean) : results.some(Boolean);
            };
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
                const values = this.#collectNumericValues(worksheet, columnIndex, startRow, endRow);
                if (values.length === 0) {
                    return () => false;
                }
                const average = values.reduce((sum, val) => sum + val, 0) / values.length;
                return (value: unknown): boolean => {
                    const numericValue = this.#numericValue(value);
                    if (numericValue === null) {
                        return false;
                    }
                    return grouping === Rule.AUTOFILTER_RULETYPE_DYNAMIC_ABOVEAVERAGE
                        ? numericValue > average
                        : numericValue < average;
                };
            }

            const periodMonths = this.#periodMonthsForGrouping(grouping);
            if (periodMonths !== null) {
                return (value: unknown): boolean => {
                    const dateValue = this.#excelDateValue(value);
                    if (dateValue === null) {
                        return false;
                    }
                    const date = this.#excelDateToJsDate(dateValue);
                    return periodMonths.has(date.getUTCMonth() + 1);
                };
            }

            const range = this.#dynamicDateRange(grouping);
            if (!range) {
                return null;
            }
            column.setAttribute('val', range.start);
            column.setAttribute('maxVal', range.end);

            return (value: unknown): boolean => {
                const numericValue = this.#excelDateValue(value);
                if (numericValue === null) {
                    return false;
                }
                return numericValue >= range.start && numericValue < range.end;
            };
        }

        if (filterType === Column.AUTOFILTER_FILTERTYPE_TOPTENFILTER) {
            const rule = rules[0];
            if (!rule) {
                return null;
            }

            const values = this.#collectNumericValues(worksheet, columnIndex, startRow, endRow);
            if (values.length === 0) {
                return () => false;
            }

            const count =
                rule.getOperator() === Rule.AUTOFILTER_COLUMN_RULE_TOPTEN_PERCENT
                    ? Math.max(1, Math.ceil(values.length * (Number(rule.getValue()) / 100)))
                    : Math.max(1, Math.floor(Number(rule.getValue())));
            const isTop = rule.getGrouping() !== Rule.AUTOFILTER_COLUMN_RULE_TOPTEN_BOTTOM;
            const sorted = values.slice().sort((a, b) => a - b);
            const thresholdIndex = isTop
                ? Math.max(0, sorted.length - count)
                : Math.min(sorted.length - 1, count - 1);
            const threshold = sorted[thresholdIndex]!;

            column.setAttribute('maxVal', threshold);

            return (value: unknown): boolean => {
                const numericValue = this.#numericValue(value);
                if (numericValue === null) {
                    return false;
                }
                return isTop ? numericValue >= threshold : numericValue <= threshold;
            };
        }

        return null;
    }

    #autoExtendRange(
        worksheet: Worksheet,
        startRow: number,
        startColumn: number,
        endColumn: number,
    ): number {
        const cells = worksheet.getCellCollection().getCells();
        const rowsWithData = new Set<number>();
        let maxRow = startRow;
        for (const cell of cells) {
            const row = cell.getRow() + 1;
            if (row <= startRow) {
                continue;
            }
            const col = cell.getColumn() + 1;
            if (col >= startColumn && col <= endColumn) {
                rowsWithData.add(row);
                if (row > maxRow) {
                    maxRow = row;
                }
            }
        }

        if (rowsWithData.size === 0) {
            return startRow;
        }

        for (let row = startRow + 1; row <= maxRow; row++) {
            if (!rowsWithData.has(row)) {
                return row - 1;
            }
        }

        return maxRow;
    }

    #collectNumericValues(
        worksheet: Worksheet,
        columnIndex: number,
        startRow: number,
        endRow: number,
    ): number[] {
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
        if (this.#isEmpty(value)) {
            return this.#isEmpty(rule.getValue());
        }

        const operator = rule.getOperator();
        const ruleValue = rule.getValue();
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
                : String(value).localeCompare(String(ruleValue), undefined, {
                      sensitivity: 'accent',
                  });

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

    #collectDateGroupValues(
        rule: Rule,
        dateSet: Set<string>,
        timeSet: Set<string>,
        dateTimeSet: Set<string>,
    ): void {
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

    #matchesDateGroup(
        value: unknown,
        dateSet: Set<string>,
        timeSet: Set<string>,
        dateTimeSet: Set<string>,
    ): boolean {
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

        const startOfMonth = (date: Date): Date =>
            new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), 1));
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
                    Date.UTC(
                        currentQuarterStart.getUTCFullYear(),
                        currentQuarterStart.getUTCMonth() - 3,
                        1,
                    ),
                );
                end = currentQuarterStart;
                break;
            }
            case Rule.AUTOFILTER_RULETYPE_DYNAMIC_NEXTQUARTER: {
                const nextQuarterStart = new Date(
                    Date.UTC(
                        startOfQuarter(today).getUTCFullYear(),
                        startOfQuarter(today).getUTCMonth() + 3,
                        1,
                    ),
                );
                start = nextQuarterStart;
                end = new Date(
                    Date.UTC(
                        nextQuarterStart.getUTCFullYear(),
                        nextQuarterStart.getUTCMonth() + 3,
                        1,
                    ),
                );
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
}
