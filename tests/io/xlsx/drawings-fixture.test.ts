import path from 'node:path';
import { describe, expect, test } from 'bun:test';
import unzipper from 'unzipper';

describe('XLSX drawings fixture sanity', () => {
    test('worksheet-anchored PNG drawing parts and relationships exist', async () => {
        const fixturePath = path.resolve(
            process.cwd(),
            'tests',
            'fixtures',
            'xlsx',
            'drawings',
            'drawing-one-cell-anchor.xlsx',
        );

        const zip = await unzipper.Open.file(fixturePath);

        const getText = async (zipPath: string): Promise<string> => {
            const file = zip.files.find((f) => f.path === zipPath);
            expect(file, `Expected zip entry to exist: ${zipPath}`).toBeDefined();
            return (await file!.buffer()).toString('utf-8');
        };

        const sheet1Xml = await getText('xl/worksheets/sheet1.xml');
        expect(sheet1Xml).toContain('<drawing');

        const sheet1RelsXml = await getText('xl/worksheets/_rels/sheet1.xml.rels');
        expect(sheet1RelsXml).toContain('relationships/drawing');
        expect(sheet1RelsXml).toContain('Target="../drawings/drawing1.xml"');

        const drawing1Xml = await getText('xl/drawings/drawing1.xml');
        expect(drawing1Xml).toContain('<xdr:oneCellAnchor');
        expect(drawing1Xml).toContain('<xdr:pic');

        const drawing1RelsXml = await getText('xl/drawings/_rels/drawing1.xml.rels');
        expect(drawing1RelsXml).toContain('relationships/image');
        expect(drawing1RelsXml).toMatch(/Target="\.\.\/media\/[^\"]+\.png"/);

        const contentTypesXml = await getText('[Content_Types].xml');
        expect(contentTypesXml).toContain('Default Extension="png" ContentType="image/png"');
    }, 20_000);
});
