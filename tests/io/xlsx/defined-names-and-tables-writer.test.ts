import { describe, expect, test } from 'bun:test';
import unzipper from 'unzipper';
import { NamedRange } from '../../../src/core/named-range.ts';
import { Spreadsheet } from '../../../src/core/spreadsheet.ts';
import { XlsxWriter } from '../../../src/io/xlsx-writer.ts';
import { Column as AutoFilterColumn } from '../../../src/worksheet/auto-filter/column.ts';
import { Rule as AutoFilterRule } from '../../../src/worksheet/auto-filter/column/rule.ts';
import { Table } from '../../../src/worksheet/table.ts';

describe('XlsxWriter: definedNames + tables', () => {
    const openZipFromUint8 = async (bytes: Uint8Array) => unzipper.Open.buffer(Buffer.from(bytes));

    const expectZipEntry = (zip: unzipper.CentralDirectory, zipPath: string) => {
        const entry = zip.files.find((f) => f.path === zipPath);
        expect(entry, `Expected zip entry to exist: ${zipPath}`).toBeDefined();
        return entry!;
    };

    test('workbook.xml includes <definedNames> with user-defined name and _xlnm.Print_Area', async () => {
        const spreadsheet = new Spreadsheet();
        const sheet = spreadsheet.getActiveSheet();

        spreadsheet.addNamedRange(new NamedRange('MyRange', sheet, 'A1:B2'));
        sheet.getPageSetup().setPrintArea('C3:D4');

        const bytes = await new XlsxWriter(spreadsheet).writeBuffer();
        const zip = await openZipFromUint8(bytes);

        const workbookXml = (await expectZipEntry(zip, 'xl/workbook.xml').buffer()).toString('utf-8');

        expect(workbookXml).toContain('<definedNames>');

        expect(workbookXml).toContain('name="MyRange"');
        expect(workbookXml).toContain("'Worksheet 1'!A1:B2");

        expect(workbookXml).toContain('name="_xlnm.Print_Area"');
        expect(workbookXml).toContain("'Worksheet 1'!$C$3:$D$4");
    });

    test('table writing emits table xml, worksheet tableParts, and worksheet relationship', async () => {
        const spreadsheet = new Spreadsheet();
        const sheet = spreadsheet.getActiveSheet();

        sheet.getCell('A1').setValue('Product');
        sheet.getCell('B1').setValue('Price');
        sheet.getCell('A2').setValue('Widget');
        sheet.getCell('B2').setValue(10);

        const table = new Table('A1:B2', 'MyTable', sheet);
        sheet.addTable(table);

        const bytes = await new XlsxWriter(spreadsheet).writeBuffer();
        const zip = await openZipFromUint8(bytes);

        expectZipEntry(zip, 'xl/tables/table1.xml');

        const sheet1Xml = (await expectZipEntry(zip, 'xl/worksheets/sheet1.xml').buffer()).toString('utf-8');
        expect(sheet1Xml).toContain('<tableParts');
        expect(sheet1Xml).toContain('r:id="rId_table_1"');

        const sheet1Rels = (await expectZipEntry(zip, 'xl/worksheets/_rels/sheet1.xml.rels').buffer()).toString(
            'utf-8',
        );
        expect(sheet1Rels).toContain('Id="rId_table_1"');
        expect(sheet1Rels).toContain('Target="../tables/table1.xml"');
    });

    test('table writing serializes table autoFilter metadata like PhpSpreadsheet', async () => {
        const spreadsheet = new Spreadsheet();
        const sheet = spreadsheet.getActiveSheet();

        sheet.getCell('A1').setValue('Product');
        sheet.getCell('B1').setValue('Price');
        sheet.getCell('C1').setValue('Date');
        sheet.getCell('D1').setValue('Rank');
        sheet.getCell('A2').setValue('Widget');
        sheet.getCell('B2').setValue(10);
        sheet.getCell('C2').setValue('2024-01-01');
        sheet.getCell('D2').setValue(1);
        sheet.getCell('A3').setValue('Gadget');
        sheet.getCell('B3').setValue(20);
        sheet.getCell('C3').setValue('2024-02-01');
        sheet.getCell('D3').setValue(2);

        const table = new Table('A1:D3', 'FilteredTable', sheet);
        table.getColumn('A').setShowFilterButton(false);

        const valueColumn = table.getAutoFilter().getColumn('B');
        valueColumn.setFilterType(AutoFilterColumn.AUTOFILTER_FILTERTYPE_FILTER);
        valueColumn.createRule().setRuleType(AutoFilterRule.AUTOFILTER_RULETYPE_FILTER).setValue('10');

        const customColumn = table.getAutoFilter().getColumn('C');
        customColumn.setFilterType(AutoFilterColumn.AUTOFILTER_FILTERTYPE_CUSTOMFILTER);
        customColumn.setJoin(AutoFilterColumn.AUTOFILTER_COLUMN_JOIN_AND);
        customColumn
            .createRule()
            .setRuleType(AutoFilterRule.AUTOFILTER_RULETYPE_CUSTOMFILTER)
            .setOperator(AutoFilterRule.AUTOFILTER_COLUMN_RULE_GREATERTHAN)
            .setValue('2024-01-01');
        customColumn
            .createRule()
            .setRuleType(AutoFilterRule.AUTOFILTER_RULETYPE_CUSTOMFILTER)
            .setOperator(AutoFilterRule.AUTOFILTER_COLUMN_RULE_LESSTHAN)
            .setValue('2024-12-31');

        const topColumn = table.getAutoFilter().getColumn('D');
        topColumn.setFilterType(AutoFilterColumn.AUTOFILTER_FILTERTYPE_TOPTENFILTER);
        topColumn
            .createRule()
            .setRuleType(AutoFilterRule.AUTOFILTER_RULETYPE_TOPTENFILTER)
            .setOperator(AutoFilterRule.AUTOFILTER_COLUMN_RULE_TOPTEN_PERCENT)
            .setGrouping(AutoFilterRule.AUTOFILTER_COLUMN_RULE_TOPTEN_BOTTOM)
            .setValue(25);

        sheet.addTable(table);

        const bytes = await new XlsxWriter(spreadsheet).writeBuffer();
        const zip = await openZipFromUint8(bytes);
        const tableXml = (await expectZipEntry(zip, 'xl/tables/table1.xml').buffer()).toString('utf-8');

        expect(tableXml).toContain('<autoFilter ref="A1:D3">');
        expect(tableXml).toContain('<filterColumn colId="0" hiddenButton="1"/>');
        expect(tableXml).toContain('<filterColumn colId="1">');
        expect(tableXml).toContain('<filters>');
        expect(tableXml).toContain('<filter val="10"/>');
        expect(tableXml).toContain('<filterColumn colId="2">');
        expect(tableXml).toContain('<customFilters and="1">');
        expect(tableXml).toContain('<customFilter operator="greaterThan" val="2024-01-01"/>');
        expect(tableXml).toContain('<customFilter operator="lessThan" val="2024-12-31"/>');
        expect(tableXml).toContain('<filterColumn colId="3">');
        expect(tableXml).toContain('<top10 top="0" percent="1" val="25"/>');
    });

    test('table writing serializes blank, date-group, and dynamic filters in table XML', async () => {
        const spreadsheet = new Spreadsheet();
        const sheet = spreadsheet.getActiveSheet();

        sheet.getCell('A1').setValue('Name');
        sheet.getCell('B1').setValue('Created');
        sheet.getCell('C1').setValue('Due');
        sheet.getCell('A2').setValue('');
        sheet.getCell('B2').setValue('2024-01-15');
        sheet.getCell('C2').setValue('2024-01-20');
        sheet.getCell('A3').setValue('Open');
        sheet.getCell('B3').setValue('2024-02-01');
        sheet.getCell('C3').setValue('2024-02-20');

        const table = new Table('A1:C3', 'AdvancedFilters', sheet);

        const blankColumn = table.getAutoFilter().getColumn('A');
        blankColumn.setFilterType(AutoFilterColumn.AUTOFILTER_FILTERTYPE_FILTER);
        blankColumn.createRule().setRuleType(AutoFilterRule.AUTOFILTER_RULETYPE_FILTER).setValue('');

        const dateGroupColumn = table.getAutoFilter().getColumn('B');
        dateGroupColumn.setFilterType(AutoFilterColumn.AUTOFILTER_FILTERTYPE_FILTER);
        dateGroupColumn
            .createRule()
            .setRuleType(AutoFilterRule.AUTOFILTER_RULETYPE_DATEGROUP)
            .setValue({ year: 2024, month: 1 });

        const dynamicColumn = table.getAutoFilter().getColumn('C');
        dynamicColumn.setFilterType(AutoFilterColumn.AUTOFILTER_FILTERTYPE_DYNAMICFILTER);
        dynamicColumn.setAttribute('val', 1);
        dynamicColumn.setAttribute('maxVal', 31);
        dynamicColumn
            .createRule()
            .setRuleType(AutoFilterRule.AUTOFILTER_RULETYPE_DYNAMICFILTER)
            .setGrouping(AutoFilterRule.AUTOFILTER_RULETYPE_DYNAMIC_THISMONTH);

        sheet.addTable(table);

        const bytes = await new XlsxWriter(spreadsheet).writeBuffer();
        const zip = await openZipFromUint8(bytes);
        const tableXml = (await expectZipEntry(zip, 'xl/tables/table1.xml').buffer()).toString('utf-8');

        expect(tableXml).toContain('<filterColumn colId="0">');
        expect(tableXml).toContain('<filters blank="1"/>');
        expect(tableXml).toContain('<filterColumn colId="1">');
        expect(tableXml).toContain('<dateGroupItem year="2024" month="1" dateTimeGrouping="month"/>');
        expect(tableXml).toContain('<filterColumn colId="2">');
        expect(tableXml).toContain('<dynamicFilter type="thisMonth" val="1" maxVal="31"/>');
    });
});
