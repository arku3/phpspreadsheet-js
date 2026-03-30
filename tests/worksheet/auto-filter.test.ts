import { describe, expect, test } from 'bun:test';
import { Spreadsheet } from '../../src/core/spreadsheet.ts';
import { Worksheet } from '../../src/core/worksheet.ts';
import { Column } from '../../src/worksheet/auto-filter/column.ts';
import { Rule } from '../../src/worksheet/auto-filter/column/rule.ts';

describe('AutoFilter', () => {
    test('showHideRows simple filter', () => {
        const spreadsheet = new Spreadsheet();
        const sheet = spreadsheet.getActiveSheet();

        // Data:
        // A1: Header
        // A2: Apple
        // A3: Banana
        // A4: Cherry
        // A5: Apple
        sheet.setCellValue('A1', 'Fruit');
        sheet.setCellValue('A2', 'Apple');
        sheet.setCellValue('A3', 'Banana');
        sheet.setCellValue('A4', 'Cherry');
        sheet.setCellValue('A5', 'Apple');

        const autoFilter = sheet.getAutoFilter();
        autoFilter.setRange('A1:A5');

        // Filter for "Apple"
        autoFilter
            .getColumn('A')
            .setFilterType(Column.AUTOFILTER_FILTERTYPE_FILTER)
            .createRule()
            .setRuleType(Rule.AUTOFILTER_RULETYPE_FILTER)
            .setValue('Apple');

        autoFilter.showHideRows();

        expect(sheet.getRowDimension(1).getVisible()).toBe(true);
        expect(sheet.getRowDimension(2).getVisible()).toBe(true);
        expect(sheet.getRowDimension(3).getVisible()).toBe(false);
        expect(sheet.getRowDimension(4).getVisible()).toBe(false);
        expect(sheet.getRowDimension(5).getVisible()).toBe(true);
    });

    test('showHideRows custom filter with wildcard', () => {
        const spreadsheet = new Spreadsheet();
        const sheet = spreadsheet.getActiveSheet();

        sheet.setCellValue('A1', 'Name');
        sheet.setCellValue('A2', 'Alice');
        sheet.setCellValue('A3', 'Bob');
        sheet.setCellValue('A4', 'Charlie');
        sheet.setCellValue('A5', 'David');

        const autoFilter = sheet.getAutoFilter();
        autoFilter.setRange('A1:A5');

        // Filter for names starting with "C" or containing "o"
        autoFilter
            .getColumn('A')
            .setFilterType(Column.AUTOFILTER_FILTERTYPE_CUSTOMFILTER)
            .setJoin(Column.AUTOFILTER_COLUMN_JOIN_OR);

        autoFilter.getColumn('A').createRule().setOperator(Rule.AUTOFILTER_COLUMN_RULE_EQUAL).setValue('C*');

        autoFilter.getColumn('A').createRule().setOperator(Rule.AUTOFILTER_COLUMN_RULE_EQUAL).setValue('*o*');

        autoFilter.showHideRows();

        // Alice: No
        // Bob: Yes (contains 'o')
        // Charlie: Yes (starts with 'C')
        // David: No
        expect(sheet.getRowDimension(2).getVisible()).toBe(false);
        expect(sheet.getRowDimension(3).getVisible()).toBe(true);
        expect(sheet.getRowDimension(4).getVisible()).toBe(true);
        expect(sheet.getRowDimension(5).getVisible()).toBe(false);
    });

    test('showHideRows top ten filter', () => {
        const spreadsheet = new Spreadsheet();
        const sheet = spreadsheet.getActiveSheet();

        sheet.setCellValue('A1', 'Score');
        sheet.setCellValue('A2', 10);
        sheet.setCellValue('A3', 20);
        sheet.setCellValue('A4', 30);
        sheet.setCellValue('A5', 40);
        sheet.setCellValue('A6', 50);

        const autoFilter = sheet.getAutoFilter();
        autoFilter.setRange('A1:A6');

        // Filter top 2
        autoFilter
            .getColumn('A')
            .setFilterType(Column.AUTOFILTER_FILTERTYPE_TOPTENFILTER)
            .createRule()
            .setRuleType(Rule.AUTOFILTER_RULETYPE_TOPTENFILTER)
            .setOperator(Rule.AUTOFILTER_COLUMN_RULE_TOPTEN_BY_VALUE)
            .setGrouping(Rule.AUTOFILTER_COLUMN_RULE_TOPTEN_TOP)
            .setValue(2);

        autoFilter.showHideRows();

        expect(sheet.getRowDimension(2).getVisible()).toBe(false); // 10
        expect(sheet.getRowDimension(3).getVisible()).toBe(false); // 20
        expect(sheet.getRowDimension(4).getVisible()).toBe(false); // 30
        expect(sheet.getRowDimension(5).getVisible()).toBe(true); // 40
        expect(sheet.getRowDimension(6).getVisible()).toBe(true); // 50
    });

    test('showHideRows auto-extend range', () => {
        const spreadsheet = new Spreadsheet();
        const sheet = spreadsheet.getActiveSheet();

        sheet.setCellValue('A1', 'Fruit');
        sheet.setCellValue('A2', 'Apple');
        sheet.setCellValue('A3', 'Banana');
        // Empty row A4 will stop extension if we use auto-extend logic
        sheet.setCellValue('A5', 'Apple');

        const autoFilter = sheet.getAutoFilter();
        autoFilter.setRange('A1:A1'); // Single row header

        autoFilter.getColumn('A').setFilterType(Column.AUTOFILTER_FILTERTYPE_FILTER).createRule().setValue('Apple');

        autoFilter.showHideRows();

        // Should have extended to A3 because A4 is empty
        expect(autoFilter.getRange()).toBe('A1:A3');
        expect(sheet.getRowDimension(2).getVisible()).toBe(true);
        expect(sheet.getRowDimension(3).getVisible()).toBe(false);
        // A5 should not be affected because it's beyond the extended range
        expect(sheet.rowDimensionExists(5)).toBe(false);
    });

    test('setRangeToMaxRow expands range to highest row', () => {
        const spreadsheet = new Spreadsheet();
        const sheet = spreadsheet.getActiveSheet();

        sheet.setCellValue('A1', 'Header');
        sheet.setCellValue('A4', 'Data');

        const autoFilter = sheet.getAutoFilter();
        autoFilter.setRange('A1:A1');
        autoFilter.setRangeToMaxRow();

        expect(autoFilter.getRange()).toBe('A1:A4');
    });

    test('sheet title extraction matches PhpSpreadsheet quoting behavior', () => {
        expect(Worksheet.extractSheetTitle("'Quarter!1'!A1:B2", true, true)).toEqual(['Quarter!1', 'A1:B2']);
        expect(Worksheet.extractSheetTitle("'O''Brien'!A1", true, true)).toEqual(["O'Brien", 'A1']);
    });

    test('autofilter accepts sheet-qualified ranges with quoted titles', () => {
        const spreadsheet = new Spreadsheet();
        const sheet = spreadsheet.getActiveSheet();
        sheet.setTitle('Quarter!1');

        const autoFilter = sheet.getAutoFilter();
        autoFilter.setRange("'Quarter!1'!$A$1:$B$5");

        expect(autoFilter.getRange()).toBe('A1:B5');
        expect(() => autoFilter.getColumn('A')).not.toThrow();
        expect(() => autoFilter.getColumn('B')).not.toThrow();
    });
});
