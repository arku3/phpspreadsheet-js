import { describe, expect, test } from 'bun:test';
import unzipper from 'unzipper';
import { NamedRange } from '../../../src/core/named-range.ts';
import { Spreadsheet } from '../../../src/core/spreadsheet.ts';
import { XlsxWriter } from '../../../src/io/xlsx-writer.ts';
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

        const table = new Table('MyTable', 'A1:B2', sheet);
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
});
