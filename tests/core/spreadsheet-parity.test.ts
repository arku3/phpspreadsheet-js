import { describe, expect, test } from 'bun:test';
import { NamedFormula } from '../../src/core/named-formula.ts';
import { NamedRange } from '../../src/core/named-range.ts';
import { Spreadsheet } from '../../src/core/spreadsheet.ts';
import { Chart } from '../../src/worksheet/chart/chart.ts';
import { Drawing } from '../../src/worksheet/drawing/drawing.ts';

describe('Spreadsheet core parity', () => {
    test('getSheet bounds errors match PHP messages', () => {
        const spreadsheet = new Spreadsheet();
        expect(() => spreadsheet.getSheet(99)).toThrow(
            'Your requested sheet index: 99 is out of bounds. The actual number of sheets is 1.',
        );
    });

    test('setIndexByName reorders and returns new index', () => {
        const spreadsheet = new Spreadsheet();
        spreadsheet.createSheet().setTitle('Second');

        const newIndex = spreadsheet.setIndexByName('Second', 0);
        expect(newIndex).toBe(0);
        expect(spreadsheet.getSheet(0).getTitle()).toBe('Second');
    });

    test('getWorksheetIterator yields worksheets in order', () => {
        const spreadsheet = new Spreadsheet();
        spreadsheet.createSheet().setTitle('Second');

        const titles = Array.from(spreadsheet.getWorksheetIterator()).map((sheet) => sheet.getTitle());
        expect(titles).toEqual(['Worksheet 1', 'Second']);
    });

    test('named formulas and ranges resolve with local override', () => {
        const spreadsheet = new Spreadsheet();
        const sheet1 = spreadsheet.getActiveSheet();
        const sheet2 = spreadsheet.createSheet().setTitle('Sheet2');

        spreadsheet.addNamedRange(new NamedRange('MyRange', sheet1, 'A1:A2'));
        spreadsheet.addDefinedName(new NamedRange('MyRange', sheet2, 'B1:B2', true, sheet2));

        expect(spreadsheet.getNamedRange('MyRange', sheet1)?.getRange()).toBe('A1:A2');
        expect(spreadsheet.getNamedRange('MyRange', sheet2)?.getRange()).toBe('B1:B2');

        spreadsheet.addNamedFormula(new NamedFormula('MyFormula', sheet1, '=SUM(A1:A2)'));
        spreadsheet.addDefinedName(new NamedFormula('MyFormula', sheet2, '=SUM(B1:B2)', true, sheet2));

        expect(spreadsheet.getNamedFormula('MyFormula', sheet1)?.getFormula()).toBe('=SUM(A1:A2)');
        expect(spreadsheet.getNamedFormula('MyFormula', sheet2)?.getFormula()).toBe('=SUM(B1:B2)');
    });

    test('removeDefinedName removes local then global', () => {
        const spreadsheet = new Spreadsheet();
        const sheet = spreadsheet.getActiveSheet();

        spreadsheet.addNamedRange(new NamedRange('MyRange', sheet, 'A1:A2'));
        spreadsheet.addDefinedName(new NamedRange('MyRange', sheet, 'B1:B2', true, sheet));

        spreadsheet.removeDefinedName('MyRange', sheet);
        expect(spreadsheet.getNamedRange('MyRange', sheet)?.getRange()).toBe('A1:A2');

        spreadsheet.removeDefinedName('MyRange', sheet);
        expect(spreadsheet.getNamedRange('MyRange', sheet)).toBeUndefined();
    });

    test('defined names normalize sheet prefixes', () => {
        const spreadsheet = new Spreadsheet();
        const sheet = spreadsheet.getActiveSheet();
        sheet.setTitle('Sheet1');

        spreadsheet.addNamedRange(new NamedRange('MyRange', sheet, 'A1:A2'));
        expect(spreadsheet.getNamedRange('Sheet1!MyRange', sheet)?.getRange()).toBe('A1:A2');

        spreadsheet.removeDefinedName('Sheet1!MyRange', sheet);
        expect(spreadsheet.getNamedRange('MyRange', sheet)).toBeUndefined();
    });

    test('sheet lookup and reordering errors match PHP messages', () => {
        const spreadsheet = new Spreadsheet();

        expect(() => spreadsheet.getSheetByNameOrThrow('Missing')).toThrow('Workbook does not contain sheet: Missing');
        expect(() => spreadsheet.setIndexByName('Worksheet 1', 99)).toThrow('Position is out of bounds.');
    });

    test('macro and ribbon APIs behave like PHP', () => {
        const spreadsheet = new Spreadsheet();

        expect(spreadsheet.hasMacros()).toBe(false);
        spreadsheet.setMacrosCode('macro');
        expect(spreadsheet.hasMacros()).toBe(true);
        expect(spreadsheet.getMacrosCode()).toBe('macro');

        spreadsheet.setMacrosCertificate('cert');
        expect(spreadsheet.hasMacrosCertificate()).toBe(true);
        expect(spreadsheet.getMacrosCertificate()).toBe('cert');

        spreadsheet.discardMacros();
        expect(spreadsheet.hasMacros()).toBe(false);
        expect(spreadsheet.getMacrosCode()).toBeNull();

        spreadsheet.setRibbonXMLData('customUI.xml', '<customUI/>');
        expect(spreadsheet.hasRibbon()).toBe(true);
        expect(spreadsheet.getRibbonXMLData('target')).toBe('customUI.xml');
        expect(spreadsheet.getRibbonXMLData('data')).toBe('<customUI/>');

        spreadsheet.setRibbonBinObjects(['foo.bin'], { 'foo.bin': new Uint8Array() });
        expect(spreadsheet.hasRibbonBinObjects()).toBe(true);
        expect(spreadsheet.getRibbonBinObjects('types')).toEqual(['bin']);
    });

    test('excel calendar setters match PHP', () => {
        const spreadsheet = new Spreadsheet();
        expect(spreadsheet.setExcelCalendar(Spreadsheet.CALENDAR_WINDOWS_1900)).toBe(true);
        expect(spreadsheet.getExcelCalendar()).toBe(Spreadsheet.CALENDAR_WINDOWS_1900);
        expect(spreadsheet.setExcelCalendar(Spreadsheet.CALENDAR_MAC_1904)).toBe(true);
        expect(spreadsheet.getExcelCalendar()).toBe(Spreadsheet.CALENDAR_MAC_1904);
        expect(spreadsheet.setExcelCalendar(2000)).toBe(false);
    });

    test('resetThemeFonts updates font schemes', () => {
        const spreadsheet = new Spreadsheet();
        const style = spreadsheet.getDefaultStyle();
        style.getFont().setScheme('major').setName('OldMajor');

        spreadsheet.getTheme().setMajorFontValues('NewMajor', 'East', 'Complex', {});
        spreadsheet.resetThemeFonts();

        expect(style.getFont().getName()).toBe('NewMajor');
    });

    test('cellXfExists and removeCellStyleXfByIndex', () => {
        const spreadsheet = new Spreadsheet();
        const style = spreadsheet.getDefaultStyle();

        expect(spreadsheet.cellXfExists(style)).toBe(true);
        expect(() => spreadsheet.removeCellStyleXfByIndex(99)).toThrow();
    });

    test('reevaluateAutoFilters refreshes ranges', () => {
        const spreadsheet = new Spreadsheet();
        const sheet = spreadsheet.getActiveSheet();

        sheet.setCellValue('A1', 'Header');
        sheet.setCellValue('A2', 'Apple');
        sheet.setCellValue('A3', 'Banana');

        const autoFilter = sheet.getAutoFilter();
        autoFilter.setRange('A1:A1');
        autoFilter.getColumn('A').createRule().setValue('Apple');

        spreadsheet.reevaluateAutoFilters(true);
        expect(autoFilter.getRange()).toBe('A1:A3');
    });

    test('addExternalSheet rebinds worksheet parent', () => {
        const source = new Spreadsheet();
        const sheet = source.getActiveSheet();
        sheet.setTitle('External');

        const target = new Spreadsheet();
        target.addExternalSheet(sheet);

        expect(target.getSheetByName('External')).toBeDefined();
        expect(sheet.getParent()).toBe(target);
    });

    test('addExternalSheet shifts xf indexes', () => {
        const source = new Spreadsheet();
        const sheet = source.getActiveSheet();
        sheet.setTitle('External');
        sheet.setCellValue('A1', 'Value');
        sheet.getCell('A1').setXfIndex(0);

        const target = new Spreadsheet();
        target.addCellXf(target.getDefaultStyle().clone());
        const expectedShift = target.getCellXfCollection().length;
        expect(expectedShift).toBeGreaterThan(0);

        target.addExternalSheet(sheet);
        const imported = target.getSheetByName('External')!;
        expect(imported.getCell('A1').getXfIndex()).toBe(expectedShift);
    });

    test('copy preserves worksheet content and styles', () => {
        const spreadsheet = new Spreadsheet();
        const sheet = spreadsheet.getActiveSheet();
        sheet.setTitle('Original');
        sheet.setCellValue('B2', 'Value');
        sheet.getCell('B2').setXfIndex(0);
        sheet.mergeCells('B2:C3');
        sheet.getRowDimension(2).setRowHeight(20);
        sheet.getColumnDimension('B').setWidth(12);

        const clone = spreadsheet.copy();
        const cloneSheet = clone.getSheetByName('Original')!;

        expect(cloneSheet.getCell('B2').getValue()).toBe('Value');
        expect(cloneSheet.getCell('B2').getXfIndex()).toBe(0);
        expect(Object.keys(cloneSheet.getMergeCells())).toContain('B2:C3');
        expect(cloneSheet.getRowDimension(2).getRowHeight()).toBe(20);
        expect(cloneSheet.getColumnDimension('B').getWidth()).toBe(12);
    });

    test('copy clones drawings and charts', () => {
        const spreadsheet = new Spreadsheet();
        const sheet = spreadsheet.getActiveSheet();

        const drawing = new Drawing();
        drawing.setName('Logo').setCoordinates('A1');
        sheet.addDrawing(drawing);

        const chart = new Chart();
        chart.setName('Chart1').setTopLeftPosition({ cell: 'B2' });
        sheet.addChart(chart);

        const clone = spreadsheet.copy();
        const cloneSheet = clone.getActiveSheet();

        const drawings = cloneSheet.getDrawingCollection();
        const charts = cloneSheet.getChartCollection();
        expect(drawings.length).toBe(1);
        expect(drawings[0]!.getName()).toBe('Logo');
        expect(charts.length).toBe(1);
        expect(charts[0]!.getName()).toBe('Chart1');
    });
});
