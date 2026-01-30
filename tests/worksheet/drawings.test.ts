import { describe, expect, test } from 'bun:test';
import { Hyperlink } from '../../src/core/hyperlink.ts';
import { Spreadsheet } from '../../src/core/spreadsheet.ts';
import { Drawing } from '../../src/worksheet/drawing/drawing.ts';

describe('Worksheet drawings', () => {
    test('getDrawingCollection defaults empty and is stable reference', () => {
        const spreadsheet = new Spreadsheet();
        const sheet = spreadsheet.getActiveSheet();

        const a = sheet.getDrawingCollection();
        const b = sheet.getDrawingCollection();
        expect(a.length).toBe(0);
        expect(b.length).toBe(0);
        expect(a).toBe(b);
    });

    test('addDrawing adds drawing and sets worksheet backref', () => {
        const spreadsheet = new Spreadsheet();
        const sheet = spreadsheet.getActiveSheet();

        const drawing = new Drawing();
        drawing.setName('Logo');
        drawing.setDescription('Company logo');
        drawing.setCoordinates('B2');
        drawing.setOffsetX(10);
        drawing.setOffsetY(20);
        drawing.setWidth(100);
        drawing.setHeight(50);

        sheet.addDrawing(drawing);
        const drawings = sheet.getDrawingCollection();

        expect(drawings.length).toBe(1);
        expect(drawings[0]).toBe(drawing);
        expect(drawing.getWorksheet()).toBe(sheet);
        expect(drawing.getCoordinates()).toBe('B2');
        expect(drawing.getOffsetX()).toBe(10);
        expect(drawing.getOffsetY()).toBe(20);
        expect(drawing.getWidth()).toBe(100);
        expect(drawing.getHeight()).toBe(50);
    });

    test('drawing defaults match minimal PhpSpreadsheet behavior', () => {
        const drawing = new Drawing();
        expect(drawing.getCoordinates()).toBe('A1');
        expect(drawing.getCoordinates2()).toBe('');
        expect(drawing.getOffsetX()).toBe(0);
        expect(drawing.getOffsetY()).toBe(0);
        expect(drawing.getOffsetX2()).toBe(0);
        expect(drawing.getOffsetY2()).toBe(0);
        expect(drawing.getWidth()).toBe(0);
        expect(drawing.getHeight()).toBe(0);
        expect(drawing.getName()).toBe('');
        expect(drawing.getDescription()).toBe('');
        expect(drawing.getHyperlink()).toBe(null);
    });

    test('addDrawing rejects attaching to two worksheets', () => {
        const spreadsheet = new Spreadsheet();
        const sheet1 = spreadsheet.getActiveSheet();
        const sheet2 = spreadsheet.createSheet('Sheet 2');

        const drawing = new Drawing();
        sheet1.addDrawing(drawing);
        expect(() => sheet2.addDrawing(drawing)).toThrow();
    });

    test('removeDrawing detaches the drawing', () => {
        const spreadsheet = new Spreadsheet();
        const sheet = spreadsheet.getActiveSheet();

        const drawing = new Drawing();
        sheet.addDrawing(drawing);
        expect(drawing.getWorksheet()).toBe(sheet);

        sheet.removeDrawing(drawing);
        expect(sheet.getDrawingCollection().length).toBe(0);
        expect(drawing.getWorksheet()).toBe(null);
    });

    test('hyperlink can be set and retrieved', () => {
        const drawing = new Drawing();
        const link = new Hyperlink('https://example.com', '', 'Example');

        drawing.setHyperlink(link);
        expect(drawing.getHyperlink()).toBe(link);
        expect(drawing.getHyperlink()?.getUrl()).toBe('https://example.com');
    });
});
