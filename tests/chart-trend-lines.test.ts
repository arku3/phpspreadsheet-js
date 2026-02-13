import { describe, expect, test } from 'bun:test';
import unzipper from 'unzipper';
import { Spreadsheet } from '../src/core/spreadsheet.ts';
import { XlsxReader } from '../src/io/xlsx-reader.ts';
import { XlsxWriter } from '../src/io/xlsx-writer.ts';
import { ChartColor } from '../src/worksheet/chart/chart-color.ts';
import { Chart } from '../src/worksheet/chart/chart.ts';
import { DataSeriesValues } from '../src/worksheet/chart/data-series-values.ts';
import { DataSeries } from '../src/worksheet/chart/data-series.ts';
import { TrendLine } from '../src/worksheet/chart/trend-line.ts';

const getFirstChartXml = async (buffer: Uint8Array | ArrayBuffer): Promise<string> => {
    const zipBuffer = buffer instanceof ArrayBuffer ? Buffer.from(new Uint8Array(buffer)) : Buffer.from(buffer);
    const zip = await unzipper.Open.buffer(zipBuffer);
    const chartFile = zip.files.find((file) => file.path.startsWith('xl/charts/chart') && file.path.endsWith('.xml'));
    expect(chartFile).toBeDefined();
    return (await chartFile!.buffer()).toString('utf-8');
};

describe('Chart Trend Line Tests', () => {
    test('trend line writing: linear trend line is written to chart XML', async () => {
        const spreadsheet = new Spreadsheet();
        const worksheet = spreadsheet.getActiveSheet();
        worksheet.setTitle('TrendLineTest');

        // Add sample data
        worksheet.getCell('A1').setValue('X');
        worksheet.getCell('A2').setValue(1);
        worksheet.getCell('A3').setValue(2);
        worksheet.getCell('A4').setValue(3);
        worksheet.getCell('B1').setValue('Y');
        worksheet.getCell('B2').setValue(10);
        worksheet.getCell('B3').setValue(20);
        worksheet.getCell('B4').setValue(30);

        // Create chart with trend line
        const chart = new Chart();
        chart.setName('Chart with Linear Trend');
        chart.setTopLeftPosition({ cell: 'D2' });

        const series = new DataSeries('scatter');
        const plotValues = new DataSeriesValues('Number', 'TrendLineTest!$B$2:$B$4');

        // Add linear trend line
        const linearTrendLine = new TrendLine('linear');
        plotValues.addTrendLine(linearTrendLine);

        series.addPlotCategory(new DataSeriesValues('Number', 'TrendLineTest!$A$2:$A$4'));
        series.addPlotValues(plotValues);
        chart.addDataSeries(series);

        worksheet.addChart(chart);

        // Write to buffer
        const writer = new XlsxWriter(spreadsheet);
        writer.setIncludeCharts(true);
        const buffer = await writer.writeBuffer();

        // Verify chart XML contains trendline element
        const chartXml = await getFirstChartXml(buffer);
        expect(chartXml).toContain('<c:trendline');
        expect(chartXml).toContain('<c:trendlineType');
        expect(chartXml).toContain('val="linear"');
    });

    test('trend line round-trip: polynomial trend line properties are preserved', async () => {
        const spreadsheet = new Spreadsheet();
        const worksheet = spreadsheet.getActiveSheet();
        worksheet.setTitle('PolyTrendLine');

        // Add sample data
        worksheet.getCell('A1').setValue('X');
        worksheet.getCell('A2').setValue(1);
        worksheet.getCell('A3').setValue(2);
        worksheet.getCell('A4').setValue(3);
        worksheet.getCell('A5').setValue(4);
        worksheet.getCell('B1').setValue('Y');
        worksheet.getCell('B2').setValue(10);
        worksheet.getCell('B3').setValue(25);
        worksheet.getCell('B4').setValue(45);
        worksheet.getCell('B5').setValue(70);

        // Create chart with polynomial trend line
        const chart = new Chart();
        chart.setName('Chart with Polynomial Trend');
        chart.setTopLeftPosition({ cell: 'D2' });

        const series = new DataSeries('scatter');
        const plotValues = new DataSeriesValues('Number', 'PolyTrendLine!$B$2:$B$5');

        // Add polynomial trend line with order 3
        const polyTrendLine = new TrendLine('poly');
        polyTrendLine.setOrder(3);
        polyTrendLine.setDisplayRSquared(true);
        polyTrendLine.setDisplayEquation(true);
        polyTrendLine.setName('Cubic Fit');
        polyTrendLine.setForward(5.0);
        polyTrendLine.setBackward(2.0);
        polyTrendLine.setIntercept(0.0);
        plotValues.addTrendLine(polyTrendLine);

        series.addPlotCategory(new DataSeriesValues('Number', 'PolyTrendLine!$A$2:$A$5'));
        series.addPlotValues(plotValues);
        chart.addDataSeries(series);

        worksheet.addChart(chart);

        // Write to buffer
        const writer = new XlsxWriter(spreadsheet);
        writer.setIncludeCharts(true);
        const buffer = await writer.writeBuffer();

        // Verify chart XML contains polynomial trendline with order
        const chartXml = await getFirstChartXml(buffer);
        expect(chartXml).toContain('<c:trendline');
        expect(chartXml).toContain('<c:trendlineType');
        expect(chartXml).toContain('val="poly"');
        expect(chartXml).toContain('<c:order');
        expect(chartXml).toContain('val="3"');

        // Read back and verify
        const reader = new XlsxReader();
        reader.setIncludeCharts(true);
        const readSpreadsheet = await reader.loadFromBuffer(buffer);
        const readWorksheet = readSpreadsheet.getSheetByName('PolyTrendLine');

        expect(readWorksheet).toBeDefined();
        expect(readWorksheet!.getChartCollection()).toHaveLength(1);

        const readChart = readWorksheet!.getChartCollection()[0];
        expect(readChart).toBeDefined();

        const plotArea = readChart!.getPlotArea();
        expect(plotArea).toHaveLength(1);

        const readSeries = plotArea[0]!;
        const readPlotValues = readSeries.getPlotValues();
        expect(readPlotValues.length).toBeGreaterThan(0);

        const trendLines = readPlotValues[0]!.getTrendLines();
        expect(trendLines).toHaveLength(1);

        const readTrendLine = trendLines[0]!;
        expect(readTrendLine.getTrendLineType()).toBe('poly');
        expect(readTrendLine.getOrder()).toBe(3);
        expect(readTrendLine.getDisplayRSquared()).toBe(true);
        expect(readTrendLine.getDisplayEquation()).toBe(true);
        expect(readTrendLine.getName()).toBe('Cubic Fit');
        expect(readTrendLine.getForward()).toBe(5.0);
        expect(readTrendLine.getBackward()).toBe(2.0);
        expect(readTrendLine.getIntercept()).toBe(0.0);
    });

    test('multiple trend lines: linear and moving average are both written and parsed', async () => {
        const spreadsheet = new Spreadsheet();
        const worksheet = spreadsheet.getActiveSheet();
        worksheet.setTitle('MultiTrendLine');

        // Add sample data
        worksheet.getCell('A1').setValue('X');
        worksheet.getCell('A2').setValue(1);
        worksheet.getCell('A3').setValue(2);
        worksheet.getCell('A4').setValue(3);
        worksheet.getCell('A5').setValue(4);
        worksheet.getCell('A6').setValue(5);
        worksheet.getCell('B1').setValue('Y');
        worksheet.getCell('B2').setValue(12);
        worksheet.getCell('B3').setValue(18);
        worksheet.getCell('B4').setValue(25);
        worksheet.getCell('B5').setValue(19);
        worksheet.getCell('B6').setValue(30);

        // Create chart with multiple trend lines
        const chart = new Chart();
        chart.setName('Chart with Multiple Trends');
        chart.setTopLeftPosition({ cell: 'D2' });

        const series = new DataSeries('scatter');
        const plotValues = new DataSeriesValues('Number', 'MultiTrendLine!$B$2:$B$6');

        // Add linear trend line
        const linearTrendLine = new TrendLine('linear');
        linearTrendLine.setName('Linear Trend');
        plotValues.addTrendLine(linearTrendLine);

        // Add moving average trend line with period 2
        const movingAvgTrendLine = new TrendLine('movingAvg');
        movingAvgTrendLine.setPeriod(2);
        movingAvgTrendLine.setName('2-Point Moving Avg');
        movingAvgTrendLine.setDisplayRSquared(true);
        plotValues.addTrendLine(movingAvgTrendLine);

        series.addPlotCategory(new DataSeriesValues('Number', 'MultiTrendLine!$A$2:$A$6'));
        series.addPlotValues(plotValues);
        chart.addDataSeries(series);

        worksheet.addChart(chart);

        // Write to buffer
        const writer = new XlsxWriter(spreadsheet);
        writer.setIncludeCharts(true);
        const buffer = await writer.writeBuffer();

        // Verify chart XML contains both trendlines
        const chartXml = await getFirstChartXml(buffer);
        expect(chartXml).toContain('<c:trendline');
        expect(chartXml).toContain('val="linear"');
        expect(chartXml).toContain('val="movingAvg"');

        // Read back and verify
        const reader = new XlsxReader();
        reader.setIncludeCharts(true);
        const readSpreadsheet = await reader.loadFromBuffer(buffer);
        const readWorksheet = readSpreadsheet.getSheetByName('MultiTrendLine');

        expect(readWorksheet).toBeDefined();
        expect(readWorksheet!.getChartCollection()).toHaveLength(1);

        const readChart = readWorksheet!.getChartCollection()[0];
        expect(readChart).toBeDefined();

        const plotArea = readChart!.getPlotArea();
        expect(plotArea).toHaveLength(1);

        const readSeries = plotArea[0]!;
        const readPlotValues = readSeries.getPlotValues();
        expect(readPlotValues.length).toBeGreaterThan(0);

        const trendLines = readPlotValues[0]!.getTrendLines();
        expect(trendLines).toHaveLength(2);

        // Find linear trend line
        const readLinearTrendLine = trendLines.find((tl) => tl.getTrendLineType() === 'linear');
        expect(readLinearTrendLine).toBeDefined();
        expect(readLinearTrendLine!.getName()).toBe('Linear Trend');

        // Find moving average trend line
        const readMovingAvgTrendLine = trendLines.find((tl) => tl.getTrendLineType() === 'movingAvg');
        expect(readMovingAvgTrendLine).toBeDefined();
        expect(readMovingAvgTrendLine!.getPeriod()).toBe(2);
        expect(readMovingAvgTrendLine!.getName()).toBe('2-Point Moving Avg');
        expect(readMovingAvgTrendLine!.getDisplayRSquared()).toBe(true);
    });

    test('trend line color falls back to series line color', async () => {
        const spreadsheet = new Spreadsheet();
        const worksheet = spreadsheet.getActiveSheet();
        worksheet.setTitle('TrendLineFallback');

        worksheet.getCell('A1').setValue('X');
        worksheet.getCell('A2').setValue(1);
        worksheet.getCell('A3').setValue(2);
        worksheet.getCell('B1').setValue('Y');
        worksheet.getCell('B2').setValue(10);
        worksheet.getCell('B3').setValue(20);

        const chart = new Chart();
        chart.setName('TrendLine Fallback');
        chart.setTopLeftPosition({ cell: 'D2' });

        const series = new DataSeries('scatter');
        series.setLineColor('FF00FF');
        const plotValues = new DataSeriesValues('Number', 'TrendLineFallback!$B$2:$B$3');

        const linearTrendLine = new TrendLine('linear');
        plotValues.addTrendLine(linearTrendLine);

        series.addPlotCategory(new DataSeriesValues('Number', 'TrendLineFallback!$A$2:$A$3'));
        series.addPlotValues(plotValues);
        chart.addDataSeries(series);
        worksheet.addChart(chart);

        const writer = new XlsxWriter(spreadsheet);
        writer.setIncludeCharts(true);
        const buffer = await writer.writeBuffer();
        const chartXml = await getFirstChartXml(buffer);

        expect(chartXml).toContain('<c:trendline>');
        expect(chartXml).toContain('val="FF00FF"');
    });

    test('trend line supports scheme colors and width round-trip', async () => {
        const spreadsheet = new Spreadsheet();
        const worksheet = spreadsheet.getActiveSheet();
        worksheet.setTitle('TrendLineColors');

        worksheet.getCell('A1').setValue('X');
        worksheet.getCell('A2').setValue(1);
        worksheet.getCell('A3').setValue(2);
        worksheet.getCell('B1').setValue('Y');
        worksheet.getCell('B2').setValue(10);
        worksheet.getCell('B3').setValue(20);

        const chart = new Chart();
        chart.setName('TrendLine Colors');
        chart.setTopLeftPosition({ cell: 'D2' });

        const series = new DataSeries('scatter');
        const plotValues = new DataSeriesValues('Number', 'TrendLineColors!$B$2:$B$3');

        const linearTrendLine = new TrendLine('linear');
        linearTrendLine.setLineColor(new ChartColor('*accent2'));
        linearTrendLine.setLineWidth(2);
        plotValues.addTrendLine(linearTrendLine);

        series.addPlotCategory(new DataSeriesValues('Number', 'TrendLineColors!$A$2:$A$3'));
        series.addPlotValues(plotValues);
        chart.addDataSeries(series);
        worksheet.addChart(chart);

        const writer = new XlsxWriter(spreadsheet);
        writer.setIncludeCharts(true);
        const buffer = await writer.writeBuffer();
        const chartXml = await getFirstChartXml(buffer);

        expect(chartXml).toContain('<a:schemeClr');
        expect(chartXml).toContain('val="accent2"');

        const reader = new XlsxReader();
        reader.setIncludeCharts(true);
        const readSpreadsheet = await reader.loadFromBuffer(buffer);
        const readWorksheet = readSpreadsheet.getSheetByName('TrendLineColors');
        const readChart = readWorksheet!.getChartCollection()[0]!;
        const readSeries = readChart.getPlotArea()[0]!;
        const readPlotValues = readSeries.getPlotValues();
        const readTrendLine = readPlotValues[0]!.getTrendLines()[0]!;

        expect(readTrendLine.getLineColor()?.getType()).toBe('schemeClr');
        expect(readTrendLine.getLineColor()?.getValue()).toBe('accent2');
        expect(readTrendLine.getLineWidth()).toBeCloseTo(2);
    });
});
