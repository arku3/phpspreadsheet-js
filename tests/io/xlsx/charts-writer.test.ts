import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { beforeAll, describe, expect, test } from 'bun:test';
import unzipper from 'unzipper';
import { Spreadsheet } from '../../../src/core/spreadsheet.ts';
import { XlsxWriter } from '../../../src/io/xlsx-writer.ts';
import { Chart } from '../../../src/worksheet/chart/chart.ts';

describe('XlsxWriter charts (embedded)', () => {
    const testDir = path.resolve(process.cwd(), 'test-output', 'xlsx-charts-writer');

    beforeAll(async () => {
        await fs.promises.mkdir(testDir, { recursive: true });
    });

    test('writes chart parts and relationship chain', async () => {
        const testFile = path.join(testDir, `test-charts-${crypto.randomUUID()}.xlsx`);

        const spreadsheet = new Spreadsheet();
        const sheet = spreadsheet.getActiveSheet();

        const chart = new Chart();
        chart.setName('Chart 1');
        chart.setTopLeftPosition({ cell: 'A2' });
        chart.setBottomRightPosition({ cell: 'D15' });
        sheet.addChart(chart);

        const writer = new XlsxWriter(spreadsheet);
        writer.setIncludeCharts(true);
        await writer.save(testFile);

        try {
            const zip = await unzipper.Open.file(testFile);

            const getText = async (zipPath: string): Promise<string> => {
                const file = zip.files.find((f) => f.path === zipPath);
                expect(file, `Expected zip entry to exist: ${zipPath}`).toBeDefined();
                return (await file!.buffer()).toString('utf-8');
            };

            const sheet1Xml = await getText('xl/worksheets/sheet1.xml');
            expect(sheet1Xml).toContain('<drawing');
            expect(sheet1Xml).toContain('r:id="rId_drawing1"');

            const sheet1RelsXml = await getText('xl/worksheets/_rels/sheet1.xml.rels');
            expect(sheet1RelsXml).toContain('relationships/drawing');
            expect(sheet1RelsXml).toContain('Id="rId_drawing1"');
            expect(sheet1RelsXml).toContain('Target="../drawings/drawing1.xml"');

            const drawing1Xml = await getText('xl/drawings/drawing1.xml');
            expect(drawing1Xml).toContain('<xdr:twoCellAnchor');
            expect(drawing1Xml).toMatch(
                /<a:graphicData\b[^>]*\buri="http:\/\/schemas\.openxmlformats\.org\/drawingml\/2006\/chart"/,
            );
            expect(drawing1Xml).toMatch(/<c:chart\b[^>]*\br:id="rId\d+"/);

            const drawing1RelsXml = await getText('xl/drawings/_rels/drawing1.xml.rels');
            expect(drawing1RelsXml).toContain('relationships/chart');
            expect(drawing1RelsXml).toContain('Target="../charts/chart1.xml"');

            const chart1Xml = await getText('xl/charts/chart1.xml');
            expect(chart1Xml).toContain('<c:chartSpace');
            expect(chart1Xml).toContain('<c:chart');

            const contentTypesXml = await getText('[Content_Types].xml');
            expect(contentTypesXml).toContain('PartName="/xl/charts/chart1.xml"');
            expect(contentTypesXml).toContain(
                'ContentType="application/vnd.openxmlformats-officedocument.drawingml.chart+xml"',
            );
        } finally {
            await fs.promises.unlink(testFile).catch(() => undefined);
        }
    }, 15_000);
});
