import { beforeEach, describe, expect, test } from 'bun:test';
import { Calculation } from '../../src/calculation/calculation.ts';
import { Spreadsheet } from '../../src/core/spreadsheet.ts';

describe('Calculation Cache', () => {
    let spreadsheet: Spreadsheet;
    let calculation: Calculation;

    beforeEach(() => {
        spreadsheet = new Spreadsheet();
        calculation = new Calculation();
    });

    test('Caching should store and return results', () => {
        const sheet = spreadsheet.getActiveSheet();
        sheet.setCellValue('A1', 10);

        // Mocking a slow process is hard without actual slow functions,
        // but we can verify it doesn't re-calculate if we change value without clearing cache
        const formula = '=A1 + 5';

        // 1. Calculate first time
        const result1 = calculation.calculateFormula(formula, sheet, 'B1');
        expect(result1).toBe(15);

        // 2. Change A1 but DON'T clear cache (simulating engine behavior)
        sheet.setCellValue('A1', 20);

        // 3. Calculate again - should still return 15 from cache
        const result2 = calculation.calculateFormula(formula, sheet, 'B1');
        expect(result2).toBe(15);

        // 4. Clear cache and calculate - should return 25
        calculation.clearCache();
        const result3 = calculation.calculateFormula(formula, sheet, 'B1');
        expect(result3).toBe(25);
    });

    test('Disabling cache should always re-calculate', () => {
        const sheet = spreadsheet.getActiveSheet();
        sheet.setCellValue('A1', 10);
        calculation.setCacheEnabled(false);

        const formula = '=A1 + 5';

        expect(calculation.calculateFormula(formula, sheet, 'B1')).toBe(15);

        sheet.setCellValue('A1', 20);
        expect(calculation.calculateFormula(formula, sheet, 'B1')).toBe(25);
    });
});
