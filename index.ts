import { Spreadsheet } from './src/core/spreadsheet.ts';

const spreadsheet = new Spreadsheet();
const sheet = spreadsheet.getActiveSheet();

sheet.setCellValue('A1', 10);
sheet.setCellValue('A2', 20);
sheet.setCellValue('A3', 30);
sheet.setCellValue('B1', '=SUM(A1:A3)');
sheet.setCellValue('B2', '=IF(A1>5, "High", "Low")');
sheet.setCellValue('B3', '=COUNT(A1:A3, "test", 40)');

console.log(`A1: ${sheet.getCell('A1').getValue()}`);
console.log(`B1: ${sheet.getCell('B1').getValue()}`);
console.log(`B2: ${sheet.getCell('B2').getValue()}`);
console.log(`B3: ${sheet.getCell('B3').getValue()}`);
