import { Conditional } from '../../conditional.ts';
import { Wizard } from '../wizard.ts';
import { WizardAbstract } from './wizard-abstract.ts';
import { type WizardInterface } from './wizard-interface.ts';

export class Errors extends WizardAbstract implements WizardInterface {
    protected static readonly EXPRESSIONS: Record<string, string> = {
        [Wizard.NOT_ERRORS]: 'NOT(ISERROR(%s))',
        [Wizard.ERRORS]: 'ISERROR(%s)',
    };

    protected inverse: boolean;

    constructor(cellRange: string, inverse: boolean = false) {
        super(cellRange);
        this.inverse = inverse;
    }

    public notError(): this {
        this.inverse = false;
        return this;
    }

    public isError(): this {
        this.inverse = true;
        return this;
    }

    protected getExpression(): string {
        const format = Errors.EXPRESSIONS[this.inverse ? Wizard.ERRORS : Wizard.NOT_ERRORS]!;
        return format.replace('%s', this.referenceCell);
    }

    public getConditional(): Conditional {
        const expression = this.getExpression();

        const conditional = new Conditional();
        conditional.setConditionType(
            this.inverse ? Conditional.CONDITION_CONTAINSERRORS : Conditional.CONDITION_NOTCONTAINSERRORS,
        );
        conditional.setConditions([expression]);
        conditional.setStyle(this.getStyle());
        conditional.setStopIfTrue(this.getStopIfTrue());

        return conditional;
    }
}
