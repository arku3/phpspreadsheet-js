import { describe, expect, test } from 'bun:test';
import { Spreadsheet } from '../src/core/spreadsheet.ts';
import { XlsxReader } from '../src/io/xlsx-reader.ts';
import { XlsxWriter } from '../src/io/xlsx-writer.ts';

describe('XLSX Reader workbook view (bookViews/workbookView)', () => {
    test('round-trips workbook view settings from writer output', async () => {
        const spreadsheet = new Spreadsheet();
        spreadsheet.createSheet().setTitle('Sheet2');

        spreadsheet.setActiveSheetIndex(1);
        spreadsheet.setShowHorizontalScroll(false);
        spreadsheet.setShowVerticalScroll(false);
        spreadsheet.setShowSheetTabs(false);
        spreadsheet.setMinimized(true);
        spreadsheet.setAutoFilterDateGrouping(false);
        spreadsheet.setFirstSheetIndex(1);
        spreadsheet.setTabRatio(500);
        spreadsheet.setVisibility(Spreadsheet.VISIBILITY_HIDDEN);

        const writer = new XlsxWriter(spreadsheet);
        const bytes = await writer.writeBuffer();

        const reader = new XlsxReader();
        const loaded = await reader.loadFromBuffer(bytes);

        expect(loaded.getActiveSheetIndex()).toBe(1);
        expect(loaded.getShowHorizontalScroll()).toBe(false);
        expect(loaded.getShowVerticalScroll()).toBe(false);
        expect(loaded.getShowSheetTabs()).toBe(false);
        expect(loaded.getMinimized()).toBe(true);
        expect(loaded.getAutoFilterDateGrouping()).toBe(false);
        expect(loaded.getFirstSheetIndex()).toBe(1);
        expect(loaded.getTabRatio()).toBe(500);
        expect(loaded.getVisibility()).toBe(Spreadsheet.VISIBILITY_HIDDEN);
    });
});
