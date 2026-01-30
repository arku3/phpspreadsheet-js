import { beforeEach, describe, expect, test } from 'bun:test';
import { NamedRange } from '../../src/core/named-range.ts';
import { Spreadsheet } from '../../src/core/spreadsheet.ts';

describe('Calculation Engine', () => {
    let spreadsheet: Spreadsheet;

    beforeEach(() => {
        spreadsheet = new Spreadsheet();
    });

    test('Basic Arithmetic', () => {
        const sheet = spreadsheet.getActiveSheet();
        sheet.setCellValue('A1', 10);
        sheet.setCellValue('B1', 20);
        sheet.setCellValue('C1', '=A1+B1');
        expect(sheet.getCell('C1').getCalculatedValue()).toBe(30);

        sheet.setCellValue('C2', '=B1-A1');
        expect(sheet.getCell('C2').getCalculatedValue()).toBe(10);

        sheet.setCellValue('C3', '=A1*B1');
        expect(sheet.getCell('C3').getCalculatedValue()).toBe(200);

        sheet.setCellValue('C4', '=B1/A1');
        expect(sheet.getCell('C4').getCalculatedValue()).toBe(2);
    });

    test('Operator Precedence', () => {
        const sheet = spreadsheet.getActiveSheet();
        sheet.setCellValue('A1', '=1+2*3');
        expect(sheet.getCell('A1').getCalculatedValue()).toBe(7);

        sheet.setCellValue('A2', '=(1+2)*3');
        expect(sheet.getCell('A2').getCalculatedValue()).toBe(9);
    });

    test('Functions', () => {
        const sheet = spreadsheet.getActiveSheet();
        sheet.setCellValue('A1', 10);
        sheet.setCellValue('A2', 20);
        sheet.setCellValue('A3', 30);

        sheet.setCellValue('B1', '=SUM(A1:A3)');
        expect(sheet.getCell('B1').getCalculatedValue()).toBe(60);

        sheet.setCellValue('B2', '=AVERAGE(A1:A3)');
        expect(sheet.getCell('B2').getCalculatedValue()).toBe(20);

        sheet.setCellValue('B3', '=COUNT(A1:A3, "test", 40)');
        expect(sheet.getCell('B3').getCalculatedValue()).toBe(4);
    });

    test('Logical IF', () => {
        const sheet = spreadsheet.getActiveSheet();
        sheet.setCellValue('A1', 10);
        sheet.setCellValue('B1', '=IF(A1>5, "High", "Low")');
        expect(sheet.getCell('B1').getCalculatedValue()).toBe('High');

        sheet.setCellValue('A1', 2);
        expect(sheet.getCell('B1').getCalculatedValue()).toBe('Low');
    });

    test('IFERROR and IFNA', () => {
        const sheet = spreadsheet.getActiveSheet();
        sheet.setCellValue('A1', '=1/0');
        sheet.setCellValue('B1', '=IFERROR(A1, "ErrorHandled")');
        expect(sheet.getCell('B1').getCalculatedValue()).toBe('ErrorHandled');

        sheet.setCellValue('A2', '=VLOOKUP("Missing", Z1:Z2, 1, FALSE)'); // returns #N/A
        sheet.setCellValue('B2', '=IFNA(A2, "Not found")');
        expect(sheet.getCell('B2').getCalculatedValue()).toBe('Not found');

        sheet.setCellValue('B3', '=IFERROR(1+2, "Error")');
        expect(sheet.getCell('B3').getCalculatedValue()).toBe(3);
    });

    test('Branch Pruning (Lazy IF)', () => {
        const sheet = spreadsheet.getActiveSheet();
        // If pruning works, the second argument (1/0) should NOT be evaluated if condition is false
        sheet.setCellValue('A1', 10);
        sheet.setCellValue('B1', '=IF(A1<5, 1/0, "Safe")');
        expect(sheet.getCell('B1').getCalculatedValue()).toBe('Safe');
    });

    test('Cross-Sheet References', () => {
        const sheet1 = spreadsheet.getActiveSheet();
        sheet1.setTitle('DataSheet');
        sheet1.setCellValue('A1', 100);

        const sheet2 = spreadsheet.createSheet('CalcSheet');
        sheet2.setCellValue('A1', '=DataSheet!A1 + 50');
        expect(sheet2.getCell('A1').getCalculatedValue()).toBe(150);

        sheet2.setCellValue('A2', '=SUM(DataSheet!A1, 10)');
        expect(sheet2.getCell('A2').getCalculatedValue()).toBe(110);
    });

    test('Named Ranges', () => {
        const sheet = spreadsheet.getActiveSheet();
        sheet.setCellValue('A1', 10);
        sheet.setCellValue('A2', 20);

        spreadsheet.addNamedRange(new NamedRange('MY_RANGE', sheet, 'A1:A2'));

        sheet.setCellValue('B1', '=SUM(MY_RANGE)');
        expect(sheet.getCell('B1').getCalculatedValue()).toBe(30);
    });

    test('VLOOKUP', () => {
        const sheet = spreadsheet.getActiveSheet();
        sheet.setCellValue('A1', 'Apple');
        sheet.setCellValue('B1', 10);
        sheet.setCellValue('A2', 'Banana');
        sheet.setCellValue('B2', 20);
        sheet.setCellValue('A3', 'Cherry');
        sheet.setCellValue('B3', 30);

        // Exact match
        sheet.setCellValue('C1', '=VLOOKUP("Banana", A1:B3, 2, FALSE)');
        expect(sheet.getCell('C1').getCalculatedValue()).toBe(20);

        // Not found exact
        sheet.setCellValue('C2', '=VLOOKUP("Date", A1:B3, 2, FALSE)');
        expect(sheet.getCell('C2').getCalculatedValue()).toBe('#N/A');

        // Approximate match (A1:B3 is sorted by column A)
        sheet.setCellValue('C3', '=VLOOKUP("B", A1:B3, 2, TRUE)');
        expect(sheet.getCell('C3').getCalculatedValue()).toBe(10); // Apple is the last value <= "B"
    });

    test('INDEX and MATCH', () => {
        const sheet = spreadsheet.getActiveSheet();
        sheet.setCellValue('A1', 'Red');
        sheet.setCellValue('A2', 'Green');
        sheet.setCellValue('A3', 'Blue');
        sheet.setCellValue('B1', 1);
        sheet.setCellValue('B2', 2);
        sheet.setCellValue('B3', 3);

        sheet.setCellValue('C1', '=MATCH("Green", A1:A3, 0)');
        expect(sheet.getCell('C1').getCalculatedValue()).toBe(2);

        sheet.setCellValue('C2', '=INDEX(B1:B3, MATCH("Blue", A1:A3, 0))');
        expect(sheet.getCell('C2').getCalculatedValue()).toBe(3);
    });

    test('Argument Count Validation', () => {
        const sheet = spreadsheet.getActiveSheet();
        sheet.setCellValue('A1', '=ABS()');
        expect(sheet.getCell('A1').getCalculatedValue()).toContain('#VALUE!');

        sheet.setCellValue('A2', '=ABS(1, 2)');
        expect(sheet.getCell('A2').getCalculatedValue()).toContain('#VALUE!');

        sheet.setCellValue('A3', '=ROUND(1)');
        expect(sheet.getCell('A3').getCalculatedValue()).toContain('#VALUE!');
    });

    test('Circular Reference', () => {
        const sheet = spreadsheet.getActiveSheet();
        sheet.setCellValue('A1', '=B1');
        sheet.setCellValue('B1', '=A1');
        expect(sheet.getCell('A1').getCalculatedValue()).toBe('#CIRCULAR!');
    });

    test('Complex Functions', () => {
        const sheet = spreadsheet.getActiveSheet();
        sheet.setCellValue('A1', -10);
        sheet.setCellValue('B1', '=ABS(A1)');
        expect(sheet.getCell('B1').getCalculatedValue()).toBe(10);

        sheet.setCellValue('A2', 1);
        sheet.setCellValue('A3', 5);
        sheet.setCellValue('A4', 2);
        sheet.setCellValue('B2', '=MAX(A2:A4)');
        sheet.setCellValue('B3', '=MIN(A2:A4)');
        expect(sheet.getCell('B2').getCalculatedValue()).toBe(5);
        expect(sheet.getCell('B3').getCalculatedValue()).toBe(1);

        sheet.setCellValue('A5', 1.2345);
        sheet.setCellValue('B4', '=ROUND(A5, 2)');
        expect(sheet.getCell('B4').getCalculatedValue()).toBe(1.23);

        sheet.setCellValue('A6', 'Hello');
        sheet.setCellValue('B5', '=LEN(A6)');
        sheet.setCellValue('B6', '=LEFT(A6, 2)');
        sheet.setCellValue('B7', '=RIGHT(A6, 2)');
        expect(sheet.getCell('B5').getCalculatedValue()).toBe(5);
        expect(sheet.getCell('B6').getCalculatedValue()).toBe('He');
        expect(sheet.getCell('B7').getCalculatedValue()).toBe('lo');
    });
});
