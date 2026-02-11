import { describe, expect, test } from 'bun:test';
import unzipper from 'unzipper';
import { Spreadsheet } from '../src/core/spreadsheet.ts';
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

describe('Chart type-specific XML', () => {
    test('doughnut chart writes hole size and first slice angle', async () => {
        const spreadsheet = new Spreadsheet();
        const worksheet = spreadsheet.createSheet('DoughnutData');

        worksheet.getCell('A1').setValue('Segment');
        worksheet.getCell('A2').setValue('A');
        worksheet.getCell('A3').setValue('B');
        worksheet.getCell('B1').setValue('Share');
        worksheet.getCell('B2').setValue(40);
        worksheet.getCell('B3').setValue(60);

        const chart = new Chart();
        const series = new DataSeries('doughnut');
        series.addPlotCategory(new DataSeriesValues('String', 'DoughnutData!$A$2:$A$3'));
        series.addPlotValues(new DataSeriesValues('Number', 'DoughnutData!$B$2:$B$3'));
        chart.addDataSeries(series);
        chart.setTopLeftPosition({ cell: 'D2' });
        worksheet.addChart(chart);

        const writer = new XlsxWriter(spreadsheet);
        writer.setIncludeCharts(true);
        const buffer = await writer.writeBuffer();

        const chartXml = await getFirstChartXml(buffer);
        expect(chartXml).toContain('<c:doughnutChart>');
        expect(chartXml).toContain('<c:firstSliceAng val="0"');
        expect(chartXml).toContain('<c:holeSize val="50"');
        expect(chartXml).toContain('<c:varyColors val="1"');
    });

    test('scatter chart uses xVal/yVal and value axes', async () => {
        const spreadsheet = new Spreadsheet();
        const worksheet = spreadsheet.createSheet('ScatterData');

        worksheet.getCell('A1').setValue('X');
        worksheet.getCell('A2').setValue(1);
        worksheet.getCell('A3').setValue(2);
        worksheet.getCell('B1').setValue('Y');
        worksheet.getCell('B2').setValue(10);
        worksheet.getCell('B3').setValue(20);

        const chart = new Chart();
        const series = new DataSeries('scatter');
        series.addPlotCategory(new DataSeriesValues('Number', 'ScatterData!$A$2:$A$3'));
        series.addPlotValues(new DataSeriesValues('Number', 'ScatterData!$B$2:$B$3'));
        series.setMarkerSymbol('circle');
        chart.addDataSeries(series);
        chart.setTopLeftPosition({ cell: 'D2' });
        worksheet.addChart(chart);

        const writer = new XlsxWriter(spreadsheet);
        writer.setIncludeCharts(true);
        const buffer = await writer.writeBuffer();

        const chartXml = await getFirstChartXml(buffer);
        expect(chartXml).toContain('<c:scatterChart>');
        expect(chartXml).toContain('<c:scatterStyle val="lineMarker"');
        expect(chartXml).toContain('<c:xVal>');
        expect(chartXml).toContain('<c:yVal>');
        expect(chartXml).not.toContain('<c:catAx>');
        expect((chartXml.match(/<c:valAx>/g) ?? []).length).toBe(2);
    });

    test('stacked bar chart writes overlap and gap width', async () => {
        const spreadsheet = new Spreadsheet();
        const worksheet = spreadsheet.createSheet('StackedBar');

        worksheet.getCell('A1').setValue('Category');
        worksheet.getCell('A2').setValue('One');
        worksheet.getCell('A3').setValue('Two');
        worksheet.getCell('B1').setValue('Series 1');
        worksheet.getCell('B2').setValue(10);
        worksheet.getCell('B3').setValue(20);

        const chart = new Chart();
        const series = new DataSeries('bar');
        series.setGrouping('stacked');
        series.addPlotCategory(new DataSeriesValues('String', 'StackedBar!$A$2:$A$3'));
        series.addPlotValues(new DataSeriesValues('Number', 'StackedBar!$B$2:$B$3'));
        chart.addDataSeries(series);
        chart.setTopLeftPosition({ cell: 'D2' });
        worksheet.addChart(chart);

        const writer = new XlsxWriter(spreadsheet);
        writer.setIncludeCharts(true);
        const buffer = await writer.writeBuffer();

        const chartXml = await getFirstChartXml(buffer);
        expect(chartXml).toContain('<c:barChart>');
        expect(chartXml).toContain('<c:grouping val="stacked"');
        expect(chartXml).toContain('<c:gapWidth val="150"');
        expect(chartXml).toContain('<c:overlap val="100"');
    });
});
