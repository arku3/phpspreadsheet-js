import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { afterAll, beforeAll, describe, expect, it } from 'bun:test';
import { Spreadsheet } from '../src/core/spreadsheet.ts';
import { Worksheet } from '../src/core/worksheet.ts';
import { XlsxReader } from '../src/io/xlsx-reader.ts';
import { XlsxWriter } from '../src/io/xlsx-writer.ts';

describe('XlsxReader listWorksheetInfo', () => {
    const HOOK_TIMEOUT_MS = 30_000;
    const TEST_TIMEOUT_MS = 20_000;

    const baseDir = path.join('test-output', 'xlsx-reader-worksheet-info');
    const runDir = path.join(baseDir, `${process.pid}-${crypto.randomUUID()}`);
    const testFile = path.join(runDir, 'worksheet-info.xlsx');

    type WorksheetInfo = Awaited<ReturnType<XlsxReader['listWorksheetInfo']>>;
    let worksheetInfo: WorksheetInfo;

    beforeAll(async () => {
        await fs.promises.mkdir(runDir, { recursive: true });

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
        sheet3.setSheetState(Worksheet.SHEETSTATE_HIDDEN);
        // Leave empty

        const writer = new XlsxWriter(spreadsheet);
        await writer.save(testFile);
        const reader = new XlsxReader();
        worksheetInfo = await reader.listWorksheetInfo(testFile);
    }, HOOK_TIMEOUT_MS);

    afterAll(async () => {
        try {
            await fs.promises.rm(runDir, { recursive: true, force: true });
        } catch {
            // Best-effort cleanup; do not fail the suite.
        }
    }, HOOK_TIMEOUT_MS);

    it(
        'should return worksheet info for each sheet',
        async () => {
            const info = worksheetInfo;

            expect(info).toHaveLength(3);
            expect(info[0]?.worksheetName).toBe('Sheet1');
            expect(info[1]?.worksheetName).toBe('LargeSheet');
            expect(info[2]?.worksheetName).toBe('EmptySheet');
        },
        TEST_TIMEOUT_MS,
    );

    it(
        'should return correct dimensions for Sheet1',
        async () => {
            const info = worksheetInfo;

            const sheet1Info = info.find((i) => i.worksheetName === 'Sheet1');
            expect(sheet1Info).toBeDefined();

            // D5 = column D is index 3 (0-based), row 5
            expect(sheet1Info!.lastColumnLetter).toBe('D');
            expect(sheet1Info!.lastColumnIndex).toBe(3); // 0-based
            expect(sheet1Info!.totalRows).toBe(5);
            expect(sheet1Info!.totalColumns).toBe(4);
            expect(sheet1Info!.sheetState).toBe('visible');
        },
        TEST_TIMEOUT_MS,
    );

    it(
        'should return correct dimensions for LargeSheet',
        async () => {
            const info = worksheetInfo;

            const largeInfo = info.find((i) => i.worksheetName === 'LargeSheet');
            expect(largeInfo).toBeDefined();

            // Z100 = column Z is index 25 (0-based), row 100
            expect(largeInfo!.lastColumnLetter).toBe('Z');
            expect(largeInfo!.lastColumnIndex).toBe(25); // 0-based
            expect(largeInfo!.totalRows).toBe(100);
            expect(largeInfo!.totalColumns).toBe(26);
            expect(largeInfo!.sheetState).toBe('visible');
        },
        TEST_TIMEOUT_MS,
    );

    it(
        'should handle empty sheets',
        async () => {
            const info = worksheetInfo;

            const emptyInfo = info.find((i) => i.worksheetName === 'EmptySheet');
            expect(emptyInfo).toBeDefined();

            // Empty sheet has default dimensions in XLSX
            expect(emptyInfo!.totalRows).toBe(1);
            expect(emptyInfo!.totalColumns).toBe(1);
            expect(emptyInfo!.lastColumnIndex).toBe(0);
            expect(emptyInfo!.lastColumnLetter).toBe('A');
            expect(emptyInfo!.sheetState).toBe('hidden');
        },
        TEST_TIMEOUT_MS,
    );

    it(
        'should throw error for non-existent file',
        async () => {
            const reader = new XlsxReader();

            await expect(reader.listWorksheetInfo('./non-existent-file.xlsx')).rejects.toThrow();
        },
        TEST_TIMEOUT_MS,
    );
});
