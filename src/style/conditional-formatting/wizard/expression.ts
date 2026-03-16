import { Conditional } from '../../conditional.ts';
import { WizardAbstract } from './wizard-abstract.ts';
import { type WizardInterface } from './wizard-interface.ts';

export class Expression extends WizardAbstract implements WizardInterface {
    protected _expression: string = '';

    constructor(cellRange: string) {
        super(cellRange);
    }

    public expression(expression: string): this {
        this._expression = expression.startsWith('=') ? expression.slice(1) : expression;
        return this;
    }

    public formula(expression: string): this {
        return this.expression(expression);
    }

    public getConditional(): Conditional {
        const expression = this.adjustConditionsForCellReferences([this._expression])[0] as string;

        const conditional = new Conditional();
        conditional.setConditionType(Conditional.CONDITION_EXPRESSION);
        conditional.setConditions([expression]);
        conditional.setStyle(this.getStyle());
        conditional.setStopIfTrue(this.getStopIfTrue());

        return conditional;
    }

    public static fromConditional(conditional: Conditional, cellRange: string = 'A1'): Expression {
        if (conditional.getConditionType() !== Conditional.CONDITION_EXPRESSION) {
            throw new Error('Conditional is not an Expression CF Rule conditional');
        }

        const wizard = new Expression(cellRange);
        wizard.setStyle(conditional.getStyle());
        wizard.setStopIfTrue(conditional.getStopIfTrue());
        const conditions = conditional.getConditions();
        wizard.expression(WizardAbstract.reverseAdjustCellRef(String(conditions[0] ?? ''), cellRange));
        return wizard;
    }
}
