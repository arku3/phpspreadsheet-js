import { randomUUID } from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { afterAll, beforeAll, describe, expect, it } from 'bun:test';
import { DataValidation } from '../src/core/data-validation.ts';
import { Spreadsheet } from '../src/core/spreadsheet.ts';
import { XlsxReader } from '../src/io/xlsx-reader.ts';
import { XlsxWriter } from '../src/io/xlsx-writer.ts';

describe('XlsxReader Data Validation Integration', () => {
    const HOOK_TIMEOUT_MS = 30_000;
    const TEST_TIMEOUT_MS = 20_000;

    const testDir = path.join('test-output', 'xlsx-reader-data-validation');
    const runId = `${process.pid}-${randomUUID()}`;
    const testFile = path.join(testDir, `test-data-validation-${runId}.xlsx`);

    let loadedDefault: Spreadsheet;

    beforeAll(async () => {
        fs.mkdirSync(testDir, { recursive: true });

        // Create XLSX file with data validations
        const spreadsheet = new Spreadsheet();
        const sheet = spreadsheet.getActiveSheet();

        // Whole number validation (between 1 and 100)
        const cellA1 = sheet.getCell('A1');
        cellA1.setValue(50);
        const dv1 = new DataValidation();
        dv1.setType(DataValidation.TYPE_WHOLE);
        dv1.setOperator(DataValidation.OPERATOR_BETWEEN);
        dv1.setFormula1('1');
        dv1.setFormula2('100');
        dv1.setAllowBlank(false);
        dv1.setShowInputMessage(true);
        dv1.setPromptTitle('Enter Number');
        dv1.setPrompt('Please enter a whole number between 1 and 100');
        dv1.setShowErrorMessage(true);
        dv1.setErrorTitle('Invalid Input');
        dv1.setError('Please enter a number between 1 and 100');
        cellA1.setDataValidation(dv1);

        // List validation
        const cellA2 = sheet.getCell('A2');
        cellA2.setValue('Option1');
        const dv2 = new DataValidation();
        dv2.setType(DataValidation.TYPE_LIST);
        dv2.setFormula1('Option1,Option2,Option3');
        dv2.setAllowBlank(true);
        dv2.setShowDropDown(true);
        cellA2.setDataValidation(dv2);

        // Decimal validation (greater than 0)
        const cellA3 = sheet.getCell('A3');
        cellA3.setValue(10.5);
        const dv3 = new DataValidation();
        dv3.setType(DataValidation.TYPE_DECIMAL);
        dv3.setOperator(DataValidation.OPERATOR_GREATERTHAN);
        dv3.setFormula1('0');
        cellA3.setDataValidation(dv3);

        // Save the file
        const writer = new XlsxWriter(spreadsheet);
        await writer.save(testFile);
        const reader = new XlsxReader();
        loadedDefault = await reader.load(testFile);
    }, HOOK_TIMEOUT_MS);

    afterAll(() => {
        try {
            if (fs.existsSync(testFile)) {
                fs.unlinkSync(testFile);
            }
        } catch {
            // Best-effort cleanup; avoid failing suite on IO contention.
        }
    }, HOOK_TIMEOUT_MS);

    it(
        'should load whole number validation',
        async () => {
            const sheet = loadedDefault.getActiveSheet();

            expect(sheet.dataValidationExists('A1')).toBe(true);

            const dv = sheet.getDataValidation('A1');
            expect(dv).toBeDefined();
            expect(dv!.getType()).toBe(DataValidation.TYPE_WHOLE);
            expect(dv!.getOperator()).toBe(DataValidation.OPERATOR_BETWEEN);
            expect(dv!.getFormula1()).toBe('1');
            expect(dv!.getFormula2()).toBe('100');
            expect(dv!.getAllowBlank()).toBe(false);
            expect(dv!.getShowInputMessage()).toBe(true);
            expect(dv!.getPromptTitle()).toBe('Enter Number');
            expect(dv!.getPrompt()).toBe('Please enter a whole number between 1 and 100');
            expect(dv!.getShowErrorMessage()).toBe(true);
            expect(dv!.getErrorTitle()).toBe('Invalid Input');
            expect(dv!.getError()).toBe('Please enter a number between 1 and 100');
        },
        TEST_TIMEOUT_MS,
    );

    it(
        'should load list validation',
        async () => {
            const sheet = loadedDefault.getActiveSheet();

            expect(sheet.dataValidationExists('A2')).toBe(true);

            const dv = sheet.getDataValidation('A2');
            expect(dv).toBeDefined();
            expect(dv!.getType()).toBe(DataValidation.TYPE_LIST);
            expect(dv!.getFormula1()).toBe('Option1,Option2,Option3');
            expect(dv!.getAllowBlank()).toBe(true);
            expect(dv!.getShowDropDown()).toBe(true);
        },
        TEST_TIMEOUT_MS,
    );

    it(
        'should load decimal validation',
        async () => {
            const sheet = loadedDefault.getActiveSheet();

            expect(sheet.dataValidationExists('A3')).toBe(true);

            const dv = sheet.getDataValidation('A3');
            expect(dv).toBeDefined();
            expect(dv!.getType()).toBe(DataValidation.TYPE_DECIMAL);
            expect(dv!.getOperator()).toBe(DataValidation.OPERATOR_GREATERTHAN);
            expect(dv!.getFormula1()).toBe('0');
        },
        TEST_TIMEOUT_MS,
    );

    it(
        'should handle cells without data validation',
        async () => {
            const sheet = loadedDefault.getActiveSheet();

            expect(sheet.dataValidationExists('B1')).toBe(false);
            expect(sheet.getDataValidation('B1')).toBeNull();
        },
        TEST_TIMEOUT_MS,
    );

    it(
        'should get data validation from cell',
        async () => {
            const sheet = loadedDefault.getActiveSheet();

            const cell = sheet.getCell('A1');
            const dv = cell.getDataValidation();
            expect(dv).toBeDefined();
            expect(dv!.getType()).toBe(DataValidation.TYPE_WHOLE);
        },
        TEST_TIMEOUT_MS,
    );

    it(
        'should get all data validations collection',
        async () => {
            const sheet = loadedDefault.getActiveSheet();

            const collection = sheet.getDataValidationCollection();
            expect(collection.size).toBe(3);
            expect(collection.has('A1')).toBe(true);
            expect(collection.has('A2')).toBe(true);
            expect(collection.has('A3')).toBe(true);
        },
        TEST_TIMEOUT_MS,
    );

    it(
        'should respect readDataOnly option',
        async () => {
            const reader = new XlsxReader();
            reader.setReadDataOnly(true);

            const loaded = await reader.load(testFile);
            const sheet = loaded.getActiveSheet();

            // Data validations should not be loaded when readDataOnly is true
            expect(sheet.dataValidationExists('A1')).toBe(false);
            expect(sheet.getDataValidationCollection().size).toBe(0);
        },
        TEST_TIMEOUT_MS,
    );
});
