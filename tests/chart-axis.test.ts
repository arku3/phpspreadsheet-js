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

describe('Chart axis titles and gridlines', () => {
    test('writer outputs axis titles and gridlines', async () => {
        const spreadsheet = new Spreadsheet();
        const worksheet = spreadsheet.getActiveSheet();
        worksheet.setTitle('AxisChart');

        worksheet.getCell('A1').setValue('Category');
        worksheet.getCell('A2').setValue('One');
        worksheet.getCell('A3').setValue('Two');
        worksheet.getCell('B1').setValue('Series');
        worksheet.getCell('B2').setValue(10);
        worksheet.getCell('B3').setValue(20);

        const chart = new Chart();
        chart.setName('Axis Chart');
        chart.setTopLeftPosition({ cell: 'D2' });
        chart.setXAxisTitle('Categories');
        chart.setYAxisTitle('Values');
        chart.setXAxisMajorGridlines(true);
        chart.setXAxisMinorGridlines(true);
        chart.setYAxisMajorGridlines(true);
        chart.setYAxisMinorGridlines(true);

        const series = new DataSeries('bar');
        series.setPlotCategory(new DataSeriesValues('String', 'AxisChart!$A$2:$A$3'));
        series.addPlotValues(new DataSeriesValues('Number', 'AxisChart!$B$2:$B$3'));
        chart.addDataSeries(series);

        worksheet.addChart(chart);

        const writer = new XlsxWriter(spreadsheet);
        writer.setIncludeCharts(true);
        const buffer = await writer.writeBuffer();

        const chartXml = await getFirstChartXml(buffer);
        expect(chartXml).toContain('<c:title>');
        expect(chartXml).toContain('<a:t>Categories</a:t>');
        expect(chartXml).toContain('<a:t>Values</a:t>');
        expect(chartXml).toContain('<c:majorGridlines');
        expect(chartXml).toContain('<c:minorGridlines');
    });

    test('reader preserves axis titles and gridlines', async () => {
        const spreadsheet = new Spreadsheet();
        const worksheet = spreadsheet.getActiveSheet();
        worksheet.setTitle('AxisRoundTrip');

        worksheet.getCell('A1').setValue('Category');
        worksheet.getCell('A2').setValue('One');
        worksheet.getCell('A3').setValue('Two');
        worksheet.getCell('B1').setValue('Series');
        worksheet.getCell('B2').setValue(10);
        worksheet.getCell('B3').setValue(20);

        const chart = new Chart();
        chart.setName('Axis Chart RoundTrip');
        chart.setTopLeftPosition({ cell: 'D2' });
        chart.setXAxisTitle('Categories');
        chart.setYAxisTitle('Values');
        chart.setXAxisMajorGridlines(true);
        chart.setXAxisMinorGridlines(true);
        chart.setYAxisMajorGridlines(true);
        chart.setYAxisMinorGridlines(true);

        const series = new DataSeries('bar');
        series.setPlotCategory(new DataSeriesValues('String', 'AxisRoundTrip!$A$2:$A$3'));
        series.addPlotValues(new DataSeriesValues('Number', 'AxisRoundTrip!$B$2:$B$3'));
        chart.addDataSeries(series);

        worksheet.addChart(chart);

        const writer = new XlsxWriter(spreadsheet);
        writer.setIncludeCharts(true);
        const buffer = await writer.writeBuffer();

        const reader = new XlsxReader();
        reader.setIncludeCharts(true);
        const readSpreadsheet = await reader.loadFromBuffer(buffer);
        const readWorksheet = readSpreadsheet.getSheetByName('AxisRoundTrip');

        expect(readWorksheet!.getChartCollection()).toHaveLength(1);
        const readChart = readWorksheet!.getChartCollection()[0]!;
        expect(readChart.getXAxisTitle()).toBe('Categories');
        expect(readChart.getYAxisTitle()).toBe('Values');
        expect(readChart.getXAxisMajorGridlines()).toBe(true);
        expect(readChart.getXAxisMinorGridlines()).toBe(true);
        expect(readChart.getYAxisMajorGridlines()).toBe(true);
        expect(readChart.getYAxisMinorGridlines()).toBe(true);
    });
});
