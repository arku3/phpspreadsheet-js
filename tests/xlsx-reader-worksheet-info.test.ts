import { describe, it, expect, beforeAll, afterAll } from 'bun:test';
import { XlsxReader } from '../src/io/xlsx-reader.ts';
import { XlsxWriter } from '../src/io/xlsx-writer.ts';
import { Spreadsheet } from '../src/core/spreadsheet.ts';
import fs from 'node:fs';
import path from 'node:path';

describe('XlsxReader listWorksheetInfo', () => {
    const testDir = './test-output';
    const testFile = path.join(testDir, 'test-worksheet-info.xlsx');

    beforeAll(async () => {
        if (!fs.existsSync(testDir)) {
            fs.mkdirSync(testDir, { recursive: true });
        }

        // Create XLSX file with known dimensions
        const spreadsheet = new Spreadsheet();
        const sheet1 = spreadsheet.getActiveSheet();
        sheet1.setTitle('Sheet1');
        sheet1.getCell('A1').setValue('Data');
        sheet1.getCell('D5').setValue('End'); // D5 = column 4, row 5

        const sheet2 = spreadsheet.createSheet();
        sheet2.setTitle('LargeSheet');
        sheet2.getCell('Z100').setValue('Far cell'); // Z100 = column 26, row 100

        const sheet3 = spreadsheet.createSheet();
        sheet3.setTitle('EmptySheet');
        // Leave empty

        const writer = new XlsxWriter(spreadsheet);
        await writer.save(testFile);
    });

    afterAll(() => {
        if (fs.existsSync(testFile)) {
            fs.unlinkSync(testFile);
        }
    });

    it('should return worksheet info for each sheet', async () => {
        const reader = new XlsxReader();
        const info = await reader.listWorksheetInfo(testFile);

        expect(info).toHaveLength(3);
        expect(info[0]?.worksheetName).toBe('Sheet1');
        expect(info[1]?.worksheetName).toBe('LargeSheet');
        expect(info[2]?.worksheetName).toBe('EmptySheet');
    });

    it('should return correct dimensions for Sheet1', async () => {
        const reader = new XlsxReader();
        const info = await reader.listWorksheetInfo(testFile);
        
        const sheet1Info = info.find(i => i.worksheetName === 'Sheet1');
        expect(sheet1Info).toBeDefined();
        
        // D5 = column D is index 3 (0-based), row 5
        expect(sheet1Info!.lastColumnLetter).toBe('D');
        expect(sheet1Info!.lastColumnIndex).toBe(3); // 0-based
        expect(sheet1Info!.totalRows).toBe(5);
        expect(sheet1Info!.totalColumns).toBe(4);
        expect(sheet1Info!.sheetState).toBe('visible');
    });

    it('should return correct dimensions for LargeSheet', async () => {
        const reader = new XlsxReader();
        const info = await reader.listWorksheetInfo(testFile);
        
        const largeInfo = info.find(i => i.worksheetName === 'LargeSheet');
        expect(largeInfo).toBeDefined();
        
        // Z100 = column Z is index 25 (0-based), row 100
        expect(largeInfo!.lastColumnLetter).toBe('Z');
        expect(largeInfo!.lastColumnIndex).toBe(25); // 0-based
        expect(largeInfo!.totalRows).toBe(100);
        expect(largeInfo!.totalColumns).toBe(26);
        expect(largeInfo!.sheetState).toBe('visible');
    });

    it('should handle empty sheets', async () => {
        const reader = new XlsxReader();
        const info = await reader.listWorksheetInfo(testFile);
        
        const emptyInfo = info.find(i => i.worksheetName === 'EmptySheet');
        expect(emptyInfo).toBeDefined();
        
        // Empty sheet still has default dimensions in XLSX (at least A1)
        expect(emptyInfo!.totalRows).toBe(1);
        expect(emptyInfo!.totalColumns).toBe(1);
        expect(emptyInfo!.lastColumnIndex).toBe(0);
        expect(emptyInfo!.lastColumnLetter).toBe('A');
    });

    it('should throw error for non-existent file', async () => {
        const reader = new XlsxReader();
        
        await expect(
            reader.listWorksheetInfo('./non-existent-file.xlsx')
        ).rejects.toThrow();
    });
});
