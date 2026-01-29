import { Spreadsheet } from "../src/core/spreadsheet.ts";
import { XlsxWriter } from "../src/io/xlsx-writer.ts";
import { Fill } from "../src/style/fill.ts";
import { Color } from "../src/style/color.ts";
import { Alignment } from "../src/style/alignment.ts";

async function main() {
    const spreadsheet = new Spreadsheet();
    const sheet = spreadsheet.getActiveSheet();
    sheet.setTitle("Demo Sheet");

    // 1. Basic data
    sheet.setCellValue("A1", "Hello");
    sheet.setCellValue("B1", "World");
    sheet.setCellValue("A2", 123.45);
    sheet.setCellValue("B2", "=A2*2");

    // 2. Styling via supervisor
    const styleA1 = sheet.getStyle("A1");
    styleA1.getFont().setBold(true).setSize(14).getColor().setRGB("00FF00");
    styleA1.getFill().setFillType(Fill.FILL_SOLID).getStartColor().setRGB("0000FF");
    styleA1.getAlignment().setHorizontal(Alignment.HORIZONTAL_CENTER);

    // 3. Dimensions
    sheet.getColumnDimension("A").setWidth(20);
    sheet.getRowDimension(1).setRowHeight(30);

    // 4. Multiple Sheets
    const sheet2 = spreadsheet.createSheet("Second Sheet");
    sheet2.setCellValue("A1", "This is sheet 2");

    // 5. Save
    const writer = new XlsxWriter(spreadsheet);
    writer.setPreCalculateFormulas(true);
    const filename = "demo.xlsx";
    console.log(`Saving to ${filename}...`);
    await writer.save(filename);
    console.log("Done!");
}

main().catch(console.error);
