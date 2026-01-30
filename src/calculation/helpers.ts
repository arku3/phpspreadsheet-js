import { isError } from './calculation-errors.ts';

/**
 * Utility class for common formula processing tasks.
 */
export class Helpers {
    /**
     * Convert a multi-dimensional array to a simple 1-dimensional array.
     */
    public static flattenArray(array: any): any[] {
        if (!Array.isArray(array)) {
            return [array];
        }

        const flattened: any[] = [];
        const stack = [...array];

        while (stack.length > 0) {
            const value = stack.shift();

            if (Array.isArray(value)) {
                stack.unshift(...value);
            } else {
                flattened.push(value);
            }
        }

        return flattened;
    }

    /**
     * Flatten an array and filter out non-numeric values.
     */
    public static flattenNumeric(array: any): number[] {
        return Helpers.flattenArray(array)
            .map((val) => Number(val))
            .filter((val) => !isNaN(val));
    }

    /**
     * Extract a single scalar value from a possible range.
     * Excel usually takes the top-left cell if a range is provided where a scalar is expected.
     */
    public static asScalar(value: any): any {
        if (Array.isArray(value)) {
            while (Array.isArray(value) && value.length > 0) {
                value = value[0];
            }
            return value === undefined ? null : value;
        }
        return value;
    }
}
