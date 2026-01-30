import { Spreadsheet } from './src/core/spreadsheet.ts';
import { XlsxWriter } from './src/io/xlsx-writer.ts';

const spreadsheet = new Spreadsheet();
const sheet = spreadsheet.getActiveSheet();
sheet.getCell('A1').setValue('Product');
sheet.getCell('B1').setValue('Quantity');
sheet.getCell('A2').setValue('Widget A');
sheet.getCell('B2').setValue(10);

const writer = new XlsxWriter(spreadsheet);
await writer.save('test-output/inspect.xlsx');
console.log('File created');
