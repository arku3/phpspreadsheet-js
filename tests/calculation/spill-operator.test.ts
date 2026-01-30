import { beforeEach, describe, expect, test } from 'bun:test';
import { Calculation } from '../../src/calculation/calculation.ts';
import { Spreadsheet } from '../../src/core/spreadsheet.ts';

describe('Spill Operator (#)', () => {
    let spreadsheet: Spreadsheet;
    let calculation: Calculation;

    beforeEach(() => {
        spreadsheet = new Spreadsheet();
        calculation = new Calculation();
    });

    test('Evaluate Spill Operator A1#', () => {
        const sheet = spreadsheet.getActiveSheet();

        // Setup a range that we want to refer to as a spill
        // For now, our implementation of spill operator just returns the array if the operand is already an array
        // (e.g. from a range reference or another spilled formula)

        sheet.setCellValue('A1', 10);
        sheet.setCellValue('A2', 20);
        sheet.setCellValue('A3', 30);

        // Reference A1:A3 as a spill result (A1#)
        // In a real scenario, A1 would contain a formula that spills, but for our logic test:
        const formula = '=SUM(A1:A3#)'; // This is slightly non-standard but tests the parser/operator

        // If the parser sees A1:A3 as a range, it returns a 2D array.
        // The # operator then verifies it is an array.
        const result = calculation.calculateFormula(formula, sheet, 'B1');
        expect(result).toBe(60);
    });

    test('Spill Operator on non-array should return #REF!', () => {
        const sheet = spreadsheet.getActiveSheet();
        sheet.setCellValue('A1', 10);

        const formula = '=A1#';
        const result = calculation.calculateFormula(formula, sheet, 'B1');
        expect(result).toBe('#REF!');
    });
});
