import { describe, expect, test } from 'bun:test';
import unzipper from 'unzipper';
import { Spreadsheet } from '../src/core/spreadsheet.ts';
import { XlsxReader } from '../src/io/xlsx-reader.ts';
import { XlsxWriter } from '../src/io/xlsx-writer.ts';
import { Color } from '../src/style/color.ts';
import { Font } from '../src/style/font.ts';
import { Chart } from '../src/worksheet/chart/chart.ts';
import { DataLabels } from '../src/worksheet/chart/data-labels.ts';
import { DataSeriesValues } from '../src/worksheet/chart/data-series-values.ts';
import { DataSeries } from '../src/worksheet/chart/data-series.ts';

const getFirstChartXml = async (buffer: Uint8Array | ArrayBuffer): Promise<string> => {
    const zipBuffer = buffer instanceof ArrayBuffer ? Buffer.from(new Uint8Array(buffer)) : Buffer.from(buffer);
    const zip = await unzipper.Open.buffer(zipBuffer);
    const chartFile = zip.files.find((file) => file.path.startsWith('xl/charts/chart') && file.path.endsWith('.xml'));
    expect(chartFile).toBeDefined();
    return (await chartFile!.buffer()).toString('utf-8');
};

describe('Chart Data Labels', () => {
    describe('DataLabels object creation', () => {
        test('should create DataLabels with showValue option', () => {
            const dataLabels = new DataLabels({ showValue: true });
            expect(dataLabels.getShowValue()).toBe(true);
            expect(dataLabels.hasAnyLabel()).toBe(true);
        });

        test('should create DataLabels with showCategoryName option', () => {
            const dataLabels = new DataLabels({ showCategoryName: true });
            expect(dataLabels.getShowCategoryName()).toBe(true);
            expect(dataLabels.hasAnyLabel()).toBe(true);
        });

        test('should create DataLabels with multiple options', () => {
            const dataLabels = new DataLabels({
                showValue: true,
                showCategoryName: true,
                showSeriesName: true,
                showPercent: true,
                showLegendKey: true,
            });
            expect(dataLabels.getShowValue()).toBe(true);
            expect(dataLabels.getShowCategoryName()).toBe(true);
            expect(dataLabels.getShowSeriesName()).toBe(true);
            expect(dataLabels.getShowPercent()).toBe(true);
            expect(dataLabels.getShowLegendKey()).toBe(true);
        });

        test('should return null for unset properties', () => {
            const dataLabels = new DataLabels();
            expect(dataLabels.getShowValue()).toBeNull();
            expect(dataLabels.getShowCategoryName()).toBeNull();
            expect(dataLabels.getShowSeriesName()).toBeNull();
            expect(dataLabels.hasAnyLabel()).toBe(false);
        });

        test('should set properties via setters', () => {
            const dataLabels = new DataLabels();
            dataLabels.setShowValue(true);
            dataLabels.setShowCategoryName(true);
            dataLabels.setShowSeriesName(true);
            dataLabels.setShowPercent(true);
            dataLabels.setShowLegendKey(true);
            dataLabels.setPosition('outEnd');

            expect(dataLabels.getShowValue()).toBe(true);
            expect(dataLabels.getShowCategoryName()).toBe(true);
            expect(dataLabels.getShowSeriesName()).toBe(true);
            expect(dataLabels.getShowPercent()).toBe(true);
            expect(dataLabels.getShowLegendKey()).toBe(true);
            expect(dataLabels.getPosition()).toBe('outEnd');
        });

        test('should support all positions', () => {
            const positions: Array<'outEnd' | 'inEnd' | 'ctr' | 'inBase' | 'outBase' | 'bestFit' | 't'> = [
                'outEnd',
                'inEnd',
                'ctr',
                'inBase',
                'outBase',
                'bestFit',
                't',
            ];

            for (const position of positions) {
                const dataLabels = new DataLabels();
                dataLabels.setPosition(position);
                expect(dataLabels.getPosition()).toBe(position);
            }
        });
    });

    describe('DataLabels XML output', () => {
        test('should write c:dLbls with showVal to chart XML', async () => {
            const spreadsheet = new Spreadsheet();
            const worksheet = spreadsheet.createSheet('DataLabelsTest');

            worksheet.getCell('A1').setValue('Category');
            worksheet.getCell('A2').setValue('A');
            worksheet.getCell('A3').setValue('B');
            worksheet.getCell('B1').setValue('Value');
            worksheet.getCell('B2').setValue(100);
            worksheet.getCell('B3').setValue(200);

            const chart = new Chart();
            const series = new DataSeries('bar');
            series.addPlotCategory(new DataSeriesValues('String', 'DataLabelsTest!$A$2:$A$3'));
            series.addPlotValues(new DataSeriesValues('Number', 'DataLabelsTest!$B$2:$B$3'));

            const dataLabels = new DataLabels({ showValue: true });
            series.setDataLabels(dataLabels);

            chart.addDataSeries(series);
            chart.setTopLeftPosition({ cell: 'D5' });
            worksheet.addChart(chart);

            const writer = new XlsxWriter(spreadsheet);
            writer.setIncludeCharts(true);
            const buffer = await writer.writeBuffer();

            const chartXml = await getFirstChartXml(buffer);
            expect(chartXml).toContain('<c:dLbls>');
            expect(chartXml).toContain('<c:showVal val="1"');
        });

        test('should write c:dLbls with showCatName to chart XML', async () => {
            const spreadsheet = new Spreadsheet();
            const worksheet = spreadsheet.createSheet('DataLabelsCatName');

            worksheet.getCell('A1').setValue('Category');
            worksheet.getCell('A2').setValue('A');
            worksheet.getCell('A3').setValue('B');
            worksheet.getCell('B1').setValue('Value');
            worksheet.getCell('B2').setValue(100);
            worksheet.getCell('B3').setValue(200);

            const chart = new Chart();
            const series = new DataSeries('bar');
            series.addPlotCategory(new DataSeriesValues('String', 'DataLabelsCatName!$A$2:$A$3'));
            series.addPlotValues(new DataSeriesValues('Number', 'DataLabelsCatName!$B$2:$B$3'));

            const dataLabels = new DataLabels({ showCategoryName: true });
            series.setDataLabels(dataLabels);

            chart.addDataSeries(series);
            chart.setTopLeftPosition({ cell: 'D5' });
            worksheet.addChart(chart);

            const writer = new XlsxWriter(spreadsheet);
            writer.setIncludeCharts(true);
            const buffer = await writer.writeBuffer();

            const chartXml = await getFirstChartXml(buffer);
            expect(chartXml).toContain('<c:dLbls>');
            expect(chartXml).toContain('<c:showCatName val="1"');
        });

        test('should write c:dLbls with multiple flags to chart XML', async () => {
            const spreadsheet = new Spreadsheet();
            const worksheet = spreadsheet.createSheet('DataLabelsMulti');

            worksheet.getCell('A1').setValue('Category');
            worksheet.getCell('A2').setValue('A');
            worksheet.getCell('A3').setValue('B');
            worksheet.getCell('B1').setValue('Value');
            worksheet.getCell('B2').setValue(100);
            worksheet.getCell('B3').setValue(200);

            const chart = new Chart();
            const series = new DataSeries('bar');
            series.addPlotCategory(new DataSeriesValues('String', 'DataLabelsMulti!$A$2:$A$3'));
            series.addPlotValues(new DataSeriesValues('Number', 'DataLabelsMulti!$B$2:$B$3'));

            const dataLabels = new DataLabels({
                showValue: true,
                showCategoryName: true,
                showSeriesName: true,
                showPercent: true,
            });
            series.setDataLabels(dataLabels);

            chart.addDataSeries(series);
            chart.setTopLeftPosition({ cell: 'D5' });
            worksheet.addChart(chart);

            const writer = new XlsxWriter(spreadsheet);
            writer.setIncludeCharts(true);
            const buffer = await writer.writeBuffer();

            const chartXml = await getFirstChartXml(buffer);
            expect(chartXml).toContain('<c:dLbls>');
            expect(chartXml).toContain('<c:showVal val="1"');
            expect(chartXml).toContain('<c:showCatName val="1"');
            expect(chartXml).toContain('<c:showSerName val="1"');
            expect(chartXml).toContain('<c:showPercent val="1"');
        });

        test('should write c:dLblPos to chart XML when position is set', async () => {
            const spreadsheet = new Spreadsheet();
            const worksheet = spreadsheet.createSheet('DataLabelsPos');

            worksheet.getCell('A1').setValue('Category');
            worksheet.getCell('A2').setValue('A');
            worksheet.getCell('A3').setValue('B');
            worksheet.getCell('B1').setValue('Value');
            worksheet.getCell('B2').setValue(100);
            worksheet.getCell('B3').setValue(200);

            const chart = new Chart();
            const series = new DataSeries('pie');
            series.addPlotCategory(new DataSeriesValues('String', 'DataLabelsPos!$A$2:$A$3'));
            series.addPlotValues(new DataSeriesValues('Number', 'DataLabelsPos!$B$2:$B$3'));

            const dataLabels = new DataLabels({
                showValue: true,
                position: 'outEnd',
            });
            series.setDataLabels(dataLabels);

            chart.addDataSeries(series);
            chart.setTopLeftPosition({ cell: 'D5' });
            worksheet.addChart(chart);

            const writer = new XlsxWriter(spreadsheet);
            writer.setIncludeCharts(true);
            const buffer = await writer.writeBuffer();

            const chartXml = await getFirstChartXml(buffer);
            expect(chartXml).toContain('<c:dLbls>');
            expect(chartXml).toContain('<c:dLblPos val="outEnd"');
        });

        test('should not write c:dLbls when no labels are enabled', async () => {
            const spreadsheet = new Spreadsheet();
            const worksheet = spreadsheet.createSheet('NoDataLabels');

            worksheet.getCell('A1').setValue('Category');
            worksheet.getCell('A2').setValue('A');
            worksheet.getCell('A3').setValue('B');
            worksheet.getCell('B1').setValue('Value');
            worksheet.getCell('B2').setValue(100);
            worksheet.getCell('B3').setValue(200);

            const chart = new Chart();
            const series = new DataSeries('bar');
            series.addPlotCategory(new DataSeriesValues('String', 'NoDataLabels!$A$2:$A$3'));
            series.addPlotValues(new DataSeriesValues('Number', 'NoDataLabels!$B$2:$B$3'));

            // DataLabels with no enabled flags
            const dataLabels = new DataLabels();
            expect(dataLabels.hasAnyLabel()).toBe(false);
            series.setDataLabels(dataLabels);

            chart.addDataSeries(series);
            chart.setTopLeftPosition({ cell: 'D5' });
            worksheet.addChart(chart);

            const writer = new XlsxWriter(spreadsheet);
            writer.setIncludeCharts(true);
            const buffer = await writer.writeBuffer();

            const chartXml = await getFirstChartXml(buffer);
            expect(chartXml).not.toContain('<c:dLbls>');
        });
    });

    describe('DataLabels round-trip', () => {
        test('should round-trip showValue flag through write and read', async () => {
            const spreadsheet = new Spreadsheet();
            const worksheet = spreadsheet.createSheet('RoundTripVal');

            worksheet.getCell('A1').setValue('Category');
            worksheet.getCell('A2').setValue('A');
            worksheet.getCell('A3').setValue('B');
            worksheet.getCell('B1').setValue('Value');
            worksheet.getCell('B2').setValue(100);
            worksheet.getCell('B3').setValue(200);

            const chart = new Chart();
            const series = new DataSeries('bar');
            series.addPlotCategory(new DataSeriesValues('String', 'RoundTripVal!$A$2:$A$3'));
            series.addPlotValues(new DataSeriesValues('Number', 'RoundTripVal!$B$2:$B$3'));

            const dataLabels = new DataLabels({ showValue: true });
            series.setDataLabels(dataLabels);

            chart.addDataSeries(series);
            chart.setTopLeftPosition({ cell: 'D5' });
            worksheet.addChart(chart);

            // Write
            const writer = new XlsxWriter(spreadsheet);
            writer.setIncludeCharts(true);
            const buffer = await writer.writeBuffer();

            // Read back
            const reader = new XlsxReader();
            reader.setIncludeCharts(true);
            const readSpreadsheet = await reader.loadFromBuffer(buffer);
            const readWorksheet = readSpreadsheet.getSheetByName('RoundTripVal');

            expect(readWorksheet!.getChartCollection()).toHaveLength(1);

            const readChart = readWorksheet!.getChartCollection()[0]!;
            expect(readChart.getPlotArea()).toHaveLength(1);

            const readSeries = readChart.getPlotArea()[0]!;
            const readDataLabels = readSeries.getDataLabels();

            expect(readDataLabels).not.toBeNull();
            expect(readDataLabels!.getShowValue()).toBe(true);
        });

        test('should round-trip showCatName flag through write and read', async () => {
            const spreadsheet = new Spreadsheet();
            const worksheet = spreadsheet.createSheet('RoundTripCat');

            worksheet.getCell('A1').setValue('Category');
            worksheet.getCell('A2').setValue('A');
            worksheet.getCell('A3').setValue('B');
            worksheet.getCell('B1').setValue('Value');
            worksheet.getCell('B2').setValue(100);
            worksheet.getCell('B3').setValue(200);

            const chart = new Chart();
            const series = new DataSeries('bar');
            series.addPlotCategory(new DataSeriesValues('String', 'RoundTripCat!$A$2:$A$3'));
            series.addPlotValues(new DataSeriesValues('Number', 'RoundTripCat!$B$2:$B$3'));

            const dataLabels = new DataLabels({ showCategoryName: true });
            series.setDataLabels(dataLabels);

            chart.addDataSeries(series);
            chart.setTopLeftPosition({ cell: 'D5' });
            worksheet.addChart(chart);

            // Write
            const writer = new XlsxWriter(spreadsheet);
            writer.setIncludeCharts(true);
            const buffer = await writer.writeBuffer();

            // Read back
            const reader = new XlsxReader();
            reader.setIncludeCharts(true);
            const readSpreadsheet = await reader.loadFromBuffer(buffer);
            const readWorksheet = readSpreadsheet.getSheetByName('RoundTripCat');

            const readChart = readWorksheet!.getChartCollection()[0]!;
            const readSeries = readChart.getPlotArea()[0]!;
            const readDataLabels = readSeries.getDataLabels();

            expect(readDataLabels).not.toBeNull();
            expect(readDataLabels!.getShowCategoryName()).toBe(true);
        });

        test('should round-trip multiple data label flags through write and read', async () => {
            const spreadsheet = new Spreadsheet();
            const worksheet = spreadsheet.createSheet('RoundTripMulti');

            worksheet.getCell('A1').setValue('Category');
            worksheet.getCell('A2').setValue('A');
            worksheet.getCell('A3').setValue('B');
            worksheet.getCell('B1').setValue('Value');
            worksheet.getCell('B2').setValue(100);
            worksheet.getCell('B3').setValue(200);

            const chart = new Chart();
            const series = new DataSeries('bar');
            series.addPlotCategory(new DataSeriesValues('String', 'RoundTripMulti!$A$2:$A$3'));
            series.addPlotValues(new DataSeriesValues('Number', 'RoundTripMulti!$B$2:$B$3'));

            const dataLabels = new DataLabels({
                showValue: true,
                showCategoryName: true,
                showSeriesName: true,
            });
            series.setDataLabels(dataLabels);

            chart.addDataSeries(series);
            chart.setTopLeftPosition({ cell: 'D5' });
            worksheet.addChart(chart);

            // Write
            const writer = new XlsxWriter(spreadsheet);
            writer.setIncludeCharts(true);
            const buffer = await writer.writeBuffer();

            // Read back
            const reader = new XlsxReader();
            reader.setIncludeCharts(true);
            const readSpreadsheet = await reader.loadFromBuffer(buffer);
            const readWorksheet = readSpreadsheet.getSheetByName('RoundTripMulti');

            const readChart = readWorksheet!.getChartCollection()[0]!;
            const readSeries = readChart.getPlotArea()[0]!;
            const readDataLabels = readSeries.getDataLabels();

            expect(readDataLabels).not.toBeNull();
            expect(readDataLabels!.getShowValue()).toBe(true);
            expect(readDataLabels!.getShowCategoryName()).toBe(true);
            expect(readDataLabels!.getShowSeriesName()).toBe(true);
        });

        test('should round-trip data label position through write and read', async () => {
            const spreadsheet = new Spreadsheet();
            const worksheet = spreadsheet.createSheet('RoundTripPos');

            worksheet.getCell('A1').setValue('Category');
            worksheet.getCell('A2').setValue('A');
            worksheet.getCell('A3').setValue('B');
            worksheet.getCell('B1').setValue('Value');
            worksheet.getCell('B2').setValue(100);
            worksheet.getCell('B3').setValue(200);

            const chart = new Chart();
            const series = new DataSeries('pie');
            series.addPlotCategory(new DataSeriesValues('String', 'RoundTripPos!$A$2:$A$3'));
            series.addPlotValues(new DataSeriesValues('Number', 'RoundTripPos!$B$2:$B$3'));

            const dataLabels = new DataLabels({
                showValue: true,
                position: 'outEnd',
            });
            series.setDataLabels(dataLabels);

            chart.addDataSeries(series);
            chart.setTopLeftPosition({ cell: 'D5' });
            worksheet.addChart(chart);

            // Write
            const writer = new XlsxWriter(spreadsheet);
            writer.setIncludeCharts(true);
            const buffer = await writer.writeBuffer();

            // Read back
            const reader = new XlsxReader();
            reader.setIncludeCharts(true);
            const readSpreadsheet = await reader.loadFromBuffer(buffer);
            const readWorksheet = readSpreadsheet.getSheetByName('RoundTripPos');

            const readChart = readWorksheet!.getChartCollection()[0]!;
            const readSeries = readChart.getPlotArea()[0]!;
            const readDataLabels = readSeries.getDataLabels();

            expect(readDataLabels).not.toBeNull();
            expect(readDataLabels!.getPosition()).toBe('outEnd');
        });

        test('should preserve data labels on multiple series in round-trip', async () => {
            const spreadsheet = new Spreadsheet();
            const worksheet = spreadsheet.createSheet('MultiSeriesLabels');

            worksheet.getCell('A1').setValue('Month');
            worksheet.getCell('A2').setValue('Jan');
            worksheet.getCell('A3').setValue('Feb');

            worksheet.getCell('B1').setValue('Series1');
            worksheet.getCell('B2').setValue(100);
            worksheet.getCell('B3').setValue(150);

            worksheet.getCell('C1').setValue('Series2');
            worksheet.getCell('C2').setValue(80);
            worksheet.getCell('C3').setValue(120);

            const chart = new Chart();

            // Series 1 with showValue
            const series1 = new DataSeries('bar');
            series1.addPlotCategory(new DataSeriesValues('String', 'MultiSeriesLabels!$A$2:$A$3'));
            series1.addPlotValues(new DataSeriesValues('Number', 'MultiSeriesLabels!$B$2:$B$3'));
            series1.setDataLabels(new DataLabels({ showValue: true }));
            chart.addDataSeries(series1);

            // Series 2 with showCategoryName
            const series2 = new DataSeries('bar');
            series2.addPlotCategory(new DataSeriesValues('String', 'MultiSeriesLabels!$A$2:$A$3'));
            series2.addPlotValues(new DataSeriesValues('Number', 'MultiSeriesLabels!$C$2:$C$3'));
            series2.setDataLabels(new DataLabels({ showCategoryName: true }));
            chart.addDataSeries(series2);

            chart.setTopLeftPosition({ cell: 'E2' });
            worksheet.addChart(chart);

            // Write
            const writer = new XlsxWriter(spreadsheet);
            writer.setIncludeCharts(true);
            const buffer = await writer.writeBuffer();

            // Read back
            const reader = new XlsxReader();
            reader.setIncludeCharts(true);
            const readSpreadsheet = await reader.loadFromBuffer(buffer);
            const readWorksheet = readSpreadsheet.getSheetByName('MultiSeriesLabels');

            const readChart = readWorksheet!.getChartCollection()[0]!;
            expect(readChart.getPlotArea()).toHaveLength(2);

            // With chart-level data labels, all series receive the same labels
            // The writer writes data labels at chart level, so both series have them
            for (const series of readChart.getPlotArea()) {
                expect(series.getDataLabels()).not.toBeNull();
                expect(series.getDataLabels()!.hasAnyLabel()).toBe(true);
            }
        });
    });

    describe('DataLabels styling', () => {
        test('should write styled data labels with font to chart XML', async () => {
            const spreadsheet = new Spreadsheet();
            const worksheet = spreadsheet.createSheet('StyledLabels');

            worksheet.getCell('A1').setValue('Category');
            worksheet.getCell('A2').setValue('A');
            worksheet.getCell('A3').setValue('B');
            worksheet.getCell('B1').setValue('Value');
            worksheet.getCell('B2').setValue(100);
            worksheet.getCell('B3').setValue(200);

            const chart = new Chart();
            const series = new DataSeries('bar');
            series.addPlotCategory(new DataSeriesValues('String', 'StyledLabels!$A$2:$A$3'));
            series.addPlotValues(new DataSeriesValues('Number', 'StyledLabels!$B$2:$B$3'));

            const dataLabels = new DataLabels({ showValue: true });
            const font = new Font();
            font.setName('Arial');
            font.setSize(12);
            font.setBold(true);
            font.getColor().setARGB('FF0000FF');
            dataLabels.setFont(font);
            series.setDataLabels(dataLabels);

            chart.addDataSeries(series);
            chart.setTopLeftPosition({ cell: 'D5' });
            worksheet.addChart(chart);

            const writer = new XlsxWriter(spreadsheet);
            writer.setIncludeCharts(true);
            const buffer = await writer.writeBuffer();

            const chartXml = await getFirstChartXml(buffer);
            expect(chartXml).toContain('<c:txPr>');
            expect(chartXml).toContain('<a:rFont');
            expect(chartXml).toContain('<a:b');
            expect(chartXml).toContain('<a:solidFill>');
        });

        test('should write styled data labels with number format to chart XML', async () => {
            const spreadsheet = new Spreadsheet();
            const worksheet = spreadsheet.createSheet('NumFmtLabels');

            worksheet.getCell('A1').setValue('Category');
            worksheet.getCell('A2').setValue('A');
            worksheet.getCell('A3').setValue('B');
            worksheet.getCell('B1').setValue('Value');
            worksheet.getCell('B2').setValue(100);
            worksheet.getCell('B3').setValue(200);

            const chart = new Chart();
            const series = new DataSeries('bar');
            series.addPlotCategory(new DataSeriesValues('String', 'NumFmtLabels!$A$2:$A$3'));
            series.addPlotValues(new DataSeriesValues('Number', 'NumFmtLabels!$B$2:$B$3'));

            const dataLabels = new DataLabels({ showValue: true });
            dataLabels.setNumberFormat('0.00%');
            dataLabels.setNumberFormatLinked(false);
            series.setDataLabels(dataLabels);

            chart.addDataSeries(series);
            chart.setTopLeftPosition({ cell: 'D5' });
            worksheet.addChart(chart);

            const writer = new XlsxWriter(spreadsheet);
            writer.setIncludeCharts(true);
            const buffer = await writer.writeBuffer();

            const chartXml = await getFirstChartXml(buffer);
            expect(chartXml).toContain('<c:numFmt');
            expect(chartXml).toContain('formatCode="0.00%"');
        });

        test('should write styled data labels with fill and border colors to chart XML', async () => {
            const spreadsheet = new Spreadsheet();
            const worksheet = spreadsheet.createSheet('ColorLabels');

            worksheet.getCell('A1').setValue('Category');
            worksheet.getCell('A2').setValue('A');
            worksheet.getCell('A3').setValue('B');
            worksheet.getCell('B1').setValue('Value');
            worksheet.getCell('B2').setValue(100);
            worksheet.getCell('B3').setValue(200);

            const chart = new Chart();
            const series = new DataSeries('bar');
            series.addPlotCategory(new DataSeriesValues('String', 'ColorLabels!$A$2:$A$3'));
            series.addPlotValues(new DataSeriesValues('Number', 'ColorLabels!$B$2:$B$3'));

            const dataLabels = new DataLabels({ showValue: true });
            const fillColor = new Color();
            fillColor.setARGB('FFFFFF00');
            dataLabels.setFillColor(fillColor);
            const borderColor = new Color();
            borderColor.setARGB('FF000000');
            dataLabels.setBorderColor(borderColor);
            series.setDataLabels(dataLabels);

            chart.addDataSeries(series);
            chart.setTopLeftPosition({ cell: 'D5' });
            worksheet.addChart(chart);

            const writer = new XlsxWriter(spreadsheet);
            writer.setIncludeCharts(true);
            const buffer = await writer.writeBuffer();

            const chartXml = await getFirstChartXml(buffer);
            expect(chartXml).toContain('<c:spPr>');
            expect(chartXml).toContain('<a:solidFill>');
            expect(chartXml).toContain('<a:ln>');
        });

        test('should round-trip data label font styling through write and read', async () => {
            const spreadsheet = new Spreadsheet();
            const worksheet = spreadsheet.createSheet('RoundTripFontLabels');

            worksheet.getCell('A1').setValue('Category');
            worksheet.getCell('A2').setValue('A');
            worksheet.getCell('A3').setValue('B');
            worksheet.getCell('B1').setValue('Value');
            worksheet.getCell('B2').setValue(100);
            worksheet.getCell('B3').setValue(200);

            const chart = new Chart();
            const series = new DataSeries('bar');
            series.addPlotCategory(new DataSeriesValues('String', 'RoundTripFontLabels!$A$2:$A$3'));
            series.addPlotValues(new DataSeriesValues('Number', 'RoundTripFontLabels!$B$2:$B$3'));

            const dataLabels = new DataLabels({ showValue: true });
            const font = new Font();
            font.setName('Arial');
            font.setSize(12);
            font.setBold(true);
            font.setItalic(true);
            font.getColor().setARGB('FF0000FF');
            dataLabels.setFont(font);
            series.setDataLabels(dataLabels);

            chart.addDataSeries(series);
            chart.setTopLeftPosition({ cell: 'D5' });
            worksheet.addChart(chart);

            // Write
            const writer = new XlsxWriter(spreadsheet);
            writer.setIncludeCharts(true);
            const buffer = await writer.writeBuffer();

            // Read back
            const reader = new XlsxReader();
            reader.setIncludeCharts(true);
            const readSpreadsheet = await reader.loadFromBuffer(buffer);
            const readWorksheet = readSpreadsheet.getSheetByName('RoundTripFontLabels');

            const readChart = readWorksheet!.getChartCollection()[0]!;
            const readSeries = readChart.getPlotArea()[0]!;
            const readDataLabels = readSeries.getDataLabels();

            expect(readDataLabels).not.toBeNull();
            const readFont = readDataLabels!.getFont();
            expect(readFont).not.toBeNull();
            expect(readFont!.getName()).toBe('Arial');
            expect(readFont!.getSize()).toBe(12);
            expect(readFont!.getBold()).toBe(true);
            expect(readFont!.getItalic()).toBe(true);
        });

        test('should round-trip data label number format through write and read', async () => {
            const spreadsheet = new Spreadsheet();
            const worksheet = spreadsheet.createSheet('RoundTripNumFmt');

            worksheet.getCell('A1').setValue('Category');
            worksheet.getCell('A2').setValue('A');
            worksheet.getCell('A3').setValue('B');
            worksheet.getCell('B1').setValue('Value');
            worksheet.getCell('B2').setValue(100);
            worksheet.getCell('B3').setValue(200);

            const chart = new Chart();
            const series = new DataSeries('bar');
            series.addPlotCategory(new DataSeriesValues('String', 'RoundTripNumFmt!$A$2:$A$3'));
            series.addPlotValues(new DataSeriesValues('Number', 'RoundTripNumFmt!$B$2:$B$3'));

            const dataLabels = new DataLabels({ showValue: true });
            dataLabels.setNumberFormat('0.00%');
            dataLabels.setNumberFormatLinked(false);
            series.setDataLabels(dataLabels);

            chart.addDataSeries(series);
            chart.setTopLeftPosition({ cell: 'D5' });
            worksheet.addChart(chart);

            // Write
            const writer = new XlsxWriter(spreadsheet);
            writer.setIncludeCharts(true);
            const buffer = await writer.writeBuffer();

            // Read back
            const reader = new XlsxReader();
            reader.setIncludeCharts(true);
            const readSpreadsheet = await reader.loadFromBuffer(buffer);
            const readWorksheet = readSpreadsheet.getSheetByName('RoundTripNumFmt');

            const readChart = readWorksheet!.getChartCollection()[0]!;
            const readSeries = readChart.getPlotArea()[0]!;
            const readDataLabels = readSeries.getDataLabels();

            expect(readDataLabels).not.toBeNull();
            expect(readDataLabels!.getNumberFormat()).toBe('0.00%');
            expect(readDataLabels!.getNumberFormatLinked()).toBe(false);
        });

        test('should round-trip data label fill and border colors through write and read', async () => {
            const spreadsheet = new Spreadsheet();
            const worksheet = spreadsheet.createSheet('RoundTripColors');

            worksheet.getCell('A1').setValue('Category');
            worksheet.getCell('A2').setValue('A');
            worksheet.getCell('A3').setValue('B');
            worksheet.getCell('B1').setValue('Value');
            worksheet.getCell('B2').setValue(100);
            worksheet.getCell('B3').setValue(200);

            const chart = new Chart();
            const series = new DataSeries('bar');
            series.addPlotCategory(new DataSeriesValues('String', 'RoundTripColors!$A$2:$A$3'));
            series.addPlotValues(new DataSeriesValues('Number', 'RoundTripColors!$B$2:$B$3'));

            const dataLabels = new DataLabels({ showValue: true });
            const fillColor = new Color();
            fillColor.setARGB('FFFFFF00');
            dataLabels.setFillColor(fillColor);
            const borderColor = new Color();
            borderColor.setARGB('FF000000');
            dataLabels.setBorderColor(borderColor);
            series.setDataLabels(dataLabels);

            chart.addDataSeries(series);
            chart.setTopLeftPosition({ cell: 'D5' });
            worksheet.addChart(chart);

            // Write
            const writer = new XlsxWriter(spreadsheet);
            writer.setIncludeCharts(true);
            const buffer = await writer.writeBuffer();

            // Read back
            const reader = new XlsxReader();
            reader.setIncludeCharts(true);
            const readSpreadsheet = await reader.loadFromBuffer(buffer);
            const readWorksheet = readSpreadsheet.getSheetByName('RoundTripColors');

            const readChart = readWorksheet!.getChartCollection()[0]!;
            const readSeries = readChart.getPlotArea()[0]!;
            const readDataLabels = readSeries.getDataLabels();

            expect(readDataLabels).not.toBeNull();
            const readFillColor = readDataLabels!.getFillColor();
            expect(readFillColor).not.toBeNull();
            expect(readFillColor!.getARGB()).toBe('FFFFFF00');
            const readBorderColor = readDataLabels!.getBorderColor();
            expect(readBorderColor).not.toBeNull();
            expect(readBorderColor!.getARGB()).toBe('FF000000');
        });
    });
});
