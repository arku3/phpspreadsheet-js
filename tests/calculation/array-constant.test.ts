import { beforeEach, describe, expect, test } from 'bun:test';
import { Calculation } from '../../src/calculation/calculation.ts';
import { Spreadsheet } from '../../src/core/spreadsheet.ts';

describe('Matrix/Array Constants', () => {
    let spreadsheet: Spreadsheet;
    let calculation: Calculation;

    beforeEach(() => {
        spreadsheet = new Spreadsheet();
        calculation = new Calculation();
    });

    test('Evaluate 1D Array Constant {1,2,3}', () => {
        const sheet = spreadsheet.getActiveSheet();
        const formula = '={1,2,3}';

        const result = calculation.calculateFormula(formula, sheet, 'A1');
        // Result should be [1, 2, 3] wrapped in another array because of ARRAY token
        expect(result).toEqual([[1, 2, 3]]);
    });

    test('Evaluate 2D Array Constant {1,2;3,4}', () => {
        const sheet = spreadsheet.getActiveSheet();
        const formula = '={1,2;3,4}';

        const result = calculation.calculateFormula(formula, sheet, 'A1');
        expect(result).toEqual([
            [1, 2],
            [3, 4],
        ]);
    });

    test('SUM of Array Constant', () => {
        const sheet = spreadsheet.getActiveSheet();
        const formula = '=SUM({1,2,3})';
        const result = calculation.calculateFormula(formula, sheet, 'A1');
        expect(result).toBe(6);
    });
});
