import { Spreadsheet } from './src/core/spreadsheet.ts';
import { XlsxWriter } from './src/io/xlsx-writer.ts';
import { Border } from './src/style/border.ts';
import { CellValue } from './src/style/conditional-formatting/wizard/cell-value.ts';
import { TextValue } from './src/style/conditional-formatting/wizard/text-value.ts';
import { Fill } from './src/style/fill.ts';

async function run() {
    const spreadsheet = new Spreadsheet();
    const sheet = spreadsheet.getActiveSheet();
    sheet.setTitle('Verification');

    // 1. Basic Styles & Themes
    const cellA1 = sheet.getCell('A1');
    cellA1.setValue('Theme Test');
    const styleA1 = sheet.getStyle('A1');
    styleA1.getFont().setBold(true);
    styleA1.getFont().getColor().setTheme(4); // Accent 1

    const cellA2 = sheet.getCell('A2');
    cellA2.setValue('Fill Test');
    const styleA2 = sheet.getStyle('A2');
    styleA2.getFill().setFillType(Fill.FILL_SOLID);
    styleA2.getFill().getStartColor().setTheme(5); // Accent 2

    // 2. Borders
    const cellA3 = sheet.getCell('A3');
    cellA3.setValue('Border Test');
    const styleA3 = sheet.getStyle('A3');
    styleA3.getBorders().getBottom().setBorderStyle(Border.BORDER_THICK);
    styleA3.getBorders().getBottom().getColor().setTheme(6); // Accent 3

    // 3. Conditional Formatting Wizards
    // Cell Value Wizard
    const cellValueWizard = new CellValue('B1:B10');
    cellValueWizard.greaterThan(50);
    cellValueWizard.getStyle().getFont().setBold(true);
    cellValueWizard.getStyle().getFont().getColor().setARGB('FFFF0000');
    sheet.addConditionalFormatting(cellValueWizard.getCellRange(), cellValueWizard.getConditional());

    for (let i = 1; i <= 10; i++) {
        sheet.setCellValue(`B${i}`, i * 10);
    }

    // Text Value Wizard
    const textValueWizard = new TextValue('C1:C5');
    textValueWizard.contains('error');
    textValueWizard.getStyle().getFill().setFillType(Fill.FILL_SOLID);
    textValueWizard.getStyle().getFill().getStartColor().setARGB('FFFFFF00');
    sheet.addConditionalFormatting(textValueWizard.getCellRange(), textValueWizard.getConditional());

    sheet.setCellValue('C1', 'no problem');
    sheet.setCellValue('C2', 'this is an error');
    sheet.setCellValue('C3', 'errors everywhere');

    // 4. Metadata
    spreadsheet
        .getProperties()
        .setCreator('OpenCode Agent')
        .setTitle('Writer Verification File')
        .setSubject('Style and CF Parity');

    // 5. Security
    spreadsheet.getSecurity().setLockWindows(true);
    spreadsheet.getSecurity().setWorkbookPassword('secret');

    const writer = new XlsxWriter(spreadsheet);
    await writer.save('demo.xlsx');
    console.log('Generated demo.xlsx');
}

run().catch(console.error);
