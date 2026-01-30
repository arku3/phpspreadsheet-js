import fs from 'node:fs';
import path from 'node:path';
import { afterAll, beforeAll, describe, expect, it } from 'bun:test';
import { Spreadsheet } from '../src/core/spreadsheet.ts';
import { XlsxReader } from '../src/io/xlsx-reader.ts';
import { XlsxWriter } from '../src/io/xlsx-writer.ts';

describe('XlsxReader Basic Infrastructure', () => {
    const testDir = './test-output';
    const testFile = path.join(testDir, 'test-read.xlsx');

    beforeAll(() => {
        if (!fs.existsSync(testDir)) {
            fs.mkdirSync(testDir, { recursive: true });
        }
    });

    afterAll(() => {
        if (fs.existsSync(testFile)) {
            fs.unlinkSync(testFile);
        }
    });

    it('should create XlsxReader instance', () => {
        const reader = new XlsxReader();
        expect(reader).toBeDefined();
        expect(reader).toBeInstanceOf(XlsxReader);
    });

    it('should have correct default settings', () => {
        const reader = new XlsxReader();

        expect(reader.getReadEmptyCells()).toBe(false);
        expect(reader.getReadDefaultStyles()).toBe(true);
        expect(reader.getReadDataOnly()).toBe(false);
        expect(reader.getReadFilter()).toBeNull();
    });

    it('should allow setting read options', () => {
        const reader = new XlsxReader();

        reader.setReadEmptyCells(true);
        expect(reader.getReadEmptyCells()).toBe(true);

        reader.setReadDefaultStyles(false);
        expect(reader.getReadDefaultStyles()).toBe(false);

        reader.setReadDataOnly(true);
        expect(reader.getReadDataOnly()).toBe(true);

        const filter = (name: string) => name === 'Sheet1';
        reader.setReadFilter(filter);
        expect(reader.getReadFilter()).toBe(filter);
    });

    it('should check if file exists with canRead', async () => {
        const reader = new XlsxReader();

        // Test with non-existent file
        const nonExistentResult = await reader.canRead('./non-existent-file.xlsx');
        expect(nonExistentResult).toBe(false);

        // Create a test file first
        const spreadsheet = new Spreadsheet();
        spreadsheet.getActiveSheet().getCell('A1').setValue('Test');

        const writer = new XlsxWriter(spreadsheet);
        await writer.save(testFile);

        // Test with existing file
        const existingResult = await reader.canRead(testFile);
        expect(existingResult).toBe(true);
    });

    it('should return empty arrays for listWorksheetNames (not yet implemented)', async () => {
        const reader = new XlsxReader();
        const names = await reader.listWorksheetNames(testFile);
        expect(Array.isArray(names)).toBe(true);
    });

    it('should return empty array for listWorksheetInfo (not yet implemented)', async () => {
        const reader = new XlsxReader();
        const info = await reader.listWorksheetInfo(testFile);
        expect(Array.isArray(info)).toBe(true);
    });

    it('should return empty spreadsheet for load (not yet implemented)', async () => {
        const reader = new XlsxReader();
        const spreadsheet = await reader.load(testFile);
        expect(spreadsheet).toBeDefined();
        expect(spreadsheet).toBeInstanceOf(Spreadsheet);
    });
});
