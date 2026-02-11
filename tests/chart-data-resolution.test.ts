import { describe, expect, test } from 'bun:test';
import { Spreadsheet } from '../src/core/spreadsheet.ts';
import { writeChartXml } from '../src/io/xlsx/charts.ts';
import { Chart } from '../src/worksheet/chart/chart.ts';
import { DataSeriesValues } from '../src/worksheet/chart/data-series-values.ts';
import { DataSeries } from '../src/worksheet/chart/data-series.ts';

describe('Chart Data Resolution', () => {
    test('writeChartXml includes cached values from worksheet cells', () => {
        const spreadsheet = new Spreadsheet();
        const sheet = spreadsheet.getActiveSheet();

        // Set up test data in cells
        sheet.setCellValue('A1', 'Category 1');
        sheet.setCellValue('A2', 'Category 2');
        sheet.setCellValue('A3', 'Category 3');
        sheet.setCellValue('B1', 100);
        sheet.setCellValue('B2', 200);
        sheet.setCellValue('B3', 300);

        // Create chart with data series
        const chart = new Chart();

        // Create category data series values (string type)
        const categoryValues = new DataSeriesValues('String', 'Sheet1!$A$1:$A$3', 'General', 3);

        // Create plot values (numeric)
        const plotValues = new DataSeriesValues('Number', 'Sheet1!$B$1:$B$3', 'General', 3);

        // Create data series with correct constructor parameters
        const dataSeries = new DataSeries('bar', 'clustered', [0], [], [categoryValues], [plotValues], 'col');

        chart.addDataSeries(dataSeries);
        chart.setTitleText('Test Chart');

        // Attach chart to worksheet
        sheet.addChart(chart);

        // Generate chart XML
        const xml = writeChartXml(chart, sheet);

        // Verify the XML contains both references and cached values
        // Should contain the cell reference
        expect(xml).toContain('<c:f>Sheet1!$A$1:$A$3</c:f>');
        expect(xml).toContain('<c:f>Sheet1!$B$1:$B$3</c:f>');

        // Should contain the cached string values (categories)
        expect(xml).toContain('<c:strCache>');
        expect(xml).toContain('idx="0"');
        expect(xml).toContain('<c:v>Category 1</c:v>');
        expect(xml).toContain('<c:v>Category 2</c:v>');
        expect(xml).toContain('<c:v>Category 3</c:v>');

        // Should contain the cached numeric values
        expect(xml).toContain('<c:numCache>');
        expect(xml).toContain('<c:v>100</c:v>');
        expect(xml).toContain('<c:v>200</c:v>');
        expect(xml).toContain('<c:v>300</c:v>');
    });

    test('writeChartXml handles empty worksheet gracefully', () => {
        const spreadsheet = new Spreadsheet();
        const sheet = spreadsheet.getActiveSheet();

        // Create chart with data series but no cell values
        const chart = new Chart();

        const categoryValues = new DataSeriesValues('String', 'Sheet1!$A$1:$A$3', 'General', 3);
        const plotValues = new DataSeriesValues('Number', 'Sheet1!$B$1:$B$3', 'General', 3);
        const dataSeries = new DataSeries('bar', 'clustered', [0], [], [categoryValues], [plotValues], 'col');

        chart.addDataSeries(dataSeries);
        sheet.addChart(chart);

        // Generate chart XML - should not throw even with empty cells
        const xml = writeChartXml(chart, sheet);

        // Should still contain references
        expect(xml).toContain('<c:f>Sheet1!$A$1:$A$3</c:f>');
        expect(xml).toContain('<c:f>Sheet1!$B$1:$B$3</c:f>');

        // Cached values should be empty strings for missing cells
        expect(xml).toContain('<c:ptCount val="3"/>');
    });

    test('writeChartXml uses chart worksheet when worksheet parameter not provided', () => {
        const spreadsheet = new Spreadsheet();
        const sheet = spreadsheet.getActiveSheet();

        // Set up test data
        sheet.setCellValue('C1', 'Value 1');
        sheet.setCellValue('C2', 'Value 2');
        sheet.setCellValue('D1', 500);
        sheet.setCellValue('D2', 600);

        const chart = new Chart();
        const categoryValues = new DataSeriesValues('String', 'Sheet1!$C$1:$C$2', 'General', 2);
        const plotValues = new DataSeriesValues('Number', 'Sheet1!$D$1:$D$2', 'General', 2);
        const dataSeries = new DataSeries('bar', 'clustered', [0], [], [categoryValues], [plotValues], 'col');

        chart.addDataSeries(dataSeries);
        sheet.addChart(chart);

        // Call without worksheet parameter - should get it from chart
        const xml = writeChartXml(chart);

        // Should resolve values from chart's attached worksheet
        expect(xml).toContain('<c:v>Value 1</c:v>');
        expect(xml).toContain('<c:v>Value 2</c:v>');
        expect(xml).toContain('<c:v>500</c:v>');
        expect(xml).toContain('<c:v>600</c:v>');
    });

    test('writeChartXml handles numeric values correctly', () => {
        const spreadsheet = new Spreadsheet();
        const sheet = spreadsheet.getActiveSheet();

        // Set up numeric data with decimals
        sheet.setCellValue('A1', 10.5);
        sheet.setCellValue('A2', 20.25);
        sheet.setCellValue('A3', 30.75);

        const chart = new Chart();
        const plotValues = new DataSeriesValues('Number', 'Sheet1!$A$1:$A$3', '0.00', 3);
        const dataSeries = new DataSeries('bar', 'clustered', [0], [], [], [plotValues], 'col');

        chart.addDataSeries(dataSeries);
        sheet.addChart(chart);

        const xml = writeChartXml(chart, sheet);

        // Should contain numeric cache
        expect(xml).toContain('<c:numCache>');
        expect(xml).toContain('<c:formatCode>0.00</c:formatCode>');
        expect(xml).toContain('<c:v>10.5</c:v>');
        expect(xml).toContain('<c:v>20.25</c:v>');
        expect(xml).toContain('<c:v>30.75</c:v>');
    });

    test('writeChartXml handles string categories correctly', () => {
        const spreadsheet = new Spreadsheet();
        const sheet = spreadsheet.getActiveSheet();

        // Set up string categories
        sheet.setCellValue('A1', 'Q1 Sales');
        sheet.setCellValue('A2', 'Q2 Sales');
        sheet.setCellValue('A3', 'Q3 Sales');
        sheet.setCellValue('A4', 'Q4 Sales');

        const chart = new Chart();
        const categoryValues = new DataSeriesValues('String', 'Sheet1!$A$1:$A$4', 'General', 4);
        const dataSeries = new DataSeries('bar', 'clustered', [0], [], [categoryValues], [], 'col');

        chart.addDataSeries(dataSeries);
        sheet.addChart(chart);

        const xml = writeChartXml(chart, sheet);

        // Should contain string cache for categories
        expect(xml).toContain('<c:strCache>');
        expect(xml).toContain('<c:v>Q1 Sales</c:v>');
        expect(xml).toContain('<c:v>Q2 Sales</c:v>');
        expect(xml).toContain('<c:v>Q3 Sales</c:v>');
        expect(xml).toContain('<c:v>Q4 Sales</c:v>');
    });

    test('writeChartXml handles mixed data types in cells', () => {
        const spreadsheet = new Spreadsheet();
        const sheet = spreadsheet.getActiveSheet();

        // Set up mixed data (numbers and strings)
        sheet.setCellValue('A1', 100);
        sheet.setCellValue('A2', 'text value');
        sheet.setCellValue('A3', 300);

        const chart = new Chart();
        const plotValues = new DataSeriesValues('Number', 'Sheet1!$A$1:$A$3', 'General', 3);
        const dataSeries = new DataSeries('bar', 'clustered', [0], [], [], [plotValues], 'col');

        chart.addDataSeries(dataSeries);
        sheet.addChart(chart);

        const xml = writeChartXml(chart, sheet);

        // All values should be written as strings in the cache
        expect(xml).toContain('<c:v>100</c:v>');
        expect(xml).toContain('<c:v>text value</c:v>');
        expect(xml).toContain('<c:v>300</c:v>');
    });

    test('writeChartXml handles single cell reference', () => {
        const spreadsheet = new Spreadsheet();
        const sheet = spreadsheet.getActiveSheet();

        sheet.setCellValue('A1', 'Single Value');

        const chart = new Chart();
        const plotValues = new DataSeriesValues('String', 'Sheet1!$A$1', 'General', 1);
        const dataSeries = new DataSeries('bar', 'clustered', [0], [], [], [plotValues], 'col');

        chart.addDataSeries(dataSeries);
        sheet.addChart(chart);

        const xml = writeChartXml(chart, sheet);

        expect(xml).toContain('<c:f>Sheet1!$A$1</c:f>');
        expect(xml).toContain('<c:ptCount val="1"/>');
        expect(xml).toContain('<c:v>Single Value</c:v>');
    });

    test('writeChartXml handles empty cells in range', () => {
        const spreadsheet = new Spreadsheet();
        const sheet = spreadsheet.getActiveSheet();

        // Only set some cells in the range
        sheet.setCellValue('A1', 'First');
        // A2 is empty
        sheet.setCellValue('A3', 'Third');

        const chart = new Chart();
        const categoryValues = new DataSeriesValues('String', 'Sheet1!$A$1:$A$3', 'General', 3);
        const dataSeries = new DataSeries('bar', 'clustered', [0], [], [categoryValues], [], 'col');

        chart.addDataSeries(dataSeries);
        sheet.addChart(chart);

        const xml = writeChartXml(chart, sheet);

        // Should have 3 points, with empty string for missing cell
        expect(xml).toContain('<c:ptCount val="3"/>');
        expect(xml).toContain('<c:v>First</c:v>');
        expect(xml).toContain('<c:v>Third</c:v>');
    });

    test('writeChartXml handles multiple data series', () => {
        const spreadsheet = new Spreadsheet();
        const sheet = spreadsheet.getActiveSheet();

        // Set up data for multiple series
        sheet.setCellValue('A1', 'Category 1');
        sheet.setCellValue('A2', 'Category 2');
        sheet.setCellValue('B1', 100);
        sheet.setCellValue('B2', 200);
        sheet.setCellValue('C1', 300);
        sheet.setCellValue('C2', 400);

        const chart = new Chart();

        // Shared categories
        const categoryValues = new DataSeriesValues('String', 'Sheet1!$A$1:$A$2', 'General', 2);

        // First series
        const plotValues1 = new DataSeriesValues('Number', 'Sheet1!$B$1:$B$2', 'General', 2);
        const dataSeries1 = new DataSeries('bar', 'clustered', [0], [], [categoryValues], [plotValues1], 'col');

        // Second series
        const plotValues2 = new DataSeriesValues('Number', 'Sheet1!$C$1:$C$2', 'General', 2);
        const dataSeries2 = new DataSeries('bar', 'clustered', [1], [], [categoryValues], [plotValues2], 'col');

        chart.addDataSeries(dataSeries1);
        chart.addDataSeries(dataSeries2);
        sheet.addChart(chart);

        const xml = writeChartXml(chart, sheet);

        // Should contain both series
        expect(xml).toContain('<c:idx val="0"/>');
        expect(xml).toContain('<c:idx val="1"/>');
        expect(xml).toContain('<c:f>Sheet1!$B$1:$B$2</c:f>');
        expect(xml).toContain('<c:f>Sheet1!$C$1:$C$2</c:f>');
        expect(xml).toContain('<c:v>100</c:v>');
        expect(xml).toContain('<c:v>400</c:v>');
    });
});
