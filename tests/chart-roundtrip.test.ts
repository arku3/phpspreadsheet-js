import { describe, expect, test } from 'bun:test';
import { Spreadsheet } from '../src/core/spreadsheet.ts';
import { XlsxReader } from '../src/io/xlsx-reader.ts';
import { XlsxWriter } from '../src/io/xlsx-writer.ts';
import { Chart } from '../src/worksheet/chart/chart.ts';
import { DataSeriesValues } from '../src/worksheet/chart/data-series-values.ts';
import { DataSeries } from '../src/worksheet/chart/data-series.ts';

describe('Chart Round-Trip Tests', () => {
    test('basic bar chart round-trip: chart exists after write and read', async () => {
        const spreadsheet = new Spreadsheet();
        const worksheet = spreadsheet.getActiveSheet();
        worksheet.setTitle('Data');

        // Add sample data
        worksheet.getCell('A1').setValue('Category');
        worksheet.getCell('A2').setValue('Category 1');
        worksheet.getCell('A3').setValue('Category 2');
        worksheet.getCell('B1').setValue('Value');
        worksheet.getCell('B2').setValue(100);
        worksheet.getCell('B3').setValue(200);

        // Create chart
        const chart = new Chart();
        chart.setName('Test Bar Chart');
        chart.setTopLeftPosition({ cell: 'D5' });
        chart.setBottomRightPosition({ cell: 'H20' });
        worksheet.addChart(chart);

        // Write and read back
        const writer = new XlsxWriter(spreadsheet);
        writer.setIncludeCharts(true);
        const buffer = await writer.writeBuffer();

        const reader = new XlsxReader();
        reader.setIncludeCharts(true);
        const readSpreadsheet = await reader.loadFromBuffer(buffer);
        const readWorksheet = readSpreadsheet.getSheetByName('Data');

        expect(readWorksheet).toBeDefined();
        expect(readWorksheet!.getChartCollection()).toHaveLength(1);

        const readChart = readWorksheet!.getChartCollection()[0];
        expect(readChart).toBeDefined();
        expect(readChart!.getName()).toBe('Test Bar Chart');
    });

    test('chart with data series round-trip: DataSeries and DataSeriesValues preserved', async () => {
        const spreadsheet = new Spreadsheet();
        const worksheet = spreadsheet.getActiveSheet();
        worksheet.setTitle('SalesData');

        // Add data
        worksheet.getCell('A1').setValue('Q1');
        worksheet.getCell('A2').setValue('Q2');
        worksheet.getCell('A3').setValue('Q3');
        worksheet.getCell('B1').setValue(1000);
        worksheet.getCell('B2').setValue(1500);
        worksheet.getCell('B3').setValue(1200);

        // Create chart with data series
        const chart = new Chart();
        chart.setName('Sales Chart');
        chart.setTopLeftPosition({ cell: 'D2' });

        const series = new DataSeries('bar');
        series.setPlotCategory(new DataSeriesValues('String', 'SalesData!$A$1:$A$3'));
        series.addPlotValues(new DataSeriesValues('Number', 'SalesData!$B$1:$B$3'));
        chart.addDataSeries(series);

        worksheet.addChart(chart);

        // Write and read back
        const writer = new XlsxWriter(spreadsheet);
        writer.setIncludeCharts(true);
        const buffer = await writer.writeBuffer();

        const reader = new XlsxReader();
        reader.setIncludeCharts(true);
        const readSpreadsheet = await reader.loadFromBuffer(buffer);
        const readWorksheet = readSpreadsheet.getSheetByName('SalesData');

        expect(readWorksheet!.getChartCollection()).toHaveLength(1);

        const readChart = readWorksheet!.getChartCollection()[0]!;
        expect(readChart.getPlotArea()).toHaveLength(1);

        // Verify series data via legacy API (what the reader populates)
        const seriesData = readChart.getSeries();
        expect(seriesData.length).toBeGreaterThan(0);
        expect(seriesData[0]!.categoryFormula).toContain('A');
        expect(seriesData[0]!.valuesFormula).toContain('B');
    });

    test('multiple data series round-trip: all series preserved', async () => {
        const spreadsheet = new Spreadsheet();
        const worksheet = spreadsheet.getActiveSheet();
        worksheet.setTitle('MultiSeries');

        // Add data for multiple series
        worksheet.getCell('A1').setValue('Month');
        worksheet.getCell('A2').setValue('Jan');
        worksheet.getCell('A3').setValue('Feb');
        worksheet.getCell('A4').setValue('Mar');

        worksheet.getCell('B1').setValue('Product A');
        worksheet.getCell('B2').setValue(100);
        worksheet.getCell('B3').setValue(150);
        worksheet.getCell('B4').setValue(200);

        worksheet.getCell('C1').setValue('Product B');
        worksheet.getCell('C2').setValue(80);
        worksheet.getCell('C3').setValue(120);
        worksheet.getCell('C4').setValue(160);

        worksheet.getCell('D1').setValue('Product C');
        worksheet.getCell('D2').setValue(60);
        worksheet.getCell('D3').setValue(90);
        worksheet.getCell('D4').setValue(120);

        // Create chart with multiple series
        const chart = new Chart();
        chart.setName('Multi-Series Chart');
        chart.setTopLeftPosition({ cell: 'F2' });
        chart.setBottomRightPosition({ cell: 'L15' });

        // Series 1: Product A
        const series1 = new DataSeries('bar');
        series1.setPlotCategory(new DataSeriesValues('String', 'MultiSeries!$A$2:$A$4'));
        series1.addPlotValues(new DataSeriesValues('Number', 'MultiSeries!$B$2:$B$4'));
        chart.addDataSeries(series1);

        // Series 2: Product B
        const series2 = new DataSeries('bar');
        series2.setPlotCategory(new DataSeriesValues('String', 'MultiSeries!$A$2:$A$4'));
        series2.addPlotValues(new DataSeriesValues('Number', 'MultiSeries!$C$2:$C$4'));
        chart.addDataSeries(series2);

        // Series 3: Product C
        const series3 = new DataSeries('bar');
        series3.setPlotCategory(new DataSeriesValues('String', 'MultiSeries!$A$2:$A$4'));
        series3.addPlotValues(new DataSeriesValues('Number', 'MultiSeries!$D$2:$D$4'));
        chart.addDataSeries(series3);

        worksheet.addChart(chart);

        // Write and read back
        const writer = new XlsxWriter(spreadsheet);
        writer.setIncludeCharts(true);
        const buffer = await writer.writeBuffer();

        const reader = new XlsxReader();
        reader.setIncludeCharts(true);
        const readSpreadsheet = await reader.loadFromBuffer(buffer);
        const readWorksheet = readSpreadsheet.getSheetByName('MultiSeries');

        expect(readWorksheet!.getChartCollection()).toHaveLength(1);

        const readChart = readWorksheet!.getChartCollection()[0]!;
        expect(readChart.getPlotArea()).toHaveLength(3);

        // Verify all series have correct data via legacy API
        const seriesData = readChart.getSeries();
        expect(seriesData.length).toBe(3);

        // Each series should reference the correct columns
        const valueFormulas = seriesData.map((s) => s.valuesFormula);
        expect(valueFormulas.some((f) => f?.includes('B'))).toBe(true);
        expect(valueFormulas.some((f) => f?.includes('C'))).toBe(true);
        expect(valueFormulas.some((f) => f?.includes('D'))).toBe(true);
    });

    test('bar chart round-trip: type and positioning preserved', async () => {
        const spreadsheet = new Spreadsheet();
        const worksheet = spreadsheet.getActiveSheet();
        worksheet.setTitle('BarChart');

        worksheet.getCell('A1').setValue('Item');
        worksheet.getCell('A2').setValue('A');
        worksheet.getCell('A3').setValue('B');
        worksheet.getCell('B1').setValue('Count');
        worksheet.getCell('B2').setValue(50);
        worksheet.getCell('B3').setValue(75);

        const chart = new Chart();
        chart.setName('Bar Chart Test');
        chart.setTopLeftPosition({ cell: 'D2', offsetX: 100, offsetY: 50 });
        chart.setBottomRightPosition({ cell: 'H10', offsetX: 200, offsetY: 150 });

        const series = new DataSeries('bar');
        series.setPlotCategory(new DataSeriesValues('String', 'BarChart!$A$2:$A$3'));
        series.addPlotValues(new DataSeriesValues('Number', 'BarChart!$B$2:$B$3'));
        chart.addDataSeries(series);

        worksheet.addChart(chart);

        // Write and read back
        const writer = new XlsxWriter(spreadsheet);
        writer.setIncludeCharts(true);
        const buffer = await writer.writeBuffer();

        const reader = new XlsxReader();
        reader.setIncludeCharts(true);
        const readSpreadsheet = await reader.loadFromBuffer(buffer);
        const readWorksheet = readSpreadsheet.getSheetByName('BarChart');

        const readChart = readWorksheet!.getChartCollection()[0];
        expect(readChart).toBeDefined();

        // Verify positioning
        const topLeft = readChart!.getTopLeftPosition();
        expect(topLeft.cell).toBe('D2');
        expect(topLeft.offsetX).toBe(100);
        expect(topLeft.offsetY).toBe(50);

        const bottomRight = readChart!.getBottomRightPosition();
        expect(bottomRight).not.toBeNull();
        expect(bottomRight!.cell).toBe('H10');
        expect(bottomRight!.offsetX).toBe(200);
        expect(bottomRight!.offsetY).toBe(150);
    });

    test('line chart round-trip: chart type preserved', async () => {
        const spreadsheet = new Spreadsheet();
        const worksheet = spreadsheet.getActiveSheet();
        worksheet.setTitle('LineChart');

        worksheet.getCell('A1').setValue('Day');
        worksheet.getCell('A2').setValue('Mon');
        worksheet.getCell('A3').setValue('Tue');
        worksheet.getCell('A4').setValue('Wed');
        worksheet.getCell('B1').setValue('Revenue');
        worksheet.getCell('B2').setValue(1000);
        worksheet.getCell('B3').setValue(1200);
        worksheet.getCell('B4').setValue(900);

        const chart = new Chart();
        chart.setName('Line Chart Test');
        chart.setTopLeftPosition({ cell: 'D2' });

        const series = new DataSeries('line');
        series.setPlotCategory(new DataSeriesValues('String', 'LineChart!$A$2:$A$4'));
        series.addPlotValues(new DataSeriesValues('Number', 'LineChart!$B$2:$B$4'));
        chart.addDataSeries(series);

        worksheet.addChart(chart);

        // Write and read back
        const writer = new XlsxWriter(spreadsheet);
        writer.setIncludeCharts(true);
        const buffer = await writer.writeBuffer();

        const reader = new XlsxReader();
        reader.setIncludeCharts(true);
        const readSpreadsheet = await reader.loadFromBuffer(buffer);
        const readWorksheet = readSpreadsheet.getSheetByName('LineChart');

        expect(readWorksheet!.getChartCollection()).toHaveLength(1);
        const readChart = readWorksheet!.getChartCollection()[0];
        expect(readChart).toBeDefined();
        expect(readChart!.getPlotArea()).toHaveLength(1);
        expect(readChart!.getPlotArea()[0]!.getPlotType()).toBe('line');
    });

    test('pie chart round-trip: chart type preserved', async () => {
        const spreadsheet = new Spreadsheet();
        const worksheet = spreadsheet.getActiveSheet();
        worksheet.setTitle('PieChart');

        worksheet.getCell('A1').setValue('Segment');
        worksheet.getCell('A2').setValue('A');
        worksheet.getCell('A3').setValue('B');
        worksheet.getCell('A4').setValue('C');
        worksheet.getCell('B1').setValue('Share');
        worksheet.getCell('B2').setValue(30);
        worksheet.getCell('B3').setValue(50);
        worksheet.getCell('B4').setValue(20);

        const chart = new Chart();
        chart.setName('Pie Chart Test');
        chart.setTopLeftPosition({ cell: 'D2' });

        const series = new DataSeries('pie');
        series.setPlotCategory(new DataSeriesValues('String', 'PieChart!$A$2:$A$4'));
        series.addPlotValues(new DataSeriesValues('Number', 'PieChart!$B$2:$B$4'));
        chart.addDataSeries(series);

        worksheet.addChart(chart);

        // Write and read back
        const writer = new XlsxWriter(spreadsheet);
        writer.setIncludeCharts(true);
        const buffer = await writer.writeBuffer();

        const reader = new XlsxReader();
        reader.setIncludeCharts(true);
        const readSpreadsheet = await reader.loadFromBuffer(buffer);
        const readWorksheet = readSpreadsheet.getSheetByName('PieChart');

        expect(readWorksheet!.getChartCollection()).toHaveLength(1);
        const readChart = readWorksheet!.getChartCollection()[0];
        expect(readChart).toBeDefined();
        expect(readChart!.getPlotArea()).toHaveLength(1);
        expect(readChart!.getPlotArea()[0]!.getPlotType()).toBe('pie');
    });

    test('chart with title round-trip: title preserved', async () => {
        const spreadsheet = new Spreadsheet();
        const worksheet = spreadsheet.getActiveSheet();
        worksheet.setTitle('TitledChart');

        worksheet.getCell('A1').setValue('X');
        worksheet.getCell('A2').setValue(1);
        worksheet.getCell('A3').setValue(2);
        worksheet.getCell('B1').setValue('Y');
        worksheet.getCell('B2').setValue(10);
        worksheet.getCell('B3').setValue(20);

        const chart = new Chart();
        chart.setName('Chart with Title');
        chart.setTitleText('Annual Sales Report');
        chart.setTopLeftPosition({ cell: 'D2' });

        const series = new DataSeries('bar');
        series.setPlotCategory(new DataSeriesValues('String', 'TitledChart!$A$2:$A$3'));
        series.addPlotValues(new DataSeriesValues('Number', 'TitledChart!$B$2:$B$3'));
        chart.addDataSeries(series);

        worksheet.addChart(chart);

        // Write and read back
        const writer = new XlsxWriter(spreadsheet);
        writer.setIncludeCharts(true);
        const buffer = await writer.writeBuffer();

        const reader = new XlsxReader();
        reader.setIncludeCharts(true);
        const readSpreadsheet = await reader.loadFromBuffer(buffer);
        const readWorksheet = readSpreadsheet.getSheetByName('TitledChart');

        const readChart = readWorksheet!.getChartCollection()[0];
        expect(readChart).toBeDefined();
        expect(readChart!.getTitleText()).toBe('Annual Sales Report');
    });

    test('multiple charts on same worksheet round-trip: all charts preserved', async () => {
        const spreadsheet = new Spreadsheet();
        const worksheet = spreadsheet.getActiveSheet();
        worksheet.setTitle('MultiChart');

        // Data for chart 1
        worksheet.getCell('A1').setValue('Type');
        worksheet.getCell('A2').setValue('A');
        worksheet.getCell('A3').setValue('B');
        worksheet.getCell('B1').setValue('Val1');
        worksheet.getCell('B2').setValue(100);
        worksheet.getCell('B3').setValue(200);

        // Data for chart 2
        worksheet.getCell('D1').setValue('Type');
        worksheet.getCell('D2').setValue('X');
        worksheet.getCell('D3').setValue('Y');
        worksheet.getCell('E1').setValue('Val2');
        worksheet.getCell('E2').setValue(50);
        worksheet.getCell('E3').setValue(75);

        // Chart 1
        const chart1 = new Chart();
        chart1.setName('Chart 1');
        chart1.setTopLeftPosition({ cell: 'G2' });
        const series1 = new DataSeries('bar');
        series1.setPlotCategory(new DataSeriesValues('String', 'MultiChart!$A$2:$A$3'));
        series1.addPlotValues(new DataSeriesValues('Number', 'MultiChart!$B$2:$B$3'));
        chart1.addDataSeries(series1);
        worksheet.addChart(chart1);

        // Chart 2
        const chart2 = new Chart();
        chart2.setName('Chart 2');
        chart2.setTopLeftPosition({ cell: 'G15' });
        const series2 = new DataSeries('line');
        series2.setPlotCategory(new DataSeriesValues('String', 'MultiChart!$D$2:$D$3'));
        series2.addPlotValues(new DataSeriesValues('Number', 'MultiChart!$E$2:$E$3'));
        chart2.addDataSeries(series2);
        worksheet.addChart(chart2);

        // Write and read back
        const writer = new XlsxWriter(spreadsheet);
        writer.setIncludeCharts(true);
        const buffer = await writer.writeBuffer();

        const reader = new XlsxReader();
        reader.setIncludeCharts(true);
        const readSpreadsheet = await reader.loadFromBuffer(buffer);
        const readWorksheet = readSpreadsheet.getSheetByName('MultiChart');

        expect(readWorksheet!.getChartCollection()).toHaveLength(2);

        const chartNames = readWorksheet!
            .getChartCollection()
            .map((c) => c.getName())
            .sort();
        expect(chartNames).toContain('Chart 1');
        expect(chartNames).toContain('Chart 2');
    });

    test('chart without includeCharts flag: charts not loaded', async () => {
        const spreadsheet = new Spreadsheet();
        const worksheet = spreadsheet.getActiveSheet();
        worksheet.setTitle('NoCharts');

        worksheet.getCell('A1').setValue('X');
        worksheet.getCell('B1').setValue('Y');

        const chart = new Chart();
        chart.setName('Should Not Load');
        chart.setTopLeftPosition({ cell: 'D2' });
        worksheet.addChart(chart);

        // Write with charts enabled
        const writer = new XlsxWriter(spreadsheet);
        writer.setIncludeCharts(true);
        const buffer = await writer.writeBuffer();

        // Read without includeCharts
        const reader = new XlsxReader();
        // Note: NOT calling setIncludeCharts(true)
        const readSpreadsheet = await reader.loadFromBuffer(buffer);
        const readWorksheet = readSpreadsheet.getSheetByName('NoCharts');

        expect(readWorksheet!.getChartCollection()).toHaveLength(0);
    });

    test('chart XML path is set when reading', async () => {
        const spreadsheet = new Spreadsheet();
        const worksheet = spreadsheet.getActiveSheet();
        worksheet.setTitle('ChartPath');

        worksheet.getCell('A1').setValue('Label');
        worksheet.getCell('A2').setValue('A');
        worksheet.getCell('B1').setValue('Data');
        worksheet.getCell('B2').setValue(42);

        const chart = new Chart();
        chart.setName('Path Test');
        chart.setTopLeftPosition({ cell: 'D2' });
        const series = new DataSeries('bar');
        series.setPlotCategory(new DataSeriesValues('String', 'ChartPath!$A$2:$A$2'));
        series.addPlotValues(new DataSeriesValues('Number', 'ChartPath!$B$2:$B$2'));
        chart.addDataSeries(series);
        worksheet.addChart(chart);

        // Write and read back
        const writer = new XlsxWriter(spreadsheet);
        writer.setIncludeCharts(true);
        const buffer = await writer.writeBuffer();

        const reader = new XlsxReader();
        reader.setIncludeCharts(true);
        const readSpreadsheet = await reader.loadFromBuffer(buffer);
        const readWorksheet = readSpreadsheet.getSheetByName('ChartPath');

        const readChart = readWorksheet!.getChartCollection()[0];
        expect(readChart).toBeDefined();
        expect(readChart!.getChartXmlPath()).toBeTruthy();
        expect(readChart!.getChartXmlPath()).toMatch(/xl\/charts\/chart\d+\.xml$/);
    });
});
