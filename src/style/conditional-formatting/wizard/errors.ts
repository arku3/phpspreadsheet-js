import { Conditional } from '../../conditional.ts';
import { WizardAbstract } from './wizard-abstract.ts';
import { WIZARD_ERRORS, WIZARD_NOT_ERRORS } from './wizard-constants.ts';
import { type WizardInterface } from './wizard-interface.ts';

export class Errors extends WizardAbstract implements WizardInterface {
    protected static readonly EXPRESSIONS: Record<string, string> = {
        [WIZARD_NOT_ERRORS]: 'NOT(ISERROR(%s))',
        [WIZARD_ERRORS]: 'ISERROR(%s)',
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
        const format = Errors.EXPRESSIONS[this.inverse ? WIZARD_ERRORS : WIZARD_NOT_ERRORS]!;
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

    public static fromConditional(conditional: Conditional, cellRange: string = 'A1'): Errors {
        const inverse = conditional.getConditionType() === Conditional.CONDITION_CONTAINSERRORS;
        const wizard = new Errors(cellRange, inverse);
        wizard.setStyle(conditional.getStyle());
        wizard.setStopIfTrue(conditional.getStopIfTrue());
        return wizard;
    }
}
