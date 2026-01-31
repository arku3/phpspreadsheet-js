import { describe, expect, test } from 'bun:test';
import { Spreadsheet } from '../src/core/spreadsheet.ts';
import { XlsxWriter } from '../src/io/xlsx-writer.ts';
import { Worksheet } from '../src/io/xlsx/worksheet.ts';
import { RichText } from '../src/rich-text/rich-text.ts';

describe('Xlsx Worksheet Writer', () => {
    test('writeWorksheet includes sheetViews', () => {
        const spreadsheet = new Spreadsheet();
        const sheet = spreadsheet.getActiveSheet();
        sheet.setTitle('Sheet1');

        sheet.getSheetView().setZoomScale(75);
        sheet.getSheetView().setShowZeros(false);
        sheet.freezePane('B2');

        const writer = new Worksheet(new XlsxWriter(spreadsheet));
        const xml = writer.writeWorksheet(sheet, []);

        expect(xml).toContain('<sheetViews>');
        expect(xml).toContain('tabSelected="1"');
        expect(xml).toContain('workbookViewId="0"');
        expect(xml).toContain('zoomScale="75"');
        expect(xml).toContain('showZeros="0"');
        // Match PhpSpreadsheet: when topLeftCell isn't provided, it defaults to the freeze coordinate.
        expect(xml).toContain('<pane xSplit="1" ySplit="1" activePane="bottomRight" state="frozen" topLeftCell="B2"/>');
        expect(xml).toContain('<selection pane="bottomRight" activeCell="A1" sqref="A1"/>');
        expect(xml).toContain('</sheetViews>');

        // Check order
        const sheetViewsPos = xml.indexOf('<sheetViews>');
        const sheetDataPos = xml.indexOf('<sheetData/>');
        expect(sheetViewsPos).toBeLessThan(sheetDataPos);
    });

    test('writeWorksheet with right-to-left and gridlines', () => {
        const spreadsheet = new Spreadsheet();
        const sheet = spreadsheet.getActiveSheet();
        sheet.setRightToLeft(true);
        sheet.setShowGridlines(false);

        const writer = new Worksheet(new XlsxWriter(spreadsheet));
        const xml = writer.writeWorksheet(sheet, []);

        expect(xml).toContain('rightToLeft="true"');
        expect(xml).toContain('showGridLines="false"');
    });

    test('writeWorksheet includes sheetFormatPr', () => {
        const spreadsheet = new Spreadsheet();
        const sheet = spreadsheet.getActiveSheet();
        sheet.getDefaultRowDimension().setRowHeight(20);

        const writer = new Worksheet(new XlsxWriter(spreadsheet));
        const xml = writer.writeWorksheet(sheet, []);

        expect(xml).toContain('<sheetFormatPr customHeight="1" defaultRowHeight="20"');

        // Check order: sheetViews < sheetFormatPr < cols < sheetData
        const sheetViewsPos = xml.indexOf('<sheetViews>');
        const sheetFormatPrPos = xml.indexOf('<sheetFormatPr');
        const sheetDataPos = xml.indexOf('<sheetData/>');

        expect(sheetViewsPos).toBeLessThan(sheetFormatPrPos);
        expect(sheetFormatPrPos).toBeLessThan(sheetDataPos);
    });
});
