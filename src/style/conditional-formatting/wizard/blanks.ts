import { Conditional } from '../../conditional.ts';
import { Wizard } from '../wizard.ts';
import { WizardAbstract } from './wizard-abstract.ts';
import { type WizardInterface } from './wizard-interface.ts';

export class Blanks extends WizardAbstract implements WizardInterface {
    protected static readonly EXPRESSIONS: Record<string, string> = {
        [Wizard.NOT_BLANKS]: 'LEN(TRIM(%s))>0',
        [Wizard.BLANKS]: 'LEN(TRIM(%s))=0',
    };

    protected inverse: boolean;

    constructor(cellRange: string, inverse: boolean = false) {
        super(cellRange);
        this.inverse = inverse;
    }

    public notBlank(): this {
        this.inverse = false;
        return this;
    }

    public notEmpty(): this {
        this.inverse = false;
        return this;
    }

    public isBlank(): this {
        this.inverse = true;
        return this;
    }

    public isEmpty(): this {
        this.inverse = true;
        return this;
    }

    protected getExpression(): string {
        const format = Blanks.EXPRESSIONS[this.inverse ? Wizard.BLANKS : Wizard.NOT_BLANKS]!;
        return format.replace('%s', this.referenceCell);
    }

    public getConditional(): Conditional {
        const expression = this.getExpression();

        const conditional = new Conditional();
        conditional.setConditionType(
            this.inverse
                ? Conditional.CONDITION_CONTAINSBLANKS
                : Conditional.CONDITION_NOTCONTAINSBLANKS,
        );
        conditional.setConditions([expression]);
        conditional.setStyle(this.getStyle());
        conditional.setStopIfTrue(this.getStopIfTrue());

        return conditional;
    }
}
