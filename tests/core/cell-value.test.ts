import { describe, expect, test } from 'bun:test';
import { DataType } from '../../src/core/cell.ts';
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
    });
});
