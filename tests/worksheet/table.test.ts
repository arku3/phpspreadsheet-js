import { describe, expect, test } from 'bun:test';
import unzipper from 'unzipper';
import { Spreadsheet } from '../../src/core/spreadsheet.ts';
import { XlsxWriter } from '../../src/io/xlsx-writer.ts';
import { MergedCellStyle } from '../../src/style/conditional-formatting/merged-cell-style.ts';
import { Style } from '../../src/style/style.ts';
import { Column as AutoFilterColumn } from '../../src/worksheet/auto-filter/column.ts';
import { Rule as AutoFilterRule } from '../../src/worksheet/auto-filter/column/rule.ts';
import { TableDxfsStyle } from '../../src/worksheet/table-dxfs-style.ts';
import { TableStyle } from '../../src/worksheet/table-style.ts';
import { Table, TableColumn } from '../../src/worksheet/table.ts';

describe('Table', () => {
    test('setName validates and enforces uniqueness', () => {
        const spreadsheet = new Spreadsheet();
        const sheet = spreadsheet.getActiveSheet();

        const table = new Table('A1:B2', 'Table1', sheet);
        sheet.addTable(table);

        expect(() => table.setName('')).toThrow();
        expect(() => table.setName('A1')).toThrow();

        const other = new Table('C1:D2', 'Other', sheet);
        sheet.addTable(other);
        expect(() => other.setName('Table1')).toThrow();
    });

    test('setRangeToMaxRow expands range', () => {
        const spreadsheet = new Spreadsheet();
        const sheet = spreadsheet.getActiveSheet();
        sheet.setCellValue('A1', 'Header');
        sheet.setCellValue('A5', 'Data');

        const table = new Table('A1:A1', 'Table1', sheet);
        table.setRangeToMaxRow();
        expect(table.getRange()).toBe('A1:A5');
    });

    test('table style flags set correctly', () => {
        const spreadsheet = new Spreadsheet();
        const sheet = spreadsheet.getActiveSheet();
        const table = new Table('A1:B2', 'Table1', sheet);

        const style = new TableStyle();
        style.setTheme(TableStyle.TABLE_STYLE_LIGHT1);
        style.setShowRowStripes(false);
        style.setShowColumnStripes(true);
        style.setShowFirstColumn(true);
        style.setShowLastColumn(true);

        table.setStyle(style);
        expect(table.getStyle().getTheme()).toBe(TableStyle.TABLE_STYLE_LIGHT1);
        expect(table.getStyle().getShowRowStripes()).toBe(false);
        expect(table.getStyle().getShowColumnStripes()).toBe(true);
        expect(table.getStyle().getShowFirstColumn()).toBe(true);
        expect(table.getStyle().getShowLastColumn()).toBe(true);
    });

    test('worksheet table collection helpers match PhpSpreadsheet semantics', () => {
        const spreadsheet = new Spreadsheet();
        const sheet = spreadsheet.getActiveSheet();

        const first = new Table('A1:B2', 'FirstTable', sheet);
        const second = new Table('D1:E2', 'SecondTable', sheet);
        sheet.addTable(first).addTable(second);

        expect(sheet.getTableCollection()).toEqual([first, second]);
        expect(sheet.getTableNames()).toEqual(['FirstTable', 'SecondTable']);
        expect(sheet.getTableByName('firsttable')).toBe(first);

        const removed = sheet.removeTableByName('SECONDTABLE');
        expect(removed).toBe(sheet);
        expect(sheet.getTableByName('SecondTable')).toBeNull();
        expect(sheet.getTableNames()).toEqual(['FirstTable']);

        const cleared = sheet.removeTableCollection();
        expect(cleared).toBe(sheet);
        expect(sheet.getTableCollection()).toEqual([]);
    });

    test('table column mutators follow PhpSpreadsheet behavior', () => {
        const spreadsheet = new Spreadsheet();
        const sheet = spreadsheet.getActiveSheet();
        const table = new Table('A1:C3', 'Table1', sheet);

        table.setColumn('B');
        expect(table.getColumn('B').getTable()).toBe(table);

        const columnA = new TableColumn('A');
        columnA.setName('Alpha');
        table.setColumn(columnA);

        expect(table.getColumn('A')).toBe(columnA);
        expect(Array.from(table.getColumns().keys())).toEqual(['A', 'B']);

        expect(() => table.clearColumn('C')).not.toThrow();
        expect(() => table.shiftColumn('Z', 'A')).not.toThrow();

        table.shiftColumn('A', 'C');
        expect(table.getColumn('C')).toBe(columnA);
        expect(columnA.getTable()).toBe(table);
    });

    test('table range normalization accepts array and sheet-qualified inputs like PhpSpreadsheet', () => {
        const spreadsheet = new Spreadsheet();
        const sheet = spreadsheet.getActiveSheet();
        sheet.setTitle('Quarter!1');

        const table = new Table([1, 1, 3, 4], 'ArrayTable', sheet);
        expect(table.getRange()).toBe('A1:C4');

        table.getColumn('A');
        table.getColumn('B');
        table.getColumn('C');
        table.setRange("'Quarter!1'!$B$2:$C$5");

        expect(table.getRange()).toBe('B2:C5');
        expect(table.getAutoFilter().getRange()).toBe('B2:C5');
        expect(Array.from(table.getColumns().keys())).toEqual(['B', 'C']);
    });

    test('spreadsheet copy preserves tables, autofilter payload, and table styles', async () => {
        const spreadsheet = new Spreadsheet();
        const sheet = spreadsheet.getActiveSheet();
        sheet.setTitle('Data');
        sheet.getCell('A1').setValue('Name');
        sheet.getCell('B1').setValue('Amount');
        sheet.getCell('C1').setValue('Rank');
        sheet.getCell('A2').setValue('Widget');
        sheet.getCell('B2').setValue(10);
        sheet.getCell('C2').setValue(1);
        sheet.getCell('A3').setValue('Gadget');
        sheet.getCell('B3').setValue(20);
        sheet.getCell('C3').setValue(2);

        const table = new Table('A1:C3', 'SalesTable', sheet);
        table.getColumn('A').setShowFilterButton(false).setTotalsRowLabel('Total');
        table.getColumn('B').setTotalsRowFunction('sum').setTotalsRowFormula('SUBTOTAL(109,[Amount])');
        table.getColumn('C').setColumnFormula('ROW()');

        const filterColumn = table.getAutoFilter().getColumn('B');
        filterColumn.setFilterType(AutoFilterColumn.AUTOFILTER_FILTERTYPE_DYNAMICFILTER);
        filterColumn.setAttribute('val', 1);
        filterColumn.setAttribute('maxVal', 31);
        filterColumn
            .createRule()
            .setRuleType(AutoFilterRule.AUTOFILTER_RULETYPE_DYNAMICFILTER)
            .setGrouping(AutoFilterRule.AUTOFILTER_RULETYPE_DYNAMIC_THISMONTH);

        const customColumn = table.getAutoFilter().getColumn('C');
        customColumn.setFilterType(AutoFilterColumn.AUTOFILTER_FILTERTYPE_CUSTOMFILTER);
        customColumn.setJoin(AutoFilterColumn.AUTOFILTER_COLUMN_JOIN_AND);
        customColumn
            .createRule()
            .setRuleType(AutoFilterRule.AUTOFILTER_RULETYPE_CUSTOMFILTER)
            .setOperator(AutoFilterRule.AUTOFILTER_COLUMN_RULE_GREATERTHAN)
            .setValue(0);

        const dxfs = new TableDxfsStyle('SalesDxfs');
        const headerStyle = new Style();
        headerStyle.getFill().setFillType('solid');
        headerStyle.getFill().getStartColor().setARGB('FF010203');
        dxfs.setHeaderRowStyle(headerStyle);
        table.getStyle().setTableDxfsStyle(dxfs);
        sheet.addTable(table);

        const copy = spreadsheet.copy();
        const copiedSheet = copy.getSheetByNameOrThrow('Data');
        const copiedTable = copiedSheet.getTableByName('salestable');

        expect(copiedTable).not.toBeNull();
        expect(copiedTable).not.toBe(table);
        expect(copiedTable!.getWorksheet()).toBe(copiedSheet);
        expect(copiedTable!.getRange()).toBe('A1:C3');

        expect(copiedTable!.getColumn('A').getShowFilterButton()).toBe(false);
        expect(copiedTable!.getColumn('A').getTotalsRowLabel()).toBe('Total');
        expect(copiedTable!.getColumn('B').getTotalsRowFunction()).toBe('sum');
        expect(copiedTable!.getColumn('B').getTotalsRowFormula()).toBe('SUBTOTAL(109,[Amount])');
        expect(copiedTable!.getColumn('C').getColumnFormula()).toBe('ROW()');

        const copiedFilterColumn = copiedTable!.getAutoFilter().getColumn('B');
        expect(copiedFilterColumn.getFilterType()).toBe(AutoFilterColumn.AUTOFILTER_FILTERTYPE_DYNAMICFILTER);
        expect(copiedFilterColumn.getAttribute('val')).toBe(1);
        expect(copiedFilterColumn.getAttribute('maxVal')).toBe(31);
        expect(copiedFilterColumn.getRules()[0]?.getGrouping()).toBe(
            AutoFilterRule.AUTOFILTER_RULETYPE_DYNAMIC_THISMONTH,
        );

        const copiedMergedStyle = new MergedCellStyle().getMergedStyle(copiedSheet, 'A1', true, false);
        expect(copiedMergedStyle.getFill().getStartColor().getARGB()).toBe('FF010203');

        const bytes = await new XlsxWriter(copy).writeBuffer();
        const zip = await unzipper.Open.buffer(Buffer.from(bytes));
        const tableEntry = zip.files.find((file) => file.path === 'xl/tables/table1.xml');
        const sheetEntry = zip.files.find((file) => file.path === 'xl/worksheets/sheet1.xml');

        expect(tableEntry).toBeDefined();
        expect(sheetEntry).toBeDefined();

        const tableXml = (await tableEntry!.buffer()).toString('utf-8');
        const sheetXml = (await sheetEntry!.buffer()).toString('utf-8');

        expect(tableXml).toContain('<dynamicFilter type="thisMonth" val="1" maxVal="31"/>');
        expect(tableXml).toContain('<calculatedColumnFormula>ROW()</calculatedColumnFormula>');
        expect(sheetXml).toContain('<tableParts');
    });
});
