import { describe, expect, test } from 'bun:test';
import { NamedRange } from '../../../src/core/named-range.ts';
import { Spreadsheet } from '../../../src/core/spreadsheet.ts';
import { XlsxReader } from '../../../src/io/xlsx-reader.ts';
import { XlsxWriter } from '../../../src/io/xlsx-writer.ts';

describe('XlsxReader: definedNames (workbook.xml)', () => {
    test('round-trips user-defined named ranges with local scope', async () => {
        const spreadsheet = new Spreadsheet();
        const sheet1 = spreadsheet.getActiveSheet();
        sheet1.setTitle('Sheet1');
        const sheet2 = spreadsheet.createSheet().setTitle('Sheet2');

        spreadsheet.addNamedRange(new NamedRange('MyRange', sheet1, 'A1:B2'));
        spreadsheet.addDefinedName(new NamedRange('MyRange', null, 'C3:D4', true, sheet2));

        const bytes = await new XlsxWriter(spreadsheet).writeBuffer();
        const loaded = await new XlsxReader().loadFromBuffer(bytes);

        const loadedSheet1 = loaded.getSheetByName('Sheet1');
        const loadedSheet2 = loaded.getSheetByName('Sheet2');
        expect(loadedSheet1).toBeDefined();
        expect(loadedSheet2).toBeDefined();

        const globalDn = loaded.getDefinedName('MyRange');
        expect(globalDn).toBeDefined();
        expect(globalDn?.getLocalOnly()).toBe(false);
        expect(globalDn?.getScope()).toBeNull();
        expect(globalDn?.getWorksheet()?.getTitle()).toBe('Sheet1');
        expect(globalDn?.getValue()).toBe("'Sheet1'!A1:B2");

        const localDn = loaded.getDefinedName('MyRange', loadedSheet2!);
        expect(localDn).toBeDefined();
        expect(localDn?.getLocalOnly()).toBe(true);
        expect(localDn?.getScope()).toBe(loadedSheet2);
        expect(localDn?.getWorksheet()?.getTitle()).toBe('Sheet2');
        expect(localDn?.getValue()).toBe("'Sheet2'!C3:D4");

        const globalNr = loaded.getNamedRange('MyRange');
        expect(globalNr).toBeDefined();
        expect(globalNr?.getLocalOnly()).toBe(false);

        const localNr = loaded.getNamedRange('MyRange', loadedSheet2!);
        expect(localNr).toBeDefined();
        expect(localNr?.getLocalOnly()).toBe(true);

        const fromSheet1 = loaded.getNamedRange('MyRange', loadedSheet1!);
        expect(fromSheet1?.getLocalOnly()).toBe(false);
        expect(fromSheet1?.getValue()).toBe("'Sheet1'!A1:B2");
    });

    test('applies workbook definedNames built-ins to worksheet state', async () => {
        const spreadsheet = new Spreadsheet();
        const sheet = spreadsheet.getActiveSheet();
        sheet.setTitle('Sheet1');

        sheet.getPageSetup().setPrintArea('A1:B2');
        sheet.getPageSetup().addPrintArea('D4:E5');
        sheet.getPageSetup().setRowsToRepeatAtTopByStartAndEnd(1, 2);
        sheet.getPageSetup().setColumnsToRepeatAtLeftByStartAndEnd('A', 'B');
        sheet.getAutoFilter().setRange('A1:C10');

        const bytes = await new XlsxWriter(spreadsheet).writeBuffer();
        const loaded = await new XlsxReader().loadFromBuffer(bytes);

        const loadedSheet = loaded.getSheetByName('Sheet1')!;
        const pageSetup = loadedSheet.getPageSetup();

        expect(pageSetup.isPrintAreaSet()).toBe(true);
        expect(pageSetup.getPrintArea()).toBe('A1:B2,D4:E5');
        expect(pageSetup.getPrintArea(1)).toBe('A1:B2');
        expect(pageSetup.getPrintArea(2)).toBe('D4:E5');

        expect(pageSetup.isRowsToRepeatAtTopSet()).toBe(true);
        expect(pageSetup.getRowsToRepeatAtTop()).toEqual([1, 2]);

        expect(pageSetup.isColumnsToRepeatAtLeftSet()).toBe(true);
        expect(pageSetup.getColumnsToRepeatAtLeft()).toEqual(['A', 'B']);

        expect(loadedSheet.getAutoFilter().getRange()).toBe('A1:C10');
    });

    test('handles comma in sheet name when parsing print area and titles', async () => {
        const spreadsheet = new Spreadsheet();
        const sheet = spreadsheet.getActiveSheet();
        sheet.setTitle('Sales, Q1');

        sheet.getPageSetup().setPrintArea('A1:B2');
        sheet.getPageSetup().addPrintArea('D4:E5');
        sheet.getPageSetup().setRowsToRepeatAtTopByStartAndEnd(1, 2);
        sheet.getPageSetup().setColumnsToRepeatAtLeftByStartAndEnd('A', 'B');

        const bytes = await new XlsxWriter(spreadsheet).writeBuffer();
        const loaded = await new XlsxReader().loadFromBuffer(bytes);

        const loadedSheet = loaded.getSheetByName('Sales, Q1')!;
        const pageSetup = loadedSheet.getPageSetup();

        expect(pageSetup.getPrintArea()).toBe('A1:B2,D4:E5');
        expect(pageSetup.getRowsToRepeatAtTop()).toEqual([1, 2]);
        expect(pageSetup.getColumnsToRepeatAtLeft()).toEqual(['A', 'B']);
    });
});
