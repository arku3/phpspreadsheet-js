import { Spreadsheet } from './src/core/spreadsheet.ts';

const spreadsheet = new Spreadsheet();
console.log('After creation - count:', spreadsheet.getSheetCount());
console.log('Sheet 0 title:', spreadsheet.getSheet(0)?.getTitle());

// Remove sheet at index 0
spreadsheet.removeSheetByIndex(0);
console.log('After removal - count:', spreadsheet.getSheetCount());

// Create a new sheet
const newSheet = spreadsheet.createSheet();
newSheet.setTitle('TestSheet');
console.log('After create - count:', spreadsheet.getSheetCount());
console.log('Sheet 0 title:', spreadsheet.getSheet(0)?.getTitle());
