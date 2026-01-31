import { Buffer } from 'node:buffer';
import { PassThrough } from 'node:stream';
import archiver from 'archiver';
import { describe, expect, test } from 'bun:test';
import unzipper from 'unzipper';
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

    async function patchSheet1Xml(bytes: Uint8Array, patch: (sheet1Xml: string) => string): Promise<Uint8Array> {
        const zip = await unzipper.Open.buffer(Buffer.from(bytes));
        const files = new Map<string, Buffer>();
        for (const entry of zip.files) {
            const buf = await entry.buffer();
            files.set(entry.path, buf);
        }

        const sheetPath = 'xl/worksheets/sheet1.xml';
        const sheet = files.get(sheetPath);
        if (!sheet) {
            throw new Error(`Expected zip entry to exist: ${sheetPath}`);
        }
        files.set(sheetPath, Buffer.from(patch(sheet.toString('utf-8')), 'utf-8'));

        const out = new PassThrough();
        const zipOut = archiver('zip', { zlib: { level: 0 } });
        zipOut.pipe(out);

        const fixedDate = new Date(0);
        const names = [...files.keys()].sort();
        for (const name of names) {
            zipOut.append(files.get(name)!, { name, date: fixedDate });
        }
        await zipOut.finalize();

        const chunks: Buffer[] = [];
        for await (const chunk of out) {
            chunks.push(Buffer.from(chunk));
        }
        return new Uint8Array(Buffer.concat(chunks));
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

    test('readDataOnly skips sheetViews state', async () => {
        const spreadsheet = new Spreadsheet();
        const sheet = spreadsheet.getActiveSheet();
        sheet.setCellValue('A1', 'hello');

        sheet.setShowGridlines(false);
        sheet.setRightToLeft(true);
        sheet.setSelectedCells('D6');
        sheet.freezePane('B2', 'C3', false);

        const bytes = await new XlsxWriter(spreadsheet).writeBuffer();
        const reader = new XlsxReader();
        reader.setReadDataOnly(true);
        const loaded = await reader.loadFromBuffer(bytes);
        const loadedSheet = loaded.getActiveSheet();

        // Cell data loads.
        expect(loadedSheet.getCell('A1').getValue()).toBe('hello');

        // sheetViews state is skipped.
        expect(loadedSheet.getShowGridlines()).toBe(true);
        expect(loadedSheet.getRightToLeft()).toBe(false);
        expect(loadedSheet.getFreezePane()).toBe(null);
        expect(loadedSheet.getSelectedCells()).toBe('A1');
    });

    test('Invalid activePane causes pane selections to not update worksheet selectedCells (PhpSpreadsheet parity)', async () => {
        const spreadsheet = new Spreadsheet();
        const sheet = spreadsheet.getActiveSheet();

        sheet.setXSplit(1);
        sheet.setYSplit(1);
        sheet.setPaneState('split');
        sheet.setPaneTopLeftCell('C3');
        sheet.setActivePane('topLeft');
        sheet.setPane('topLeft', new Pane('topLeft', 'D6', 'D6'));
        sheet.setSelectedCells('D6');

        const bytes = await new XlsxWriter(spreadsheet).writeBuffer();
        const patched = await patchSheet1Xml(bytes, (xml) => xml.replace(/activePane="topLeft"/g, 'activePane="nope"'));
        const loaded = await new XlsxReader().loadFromBuffer(patched);
        const loadedSheet = loaded.getActiveSheet();

        // activePane is invalid and becomes empty.
        expect(loadedSheet.getActivePane()).toBe('');

        // Selection is not applied to worksheet selection because no selection pane matches activePane.
        expect(loadedSheet.getSelectedCells()).toBe('A1');
        expect(loadedSheet.getActiveCell()).toBe('A1');
    });

    test('Selection sqref keeps only first token when space-separated', async () => {
        const spreadsheet = new Spreadsheet();
        const sheet = spreadsheet.getActiveSheet();

        sheet.setXSplit(1);
        sheet.setYSplit(1);
        sheet.setPaneState('split');
        sheet.setPaneTopLeftCell('C3');
        sheet.setActivePane('topLeft');
        sheet.setPane('topLeft', new Pane('topLeft', 'A1:B2', 'A1'));
        sheet.setSelectedCells('A1:B2');

        const bytes = await new XlsxWriter(spreadsheet).writeBuffer();
        const patched = await patchSheet1Xml(bytes, (xml) => xml.replace(/sqref="A1:B2"/g, 'sqref="A1:B2 D4:E5"'));
        const loaded = await new XlsxReader().loadFromBuffer(patched);
        const loadedSheet = loaded.getActiveSheet();

        expect(loadedSheet.getSelectedCells()).toBe('A1:B2');
        expect(loadedSheet.getActiveCell()).toBe('A1');
    });

    test('Invalid sheetView@topLeftCell is ignored', async () => {
        const spreadsheet = new Spreadsheet();
        const sheet = spreadsheet.getActiveSheet();

        // Sanity: default scroll position.
        expect(sheet.getTopLeftCell()).toBe('A1');

        const bytes = await new XlsxWriter(spreadsheet).writeBuffer();
        const patched = await patchSheet1Xml(bytes, (xml) => {
            const match = xml.match(/<sheetView\b[^>]*>/);
            if (!match) {
                throw new Error('Expected <sheetView> element to exist');
            }

            const sheetViewTag = match[0];
            const patchedSheetViewTag = sheetViewTag.includes('topLeftCell=')
                ? sheetViewTag.replace(/topLeftCell="[^"]*"/, 'topLeftCell="A0"')
                : sheetViewTag.replace(/<sheetView\b/, '<sheetView topLeftCell="A0"');

            const nextXml = xml.replace(sheetViewTag, patchedSheetViewTag);
            if (nextXml === xml) {
                throw new Error('Expected sheet1.xml patch to modify <sheetView>');
            }
            return nextXml;
        });
        const loaded = await new XlsxReader().loadFromBuffer(patched);
        const loadedSheet = loaded.getActiveSheet();

        // Reader should not poison worksheet state with invalid coords.
        expect(loadedSheet.getTopLeftCell()).toBe('A1');
    });

    test('Invalid pane@topLeftCell is ignored', async () => {
        const spreadsheet = new Spreadsheet();
        const sheet = spreadsheet.getActiveSheet();

        // Ensure pane exists in XML.
        sheet.setXSplit(1);
        sheet.setYSplit(1);
        sheet.setPaneState('split');
        sheet.setActivePane('topLeft');
        sheet.setPane('topLeft', new Pane('topLeft', 'A1', 'A1'));
        sheet.setSelectedCells('A1');

        // Sanity: default pane scroll position.
        expect(sheet.getPaneTopLeftCell()).toBe('A1');

        const bytes = await new XlsxWriter(spreadsheet).writeBuffer();
        const patched = await patchSheet1Xml(bytes, (xml) => {
            const match = xml.match(/<pane\b[^>]*\/>/);
            if (!match) {
                throw new Error('Expected <pane/> element to exist');
            }

            const paneTag = match[0];
            const patchedPaneTag = paneTag.includes('topLeftCell=')
                ? paneTag.replace(/topLeftCell="[^"]*"/, 'topLeftCell="A0"')
                : paneTag.replace(/<pane\b/, '<pane topLeftCell="A0"');

            const nextXml = xml.replace(paneTag, patchedPaneTag);
            if (nextXml === xml) {
                throw new Error('Expected sheet1.xml patch to modify <pane/>');
            }
            return nextXml;
        });
        const loaded = await new XlsxReader().loadFromBuffer(patched);
        const loadedSheet = loaded.getActiveSheet();

        // Reader should not poison worksheet state with invalid coords.
        expect(loadedSheet.getPaneTopLeftCell()).toBe('A1');
        // In split panes, pane@topLeftCell does not override the worksheet scroll position.
        expect(loadedSheet.getTopLeftCell()).toBe('A1');
    });
});
