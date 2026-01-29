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

export type CalculationError = typeof CalculationErrors[keyof typeof CalculationErrors];
