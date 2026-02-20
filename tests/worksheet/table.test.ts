import { describe, expect, test } from 'bun:test';
import { Spreadsheet } from '../../src/core/spreadsheet.ts';
import { TableStyle } from '../../src/worksheet/table-style.ts';
import { Table } from '../../src/worksheet/table.ts';

describe('Table', () => {
    test('setName validates and enforces uniqueness', () => {
        const spreadsheet = new Spreadsheet();
        const sheet = spreadsheet.getActiveSheet();

        const table = new Table('Table1', 'A1:B2', sheet);
        sheet.addTable(table);

        expect(() => table.setName('')).toThrow();
        expect(() => table.setName('A1')).toThrow();

        const other = new Table('Other', 'C1:D2', sheet);
        sheet.addTable(other);
        expect(() => other.setName('Table1')).toThrow();
    });

    test('setRangeToMaxRow expands range', () => {
        const spreadsheet = new Spreadsheet();
        const sheet = spreadsheet.getActiveSheet();
        sheet.setCellValue('A1', 'Header');
        sheet.setCellValue('A5', 'Data');

        const table = new Table('Table1', 'A1:A1', sheet);
        table.setRangeToMaxRow();
        expect(table.getRange()).toBe('A1:A5');
    });

    test('table style flags set correctly', () => {
        const spreadsheet = new Spreadsheet();
        const sheet = spreadsheet.getActiveSheet();
        const table = new Table('Table1', 'A1:B2', sheet);

        const style = new TableStyle();
        style.setTheme(TableStyle.TABLE_STYLE_LIGHT1);
        style.setShowRowStripes(false);
        style.setShowColumnStripes(true);
        style.setShowFirstColumn(true);
        style.setShowLastColumn(true);

        table.setStyle(style);
        expect(table.getStyle().getTheme()).toBe(TableStyle.TABLE_STYLE_LIGHT1);
        expect(table.getStyle().getShowRowStripes()).toBe(false);
        expect(table.getStyle().getShowColumnStripes()).toBe(true);
        expect(table.getStyle().getShowFirstColumn()).toBe(true);
        expect(table.getStyle().getShowLastColumn()).toBe(true);
    });
});
