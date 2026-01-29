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
    STRUCTURED_REFERENCE: 'StructuredReference',
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
    #value: string;
    #tokenType: TTokenType;
    #tokenSubType: TTokenSubType;

    constructor(
        value: string,
        type: TTokenType = TokenType.UNKNOWN,
        subType: TTokenSubType = TokenSubType.NOTHING
    ) {
        this.#value = value;
        this.#tokenType = type;
        this.#tokenSubType = subType;
    }

    public getValue(): string {
        return this.#value;
    }

    public setValue(value: string): void {
        this.#value = value;
    }

    public getType(): TTokenType {
        return this.#tokenType;
    }

    public setType(value: TTokenType): void {
        this.#tokenType = value;
    }

    public getSubType(): TTokenSubType {
        return this.#tokenSubType;
    }

    public setSubType(value: TTokenSubType): void {
        this.#tokenSubType = value;
    }
}
