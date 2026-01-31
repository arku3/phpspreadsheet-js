import path from 'node:path';
import { describe, expect, test } from 'bun:test';
import unzipper from 'unzipper';

describe('XLSX charts fixture sanity', () => {
    test('worksheet-embedded chart parts and relationships exist', async () => {
        const fixturePath = path.resolve(
            process.cwd(),
            'tests',
            'fixtures',
            'xlsx',
            'charts',
            'issue.3767.single-embedded-chart.xlsx',
        );

        const zip = await unzipper.Open.file(fixturePath);

        const getText = async (zipPath: string): Promise<string> => {
            const file = zip.files.find((f) => f.path === zipPath);
            expect(file, `Expected zip entry to exist: ${zipPath}`).toBeDefined();
            return (await file!.buffer()).toString('utf-8');
        };

        const sheet1Xml = await getText('xl/worksheets/sheet1.xml');
        expect(sheet1Xml).toMatch(/<drawing\b[^>]*\br:id="rId\d+"/);

        const sheet1RelsXml = await getText('xl/worksheets/_rels/sheet1.xml.rels');
        expect(sheet1RelsXml).toContain('relationships/drawing');
        expect(sheet1RelsXml).toContain('Target="../drawings/drawing1.xml"');

        const drawing1Xml = await getText('xl/drawings/drawing1.xml');
        expect(drawing1Xml).toMatch(
            /<a:graphicData\b[^>]*\buri="http:\/\/schemas\.openxmlformats\.org\/drawingml\/2006\/chart"/,
        );
        expect(drawing1Xml).toMatch(/<c:chart\b[^>]*\br:id="rId\d+"/);

        const drawing1RelsXml = await getText('xl/drawings/_rels/drawing1.xml.rels');
        expect(drawing1RelsXml).toContain('relationships/chart');
        expect(drawing1RelsXml).toContain('Target="../charts/chart1.xml"');

        const contentTypesXml = await getText('[Content_Types].xml');
        expect(contentTypesXml).toContain('PartName="/xl/charts/chart1.xml"');
        expect(contentTypesXml).toContain(
            'ContentType="application/vnd.openxmlformats-officedocument.drawingml.chart+xml"',
        );
    });
});
