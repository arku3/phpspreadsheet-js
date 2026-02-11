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

describe('Chart plot area layout', () => {
    test('writes manual plot area layout to chart XML', async () => {
        const spreadsheet = new Spreadsheet();
        const worksheet = spreadsheet.getActiveSheet();
        worksheet.setTitle('LayoutData');

        worksheet.getCell('A1').setValue('Category');
        worksheet.getCell('A2').setValue('One');
        worksheet.getCell('A3').setValue('Two');
        worksheet.getCell('B1').setValue('Value');
        worksheet.getCell('B2').setValue(10);
        worksheet.getCell('B3').setValue(20);

        const chart = new Chart();
        chart.setName('Layout Chart');
        chart.setTopLeftPosition({ cell: 'D2' });
        chart.setPlotAreaLayout({
            layoutTarget: 'inner',
            xMode: 'factor',
            yMode: 'factor',
            x: 0.1,
            y: 0.2,
            w: 0.8,
            h: 0.7,
        });

        const series = new DataSeries('bar');
        series.addPlotCategory(new DataSeriesValues('String', 'LayoutData!$A$2:$A$3'));
        series.addPlotValues(new DataSeriesValues('Number', 'LayoutData!$B$2:$B$3'));
        chart.addDataSeries(series);

        worksheet.addChart(chart);

        const writer = new XlsxWriter(spreadsheet);
        writer.setIncludeCharts(true);
        const buffer = await writer.writeBuffer();

        const chartXml = await getFirstChartXml(buffer);
        expect(chartXml).toContain('<c:layout>');
        expect(chartXml).toContain('<c:manualLayout>');
        expect(chartXml).toContain('<c:layoutTarget val="inner"');
        expect(chartXml).toContain('<c:xMode val="factor"');
        expect(chartXml).toContain('<c:yMode val="factor"');
        expect(chartXml).toContain('<c:x val="0.1"');
        expect(chartXml).toContain('<c:y val="0.2"');
        expect(chartXml).toContain('<c:w val="0.8"');
        expect(chartXml).toContain('<c:h val="0.7"');
    });

    test('plot area layout round-trip: read settings preserved', async () => {
        const spreadsheet = new Spreadsheet();
        const worksheet = spreadsheet.getActiveSheet();
        worksheet.setTitle('LayoutRoundTrip');

        worksheet.getCell('A1').setValue('Category');
        worksheet.getCell('A2').setValue('One');
        worksheet.getCell('A3').setValue('Two');
        worksheet.getCell('B1').setValue('Value');
        worksheet.getCell('B2').setValue(10);
        worksheet.getCell('B3').setValue(20);

        const chart = new Chart();
        chart.setName('Layout Round Trip');
        chart.setTopLeftPosition({ cell: 'D2' });
        chart.setPlotAreaLayout({
            layoutTarget: 'inner',
            xMode: 'factor',
            yMode: 'factor',
            x: 0.1,
            y: 0.2,
            w: 0.8,
            h: 0.7,
        });

        const series = new DataSeries('bar');
        series.addPlotCategory(new DataSeriesValues('String', 'LayoutRoundTrip!$A$2:$A$3'));
        series.addPlotValues(new DataSeriesValues('Number', 'LayoutRoundTrip!$B$2:$B$3'));
        chart.addDataSeries(series);

        worksheet.addChart(chart);

        const writer = new XlsxWriter(spreadsheet);
        writer.setIncludeCharts(true);
        const buffer = await writer.writeBuffer();

        const reader = new XlsxReader();
        reader.setIncludeCharts(true);
        const readSpreadsheet = await reader.loadFromBuffer(buffer);
        const readWorksheet = readSpreadsheet.getSheetByName('LayoutRoundTrip');

        expect(readWorksheet).toBeDefined();
        const readChart = readWorksheet!.getChartCollection()[0];
        expect(readChart).toBeDefined();

        const layout = readChart!.getPlotAreaLayout();
        expect(layout).toBeDefined();
        expect(layout!.layoutTarget).toBe('inner');
        expect(layout!.xMode).toBe('factor');
        expect(layout!.yMode).toBe('factor');
        expect(layout!.x).toBe(0.1);
        expect(layout!.y).toBe(0.2);
        expect(layout!.w).toBe(0.8);
        expect(layout!.h).toBe(0.7);
    });
});
