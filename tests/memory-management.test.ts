import { describe, it, expect } from 'bun:test';
import { Spreadsheet } from '../src/core/spreadsheet.ts';
import { CellCollection } from '../src/core/cell-collection.ts';

describe('Memory Management', () => {
    describe('CellCollection', () => {
        it('should clear all cells', () => {
            const spreadsheet = new Spreadsheet();
            const worksheet = spreadsheet.getActiveSheet();
            const collection = worksheet.getCellCollection();

            // Add some cells
            worksheet.getCell('A1').setValue('Test 1');
            worksheet.getCell('B2').setValue('Test 2');
            worksheet.getCell('C3').setValue(123);

            expect(collection.getCount()).toBeGreaterThan(0);

            // Clear the collection
            collection.clear();

            expect(collection.getCount()).toBe(0);
        });

        it('should return correct count', () => {
            const spreadsheet = new Spreadsheet();
            const worksheet = spreadsheet.getActiveSheet();
            const collection = worksheet.getCellCollection();

            expect(collection.getCount()).toBe(0);

            worksheet.getCell('A1').setValue('Test');
            expect(collection.getCount()).toBeGreaterThan(0);
        });
    });

    describe('Worksheet.disconnectCells', () => {
        it('should disconnect cells from worksheet', () => {
            const spreadsheet = new Spreadsheet();
            const worksheet = spreadsheet.getActiveSheet();

            const retainedCell = worksheet.getCell('A1');

            // Add some cells
            retainedCell.setValue('Test 1');
            worksheet.getCell('B2').setValue('Test 2');
            worksheet.getCell('C3').setValue(123);

            const collection = worksheet.getCellCollection();
            expect(collection.getCount()).toBeGreaterThan(0);

            // Disconnect cells
            worksheet.disconnectCells();

            // After disconnecting, cells should be cleared
            expect(collection.getCount()).toBe(0);

            // Retained cell should be detached (no backref to worksheet)
            expect(() => retainedCell.getWorksheet()).toThrow(/detached/i);
            expect(() => retainedCell.getStyle()).toThrow(/detached/i);
            expect(() => retainedCell.setValue('x')).toThrow(/detached/i);
        });
    });

    describe('Spreadsheet.disconnectWorksheets', () => {
        it('should disconnect all worksheets', () => {
            const spreadsheet = new Spreadsheet();

            // Create multiple worksheets
            const sheet1 = spreadsheet.getActiveSheet();
            sheet1.setTitle('Sheet1');
            sheet1.getCell('A1').setValue('Test 1');

            const sheet2 = spreadsheet.createSheet();
            sheet2.setTitle('Sheet2');
            sheet2.getCell('A1').setValue('Test 2');

            const sheet3 = spreadsheet.createSheet();
            sheet3.setTitle('Sheet3');
            sheet3.getCell('A1').setValue('Test 3');

            expect(spreadsheet.getSheetCount()).toBe(3);

            // Disconnect all worksheets
            spreadsheet.disconnectWorksheets();

            // After disconnecting, all sheets should be removed
            expect(spreadsheet.getSheetCount()).toBe(0);
        });

        it('should reset active sheet index after disconnect', () => {
            const spreadsheet = new Spreadsheet();

            // Create multiple worksheets
            spreadsheet.getActiveSheet().setTitle('Sheet1');
            spreadsheet.createSheet().setTitle('Sheet2');
            spreadsheet.createSheet().setTitle('Sheet3');

            // Set active sheet by getting sheet at index 2
            const sheet = spreadsheet.getSheet(2);
            if (sheet) {
                spreadsheet.removeSheetByIndex(0);
                spreadsheet.removeSheetByIndex(0);
            }
            
            expect(spreadsheet.getActiveSheetIndex()).toBe(0);

            // Disconnect all worksheets
            spreadsheet.disconnectWorksheets();

            // Active index should be reset to 0
            expect(spreadsheet.getActiveSheetIndex()).toBe(0);
        });

        it('should allow garbage collection after disconnect', () => {
            const spreadsheet = new Spreadsheet();
            const worksheet = spreadsheet.getActiveSheet();

            // Create many cells
            for (let row = 1; row <= 100; row++) {
                worksheet.getCell(`A${row}`).setValue(`Row ${row}`);
                worksheet.getCell(`B${row}`).setValue(`Row ${row}`);
                worksheet.getCell(`C${row}`).setValue(`Row ${row}`);
                worksheet.getCell(`D${row}`).setValue(`Row ${row}`);
                worksheet.getCell(`E${row}`).setValue(`Row ${row}`);
                worksheet.getCell(`F${row}`).setValue(`Row ${row}`);
                worksheet.getCell(`G${row}`).setValue(`Row ${row}`);
                worksheet.getCell(`H${row}`).setValue(`Row ${row}`);
                worksheet.getCell(`I${row}`).setValue(`Row ${row}`);
                worksheet.getCell(`J${row}`).setValue(`Row ${row}`);
            }

            const collection = worksheet.getCellCollection();
            expect(collection.getCount()).toBeGreaterThan(0);

            // Disconnect
            spreadsheet.disconnectWorksheets();

            // All worksheets should be gone
            expect(spreadsheet.getSheetCount()).toBe(0);
            
            // Note: After disconnecting, the cell collection is cleared
            // and the worksheet becomes unusable (cells are disconnected)
        });
    });
});
