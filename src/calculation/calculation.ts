import { Worksheet } from '../core/worksheet.ts';
import { FormulaParser } from './formula-parser.ts';
import { Stack } from './token/stack.ts';
import { BranchPruner } from './engine/branch-pruner.ts';
import { TokenType, TokenSubType, FormulaToken } from './formula-token.ts';
import { Coordinate } from '../utils/coordinate.ts';
import { FunctionRegistry } from './function-registry.ts';
import { CalculationErrors } from './calculation-errors.ts';

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
                return CalculationErrors.CIRCULAR;
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
        const branchPruner = new BranchPruner();
        const stack = new Stack(branchPruner);
        const operatorStack: FormulaToken[] = [];

        const executeOperator = (operatorToken: FormulaToken) => {
            const op = operatorToken.value;
            if (operatorToken.type === TokenType.OPERATOR_PREFIX) {
                const operand = stack.pop();
                if (operand) {
                    let val = operand.value;
                    if (op === '-') val = -val;
                    stack.push(TokenType.OPERAND, val);
                }
            } else {
                this.#processInfixOperator(operatorToken, stack);
            }
        };

        let tokenIndex = 0;
        for (const token of tokens) {
            const isPruned = branchPruner.isPruned();

            switch (token.type) {
                case TokenType.OPERAND:
                    if (!isPruned) {
                        this.#processOperand(token, stack, worksheet);
                    } else {
                        stack.push(TokenType.OPERAND, null, 'NULL');
                    }
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
                        stack.push(TokenType.FUNCTION, token.value, 'START');
                        if (token.value.toUpperCase() === 'IF') {
                            branchPruner.pushIf(`IF_${tokenIndex}`);
                        }
                    } else if (token.subType === TokenSubType.STOP) {
                        while (operatorStack.length > 0) {
                            const top = operatorStack[operatorStack.length - 1];
                            if (top && top.type === TokenType.FUNCTION) break;
                            const op = operatorStack.pop();
                            if (op) executeOperator(op);
                        }
                        const startToken = operatorStack.pop(); // Pop START
                        if (startToken && startToken.value.toUpperCase() === 'IF') {
                            branchPruner.popIf();
                        }
                        this.#processFunctionStop(stack, worksheet);
                    }
                    break;

                case TokenType.ARGUMENT:
                    while (operatorStack.length > 0) {
                        const top = operatorStack[operatorStack.length - 1];
                        if (top && top.type === TokenType.FUNCTION) {
                            if (top.value.toUpperCase() === 'IF') {
                                const argCount = this.#countArgumentsSinceStart(stack);
                                if (argCount === 1) { // Finished condition
                                    const conditionResult = stack.last()?.value;
                                    branchPruner.setConditionResult(Boolean(conditionResult));
                                    branchPruner.enterThen();
                                } else if (argCount === 2) { // Finished then-branch
                                    branchPruner.enterElse();
                                }
                            }
                            break;
                        }
                        const op = operatorStack.pop();
                        if (op) executeOperator(op);
                    }
                    stack.push(TokenType.ARGUMENT, null, 'ARG');
                    break;
            }
            tokenIndex++;
        }

        while (operatorStack.length > 0) {
            executeOperator(operatorStack.pop()!);
        }

        const result = stack.pop();
        return result ? result.value : null;
    }

    #countArgumentsSinceStart(stack: Stack): number {
        let count = 1;
        for (let i = 1; ; i++) {
            const item = stack.last(i);
            if (!item || item.reference === 'START') break;
            if (item.reference === 'ARG') count++;
        }
        return count;
    }

    #processSubexpressionStop(stack: Stack): void {
        const operands = [];
        let item = stack.pop();
        while (item && item.reference !== 'START') {
            operands.push(item.value);
            item = stack.pop();
        }
        stack.push(TokenType.OPERAND, operands[0]);
    }

    #processFunctionStop(stack: Stack, worksheet?: Worksheet): void {
        const args = [];
        let item = stack.pop();
        while (item && item.reference !== 'START') {
            if (item.reference !== 'ARG') {
                args.push(item.value);
            }
            item = stack.pop();
        }

        if (!item || (item.type !== TokenType.FUNCTION && item.type !== TokenType.SUBEXPRESSION)) {
            stack.push(TokenType.OPERAND, CalculationErrors.VALUE);
            return;
        }

        if (item.type === TokenType.SUBEXPRESSION) {
            stack.push(TokenType.OPERAND, args[0]);
            return;
        }

        const functionName = item.value;
        args.reverse();

        const result = this.#executeFunction(functionName, args, worksheet);
        stack.push(TokenType.OPERAND, result);
    }

    #executeFunction(functionName: string, args: any[], worksheet?: Worksheet): any {
        const metadata = this.#functionRegistry.get(functionName);
        if (metadata) {
            const validation = this.#functionRegistry.validateArgumentCount(functionName, args.length);
            if (validation !== true) {
                return validation;
            }
            return metadata.implementation(args);
        }
        return `${CalculationErrors.NAME} (${functionName})`;
    }

    #processOperand(token: FormulaToken, stack: Stack, worksheet?: Worksheet): void {
        let value: any = token.value;

        if (token.subType === TokenSubType.NUMBER) {
            value = Number(value);
        } else if (token.subType === TokenSubType.LOGICAL) {
            value = value.toUpperCase() === 'TRUE';
        } else if (token.subType === TokenSubType.RANGE) {
            if (worksheet) {
                // Check if it's a named range first
                const workbook = worksheet.getParent();
                const namedRange = workbook.getNamedRange(value, worksheet);
                if (namedRange) {
                    value = this.#resolveReference(namedRange.getValue(), worksheet);
                } else {
                    value = this.#resolveReference(value, worksheet);
                }
            }
        }

        stack.push(token.type, value);
    }

    #processInfixOperator(token: FormulaToken, stack: Stack): void {
        const operand2 = stack.pop();
        const operand1 = stack.pop();

        if (!operand1 || !operand2) {
            return;
        }

        let result: any;
        switch (token.value) {
            case '+':
                result = (Number(operand1.value) || 0) + (Number(operand2.value) || 0);
                break;
            case '-':
                result = (Number(operand1.value) || 0) - (Number(operand2.value) || 0);
                break;
            case '*':
                result = (Number(operand1.value) || 0) * (Number(operand2.value) || 0);
                break;
            case '/':
                const val2 = Number(operand2.value);
                if (val2 === 0) {
                    result = CalculationErrors.DIV0;
                } else {
                    result = (Number(operand1.value) || 0) / val2;
                }
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

        stack.push(TokenType.OPERAND, result);
    }

    #resolveReference(reference: string, worksheet: Worksheet): any {
        let targetWorksheet = worksheet;

        if (reference.includes('!')) {
            const parts = reference.split('!');
            const sheetName = parts[0]?.replace(/^'|'$/g, '');
            const cellRef = parts[1];

            if (sheetName && cellRef) {
                const workbook = worksheet.getParent();
                const sheet = workbook.getSheetByName(sheetName);
                if (sheet) {
                    targetWorksheet = sheet;
                    reference = cellRef;
                } else {
                    return CalculationErrors.REF;
                }
            }
        }

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
                    rowData.push(targetWorksheet.getCell(coord).getValue());
                }
                result.push(rowData);
            }
            return result;
        }

        const cell = targetWorksheet.getCell(reference);
        return cell.getValue();
    }
}
