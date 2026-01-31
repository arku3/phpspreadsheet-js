import { PassThrough } from 'node:stream';
import archiver from 'archiver';
import { describe, expect, test } from 'bun:test';
import unzipper from 'unzipper';
import { Spreadsheet } from '../../../src/core/spreadsheet.ts';
import { XlsxReader } from '../../../src/io/xlsx-reader.ts';
import { XlsxWriter } from '../../../src/io/xlsx-writer.ts';

describe('XLSX Worksheet sheetPr/sheetFormatPr/printOptions reading', () => {
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

    test('Reads sheetPr codeName/outlines/pageSetUpPr/tabColor', async () => {
        const spreadsheet = new Spreadsheet();
        const bytes = await new XlsxWriter(spreadsheet).writeBuffer();

        const patched = await patchSheet1Xml(bytes, (xml) => {
            // Insert sheetPr right after <worksheet ...>
            return xml.replace(
                /(<worksheet\b[^>]*>)/,
                `$1<sheetPr codeName="MyCode"><tabColor rgb="FFFF0000"/><outlinePr summaryRight="0" summaryBelow="0"/><pageSetUpPr fitToPage="1"/></sheetPr>`,
            );
        });

        const loaded = await new XlsxReader().loadFromBuffer(patched);
        const sheet = loaded.getActiveSheet();

        expect(sheet.getCodeName()).toBe('MyCode');
        expect(sheet.getShowSummaryRight()).toBe(false);
        expect(sheet.getShowSummaryBelow()).toBe(false);
        expect(sheet.getPageSetup().getFitToPage()).toBe(true);
        expect(sheet.getTabColor().getARGB()).toBe('FFFF0000');
    });

    test('Reads sheetFormatPr defaultRowHeight/defaultColWidth/zeroHeight', async () => {
        const spreadsheet = new Spreadsheet();
        const bytes = await new XlsxWriter(spreadsheet).writeBuffer();

        const patched = await patchSheet1Xml(bytes, (xml) => {
            // Replace existing sheetFormatPr (writer emits it) to include our attrs.
            return xml.replace(
                /<sheetFormatPr\b[^>]*\/>/,
                '<sheetFormatPr defaultRowHeight="15" customHeight="1" defaultColWidth="12" zeroHeight="1"/>',
            );
        });

        const loaded = await new XlsxReader().loadFromBuffer(patched);
        const sheet = loaded.getActiveSheet();

        expect(sheet.getDefaultRowDimension().getRowHeight()).toBe(15);
        expect(sheet.getDefaultRowDimension().getZeroHeight()).toBe(true);
        expect(sheet.getDefaultColumnDimension().getWidth()).toBe(12);
    });

    test('Reads printOptions gridLines/gridLinesSet and centering when not readDataOnly', async () => {
        const spreadsheet = new Spreadsheet();
        const bytes = await new XlsxWriter(spreadsheet).writeBuffer();

        const patched = await patchSheet1Xml(bytes, (xml) => {
            // Insert printOptions before pageMargins.
            return xml.replace(
                /(<pageMargins\b)/,
                `<printOptions gridLines="1" gridLinesSet="1" horizontalCentered="1" verticalCentered="1"/>$1`,
            );
        });

        const loaded = await new XlsxReader().loadFromBuffer(patched);
        const sheet = loaded.getActiveSheet();

        expect(sheet.getPrintGridlines()).toBe(true);
        expect(sheet.getPageSetup().getHorizontalCentered()).toBe(true);
        expect(sheet.getPageSetup().getVerticalCentered()).toBe(true);
    });

    test('gridLinesSet="0" prevents enabling print gridlines (PhpSpreadsheet parity)', async () => {
        const spreadsheet = new Spreadsheet();
        const bytes = await new XlsxWriter(spreadsheet).writeBuffer();

        const patched = await patchSheet1Xml(bytes, (xml) => {
            return xml.replace(/(<pageMargins\b)/, `<printOptions gridLines="1" gridLinesSet="0"/>$1`);
        });

        const loaded = await new XlsxReader().loadFromBuffer(patched);
        expect(loaded.getActiveSheet().getPrintGridlines()).toBe(false);
    });

    test('readDataOnly skips printOptions', async () => {
        const spreadsheet = new Spreadsheet();
        const bytes = await new XlsxWriter(spreadsheet).writeBuffer();

        const patched = await patchSheet1Xml(bytes, (xml) => {
            return xml.replace(
                /(<pageMargins\b)/,
                `<printOptions gridLines="1" gridLinesSet="1" horizontalCentered="1" verticalCentered="1"/>$1`,
            );
        });

        const reader = new XlsxReader();
        reader.setReadDataOnly(true);
        const loaded = await reader.loadFromBuffer(patched);
        const sheet = loaded.getActiveSheet();

        expect(sheet.getPrintGridlines()).toBe(false);
        expect(sheet.getPageSetup().getHorizontalCentered()).toBe(false);
        expect(sheet.getPageSetup().getVerticalCentered()).toBe(false);
    });
});
