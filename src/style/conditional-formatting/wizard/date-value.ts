import { Conditional } from '../../conditional.ts';
import { WizardAbstract } from './wizard-abstract.ts';
import { type WizardInterface } from './wizard-interface.ts';

export class DateValue extends WizardAbstract implements WizardInterface {
    protected static readonly EXPRESSIONS: Record<string, string> = {
        [Conditional.TIMEPERIOD_YESTERDAY]: 'FLOOR(%s,1)=TODAY()-1',
        [Conditional.TIMEPERIOD_TODAY]: 'FLOOR(%s,1)=TODAY()',
        [Conditional.TIMEPERIOD_TOMORROW]: 'FLOOR(%s,1)=TODAY()+1',
        [Conditional.TIMEPERIOD_LAST_7_DAYS]: 'AND(TODAY()-FLOOR(%s,1)<=6,FLOOR(%s,1)<=TODAY())',
        [Conditional.TIMEPERIOD_LAST_WEEK]:
            'AND(TODAY()-ROUNDDOWN(%s,0)>=(WEEKDAY(TODAY())),TODAY()-ROUNDDOWN(%s,0)<(WEEKDAY(TODAY())+7))',
        [Conditional.TIMEPERIOD_THIS_WEEK]:
            'AND(TODAY()-ROUNDDOWN(%s,0)<=WEEKDAY(TODAY())-1,ROUNDDOWN(%s,0)-TODAY()<=7-WEEKDAY(TODAY()))',
        [Conditional.TIMEPERIOD_NEXT_WEEK]:
            'AND(ROUNDDOWN(%s,0)-TODAY()>(7-WEEKDAY(TODAY())),ROUNDDOWN(%s,0)-TODAY()<(15-WEEKDAY(TODAY())))',
        [Conditional.TIMEPERIOD_LAST_MONTH]:
            'AND(MONTH(%s)=MONTH(EDATE(TODAY(),0-1)),YEAR(%s)=YEAR(EDATE(TODAY(),0-1)))',
        [Conditional.TIMEPERIOD_THIS_MONTH]: 'AND(MONTH(%s)=MONTH(TODAY()),YEAR(%s)=YEAR(TODAY()))',
        [Conditional.TIMEPERIOD_NEXT_MONTH]:
            'AND(MONTH(%s)=MONTH(EDATE(TODAY(),0+1)),YEAR(%s)=YEAR(EDATE(TODAY(),0+1)))',
    };

    protected operator: string = '';

    constructor(cellRange: string) {
        super(cellRange);
    }

    public yesterday(): this {
        return this.setOperator(Conditional.TIMEPERIOD_YESTERDAY);
    }
    public today(): this {
        return this.setOperator(Conditional.TIMEPERIOD_TODAY);
    }
    public tomorrow(): this {
        return this.setOperator(Conditional.TIMEPERIOD_TOMORROW);
    }
    public lastSevenDays(): this {
        return this.setOperator(Conditional.TIMEPERIOD_LAST_7_DAYS);
    }
    public last7Days(): this {
        return this.setOperator(Conditional.TIMEPERIOD_LAST_7_DAYS);
    }
    public lastWeek(): this {
        return this.setOperator(Conditional.TIMEPERIOD_LAST_WEEK);
    }
    public thisWeek(): this {
        return this.setOperator(Conditional.TIMEPERIOD_THIS_WEEK);
    }
    public nextWeek(): this {
        return this.setOperator(Conditional.TIMEPERIOD_NEXT_WEEK);
    }
    public lastMonth(): this {
        return this.setOperator(Conditional.TIMEPERIOD_LAST_MONTH);
    }
    public thisMonth(): this {
        return this.setOperator(Conditional.TIMEPERIOD_THIS_MONTH);
    }
    public nextMonth(): this {
        return this.setOperator(Conditional.TIMEPERIOD_NEXT_MONTH);
    }

    protected setOperator(operator: string): this {
        this.operator = operator;
        return this;
    }

    protected getExpression(): string {
        const format = DateValue.EXPRESSIONS[this.operator];
        if (!format) {
            throw new Error(`Invalid operator for DateValue wizard: ${this.operator}`);
        }

        // Replace all occurrences of %s with the reference cell
        return format.replace(/%s/g, this.referenceCell);
    }

    public getConditional(): Conditional {
        const expression = this.getExpression();

        const conditional = new Conditional();
        conditional.setConditionType(Conditional.CONDITION_TIMEPERIOD);
        conditional.setText(this.operator);
        conditional.setConditions([expression]);
        conditional.setStyle(this.getStyle());
        conditional.setStopIfTrue(this.getStopIfTrue());

        return conditional;
    }

    public static fromConditional(conditional: Conditional, cellRange: string = 'A1'): DateValue {
        const wizard = new DateValue(cellRange);
        wizard.setStyle(conditional.getStyle());
        wizard.setStopIfTrue(conditional.getStopIfTrue());
        const text = conditional.getText();
        if (text) {
            wizard.setOperator(text);
        }
        return wizard;
    }
}
