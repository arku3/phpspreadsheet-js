import { describe, expect, test } from 'bun:test';
import { NamedRange } from '../../src/core/named-range.ts';
import { Spreadsheet } from '../../src/core/spreadsheet.ts';

describe('Worksheet setCellValue', () => {
    test('setCellValue resolves sheet references', () => {
        const spreadsheet = new Spreadsheet();
        const sheet1 = spreadsheet.getActiveSheet();
        const sheet2 = spreadsheet.createSheet();
        sheet2.setTitle('Sheet2');

        sheet1.setCellValue('Sheet2!B2', 42);
        expect(sheet2.getCell('B2').getValue()).toBe(42);
    });

    test('setCellValue resolves named ranges to top-left cell', () => {
        const spreadsheet = new Spreadsheet();
        const sheet = spreadsheet.getActiveSheet();
        spreadsheet.addNamedRange(new NamedRange('MyRange', sheet, 'C3:D4'));

        sheet.setCellValue('MyRange', 'Value');
        expect(sheet.getCell('C3').getValue()).toBe('Value');
    });

    test('setCellValueExplicit resolves sheet references', () => {
        const spreadsheet = new Spreadsheet();
        const sheet1 = spreadsheet.getActiveSheet();
        const sheet2 = spreadsheet.createSheet();
        sheet2.setTitle('Sheet2');

        sheet1.setCellValueExplicit('Sheet2!D5', 'Explicit');
        expect(sheet2.getCell('D5').getValue()).toBe('Explicit');
    });

    test('setCellValueExplicit resolves named ranges to top-left cell', () => {
        const spreadsheet = new Spreadsheet();
        const sheet = spreadsheet.getActiveSheet();
        spreadsheet.addNamedRange(new NamedRange('MyRange', sheet, 'E6:F7'));

        sheet.setCellValueExplicit('MyRange', 'Explicit');
        expect(sheet.getCell('E6').getValue()).toBe('Explicit');
    });

    test('setCellValue rejects range coordinates', () => {
        const spreadsheet = new Spreadsheet();
        const sheet = spreadsheet.getActiveSheet();

        expect(() => sheet.setCellValue('A1:B2', 'Value')).toThrow();
    });

    test('setCellValue rejects out-of-range coordinates', () => {
        const spreadsheet = new Spreadsheet();
        const sheet = spreadsheet.getActiveSheet();

        expect(() => sheet.setCellValue('A0', 'Value')).toThrow();
        expect(() => sheet.setCellValue('XFE1', 'Value')).toThrow();
        expect(() => sheet.setCellValue('XFD1048577', 'Value')).toThrow();
    });
});
