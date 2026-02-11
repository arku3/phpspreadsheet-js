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

describe('Combo Chart Tests', () => {
    test('Bar + Line combo: chart XML contains both c:barChart and c:lineChart', async () => {
        const spreadsheet = new Spreadsheet();
        const worksheet = spreadsheet.getActiveSheet();
        worksheet.setTitle('ComboBarLine');

        // Add sample data
        worksheet.getCell('A1').setValue('Month');
        worksheet.getCell('A2').setValue('Jan');
        worksheet.getCell('A3').setValue('Feb');
        worksheet.getCell('A4').setValue('Mar');
        worksheet.getCell('B1').setValue('Sales');
        worksheet.getCell('B2').setValue(100);
        worksheet.getCell('B3').setValue(150);
        worksheet.getCell('B4').setValue(200);
        worksheet.getCell('C1').setValue('Target');
        worksheet.getCell('C2').setValue(120);
        worksheet.getCell('C3').setValue(140);
        worksheet.getCell('C4').setValue(180);

        // Create combo chart
        const chart = new Chart();
        chart.setName('Bar Line Combo');
        chart.setTopLeftPosition({ cell: 'E2' });
        chart.setBottomRightPosition({ cell: 'K15' });

        // Series 1: Bar chart (Sales)
        const barSeries = new DataSeries('bar');
        barSeries.addPlotCategory(new DataSeriesValues('String', 'ComboBarLine!$A$2:$A$4'));
        barSeries.addPlotValues(new DataSeriesValues('Number', 'ComboBarLine!$B$2:$B$4'));
        chart.addDataSeries(barSeries);

        // Series 2: Line chart (Target)
        const lineSeries = new DataSeries('line');
        lineSeries.addPlotCategory(new DataSeriesValues('String', 'ComboBarLine!$A$2:$A$4'));
        lineSeries.addPlotValues(new DataSeriesValues('Number', 'ComboBarLine!$C$2:$C$4'));
        chart.addDataSeries(lineSeries);

        worksheet.addChart(chart);

        // Write to buffer
        const writer = new XlsxWriter(spreadsheet);
        writer.setIncludeCharts(true);
        const buffer = await writer.writeBuffer();

        // Verify chart XML contains both chart types
        const chartXml = await getFirstChartXml(buffer);
        expect(chartXml).toContain('<c:barChart>');
        expect(chartXml).toContain('<c:lineChart>');
    });

    test('Bar + Line combo round-trip: both series present with correct plot types', async () => {
        const spreadsheet = new Spreadsheet();
        const worksheet = spreadsheet.getActiveSheet();
        worksheet.setTitle('ComboBarLine');

        // Add sample data
        worksheet.getCell('A1').setValue('Month');
        worksheet.getCell('A2').setValue('Jan');
        worksheet.getCell('A3').setValue('Feb');
        worksheet.getCell('A4').setValue('Mar');
        worksheet.getCell('B1').setValue('Sales');
        worksheet.getCell('B2').setValue(100);
        worksheet.getCell('B3').setValue(150);
        worksheet.getCell('B4').setValue(200);
        worksheet.getCell('C1').setValue('Target');
        worksheet.getCell('C2').setValue(120);
        worksheet.getCell('C3').setValue(140);
        worksheet.getCell('C4').setValue(180);

        // Create combo chart
        const chart = new Chart();
        chart.setName('Bar Line Combo');
        chart.setTopLeftPosition({ cell: 'E2' });
        chart.setBottomRightPosition({ cell: 'K15' });

        // Series 1: Bar chart (Sales)
        const barSeries = new DataSeries('bar');
        barSeries.addPlotCategory(new DataSeriesValues('String', 'ComboBarLine!$A$2:$A$4'));
        barSeries.addPlotValues(new DataSeriesValues('Number', 'ComboBarLine!$B$2:$B$4'));
        chart.addDataSeries(barSeries);

        // Series 2: Line chart (Target)
        const lineSeries = new DataSeries('line');
        lineSeries.addPlotCategory(new DataSeriesValues('String', 'ComboBarLine!$A$2:$A$4'));
        lineSeries.addPlotValues(new DataSeriesValues('Number', 'ComboBarLine!$C$2:$C$4'));
        chart.addDataSeries(lineSeries);

        worksheet.addChart(chart);

        // Write to buffer
        const writer = new XlsxWriter(spreadsheet);
        writer.setIncludeCharts(true);
        const buffer = await writer.writeBuffer();

        // Read back and verify
        const reader = new XlsxReader();
        reader.setIncludeCharts(true);
        const readSpreadsheet = await reader.loadFromBuffer(buffer);
        const readWorksheet = readSpreadsheet.getSheetByName('ComboBarLine');

        expect(readWorksheet).toBeDefined();
        expect(readWorksheet!.getChartCollection()).toHaveLength(1);

        const readChart = readWorksheet!.getChartCollection()[0];
        expect(readChart).toBeDefined();

        // Verify both series are present
        const plotArea = readChart!.getPlotArea();
        expect(plotArea).toHaveLength(2);

        // Verify plot types - combo charts should preserve individual series types
        // NOTE: This currently fails because the reader determines chart type once
        // and applies it to all series. This is a known limitation.
        const plotTypes = plotArea.map((series) => series.getPlotType());
        expect(plotTypes).toContain('bar');
        expect(plotTypes).toContain('line');
    });

    test('Area + Line combo: chart XML contains both c:areaChart and c:lineChart', async () => {
        const spreadsheet = new Spreadsheet();
        const worksheet = spreadsheet.getActiveSheet();
        worksheet.setTitle('ComboAreaLine');

        // Add sample data
        worksheet.getCell('A1').setValue('Quarter');
        worksheet.getCell('A2').setValue('Q1');
        worksheet.getCell('A3').setValue('Q2');
        worksheet.getCell('A4').setValue('Q3');
        worksheet.getCell('A5').setValue('Q4');
        worksheet.getCell('B1').setValue('Revenue');
        worksheet.getCell('B2').setValue(500);
        worksheet.getCell('B3').setValue(600);
        worksheet.getCell('B4').setValue(750);
        worksheet.getCell('B5').setValue(800);
        worksheet.getCell('C1').setValue('Growth Rate');
        worksheet.getCell('C2').setValue(5);
        worksheet.getCell('C3').setValue(8);
        worksheet.getCell('C4').setValue(12);
        worksheet.getCell('C5').setValue(15);

        // Create combo chart
        const chart = new Chart();
        chart.setName('Area Line Combo');
        chart.setTopLeftPosition({ cell: 'E2' });
        chart.setBottomRightPosition({ cell: 'L18' });

        // Series 1: Area chart (Revenue)
        const areaSeries = new DataSeries('area');
        areaSeries.addPlotCategory(new DataSeriesValues('String', 'ComboAreaLine!$A$2:$A$5'));
        areaSeries.addPlotValues(new DataSeriesValues('Number', 'ComboAreaLine!$B$2:$B$5'));
        chart.addDataSeries(areaSeries);

        // Series 2: Line chart (Growth Rate)
        const lineSeries = new DataSeries('line');
        lineSeries.addPlotCategory(new DataSeriesValues('String', 'ComboAreaLine!$A$2:$A$5'));
        lineSeries.addPlotValues(new DataSeriesValues('Number', 'ComboAreaLine!$C$2:$C$5'));
        chart.addDataSeries(lineSeries);

        worksheet.addChart(chart);

        // Write to buffer
        const writer = new XlsxWriter(spreadsheet);
        writer.setIncludeCharts(true);
        const buffer = await writer.writeBuffer();

        // Verify chart XML contains both chart types
        const chartXml = await getFirstChartXml(buffer);
        expect(chartXml).toContain('<c:areaChart>');
        expect(chartXml).toContain('<c:lineChart>');
    });

    test('Area + Line combo round-trip: both series have correct plot types', async () => {
        const spreadsheet = new Spreadsheet();
        const worksheet = spreadsheet.getActiveSheet();
        worksheet.setTitle('ComboAreaLine');

        // Add sample data
        worksheet.getCell('A1').setValue('Quarter');
        worksheet.getCell('A2').setValue('Q1');
        worksheet.getCell('A3').setValue('Q2');
        worksheet.getCell('A4').setValue('Q3');
        worksheet.getCell('A5').setValue('Q4');
        worksheet.getCell('B1').setValue('Revenue');
        worksheet.getCell('B2').setValue(500);
        worksheet.getCell('B3').setValue(600);
        worksheet.getCell('B4').setValue(750);
        worksheet.getCell('B5').setValue(800);
        worksheet.getCell('C1').setValue('Growth Rate');
        worksheet.getCell('C2').setValue(5);
        worksheet.getCell('C3').setValue(8);
        worksheet.getCell('C4').setValue(12);
        worksheet.getCell('C5').setValue(15);

        // Create combo chart
        const chart = new Chart();
        chart.setName('Area Line Combo');
        chart.setTopLeftPosition({ cell: 'E2' });
        chart.setBottomRightPosition({ cell: 'L18' });

        // Series 1: Area chart (Revenue)
        const areaSeries = new DataSeries('area');
        areaSeries.addPlotCategory(new DataSeriesValues('String', 'ComboAreaLine!$A$2:$A$5'));
        areaSeries.addPlotValues(new DataSeriesValues('Number', 'ComboAreaLine!$B$2:$B$5'));
        chart.addDataSeries(areaSeries);

        // Series 2: Line chart (Growth Rate)
        const lineSeries = new DataSeries('line');
        lineSeries.addPlotCategory(new DataSeriesValues('String', 'ComboAreaLine!$A$2:$A$5'));
        lineSeries.addPlotValues(new DataSeriesValues('Number', 'ComboAreaLine!$C$2:$C$5'));
        chart.addDataSeries(lineSeries);

        worksheet.addChart(chart);

        // Write to buffer
        const writer = new XlsxWriter(spreadsheet);
        writer.setIncludeCharts(true);
        const buffer = await writer.writeBuffer();

        // Read back and verify
        const reader = new XlsxReader();
        reader.setIncludeCharts(true);
        const readSpreadsheet = await reader.loadFromBuffer(buffer);
        const readWorksheet = readSpreadsheet.getSheetByName('ComboAreaLine');

        expect(readWorksheet).toBeDefined();
        expect(readWorksheet!.getChartCollection()).toHaveLength(1);

        const readChart = readWorksheet!.getChartCollection()[0];
        expect(readChart).toBeDefined();

        // Verify both series are present with correct plot types
        const plotArea = readChart!.getPlotArea();
        expect(plotArea).toHaveLength(2);

        // NOTE: This currently fails because the reader determines chart type once
        // and applies it to all series. This is a known limitation.
        const plotTypes = plotArea.map((series) => series.getPlotType());
        expect(plotTypes).toContain('area');
        expect(plotTypes).toContain('line');
    });
});
