import { beforeEach, describe, expect, test } from 'bun:test';
import { AdvancedValueBinder } from '../../src/core/advanced-value-binder.ts';
import { DataType } from '../../src/core/cell.ts';
import { Spreadsheet } from '../../src/core/spreadsheet.ts';

describe('Value Binding', () => {
    let spreadsheet: Spreadsheet;

    beforeEach(() => {
        spreadsheet = new Spreadsheet();
    });

    test('Default Value Binder detects basic types', () => {
        const sheet = spreadsheet.getActiveSheet();

        sheet.setCellValue('A1', 100);
        expect(sheet.getCell('A1').getDataType()).toBe(DataType.TYPE_NUMERIC);

        sheet.setCellValue('A2', 'Hello');
        expect(sheet.getCell('A2').getDataType()).toBe(DataType.TYPE_STRING);

        sheet.setCellValue('A3', '=SUM(1,2)');
        expect(sheet.getCell('A3').getDataType()).toBe(DataType.TYPE_FORMULA);

        sheet.setCellValue('A4', true);
        expect(sheet.getCell('A4').getDataType()).toBe(DataType.TYPE_BOOL);
    });

    test('Default Value Binder detects numeric strings', () => {
        const sheet = spreadsheet.getActiveSheet();

        sheet.setCellValue('A1', '123');
        expect(sheet.getCell('A1').getDataType()).toBe(DataType.TYPE_NUMERIC);
        expect(sheet.getCell('A1').getValue()).toBe(123);

        sheet.setCellValue('A2', '0123'); // Leading zero means string
        expect(sheet.getCell('A2').getDataType()).toBe(DataType.TYPE_STRING);
        expect(sheet.getCell('A2').getValue()).toBe('0123');
    });

    test('Advanced Value Binder detects special formats', () => {
        spreadsheet.setValueBinder(new AdvancedValueBinder());
        const sheet = spreadsheet.getActiveSheet();

        sheet.setCellValue('A1', '10%');
        expect(sheet.getCell('A1').getDataType()).toBe(DataType.TYPE_NUMERIC);
        expect(sheet.getCell('A1').getValue()).toBe(0.1);

        sheet.setCellValue('A2', 'TRUE');
        expect(sheet.getCell('A2').getDataType()).toBe(DataType.TYPE_BOOL);
        expect(sheet.getCell('A2').getValue()).toBe(true);

        sheet.setCellValue('A3', '$100.50');
        expect(sheet.getCell('A3').getDataType()).toBe(DataType.TYPE_NUMERIC);
        expect(sheet.getCell('A3').getValue()).toBe(100.5);
    });
});
