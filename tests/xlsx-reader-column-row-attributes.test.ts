import { Buffer } from 'node:buffer';
import { PassThrough } from 'node:stream';
import archiver from 'archiver';
import { beforeAll, describe, expect, it } from 'bun:test';
import unzipper from 'unzipper';
import { Spreadsheet } from '../src/core/spreadsheet.ts';
import { XlsxReader } from '../src/io/xlsx-reader.ts';
import { XlsxWriter } from '../src/io/xlsx-writer.ts';

describe('XlsxReader Column/Row Attributes', () => {
    let loadedSpreadsheet: Spreadsheet | undefined;
    let loadedSpreadsheetReadDataOnly: Spreadsheet | undefined;

    async function patchSheet1Xml(bytes: Uint8Array, patch: (sheet1Xml: string) => string): Promise<Uint8Array> {
        const zip = await unzipper.Open.buffer(Buffer.from(bytes));
        const files = new Map<string, Buffer>();
        for (const entry of zip.files) {
            const buf = await entry.buffer();
            files.set(entry.path, buf);
        }

        const sheetPath = 'xl/worksheets/sheet1.xml';
        const sheet = files.get(sheetPath);
        if (!sheet) {
            throw new Error(`Expected zip entry to exist: ${sheetPath}`);
        }
        files.set(sheetPath, Buffer.from(patch(sheet.toString('utf-8')), 'utf-8'));

        const out = new PassThrough();
        const zipOut = archiver('zip', { zlib: { level: 0 } });
        zipOut.pipe(out);

        const fixedDate = new Date(0);
        const names = [...files.keys()].sort();
        for (const name of names) {
            zipOut.append(files.get(name)!, { name, date: fixedDate });
        }
        await zipOut.finalize();

        const chunks: Buffer[] = [];
        for await (const chunk of out) {
            chunks.push(Buffer.from(chunk));
        }
        return new Uint8Array(Buffer.concat(chunks));
    }

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
        const spreadsheet = new Spreadsheet();
        const sheet = spreadsheet.getActiveSheet();

        sheet.getCell('A1').setValue('x');

        const bytes = await new XlsxWriter(spreadsheet).writeBuffer();
        const patched = await patchSheet1Xml(bytes, (xml) => {
            const withCols = xml.replace(
                /(<sheetData\b)/,
                '<cols>' +
                    '<col min="2" max="2" width="22" customWidth="1"/>' +
                    '<col min="3" max="3" hidden="1"/>' +
                    '</cols>$1',
            );
            if (withCols === xml) {
                throw new Error('Expected sheet1.xml patch to insert <cols>');
            }

            const withRow = withCols.replace(
                /<\/sheetData>/,
                // Row 3: has explicit height + customFormat (style) and is hidden
                '<row r="3" ht="25" customHeight="1" s="1" customFormat="1" hidden="1"/>' +
                    // Row 4: has customFormat (style) + hidden, but no height
                    '<row r="4" s="1" customFormat="1" hidden="1"/></sheetData>',
            );
            if (withRow === withCols) {
                throw new Error('Expected sheet1.xml patch to insert <row>');
            }
            return withRow;
        });

        loadedSpreadsheet = await new XlsxReader().loadFromBuffer(patched);

        const readerReadDataOnly = new XlsxReader();
        readerReadDataOnly.setReadDataOnly(true);
        loadedSpreadsheetReadDataOnly = await readerReadDataOnly.loadFromBuffer(patched);
    }, 30_000);

    it('should load hidden column', () => {
        const sheet = getLoadedSpreadsheet().getActiveSheet();
        expect(sheet.getColumnDimension('C').getVisible()).toBe(false);
    });

    it('should load column width', () => {
        const sheet = getLoadedSpreadsheet().getActiveSheet();
        expect(sheet.getColumnDimension('B').getWidth()).toBe(22);
    });

    it('should load hidden row with height', () => {
        const sheet = getLoadedSpreadsheet().getActiveSheet();
        expect(sheet.getRowDimension(3).getVisible()).toBe(false);
        expect(sheet.getRowDimension(3).getRowHeight()).toBe(25);
    });

    it('should not infer row height from customFormat', () => {
        const sheet = getLoadedSpreadsheet().getActiveSheet();
        expect(sheet.getRowDimension(4).getVisible()).toBe(false);
        expect(sheet.getRowDimension(4).getRowHeight()).toBe(-1);
    });

    it('should respect readDataOnly for row sizing while keeping hidden/width columns', () => {
        const sheet = getLoadedSpreadsheetReadDataOnly().getActiveSheet();

        // Column width/hidden are read even in readDataOnly mode.
        expect(sheet.getColumnDimension('C').getVisible()).toBe(false);
        expect(sheet.getColumnDimension('B').getWidth()).toBe(22);

        // Row attributes are not loaded in readDataOnly.
        expect(sheet.rowDimensionExists(3)).toBe(false);
        expect(sheet.rowDimensionExists(4)).toBe(false);
    });
});
