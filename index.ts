import { Spreadsheet } from './src/core/spreadsheet.ts';
import { Coordinate } from './src/utils/coordinate.ts';

const spreadsheet = new Spreadsheet();
const sheet = spreadsheet.getActiveSheet();

sheet.setCellValue('A1', 'Hello');
sheet.setCellValue('B1', 'World');
sheet.setCellValue('C1', 123);
sheet.setCellValue('D1', '=SUM(A1:C1)');

console.log(`Sheet: ${sheet.getTitle()}`);
const coordinates = sheet.getCellCollection().getCoordinates();

for (const coord of coordinates) {
    const cell = sheet.getCell(coord);
    console.log(`Cell ${coord}: value=${cell.getValue()}, type=${cell.getDataType()}`);
}

// Test coordinate utility
const [col, row] = Coordinate.coordinateFromString('Z10');
console.log(`Z10 -> Col: ${col}, Row: ${row}`);
console.log(`Col ${col}, Row ${row} -> ${Coordinate.stringFromCoordinate(col, row)}`);
