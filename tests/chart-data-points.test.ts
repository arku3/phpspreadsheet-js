import { describe, expect, test } from 'bun:test';
import unzipper from 'unzipper';
import { Spreadsheet } from '../src/core/spreadsheet.ts';
import { XlsxReader } from '../src/io/xlsx-reader.ts';
import { XlsxWriter } from '../src/io/xlsx-writer.ts';
import { ChartColor } from '../src/worksheet/chart/chart-color.ts';
import { Chart } from '../src/worksheet/chart/chart.ts';
import { DataPoint } from '../src/worksheet/chart/data-point.ts';
import { DataSeriesValues } from '../src/worksheet/chart/data-series-values.ts';
import { DataSeries } from '../src/worksheet/chart/data-series.ts';

const getFirstChartXml = async (buffer: Uint8Array | ArrayBuffer): Promise<string> => {
    const zipBuffer = buffer instanceof ArrayBuffer ? Buffer.from(new Uint8Array(buffer)) : Buffer.from(buffer);
    const zip = await unzipper.Open.buffer(zipBuffer);
    const chartFile = zip.files.find((file) => file.path.startsWith('xl/charts/chart') && file.path.endsWith('.xml'));
    expect(chartFile).toBeDefined();
    return (await chartFile!.buffer()).toString('utf-8');
};

describe('Chart data points', () => {
    test('pie chart writes and reads per-point colors with explosion', async () => {
        const spreadsheet = new Spreadsheet();
        const worksheet = spreadsheet.createSheet().setTitle('PieData');

        worksheet.getCell('A1').setValue('Category');
        worksheet.getCell('A2').setValue('A');
        worksheet.getCell('A3').setValue('B');
        worksheet.getCell('A4').setValue('C');
        worksheet.getCell('B1').setValue('Value');
        worksheet.getCell('B2').setValue(10);
        worksheet.getCell('B3').setValue(20);
        worksheet.getCell('B4').setValue(30);

        const chart = new Chart();
        const series = new DataSeries('pie');
        series.addPlotCategory(new DataSeriesValues('String', 'PieData!$A$2:$A$4'));
        series.addPlotValues(new DataSeriesValues('Number', 'PieData!$B$2:$B$4'));

        const point0 = new DataPoint(0);
        point0.setFillColor(new ChartColor('FF0000'));
        point0.setExplosion(25);
        series.addPlotPoint(point0);

        const point2 = new DataPoint(2);
        point2.setFillColor(new ChartColor('00FF00'));
        series.addPlotPoint(point2);

        chart.addDataSeries(series);
        chart.setTopLeftPosition({ cell: 'D2' });
        worksheet.addChart(chart);

        const writer = new XlsxWriter(spreadsheet);
        writer.setIncludeCharts(true);
        const buffer = await writer.writeBuffer();

        const chartXml = await getFirstChartXml(buffer);
        expect(chartXml).toContain('<c:dPt>');
        expect(chartXml).toContain('<c:idx val="0"');
        expect(chartXml).toContain('<c:explosion val="25"');
        expect(chartXml).toContain('<a:srgbClr val="FF0000"');
        expect(chartXml).toContain('<c:idx val="2"');
        expect(chartXml).toContain('<a:srgbClr val="00FF00"');

        const reader = new XlsxReader();
        reader.setIncludeCharts(true);
        const readSpreadsheet = await reader.loadFromBuffer(buffer);
        const readWorksheet = readSpreadsheet.getSheetByName('PieData');
        expect(readWorksheet).toBeDefined();

        const readChart = readWorksheet!.getChartCollection()[0]!;
        const readSeries = readChart.getPlotArea()[0]!;
        const plotPoints = readSeries.getPlotPoints();
        expect(plotPoints).toHaveLength(2);

        const readPoint0 = readSeries.getPlotPointByIndex(0)!;
        expect(readPoint0.getExplosion()).toBe(25);
        expect(readPoint0.getFillColor()!.getValue()).toBe('FF0000');

        const readPoint2 = readSeries.getPlotPointByIndex(2)!;
        expect(readPoint2.getFillColor()!.getValue()).toBe('00FF00');
    });

    test('bar chart writes and reads per-point fill and border', async () => {
        const spreadsheet = new Spreadsheet();
        const worksheet = spreadsheet.createSheet().setTitle('BarData');

        worksheet.getCell('A1').setValue('Category');
        worksheet.getCell('A2').setValue('One');
        worksheet.getCell('A3').setValue('Two');
        worksheet.getCell('B1').setValue('Value');
        worksheet.getCell('B2').setValue(5);
        worksheet.getCell('B3').setValue(15);

        const chart = new Chart();
        const series = new DataSeries('bar');
        series.addPlotCategory(new DataSeriesValues('String', 'BarData!$A$2:$A$3'));
        series.addPlotValues(new DataSeriesValues('Number', 'BarData!$B$2:$B$3'));

        const point0 = new DataPoint(0);
        point0.setFillColor(new ChartColor('112233'));
        point0.setBorderColor(new ChartColor('445566'));
        series.addPlotPoint(point0);

        const point1 = new DataPoint(1);
        point1.setNoFill(true);
        point1.setNoBorder(true);
        series.addPlotPoint(point1);

        chart.addDataSeries(series);
        chart.setTopLeftPosition({ cell: 'D2' });
        worksheet.addChart(chart);

        const writer = new XlsxWriter(spreadsheet);
        writer.setIncludeCharts(true);
        const buffer = await writer.writeBuffer();

        const chartXml = await getFirstChartXml(buffer);
        expect(chartXml).toContain('<c:dPt>');
        expect(chartXml).toContain('<a:srgbClr val="112233"');
        expect(chartXml).toContain('<a:srgbClr val="445566"');
        expect(chartXml).toContain('<a:noFill');

        const reader = new XlsxReader();
        reader.setIncludeCharts(true);
        const readSpreadsheet = await reader.loadFromBuffer(buffer);
        const readWorksheet = readSpreadsheet.getSheetByName('BarData');
        expect(readWorksheet).toBeDefined();

        const readChart = readWorksheet!.getChartCollection()[0]!;
        const readSeries = readChart.getPlotArea()[0]!;
        const readPoint0 = readSeries.getPlotPointByIndex(0)!;
        expect(readPoint0.getFillColor()!.getValue()).toBe('112233');
        expect(readPoint0.getBorderColor()!.getValue()).toBe('445566');

        const readPoint1 = readSeries.getPlotPointByIndex(1)!;
        expect(readPoint1.getNoFill()).toBe(true);
        expect(readPoint1.getNoBorder()).toBe(true);
    });
});
