import { Buffer } from 'node:buffer';
import { PassThrough } from 'node:stream';
import archiver from 'archiver';
import { describe, expect, test } from 'bun:test';
import unzipper from 'unzipper';
import { Spreadsheet } from '../../../src/core/spreadsheet.ts';
import { XlsxReader } from '../../../src/io/xlsx-reader.ts';
import { XlsxWriter } from '../../../src/io/xlsx-writer.ts';

describe('XLSX worksheet pageMargins/pageSetup/headerFooter/breaks reading', () => {
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

    test('Reads pageMargins', async () => {
        const spreadsheet = new Spreadsheet();
        const bytes = await new XlsxWriter(spreadsheet).writeBuffer();

        const patched = await patchSheet1Xml(bytes, (xml) =>
            xml.replace(
                /<pageMargins\b[^>]*\/>/,
                '<pageMargins left="1.1" right="1.2" top="1.3" bottom="1.4" header="0.5" footer="0.6"/>',
            ),
        );

        const loaded = await new XlsxReader().loadFromBuffer(patched);
        const margins = loaded.getActiveSheet().getPageMargins();
        expect(margins.getLeft()).toBeCloseTo(1.1);
        expect(margins.getRight()).toBeCloseTo(1.2);
        expect(margins.getTop()).toBeCloseTo(1.3);
        expect(margins.getBottom()).toBeCloseTo(1.4);
        expect(margins.getHeader()).toBeCloseTo(0.5);
        expect(margins.getFooter()).toBeCloseTo(0.6);
    });

    test('Reads headerFooter and manual breaks', async () => {
        const spreadsheet = new Spreadsheet();
        const bytes = await new XlsxWriter(spreadsheet).writeBuffer();

        const patched = await patchSheet1Xml(bytes, (xml) => {
            // Insert headerFooter + breaks after pageSetup (writer always emits pageSetup).
            const insert =
                '<headerFooter differentFirst="1" alignWithMargins="0">' +
                '<oddHeader>&amp;LHello</oddHeader>' +
                '<oddFooter></oddFooter>' +
                '<evenHeader></evenHeader>' +
                '<evenFooter></evenFooter>' +
                '<firstHeader></firstHeader>' +
                '<firstFooter></firstFooter>' +
                '</headerFooter>' +
                '<rowBreaks count="2" manualBreakCount="2"><brk id="3" man="1"/><brk id="9" man="0"/></rowBreaks>' +
                '<colBreaks count="2" manualBreakCount="2"><brk id="1" man="1"/><brk id="2" man="0"/></colBreaks>';

            const m = xml.match(/<pageSetup\b[^>]*\/>/);
            if (!m) {
                throw new Error('Expected <pageSetup/> element to exist');
            }
            return xml.replace(m[0], m[0] + insert);
        });

        const loaded = await new XlsxReader().loadFromBuffer(patched);
        const sheet = loaded.getActiveSheet();

        const hf = sheet.getHeaderFooter();
        expect(hf.getDifferentFirst()).toBe(true);
        expect(hf.getAlignWithMargins()).toBe(false);
        expect(hf.getOddHeader()).toBe('&LHello');

        const breaks = sheet.getBreaks();
        expect(breaks.get('A3')).toBe('row');
        expect(breaks.get('B1')).toBe('column');
        expect(breaks.has('A9')).toBe(false);
        expect(breaks.has('C1')).toBe(false);
    });
});
