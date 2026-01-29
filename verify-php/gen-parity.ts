import { Spreadsheet } from '../src/core/spreadsheet.ts';
import { XlsxWriter } from '../src/io/xlsx-writer.ts';
import { Color } from '../src/style/color.ts';
import { Fill } from '../src/style/fill.ts';
import { CellValue } from '../src/style/conditional-formatting/wizard/cell-value.ts';

async function run() {
    const spreadsheet = new Spreadsheet();
    const sheet = spreadsheet.getActiveSheet();
    sheet.setTitle('FullParity');

    // 1. Fill Theme
    const styleA1 = sheet.getStyle('A1');
    styleA1.getFill().setFillType(Fill.FILL_SOLID);
    styleA1.getFill().getStartColor().setTheme(4); // Accent 1
    sheet.setCellValue('A1', 'Theme Fill');

    // 2. Font Theme
    const styleA2 = sheet.getStyle('A2');
    styleA2.getFont().getColor().setTheme(5); // Accent 2
    sheet.setCellValue('A2', 'Theme Font');

    // 3. Conditional Formatting
    sheet.setCellValue('B1', 10);
    sheet.setCellValue('B2', 50);
    const wizard = new CellValue('B1:B2');
    wizard.greaterThan(25);
    wizard.getStyle().getFont().setBold(true);
    wizard.getStyle().getFont().getColor().setARGB(Color.COLOR_RED);
    sheet.addConditionalFormatting(wizard.getCellRange(), wizard.getConditional());

    // 4. Border Theme
    const styleC1 = sheet.getStyle('C1');
    styleC1.getBorders().getBottom().setBorderStyle('thick');
    styleC1.getBorders().getBottom().getColor().setTheme(6);
    sheet.setCellValue('C1', 'Theme Border');

    const writer = new XlsxWriter(spreadsheet);
    await writer.save('full-parity-test.xlsx');
    console.log('full-parity-test.xlsx generated.');
}

run().catch(console.error);
