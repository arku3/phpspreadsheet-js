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

describe('Chart markers and line styles', () => {
    test('writes marker symbol/size and smooth line', async () => {
        const spreadsheet = new Spreadsheet();
        const worksheet = spreadsheet.createSheet('MarkerData');

        worksheet.getCell('A1').setValue('X');
        worksheet.getCell('A2').setValue(1);
        worksheet.getCell('A3').setValue(2);
        worksheet.getCell('B1').setValue('Y');
        worksheet.getCell('B2').setValue(10);
        worksheet.getCell('B3').setValue(20);

        const chart = new Chart();
        const series = new DataSeries('line');
        series.addPlotCategory(new DataSeriesValues('Number', 'MarkerData!$A$2:$A$3'));
        series.addPlotValues(new DataSeriesValues('Number', 'MarkerData!$B$2:$B$3'));
        series.setMarkerSymbol('diamond');
        series.setMarkerSize(9);
        series.setSmoothLine(true);
        series.setLineStyle('dash');
        chart.addDataSeries(series);
        chart.setTopLeftPosition({ cell: 'D2' });
        worksheet.addChart(chart);

        const writer = new XlsxWriter(spreadsheet);
        writer.setIncludeCharts(true);
        const buffer = await writer.writeBuffer();

        const chartXml = await getFirstChartXml(buffer);
        expect(chartXml).toContain('<c:marker>');
        expect(chartXml).toContain('<c:symbol val="diamond"');
        expect(chartXml).toContain('<c:size val="9"');
        expect(chartXml).toContain('<a:prstDash val="dash"');
        expect(chartXml).toContain('<c:smooth val="1"');
    });

    test('round-trips marker symbol/size and smooth line', async () => {
        const spreadsheet = new Spreadsheet();
        const worksheet = spreadsheet.createSheet('RoundTrip');

        worksheet.getCell('A1').setValue('X');
        worksheet.getCell('A2').setValue(1);
        worksheet.getCell('A3').setValue(2);
        worksheet.getCell('B1').setValue('Y');
        worksheet.getCell('B2').setValue(10);
        worksheet.getCell('B3').setValue(20);

        const chart = new Chart();
        const series = new DataSeries('line');
        series.addPlotCategory(new DataSeriesValues('Number', 'RoundTrip!$A$2:$A$3'));
        series.addPlotValues(new DataSeriesValues('Number', 'RoundTrip!$B$2:$B$3'));
        series.setMarkerSymbol('square');
        series.setMarkerSize(7);
        series.setSmoothLine(true);
        series.setLineStyle('dot');
        chart.addDataSeries(series);
        chart.setTopLeftPosition({ cell: 'D2' });
        worksheet.addChart(chart);

        const writer = new XlsxWriter(spreadsheet);
        writer.setIncludeCharts(true);
        const buffer = await writer.writeBuffer();

        const reader = new XlsxReader();
        reader.setIncludeCharts(true);
        const readSpreadsheet = await reader.loadFromBuffer(buffer);
        const readWorksheet = readSpreadsheet.getSheetByName('RoundTrip');
        const readChart = readWorksheet!.getChartCollection()[0]!;
        const readSeries = readChart.getPlotArea()[0]!;

        expect(readSeries.getMarkerSymbol()).toBe('square');
        expect(readSeries.getMarkerSize()).toBe(7);
        expect(readSeries.getSmoothLine()).toBe(true);
        expect(readSeries.getLineStyle()).toBe('dot');
    });
});
