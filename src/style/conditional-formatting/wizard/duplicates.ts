import { Conditional } from '../../conditional.ts';
import { WizardAbstract } from './wizard-abstract.ts';
import { type WizardInterface } from './wizard-interface.ts';

export class Duplicates extends WizardAbstract implements WizardInterface {
    protected inverse: boolean;

    constructor(cellRange: string, inverse: boolean = false) {
        super(cellRange);
        this.inverse = inverse;
    }

    public duplicates(): this {
        this.inverse = false;
        return this;
    }

    public unique(): this {
        this.inverse = true;
        return this;
    }

    public getConditional(): Conditional {
        const conditional = new Conditional();
        conditional.setConditionType(this.inverse ? Conditional.CONDITION_UNIQUE : Conditional.CONDITION_DUPLICATES);
        conditional.setStyle(this.getStyle());
        conditional.setStopIfTrue(this.getStopIfTrue());

        return conditional;
    }
}
