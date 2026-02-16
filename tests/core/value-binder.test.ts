import { beforeEach, describe, expect, test } from 'bun:test';
import { AdvancedValueBinder } from '../../src/core/advanced-value-binder.ts';
import { DataType } from '../../src/core/cell.ts';
import { DefaultValueBinder } from '../../src/core/default-value-binder.ts';
import { Spreadsheet } from '../../src/core/spreadsheet.ts';
import { convertIsoDate } from '../../src/shared/date.ts';

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

    test('Explicit data types follow PHP normalization rules', () => {
        const sheet = spreadsheet.getActiveSheet();

        sheet.setCellValueExplicit('A1', 'Text', DataType.TYPE_STRING2);
        expect(sheet.getCell('A1').getDataType()).toBe(DataType.TYPE_STRING);
        expect(sheet.getCell('A1').getValue()).toBe('Text');

        sheet.setCellValueExplicit('A2', '2020-01-02', DataType.TYPE_ISO_DATE);
        expect(sheet.getCell('A2').getDataType()).toBe(DataType.TYPE_NUMERIC);
        expect(sheet.getCell('A2').getValue()).toBe(convertIsoDate('2020-01-02'));

        sheet.setCellValueExplicit('A3', 'not-an-error', DataType.TYPE_ERROR);
        expect(sheet.getCell('A3').getValue()).toBe('#NULL!');
    });

    test('Preserve CR flag controls newline normalization', () => {
        const binder = new DefaultValueBinder();
        binder.setPreserveCr(false);
        spreadsheet.setValueBinder(binder);
        const sheet = spreadsheet.getActiveSheet();

        sheet.setCellValue('A1', 'Line1\r\nLine2');
        expect(sheet.getCell('A1').getValue()).toBe('Line1\nLine2');

        binder.setPreserveCr(true);
        sheet.setCellValue('A2', 'Line1\r\nLine2');
        expect(sheet.getCell('A2').getValue()).toBe('Line1\r\nLine2');
    });
});
