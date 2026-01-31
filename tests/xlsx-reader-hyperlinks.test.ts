import { randomUUID } from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { afterAll, beforeAll, describe, expect, it } from 'bun:test';
import { Spreadsheet } from '../src/core/spreadsheet.ts';
import { XlsxReader } from '../src/io/xlsx-reader.ts';
import { XlsxWriter } from '../src/io/xlsx-writer.ts';

describe('XlsxReader Hyperlinks Integration', () => {
    const testDir = path.resolve('test-output', 'xlsx-reader-hyperlinks');
    const testFile = path.join(testDir, `hyperlinks-${process.pid}-${randomUUID()}.xlsx`);

    let loadedDefault: Spreadsheet | null = null;
    let loadedReadDataOnly: Spreadsheet | null = null;

    beforeAll(async () => {
        if (!fs.existsSync(testDir)) {
            fs.mkdirSync(testDir, { recursive: true });
        }

        // Create XLSX file with hyperlinks
        const spreadsheet = new Spreadsheet();
        const sheet = spreadsheet.getActiveSheet();

        // External URL hyperlink
        const linkCell = sheet.getCell('A1');
        linkCell.setValue('Visit Google');
        linkCell.getHyperlink().setUrl('https://www.google.com');

        // Another external link
        const linkCell2 = sheet.getCell('A2');
        linkCell2.setValue('GitHub');
        linkCell2.getHyperlink().setUrl('https://github.com');

        // Cell without hyperlink
        const normalCell = sheet.getCell('A3');
        normalCell.setValue('No link here');

        // Save the file
        const writer = new XlsxWriter(spreadsheet);
        await writer.save(testFile);
        const readerDefault = new XlsxReader();
        loadedDefault = await readerDefault.load(testFile);

        const readerReadDataOnly = new XlsxReader();
        readerReadDataOnly.setReadDataOnly(true);
        loadedReadDataOnly = await readerReadDataOnly.load(testFile);
    }, 30000);

    afterAll(() => {
        try {
            if (fs.existsSync(testFile)) {
                fs.unlinkSync(testFile);
            }
        } catch {
            // best-effort cleanup; do not fail tests
        }
    }, 30000);

    it('should load external URL hyperlinks', async () => {
        expect(loadedDefault).not.toBeNull();
        const sheet = loadedDefault!.getActiveSheet();

        const cell = sheet.getCell('A1');
        expect(cell.getValue()).toBe('Visit Google');
        expect(cell.getHyperlink().getUrl()).toBe('https://www.google.com');
    }, 20000);

    it('should load multiple hyperlinks', async () => {
        expect(loadedDefault).not.toBeNull();
        const sheet = loadedDefault!.getActiveSheet();

        const cell2 = sheet.getCell('A2');
        expect(cell2.getValue()).toBe('GitHub');
        expect(cell2.getHyperlink().getUrl()).toBe('https://github.com');
    }, 20000);

    it('should handle cells without hyperlinks', async () => {
        expect(loadedDefault).not.toBeNull();
        const sheet = loadedDefault!.getActiveSheet();

        const cell = sheet.getCell('A3');
        expect(cell.getValue()).toBe('No link here');
        // Hyperlink should be empty/default
        expect(cell.getHyperlink().getUrl()).toBe('');
    }, 20000);

    it('should respect readDataOnly option for hyperlinks', async () => {
        expect(loadedReadDataOnly).not.toBeNull();
        const sheet = loadedReadDataOnly!.getActiveSheet();

        const cell = sheet.getCell('A1');
        expect(cell.getValue()).toBe('Visit Google');
        // Hyperlink should not be loaded when readDataOnly is true
        expect(cell.getHyperlink().getUrl()).toBe('');
    }, 20000);
});
