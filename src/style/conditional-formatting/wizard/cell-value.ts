import { Conditional } from '../../conditional.ts';
import { CellMatcher } from '../cell-matcher.ts';
import { WizardAbstract } from './wizard-abstract.ts';
import { WIZARD_VALUE_TYPE_LITERAL } from './wizard-constants.ts';
import { type WizardInterface } from './wizard-interface.ts';

export class CellValue extends WizardAbstract implements WizardInterface {
    protected operator: string = Conditional.OPERATOR_EQUAL;
    protected operand: (number | string | boolean)[] = [0];
    protected operandValueType: string[] = [];

    constructor(cellRange: string) {
        super(cellRange);
    }

    public equals(value: number | string | boolean, operandValueType: string = WIZARD_VALUE_TYPE_LITERAL): this {
        this.setOperator(Conditional.OPERATOR_EQUAL);
        this.setOperand(0, value, operandValueType);
        return this;
    }

    public notEquals(value: number | string | boolean, operandValueType: string = WIZARD_VALUE_TYPE_LITERAL): this {
        this.setOperator(Conditional.OPERATOR_NOTEQUAL);
        this.setOperand(0, value, operandValueType);
        return this;
    }

    public greaterThan(value: number | string | boolean, operandValueType: string = WIZARD_VALUE_TYPE_LITERAL): this {
        this.setOperator(Conditional.OPERATOR_GREATERTHAN);
        this.setOperand(0, value, operandValueType);
        return this;
    }

    public greaterThanOrEqual(
        value: number | string | boolean,
        operandValueType: string = WIZARD_VALUE_TYPE_LITERAL,
    ): this {
        this.setOperator(Conditional.OPERATOR_GREATERTHANOREQUAL);
        this.setOperand(0, value, operandValueType);
        return this;
    }

    public lessThan(value: number | string | boolean, operandValueType: string = WIZARD_VALUE_TYPE_LITERAL): this {
        this.setOperator(Conditional.OPERATOR_LESSTHAN);
        this.setOperand(0, value, operandValueType);
        return this;
    }

    public lessThanOrEqual(
        value: number | string | boolean,
        operandValueType: string = WIZARD_VALUE_TYPE_LITERAL,
    ): this {
        this.setOperator(Conditional.OPERATOR_LESSTHANOREQUAL);
        this.setOperand(0, value, operandValueType);
        return this;
    }

    public between(value: number | string | boolean, operandValueType: string = WIZARD_VALUE_TYPE_LITERAL): this {
        this.setOperator(Conditional.OPERATOR_BETWEEN);
        this.setOperand(0, value, operandValueType);
        return this;
    }

    public notBetween(value: number | string | boolean, operandValueType: string = WIZARD_VALUE_TYPE_LITERAL): this {
        this.setOperator(Conditional.OPERATOR_NOTBETWEEN);
        this.setOperand(0, value, operandValueType);
        return this;
    }

    public and(value: number | string | boolean, operandValueType: string = WIZARD_VALUE_TYPE_LITERAL): this {
        if (!CellMatcher.COMPARISON_RANGE_OPERATORS[this.operator]) {
            throw new Error('AND Value is only appropriate for range operators');
        }
        this.setOperand(1, value, operandValueType);
        return this;
    }

    protected setOperator(operator: string): void {
        if (!CellMatcher.COMPARISON_OPERATORS[operator] && !CellMatcher.COMPARISON_RANGE_OPERATORS[operator]) {
            throw new Error('Invalid Operator for Cell Value CF Rule Wizard');
        }
        this.operator = operator;
    }

    protected setOperand(
        index: number,
        operand: number | string | boolean,
        operandValueType: string = WIZARD_VALUE_TYPE_LITERAL,
    ): void {
        this.operand[index] = operand;
        this.operandValueType[index] = operandValueType;
    }

    protected wrapValue(value: number | string | boolean | null, operandValueType: string): number | string {
        if (typeof value === 'string' && isNaN(Number(value))) {
            if (operandValueType === WIZARD_VALUE_TYPE_LITERAL) {
                return '"' + value.replace(/"/g, '""') + '"';
            }
            return this.cellConditionCheck(value);
        }

        if (value === null) {
            return 'NULL';
        }
        if (typeof value === 'boolean') {
            return value ? 'TRUE' : 'FALSE';
        }

        return value;
    }

    public getConditional(): Conditional {
        if (!CellMatcher.COMPARISON_RANGE_OPERATORS[this.operator]) {
            this.operand.splice(1);
            this.operandValueType.splice(1);
        }

        const values = this.operand.map((val, index) => this.wrapValue(val, this.operandValueType[index]!));

        const conditional = new Conditional();
        conditional.setConditionType(Conditional.CONDITION_CELLIS);
        conditional.setOperatorType(this.operator);
        conditional.setConditions(values);
        conditional.setStyle(this.getStyle());
        conditional.setStopIfTrue(this.getStopIfTrue());

        return conditional;
    }

    public static fromConditional(conditional: Conditional, cellRange: string = 'A1'): CellValue {
        const wizard = new CellValue(cellRange);
        wizard.setStyle(conditional.getStyle());
        wizard.setStopIfTrue(conditional.getStopIfTrue());
        wizard.setOperator(conditional.getOperatorType());

        const conditions = conditional.getConditions();
        const first = conditions[0];
        if (first !== undefined) {
            wizard.setOperand(0, first as number | string | boolean, WIZARD_VALUE_TYPE_LITERAL);
        }
        const second = conditions[1];
        if (second !== undefined) {
            wizard.setOperand(1, second as number | string | boolean, WIZARD_VALUE_TYPE_LITERAL);
        }
        return wizard;
    }
}
