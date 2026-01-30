import { FormulaToken, TokenSubType, TokenType, type TTokenSubType, type TTokenType } from './formula-token.ts';

/**
 * Formula Parser.
 * Ported from PHP version.
 */
export class FormulaParser {
    // Character constants
    private static readonly QUOTE_DOUBLE = '"';
    private static readonly QUOTE_SINGLE = "'";
    private static readonly BRACKET_CLOSE = ']';
    private static readonly BRACKET_OPEN = '[';
    private static readonly BRACE_OPEN = '{';
    private static readonly BRACE_CLOSE = '}';
    private static readonly PAREN_OPEN = '(';
    private static readonly PAREN_CLOSE = ')';
    private static readonly SEMICOLON = ';';
    private static readonly WHITESPACE = ' ';
    private static readonly COMMA = ',';
    private static readonly ERROR_START = '#';

    private static readonly OPERATORS_INFIX = '+-*/^&=><';
    private static readonly OPERATORS_POSTFIX = '%';

    private formula: string;
    private tokens: FormulaToken[] = [];

    constructor(formula: string = '') {
        this.formula = formula.trim();
        this.parseToTokens();
    }

    /**
     * Get Tokens.
     */
    public getTokens(): FormulaToken[] {
        return this.tokens;
    }

    private parseToTokens(): void {
        const formulaLength = this.formula.length;
        if (formulaLength < 2 || this.formula.charAt(0) !== '=') {
            return;
        }

        const tokens1: FormulaToken[] = [];
        const stack: FormulaToken[] = [];
        let inString = false;
        let inPath = false;
        let inRange = false;
        let inError = false;

        let index = 1;
        let value = '';

        const ERRORS = ['#NULL!', '#DIV/0!', '#VALUE!', '#REF!', '#NAME?', '#NUM!', '#N/A'];
        const COMPARATORS_MULTI = ['>=', '<=', '<>'];
        const REGEX_STRUCTURED_REFERENCE = /^[A-Za-z_][A-Za-z0-9_]*\[/;

        while (index < formulaLength) {
            const char = this.formula.charAt(index);

            if (inString) {
                if (char === FormulaParser.QUOTE_DOUBLE) {
                    if (index + 1 < formulaLength && this.formula.charAt(index + 1) === FormulaParser.QUOTE_DOUBLE) {
                        value += FormulaParser.QUOTE_DOUBLE;
                        index++;
                    } else {
                        inString = false;
                        tokens1.push(new FormulaToken(value, TokenType.OPERAND, TokenSubType.TEXT));
                        value = '';
                    }
                } else {
                    value += char;
                }
                index++;
                continue;
            }

            if (inPath) {
                if (char === FormulaParser.QUOTE_SINGLE) {
                    if (index + 1 < formulaLength && this.formula.charAt(index + 1) === FormulaParser.QUOTE_SINGLE) {
                        value += FormulaParser.QUOTE_SINGLE;
                        index++;
                    } else {
                        inPath = false;
                    }
                } else {
                    value += char;
                }
                index++;
                continue;
            }

            if (inRange) {
                if (char === FormulaParser.BRACKET_CLOSE) {
                    inRange = false;
                }
                value += char;
                index++;
                continue;
            }

            if (inError) {
                value += char;
                index++;
                if (ERRORS.includes(value)) {
                    inError = false;
                    tokens1.push(new FormulaToken(value, TokenType.OPERAND, TokenSubType.ERROR));
                    value = '';
                }
                continue;
            }

            // independent character evaluation
            if (char === FormulaParser.QUOTE_DOUBLE) {
                if (value !== '') {
                    tokens1.push(new FormulaToken(value, TokenType.UNKNOWN));
                    value = '';
                }
                inString = true;
                index++;
                continue;
            }

            if (char === FormulaParser.QUOTE_SINGLE) {
                if (value !== '') {
                    tokens1.push(new FormulaToken(value, TokenType.UNKNOWN));
                    value = '';
                }
                inPath = true;
                index++;
                continue;
            }

            if (char === FormulaParser.BRACKET_OPEN) {
                // Check if it's a structured reference start
                const remainder = this.formula.substring(index);
                const isTableRef = value !== '' && /^[A-Za-z_][A-Za-z0-9_]*$/.test(value);

                if (remainder.startsWith('[@') || remainder.startsWith('[#') || isTableRef) {
                    // It's a structured reference
                    let bracketCount = 0;
                    let tempIndex = index;
                    while (tempIndex < formulaLength) {
                        const c = this.formula.charAt(tempIndex);
                        if (c === '[') bracketCount++;
                        else if (c === ']') bracketCount--;
                        value += c;
                        tempIndex++;
                        if (bracketCount === 0) break;
                    }
                    tokens1.push(new FormulaToken(value, TokenType.OPERAND, TokenSubType.STRUCTURED_REFERENCE));
                    value = '';
                    index = tempIndex;
                    continue;
                }

                inRange = true;
                value += FormulaParser.BRACKET_OPEN;
                index++;
                continue;
            }

            if (char === FormulaParser.ERROR_START) {
                if (value !== '') {
                    tokens1.push(new FormulaToken(value, TokenType.UNKNOWN));
                    value = '';
                }
                inError = true;
                value += FormulaParser.ERROR_START;
                index++;
                continue;
            }

            if (char === FormulaParser.BRACE_OPEN) {
                if (value !== '') {
                    tokens1.push(new FormulaToken(value, TokenType.UNKNOWN));
                    value = '';
                }
                const tmpArr = new FormulaToken('ARRAY', TokenType.FUNCTION, TokenSubType.START);
                tokens1.push(tmpArr);
                stack.push(new FormulaToken(tmpArr.getValue(), tmpArr.getType(), tmpArr.getSubType()));

                const tmpRow = new FormulaToken('ARRAYROW', TokenType.FUNCTION, TokenSubType.START);
                tokens1.push(tmpRow);
                stack.push(new FormulaToken(tmpRow.getValue(), tmpRow.getType(), tmpRow.getSubType()));
                index++;
                continue;
            }

            if (char === FormulaParser.SEMICOLON) {
                if (value !== '') {
                    tokens1.push(new FormulaToken(value, TokenType.OPERAND));
                    value = '';
                }
                const tmp = stack.pop();
                if (tmp) {
                    tmp.setValue('');
                    tmp.setSubType(TokenSubType.STOP);
                    tokens1.push(new FormulaToken(tmp.getValue(), tmp.getType(), tmp.getSubType()));
                }
                tokens1.push(new FormulaToken(',', TokenType.ARGUMENT));
                const tmpRow = new FormulaToken('ARRAYROW', TokenType.FUNCTION, TokenSubType.START);
                tokens1.push(tmpRow);
                stack.push(new FormulaToken(tmpRow.getValue(), tmpRow.getType(), tmpRow.getSubType()));
                index++;
                continue;
            }

            if (char === FormulaParser.BRACE_CLOSE) {
                if (value !== '') {
                    tokens1.push(new FormulaToken(value, TokenType.OPERAND));
                    value = '';
                }
                const tmp1 = stack.pop();
                if (tmp1) {
                    tmp1.setValue('');
                    tmp1.setSubType(TokenSubType.STOP);
                    tokens1.push(new FormulaToken(tmp1.getValue(), tmp1.getType(), tmp1.getSubType()));
                }
                const tmp2 = stack.pop();
                if (tmp2) {
                    tmp2.setValue('');
                    tmp2.setSubType(TokenSubType.STOP);
                    tokens1.push(new FormulaToken(tmp2.getValue(), tmp2.getType(), tmp2.getSubType()));
                }
                index++;
                continue;
            }

            if (char === FormulaParser.WHITESPACE) {
                if (value !== '') {
                    tokens1.push(new FormulaToken(value, TokenType.OPERAND));
                    value = '';
                }
                tokens1.push(new FormulaToken('', TokenType.WHITESPACE));
                index++;
                while (index < formulaLength && this.formula.charAt(index) === FormulaParser.WHITESPACE) {
                    index++;
                }
                continue;
            }

            if (index + 2 <= formulaLength) {
                const multi = this.formula.substring(index, index + 2);
                if (COMPARATORS_MULTI.includes(multi)) {
                    if (value !== '') {
                        tokens1.push(new FormulaToken(value, TokenType.OPERAND));
                        value = '';
                    }
                    tokens1.push(new FormulaToken(multi, TokenType.OPERATOR_INFIX, TokenSubType.LOGICAL));
                    index += 2;
                    continue;
                }
            }

            if (FormulaParser.OPERATORS_INFIX.includes(char)) {
                if (value !== '') {
                    tokens1.push(new FormulaToken(value, TokenType.OPERAND));
                    value = '';
                }
                tokens1.push(new FormulaToken(char, TokenType.OPERATOR_INFIX));
                index++;
                continue;
            }

            if (FormulaParser.OPERATORS_POSTFIX.includes(char)) {
                if (value !== '') {
                    tokens1.push(new FormulaToken(value, TokenType.OPERAND));
                    value = '';
                }
                tokens1.push(new FormulaToken(char, TokenType.OPERATOR_POSTFIX));
                index++;
                continue;
            }

            if (char === FormulaParser.PAREN_OPEN) {
                if (value !== '') {
                    const tmp = new FormulaToken(value, TokenType.FUNCTION, TokenSubType.START);
                    tokens1.push(tmp);
                    stack.push(new FormulaToken(tmp.getValue(), tmp.getType(), tmp.getSubType()));
                    value = '';
                } else {
                    const tmp = new FormulaToken('', TokenType.SUBEXPRESSION, TokenSubType.START);
                    tokens1.push(tmp);
                    stack.push(new FormulaToken(tmp.getValue(), tmp.getType(), tmp.getSubType()));
                }
                index++;
                continue;
            }

            if (char === FormulaParser.COMMA) {
                if (value !== '') {
                    tokens1.push(new FormulaToken(value, TokenType.OPERAND));
                    value = '';
                }
                const tmp = stack[stack.length - 1];
                if (tmp && tmp.getType() === TokenType.FUNCTION) {
                    tokens1.push(new FormulaToken(',', TokenType.ARGUMENT));
                }
                index++;
                continue;
            }

            if (char === FormulaParser.PAREN_CLOSE) {
                if (value !== '') {
                    tokens1.push(new FormulaToken(value, TokenType.OPERAND));
                    value = '';
                }
                const tmp = stack.pop();
                if (tmp) {
                    tmp.setValue('');
                    tmp.setSubType(TokenSubType.STOP);
                    tokens1.push(new FormulaToken(tmp.getValue(), tmp.getType(), tmp.getSubType()));
                }
                index++;
                continue;
            }

            value += char;
            index++;
        }

        if (value !== '') {
            tokens1.push(new FormulaToken(value, TokenType.OPERAND));
        }

        const tokens2: FormulaToken[] = [];
        for (let i = 0; i < tokens1.length; i++) {
            const token = tokens1[i] as FormulaToken;
            const previousToken = tokens1[i - 1];
            const nextToken = tokens1[i + 1];

            if (token.getType() !== TokenType.WHITESPACE) {
                tokens2.push(token);
                continue;
            }

            if (!previousToken || !nextToken) continue;

            if (
                !(
                    (previousToken.getType() === TokenType.FUNCTION &&
                        previousToken.getSubType() === TokenSubType.STOP) ||
                    (previousToken.getType() === TokenType.SUBEXPRESSION &&
                        previousToken.getSubType() === TokenSubType.STOP) ||
                    previousToken.getType() === TokenType.OPERAND
                )
            ) {
                continue;
            }

            if (
                !(
                    (nextToken.getType() === TokenType.FUNCTION && nextToken.getSubType() === TokenSubType.START) ||
                    (nextToken.getType() === TokenType.SUBEXPRESSION &&
                        nextToken.getSubType() === TokenSubType.START) ||
                    nextToken.getType() === TokenType.OPERAND
                )
            ) {
                continue;
            }

            tokens2.push(new FormulaToken(value, TokenType.OPERATOR_INFIX, TokenSubType.INTERSECTION));
        }

        this.tokens = [];
        for (let i = 0; i < tokens2.length; i++) {
            const token = tokens2[i] as FormulaToken;
            const previousToken = tokens2[i - 1];

            if (token.getType() === TokenType.OPERATOR_INFIX && token.getValue() === '-') {
                if (i === 0) {
                    token.setType(TokenType.OPERATOR_PREFIX);
                } else if (
                    (previousToken?.getType() === TokenType.FUNCTION &&
                        previousToken?.getSubType() === TokenSubType.STOP) ||
                    (previousToken?.getType() === TokenType.SUBEXPRESSION &&
                        previousToken?.getSubType() === TokenSubType.STOP) ||
                    previousToken?.getType() === TokenType.OPERATOR_POSTFIX ||
                    previousToken?.getType() === TokenType.OPERAND
                ) {
                    token.setSubType(TokenSubType.MATH);
                } else {
                    token.setType(TokenType.OPERATOR_PREFIX);
                }
                this.tokens.push(token);
                continue;
            }

            if (token.getType() === TokenType.OPERATOR_INFIX && token.getValue() === '+') {
                if (i === 0) continue;
                if (
                    (previousToken?.getType() === TokenType.FUNCTION &&
                        previousToken?.getSubType() === TokenSubType.STOP) ||
                    (previousToken?.getType() === TokenType.SUBEXPRESSION &&
                        previousToken?.getSubType() === TokenSubType.STOP) ||
                    previousToken?.getType() === TokenType.OPERATOR_POSTFIX ||
                    previousToken?.getType() === TokenType.OPERAND
                ) {
                    token.setSubType(TokenSubType.MATH);
                    this.tokens.push(token);
                }
                continue;
            }

            if (token.getType() === TokenType.OPERATOR_INFIX && token.getSubType() === TokenSubType.NOTHING) {
                if ('<>= '.includes(token.getValue().charAt(0))) {
                    token.setSubType(TokenSubType.LOGICAL);
                } else if (token.getValue() === '&') {
                    token.setSubType(TokenSubType.CONCATENATION);
                } else {
                    token.setSubType(TokenSubType.MATH);
                }
                this.tokens.push(token);
                continue;
            }

            if (token.getType() === TokenType.OPERAND && token.getSubType() === TokenSubType.NOTHING) {
                if (isNaN(Number(token.getValue()))) {
                    const upperValue = token.getValue().toUpperCase();
                    if (upperValue === 'TRUE' || upperValue === 'FALSE') {
                        token.setSubType(TokenSubType.LOGICAL);
                    } else {
                        token.setSubType(TokenSubType.RANGE);
                    }
                } else {
                    token.setSubType(TokenSubType.NUMBER);
                }
                this.tokens.push(token);
                continue;
            }

            if (token.getType() === TokenType.FUNCTION && token.getValue().startsWith('@')) {
                token.setValue(token.getValue().substring(1));
            }

            this.tokens.push(token);
        }
    }
}
