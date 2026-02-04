import { describe, expect, test } from 'bun:test';
import unzipper from 'unzipper';
import { Spreadsheet } from '../src/core/spreadsheet.ts';
import { XlsxReader } from '../src/io/xlsx-reader.ts';
import { XlsxWriter } from '../src/io/xlsx-writer.ts';
import { Color } from '../src/style/color.ts';
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

const buildStyledChart = (): Spreadsheet => {
    const spreadsheet = new Spreadsheet();
    const worksheet = spreadsheet.getActiveSheet();
    worksheet.setTitle('StyleData');

    worksheet.getCell('A1').setValue('Category');
    worksheet.getCell('A2').setValue('A');
    worksheet.getCell('A3').setValue('B');
    worksheet.getCell('B1').setValue('Value');
    worksheet.getCell('B2').setValue(10);
    worksheet.getCell('B3').setValue(20);

    const chart = new Chart();
    chart.setName('Chart Area Style');
    chart.setTopLeftPosition({ cell: 'D2' });

    const series = new DataSeries('bar');
    series.setPlotCategory(new DataSeriesValues('String', 'StyleData!$A$2:$A$3'));
    series.addPlotValues(new DataSeriesValues('Number', 'StyleData!$B$2:$B$3'));
    chart.addDataSeries(series);

    const chartFill = new Color();
    chartFill.setARGB('FFCCDDEE');
    chart.setChartAreaFillColor(chartFill);
    chart.setChartAreaNoFill(true);

    const chartBorder = new Color();
    chartBorder.setARGB('FF112233');
    chart.setChartAreaBorderStyle({ color: chartBorder, width: 2 });

    const plotStopStart = new Color();
    plotStopStart.setARGB('FF0000FF');
    const plotStopEnd = new Color();
    plotStopEnd.setARGB('FF00FF00');

    chart.setPlotAreaNoFill(true);
    chart.setPlotAreaGradientStops([
        { position: 0, color: plotStopStart },
        { position: 1, color: plotStopEnd },
    ]);
    chart.setPlotAreaGradientAngle(45);

    worksheet.addChart(chart);

    return spreadsheet;
};

describe('Chart area and plot area styling', () => {
    test('writes chart area and plot area styling to chart XML', async () => {
        const spreadsheet = buildStyledChart();

        const writer = new XlsxWriter(spreadsheet);
        writer.setIncludeCharts(true);
        const buffer = await writer.writeBuffer();

        const chartXml = await getFirstChartXml(buffer);

        expect(chartXml).toMatch(/<c:chart>[\s\S]*?<c:spPr>[\s\S]*?<a:noFill\b/);
        expect(chartXml).toMatch(/<c:chart>[\s\S]*?<c:spPr>[\s\S]*?<a:ln\b/);
        expect(chartXml).toMatch(/<c:chart>[\s\S]*?<c:spPr>[\s\S]*?<a:solidFill\b/);
        expect(chartXml).toMatch(/<c:plotArea>[\s\S]*?<c:spPr>[\s\S]*?<a:noFill\b/);
        expect(chartXml).toMatch(/<c:plotArea>[\s\S]*?<c:spPr>[\s\S]*?<a:gradFill\b/);
        expect(chartXml).toMatch(/<a:gradFill>[\s\S]*?<a:gsLst>/);
        expect(chartXml).toContain('<a:lin ang="2700000"');
    });

    test('round-trip preserves chart area and plot area styling', async () => {
        const spreadsheet = buildStyledChart();

        const writer = new XlsxWriter(spreadsheet);
        writer.setIncludeCharts(true);
        const buffer = await writer.writeBuffer();

        const reader = new XlsxReader();
        reader.setIncludeCharts(true);
        const readSpreadsheet = await reader.loadFromBuffer(buffer);
        const readWorksheet = readSpreadsheet.getSheetByName('StyleData');
        const readChart = readWorksheet!.getChartCollection()[0]!;

        expect(readChart.getChartAreaNoFill()).toBe(true);
        expect(readChart.getChartAreaFillColor()).toBeNull();

        const borderStyle = readChart.getChartAreaBorderStyle();
        expect(borderStyle).toBeDefined();
        expect(borderStyle!.width).toBe(2);
        expect(borderStyle!.color?.getARGB()).toBe('FF112233');

        expect(readChart.getPlotAreaNoFill()).toBe(true);
        expect(readChart.getPlotAreaGradientAngle()).toBe(45);

        const gradientStops = readChart.getPlotAreaGradientStops();
        expect(gradientStops).toHaveLength(2);
        expect(gradientStops[0]!.position).toBeCloseTo(0, 5);
        expect(gradientStops[1]!.position).toBeCloseTo(1, 5);
        expect(gradientStops[0]!.color.getARGB()).toBe('FF0000FF');
        expect(gradientStops[1]!.color.getARGB()).toBe('FF00FF00');
    });
});
