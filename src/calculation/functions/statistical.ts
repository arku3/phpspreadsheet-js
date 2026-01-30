import { FunctionRegistry } from '../function-registry.ts';
import type { FunctionCategory } from './function-category.ts';
import { Helpers } from '../helpers.ts';

/**
 * Excel Statistical functions.
 * Comprehensive statistical analysis and aggregation functions.
 */
export class Statistical implements FunctionCategory {
    public register(registry: FunctionRegistry): void {
        // AVERAGE - Arithmetic mean
        registry.register('AVERAGE', (args) => {
            const flatArgs = Helpers.flattenNumeric(args);
            return flatArgs.length > 0 ? flatArgs.reduce((acc, val) => acc + val, 0) / flatArgs.length : 0;
        }, 1, -1);

        // AVERAGEA - Average including text (treated as 0)
        registry.register('AVERAGEA', (args) => {
            const values: number[] = [];
            for (const arg of args) {
                const flattened = Helpers.flattenArray(arg);
                for (const value of flattened) {
                    if (value === null || value === undefined || value === '') {
                        values.push(0);
                    } else if (typeof value === 'boolean') {
                        values.push(value ? 1 : 0);
                    } else if (typeof value === 'number' && !isNaN(value)) {
                        values.push(value);
                    } else if (typeof value === 'string' && !isNaN(Number(value))) {
                        values.push(Number(value));
                    } else {
                        values.push(0);
                    }
                }
            }
            if (values.length === 0) return '#DIV/0!';
            return values.reduce((a, b) => a + b, 0) / values.length;
        }, 1, -1);

        // COUNT - Count numeric values
        registry.register('COUNT', (args) => {
            let count = 0;
            for (const arg of args) {
                const values = Helpers.flattenArray(arg);
                for (const value of values) {
                    if (typeof value === 'number' && !isNaN(value)) {
                        count++;
                    }
                }
            }
            return count;
        }, 1, -1);

        // COUNTA - Count non-empty values
        registry.register('COUNTA', (args) => {
            let count = 0;
            for (const arg of args) {
                const values = Helpers.flattenArray(arg);
                for (const value of values) {
                    if (value !== null && value !== undefined && value !== '') {
                        count++;
                    }
                }
            }
            return count;
        }, 1, -1);

        // COUNTBLANK - Count blank cells
        registry.register('COUNTBLANK', (args) => {
            let count = 0;
            for (const arg of args) {
                const values = Helpers.flattenArray(arg);
                for (const value of values) {
                    if (value === null || value === undefined || value === '') {
                        count++;
                    }
                }
            }
            return count;
        }, 1, 1);

        // AVEDEV - Average absolute deviation
        registry.register('AVEDEV', (args) => {
            const values = this.extractNumericValues(args);
            if (values.length === 0) return '#DIV/0!';
            
            const mean = values.reduce((a, b) => a + b, 0) / values.length;
            const deviations = values.map(v => Math.abs(v - mean));
            return deviations.reduce((a, b) => a + b, 0) / values.length;
        }, 1, -1);

        // STDEV / STDEV.S - Sample standard deviation
        registry.register('STDEV', (args) => {
            return this.sampleStdDev(args);
        }, 1, -1);

        registry.register('STDEV.S', (args) => {
            return this.sampleStdDev(args);
        }, 1, -1);

        // STDEV.P / STDEVP - Population standard deviation  
        registry.register('STDEV.P', (args) => {
            return this.populationStdDev(args);
        }, 1, -1);

        registry.register('STDEVP', (args) => {
            return this.populationStdDev(args);
        }, 1, -1);

        // VAR / VAR.S - Sample variance
        registry.register('VAR', (args) => {
            return this.sampleVariance(args);
        }, 1, -1);

        registry.register('VAR.S', (args) => {
            return this.sampleVariance(args);
        }, 1, -1);

        // VAR.P / VARP - Population variance
        registry.register('VAR.P', (args) => {
            return this.populationVariance(args);
        }, 1, -1);

        registry.register('VARP', (args) => {
            return this.populationVariance(args);
        }, 1, -1);

        // MEDIAN - Median value
        registry.register('MEDIAN', (args) => {
            const values = this.extractNumericValues(args);
            if (values.length === 0) return '#NUM!';
            
            values.sort((a, b) => a - b);
            const mid = Math.floor(values.length / 2);
            
            if (values.length % 2 === 0) {
                return (values[mid - 1]! + values[mid]!) / 2;
            } else {
                return values[mid]!;
            }
        }, 1, -1);

        // MODE.SNGL - Mode (most frequent value)
        registry.register('MODE.SNGL', (args) => {
            return this.calculateMode(args);
        }, 1, -1);

        // PERCENTILE.INC - Percentile (inclusive)
        registry.register('PERCENTILE.INC', (args) => {
            const array = this.extractNumericValues([args[0]]);
            const k = Number(Helpers.asScalar(args[1])) || 0;
            
            if (array.length === 0) return '#NUM!';
            if (k < 0 || k > 1) return '#NUM!';
            
            array.sort((a, b) => a - b);
            const n = array.length;
            const index = k * (n - 1);
            const lower = Math.floor(index);
            const upper = Math.ceil(index);
            
            if (lower === upper) return array[lower]!;
            
            const fraction = index - lower;
            return array[lower]! + fraction * (array[upper]! - array[lower]!);
        }, 2, 2);

        // QUARTILE.INC - Quartile (inclusive)
        registry.register('QUARTILE.INC', (args) => {
            const array = this.extractNumericValues([args[0]]);
            const quart = Number(Helpers.asScalar(args[1])) || 0;
            
            if (array.length === 0) return '#NUM!';
            if (quart < 0 || quart > 4) return '#NUM!';
            
            const percentiles = [0, 0.25, 0.5, 0.75, 1];
            const k = percentiles[quart]!;
            
            // Reuse PERCENTILE.INC logic inline
            array.sort((a, b) => a - b);
            const n = array.length;
            const index = k * (n - 1);
            const lower = Math.floor(index);
            const upper = Math.ceil(index);
            
            if (lower === upper) return array[lower]!;
            
            const fraction = index - lower;
            return array[lower]! + fraction * (array[upper]! - array[lower]!);
        }, 2, 2);

        // MAXA - Maximum including text/logical
        registry.register('MAXA', (args) => {
            const values: number[] = [];
            for (const arg of args) {
                const flattened = Helpers.flattenArray(arg);
                for (const value of flattened) {
                    if (value === null || value === undefined || value === '') {
                        values.push(0);
                    } else if (typeof value === 'boolean') {
                        values.push(value ? 1 : 0);
                    } else if (typeof value === 'number' && !isNaN(value)) {
                        values.push(value);
                    } else if (typeof value === 'string' && !isNaN(Number(value))) {
                        values.push(Number(value));
                    } else {
                        values.push(0);
                    }
                }
            }
            if (values.length === 0) return 0;
            return Math.max(...values);
        }, 1, -1);

        // MINA - Minimum including text/logical
        registry.register('MINA', (args) => {
            const values: number[] = [];
            for (const arg of args) {
                const flattened = Helpers.flattenArray(arg);
                for (const value of flattened) {
                    if (value === null || value === undefined || value === '') {
                        values.push(0);
                    } else if (typeof value === 'boolean') {
                        values.push(value ? 1 : 0);
                    } else if (typeof value === 'number' && !isNaN(value)) {
                        values.push(value);
                    } else if (typeof value === 'string' && !isNaN(Number(value))) {
                        values.push(Number(value));
                    } else {
                        values.push(0);
                    }
                }
            }
            if (values.length === 0) return 0;
            return Math.min(...values);
        }, 1, -1);

        // LARGE - k-th largest value
        registry.register('LARGE', (args) => {
            const array = this.extractNumericValues([args[0]]);
            const k = Number(Helpers.asScalar(args[1])) || 1;
            
            if (array.length === 0) return '#NUM!';
            if (k < 1 || k > array.length) return '#NUM!';
            
            array.sort((a, b) => b - a);
            return array[k - 1]!;
        }, 2, 2);

        // SMALL - k-th smallest value
        registry.register('SMALL', (args) => {
            const array = this.extractNumericValues([args[0]]);
            const k = Number(Helpers.asScalar(args[1])) || 1;
            
            if (array.length === 0) return '#NUM!';
            if (k < 1 || k > array.length) return '#NUM!';
            
            array.sort((a, b) => a - b);
            return array[k - 1]!;
        }, 2, 2);

        // RANK.EQ - Rank of number in list
        registry.register('RANK.EQ', (args) => {
            const number = Number(Helpers.asScalar(args[0])) || 0;
            const ref = this.extractNumericValues([args[1]]);
            const order = args[2] !== undefined ? Number(Helpers.asScalar(args[2])) : 0;
            
            if (ref.length === 0) return '#N/A';
            
            let rank = 1;
            for (const val of ref) {
                if (order === 0) {
                    if (val > number) rank++;
                } else {
                    if (val < number) rank++;
                }
            }
            
            return rank;
        }, 2, 3);

        // CORREL - Correlation coefficient
        registry.register('CORREL', (args) => {
            const array1 = this.extractNumericValues([args[0]]);
            const array2 = this.extractNumericValues([args[1]]);
            
            if (array1.length !== array2.length || array1.length === 0) return '#N/A';
            
            const n = array1.length;
            const mean1 = array1.reduce((a, b) => a + b, 0) / n;
            const mean2 = array2.reduce((a, b) => a + b, 0) / n;
            
            let numerator = 0;
            let denom1 = 0;
            let denom2 = 0;
            
            for (let i = 0; i < n; i++) {
                const diff1 = array1[i]! - mean1;
                const diff2 = array2[i]! - mean2;
                numerator += diff1 * diff2;
                denom1 += diff1 * diff1;
                denom2 += diff2 * diff2;
            }
            
            if (denom1 === 0 || denom2 === 0) return '#DIV/0!';
            
            return numerator / Math.sqrt(denom1 * denom2);
        }, 2, 2);
    }

    private extractNumericValues(args: any[]): number[] {
        const values: number[] = [];
        for (const arg of args) {
            const flattened = Helpers.flattenArray(arg);
            for (const value of flattened) {
                if (typeof value === 'number' && !isNaN(value)) {
                    values.push(value);
                }
            }
        }
        return values;
    }

    private sampleStdDev(args: any[]): number | string {
        const values = this.extractNumericValues(args);
        if (values.length < 2) return '#DIV/0!';
        
        const mean = values.reduce((a, b) => a + b, 0) / values.length;
        const squaredDiffs = values.map(v => Math.pow(v - mean, 2));
        const variance = squaredDiffs.reduce((a, b) => a + b, 0) / (values.length - 1);
        
        return Math.sqrt(variance);
    }

    private populationStdDev(args: any[]): number | string {
        const values = this.extractNumericValues(args);
        if (values.length === 0) return '#DIV/0!';
        
        const mean = values.reduce((a, b) => a + b, 0) / values.length;
        const squaredDiffs = values.map(v => Math.pow(v - mean, 2));
        const variance = squaredDiffs.reduce((a, b) => a + b, 0) / values.length;
        
        return Math.sqrt(variance);
    }

    private sampleVariance(args: any[]): number | string {
        const values = this.extractNumericValues(args);
        if (values.length < 2) return '#DIV/0!';
        
        const mean = values.reduce((a, b) => a + b, 0) / values.length;
        const squaredDiffs = values.map(v => Math.pow(v - mean, 2));
        
        return squaredDiffs.reduce((a, b) => a + b, 0) / (values.length - 1);
    }

    private populationVariance(args: any[]): number | string {
        const values = this.extractNumericValues(args);
        if (values.length === 0) return '#DIV/0!';
        
        const mean = values.reduce((a, b) => a + b, 0) / values.length;
        const squaredDiffs = values.map(v => Math.pow(v - mean, 2));
        
        return squaredDiffs.reduce((a, b) => a + b, 0) / values.length;
    }

    private calculateMode(args: any[]): number | string {
        const values = this.extractNumericValues(args);
        if (values.length === 0) return '#N/A';
        
        const frequency = new Map<number, number>();
        for (const val of values) {
            frequency.set(val, (frequency.get(val) || 0) + 1);
        }
        
        let mode = values[0]!;
        let maxCount = 0;
        
        for (const [val, count] of frequency) {
            if (count > maxCount) {
                maxCount = count;
                mode = val;
            }
        }
        
        if (maxCount === 1) return '#N/A';
        return mode;
    }
}
