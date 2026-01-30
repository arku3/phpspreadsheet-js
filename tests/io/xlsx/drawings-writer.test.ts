import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { beforeAll, describe, expect, test } from 'bun:test';
import unzipper from 'unzipper';
import { Spreadsheet } from '../../../src/core/spreadsheet.ts';
import { XlsxWriter } from '../../../src/io/xlsx-writer.ts';
import { Drawing } from '../../../src/worksheet/drawing/drawing.ts';

describe('XlsxWriter DrawingML (worksheet images)', () => {
    const testDir = path.resolve(process.cwd(), 'test-output', 'xlsx-drawings-writer');

    beforeAll(async () => {
        await fs.promises.mkdir(testDir, { recursive: true });
    });

    test('writes worksheet drawing parts, rels, and media', async () => {
        const testFile = path.join(testDir, `test-drawings-${crypto.randomUUID()}.xlsx`);

        const spreadsheet = new Spreadsheet();
        const sheet = spreadsheet.getActiveSheet();

        const imagePath = path.resolve(process.cwd(), 'tests', 'fixtures', 'images', '1x1.png');
        const imageData = new Uint8Array(await fs.promises.readFile(imagePath));

        const drawing = new Drawing();
        drawing.setName('Logo');
        drawing.setDescription('Logo');
        drawing.setCoordinates('A2');
        drawing.setOffsetX(10);
        drawing.setOffsetY(10);
        drawing.setWidth(150);
        drawing.setHeight(150);
        drawing.setImageData(imageData, 'image/png', 'png');

        sheet.addDrawing(drawing);

        const writer = new XlsxWriter(spreadsheet);
        await writer.save(testFile);

        try {
            const zip = await unzipper.Open.file(testFile);

            const getText = async (zipPath: string): Promise<string> => {
                const file = zip.files.find((f) => f.path === zipPath);
                expect(file, `Expected zip entry to exist: ${zipPath}`).toBeDefined();
                return (await file!.buffer()).toString('utf-8');
            };
            const getBytes = async (zipPath: string): Promise<Uint8Array> => {
                const file = zip.files.find((f) => f.path === zipPath);
                expect(file, `Expected zip entry to exist: ${zipPath}`).toBeDefined();
                return new Uint8Array(await file!.buffer());
            };

            const sheet1Xml = await getText('xl/worksheets/sheet1.xml');
            expect(sheet1Xml).toContain('<drawing');
            expect(sheet1Xml).toContain('r:id="rId_drawing1"');

            const sheet1RelsXml = await getText('xl/worksheets/_rels/sheet1.xml.rels');
            expect(sheet1RelsXml).toContain('relationships/drawing');
            expect(sheet1RelsXml).toContain('Id="rId_drawing1"');
            expect(sheet1RelsXml).toContain('Target="../drawings/drawing1.xml"');

            const drawing1Xml = await getText('xl/drawings/drawing1.xml');
            expect(drawing1Xml).toContain('<xdr:oneCellAnchor');
            expect(drawing1Xml).toContain('<xdr:col>0</xdr:col>');
            expect(drawing1Xml).toContain('<xdr:row>1</xdr:row>');
            expect(drawing1Xml).toContain('<xdr:colOff>95250</xdr:colOff>');
            expect(drawing1Xml).toContain('<xdr:rowOff>95250</xdr:rowOff>');
            expect(drawing1Xml).toContain('cx="1428750"');
            expect(drawing1Xml).toContain('cy="1428750"');
            expect(drawing1Xml).toContain('<xdr:pic>');

            const drawing1RelsXml = await getText('xl/drawings/_rels/drawing1.xml.rels');
            expect(drawing1RelsXml).toContain('relationships/image');
            expect(drawing1RelsXml).toContain('Id="rId1"');
            expect(drawing1RelsXml).toContain('Target="../media/image1.png"');

            const mediaBytes = await getBytes('xl/media/image1.png');
            expect(Buffer.from(mediaBytes).equals(Buffer.from(imageData))).toBe(true);

            const contentTypesXml = await getText('[Content_Types].xml');
            expect(contentTypesXml).toContain('PartName="/xl/drawings/drawing1.xml"');
            expect(contentTypesXml).toContain(
                'ContentType="application/vnd.openxmlformats-officedocument.drawing+xml"',
            );
            expect(contentTypesXml).toContain('Default Extension="png" ContentType="image/png"');
        } finally {
            await fs.promises.unlink(testFile).catch(() => undefined);
        }
    }, 15_000);
});
