import { FunctionRegistry } from '../function-registry.ts';
import { Helpers } from '../helpers.ts';
import type { FunctionCategory } from './function-category.ts';

/**
 * Excel Database functions (DSUM, DCOUNT, DAVERAGE, etc.)
 * Functions that perform calculations on database-like ranges with criteria.
 */
export class Database implements FunctionCategory {
    public register(registry: FunctionRegistry): void {
        // DSUM - Sum values in database matching criteria
        registry.register(
            'DSUM',
            (args) => {
                const database = Helpers.flattenArray(args[0]);
                const field = Helpers.asScalar(args[1]);
                const criteria = this.extractCriteria(Helpers.flattenArray(args[2]));

                if (database.length === 0) return 0;

                const fieldIndex = this.getFieldIndex(database, field);
                if (fieldIndex === -1) return '#VALUE!';

                const rows = this.getDataRows(database);
                let sum = 0;
                let count = 0;

                for (const row of rows) {
                    if (this.matchesCriteria(row, criteria)) {
                        const val = Number(row[fieldIndex]);
                        if (!isNaN(val)) {
                            sum += val;
                            count++;
                        }
                    }
                }

                return count > 0 ? sum : 0;
            },
            3,
            3,
        );

        // DCOUNT - Count cells in database matching criteria
        registry.register(
            'DCOUNT',
            (args) => {
                const database = Helpers.flattenArray(args[0]);
                const field = args[1] !== undefined ? Helpers.asScalar(args[1]) : null;
                const criteria = this.extractCriteria(Helpers.flattenArray(args[2] || []));

                if (database.length === 0) return 0;

                const rows = this.getDataRows(database);
                let count = 0;

                for (const row of rows) {
                    if (this.matchesCriteria(row, criteria)) {
                        if (field === null) {
                            // Count all numeric cells in row
                            for (const val of row) {
                                if (typeof val === 'number' && !isNaN(val)) {
                                    count++;
                                }
                            }
                        } else {
                            const fieldIndex = this.getFieldIndex(database, field);
                            if (fieldIndex !== -1) {
                                const val = Number(row[fieldIndex]);
                                if (!isNaN(val)) {
                                    count++;
                                }
                            }
                        }
                    }
                }

                return count;
            },
            2,
            3,
        );

        // DCOUNTA - Count non-blank cells in database matching criteria
        registry.register(
            'DCOUNTA',
            (args) => {
                const database = Helpers.flattenArray(args[0]);
                const field = args[1] !== undefined ? Helpers.asScalar(args[1]) : null;
                const criteria = this.extractCriteria(Helpers.flattenArray(args[2] || []));

                if (database.length === 0) return 0;

                const rows = this.getDataRows(database);
                let count = 0;

                for (const row of rows) {
                    if (this.matchesCriteria(row, criteria)) {
                        if (field === null) {
                            // Count all non-blank cells in row
                            for (const val of row) {
                                if (val !== null && val !== undefined && val !== '') {
                                    count++;
                                }
                            }
                        } else {
                            const fieldIndex = this.getFieldIndex(database, field);
                            if (fieldIndex !== -1) {
                                const val = row[fieldIndex];
                                if (val !== null && val !== undefined && val !== '') {
                                    count++;
                                }
                            }
                        }
                    }
                }

                return count;
            },
            2,
            3,
        );

        // DAVERAGE - Average of values in database matching criteria
        registry.register(
            'DAVERAGE',
            (args) => {
                const database = Helpers.flattenArray(args[0]);
                const field = Helpers.asScalar(args[1]);
                const criteria = this.extractCriteria(Helpers.flattenArray(args[2]));

                if (database.length === 0) return '#DIV/0!';

                const fieldIndex = this.getFieldIndex(database, field);
                if (fieldIndex === -1) return '#VALUE!';

                const rows = this.getDataRows(database);
                let sum = 0;
                let count = 0;

                for (const row of rows) {
                    if (this.matchesCriteria(row, criteria)) {
                        const val = Number(row[fieldIndex]);
                        if (!isNaN(val)) {
                            sum += val;
                            count++;
                        }
                    }
                }

                return count > 0 ? sum / count : '#DIV/0!';
            },
            3,
            3,
        );

        // DMAX - Maximum value in database matching criteria
        registry.register(
            'DMAX',
            (args) => {
                const database = Helpers.flattenArray(args[0]);
                const field = Helpers.asScalar(args[1]);
                const criteria = this.extractCriteria(Helpers.flattenArray(args[2]));

                if (database.length === 0) return 0;

                const fieldIndex = this.getFieldIndex(database, field);
                if (fieldIndex === -1) return '#VALUE!';

                const rows = this.getDataRows(database);
                let max: number | null = null;

                for (const row of rows) {
                    if (this.matchesCriteria(row, criteria)) {
                        const val = Number(row[fieldIndex]);
                        if (!isNaN(val)) {
                            if (max === null || val > max) {
                                max = val;
                            }
                        }
                    }
                }

                return max !== null ? max : 0;
            },
            3,
            3,
        );

        // DMIN - Minimum value in database matching criteria
        registry.register(
            'DMIN',
            (args) => {
                const database = Helpers.flattenArray(args[0]);
                const field = Helpers.asScalar(args[1]);
                const criteria = this.extractCriteria(Helpers.flattenArray(args[2]));

                if (database.length === 0) return 0;

                const fieldIndex = this.getFieldIndex(database, field);
                if (fieldIndex === -1) return '#VALUE!';

                const rows = this.getDataRows(database);
                let min: number | null = null;

                for (const row of rows) {
                    if (this.matchesCriteria(row, criteria)) {
                        const val = Number(row[fieldIndex]);
                        if (!isNaN(val)) {
                            if (min === null || val < min) {
                                min = val;
                            }
                        }
                    }
                }

                return min !== null ? min : 0;
            },
            3,
            3,
        );

        // DPRODUCT - Product of values in database matching criteria
        registry.register(
            'DPRODUCT',
            (args) => {
                const database = Helpers.flattenArray(args[0]);
                const field = Helpers.asScalar(args[1]);
                const criteria = this.extractCriteria(Helpers.flattenArray(args[2]));

                if (database.length === 0) return 0;

                const fieldIndex = this.getFieldIndex(database, field);
                if (fieldIndex === -1) return '#VALUE!';

                const rows = this.getDataRows(database);
                let product = 1;
                let count = 0;

                for (const row of rows) {
                    if (this.matchesCriteria(row, criteria)) {
                        const val = Number(row[fieldIndex]);
                        if (!isNaN(val)) {
                            product *= val;
                            count++;
                        }
                    }
                }

                return count > 0 ? product : 0;
            },
            3,
            3,
        );

        // DSTDEV - Sample standard deviation
        registry.register(
            'DSTDEV',
            (args) => {
                return this.dStat(args, 'STDEV');
            },
            3,
            3,
        );

        // DSTDEVP - Population standard deviation
        registry.register(
            'DSTDEVP',
            (args) => {
                return this.dStat(args, 'STDEVP');
            },
            3,
            3,
        );

        // DVAR - Sample variance
        registry.register(
            'DVAR',
            (args) => {
                return this.dStat(args, 'VAR');
            },
            3,
            3,
        );

        // DVARP - Population variance
        registry.register(
            'DVARP',
            (args) => {
                return this.dStat(args, 'VARP');
            },
            3,
            3,
        );

        // DGET - Get single value from database
        registry.register(
            'DGET',
            (args) => {
                const database = Helpers.flattenArray(args[0]);
                const field = Helpers.asScalar(args[1]);
                const criteria = this.extractCriteria(Helpers.flattenArray(args[2]));

                if (database.length === 0) return '#VALUE!';

                const fieldIndex = this.getFieldIndex(database, field);
                if (fieldIndex === -1) return '#VALUE!';

                const rows = this.getDataRows(database);
                let result: any = null;
                let count = 0;

                for (const row of rows) {
                    if (this.matchesCriteria(row, criteria)) {
                        if (count > 0) return '#NUM!'; // Multiple matches
                        result = row[fieldIndex];
                        count++;
                    }
                }

                if (count === 1) {
                    return result;
                } else if (count === 0) {
                    return '#VALUE!';
                } else {
                    return '#NUM!';
                }
            },
            3,
            3,
        );
    }

    private extractCriteria(criteriaRange: any[]): Map<number, Array<{ op: string; value: any }>> {
        const criteria = new Map<number, Array<{ op: string; value: any }>>();

        if (criteriaRange.length < 2) return criteria; // Need at least header + one row

        // First row is headers
        const headers = criteriaRange.slice(0, Math.floor(criteriaRange.length / 2));
        const dataRows = criteriaRange.slice(headers.length);

        // Parse criteria rows
        for (let rowIdx = 0; rowIdx < dataRows.length; rowIdx++) {
            const row = dataRows[rowIdx];
            if (!Array.isArray(row)) continue;

            for (let colIdx = 0; colIdx < row.length; colIdx++) {
                const cellValue = row[colIdx];
                if (cellValue !== null && cellValue !== undefined && cellValue !== '') {
                    const condition = this.parseCriteria(String(cellValue));
                    if (!criteria.has(colIdx)) {
                        criteria.set(colIdx, []);
                    }
                    criteria.get(colIdx)!.push(condition);
                }
            }
        }

        return criteria;
    }

    private parseCriteria(criteria: string): { op: string; value: any } {
        let op = '=';
        let value: any = criteria;

        if (criteria.startsWith('>=')) {
            op = '>=';
            value = criteria.substring(2);
        } else if (criteria.startsWith('<=')) {
            op = '<=';
            value = criteria.substring(2);
        } else if (criteria.startsWith('<>')) {
            op = '<>';
            value = criteria.substring(2);
        } else if (criteria.startsWith('>')) {
            op = '>';
            value = criteria.substring(1);
        } else if (criteria.startsWith('<')) {
            op = '<';
            value = criteria.substring(1);
        } else if (criteria.startsWith('=')) {
            op = '=';
            value = criteria.substring(1);
        }

        // Try to parse as number
        const numValue = Number(value);
        if (!isNaN(numValue)) {
            value = numValue;
        }

        return { op, value };
    }

    private getFieldIndex(database: any[], field: any): number {
        if (typeof field === 'number') {
            return field - 1; // 1-based to 0-based
        }

        // First row should be headers
        if (database.length === 0) return -1;
        const firstRow = database[0];
        if (!Array.isArray(firstRow)) return -1;

        const fieldStr = String(field).toLowerCase();
        for (let i = 0; i < firstRow.length; i++) {
            if (String(firstRow[i]).toLowerCase() === fieldStr) {
                return i;
            }
        }

        return -1;
    }

    private getDataRows(database: any[]): any[][] {
        if (database.length <= 1) return [];
        return database.slice(1).filter((row) => Array.isArray(row));
    }

    private matchesCriteria(
        row: any[],
        criteria: Map<number, Array<{ op: string; value: any }>>,
    ): boolean {
        for (const [colIdx, conditions] of criteria) {
            const cellValue = row[colIdx];

            // OR logic within same column - at least one condition must match
            let columnMatches = false;
            for (const condition of conditions) {
                if (this.evaluateCondition(cellValue, condition)) {
                    columnMatches = true;
                    break;
                }
            }

            if (!columnMatches) return false;
        }

        return true;
    }

    private evaluateCondition(cellValue: any, condition: { op: string; value: any }): boolean {
        const { op, value } = condition;

        // Numeric comparison
        const numCell = typeof cellValue === 'number' ? cellValue : Number(cellValue);
        const numValue = typeof value === 'number' ? value : Number(value);

        if (!isNaN(numCell) && !isNaN(numValue)) {
            switch (op) {
                case '=':
                    return numCell === numValue;
                case '<>':
                    return numCell !== numValue;
                case '>':
                    return numCell > numValue;
                case '<':
                    return numCell < numValue;
                case '>=':
                    return numCell >= numValue;
                case '<=':
                    return numCell <= numValue;
            }
        }

        // String comparison
        const strCell = String(cellValue).toLowerCase();
        const strValue = String(value).toLowerCase();

        switch (op) {
            case '=':
                return strCell === strValue;
            case '<>':
                return strCell !== strValue;
            case '>':
                return strCell > strValue;
            case '<':
                return strCell < strValue;
            case '>=':
                return strCell >= strValue;
            case '<=':
                return strCell <= strValue;
        }

        return false;
    }

    private dStat(args: any[], statType: string): number | string {
        const database = Helpers.flattenArray(args[0]);
        const field = Helpers.asScalar(args[1]);
        const criteria = this.extractCriteria(Helpers.flattenArray(args[2]));

        if (database.length === 0) return '#DIV/0!';

        const fieldIndex = this.getFieldIndex(database, field);
        if (fieldIndex === -1) return '#VALUE!';

        const rows = this.getDataRows(database);
        const values: number[] = [];

        for (const row of rows) {
            if (this.matchesCriteria(row, criteria)) {
                const val = Number(row[fieldIndex]);
                if (!isNaN(val)) {
                    values.push(val);
                }
            }
        }

        if (values.length === 0) return '#DIV/0!';

        const mean = values.reduce((a, b) => a + b, 0) / values.length;
        const squaredDiffs = values.map((v) => Math.pow(v - mean, 2));

        switch (statType) {
            case 'STDEV':
                if (values.length < 2) return '#DIV/0!';
                return Math.sqrt(squaredDiffs.reduce((a, b) => a + b, 0) / (values.length - 1));
            case 'STDEVP':
                return Math.sqrt(squaredDiffs.reduce((a, b) => a + b, 0) / values.length);
            case 'VAR':
                if (values.length < 2) return '#DIV/0!';
                return squaredDiffs.reduce((a, b) => a + b, 0) / (values.length - 1);
            case 'VARP':
                return squaredDiffs.reduce((a, b) => a + b, 0) / values.length;
            default:
                return '#VALUE!';
        }
    }
}
