/**
 * Token types for formula parsing.
 */
export const TokenType = {
    NOOP: 'Noop',
    OPERAND: 'Operand',
    FUNCTION: 'Function',
    SUBEXPRESSION: 'Subexpression',
    ARGUMENT: 'Argument',
    OPERATOR_PREFIX: 'OperatorPrefix',
    OPERATOR_INFIX: 'OperatorInfix',
    OPERATOR_POSTFIX: 'OperatorPostfix',
    WHITESPACE: 'Whitespace',
    UNKNOWN: 'Unknown',
} as const;

export type TTokenType = typeof TokenType[keyof typeof TokenType];

/**
 * Token subtypes for formula parsing.
 */
export const TokenSubType = {
    NOTHING: 'Nothing',
    START: 'Start',
    STOP: 'Stop',
    TEXT: 'Text',
    NUMBER: 'Number',
    LOGICAL: 'Logical',
    ERROR: 'Error',
    RANGE: 'Range',
    MATH: 'Math',
    CONCATENATION: 'Concatenation',
    INTERSECTION: 'Intersection',
    UNION: 'Union',
} as const;

export type TTokenSubType = typeof TokenSubType[keyof typeof TokenSubType];

/**
 * Represents a token in a spreadsheet formula.
 */
export class FormulaToken {
    constructor(
        public value: string,
        public type: TTokenType = TokenType.UNKNOWN,
        public subType: TTokenSubType = TokenSubType.NOTHING
    ) {}
}
