import { Spreadsheet } from './src/core/spreadsheet.ts';
import { XlsxWriter } from './src/io/xlsx-writer.ts';
import { XlsxReader } from './src/io/xlsx-reader.ts';

// Create multi-sheet file
const spreadsheet = new Spreadsheet();
const sheet1 = spreadsheet.getActiveSheet();
sheet1.setTitle('Sheet1');
sheet1.getCell('A1').setValue('Data from Sheet1');

const sheet2 = spreadsheet.createSheet();
sheet2.setTitle('Sheet2');
sheet2.getCell('A1').setValue('Data from Sheet2');

console.log('Before write - Sheet count:', spreadsheet.getSheetCount());
for (const sheet of spreadsheet.getAllSheets()) {
    console.log('  Sheet:', sheet.getTitle());
}

const writer = new XlsxWriter(spreadsheet);
await writer.save('test-output/test-multi-debug.xlsx');

// Load and check
const reader = new XlsxReader();
const loaded = await reader.load('test-output/test-multi-debug.xlsx');

console.log('After load - Sheet count:', loaded.getSheetCount());
for (const sheet of loaded.getAllSheets()) {
    console.log('  Sheet:', sheet.getTitle());
}

const names = await reader.listWorksheetNames('test-output/test-multi-debug.xlsx');
console.log('Worksheet names:', names);
