import { describe, expect, test } from 'bun:test';
import { Spreadsheet } from '../../../src/core/spreadsheet.ts';
import { XlsxReader } from '../../../src/io/xlsx-reader.ts';
import { XlsxWriter } from '../../../src/io/xlsx-writer.ts';
import { Column } from '../../../src/worksheet/auto-filter/column.ts';
import { Rule } from '../../../src/worksheet/auto-filter/column/rule.ts';

async function roundTrip(spreadsheet: Spreadsheet): Promise<Spreadsheet> {
    const bytes = await new XlsxWriter(spreadsheet).writeBuffer();
    return new XlsxReader().loadFromBuffer(bytes);
}

function seedA1C6(sheet: ReturnType<Spreadsheet['getActiveSheet']>): void {
    const data: Array<[string, string | number, string | number | null]> = [
        ['Product', 'Qty', 'When'],
        ['Apple', 5, '2026-01-01'],
        ['Banana', 12, '2026-01-05'],
        ['Cherry', 18, '2026-01-08'],
        ['Apple', 22, '2026-01-10'],
        ['', 15, '2026-01-15'],
    ];

    for (let r = 0; r < data.length; r++) {
        const row = data[r]!;
        sheet.setCellValue(`A${r + 1}`, row[0]);
        sheet.setCellValue(`B${r + 1}`, row[1]);
        sheet.setCellValue(`C${r + 1}`, row[2]);
    }
}

describe('XlsxReader: AutoFilter rule reading', () => {
    test('filters + blank', async () => {
        const spreadsheet = new Spreadsheet();
        const sheet = spreadsheet.getActiveSheet();
        seedA1C6(sheet);

        const autoFilter = sheet.getAutoFilter();
        autoFilter.setRange('A1:C6');

        const colA = autoFilter.getColumn('A').setFilterType(Column.AUTOFILTER_FILTERTYPE_FILTER);
        colA.setAttribute('blank', 1);
        colA.createRule().setRuleType(Rule.AUTOFILTER_RULETYPE_FILTER).setValue('Apple');
        colA.createRule().setRuleType(Rule.AUTOFILTER_RULETYPE_FILTER).setValue('Banana');

        const loaded = await roundTrip(spreadsheet);
        const loadedSheet = loaded.getActiveSheet();

        expect(loadedSheet.getAutoFilter().getRange()).toBe('A1:C6');

        const loadedA = loadedSheet.getAutoFilter().getColumn('A');
        expect(loadedA.getFilterType()).toBe(Column.AUTOFILTER_FILTERTYPE_FILTER);
        expect(loadedA.getAttribute('blank')).toBe(1);

        const values = loadedA
            .getRules()
            .map((r) => {
                expect(r.getRuleType()).toBe(Rule.AUTOFILTER_RULETYPE_FILTER);
                return String(r.getValue());
            })
            .sort();
        expect(values).toEqual(['Apple', 'Banana']);
    });

    test('custom filters AND', async () => {
        const spreadsheet = new Spreadsheet();
        const sheet = spreadsheet.getActiveSheet();
        seedA1C6(sheet);

        const autoFilter = sheet.getAutoFilter();
        autoFilter.setRange('A1:C6');

        const colB = autoFilter
            .getColumn('B')
            .setFilterType(Column.AUTOFILTER_FILTERTYPE_CUSTOMFILTER)
            .setJoin(Column.AUTOFILTER_COLUMN_JOIN_AND);
        colB.createRule().setOperator(Rule.AUTOFILTER_COLUMN_RULE_GREATERTHAN).setValue(10);
        colB.createRule().setOperator(Rule.AUTOFILTER_COLUMN_RULE_LESSTHAN).setValue(20);

        const loaded = await roundTrip(spreadsheet);
        const loadedSheet = loaded.getActiveSheet();

        expect(loadedSheet.getAutoFilter().getRange()).toBe('A1:C6');

        const loadedB = loadedSheet.getAutoFilter().getColumn('B');
        expect(loadedB.getFilterType()).toBe(Column.AUTOFILTER_FILTERTYPE_CUSTOMFILTER);
        expect(loadedB.getJoin()).toBe(Column.AUTOFILTER_COLUMN_JOIN_AND);

        const rules = loadedB.getRules();
        expect(rules.length).toBe(2);
        expect(rules[0]!.getRuleType()).toBe(Rule.AUTOFILTER_RULETYPE_CUSTOMFILTER);
        expect(rules[1]!.getRuleType()).toBe(Rule.AUTOFILTER_RULETYPE_CUSTOMFILTER);

        const operators = rules.map((r) => r.getOperator()).sort();
        expect(operators).toEqual([Rule.AUTOFILTER_COLUMN_RULE_GREATERTHAN, Rule.AUTOFILTER_COLUMN_RULE_LESSTHAN]);
        const values = rules.map((r) => Number(r.getValue())).sort((a, b) => a - b);
        expect(values).toEqual([10, 20]);
    });

    test('dynamic filter', async () => {
        const spreadsheet = new Spreadsheet();
        const sheet = spreadsheet.getActiveSheet();
        seedA1C6(sheet);

        const autoFilter = sheet.getAutoFilter();
        autoFilter.setRange('A1:C6');

        const colC = autoFilter.getColumn('C').setFilterType(Column.AUTOFILTER_FILTERTYPE_DYNAMICFILTER);
        colC.setAttribute('val', 1);
        colC.setAttribute('maxVal', 2);
        colC.createRule()
            .setRuleType(Rule.AUTOFILTER_RULETYPE_DYNAMICFILTER)
            .setGrouping(Rule.AUTOFILTER_RULETYPE_DYNAMIC_THISWEEK);

        const loaded = await roundTrip(spreadsheet);
        const loadedSheet = loaded.getActiveSheet();

        expect(loadedSheet.getAutoFilter().getRange()).toBe('A1:C6');

        const loadedC = loadedSheet.getAutoFilter().getColumn('C');
        expect(loadedC.getFilterType()).toBe(Column.AUTOFILTER_FILTERTYPE_DYNAMICFILTER);
        expect(loadedC.getAttribute('val')).toBe(1);
        expect(loadedC.getAttribute('maxVal')).toBe(2);

        const rules = loadedC.getRules();
        expect(rules.length).toBe(1);
        expect(rules[0]!.getRuleType()).toBe(Rule.AUTOFILTER_RULETYPE_DYNAMICFILTER);
        expect(rules[0]!.getGrouping()).toBe(Rule.AUTOFILTER_RULETYPE_DYNAMIC_THISWEEK);
    });

    test('top10', async () => {
        const spreadsheet = new Spreadsheet();
        const sheet = spreadsheet.getActiveSheet();
        seedA1C6(sheet);

        const autoFilter = sheet.getAutoFilter();
        autoFilter.setRange('A1:C6');

        const colA = autoFilter.getColumn('A').setFilterType(Column.AUTOFILTER_FILTERTYPE_TOPTENFILTER);
        colA.setAttribute('maxVal', 123.45);
        colA.createRule()
            .setRuleType(Rule.AUTOFILTER_RULETYPE_TOPTENFILTER)
            .setOperator(Rule.AUTOFILTER_COLUMN_RULE_TOPTEN_PERCENT)
            .setGrouping(Rule.AUTOFILTER_COLUMN_RULE_TOPTEN_BOTTOM)
            .setValue(15);

        const loaded = await roundTrip(spreadsheet);
        const loadedSheet = loaded.getActiveSheet();

        expect(loadedSheet.getAutoFilter().getRange()).toBe('A1:C6');

        const loadedA = loadedSheet.getAutoFilter().getColumn('A');
        expect(loadedA.getFilterType()).toBe(Column.AUTOFILTER_FILTERTYPE_TOPTENFILTER);
        expect(loadedA.getAttribute('maxVal')).toBe(123.45);

        const rules = loadedA.getRules();
        expect(rules.length).toBe(1);
        expect(rules[0]!.getRuleType()).toBe(Rule.AUTOFILTER_RULETYPE_TOPTENFILTER);
        expect(rules[0]!.getOperator()).toBe(Rule.AUTOFILTER_COLUMN_RULE_TOPTEN_PERCENT);
        expect(rules[0]!.getGrouping()).toBe(Rule.AUTOFILTER_COLUMN_RULE_TOPTEN_BOTTOM);
        expect(rules[0]!.getValue()).toBe(15);
    });
});
