import { FunctionRegistry } from '../function-registry.ts';
import { Helpers } from '../helpers.ts';
import type { FunctionCategory } from './function-category.ts';

/**
 * Excel Conditional functions (COUNTIF, SUMIF, AVERAGEIF, etc.)
 * Functions that perform calculations based on criteria.
 */
export class Conditional implements FunctionCategory {
    public register(registry: FunctionRegistry): void {
        // COUNTIF - Count cells meeting criteria
        registry.register(
            'COUNTIF',
            (args) => {
                const range = Helpers.flattenArray(args[0]);
                const criteria = String(Helpers.asScalar(args[1]) || '');

                return this.countIf(range, criteria);
            },
            2,
            2,
        );

        // COUNTIFS - Count cells meeting multiple criteria
        registry.register(
            'COUNTIFS',
            (args) => {
                if (args.length < 2 || args.length % 2 !== 0) return '#VALUE!';

                const ranges: any[][] = [];
                const criterias: string[] = [];

                for (let i = 0; i < args.length; i += 2) {
                    ranges.push(Helpers.flattenArray(args[i]));
                    criterias.push(String(Helpers.asScalar(args[i + 1]) || ''));
                }

                return this.countIfs(ranges, criterias);
            },
            2,
            -1,
        );

        // SUMIF - Sum cells meeting criteria
        registry.register(
            'SUMIF',
            (args) => {
                const range = Helpers.flattenArray(args[0]);
                const criteria = String(Helpers.asScalar(args[1]) || '');
                const sumRange = args[2] !== undefined ? Helpers.flattenArray(args[2]) : range;

                return this.sumIf(range, criteria, sumRange);
            },
            2,
            3,
        );

        // SUMIFS - Sum cells meeting multiple criteria
        registry.register(
            'SUMIFS',
            (args) => {
                if (args.length < 3) return '#VALUE!';

                const sumRange = Helpers.flattenArray(args[0]);
                const ranges: any[][] = [];
                const criterias: string[] = [];

                for (let i = 1; i < args.length; i += 2) {
                    if (i + 1 >= args.length) return '#VALUE!';
                    ranges.push(Helpers.flattenArray(args[i]));
                    criterias.push(String(Helpers.asScalar(args[i + 1]) || ''));
                }

                return this.sumIfs(sumRange, ranges, criterias);
            },
            3,
            -1,
        );

        // AVERAGEIF - Average of cells meeting criteria
        registry.register(
            'AVERAGEIF',
            (args) => {
                const range = Helpers.flattenArray(args[0]);
                const criteria = String(Helpers.asScalar(args[1]) || '');
                const avgRange = args[2] !== undefined ? Helpers.flattenArray(args[2]) : range;

                return this.averageIf(range, criteria, avgRange);
            },
            2,
            3,
        );

        // AVERAGEIFS - Average of cells meeting multiple criteria
        registry.register(
            'AVERAGEIFS',
            (args) => {
                if (args.length < 3) return '#VALUE!';

                const avgRange = Helpers.flattenArray(args[0]);
                const ranges: any[][] = [];
                const criterias: string[] = [];

                for (let i = 1; i < args.length; i += 2) {
                    if (i + 1 >= args.length) return '#VALUE!';
                    ranges.push(Helpers.flattenArray(args[i]));
                    criterias.push(String(Helpers.asScalar(args[i + 1]) || ''));
                }

                return this.averageIfs(avgRange, ranges, criterias);
            },
            3,
            -1,
        );

        // MAXIFS - Maximum of cells meeting multiple criteria
        registry.register(
            'MAXIFS',
            (args) => {
                if (args.length < 3) return '#VALUE!';

                const maxRange = Helpers.flattenArray(args[0]);
                const ranges: any[][] = [];
                const criterias: string[] = [];

                for (let i = 1; i < args.length; i += 2) {
                    if (i + 1 >= args.length) return '#VALUE!';
                    ranges.push(Helpers.flattenArray(args[i]));
                    criterias.push(String(Helpers.asScalar(args[i + 1]) || ''));
                }

                return this.maxIfs(maxRange, ranges, criterias);
            },
            3,
            -1,
        );

        // MINIFS - Minimum of cells meeting multiple criteria
        registry.register(
            'MINIFS',
            (args) => {
                if (args.length < 3) return '#VALUE!';

                const minRange = Helpers.flattenArray(args[0]);
                const ranges: any[][] = [];
                const criterias: string[] = [];

                for (let i = 1; i < args.length; i += 2) {
                    if (i + 1 >= args.length) return '#VALUE!';
                    ranges.push(Helpers.flattenArray(args[i]));
                    criterias.push(String(Helpers.asScalar(args[i + 1]) || ''));
                }

                return this.minIfs(minRange, ranges, criterias);
            },
            3,
            -1,
        );
    }

    private matchesCriteria(value: any, criteria: string): boolean {
        if (criteria === '' || criteria === '*') return true;

        // Parse comparison operators
        let operator = '=';
        let compareValue = criteria;

        if (criteria.startsWith('>=')) {
            operator = '>=';
            compareValue = criteria.substring(2);
        } else if (criteria.startsWith('<=')) {
            operator = '<=';
            compareValue = criteria.substring(2);
        } else if (criteria.startsWith('<>')) {
            operator = '<>';
            compareValue = criteria.substring(2);
        } else if (criteria.startsWith('>')) {
            operator = '>';
            compareValue = criteria.substring(1);
        } else if (criteria.startsWith('<')) {
            operator = '<';
            compareValue = criteria.substring(1);
        } else if (criteria.startsWith('=')) {
            operator = '=';
            compareValue = criteria.substring(1);
        }

        // Handle wildcards
        const hasWildcard = compareValue.includes('*') || compareValue.includes('?');
        if (hasWildcard) {
            const regex = compareValue.replace(/\*/g, '.*').replace(/\?/g, '.');
            const matches = new RegExp(`^${regex}$`, 'i').test(String(value));
            return operator === '<>' ? !matches : matches;
        }

        // Numeric comparison
        const numValue = typeof value === 'number' ? value : Number(value);
        const numCompare = Number(compareValue);

        if (!isNaN(numValue) && !isNaN(numCompare)) {
            switch (operator) {
                case '=':
                    return numValue === numCompare;
                case '<>':
                    return numValue !== numCompare;
                case '>':
                    return numValue > numCompare;
                case '<':
                    return numValue < numCompare;
                case '>=':
                    return numValue >= numCompare;
                case '<=':
                    return numValue <= numCompare;
            }
        }

        // String comparison (case-insensitive)
        const strValue = String(value).toLowerCase();
        const strCompare = compareValue.toLowerCase();

        switch (operator) {
            case '=':
                return strValue === strCompare;
            case '<>':
                return strValue !== strCompare;
            case '>':
                return strValue > strCompare;
            case '<':
                return strValue < strCompare;
            case '>=':
                return strValue >= strCompare;
            case '<=':
                return strValue <= strCompare;
        }

        return false;
    }

    private countIf(range: any[], criteria: string): number {
        let count = 0;
        for (const value of range) {
            if (this.matchesCriteria(value, criteria)) {
                count++;
            }
        }
        return count;
    }

    private countIfs(ranges: any[][], criterias: string[]): number {
        if (ranges.length === 0) return 0;

        const len = ranges[0]!.length;
        let count = 0;

        for (let i = 0; i < len; i++) {
            let allMatch = true;
            for (let j = 0; j < ranges.length; j++) {
                if (!this.matchesCriteria(ranges[j]![i], criterias[j]!)) {
                    allMatch = false;
                    break;
                }
            }
            if (allMatch) count++;
        }

        return count;
    }

    private sumIf(range: any[], criteria: string, sumRange: any[]): number | string {
        let sum = 0;
        const len = Math.min(range.length, sumRange.length);

        for (let i = 0; i < len; i++) {
            if (this.matchesCriteria(range[i], criteria)) {
                const val = Number(sumRange[i]);
                if (!isNaN(val)) {
                    sum += val;
                }
            }
        }

        return sum;
    }

    private sumIfs(sumRange: any[], ranges: any[][], criterias: string[]): number | string {
        if (ranges.length === 0) return 0;

        const len = Math.min(sumRange.length, ranges[0]!.length);
        let sum = 0;

        for (let i = 0; i < len; i++) {
            let allMatch = true;
            for (let j = 0; j < ranges.length; j++) {
                if (!this.matchesCriteria(ranges[j]![i], criterias[j]!)) {
                    allMatch = false;
                    break;
                }
            }
            if (allMatch) {
                const val = Number(sumRange[i]);
                if (!isNaN(val)) {
                    sum += val;
                }
            }
        }

        return sum;
    }

    private averageIf(range: any[], criteria: string, avgRange: any[]): number | string {
        let sum = 0;
        let count = 0;
        const len = Math.min(range.length, avgRange.length);

        for (let i = 0; i < len; i++) {
            if (this.matchesCriteria(range[i], criteria)) {
                const val = Number(avgRange[i]);
                if (!isNaN(val)) {
                    sum += val;
                    count++;
                }
            }
        }

        return count > 0 ? sum / count : '#DIV/0!';
    }

    private averageIfs(avgRange: any[], ranges: any[][], criterias: string[]): number | string {
        if (ranges.length === 0) return '#DIV/0!';

        const len = Math.min(avgRange.length, ranges[0]!.length);
        let sum = 0;
        let count = 0;

        for (let i = 0; i < len; i++) {
            let allMatch = true;
            for (let j = 0; j < ranges.length; j++) {
                if (!this.matchesCriteria(ranges[j]![i], criterias[j]!)) {
                    allMatch = false;
                    break;
                }
            }
            if (allMatch) {
                const val = Number(avgRange[i]);
                if (!isNaN(val)) {
                    sum += val;
                    count++;
                }
            }
        }

        return count > 0 ? sum / count : '#DIV/0!';
    }

    private maxIfs(maxRange: any[], ranges: any[][], criterias: string[]): number | string {
        if (ranges.length === 0) return 0;

        const len = Math.min(maxRange.length, ranges[0]!.length);
        let max: number | null = null;

        for (let i = 0; i < len; i++) {
            let allMatch = true;
            for (let j = 0; j < ranges.length; j++) {
                if (!this.matchesCriteria(ranges[j]![i], criterias[j]!)) {
                    allMatch = false;
                    break;
                }
            }
            if (allMatch) {
                const val = Number(maxRange[i]);
                if (!isNaN(val)) {
                    if (max === null || val > max) {
                        max = val;
                    }
                }
            }
        }

        return max !== null ? max : 0;
    }

    private minIfs(minRange: any[], ranges: any[][], criterias: string[]): number | string {
        if (ranges.length === 0) return 0;

        const len = Math.min(minRange.length, ranges[0]!.length);
        let min: number | null = null;

        for (let i = 0; i < len; i++) {
            let allMatch = true;
            for (let j = 0; j < ranges.length; j++) {
                if (!this.matchesCriteria(ranges[j]![i], criterias[j]!)) {
                    allMatch = false;
                    break;
                }
            }
            if (allMatch) {
                const val = Number(minRange[i]);
                if (!isNaN(val)) {
                    if (min === null || val < min) {
                        min = val;
                    }
                }
            }
        }

        return min !== null ? min : 0;
    }
}
