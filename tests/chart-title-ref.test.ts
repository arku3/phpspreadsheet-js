import { describe, expect, test } from 'bun:test';
import unzipper from 'unzipper';
import { Spreadsheet } from '../src/core/spreadsheet.ts';
import { XlsxReader } from '../src/io/xlsx-reader.ts';
import { XlsxWriter } from '../src/io/xlsx-writer.ts';
import { Font } from '../src/style/font.ts';
import { Chart } from '../src/worksheet/chart/chart.ts';
import { DataSeriesValues } from '../src/worksheet/chart/data-series-values.ts';
import { DataSeries } from '../src/worksheet/chart/data-series.ts';
import { Title } from '../src/worksheet/chart/title.ts';

const getFirstChartXml = async (buffer: Uint8Array | ArrayBuffer): Promise<string> => {
    const zipBuffer = buffer instanceof ArrayBuffer ? Buffer.from(new Uint8Array(buffer)) : Buffer.from(buffer);
    const zip = await unzipper.Open.buffer(zipBuffer);
    const chartFile = zip.files.find((file) => file.path.startsWith('xl/charts/chart') && file.path.endsWith('.xml'));
    expect(chartFile).toBeDefined();
    return (await chartFile!.buffer()).toString('utf-8');
};

describe('Chart title cell reference', () => {
    test('writes chart title strRef with cached value and reads back cell reference', async () => {
        const spreadsheet = new Spreadsheet();
        const worksheet = spreadsheet.getActiveSheet();
        worksheet.setTitle('Sheet1');

        worksheet.getCell('A1').setValue('Chart Title Value');
        worksheet.getCell('A2').setValue('Category');
        worksheet.getCell('A3').setValue('A');
        worksheet.getCell('B2').setValue('Value');
        worksheet.getCell('B3').setValue(10);

        const chart = new Chart();
        chart.setName('Title Ref Chart');
        chart.setTopLeftPosition({ cell: 'D2' });

        const title = new Title('Chart Title Value');
        title.setCellReference("'Sheet1'!$A$1");
        const titleFont = new Font();
        titleFont.setName('Calibri');
        titleFont.setSize(12);
        titleFont.setBold(true);
        title.setFont(titleFont);
        chart.setTitle(title);

        const series = new DataSeries('bar');
        series.addPlotCategory(new DataSeriesValues('String', 'Sheet1!$A$3:$A$3'));
        series.addPlotValues(new DataSeriesValues('Number', 'Sheet1!$B$3:$B$3'));
        chart.addDataSeries(series);
        worksheet.addChart(chart);

        const writer = new XlsxWriter(spreadsheet);
        writer.setIncludeCharts(true);
        const buffer = await writer.writeBuffer();

        const chartXml = await getFirstChartXml(buffer);
        expect(chartXml).toMatch(/<c:f>(?:'|&apos;)?Sheet1(?:'|&apos;)?!\$A\$1<\/c:f>/);
        expect(chartXml).toContain('<c:v>Chart Title Value</c:v>');

        const reader = new XlsxReader();
        reader.setIncludeCharts(true);
        const readSpreadsheet = await reader.loadFromBuffer(buffer);
        const readWorksheet = readSpreadsheet.getSheetByName('Sheet1');

        const readChart = readWorksheet!.getChartCollection()[0];
        expect(readChart).toBeDefined();
        expect(readChart!.getTitle()?.getCellReference()).toBe("'Sheet1'!$A$1");
        expect(readChart!.getTitle()?.getFont()?.getName()).toBe('Calibri');
        expect(readChart!.getTitle()?.getFont()?.getSize()).toBe(12);
        expect(readChart!.getTitle()?.getFont()?.getBold()).toBe(true);
    });
});
