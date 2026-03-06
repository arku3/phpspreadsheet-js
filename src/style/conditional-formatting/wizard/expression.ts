import { Conditional } from '../../conditional.ts';
import { WizardAbstract } from './wizard-abstract.ts';
import { type WizardInterface } from './wizard-interface.ts';

export class Expression extends WizardAbstract implements WizardInterface {
    protected _expression: string = '';

    constructor(cellRange: string) {
        super(cellRange);
    }

    public expression(expression: string): this {
        this._expression = expression;
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
        const wizard = new Expression(cellRange);
        wizard.setStyle(conditional.getStyle());
        wizard.setStopIfTrue(conditional.getStopIfTrue());
        const conditions = conditional.getConditions();
        wizard.expression(String(conditions[0] ?? ''));
        return wizard;
    }
}
