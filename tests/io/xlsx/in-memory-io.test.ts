import path from 'node:path';
import { describe, expect, test } from 'bun:test';
import unzipper from 'unzipper';
import { Spreadsheet } from '../../../src/core/spreadsheet.ts';
import { Worksheet } from '../../../src/core/worksheet.ts';
import { XlsxReader } from '../../../src/io/xlsx-reader.ts';
import { XlsxWriter } from '../../../src/io/xlsx-writer.ts';

describe('XLSX in-memory IO', () => {
    const openZipFromUint8 = async (bytes: Uint8Array) => unzipper.Open.buffer(Buffer.from(bytes));

    const expectZipEntry = (zip: unzipper.CentralDirectory, zipPath: string) => {
        const entry = zip.files.find((f) => f.path === zipPath);
        expect(entry, `Expected zip entry to exist: ${zipPath}`).toBeDefined();
        return entry!;
    };

    test('XlsxWriter.writeBuffer returns non-empty bytes and required XLSX parts', async () => {
        const spreadsheet = new Spreadsheet();
        const sheet = spreadsheet.getActiveSheet();
        sheet.getCell('A1').setValue('Hello');

        const writer = new XlsxWriter(spreadsheet);
        const bytes = await writer.writeBuffer();

        expect(bytes.byteLength).toBeGreaterThan(0);

        const zip = await openZipFromUint8(bytes);
        expect(zip.files.length).toBeGreaterThan(0);

        expectZipEntry(zip, '[Content_Types].xml');
        expectZipEntry(zip, '_rels/.rels');
        expectZipEntry(zip, 'xl/workbook.xml');
        expectZipEntry(zip, 'xl/_rels/workbook.xml.rels');
        expectZipEntry(zip, 'xl/worksheets/sheet1.xml');

        const relsXml = (await expectZipEntry(zip, '_rels/.rels').buffer()).toString('utf-8');
        expect(relsXml).toContain('relationships/officeDocument');
        expect(relsXml).toContain('Target="xl/workbook.xml"');

        const sheet1Xml = (await expectZipEntry(zip, 'xl/worksheets/sheet1.xml').buffer()).toString('utf-8');
        expect(sheet1Xml).toContain('<worksheet');
    });

    test('XlsxReader.loadFromBuffer loads bytes produced by writeBuffer (round-trip)', async () => {
        const spreadsheet = new Spreadsheet();
        const sheet = spreadsheet.getActiveSheet();

        sheet.getCell('A1').setValue('Product');
        sheet.getCell('B2').setValue(10);
        sheet.getCell('C2').setValue(2.5);
        sheet.getCell('D2').setValue('=B2*C2');

        const writer = new XlsxWriter(spreadsheet);
        const bytes = await writer.writeBuffer();

        const reader = new XlsxReader();
        const loaded = await reader.loadFromBuffer(bytes);
        const loadedSheet = loaded.getActiveSheet();

        expect(loaded.getSheetCount()).toBe(1);
        expect(loadedSheet.getCell('A1').getValue()).toBe('Product');
        expect(loadedSheet.getCell('B2').getValue()).toBe(10);
        expect(loadedSheet.getCell('C2').getValue()).toBe(2.5);
        expect(loadedSheet.getCell('D2').getValue()).toBe('=B2*C2');
        expect(loadedSheet.getCell('D2').isFormula()).toBe(true);
    });

    test('sheet visibility (hidden) round-trips via workbook.xml sheet state', async () => {
        const spreadsheet = new Spreadsheet();
        const sheet1 = spreadsheet.getActiveSheet();
        sheet1.setTitle('Visible');

        const hiddenSheet = spreadsheet.createSheet().setTitle('Hidden');
        hiddenSheet.setSheetState(Worksheet.SHEETSTATE_HIDDEN);

        const writer = new XlsxWriter(spreadsheet);
        const bytes = await writer.writeBuffer();

        const reader = new XlsxReader();
        const loaded = await reader.loadFromBuffer(bytes);

        expect(loaded.getSheetByName('Hidden')?.getSheetState()).toBe(Worksheet.SHEETSTATE_HIDDEN);
    });

    test('sheet visibility (veryHidden) round-trips via workbook.xml sheet state', async () => {
        const spreadsheet = new Spreadsheet();
        const sheet1 = spreadsheet.getActiveSheet();
        sheet1.setTitle('Visible');

        const veryHiddenSheet = spreadsheet.createSheet().setTitle('VeryHidden');
        veryHiddenSheet.setSheetState(Worksheet.SHEETSTATE_VERYHIDDEN);

        const writer = new XlsxWriter(spreadsheet);
        const bytes = await writer.writeBuffer();

        const reader = new XlsxReader();
        const loaded = await reader.loadFromBuffer(bytes);

        expect(loaded.getSheetByName('VeryHidden')?.getSheetState()).toBe(Worksheet.SHEETSTATE_VERYHIDDEN);
    });

    test('loadFromBuffer supports reading an existing fixture via Bun.file().arrayBuffer()', async () => {
        const fixturePath = path.resolve(
            process.cwd(),
            'tests',
            'fixtures',
            'xlsx',
            'charts',
            'issue.3767.single-embedded-chart.xlsx',
        );

        const fixtureBytes = new Uint8Array(await Bun.file(fixturePath).arrayBuffer());
        expect(fixtureBytes.byteLength).toBeGreaterThan(0);

        const zip = await openZipFromUint8(fixtureBytes);
        expectZipEntry(zip, '_rels/.rels');

        const reader = new XlsxReader();
        const loaded = await reader.loadFromBuffer(fixtureBytes);
        expect(loaded.getSheetCount()).toBeGreaterThan(0);
    });
});
