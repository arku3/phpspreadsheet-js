import { FunctionRegistry } from '../function-registry.ts';
import { Helpers } from '../helpers.ts';
import type { FunctionCategory } from './function-category.ts';

export class LookupRef implements FunctionCategory {
    public register(registry: FunctionRegistry): void {
        // VLOOKUP(lookup_value, table_array, col_index_num, [range_lookup])
        registry.register(
            'VLOOKUP',
            (args) => {
                const lookupValue = args[0];
                const tableArray = args[1];
                const colIndexNum = Math.floor(Number(Helpers.asScalar(args[2])) || 0);
                const rangeLookup = args[3] !== undefined ? Boolean(Helpers.asScalar(args[3])) : true;

                if (!Array.isArray(tableArray) || tableArray.length === 0) {
                    return '#VALUE!';
                }

                if (colIndexNum < 1 || colIndexNum > (Array.isArray(tableArray[0]) ? tableArray[0].length : 1)) {
                    return '#REF!';
                }

                const colIndex = colIndexNum - 1;
                let result: any = '#N/A';

                if (rangeLookup) {
                    // Approximate match: lookup_array must be sorted in ascending order
                    for (const row of tableArray) {
                        const firstColValue = Array.isArray(row) ? row[0] : row;
                        if (firstColValue === lookupValue) {
                            result = Array.isArray(row) ? row[colIndex] : colIndex === 0 ? row : '#REF!';
                        } else if (typeof firstColValue === typeof lookupValue && firstColValue < lookupValue) {
                            result = Array.isArray(row) ? row[colIndex] : colIndex === 0 ? row : '#REF!';
                        } else if (typeof firstColValue === typeof lookupValue && firstColValue > lookupValue) {
                            break;
                        }
                    }
                } else {
                    // Exact match
                    const match = tableArray.find((row) => (Array.isArray(row) ? row[0] : row) == lookupValue);
                    if (match) {
                        result = Array.isArray(match) ? match[colIndex] : colIndex === 0 ? match : '#REF!';
                    }
                }

                return result;
            },
            3,
            4,
        );

        // MATCH(lookup_value, lookup_array, [match_type])
        registry.register(
            'MATCH',
            (args) => {
                const lookupValue = Helpers.asScalar(args[0]);
                const lookupArray = Helpers.flattenArray(args[1]);
                const matchType = args[2] !== undefined ? Number(Helpers.asScalar(args[2])) : 1;

                if (matchType === 0) {
                    const index = lookupArray.findIndex((val) => val == lookupValue);
                    return index !== -1 ? index + 1 : '#N/A';
                } else if (matchType === 1) {
                    let result: any = '#N/A';
                    for (let i = 0; i < lookupArray.length; i++) {
                        if (lookupArray[i] == lookupValue) {
                            result = i + 1;
                        } else if (lookupArray[i] < lookupValue) {
                            result = i + 1;
                        } else if (typeof lookupArray[i] === typeof lookupValue && lookupArray[i] > lookupValue) {
                            break;
                        }
                    }
                    return result;
                } else if (matchType === -1) {
                    let result: any = '#N/A';
                    for (let i = 0; i < lookupArray.length; i++) {
                        if (lookupArray[i] == lookupValue) {
                            result = i + 1;
                        } else if (lookupArray[i] > lookupValue) {
                            result = i + 1;
                        } else if (typeof lookupArray[i] === typeof lookupValue && lookupArray[i] < lookupValue) {
                            break;
                        }
                    }
                    return result;
                }
                return '#VALUE!';
            },
            2,
            3,
        );

        // INDEX(array, row_num, [column_num])
        registry.register(
            'INDEX',
            (args) => {
                const array = args[0];
                const rowNum = Math.floor(Number(Helpers.asScalar(args[1])) || 0);
                const colNum = args[2] !== undefined ? Math.floor(Number(Helpers.asScalar(args[2]))) : 1;

                if (!Array.isArray(array)) {
                    return array; // Scalar INDEX
                }

                // If it's a 1D array (from flattenArray or single row/col range)
                if (!Array.isArray(array[0])) {
                    // If it's a single row, rowNum might be used as colNum by some users,
                    // but officially it's rowNum.
                    const idx = rowNum > 0 ? rowNum : colNum;
                    return array[idx - 1] ?? '#REF!';
                }

                const row = array[rowNum - 1];
                if (!row) return '#REF!';

                if (!Array.isArray(row)) {
                    return colNum === 1 ? row : '#REF!';
                }

                return row[colNum - 1] ?? '#REF!';
            },
            2,
            3,
        );
    }
}
