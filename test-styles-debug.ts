import { Spreadsheet } from './src/core/spreadsheet.ts';
import { XlsxWriter } from './src/io/xlsx-writer.ts';
import { XlsxReader } from './src/io/xlsx-reader.ts';

// Create XLSX file with styles
const spreadsheet = new Spreadsheet();
const sheet = spreadsheet.getActiveSheet();

// Cell with borders
const borderCell = sheet.getCell('A1');
borderCell.setValue('Borders');
borderCell.getStyle().getBorders().getTop().setBorderStyle('thin');
borderCell.getStyle().getBorders().getBottom().setBorderStyle('thin');
borderCell.getStyle().getBorders().getLeft().setBorderStyle('thin');
borderCell.getStyle().getBorders().getRight().setBorderStyle('thin');

// Cell with number format
const numCell = sheet.getCell('B1');
numCell.setValue(1234.56);
numCell.getStyle().getNumberFormat().setFormatCode('#,##0.00');

// Save
const writer = new XlsxWriter(spreadsheet);
await writer.save('test-output/debug-styles.xlsx');

// Now inspect the styles.xml
import unzipper from 'unzipper';
const zip = await unzipper.Open.file('test-output/debug-styles.xlsx');
const stylesFile = zip.files.find(f => f.path === 'xl/styles.xml');
if (stylesFile) {
    const content = await stylesFile.buffer();
    const xml = content.toString('utf-8');
    
    // Save to file for inspection
    await Bun.write('test-output/debug-styles-extracted.xml', xml);
    
    console.log('=== borders section ===');
    const borderMatches = xml.match(/<borders[^>]*>([\s\S]*?)<\/borders>/);
    if (borderMatches) {
        console.log(borderMatches[0].substring(0, 1000));
    }
    
    console.log('\n=== numFmts section ===');
    const numFmtMatches = xml.match(/<numFmts[^>]*>([\s\S]*?)<\/numFmts>/);
    if (numFmtMatches) {
        console.log(numFmtMatches[0]);
    }
    
    console.log('\n=== cellXfs section ===');
    const cellXfsMatches = xml.match(/<cellXfs[^>]*>([\s\S]*?)<\/cellXfs>/);
    if (cellXfsMatches) {
        console.log(cellXfsMatches[0].substring(0, 1500));
    }
}

console.log('\nDone! Check test-output/debug-styles-extracted.xml');
