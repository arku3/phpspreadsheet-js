import { describe, expect, test } from 'bun:test';
import unzipper from 'unzipper';
import { Spreadsheet } from '../src/core/spreadsheet.ts';
import { XlsxReader } from '../src/io/xlsx-reader.ts';
import { XlsxWriter } from '../src/io/xlsx-writer.ts';
import { Font } from '../src/style/font.ts';
import { ChartColor } from '../src/worksheet/chart/chart-color.ts';
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

describe('Chart legend styling', () => {
    test('writes legend fill and border styling', async () => {
        const spreadsheet = new Spreadsheet();
        const worksheet = spreadsheet.getActiveSheet();
        worksheet.setTitle('LegendStyles');

        worksheet.getCell('A1').setValue('Category');
        worksheet.getCell('A2').setValue('One');
        worksheet.getCell('A3').setValue('Two');
        worksheet.getCell('B1').setValue('Series');
        worksheet.getCell('B2').setValue(10);
        worksheet.getCell('B3').setValue(20);

        const chart = new Chart();
        chart.setName('Legend Style Chart');
        chart.setTopLeftPosition({ cell: 'D2' });

        const legend = new Legend();
        legend.setFillColor(new ChartColor('FF0000'));
        legend.setBorderLines({ color: '#00FF00', width: 1.5, style: 'dash' });
        chart.setLegendObject(legend);

        const series = new DataSeries('bar');
        series.setPlotCategories([new DataSeriesValues('String', 'LegendStyles!$A$2:$A$3')]);
        series.addPlotValues(new DataSeriesValues('Number', 'LegendStyles!$B$2:$B$3'));
        chart.addDataSeries(series);
        worksheet.addChart(chart);

        const writer = new XlsxWriter(spreadsheet);
        writer.setIncludeCharts(true);
        const buffer = await writer.writeBuffer();
        const chartXml = await getFirstChartXml(buffer);

        expect(chartXml).toContain('<c:legend>');
        expect(chartXml).toContain('<c:spPr>');
        expect(chartXml).toContain('<a:solidFill>');
        expect(chartXml).toContain('val="FF0000"');
        expect(chartXml).toContain('val="00FF00"');
        expect(chartXml).toContain('<a:prstDash val="dash"');
    });

    test('legend styling round-trip', async () => {
        const spreadsheet = new Spreadsheet();
        const worksheet = spreadsheet.getActiveSheet();
        worksheet.setTitle('LegendRoundTrip');

        worksheet.getCell('A1').setValue('Category');
        worksheet.getCell('A2').setValue('One');
        worksheet.getCell('A3').setValue('Two');
        worksheet.getCell('B1').setValue('Series');
        worksheet.getCell('B2').setValue(10);
        worksheet.getCell('B3').setValue(20);

        const chart = new Chart();
        chart.setName('Legend RoundTrip');
        chart.setTopLeftPosition({ cell: 'D2' });

        const legend = new Legend();
        legend.setFillColor(new ChartColor('FF0000'));
        legend.setBorderLines({ color: '#00FF00', width: 1.5, style: 'dash' });
        const legendFont = new Font();
        legendFont.setName('Calibri');
        legendFont.setSize(11);
        legendFont.setBold(true);
        legend.setTextFont(legendFont);
        chart.setLegendObject(legend);

        const series = new DataSeries('bar');
        series.setPlotCategories([new DataSeriesValues('String', 'LegendRoundTrip!$A$2:$A$3')]);
        series.addPlotValues(new DataSeriesValues('Number', 'LegendRoundTrip!$B$2:$B$3'));
        chart.addDataSeries(series);
        worksheet.addChart(chart);

        const writer = new XlsxWriter(spreadsheet);
        writer.setIncludeCharts(true);
        const buffer = await writer.writeBuffer();

        const reader = new XlsxReader();
        reader.setIncludeCharts(true);
        const readSpreadsheet = await reader.loadFromBuffer(buffer);
        const readWorksheet = readSpreadsheet.getSheetByName('LegendRoundTrip');

        expect(readWorksheet!.getChartCollection()).toHaveLength(1);
        const readChart = readWorksheet!.getChartCollection()[0]!;
        const readLegend = readChart.getLegend();
        expect(readLegend).toBeDefined();
        expect(readLegend?.getFillColor()?.getValue()).toBe('FF0000');
        const borderLines = readLegend?.getBorderLines();
        expect(borderLines?.color).toBe('00FF00');
        expect(borderLines?.width).toBeCloseTo(1.5);
        expect(borderLines?.style).toBe('dash');
        expect(readLegend?.getTextFont()?.getName()).toBe('Calibri');
        expect(readLegend?.getTextFont()?.getSize()).toBe(11);
        expect(readLegend?.getTextFont()?.getBold()).toBe(true);
    });
});
