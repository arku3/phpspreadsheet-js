import { describe, expect, test } from 'bun:test';
import unzipper from 'unzipper';
import { Spreadsheet } from '../src/core/spreadsheet.ts';
import { XlsxReader } from '../src/io/xlsx-reader.ts';
import { XlsxWriter } from '../src/io/xlsx-writer.ts';
import { Font } from '../src/style/font.ts';
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
        series.addPlotCategory(new DataSeriesValues('String', 'AxisChart!$A$2:$A$3'));
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
        series.addPlotCategory(new DataSeriesValues('String', 'AxisRoundTrip!$A$2:$A$3'));
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

    test('writer outputs styled axis titles and gridlines', async () => {
        const spreadsheet = new Spreadsheet();
        const worksheet = spreadsheet.getActiveSheet();
        worksheet.setTitle('StyledAxisChart');

        worksheet.getCell('A1').setValue('Category');
        worksheet.getCell('A2').setValue('One');
        worksheet.getCell('A3').setValue('Two');
        worksheet.getCell('B1').setValue('Series');
        worksheet.getCell('B2').setValue(10);
        worksheet.getCell('B3').setValue(20);

        const chart = new Chart();
        chart.setName('Styled Axis Chart');
        chart.setTopLeftPosition({ cell: 'D2' });
        chart.setXAxisTitle('Categories');
        chart.setYAxisTitle('Values');
        chart.setXAxisMajorGridlines(true);
        chart.setYAxisMajorGridlines(true);

        // Set styled fonts for axis titles
        const xAxisFont = new Font();
        xAxisFont.setName('Arial');
        xAxisFont.setSize(12);
        xAxisFont.setBold(true);
        xAxisFont.getColor().setARGB('FF0000FF');
        chart.setXAxisTitleFont(xAxisFont);

        const yAxisFont = new Font();
        yAxisFont.setName('Times New Roman');
        yAxisFont.setSize(14);
        yAxisFont.setItalic(true);
        yAxisFont.getColor().setARGB('FFFF0000');
        chart.setYAxisTitleFont(yAxisFont);

        // Set styled gridlines
        chart.setXAxisMajorGridlineStyle({ color: 'FFCCCCCC', width: 1 });
        chart.setYAxisMajorGridlineStyle({ color: 'FF999999', width: 0.5 });

        const series = new DataSeries('bar');
        series.addPlotCategory(new DataSeriesValues('String', 'StyledAxisChart!$A$2:$A$3'));
        series.addPlotValues(new DataSeriesValues('Number', 'StyledAxisChart!$B$2:$B$3'));
        chart.addDataSeries(series);

        worksheet.addChart(chart);

        const writer = new XlsxWriter(spreadsheet);
        writer.setIncludeCharts(true);
        const buffer = await writer.writeBuffer();

        const chartXml = await getFirstChartXml(buffer);
        // Check for styled axis titles (font elements in a:rPr)
        expect(chartXml).toContain('<a:rPr>');
        expect(chartXml).toContain('<a:rFont');
        expect(chartXml).toContain('<a:b');
        expect(chartXml).toContain('<a:i');
        expect(chartXml).toContain('<a:solidFill>');
        // Check for styled gridlines (spPr elements)
        expect(chartXml).toContain('<c:spPr>');
        expect(chartXml).toContain('<a:ln');
    });

    test('reader preserves styled axis titles and gridlines', async () => {
        const spreadsheet = new Spreadsheet();
        const worksheet = spreadsheet.getActiveSheet();
        worksheet.setTitle('StyledAxisRoundTrip');

        worksheet.getCell('A1').setValue('Category');
        worksheet.getCell('A2').setValue('One');
        worksheet.getCell('A3').setValue('Two');
        worksheet.getCell('B1').setValue('Series');
        worksheet.getCell('B2').setValue(10);
        worksheet.getCell('B3').setValue(20);

        const chart = new Chart();
        chart.setName('Styled Axis RoundTrip');
        chart.setTopLeftPosition({ cell: 'D2' });
        chart.setXAxisTitle('Categories');
        chart.setYAxisTitle('Values');
        chart.setXAxisMajorGridlines(true);
        chart.setYAxisMajorGridlines(true);

        const xAxisFont = new Font();
        xAxisFont.setName('Arial');
        xAxisFont.setSize(12);
        xAxisFont.setBold(true);
        xAxisFont.getColor().setARGB('FF0000FF');
        chart.setXAxisTitleFont(xAxisFont);

        const yAxisFont = new Font();
        yAxisFont.setName('Times New Roman');
        yAxisFont.setSize(14);
        yAxisFont.setItalic(true);
        yAxisFont.getColor().setARGB('FFFF0000');
        chart.setYAxisTitleFont(yAxisFont);

        chart.setXAxisMajorGridlineStyle({ color: 'FFCCCCCC', width: 1 });
        chart.setYAxisMajorGridlineStyle({ color: 'FF999999', width: 0.5 });

        const series = new DataSeries('bar');
        series.addPlotCategory(new DataSeriesValues('String', 'StyledAxisRoundTrip!$A$2:$A$3'));
        series.addPlotValues(new DataSeriesValues('Number', 'StyledAxisRoundTrip!$B$2:$B$3'));
        chart.addDataSeries(series);

        worksheet.addChart(chart);

        const writer = new XlsxWriter(spreadsheet);
        writer.setIncludeCharts(true);
        const buffer = await writer.writeBuffer();

        const reader = new XlsxReader();
        reader.setIncludeCharts(true);
        const readSpreadsheet = await reader.loadFromBuffer(buffer);
        const readWorksheet = readSpreadsheet.getSheetByName('StyledAxisRoundTrip');

        expect(readWorksheet!.getChartCollection()).toHaveLength(1);
        const readChart = readWorksheet!.getChartCollection()[0]!;
        expect(readChart.getXAxisTitle()).toBe('Categories');
        expect(readChart.getYAxisTitle()).toBe('Values');
        expect(readChart.getXAxisMajorGridlines()).toBe(true);
        expect(readChart.getYAxisMajorGridlines()).toBe(true);

        // Check styled fonts were preserved
        const readXAxisFont = readChart.getXAxisTitleFont();
        expect(readXAxisFont).not.toBeNull();
        expect(readXAxisFont!.getName()).toBe('Arial');
        expect(readXAxisFont!.getSize()).toBe(12);
        expect(readXAxisFont!.getBold()).toBe(true);

        const readYAxisFont = readChart.getYAxisTitleFont();
        expect(readYAxisFont).not.toBeNull();
        expect(readYAxisFont!.getName()).toBe('Times New Roman');
        expect(readYAxisFont!.getSize()).toBe(14);
        expect(readYAxisFont!.getItalic()).toBe(true);

        // Check gridline styles were preserved
        const readXGridlineStyle = readChart.getXAxisMajorGridlineStyle();
        expect(readXGridlineStyle).not.toBeNull();
        expect(readXGridlineStyle!.color).toBe('FFCCCCCC');
        expect(readXGridlineStyle!.width).toBe(1);

        const readYGridlineStyle = readChart.getYAxisMajorGridlineStyle();
        expect(readYGridlineStyle).not.toBeNull();
        expect(readYGridlineStyle!.color).toBe('FF999999');
        expect(readYGridlineStyle!.width).toBe(0.5);
    });
});
