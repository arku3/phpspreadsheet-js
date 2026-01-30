import { Conditional } from '../../conditional.ts';
import { Wizard } from '../wizard.ts';
import { WizardAbstract } from './wizard-abstract.ts';
import { type WizardInterface } from './wizard-interface.ts';

export class TextValue extends WizardAbstract implements WizardInterface {
    protected static readonly OPERATORS: Record<string, string> = {
        [Conditional.OPERATOR_CONTAINSTEXT]: Conditional.CONDITION_CONTAINSTEXT,
        ['notContains']: Conditional.CONDITION_NOTCONTAINSTEXT,
        [Conditional.OPERATOR_BEGINSWITH]: Conditional.CONDITION_BEGINSWITH,
        [Conditional.OPERATOR_ENDSWITH]: Conditional.CONDITION_ENDSWITH,
    };

    protected static readonly EXPRESSIONS: Record<string, string> = {
        [Conditional.OPERATOR_CONTAINSTEXT]: 'NOT(ISERROR(SEARCH(%s,%s)))',
        ['notContains']: 'ISERROR(SEARCH(%s,%s))',
        [Conditional.OPERATOR_BEGINSWITH]: 'LEFT(%s,LEN(%s))=%s',
        [Conditional.OPERATOR_ENDSWITH]: 'RIGHT(%s,LEN(%s))=%s',
    };

    protected operator: string = '';
    protected operand: string = '';
    protected operandValueType: string = Wizard.VALUE_TYPE_LITERAL;

    constructor(cellRange: string) {
        super(cellRange);
    }

    public contains(value: string, operandValueType: string = Wizard.VALUE_TYPE_LITERAL): this {
        this.setOperator(Conditional.OPERATOR_CONTAINSTEXT);
        this.setOperand(value, operandValueType);
        return this;
    }

    public doesNotContain(value: string, operandValueType: string = Wizard.VALUE_TYPE_LITERAL): this {
        this.setOperator('notContains');
        this.setOperand(value, operandValueType);
        return this;
    }

    public beginsWith(value: string, operandValueType: string = Wizard.VALUE_TYPE_LITERAL): this {
        this.setOperator(Conditional.OPERATOR_BEGINSWITH);
        this.setOperand(value, operandValueType);
        return this;
    }

    public endsWith(value: string, operandValueType: string = Wizard.VALUE_TYPE_LITERAL): this {
        this.setOperator(Conditional.OPERATOR_ENDSWITH);
        this.setOperand(value, operandValueType);
        return this;
    }

    protected setOperator(operator: string): void {
        if (!TextValue.OPERATORS[operator]) {
            throw new Error('Invalid Operator for Text Value CF Rule Wizard');
        }
        this.operator = operator;
    }

    protected setOperand(operand: string, operandValueType: string = Wizard.VALUE_TYPE_LITERAL): void {
        this.operand = operand;
        this.operandValueType = operandValueType;
    }

    protected wrapValue(value: string): string {
        return '"' + value.replace(/"/g, '""') + '"';
    }

    protected getExpression(): string {
        const operand =
            this.operandValueType === Wizard.VALUE_TYPE_LITERAL
                ? this.wrapValue(this.operand)
                : this.cellConditionCheck(this.operand);

        const format = TextValue.EXPRESSIONS[this.operator]!;
        if (this.operator === Conditional.OPERATOR_CONTAINSTEXT || this.operator === 'notContains') {
            return format.replace('%s', operand).replace('%s', this.referenceCell);
        }
        // For beginsWith and endsWith, we have 3 placeholders in PHP but they are the same value for 2nd and 3rd
        // LEFT(%s,LEN(%s))=%s
        return format.replace('%s', this.referenceCell).replace('%s', operand).replace('%s', operand);
    }

    public getConditional(): Conditional {
        const expression = this.getExpression();

        const conditional = new Conditional();
        conditional.setConditionType(TextValue.OPERATORS[this.operator]!);
        conditional.setOperatorType(this.operator);
        conditional.setText(
            this.operandValueType !== Wizard.VALUE_TYPE_LITERAL ? this.cellConditionCheck(this.operand) : this.operand,
        );
        conditional.setConditions([expression]);
        conditional.setStyle(this.getStyle());
        conditional.setStopIfTrue(this.getStopIfTrue());

        return conditional;
    }
}
