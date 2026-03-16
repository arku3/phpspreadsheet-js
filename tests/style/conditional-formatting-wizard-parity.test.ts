import { describe, expect, it } from 'bun:test';
import { Wizard } from '../../src/style/conditional-formatting/wizard.ts';
import { Expression } from '../../src/style/conditional-formatting/wizard/expression.ts';
import { Conditional } from '../../src/style/conditional.ts';

describe('Conditional Formatting Wizard Parity', () => {
    it('should map blanks and errors rule factories like PhpSpreadsheet', () => {
        const wizard = new Wizard('B2:B5');

        expect(wizard.newRule(Wizard.BLANKS).getConditional().getConditionType()).toBe(
            Conditional.CONDITION_CONTAINSBLANKS,
        );
        expect(wizard.newRule(Wizard.NOT_BLANKS).getConditional().getConditionType()).toBe(
            Conditional.CONDITION_NOTCONTAINSBLANKS,
        );
        expect(wizard.newRule(Wizard.ERRORS).getConditional().getConditionType()).toBe(
            Conditional.CONDITION_CONTAINSERRORS,
        );
        expect(wizard.newRule(Wizard.NOT_ERRORS).getConditional().getConditionType()).toBe(
            Conditional.CONDITION_NOTCONTAINSERRORS,
        );
    });

    it('should adjust relative expression references without touching quoted text', () => {
        const expression = (new Wizard('B2:B5').newRule(Wizard.EXPRESSION) as Expression)
            .formula('SEARCH("A1",A1)>0')
            .getConditional();

        expect(expression.getConditions()).toEqual(['SEARCH("A1",B2)>0']);
    });

    it('should reverse-adjust expression references in fromConditional', () => {
        const conditional = new Conditional();
        conditional.setConditionType(Conditional.CONDITION_EXPRESSION);
        conditional.setConditions(['SEARCH("A1",B2)>0']);
        conditional.setStopIfTrue(true);

        const expression = Wizard.fromConditional(conditional, 'B2:B5');
        const roundTripped = expression.getConditional();

        expect(roundTripped.getConditions()).toEqual(['SEARCH("A1",B2)>0']);
        expect(roundTripped.getStopIfTrue()).toBe(true);
    });

    it('should validate conditional types when reconstructing blanks and expression wizards', () => {
        const conditional = new Conditional();
        conditional.setConditionType(Conditional.CONDITION_NONE);

        expect(() => Wizard.fromConditional(conditional, 'A1')).toThrow('Invalid conditional formatting rule type.');
    });
});
