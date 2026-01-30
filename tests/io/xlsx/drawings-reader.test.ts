import path from 'node:path';
import { describe, expect, test } from 'bun:test';
import { XlsxReader } from '../../../src/io/xlsx-reader.ts';
import { Drawing } from '../../../src/worksheet/drawing/drawing.ts';

const within1px = (value: number, expected: number): boolean => Math.abs(value - expected) <= 1;

describe('XlsxReader DrawingML (worksheet images)', () => {
    const fixturePath = path.resolve(
        process.cwd(),
        'tests',
        'fixtures',
        'xlsx',
        'drawings',
        'drawing-one-cell-anchor.xlsx',
    );

    test('reads oneCellAnchor image and attaches drawing to sheet', async () => {
        const reader = new XlsxReader();
        const wb = await reader.load(fixturePath);
        const sheet1 = wb.getSheetByName('Sheet1') ?? wb.getSheet(0);
        expect(sheet1).toBeDefined();

        const drawings = sheet1!.getDrawingCollection();
        expect(drawings.length).toBe(1);

        const drawing = drawings[0];
        expect(drawing).toBeInstanceOf(Drawing);

        const img = drawing as Drawing;
        expect(img.getCoordinates()).toBe('A2');
        expect(within1px(img.getOffsetX(), 10)).toBe(true);
        expect(within1px(img.getOffsetY(), 10)).toBe(true);
        expect(within1px(img.getWidth(), 150)).toBe(true);
        expect(within1px(img.getHeight(), 150)).toBe(true);

        const bytes = img.getImageData();
        expect(bytes).toBeDefined();
        expect(bytes!.length).toBeGreaterThan(0);
        expect(img.getExtension()).toBe('png');
        expect(img.getMimeType()).toBe('image/png');
    });

    test('readDataOnly disables drawings loading', async () => {
        const reader = new XlsxReader();
        reader.setReadDataOnly(true);

        const wb = await reader.load(fixturePath);
        const sheet1 = wb.getSheetByName('Sheet1') ?? wb.getSheet(0);
        expect(sheet1).toBeDefined();
        expect(sheet1!.getDrawingCollection().length).toBe(0);
    });
});
