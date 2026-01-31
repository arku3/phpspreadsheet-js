import { NamedRange } from '../src/core/named-range.ts';
import { Spreadsheet } from '../src/core/spreadsheet.ts';
import { XlsxWriter } from '../src/io/xlsx-writer.ts';
import { Table } from '../src/worksheet/table.ts';

const spreadsheet = new Spreadsheet();
const sheet = spreadsheet.getActiveSheet();
sheet.setTitle('Worksheet 1');

// Some header + data
sheet.getCell('A1').setValue('Product');
sheet.getCell('B1').setValue('Price');
sheet.getCell('A2').setValue('Widget');
sheet.getCell('B2').setValue(10);

// User-defined name + print area
spreadsheet.addNamedRange(new NamedRange('MyRange', sheet, 'A1:B2'));
sheet.getPageSetup().setPrintArea('C3:D4');

// Table
sheet.addTable(new Table('MyTable', 'A1:B2', sheet));

const filename = 'names-tables-demo.xlsx';
console.log(`Saving to ${filename}...`);
await new XlsxWriter(spreadsheet).save(filename);
console.log('Done!');
