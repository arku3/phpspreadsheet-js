import { Worksheet } from '../core/worksheet.ts';
import { FormulaParser } from './formula-parser.ts';
import { Stack } from './token/stack.ts';
import { BranchPruner } from './engine/branch-pruner.ts';
import { TokenType, TokenSubType, FormulaToken } from './formula-token.ts';
import { Coordinate } from '../utils/coordinate.ts';
import { FunctionRegistry } from './function-registry.ts';

/**
 * Main Calculation Engine.
 */
export class Calculation {
    #branchPruner: BranchPruner;
    #stack: Stack;
    #functionRegistry: FunctionRegistry;
    #cyclicReferenceStack: Set<string> = new Set();

    constructor() {
        this.#branchPruner = new BranchPruner();
        this.#stack = new Stack(this.#branchPruner);
        this.#functionRegistry = new FunctionRegistry();
    }

    /**
     * Calculate formula value.
     */
    public calculateFormula(formula: string, worksheet?: Worksheet, cellID?: string): any {
        if (cellID) {
            if (this.#cyclicReferenceStack.has(cellID)) {
                return '#CIRCULAR!';
            }
            this.#cyclicReferenceStack.add(cellID);
        }

        try {
            const parser = new FormulaParser(formula);
            const tokens = parser.getTokens();

            return this.processTokenStack(tokens, worksheet);
        } finally {
            if (cellID) {
                this.#cyclicReferenceStack.delete(cellID);
            }
        }
    }

    private static readonly PRECEDENCE: Record<string, number> = {
        '^': 4,
        '*': 3,
        '/': 3,
        '+': 2,
        '-': 2,
        '&': 1,
        '>': 0,
        '<': 0,
        '>=': 0,
        '<=': 0,
        '=': 0,
        '<>': 0,
    };

    /**
     * Process Token Stack.
     */
    private processTokenStack(tokens: FormulaToken[], worksheet?: Worksheet): any {
        this.#stack.clear();
        const operatorStack: FormulaToken[] = [];

        const executeOperator = (operatorToken: FormulaToken) => {
            const op = operatorToken.value;
            if (operatorToken.type === TokenType.OPERATOR_PREFIX) {
                const operand = this.#stack.pop();
                if (operand) {
                    let val = operand.value;
                    if (op === '-') val = -val;
                    this.#stack.push(TokenType.OPERAND, val);
                }
            } else {
                this.#processInfixOperator(operatorToken);
            }
        };

        for (const token of tokens) {
            // console.log(`Processing token: ${token.type} ${token.subType} ${token.value}`);
            switch (token.type) {
                case TokenType.OPERAND:
                    this.#processOperand(token, worksheet);
                    break;

                case TokenType.OPERATOR_PREFIX:
                case TokenType.OPERATOR_INFIX:
                    const p1 = Calculation.PRECEDENCE[token.value] ?? 0;
                    while (operatorStack.length > 0) {
                        const top = operatorStack[operatorStack.length - 1];
                        if (!top || top.type === TokenType.SUBEXPRESSION || top.type === TokenType.FUNCTION) break;
                        const p2 = Calculation.PRECEDENCE[top.value] ?? 0;
                        if (p2 >= p1) {
                            const op = operatorStack.pop();
                            if (op) executeOperator(op);
                        } else {
                            break;
                        }
                    }
                    operatorStack.push(token);
                    break;

                case TokenType.SUBEXPRESSION:
                    if (token.subType === TokenSubType.START) {
                        operatorStack.push(token);
                    } else if (token.subType === TokenSubType.STOP) {
                        while (operatorStack.length > 0) {
                            const top = operatorStack[operatorStack.length - 1];
                            if (top && top.type === TokenType.SUBEXPRESSION) break;
                            const op = operatorStack.pop();
                            if (op) executeOperator(op);
                        }
                        operatorStack.pop(); // Pop START
                    }
                    break;

                case TokenType.FUNCTION:
                    if (token.subType === TokenSubType.START) {
                        operatorStack.push(token);
                        this.#stack.push(TokenType.FUNCTION, token.value, 'START');
                    } else if (token.subType === TokenSubType.STOP) {
                        while (operatorStack.length > 0) {
                            const top = operatorStack[operatorStack.length - 1];
                            if (top && top.type === TokenType.FUNCTION) break;
                            const op = operatorStack.pop();
                            if (op) executeOperator(op);
                        }
                        operatorStack.pop(); // Pop START
                        this.#processFunctionStop(worksheet);
                    }
                    break;

                case TokenType.ARGUMENT:
                    while (operatorStack.length > 0) {
                        const top = operatorStack[operatorStack.length - 1];
                        if (top && top.type === TokenType.FUNCTION) break;
                        const op = operatorStack.pop();
                        if (op) executeOperator(op);
                    }
                    // No need to push ARGUMENT to stack, we just need to clear operators
                    break;
            }
        }

        while (operatorStack.length > 0) {
            executeOperator(operatorStack.pop()!);
        }

        const result = this.#stack.pop();
        return result ? result.value : null;
    }

    #processSubexpressionStop(): void {
        const operands = [];
        let item = this.#stack.pop();
        while (item && item.reference !== 'START') {
            operands.push(item.value);
            item = this.#stack.pop();
        }
        // Subexpression usually has one value inside
        this.#stack.push(TokenType.OPERAND, operands[0]);
    }

    #processFunctionStop(worksheet?: Worksheet): void {
        const args = [];
        let item = this.#stack.pop();
        while (item && item.reference !== 'START') {
            args.push(item.value);
            item = this.#stack.pop();
        }

        if (!item || item.type !== TokenType.FUNCTION) {
            this.#stack.push(TokenType.OPERAND, '#VALUE!');
            return;
        }

        const functionName = item.value;
        args.reverse();
        // console.log(`Executing function ${functionName} with args:`, JSON.stringify(args));

        // Dispatch to function
        const result = this.#executeFunction(functionName, args, worksheet);
        // console.log(`Function ${functionName} result:`, result);
        this.#stack.push(TokenType.OPERAND, result);
    }

    #executeFunction(functionName: string, args: any[], worksheet?: Worksheet): any {
        const implementation = this.#functionRegistry.get(functionName);
        if (implementation) {
            return implementation(args);
        }
        return `#NAME? (${functionName})`;
    }

    #processOperand(token: FormulaToken, worksheet?: Worksheet): void {
        let value: any = token.value;

        if (token.subType === TokenSubType.NUMBER) {
            value = Number(value);
        } else if (token.subType === TokenSubType.LOGICAL) {
            value = value.toUpperCase() === 'TRUE';
        } else if (token.subType === TokenSubType.RANGE) {
            if (worksheet) {
                value = this.#resolveReference(value, worksheet);
            }
        }

        this.#stack.push(token.type, value);
    }

    #processInfixOperator(token: FormulaToken): void {
        const operand2 = this.#stack.pop();
        const operand1 = this.#stack.pop();

        if (!operand1 || !operand2) {
            return;
        }

        let result: any;
        switch (token.value) {
            case '+':
                result = (operand1.value || 0) + (operand2.value || 0);
                break;
            case '-':
                result = (operand1.value || 0) - (operand2.value || 0);
                break;
            case '*':
                result = (operand1.value || 0) * (operand2.value || 0);
                break;
            case '/':
                result = (Number(operand1.value) || 0) / (Number(operand2.value) || 1);
                break;
            case '^':
                result = Math.pow(Number(operand1.value) || 0, Number(operand2.value) || 0);
                break;
            case '&':
                result = String(operand1.value || '') + String(operand2.value || '');
                break;
            case '>':
                result = (operand1.value || 0) > (operand2.value || 0);
                break;
            case '<':
                result = (operand1.value || 0) < (operand2.value || 0);
                break;
            case '>=':
                result = (operand1.value || 0) >= (operand2.value || 0);
                break;
            case '<=':
                result = (operand1.value || 0) <= (operand2.value || 0);
                break;
            case '=':
                result = (operand1.value || 0) == (operand2.value || 0);
                break;
            case '<>':
                result = (operand1.value || 0) != (operand2.value || 0);
                break;
        }

        this.#stack.push(TokenType.OPERAND, result);
    }

    #resolveReference(reference: string, worksheet: Worksheet): any {
        if (reference.includes(':')) {
            const parts = reference.split(':');
            const start = parts[0];
            const end = parts[1];

            if (!start || !end) {
                return 0;
            }

            const [startCol, startRow] = Coordinate.coordinateFromString(start);
            const [endCol, endRow] = Coordinate.coordinateFromString(end);

            const minCol = Math.min(startCol, endCol);
            const maxCol = Math.max(startCol, endCol);
            const minRow = Math.min(startRow, endRow);
            const maxRow = Math.max(startRow, endRow);

            const result = [];
            for (let r = minRow; r <= maxRow; r++) {
                const rowData = [];
                for (let c = minCol; c <= maxCol; c++) {
                    const coord = Coordinate.stringFromCoordinate(c, r);
                    rowData.push(worksheet.getCell(coord).getValue());
                }
                result.push(rowData);
            }
            return result;
        }

        // Simple A1 resolution
        const cell = worksheet.getCell(reference);
        return cell.getValue();
    }
}
