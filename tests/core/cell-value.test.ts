import { describe, expect, test } from 'bun:test';
import { DataType } from '../../src/core/cell.ts';
import { DataValidation } from '../../src/core/data-validation.ts';
import { Spreadsheet } from '../../src/core/spreadsheet.ts';

describe('Cell value behaviors', () => {
    test('setValue clears existing hyperlink', () => {
        const spreadsheet = new Spreadsheet();
        const sheet = spreadsheet.getActiveSheet();
        const cell = sheet.getCell('A1');

        cell.getHyperlink().setUrl('https://example.com');
        expect(cell.hasHyperlink()).toBe(true);

        cell.setValue('New');
        expect(cell.hasHyperlink()).toBe(false);
    });

    test('setValueExplicit sets quotePrefix for leading apostrophe', () => {
        const spreadsheet = new Spreadsheet();
        const sheet = spreadsheet.getActiveSheet();
        const cell = sheet.getCell('A1');

        cell.setValueExplicit("'Text", DataType.TYPE_STRING);
        expect(cell.getValue()).toBe('Text');
        expect(cell.getStyle().getQuotePrefix()).toBe(true);
    });

    test('setValueExplicit sets quotePrefix for leading equals', () => {
        const spreadsheet = new Spreadsheet();
        const sheet = spreadsheet.getActiveSheet();
        const cell = sheet.getCell('A1');

        cell.setValueExplicit('=1+1', DataType.TYPE_STRING);
        expect(cell.getValue()).toBe('=1+1');
        expect(cell.getStyle().getQuotePrefix()).toBe(true);
        expect(cell.isFormula()).toBe(false);
    });

    test('calculated value helpers track old values', () => {
        const spreadsheet = new Spreadsheet();
        const sheet = spreadsheet.getActiveSheet();
        const cell = sheet.getCell('A1');

        cell.setValueExplicit('=1+1', DataType.TYPE_FORMULA);
        cell.setCalculatedValue(2);
        expect(cell.getCalculatedValueString()).toBe('2');
        expect(cell.getOldCalculatedValue()).toBeUndefined();

        cell.setCalculatedValue(3);
        expect(cell.getOldCalculatedValue()).toBe(2);
    });

    test('formula attributes and ignored errors are stored', () => {
        const spreadsheet = new Spreadsheet();
        const sheet = spreadsheet.getActiveSheet();
        const cell = sheet.getCell('A1');

        expect(cell.getFormulaAttributes()).toBeNull();
        cell.setFormulaAttributes({ ref: 'A1' });
        expect(cell.getFormulaAttributes()).toEqual({ ref: 'A1' });

        const ignored = cell.getIgnoredErrors();
        ignored.test = true;
        expect(cell.getIgnoredErrors().test).toBe(true);
    });

    test('data validation helpers match worksheet storage', () => {
        const spreadsheet = new Spreadsheet();
        const sheet = spreadsheet.getActiveSheet();
        const cell = sheet.getCell('A1');
        const validation = new DataValidation();

        cell.setDataValidation(validation);
        expect(cell.hasDataValidation()).toBe(true);
        expect(cell.getDataValidation()).toBe(validation);
    });

    test('rebindParent attaches cell to new worksheet', () => {
        const spreadsheet = new Spreadsheet();
        const sheet1 = spreadsheet.getActiveSheet();
        const sheet2 = spreadsheet.createSheet().setTitle('Second');

        const cell = sheet1.getCell('A1');
        cell.rebindParent(sheet2);
        expect(sheet2.getCell('A1')).toBe(cell);
    });
});
