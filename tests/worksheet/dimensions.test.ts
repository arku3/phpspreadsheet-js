import { describe, expect, test } from 'bun:test';
import { Spreadsheet } from '../../src/core/spreadsheet.ts';
import { ColumnDimension } from '../../src/worksheet/column-dimension.ts';
import { RowDimension } from '../../src/worksheet/row-dimension.ts';

describe('Worksheet Dimensions', () => {
    test('RowDimension management', () => {
        const spreadsheet = new Spreadsheet();
        const sheet = spreadsheet.getActiveSheet();

        expect(sheet.rowDimensionExists(1)).toBe(false);

        const row1 = sheet.getRowDimension(1);
        expect(row1).toBeInstanceOf(RowDimension);
        expect(row1.getRowIndex()).toBe(1);
        expect(sheet.rowDimensionExists(1)).toBe(true);

        row1.setRowHeight(30);
        expect(sheet.getRowDimension(1).getRowHeight()).toBe(30);

        expect(sheet.getDefaultRowDimension().getRowHeight()).toBe(-1);
    });

    test('ColumnDimension management', () => {
        const spreadsheet = new Spreadsheet();
        const sheet = spreadsheet.getActiveSheet();

        expect(sheet.columnDimensionExists('A')).toBe(false);

        const colA = sheet.getColumnDimension('A');
        expect(colA).toBeInstanceOf(ColumnDimension);
        expect(colA.getColumnIndex()).toBe('A');
        expect(sheet.columnDimensionExists('A')).toBe(true);

        colA.setWidth(20);
        expect(sheet.getColumnDimension('a').getWidth()).toBe(20); // Case insensitive

        const colB = sheet.getColumnDimensionByColumn(2);
        expect(colB.getColumnIndex()).toBe('B');
    });

    test('Dimension xfIndex tracking', () => {
        const spreadsheet = new Spreadsheet();
        const sheet = spreadsheet.getActiveSheet();

        const row = sheet.getRowDimension(5);
        expect(row.getXfIndex()).toBe(null);

        row.setXfIndex(1);
        expect(row.getXfIndex()).toBe(1);

        const col = sheet.getColumnDimension('C');
        col.setXfIndex(2);
        expect(col.getXfIndex()).toBe(2);
    });
});
