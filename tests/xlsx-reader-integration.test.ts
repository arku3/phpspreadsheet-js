import fs from 'node:fs';
import path from 'node:path';
import { afterAll, beforeAll, describe, expect, it } from 'bun:test';
import { Spreadsheet } from '../src/core/spreadsheet.ts';
import { XlsxReader } from '../src/io/xlsx-reader.ts';
import { XlsxWriter } from '../src/io/xlsx-writer.ts';

describe('XlsxReader Load Integration', () => {
    const SETUP_TIMEOUT_MS = 30_000;
    const SLOW_TEST_TIMEOUT_MS = 20_000;

    // Use a dedicated folder to avoid collisions with other integration tests
    // that also write into ./test-output.
    const testDir = path.resolve(process.cwd(), 'test-output', 'xlsx-reader-integration');
    const testFile = path.join(testDir, 'test-load.xlsx');

    let loadedOnce: Spreadsheet;

    beforeAll(async () => {
        if (!fs.existsSync(testDir)) {
            fs.mkdirSync(testDir, { recursive: true });
        }

        if (fs.existsSync(testFile)) {
            fs.unlinkSync(testFile);
        }

        // Create a comprehensive XLSX file with various data types
        const spreadsheet = new Spreadsheet();
        const sheet = spreadsheet.getActiveSheet();

        // Header row
        sheet.getCell('A1').setValue('Product');
        sheet.getCell('B1').setValue('Quantity');
        sheet.getCell('C1').setValue('Price');
        sheet.getCell('D1').setValue('Total');

        // Data rows with different types
        sheet.getCell('A2').setValue('Widget A');
        sheet.getCell('B2').setValue(10);
        sheet.getCell('C2').setValue(29.99);
        sheet.getCell('D2').setValue('=B2*C2');

        sheet.getCell('A3').setValue('Widget B');
        sheet.getCell('B3').setValue(5);
        sheet.getCell('C3').setValue(49.99);
        sheet.getCell('D3').setValue(249.95);

        sheet.getCell('A4').setValue('Widget C');
        sheet.getCell('B4').setValue(0);
        sheet.getCell('C4').setValue(99.99);

        // Large number
        sheet.getCell('A5').setValue(1000000);

        // Decimal
        sheet.getCell('A6').setValue(3.14159);

        // Save the file
        const writer = new XlsxWriter(spreadsheet);
        await writer.save(testFile);

        // Load once for the rest of the assertions to avoid repeated IO.
        // This makes the suite stable under full-suite contention.
        const reader = new XlsxReader();
        loadedOnce = await reader.load(testFile);
    }, SETUP_TIMEOUT_MS);

    afterAll(() => {
        if (fs.existsSync(testFile)) {
            fs.unlinkSync(testFile);
        }
    });

    it('should load spreadsheet with correct worksheet structure', async () => {
        const loaded = loadedOnce;

        expect(loaded).toBeDefined();
        expect(loaded).toBeInstanceOf(Spreadsheet);
        expect(loaded.getSheetCount()).toBe(1);

        const sheet = loaded.getActiveSheet();
        expect(sheet.getTitle()).toBe('Worksheet 1');
    });

    it('should load string values correctly', async () => {
        const loaded = loadedOnce;
        const sheet = loaded.getActiveSheet();

        expect(sheet.getCell('A1').getValue()).toBe('Product');
        expect(sheet.getCell('A2').getValue()).toBe('Widget A');
        expect(sheet.getCell('A3').getValue()).toBe('Widget B');
        expect(sheet.getCell('A4').getValue()).toBe('Widget C');
    });

    it('should load numeric values correctly', async () => {
        const loaded = loadedOnce;
        const sheet = loaded.getActiveSheet();

        expect(sheet.getCell('B2').getValue()).toBe(10);
        expect(sheet.getCell('B3').getValue()).toBe(5);
        expect(sheet.getCell('B4').getValue()).toBe(0);
        expect(sheet.getCell('A5').getValue()).toBe(1000000);
        expect(sheet.getCell('A6').getValue()).toBe(3.14159);
    });

    it('should load decimal values correctly', async () => {
        const loaded = loadedOnce;
        const sheet = loaded.getActiveSheet();

        expect(sheet.getCell('C2').getValue()).toBe(29.99);
        expect(sheet.getCell('C3').getValue()).toBe(49.99);
        expect(sheet.getCell('C4').getValue()).toBe(99.99);
        expect(sheet.getCell('D3').getValue()).toBe(249.95);
    });

    it('should load formulas correctly', async () => {
        const loaded = loadedOnce;
        const sheet = loaded.getActiveSheet();

        const formulaCell = sheet.getCell('D2');
        expect(formulaCell.getValue()).toBe('=B2*C2');
        expect(formulaCell.isFormula()).toBe(true);
    });

    it(
        'should load multi-sheet file correctly',
        async () => {
            const multiFile = path.join(testDir, 'test-multi-load.xlsx');

            try {
                // Create multi-sheet file
                const spreadsheet = new Spreadsheet();
                const sheet1 = spreadsheet.getActiveSheet();
                sheet1.setTitle('Sheet1');
                sheet1.getCell('A1').setValue('Data from Sheet1');

                const sheet2 = spreadsheet.createSheet();
                sheet2.setTitle('Sheet2');
                sheet2.getCell('A1').setValue('Data from Sheet2');

                if (fs.existsSync(multiFile)) {
                    fs.unlinkSync(multiFile);
                }

                const writer = new XlsxWriter(spreadsheet);
                await writer.save(multiFile);

                // Load and verify
                const reader = new XlsxReader();
                const loaded = await reader.load(multiFile);

                // Expect 2 sheets (Sheet1 and Sheet2)
                expect(loaded.getSheetCount()).toBe(2);

                const loadedSheet1 = loaded.getSheetByName('Sheet1');
                const loadedSheet2 = loaded.getSheetByName('Sheet2');

                expect(loadedSheet1).toBeDefined();
                expect(loadedSheet2).toBeDefined();
                expect(loadedSheet1!.getCell('A1').getValue()).toBe('Data from Sheet1');
                expect(loadedSheet2!.getCell('A1').getValue()).toBe('Data from Sheet2');
            } finally {
                if (fs.existsSync(multiFile)) {
                    fs.unlinkSync(multiFile);
                }
            }
        },
        SLOW_TEST_TIMEOUT_MS,
    );

    it('should respect read filter', async () => {
        const reader = new XlsxReader();

        // Set filter to only read Sheet1
        reader.setReadFilter((name) => name === 'Worksheet');

        const loaded = await reader.load(testFile);

        // Should still have one sheet (the active one)
        expect(loaded.getSheetCount()).toBeGreaterThanOrEqual(1);
        expect(loaded.getActiveSheet().getTitle()).toBe('Worksheet 1');
    });
});
