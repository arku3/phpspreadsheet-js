import { describe, expect, it } from 'bun:test';
import { TextValue } from '../../../../src/style/conditional-formatting/wizard/text-value.ts';
import { Conditional } from '../../../../src/style/conditional.ts';

describe('TextValue Wizard', () => {
    it('should create a contains condition', () => {
        const wizard = new TextValue('A1:A5');
        wizard.contains('foo');

        const conditional = wizard.getConditional();
        expect(conditional.getConditionType()).toBe(Conditional.CONDITION_CONTAINSTEXT);
        expect(conditional.getOperatorType()).toBe(Conditional.OPERATOR_CONTAINSTEXT);
        expect(conditional.getText()).toBe('foo');
        expect(conditional.getConditions()[0]).toBe('NOT(ISERROR(SEARCH("foo",A1)))');
    });

    it('should create a beginsWith condition', () => {
        const wizard = new TextValue('B2:B10');
        wizard.beginsWith('start');

        const conditional = wizard.getConditional();
        expect(conditional.getConditionType()).toBe(Conditional.CONDITION_BEGINSWITH);
        expect(conditional.getConditions()[0]).toBe('LEFT(B2,LEN("start"))="start"');
    });

    it('should handle cell references', () => {
        const wizard = new TextValue('A1');
        wizard.contains('C1', 'cell');

        const conditional = wizard.getConditional();
        expect(conditional.getConditions()[0]).toBe('NOT(ISERROR(SEARCH(C1,A1)))');
    });
});
