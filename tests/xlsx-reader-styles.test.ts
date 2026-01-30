import { randomUUID } from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { afterAll, beforeAll, describe, expect, it } from 'bun:test';
import { Spreadsheet } from '../src/core/spreadsheet.ts';
import { XlsxReader } from '../src/io/xlsx-reader.ts';
import { XlsxWriter } from '../src/io/xlsx-writer.ts';

describe('XlsxReader Styles Integration', () => {
    const testDir = path.join('test-output', 'xlsx-reader-styles');
    const testFile = path.join(testDir, `styles-${process.pid}-${randomUUID()}.xlsx`);
    let loadedSpreadsheet: Spreadsheet | undefined;
    let loadedSpreadsheetReadDataOnly: Spreadsheet | undefined;

    const getLoadedSpreadsheet = (): Spreadsheet => {
        if (!loadedSpreadsheet) {
            throw new Error('Test fixture spreadsheet was not loaded');
        }
        return loadedSpreadsheet;
    };

    const getLoadedSpreadsheetReadDataOnly = (): Spreadsheet => {
        if (!loadedSpreadsheetReadDataOnly) {
            throw new Error('Test fixture spreadsheet (readDataOnly) was not loaded');
        }
        return loadedSpreadsheetReadDataOnly;
    };

    beforeAll(async () => {
        if (!fs.existsSync(testDir)) {
            fs.mkdirSync(testDir, { recursive: true });
        }

        // Create XLSX file with various styles
        const spreadsheet = new Spreadsheet();
        const sheet = spreadsheet.getActiveSheet();

        // Bold cell
        const boldCell = sheet.getCell('A1');
        boldCell.setValue('Bold');
        boldCell.getStyle().getFont().setBold(true);

        // Italic cell
        const italicCell = sheet.getCell('A2');
        italicCell.setValue('Italic');
        italicCell.getStyle().getFont().setItalic(true);

        // Underline cell
        const underlineCell = sheet.getCell('A3');
        underlineCell.setValue('Underlined');
        underlineCell.getStyle().getFont().setUnderline('single');

        // Colored cell
        const coloredCell = sheet.getCell('A4');
        coloredCell.setValue('Red Text');
        coloredCell.getStyle().getFont().getColor().setARGB('FFFF0000');

        // Cell with fill
        const fillCell = sheet.getCell('A5');
        fillCell.setValue('Yellow Background');
        fillCell.getStyle().getFill().setFillType('solid');
        fillCell.getStyle().getFill().getStartColor().setARGB('FFFFFF00');

        // Cell with borders
        const borderCell = sheet.getCell('A6');
        borderCell.setValue('Borders');
        borderCell.getStyle().getBorders().getTop().setBorderStyle('thin');
        borderCell.getStyle().getBorders().getBottom().setBorderStyle('thin');
        borderCell.getStyle().getBorders().getLeft().setBorderStyle('thin');
        borderCell.getStyle().getBorders().getRight().setBorderStyle('thin');

        // Cell with number format
        const numCell = sheet.getCell('B1');
        numCell.setValue(1234.56);
        numCell.getStyle().getNumberFormat().setFormatCode('#,##0.00');

        // Save the file
        const writer = new XlsxWriter(spreadsheet);
        await writer.save(testFile);

        // Load once and reuse across tests to avoid repeated I/O in the full suite.
        // Also pre-load the readDataOnly fixture so the test doesn't do file I/O (avoids timeouts
        // and avoids ENOENT if other suites clean up test-output while tests are still running).
        const reader = new XlsxReader();
        loadedSpreadsheet = await reader.load(testFile);

        const readerReadDataOnly = new XlsxReader();
        readerReadDataOnly.setReadDataOnly(true);
        loadedSpreadsheetReadDataOnly = await readerReadDataOnly.load(testFile);
    }, 30_000);

    afterAll(() => {
        // Best-effort cleanup; the file may already be gone if another test cleaned the folder.
        try {
            if (fs.existsSync(testFile)) {
                fs.unlinkSync(testFile);
            }
        } catch {
            // ignore
        }
    });

    it('should load bold font style', async () => {
        const sheet = getLoadedSpreadsheet().getActiveSheet();

        const cell = sheet.getCell('A1');
        expect(cell.getValue()).toBe('Bold');
        expect(cell.getStyle().getFont().getBold()).toBe(true);
    });

    it('should load italic font style', async () => {
        const sheet = getLoadedSpreadsheet().getActiveSheet();

        const cell = sheet.getCell('A2');
        expect(cell.getValue()).toBe('Italic');
        expect(cell.getStyle().getFont().getItalic()).toBe(true);
    });

    it('should load underline font style', async () => {
        const sheet = getLoadedSpreadsheet().getActiveSheet();

        const cell = sheet.getCell('A3');
        expect(cell.getValue()).toBe('Underlined');
        expect(cell.getStyle().getFont().getUnderline()).toBe('single');
    });

    it('should load font color', async () => {
        const sheet = getLoadedSpreadsheet().getActiveSheet();

        const cell = sheet.getCell('A4');
        expect(cell.getValue()).toBe('Red Text');
        expect(cell.getStyle().getFont().getColor().getARGB()).toBe('FFFF0000');
    }, 20_000);

    it('should load fill style', async () => {
        const sheet = getLoadedSpreadsheet().getActiveSheet();

        const cell = sheet.getCell('A5');
        expect(cell.getValue()).toBe('Yellow Background');
        expect(cell.getStyle().getFill().getStartColor().getARGB()).toBe('FFFFFF00');
    });

    it('should load border styles', async () => {
        const sheet = getLoadedSpreadsheet().getActiveSheet();

        const cell = sheet.getCell('A6');
        expect(cell.getValue()).toBe('Borders');
        expect(cell.getStyle().getBorders().getTop().getBorderStyle()).toBe('thin');
        expect(cell.getStyle().getBorders().getBottom().getBorderStyle()).toBe('thin');
        expect(cell.getStyle().getBorders().getLeft().getBorderStyle()).toBe('thin');
        expect(cell.getStyle().getBorders().getRight().getBorderStyle()).toBe('thin');
    });

    it('should load number format', async () => {
        const sheet = getLoadedSpreadsheet().getActiveSheet();

        const cell = sheet.getCell('B1');
        expect(cell.getValue()).toBe(1234.56);
        expect(cell.getStyle().getNumberFormat().getFormatCode()).toBe('#,##0.00');
    });

    it('should respect readDataOnly option', async () => {
        const sheet = getLoadedSpreadsheetReadDataOnly().getActiveSheet();

        const cell = sheet.getCell('A1');
        expect(cell.getValue()).toBe('Bold');
        // Style should not be applied when readDataOnly is true
        expect(cell.getStyle().getFont().getBold()).toBe(false);
    }, 20_000);
});
