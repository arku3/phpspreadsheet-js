import { describe, expect, test } from 'bun:test';
import unzipper from 'unzipper';
import { Spreadsheet } from '../src/core/spreadsheet.ts';
import { XlsxReader } from '../src/io/xlsx-reader.ts';
import { XlsxWriter } from '../src/io/xlsx-writer.ts';
import { Chart } from '../src/worksheet/chart/chart.ts';
import { DataSeriesValues } from '../src/worksheet/chart/data-series-values.ts';
import { DataSeries } from '../src/worksheet/chart/data-series.ts';

const getFirstChartXml = async (buffer: Uint8Array | ArrayBuffer): Promise<string> => {
    const zipBuffer = buffer instanceof ArrayBuffer ? Buffer.from(new Uint8Array(buffer)) : Buffer.from(buffer);
    const zip = await unzipper.Open.buffer(zipBuffer);
    const chartFile = zip.files.find((file) => file.path.startsWith('xl/charts/chart') && file.path.endsWith('.xml'));
    expect(chartFile).toBeDefined();
    return (await chartFile!.buffer()).toString('utf-8');
};

describe('Chart legend title', () => {
    test('writes legend title XML when set', async () => {
        const spreadsheet = new Spreadsheet();
        const worksheet = spreadsheet.createSheet().setTitle('LegendData');

        worksheet.getCell('A1').setValue('Category');
        worksheet.getCell('A2').setValue('A');
        worksheet.getCell('B1').setValue('Value');
        worksheet.getCell('B2').setValue(10);

        const chart = new Chart();
        chart.setLegendPosition('right');
        chart.setLegendTitle('Sales Legend');

        const series = new DataSeries('bar');
        series.addPlotCategory(new DataSeriesValues('String', 'LegendData!$A$2:$A$2'));
        series.addPlotValues(new DataSeriesValues('Number', 'LegendData!$B$2:$B$2'));
        chart.addDataSeries(series);
        chart.setTopLeftPosition({ cell: 'D5' });
        worksheet.addChart(chart);

        const writer = new XlsxWriter(spreadsheet);
        writer.setIncludeCharts(true);
        const buffer = await writer.writeBuffer();

        const chartXml = await getFirstChartXml(buffer);
        expect(chartXml).toContain('<c:legend>');
        expect(chartXml).toContain('<a:t>Sales Legend</a:t>');
    });

    test('round-trip preserves legend title', async () => {
        const spreadsheet = new Spreadsheet();
        const worksheet = spreadsheet.createSheet().setTitle('LegendRoundTrip');

        worksheet.getCell('A1').setValue('Category');
        worksheet.getCell('A2').setValue('A');
        worksheet.getCell('B1').setValue('Value');
        worksheet.getCell('B2').setValue(42);

        const chart = new Chart();
        chart.setLegendPosition('bottom');
        chart.setLegendTitle('Quarterly Results');

        const series = new DataSeries('bar');
        series.addPlotCategory(new DataSeriesValues('String', 'LegendRoundTrip!$A$2:$A$2'));
        series.addPlotValues(new DataSeriesValues('Number', 'LegendRoundTrip!$B$2:$B$2'));
        chart.addDataSeries(series);
        chart.setTopLeftPosition({ cell: 'D5' });
        worksheet.addChart(chart);

        const writer = new XlsxWriter(spreadsheet);
        writer.setIncludeCharts(true);
        const buffer = await writer.writeBuffer();

        const reader = new XlsxReader();
        reader.setIncludeCharts(true);
        const readSpreadsheet = await reader.loadFromBuffer(buffer);
        const readWorksheet = readSpreadsheet.getSheetByName('LegendRoundTrip');

        const readChart = readWorksheet!.getChartCollection()[0];
        expect(readChart).toBeDefined();
        expect(readChart!.getLegendTitle()).toBe('Quarterly Results');
    });
});
