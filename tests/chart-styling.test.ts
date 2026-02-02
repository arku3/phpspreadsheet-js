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

describe('Chart Styling', () => {
    describe('DataSeries styling methods', () => {
        test('should set and get series fill color', () => {
            const series = new DataSeries('bar');
            series.setFillColor('FF0000');
            expect(series.getFillColor()).toBe('FF0000');
        });

        test('should set and get series border color', () => {
            const series = new DataSeries('bar');
            series.setBorderColor('000000');
            expect(series.getBorderColor()).toBe('000000');
        });

        test('should set and get line width', () => {
            const series = new DataSeries('line');
            series.setLineWidth(25400); // 2pt in EMUs
            expect(series.getLineWidth()).toBe(25400);
        });

        test('should default line width to 12700 EMUs (1pt)', () => {
            const series = new DataSeries('line');
            expect(series.getLineWidth()).toBe(12700);
        });

        test('should return null for unset fill color', () => {
            const series = new DataSeries('bar');
            expect(series.getFillColor()).toBeNull();
        });

        test('should return null for unset border color', () => {
            const series = new DataSeries('bar');
            expect(series.getBorderColor()).toBeNull();
        });

        test('should allow overriding fill color', () => {
            const series = new DataSeries('bar');
            series.setFillColor('FF0000');
            expect(series.getFillColor()).toBe('FF0000');
            series.setFillColor('00FF00');
            expect(series.getFillColor()).toBe('00FF00');
        });

        test('should allow overriding border color', () => {
            const series = new DataSeries('bar');
            series.setBorderColor('000000');
            expect(series.getBorderColor()).toBe('000000');
            series.setBorderColor('333333');
            expect(series.getBorderColor()).toBe('333333');
        });
    });

    describe('Chart legend methods', () => {
        test('should set and get legend position', () => {
            const chart = new Chart();
            chart.setLegendPosition('bottom');
            expect(chart.getLegendPosition()).toBe('bottom');
        });

        test('should set and get legend title', () => {
            const chart = new Chart();
            chart.setLegendTitle('My Legend');
            expect(chart.getLegendTitle()).toBe('My Legend');
        });

        test('should set and get legend overlay', () => {
            const chart = new Chart();
            expect(chart.getLegendOverlay()).toBe(false);
            chart.setLegendOverlay(true);
            expect(chart.getLegendOverlay()).toBe(true);
        });

        test('should default legend position to right', () => {
            const chart = new Chart();
            expect(chart.getLegendPosition()).toBe('right');
        });

        test('should default legend title to null', () => {
            const chart = new Chart();
            expect(chart.getLegendTitle()).toBeNull();
        });

        test('should configure legend with setLegend method', () => {
            const chart = new Chart();
            chart.setLegend({
                position: 'top',
                title: 'Legend Title',
                overlay: true,
            });
            expect(chart.getLegendPosition()).toBe('top');
            expect(chart.getLegendTitle()).toBe('Legend Title');
            expect(chart.getLegendOverlay()).toBe(true);
        });

        test('should support all legend positions', () => {
            const chart = new Chart();
            const positions: Array<'top' | 'bottom' | 'left' | 'right' | 'none'> = [
                'top',
                'bottom',
                'left',
                'right',
                'none',
            ];

            for (const position of positions) {
                chart.setLegendPosition(position);
                expect(chart.getLegendPosition()).toBe(position);
            }
        });
    });

    describe('XLSX output', () => {
        test('should write series fill color to XLSX', async () => {
            const spreadsheet = new Spreadsheet();
            const worksheet = spreadsheet.createSheet('Data');

            // Add data
            worksheet.getCell('A1').setValue('Category');
            worksheet.getCell('A2').setValue('A');
            worksheet.getCell('A3').setValue('B');
            worksheet.getCell('B1').setValue('Value');
            worksheet.getCell('B2').setValue(100);
            worksheet.getCell('B3').setValue(200);

            // Create styled chart
            const chart = new Chart();
            const series = new DataSeries('bar');
            series.setFillColor('00FF00'); // Green
            series.setBorderColor('000000'); // Black border
            series.setPlotCategory(new DataSeriesValues('String', 'Data!$A$2:$A$3'));
            series.addPlotValues(new DataSeriesValues('Number', 'Data!$B$2:$B$3'));
            chart.addDataSeries(series);
            chart.setTopLeftPosition({ cell: 'D5' });
            worksheet.addChart(chart);

            // Write and verify
            const writer = new XlsxWriter(spreadsheet);
            writer.setIncludeCharts(true);
            const buffer = await writer.writeBuffer();

            const chartXml = await getFirstChartXml(buffer);
            expect(chartXml).toContain('<a:srgbClr val="00FF00"');
            expect(chartXml).toContain('<a:srgbClr val="000000"');
        });

        test('should write legend to XLSX', async () => {
            const spreadsheet = new Spreadsheet();
            const worksheet = spreadsheet.createSheet('Data');

            // Add data
            worksheet.getCell('A1').setValue('X');
            worksheet.getCell('A2').setValue(1);
            worksheet.getCell('B1').setValue('Y');
            worksheet.getCell('B2').setValue(100);

            const chart = new Chart();
            chart.setLegendPosition('bottom');
            const series = new DataSeries('bar');
            series.setPlotCategory(new DataSeriesValues('String', 'Data!$A$2:$A$2'));
            series.addPlotValues(new DataSeriesValues('Number', 'Data!$B$2:$B$2'));
            chart.addDataSeries(series);
            chart.setTopLeftPosition({ cell: 'D5' });
            worksheet.addChart(chart);

            const writer = new XlsxWriter(spreadsheet);
            writer.setIncludeCharts(true);
            const buffer = await writer.writeBuffer();

            const chartXml = await getFirstChartXml(buffer);
            expect(chartXml).toContain('<c:legendPos val="b"');
        });

        test('should not write legend when position is none', async () => {
            const spreadsheet = new Spreadsheet();
            const worksheet = spreadsheet.createSheet('Data');

            worksheet.getCell('A1').setValue('X');
            worksheet.getCell('B1').setValue('Y');

            const chart = new Chart();
            chart.setLegendPosition('none');
            const series = new DataSeries('bar');
            series.setPlotCategory(new DataSeriesValues('String', 'Data!$A$2:$A$2'));
            series.addPlotValues(new DataSeriesValues('Number', 'Data!$B$2:$B$2'));
            chart.addDataSeries(series);
            chart.setTopLeftPosition({ cell: 'D5' });
            worksheet.addChart(chart);

            const writer = new XlsxWriter(spreadsheet);
            writer.setIncludeCharts(true);
            const buffer = await writer.writeBuffer();

            const chartXml = await getFirstChartXml(buffer);
            expect(chartXml).not.toContain('<c:legend');
        });

        test('should style multiple series differently', async () => {
            const spreadsheet = new Spreadsheet();
            const worksheet = spreadsheet.createSheet('MultiSeries');

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

            // Series 1 - Red
            const series1 = new DataSeries('bar');
            series1.setFillColor('FF0000');
            series1.setBorderColor('800000');
            series1.setPlotCategory(new DataSeriesValues('String', 'MultiSeries!$A$2:$A$3'));
            series1.addPlotValues(new DataSeriesValues('Number', 'MultiSeries!$B$2:$B$3'));
            chart.addDataSeries(series1);

            // Series 2 - Blue
            const series2 = new DataSeries('bar');
            series2.setFillColor('0000FF');
            series2.setBorderColor('000080');
            series2.setPlotCategory(new DataSeriesValues('String', 'MultiSeries!$A$2:$A$3'));
            series2.addPlotValues(new DataSeriesValues('Number', 'MultiSeries!$C$2:$C$3'));
            chart.addDataSeries(series2);

            chart.setTopLeftPosition({ cell: 'E2' });
            worksheet.addChart(chart);

            const writer = new XlsxWriter(spreadsheet);
            writer.setIncludeCharts(true);
            const buffer = await writer.writeBuffer();

            const chartXml = await getFirstChartXml(buffer);
            expect(chartXml).toContain('<a:srgbClr val="FF0000"');
            expect(chartXml).toContain('<a:srgbClr val="0000FF"');
            expect(chartXml).toContain('<a:srgbClr val="800000"');
            expect(chartXml).toContain('<a:srgbClr val="000080"');
        });

        test('should handle line chart styling', async () => {
            const spreadsheet = new Spreadsheet();
            const worksheet = spreadsheet.createSheet('LineData');

            worksheet.getCell('A1').setValue('Day');
            worksheet.getCell('A2').setValue('Mon');
            worksheet.getCell('A3').setValue('Tue');
            worksheet.getCell('B1').setValue('Sales');
            worksheet.getCell('B2').setValue(100);
            worksheet.getCell('B3').setValue(200);

            const chart = new Chart();
            const series = new DataSeries('line');
            series.setLineWidth(25400); // 2pt line
            series.setFillColor('FF6600'); // Line color
            series.setPlotCategory(new DataSeriesValues('String', 'LineData!$A$2:$A$3'));
            series.addPlotValues(new DataSeriesValues('Number', 'LineData!$B$2:$B$3'));
            chart.addDataSeries(series);
            chart.setTopLeftPosition({ cell: 'D2' });
            worksheet.addChart(chart);

            const writer = new XlsxWriter(spreadsheet);
            writer.setIncludeCharts(true);
            const buffer = await writer.writeBuffer();

            const chartXml = await getFirstChartXml(buffer);
            expect(chartXml).toContain('<a:srgbClr val="FF6600"');
            expect(chartXml).toMatch(/<a:ln\b[^>]*\bw="25400"/);
        });

        test('should support chart with all legend positions', async () => {
            const positions: Array<'top' | 'bottom' | 'left' | 'right'> = ['top', 'bottom', 'left', 'right'];

            for (const position of positions) {
                const spreadsheet = new Spreadsheet();
                const worksheet = spreadsheet.createSheet(`Legend_${position}`);

                worksheet.getCell('A1').setValue('X');
                worksheet.getCell('B1').setValue('Y');

                const chart = new Chart();
                chart.setLegendPosition(position);
                const series = new DataSeries('bar');
                series.setPlotCategory(new DataSeriesValues('String', `${`Legend_${position}`}!$A$2:$A$2`));
                series.addPlotValues(new DataSeriesValues('Number', `${`Legend_${position}`}!$B$2:$B$2`));
                chart.addDataSeries(series);
                chart.setTopLeftPosition({ cell: 'D5' });
                worksheet.addChart(chart);

                const writer = new XlsxWriter(spreadsheet);
                writer.setIncludeCharts(true);
                const buffer = await writer.writeBuffer();

                const chartXml = await getFirstChartXml(buffer);
                const positionMap: Record<string, string> = {
                    top: 't',
                    bottom: 'b',
                    left: 'l',
                    right: 'r',
                };
                const expected = positionMap[position];
                expect(chartXml).toContain(`<c:legendPos val="${expected}"`);
            }
        });

        test('should preserve legend overlay setting in round-trip', async () => {
            const spreadsheet = new Spreadsheet();
            const worksheet = spreadsheet.createSheet('OverlayTest');

            worksheet.getCell('A1').setValue('X');
            worksheet.getCell('B1').setValue('Y');

            const chart = new Chart();
            chart.setLegendPosition('top');
            chart.setLegendOverlay(true);
            const series = new DataSeries('bar');
            series.setPlotCategory(new DataSeriesValues('String', 'OverlayTest!$A$2:$A$2'));
            series.addPlotValues(new DataSeriesValues('Number', 'OverlayTest!$B$2:$B$2'));
            chart.addDataSeries(series);
            chart.setTopLeftPosition({ cell: 'D5' });
            worksheet.addChart(chart);

            const writer = new XlsxWriter(spreadsheet);
            writer.setIncludeCharts(true);
            const buffer = await writer.writeBuffer();

            const chartXml = await getFirstChartXml(buffer);
            expect(chartXml).toContain('<c:legendPos val="t"');
            expect(chartXml).toContain('<c:overlay val="1"');
        });

        test('should handle pie chart styling', async () => {
            const spreadsheet = new Spreadsheet();
            const worksheet = spreadsheet.createSheet('PieData');

            worksheet.getCell('A1').setValue('Segment');
            worksheet.getCell('A2').setValue('A');
            worksheet.getCell('A3').setValue('B');
            worksheet.getCell('B1').setValue('Value');
            worksheet.getCell('B2').setValue(30);
            worksheet.getCell('B3').setValue(70);

            const chart = new Chart();
            const series = new DataSeries('pie');
            series.setFillColor('FFCC00');
            series.setBorderColor('FF9900');
            series.setPlotCategory(new DataSeriesValues('String', 'PieData!$A$2:$A$3'));
            series.addPlotValues(new DataSeriesValues('Number', 'PieData!$B$2:$B$3'));
            chart.addDataSeries(series);
            chart.setTopLeftPosition({ cell: 'D2' });
            worksheet.addChart(chart);

            const writer = new XlsxWriter(spreadsheet);
            writer.setIncludeCharts(true);
            const buffer = await writer.writeBuffer();

            const chartXml = await getFirstChartXml(buffer);
            expect(chartXml).toContain('<c:pieChart');
            expect(chartXml).toContain('<a:srgbClr val="FFCC00"');
            expect(chartXml).toContain('<a:srgbClr val="FF9900"');
        });

        test('should handle chart with legend title', async () => {
            const spreadsheet = new Spreadsheet();
            const worksheet = spreadsheet.createSheet('LegendTitle');

            worksheet.getCell('A1').setValue('X');
            worksheet.getCell('B1').setValue('Y');

            const chart = new Chart();
            chart.setLegendPosition('right');
            chart.setLegendTitle('Sales Data');
            const series = new DataSeries('bar');
            series.setPlotCategory(new DataSeriesValues('String', 'LegendTitle!$A$2:$A$2'));
            series.addPlotValues(new DataSeriesValues('Number', 'LegendTitle!$B$2:$B$2'));
            chart.addDataSeries(series);
            chart.setTopLeftPosition({ cell: 'D5' });
            worksheet.addChart(chart);

            // Verify the chart was created with the title
            expect(chart.getLegendTitle()).toBe('Sales Data');
            expect(chart.getLegendPosition()).toBe('right');

            const writer = new XlsxWriter(spreadsheet);
            writer.setIncludeCharts(true);
            const buffer = await writer.writeBuffer();

            const chartXml = await getFirstChartXml(buffer);
            expect(chartXml).toContain('<c:legend>');
            expect(chartXml).toContain('<c:legendPos');
        });
    });

    describe('Chart XML structure verification', () => {
        test('generated XLSX contains valid chart XML structure', async () => {
            const spreadsheet = new Spreadsheet();
            const worksheet = spreadsheet.createSheet('XmlTest');

            worksheet.getCell('A1').setValue('Label');
            worksheet.getCell('A2').setValue('A');
            worksheet.getCell('B1').setValue('Data');
            worksheet.getCell('B2').setValue(42);

            const chart = new Chart();
            chart.setLegendPosition('bottom');
            chart.setTitleText('Test Chart');

            const series = new DataSeries('bar');
            series.setFillColor('00FF00');
            series.setBorderColor('000000');
            series.setPlotCategory(new DataSeriesValues('String', 'XmlTest!$A$2:$A$2'));
            series.addPlotValues(new DataSeriesValues('Number', 'XmlTest!$B$2:$B$2'));
            chart.addDataSeries(series);

            chart.setTopLeftPosition({ cell: 'D5' });
            worksheet.addChart(chart);

            const writer = new XlsxWriter(spreadsheet);
            writer.setIncludeCharts(true);
            const buffer = await writer.writeBuffer();

            const chartXml = await getFirstChartXml(buffer);
            expect(chartXml).toContain('<c:title>');
            expect(chartXml).toContain('<a:t>Test Chart</a:t>');
            expect(chartXml).toContain('<c:legendPos val="b"');
            expect(chartXml).toContain('<a:srgbClr val="00FF00"');
            expect(chartXml).toContain('<a:srgbClr val="000000"');
        });
    });
});
