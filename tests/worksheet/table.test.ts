import { describe, expect, test } from 'bun:test';
import { Spreadsheet } from '../../src/core/spreadsheet.ts';
import { TableStyle } from '../../src/worksheet/table-style.ts';
import { Table, TableColumn } from '../../src/worksheet/table.ts';

describe('Table', () => {
    test('setName validates and enforces uniqueness', () => {
        const spreadsheet = new Spreadsheet();
        const sheet = spreadsheet.getActiveSheet();

        const table = new Table('A1:B2', 'Table1', sheet);
        sheet.addTable(table);

        expect(() => table.setName('')).toThrow();
        expect(() => table.setName('A1')).toThrow();

        const other = new Table('C1:D2', 'Other', sheet);
        sheet.addTable(other);
        expect(() => other.setName('Table1')).toThrow();
    });

    test('setRangeToMaxRow expands range', () => {
        const spreadsheet = new Spreadsheet();
        const sheet = spreadsheet.getActiveSheet();
        sheet.setCellValue('A1', 'Header');
        sheet.setCellValue('A5', 'Data');

        const table = new Table('A1:A1', 'Table1', sheet);
        table.setRangeToMaxRow();
        expect(table.getRange()).toBe('A1:A5');
    });

    test('table style flags set correctly', () => {
        const spreadsheet = new Spreadsheet();
        const sheet = spreadsheet.getActiveSheet();
        const table = new Table('A1:B2', 'Table1', sheet);

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

    test('worksheet table collection helpers match PhpSpreadsheet semantics', () => {
        const spreadsheet = new Spreadsheet();
        const sheet = spreadsheet.getActiveSheet();

        const first = new Table('A1:B2', 'FirstTable', sheet);
        const second = new Table('D1:E2', 'SecondTable', sheet);
        sheet.addTable(first).addTable(second);

        expect(sheet.getTableCollection()).toEqual([first, second]);
        expect(sheet.getTableNames()).toEqual(['FirstTable', 'SecondTable']);
        expect(sheet.getTableByName('firsttable')).toBe(first);

        const removed = sheet.removeTableByName('SECONDTABLE');
        expect(removed).toBe(sheet);
        expect(sheet.getTableByName('SecondTable')).toBeNull();
        expect(sheet.getTableNames()).toEqual(['FirstTable']);

        const cleared = sheet.removeTableCollection();
        expect(cleared).toBe(sheet);
        expect(sheet.getTableCollection()).toEqual([]);
    });

    test('table column mutators follow PhpSpreadsheet behavior', () => {
        const spreadsheet = new Spreadsheet();
        const sheet = spreadsheet.getActiveSheet();
        const table = new Table('A1:C3', 'Table1', sheet);

        table.setColumn('B');
        expect(table.getColumn('B').getTable()).toBe(table);

        const columnA = new TableColumn('A');
        columnA.setName('Alpha');
        table.setColumn(columnA);

        expect(table.getColumn('A')).toBe(columnA);
        expect(Array.from(table.getColumns().keys())).toEqual(['A', 'B']);

        expect(() => table.clearColumn('C')).not.toThrow();
        expect(() => table.shiftColumn('Z', 'A')).not.toThrow();

        table.shiftColumn('A', 'C');
        expect(table.getColumn('C')).toBe(columnA);
        expect(columnA.getTable()).toBe(table);
    });
});
