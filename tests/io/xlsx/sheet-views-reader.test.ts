import { describe, expect, test } from 'bun:test';
import { Spreadsheet } from '../../../src/core/spreadsheet.ts';
import { XlsxReader } from '../../../src/io/xlsx-reader.ts';
import { XlsxWriter } from '../../../src/io/xlsx-writer.ts';
import { Pane } from '../../../src/worksheet/pane.ts';
import { SheetView } from '../../../src/worksheet/sheet-view.ts';

describe('XLSX Worksheet sheetViews/pane/selection reading', () => {
    async function roundTrip(spreadsheet: Spreadsheet): Promise<Spreadsheet> {
        const bytes = await new XlsxWriter(spreadsheet).writeBuffer();
        return new XlsxReader().loadFromBuffer(bytes);
    }

    test('Non-frozen view settings round-trip', async () => {
        const spreadsheet = new Spreadsheet();
        const sheet = spreadsheet.getActiveSheet();

        sheet.setShowGridlines(false);
        sheet.setShowRowColHeaders(false);
        sheet.setRightToLeft(true);

        sheet.getSheetView().setZoomScale(120);
        sheet.getSheetView().setZoomScaleNormal(110);
        sheet.getSheetView().setZoomScalePageLayoutView(130);
        sheet.getSheetView().setZoomScaleSheetLayoutView(140);
        sheet.getSheetView().setView(SheetView.SHEETVIEW_PAGE_LAYOUT);
        sheet.getSheetView().setShowZeros(false);

        sheet.setTopLeftCell('C5');
        sheet.setSelectedCells('D6');

        const loaded = await roundTrip(spreadsheet);
        const loadedSheet = loaded.getActiveSheet();

        expect(loadedSheet.getShowGridlines()).toBe(false);
        expect(loadedSheet.getShowRowColHeaders()).toBe(false);
        expect(loadedSheet.getRightToLeft()).toBe(true);

        expect(loadedSheet.getSheetView().getZoomScale()).toBe(120);
        expect(loadedSheet.getSheetView().getZoomScaleNormal()).toBe(110);
        expect(loadedSheet.getSheetView().getZoomScalePageLayoutView()).toBe(130);
        expect(loadedSheet.getSheetView().getZoomScaleSheetLayoutView()).toBe(140);
        expect(loadedSheet.getSheetView().getView()).toBe(SheetView.SHEETVIEW_PAGE_LAYOUT);
        expect(loadedSheet.getSheetView().getShowZeros()).toBe(false);

        expect(loadedSheet.getTopLeftCell()).toBe('C5');
        expect(loadedSheet.getSelectedCells()).toBe('D6');
        expect(loadedSheet.getActiveCell()).toBe('D6');
    });

    test('Frozen panes + selection round-trip', async () => {
        const spreadsheet = new Spreadsheet();
        const sheet = spreadsheet.getActiveSheet();

        sheet.freezePane('B2', 'C3', false);
        sheet.setSelectedCells('D6');

        const loaded = await roundTrip(spreadsheet);
        const loadedSheet = loaded.getActiveSheet();

        expect(loadedSheet.getFreezePane()).toBe('B2');
        expect(loadedSheet.getPaneState()).toBe('frozen');

        expect(loadedSheet.getXSplit()).toBe(1);
        expect(loadedSheet.getYSplit()).toBe(1);
        expect(loadedSheet.getPaneTopLeftCell()).toBe('C3');
        expect(loadedSheet.getTopLeftCell()).toBe('C3');
        // Writer forces activePane for normal frozen panes.
        expect(loadedSheet.getActivePane()).toBe('bottomRight');

        expect(loadedSheet.getSelectedCells()).toBe('D6');
        expect(loadedSheet.getActiveCell()).toBe('D6');
    });

    test('Multiple pane selections + activePane round-trip', async () => {
        const spreadsheet = new Spreadsheet();
        const sheet = spreadsheet.getActiveSheet();

        // Use split panes so writer emits per-pane selections.
        sheet.setXSplit(1);
        sheet.setYSplit(1);
        sheet.setPaneState('split');
        sheet.setPaneTopLeftCell('C3');
        sheet.setActivePane('topLeft');
        sheet.setPane('topLeft', new Pane('topLeft', 'A1:B2', 'A1'));
        sheet.setPane('bottomRight', new Pane('bottomRight', 'D6', 'D6'));
        sheet.setSelectedCells('A1:B2');

        const loaded = await roundTrip(spreadsheet);
        const loadedSheet = loaded.getActiveSheet();

        expect(loadedSheet.getPaneState()).toBe('split');
        expect(loadedSheet.getXSplit()).toBe(1);
        expect(loadedSheet.getYSplit()).toBe(1);
        expect(loadedSheet.getPaneTopLeftCell()).toBe('C3');
        expect(loadedSheet.getActivePane()).toBe('topLeft');

        const panes = loadedSheet.getPanes();
        expect(panes.topLeft?.getSqref()).toBe('A1:B2');
        expect(panes.topLeft?.getActiveCell()).toBe('A1');
        expect(panes.bottomRight?.getSqref()).toBe('D6');
        expect(panes.bottomRight?.getActiveCell()).toBe('D6');

        expect(loadedSheet.getSelectedCells()).toBe('A1:B2');
        expect(loadedSheet.getActiveCell()).toBe('A1');
    });
});
