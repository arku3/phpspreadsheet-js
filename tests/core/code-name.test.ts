import { describe, expect, test } from 'bun:test';
import { Spreadsheet } from '../../src/core/spreadsheet.ts';

describe('Worksheet code name', () => {
    test('setCodeName validates length and characters', () => {
        const spreadsheet = new Spreadsheet();
        const sheet = spreadsheet.getActiveSheet();

        expect(() => sheet.setCodeName('')).toThrow();
        expect(() => sheet.setCodeName('Invalid*Name')).toThrow();
        expect(() => sheet.setCodeName('A'.repeat(32))).toThrow();
    });

    test('setCodeName enforces uniqueness with suffix', () => {
        const spreadsheet = new Spreadsheet();
        const sheet1 = spreadsheet.getActiveSheet();
        const sheet2 = spreadsheet.createSheet();

        sheet1.setCodeName('Code');
        sheet2.setCodeName('Code');

        expect(sheet1.getCodeName()).toBe('Code');
        expect(sheet2.getCodeName()).toBe('Code_1');
    });

    test('setCodeName truncates when suffix exceeds max length', () => {
        const spreadsheet = new Spreadsheet();
        const sheet1 = spreadsheet.getActiveSheet();
        const sheet2 = spreadsheet.createSheet();

        const base = 'A'.repeat(31);
        sheet1.setCodeName(base);
        sheet2.setCodeName(base);

        expect(sheet1.getCodeName()).toBe(base);
        expect(sheet2.getCodeName()).toBe('A'.repeat(29) + '_1');
    });

    test('Spreadsheet resolves sheets by code name', () => {
        const spreadsheet = new Spreadsheet();
        const sheet = spreadsheet.getActiveSheet();

        sheet.setCodeName('CustomCode');
        expect(spreadsheet.getSheetByCodeName('CustomCode')).toBe(sheet);
        expect(spreadsheet.sheetCodeNameExists('CustomCode')).toBe(true);
    });
});
