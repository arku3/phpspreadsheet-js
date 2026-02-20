import fs from 'node:fs';
import { describe, expect, it } from 'bun:test';
import { Cell } from '../src/core/cell.ts';
import { Spreadsheet } from '../src/core/spreadsheet.ts';
import { Worksheet } from '../src/core/worksheet.ts';
import { RichText } from '../src/rich-text/rich-text.ts';
import { Run } from '../src/rich-text/run.ts';

describe('Core Module Parity Fixes', () => {
    describe('Worksheet Data Bounds', () => {
        it('should get highest row and column', () => {
            const spreadsheet = new Spreadsheet();
            const worksheet = spreadsheet.getActiveSheet();

            // Add cells at various positions
            worksheet.getCell('A1').setValue('A1');
            worksheet.getCell('C5').setValue('C5');
            worksheet.getCell('E10').setValue('E10');

            expect(worksheet.getHighestRow()).toBe(10);
            expect(worksheet.getHighestColumn()).toBe('E');

            const bounds = worksheet.getHighestRowAndColumn();
            expect(bounds.row).toBe(10);
            expect(bounds.column).toBe('E');
        });

        it('should get highest data row for specific column', () => {
            const spreadsheet = new Spreadsheet();
            const worksheet = spreadsheet.getActiveSheet();

            worksheet.getCell('A1').setValue('A1');
            worksheet.getCell('A5').setValue('A5');
            worksheet.getCell('B10').setValue('B10');

            expect(worksheet.getHighestRow('A')).toBe(5);
            expect(worksheet.getHighestRow('B')).toBe(10);
        });

        it('should get highest data column for specific row', () => {
            const spreadsheet = new Spreadsheet();
            const worksheet = spreadsheet.getActiveSheet();

            worksheet.getCell('A1').setValue('A1');
            worksheet.getCell('C1').setValue('C1');
            worksheet.getCell('E2').setValue('E2');

            expect(worksheet.getHighestColumn(1)).toBe('C');
            expect(worksheet.getHighestColumn(2)).toBe('E');
        });
    });

    describe('Array Import/Export', () => {
        it('should export worksheet to array', () => {
            const spreadsheet = new Spreadsheet();
            const worksheet = spreadsheet.getActiveSheet();

            worksheet.getCell('A1').setValue(1);
            worksheet.getCell('B1').setValue(2);
            worksheet.getCell('A2').setValue(3);
            worksheet.getCell('B2').setValue(4);

            const array = worksheet.toArray();

            expect(array).toBeArray();
            expect(array.length).toBeGreaterThanOrEqual(2);
            expect(array[0]).toBeArray();
            expect(array[0][0]).toBe(1);
            expect(array[0][1]).toBe(2);
            expect(array[1][0]).toBe(3);
            expect(array[1][1]).toBe(4);
        });

        it('should export specific range to array', () => {
            const spreadsheet = new Spreadsheet();
            const worksheet = spreadsheet.getActiveSheet();

            worksheet.getCell('A1').setValue(1);
            worksheet.getCell('B1').setValue(2);
            worksheet.getCell('A2').setValue(3);
            worksheet.getCell('B2').setValue(4);

            const array = worksheet.rangeToArray('A1:B2');

            expect(array.length).toBe(2);
            expect(array[0].length).toBe(2);
            expect(array[0][0]).toBe(1);
            expect(array[1][1]).toBe(4);
        });

        it('should import array to worksheet', () => {
            const spreadsheet = new Spreadsheet();
            const worksheet = spreadsheet.getActiveSheet();

            const data = [
                ['A', 'B', 'C'],
                [1, 2, 3],
                [4, 5, 6],
            ];

            worksheet.fromArray(data);

            expect(worksheet.getCell('A1').getValue()).toBe('A');
            expect(worksheet.getCell('B1').getValue()).toBe('B');
            expect(worksheet.getCell('C1').getValue()).toBe('C');
            expect(worksheet.getCell('A2').getValue()).toBe(1);
            expect(worksheet.getCell('B2').getValue()).toBe(2);
            expect(worksheet.getCell('C2').getValue()).toBe(3);
        });

        it('should import array at specific start cell', () => {
            const spreadsheet = new Spreadsheet();
            const worksheet = spreadsheet.getActiveSheet();

            const data = [
                ['X', 'Y'],
                [10, 20],
            ];

            worksheet.fromArray(data, null, 'C5');

            expect(worksheet.getCell('C5').getValue()).toBe('X');
            expect(worksheet.getCell('D5').getValue()).toBe('Y');
            expect(worksheet.getCell('C6').getValue()).toBe(10);
            expect(worksheet.getCell('D6').getValue()).toBe(20);
        });

        it('should handle null values with fromArray', () => {
            const spreadsheet = new Spreadsheet();
            const worksheet = spreadsheet.getActiveSheet();

            const data = [['A', null, 'C']];

            worksheet.fromArray(data);

            expect(worksheet.getCell('A1').getValue()).toBe('A');
            expect(worksheet.getCell('B1').getValue()).toBeNull();
            expect(worksheet.getCell('C1').getValue()).toBe('C');
        });
    });

    describe('Row/Column Manipulation', () => {
        it('should insert new row before existing row', () => {
            const spreadsheet = new Spreadsheet();
            const worksheet = spreadsheet.getActiveSheet();

            worksheet.getCell('A1').setValue('Row1');
            worksheet.getCell('A2').setValue('Row2');
            worksheet.getCell('A3').setValue('Row3');

            worksheet.insertNewRowBefore(2);

            expect(worksheet.getCell('A1').getValue()).toBe('Row1');
            expect(worksheet.getCell('A2').getValue()).toBeNull();
            expect(worksheet.getCell('A3').getValue()).toBe('Row2');
            expect(worksheet.getCell('A4').getValue()).toBe('Row3');
        });

        it('should insert multiple rows', () => {
            const spreadsheet = new Spreadsheet();
            const worksheet = spreadsheet.getActiveSheet();

            worksheet.getCell('A1').setValue('Original');

            worksheet.insertNewRowBefore(1, 3);

            expect(worksheet.getCell('A4').getValue()).toBe('Original');
            expect(worksheet.getHighestRow()).toBe(4);
        });

        it('should insert new column before existing column', () => {
            const spreadsheet = new Spreadsheet();
            const worksheet = spreadsheet.getActiveSheet();

            worksheet.getCell('A1').setValue('ColA');
            worksheet.getCell('B1').setValue('ColB');
            worksheet.getCell('C1').setValue('ColC');

            worksheet.insertNewColumnBefore('B');

            expect(worksheet.getCell('A1').getValue()).toBe('ColA');
            expect(worksheet.getCell('B1').getValue()).toBeNull();
            expect(worksheet.getCell('C1').getValue()).toBe('ColB');
            expect(worksheet.getCell('D1').getValue()).toBe('ColC');
        });

        it('should remove row', () => {
            const spreadsheet = new Spreadsheet();
            const worksheet = spreadsheet.getActiveSheet();

            worksheet.getCell('A1').setValue('Keep1');
            worksheet.getCell('A2').setValue('Delete');
            worksheet.getCell('A3').setValue('Keep2');

            worksheet.removeRow(2);

            expect(worksheet.getCell('A1').getValue()).toBe('Keep1');
            expect(worksheet.getCell('A2').getValue()).toBe('Keep2');
            expect(worksheet.getCell('A3').getValue()).toBeNull();
        });

        it('should remove column', () => {
            const spreadsheet = new Spreadsheet();
            const worksheet = spreadsheet.getActiveSheet();

            worksheet.getCell('A1').setValue('Keep1');
            worksheet.getCell('B1').setValue('Delete');
            worksheet.getCell('C1').setValue('Keep2');

            worksheet.removeColumn('B');

            expect(worksheet.getCell('A1').getValue()).toBe('Keep1');
            expect(worksheet.getCell('B1').getValue()).toBe('Keep2');
            expect(worksheet.getCell('C1').getValue()).toBeNull();
        });

        it('should update merge cells when inserting rows', () => {
            const spreadsheet = new Spreadsheet();
            const worksheet = spreadsheet.getActiveSheet();

            worksheet.mergeCells('A1:B2');
            worksheet.insertNewRowBefore(2);

            const mergeCells = worksheet.getMergeCells();
            const ranges = Object.keys(mergeCells);
            expect(ranges.length).toBe(1);
            expect(ranges[0]).toBe('A1:B3');
        });

        it('should remove merge cells when deleting rows in range', () => {
            const spreadsheet = new Spreadsheet();
            const worksheet = spreadsheet.getActiveSheet();

            worksheet.mergeCells('A1:B2');
            worksheet.mergeCells('A5:B6');

            worksheet.removeRow(1, 3);

            const mergeCells = worksheet.getMergeCells();
            expect(Object.keys(mergeCells).length).toBe(1);
        });
    });

    describe('Worksheet Management', () => {
        it('should check if sheet name exists', () => {
            const spreadsheet = new Spreadsheet();
            spreadsheet.createSheet().setTitle('Sheet1');
            spreadsheet.createSheet().setTitle('Sheet2');

            expect(spreadsheet.sheetNameExists('Sheet1')).toBe(true);
            expect(spreadsheet.sheetNameExists('Sheet2')).toBe(true);
            expect(spreadsheet.sheetNameExists('NonExistent')).toBe(false);
        });

        it('should get all sheet names', () => {
            const spreadsheet = new Spreadsheet();
            spreadsheet.createSheet().setTitle('Alpha');
            spreadsheet.createSheet().setTitle('Beta');
            spreadsheet.createSheet().setTitle('Gamma');

            const names = spreadsheet.getSheetNames();
            expect(names).toContain('Alpha');
            expect(names).toContain('Beta');
            expect(names).toContain('Gamma');
        });

        it('should remove sheet by index', () => {
            const spreadsheet = new Spreadsheet();
            spreadsheet.createSheet().setTitle('Sheet1');
            spreadsheet.createSheet().setTitle('Sheet2');
            spreadsheet.createSheet().setTitle('Sheet3');

            // PhpSpreadsheet uses 0-based sheet indices, including the default sheet.
            spreadsheet.removeSheetByIndex(2);

            // Default sheet + Sheet1 + Sheet3 = 3 sheets (Sheet2 removed)
            expect(spreadsheet.getSheetCount()).toBe(3);
            expect(spreadsheet.sheetNameExists('Sheet2')).toBe(false);
        });

        it('should throw when removing sheet with invalid index', () => {
            const spreadsheet = new Spreadsheet();

            expect(() => spreadsheet.removeSheetByIndex(-1)).toThrow();
            expect(() => spreadsheet.removeSheetByIndex(100)).toThrow();
        });

        it('should duplicate worksheet by title', () => {
            const spreadsheet = new Spreadsheet();
            const sourceSheet = spreadsheet.getActiveSheet();
            sourceSheet.setTitle('Original');
            sourceSheet.getCell('A1').setValue('Data');
            sourceSheet.mergeCells('A1:B2');

            const newSheet = spreadsheet.duplicateWorksheetByTitle('Original');

            expect(newSheet.getTitle()).toBe('Original (1)');
            expect(newSheet.getCell('A1').getValue()).toBe('Data');
            expect(Object.keys(newSheet.getMergeCells()).length).toBe(1);
        });

        it('should set active sheet index', () => {
            const spreadsheet = new Spreadsheet();
            spreadsheet.createSheet().setTitle('Sheet1');
            spreadsheet.createSheet().setTitle('Sheet2');

            spreadsheet.setActiveSheetIndex(2);

            // Index 0 = default sheet, 1 = Sheet1, 2 = Sheet2
            expect(spreadsheet.getActiveSheet().getTitle()).toBe('Sheet2');
        });

        it('should set active sheet by name', () => {
            const spreadsheet = new Spreadsheet();
            spreadsheet.createSheet().setTitle('Target');
            spreadsheet.createSheet().setTitle('Other');

            spreadsheet.setActiveSheetIndexByName('Target');

            expect(spreadsheet.getActiveSheet().getTitle()).toBe('Target');
        });

        it('should get sheet by code name', () => {
            const spreadsheet = new Spreadsheet();
            const sheet = spreadsheet.createSheet().setTitle('MySheet');

            const found = spreadsheet.getSheetByCodeName('MySheet');

            expect(found).toBe(sheet);
        });
    });

    describe('Cell Utility Methods', () => {
        it('should check if cell is in merge range', () => {
            const spreadsheet = new Spreadsheet();
            const worksheet = spreadsheet.getActiveSheet();

            worksheet.mergeCells('A1:B2');

            const cellA1 = worksheet.getCell('A1');
            const cellB2 = worksheet.getCell('B2');
            const cellC3 = worksheet.getCell('C3');

            expect(cellA1.isInMergeRange()).toBe(true);
            expect(cellB2.isInMergeRange()).toBe(true);
            expect(cellC3.isInMergeRange()).toBe(false);
        });

        it('should get merge range for cell', () => {
            const spreadsheet = new Spreadsheet();
            const worksheet = spreadsheet.getActiveSheet();

            worksheet.mergeCells('A1:C3');

            const cell = worksheet.getCell('B2');

            expect(cell.getMergeRange()).toBe('A1:C3');
        });

        it('should identify merge range value cell', () => {
            const spreadsheet = new Spreadsheet();
            const worksheet = spreadsheet.getActiveSheet();

            worksheet.mergeCells('A1:B2');

            const masterCell = worksheet.getCell('A1');
            const slaveCell = worksheet.getCell('B2');

            expect(masterCell.isMergeRangeValueCell()).toBe(true);
            expect(slaveCell.isMergeRangeValueCell()).toBe(false);
        });

        it('should check if cell is in range', () => {
            const spreadsheet = new Spreadsheet();
            const worksheet = spreadsheet.getActiveSheet();

            const cell = worksheet.getCell('B2');

            expect(cell.isInRange('A1:C3')).toBe(true);
            expect(cell.isInRange('A1:B2')).toBe(true);
            expect(cell.isInRange('C3:D4')).toBe(false);
        });

        it('should check if cell contains formula', () => {
            const spreadsheet = new Spreadsheet();
            const worksheet = spreadsheet.getActiveSheet();

            worksheet.getCell('A1').setValue(10);
            worksheet.getCell('A2').setValue('=A1*2');

            expect(worksheet.getCell('A1').isFormula()).toBe(false);
            expect(worksheet.getCell('A2').isFormula()).toBe(true);
        });

        it('should get formatted value', () => {
            const spreadsheet = new Spreadsheet();
            const worksheet = spreadsheet.getActiveSheet();

            worksheet.getCell('A1').setValue(123);
            worksheet.getCell('A2').setValue(null);

            expect(worksheet.getCell('A1').getFormattedValue()).toBe('123');
            expect(worksheet.getCell('A2').getFormattedValue()).toBe('');
        });

        it('should check cell locked status', () => {
            const spreadsheet = new Spreadsheet();
            const worksheet = spreadsheet.getActiveSheet();

            const cell = worksheet.getCell('A1');

            // Default: cell should be locked
            expect(cell.isLocked()).toBe(true);
        });

        it('should return empty hyperlink instance by default', () => {
            const spreadsheet = new Spreadsheet();
            const worksheet = spreadsheet.getActiveSheet();

            const cell = worksheet.getCell('A1');

            // Align with PhpSpreadsheet: getHyperlink() returns an object; use hasHyperlink/isEmpty to test presence.
            expect(cell.getHyperlink()).not.toBeNull();
            expect(cell.getHyperlink().isEmpty()).toBe(true);
            expect(cell.hasHyperlink()).toBe(false);
        });

        it('should return null for data validation placeholder', () => {
            const spreadsheet = new Spreadsheet();
            const worksheet = spreadsheet.getActiveSheet();

            const cell = worksheet.getCell('A1');

            // Placeholder returns null
            expect(cell.getDataValidation()).toBeNull();
        });
    });
});
