import { describe, expect, test } from 'bun:test';
import unzipper from 'unzipper';
import { Spreadsheet } from '../src/core/spreadsheet.ts';
import { XlsxReader } from '../src/io/xlsx-reader.ts';
import { XlsxWriter } from '../src/io/xlsx-writer.ts';
import { ChartColor, EXCEL_COLOR_TYPE_SYSTEM } from '../src/worksheet/chart/chart-color.ts';
import { Chart } from '../src/worksheet/chart/chart.ts';
import { DataSeriesValues } from '../src/worksheet/chart/data-series-values.ts';
import { DataSeries } from '../src/worksheet/chart/data-series.ts';
import { Legend } from '../src/worksheet/chart/legend.ts';

const getFirstChartXml = async (buffer: Uint8Array | ArrayBuffer): Promise<string> => {
    const zipBuffer = buffer instanceof ArrayBuffer ? Buffer.from(new Uint8Array(buffer)) : Buffer.from(buffer);
    const zip = await unzipper.Open.buffer(zipBuffer);
    const chartFile = zip.files.find((file) => file.path.startsWith('xl/charts/chart') && file.path.endsWith('.xml'));
    expect(chartFile).toBeDefined();
    return (await chartFile!.buffer()).toString('utf-8');
};

describe('ChartColor types', () => {
    test('supports scheme and system colors in legend styling', async () => {
        const spreadsheet = new Spreadsheet();
        const worksheet = spreadsheet.getActiveSheet();
        worksheet.setTitle('ChartColorTypes');

        worksheet.getCell('A1').setValue('Category');
        worksheet.getCell('A2').setValue('One');
        worksheet.getCell('B1').setValue('Series');
        worksheet.getCell('B2').setValue(10);

        const chart = new Chart();
        chart.setName('ChartColor Types');
        chart.setTopLeftPosition({ cell: 'D2' });

        const legend = new Legend();
        legend.setFillColor(new ChartColor('*accent1'));
        const legendBorder = legend.getBorderLines();
        legendBorder.setLineColorProperties('windowText', null, EXCEL_COLOR_TYPE_SYSTEM);
        legendBorder.setLineStyleProperty('width', 1);
        legendBorder.setLineStyleProperty('dash', 'solid');
        chart.setLegendObject(legend);

        const series = new DataSeries('bar');
        series.setPlotCategories([new DataSeriesValues('String', 'ChartColorTypes!$A$2')]);
        series.addPlotValues(new DataSeriesValues('Number', 'ChartColorTypes!$B$2'));
        chart.addDataSeries(series);
        worksheet.addChart(chart);

        const writer = new XlsxWriter(spreadsheet);
        writer.setIncludeCharts(true);
        const buffer = await writer.writeBuffer();
        const chartXml = await getFirstChartXml(buffer);

        expect(chartXml).toContain('<a:schemeClr');
        expect(chartXml).toContain('val="accent1"');
        expect(chartXml).toContain('<a:sysClr');
        expect(chartXml).toContain('val="windowText"');
    });

    test('round-trips alpha and brightness for scheme colors', async () => {
        const spreadsheet = new Spreadsheet();
        const worksheet = spreadsheet.getActiveSheet();
        worksheet.setTitle('ChartColorAlpha');

        worksheet.getCell('A1').setValue('Category');
        worksheet.getCell('A2').setValue('One');
        worksheet.getCell('B1').setValue('Series');
        worksheet.getCell('B2').setValue(10);

        const chart = new Chart();
        chart.setName('ChartColor Alpha');
        chart.setTopLeftPosition({ cell: 'D2' });

        const legend = new Legend();
        const fillColor = new ChartColor('*accent2');
        fillColor.setAlpha(20);
        fillColor.setBrightness(30);
        legend.setFillColor(fillColor);
        chart.setLegendObject(legend);

        const series = new DataSeries('bar');
        series.setPlotCategories([new DataSeriesValues('String', 'ChartColorAlpha!$A$2')]);
        series.addPlotValues(new DataSeriesValues('Number', 'ChartColorAlpha!$B$2'));
        chart.addDataSeries(series);
        worksheet.addChart(chart);

        const writer = new XlsxWriter(spreadsheet);
        writer.setIncludeCharts(true);
        const buffer = await writer.writeBuffer();
        const chartXml = await getFirstChartXml(buffer);

        expect(chartXml).toContain('<a:alpha val="80000"');
        expect(chartXml).toContain('<a:lumMod val="70000"');
        expect(chartXml).toContain('<a:lumOff val="30000"');

        const reader = new XlsxReader();
        reader.setIncludeCharts(true);
        const readSpreadsheet = await reader.loadFromBuffer(buffer);
        const readWorksheet = readSpreadsheet.getSheetByName('ChartColorAlpha');
        const readChart = readWorksheet!.getChartCollection()[0]!;
        const readLegend = readChart.getLegend();
        const readFill = readLegend?.getFillColor();

        expect(readFill?.getType()).toBe('schemeClr');
        expect(readFill?.getValue()).toBe('accent2');
        expect(readFill?.getAlpha()).toBe(20);
        expect(readFill?.getBrightness()).toBe(30);
    });
});
