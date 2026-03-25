import { describe, expect, test } from 'bun:test';
import { Spreadsheet } from '../../src/core/spreadsheet.ts';
import { Conditional } from '../../src/style/conditional.ts';

function makeConditional(priority: number, condition: string): Conditional {
    return new Conditional()
        .setConditionType(Conditional.CONDITION_CELLIS)
        .setOperatorType(Conditional.OPERATOR_EQUAL)
        .setConditions([condition])
        .setPriority(priority);
}

describe('Worksheet conditional style parity', () => {
    test('returns conditional styles for cells inside stored ranges but not partial range lookups', () => {
        const sheet = new Spreadsheet().getActiveSheet();
        const conditional = makeConditional(1, '1');

        sheet.setConditionalStyles('A1:C3', [conditional]);

        expect(sheet.getConditionalStyles('A1:C3')).toEqual([conditional]);
        expect(sheet.getConditionalStyles('B2')).toEqual([conditional]);
        expect(sheet.getConditionalStyles('A1:B2')).toEqual([]);
        expect(sheet.conditionalStylesExists('B2')).toBe(true);
        expect(sheet.conditionalStylesExists('B4')).toBe(false);
    });

    test('resolves intersection ranges like PhpSpreadsheet', () => {
        const sheet = new Spreadsheet().getActiveSheet();
        const conditional = makeConditional(1, '2');

        sheet.setConditionalStyles('A1:C3 B1:B3', [conditional]);

        expect(sheet.getConditionalStyles('A2')).toEqual([]);
        expect(sheet.getConditionalStyles('B2')).toEqual([conditional]);
        expect(sheet.getConditionalRange('A2')).toBeNull();
        expect(sheet.getConditionalRange('B2')).toBe('A1:C3 B1:B3');
    });

    test('flattens overlapping matches and sorts by priority with zero last', () => {
        const sheet = new Spreadsheet().getActiveSheet();
        const lowerPriority = makeConditional(2, '1');
        const higherPriority = makeConditional(1, '2');
        const zeroPriority = makeConditional(0, '3');

        sheet.setConditionalStyles('A1:C3', [lowerPriority]);
        sheet.setConditionalStyles('B2:D4', [higherPriority, zeroPriority]);

        expect(sheet.getConditionalStyles('B2', false)).toEqual([higherPriority, lowerPriority, zeroPriority]);
        expect(sheet.getConditionalStyles('B2')).toEqual([lowerPriority]);
    });

    test('duplicates and removes conditional styles with exact-key behavior', () => {
        const sheet = new Spreadsheet().getActiveSheet();
        const conditional = makeConditional(1, '1');
        const styles = [conditional];

        sheet.setConditionalStyles('A1:C3', styles);
        sheet.duplicateConditionalStyle(styles, 'F1:G2');

        expect(sheet.getConditionalStyles('F1')).toEqual(styles);
        expect(sheet.getConditionalStyles('G2')).toEqual(styles);
        expect(sheet.getConditionalStyles('F1')[0]).toBe(conditional);
        expect(sheet.conditionalStylesExists('F2')).toBe(true);

        sheet.removeConditionalStyles('F2');

        expect(sheet.conditionalStylesExists('F2')).toBe(false);
        expect(sheet.conditionalStylesExists('F1')).toBe(true);
        expect(sheet.conditionalStylesExists('B2')).toBe(true);
    });
});
