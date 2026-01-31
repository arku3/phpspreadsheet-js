import path from 'node:path';
import { describe, expect, test } from 'bun:test';
import { XlsxReader } from '../src/io/xlsx-reader.ts';

describe('XlsxReader embedded charts fixture', () => {
    const fixturePath = path.resolve(
        process.cwd(),
        'tests',
        'fixtures',
        'xlsx',
        'charts',
        'issue.3767.single-embedded-chart.xlsx',
    );

    test('does not load charts by default', async () => {
        const reader = new XlsxReader();
        const spreadsheet = await reader.load(fixturePath);
        const sheet = spreadsheet.getActiveSheet();

        expect(sheet.getChartCollection().length).toBe(0);
    });

    test('discovers embedded charts when includeCharts is enabled', async () => {
        const reader = new XlsxReader();
        reader.setIncludeCharts(true);
        const spreadsheet = await reader.load(fixturePath);
        const sheet = spreadsheet.getActiveSheet();

        const charts = sheet.getChartCollection();
        expect(charts.length).toBe(1);

        const chart = charts[0];
        const chartXmlPath = chart?.getChartXmlPath();
        expect(chartXmlPath).toBeTruthy();
        expect(chartXmlPath!).toMatch(/xl\/charts\/chart\d+\.xml$/);

        // Fixture has no explicit <c:tx> title text; ensure we treat it consistently.
        expect(chart?.getTitleText()).toBeNull();

        const series = chart?.getSeries() ?? [];
        expect(series.length).toBeGreaterThan(0);
        expect(series.some((s) => /B\$?2/.test(s.valuesFormula ?? ''))).toBe(true);
    });
});
