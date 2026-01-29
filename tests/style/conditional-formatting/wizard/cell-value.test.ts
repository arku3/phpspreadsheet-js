import { describe, it, expect } from 'bun:test';
import { CellValue } from '../../../../src/style/conditional-formatting/wizard/cell-value.ts';
import { Conditional } from '../../../../src/style/conditional.ts';

describe('CellValue Wizard', () => {
    it('should create a basic equal condition', () => {
        const wizard = new CellValue('A1:A5');
        wizard.equals(10);
        
        const conditional = wizard.getConditional();
        expect(conditional.getConditionType()).toBe(Conditional.CONDITION_CELLIS);
        expect(conditional.getOperatorType()).toBe(Conditional.OPERATOR_EQUAL);
        expect(conditional.getConditions()).toEqual([10]);
    });

    it('should create a between condition', () => {
        const wizard = new CellValue('A1:A5');
        wizard.between(10).and(20);
        
        const conditional = wizard.getConditional();
        expect(conditional.getOperatorType()).toBe(Conditional.OPERATOR_BETWEEN);
        expect(conditional.getConditions()).toEqual([10, 20]);
    });

    it('should wrap string literals in quotes', () => {
        const wizard = new CellValue('A1:A5');
        wizard.equals('hello');
        
        const conditional = wizard.getConditional();
        expect(conditional.getConditions()).toEqual(['"hello"']);
    });
});
