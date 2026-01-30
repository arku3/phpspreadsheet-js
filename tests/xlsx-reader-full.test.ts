import { describe, it, expect, beforeAll, afterAll } from 'bun:test';
import { XlsxReader } from '../src/io/xlsx-reader.ts';
import { XlsxWriter } from '../src/io/xlsx-writer.ts';
import { Spreadsheet } from '../src/core/spreadsheet.ts';
import fs from 'node:fs';
import path from 'node:path';

describe('XlsxReader Full Reading', () => {
    const testDir = './test-output';
    const multiSheetFile = path.join(testDir, 'test-multi-sheet.xlsx');
    const simpleFile = path.join(testDir, 'test-simple.xlsx');

    beforeAll(async () => {
        if (!fs.existsSync(testDir)) {
            fs.mkdirSync(testDir, { recursive: true });
        }

        // Create a simple XLSX file with multiple sheets
        const spreadsheet = new Spreadsheet();
        const sheet1 = spreadsheet.getActiveSheet();
        sheet1.setTitle('Sales Data');
        sheet1.getCell('A1').setValue('Product');
        sheet1.getCell('B1').setValue('Revenue');
        sheet1.getCell('A2').setValue('Widget A');
        sheet1.getCell('B2').setValue(1000);

        const sheet2 = spreadsheet.createSheet();
        sheet2.setTitle('Expenses');
        sheet2.getCell('A1').setValue('Category');
        sheet2.getCell('B1').setValue('Amount');
        sheet2.getCell('A2').setValue('Marketing');
        sheet2.getCell('B2').setValue(500);

        const sheet3 = spreadsheet.createSheet();
        sheet3.setTitle('Summary');
        sheet3.getCell('A1').setValue('Total Revenue');
        sheet3.getCell('B1').setValue('=Sales Data!B2');

        const writer = new XlsxWriter(spreadsheet);

        // Create a simple single-sheet file
        const simpleSpreadsheet = new Spreadsheet();
        simpleSpreadsheet.getActiveSheet().setTitle('Sheet1');
        simpleSpreadsheet.getActiveSheet().getCell('A1').setValue('Hello');
        
        const simpleWriter = new XlsxWriter(simpleSpreadsheet);
        await Promise.all([
            writer.save(multiSheetFile),
            simpleWriter.save(simpleFile),
        ]);
    }, 30_000);

    afterAll(() => {
        if (fs.existsSync(multiSheetFile)) {
            fs.unlinkSync(multiSheetFile);
        }
        if (fs.existsSync(simpleFile)) {
            fs.unlinkSync(simpleFile);
        }
    }, 30_000);

    it('should list worksheet names from multi-sheet file', async () => {
        const reader = new XlsxReader();
        const names = await reader.listWorksheetNames(multiSheetFile);
        
        expect(names).toHaveLength(3);
        expect(names).toContain('Sales Data');
        expect(names).toContain('Expenses');
        expect(names).toContain('Summary');
    });

    it('should list worksheet names from single-sheet file', async () => {
        const reader = new XlsxReader();
        const names = await reader.listWorksheetNames(simpleFile);
        
        expect(names).toHaveLength(1);
        expect(names[0]).toBe('Sheet1');
    });

    it('should throw error for non-existent file', async () => {
        const reader = new XlsxReader();
        
        await expect(
            reader.listWorksheetNames('./non-existent-file.xlsx')
        ).rejects.toThrow();
    });

    it('should throw error for invalid XLSX file', async () => {
        const invalidFile = path.join(testDir, 'invalid.xlsx');
        fs.writeFileSync(invalidFile, 'not a valid zip file');
        
        const reader = new XlsxReader();
        
        await expect(
            reader.listWorksheetNames(invalidFile)
        ).rejects.toThrow();
        
        fs.unlinkSync(invalidFile);
    });
});
