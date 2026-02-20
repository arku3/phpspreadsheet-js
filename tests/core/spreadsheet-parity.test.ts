import { describe, expect, test } from 'bun:test';
import { NamedFormula } from '../../src/core/named-formula.ts';
import { NamedRange } from '../../src/core/named-range.ts';
import { Spreadsheet } from '../../src/core/spreadsheet.ts';

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
});
