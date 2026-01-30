import fs from 'node:fs';
import path from 'node:path';
import { afterAll, beforeAll, describe, expect, it } from 'bun:test';
import { Spreadsheet } from '../src/core/spreadsheet.ts';
import { XlsxReader } from '../src/io/xlsx-reader.ts';
import { XlsxWriter } from '../src/io/xlsx-writer.ts';

describe('XlsxReader Hyperlinks Integration', () => {
    const testDir = './test-output';
    const testFile = path.join(testDir, 'test-hyperlinks.xlsx');

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
    });

    afterAll(() => {
        if (fs.existsSync(testFile)) {
            fs.unlinkSync(testFile);
        }
    });

    it('should load external URL hyperlinks', async () => {
        const reader = new XlsxReader();
        const loaded = await reader.load(testFile);
        const sheet = loaded.getActiveSheet();

        const cell = sheet.getCell('A1');
        expect(cell.getValue()).toBe('Visit Google');
        expect(cell.getHyperlink().getUrl()).toBe('https://www.google.com');
    });

    it('should load multiple hyperlinks', async () => {
        const reader = new XlsxReader();
        const loaded = await reader.load(testFile);
        const sheet = loaded.getActiveSheet();

        const cell2 = sheet.getCell('A2');
        expect(cell2.getValue()).toBe('GitHub');
        expect(cell2.getHyperlink().getUrl()).toBe('https://github.com');
    });

    it('should handle cells without hyperlinks', async () => {
        const reader = new XlsxReader();
        const loaded = await reader.load(testFile);
        const sheet = loaded.getActiveSheet();

        const cell = sheet.getCell('A3');
        expect(cell.getValue()).toBe('No link here');
        // Hyperlink should be empty/default
        expect(cell.getHyperlink().getUrl()).toBe('');
    });

    it('should respect readDataOnly option for hyperlinks', async () => {
        const reader = new XlsxReader();
        reader.setReadDataOnly(true);

        const loaded = await reader.load(testFile);
        const sheet = loaded.getActiveSheet();

        const cell = sheet.getCell('A1');
        expect(cell.getValue()).toBe('Visit Google');
        // Hyperlink should not be loaded when readDataOnly is true
        expect(cell.getHyperlink().getUrl()).toBe('');
    });
});
