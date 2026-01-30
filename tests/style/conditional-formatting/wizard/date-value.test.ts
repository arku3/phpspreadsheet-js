import { describe, expect, it } from 'bun:test';
import { DateValue } from '../../../../src/style/conditional-formatting/wizard/date-value.ts';
import { Conditional } from '../../../../src/style/conditional.ts';

describe('DateValue Wizard', () => {
    it('should create a today condition', () => {
        const wizard = new DateValue('A1:A5');
        wizard.today();

        const conditional = wizard.getConditional();
        expect(conditional.getConditionType()).toBe(Conditional.CONDITION_TIMEPERIOD);
        expect(conditional.getText()).toBe(Conditional.TIMEPERIOD_TODAY);
        expect(conditional.getConditions()[0]).toBe('FLOOR(A1,1)=TODAY()');
    });

    it('should create a last seven days condition', () => {
        const wizard = new DateValue('B2:B10');
        wizard.lastSevenDays();

        const conditional = wizard.getConditional();
        expect(conditional.getConditions()[0]).toBe(
            'AND(TODAY()-FLOOR(B2,1)<=6,FLOOR(B2,1)<=TODAY())',
        );
    });

    it('should create a next month condition', () => {
        const wizard = new DateValue('C1');
        wizard.nextMonth();

        const conditional = wizard.getConditional();
        expect(conditional.getConditions()[0]).toBe(
            'AND(MONTH(C1)=MONTH(EDATE(TODAY(),0+1)),YEAR(C1)=YEAR(EDATE(TODAY(),0+1)))',
        );
    });
});
