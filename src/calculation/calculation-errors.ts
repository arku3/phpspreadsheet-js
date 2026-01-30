/**
 * Excel Error Codes.
 */
export const CalculationErrors = {
    NULL: '#NULL!',
    DIV0: '#DIV/0!',
    VALUE: '#VALUE!',
    REF: '#REF!',
    NAME: '#NAME?',
    NUM: '#NUM!',
    NA: '#N/A',
    GETTING_DATA: '#GETTING_DATA',
    CIRCULAR: '#CIRCULAR!',
} as const;

export type CalculationError = (typeof CalculationErrors)[keyof typeof CalculationErrors];

/**
 * Check if a value is an Excel error.
 */
export function isError(value: any): value is CalculationError {
    if (typeof value !== 'string') return false;
    return (Object.values(CalculationErrors) as string[]).includes(value);
}

/**
 * Check if a value is #N/A error.
 */
export function isNa(value: any): boolean {
    return value === CalculationErrors.NA;
}
