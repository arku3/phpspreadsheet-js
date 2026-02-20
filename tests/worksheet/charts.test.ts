import { describe, expect, test } from 'bun:test';
import { Spreadsheet } from '../../src/core/spreadsheet.ts';
import { Chart } from '../../src/worksheet/chart/chart.ts';

describe('Worksheet charts', () => {
    test('getChartCollection defaults empty and is stable reference', () => {
        const spreadsheet = new Spreadsheet();
        const sheet = spreadsheet.getActiveSheet();

        const a = sheet.getChartCollection();
        const b = sheet.getChartCollection();

        expect(a.length).toBe(0);
        expect(b.length).toBe(0);
        expect(a).toBe(b);
    });

    test('addChart adds charts in insertion order and sets worksheet backref', () => {
        const spreadsheet = new Spreadsheet();
        const sheet = spreadsheet.getActiveSheet();

        const c1 = new Chart().setName('Chart 1');
        const c2 = new Chart().setName('Chart 2');

        sheet.addChart(c1);
        sheet.addChart(c2);

        const charts = sheet.getChartCollection();
        expect(charts.length).toBe(2);
        expect(charts[0]).toBe(c1);
        expect(charts[1]).toBe(c2);
        expect(c1.getWorksheet()).toBe(sheet);
        expect(c2.getWorksheet()).toBe(sheet);
    });

    test('addChart is idempotent for the same chart instance', () => {
        const spreadsheet = new Spreadsheet();
        const sheet = spreadsheet.getActiveSheet();

        const chart = new Chart();
        sheet.addChart(chart);
        sheet.addChart(chart);

        expect(sheet.getChartCollection().length).toBe(1);
    });

    test('addChart rejects attaching to two worksheets', () => {
        const spreadsheet = new Spreadsheet();
        const sheet1 = spreadsheet.getActiveSheet();
        const sheet2 = spreadsheet.createSheet().setTitle('Sheet 2');

        const chart = new Chart();
        sheet1.addChart(chart);
        expect(() => sheet2.addChart(chart)).toThrow();
    });

    test('removeChart removes chart and detaches it', () => {
        const spreadsheet = new Spreadsheet();
        const sheet = spreadsheet.getActiveSheet();

        const chart = new Chart();
        sheet.addChart(chart);
        expect(chart.getWorksheet()).toBe(sheet);

        sheet.removeChart(chart);
        expect(sheet.getChartCollection().length).toBe(0);
        expect(chart.getWorksheet()).toBe(null);
    });
});
