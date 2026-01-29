import { describe, expect, test } from "bun:test";
import { Spreadsheet } from "../../src/core/spreadsheet.ts";
import { Style } from "../../src/style/style.ts";
import { Fill } from "../../src/style/fill.ts";

describe("Style Supervisor", () => {
    test("getStyle returns supervisor and sets selected cells", () => {
        const spreadsheet = new Spreadsheet();
        const sheet = spreadsheet.getActiveSheet();
        const style = sheet.getStyle("A1");

        expect(style.getIsSupervisor()).toBe(true);
        expect(sheet.getSelectedCells()).toBe("A1");
    });

    test("Modifying supervisor style updates cell xfIndex", () => {
        const spreadsheet = new Spreadsheet();
        const sheet = spreadsheet.getActiveSheet();
        const cellA1 = sheet.getCell("A1");
        
        const initialIndex = cellA1.getXfIndex();
        expect(initialIndex).toBe(0); // Default style

        // Apply bold via supervisor
        sheet.getStyle("A1").getFont().setBold(true);

        const newIndex = cellA1.getXfIndex();
        expect(newIndex).not.toBe(initialIndex);
        expect(newIndex).toBe(1);

        const styleA1 = spreadsheet.getCellXfByIndex(newIndex);
        expect(styleA1.getFont().getBold()).toBe(true);
    });

    test("Styles are reused when hash matches", () => {
        const spreadsheet = new Spreadsheet();
        const sheet = spreadsheet.getActiveSheet();
        
        // A1 bold
        sheet.getStyle("A1").getFont().setBold(true);
        const indexA1 = sheet.getCell("A1").getXfIndex();
        expect(indexA1).toBe(1);

        // B1 bold (same style)
        sheet.getStyle("B1").getFont().setBold(true);
        const indexB1 = sheet.getCell("B1").getXfIndex();
        
        expect(indexB1).toBe(indexA1);
        expect(spreadsheet.getCellXfCollection().length).toBe(2); // Default (0) + Bold (1)
    });

    test("Range based style application", () => {
        const spreadsheet = new Spreadsheet();
        const sheet = spreadsheet.getActiveSheet();
        
        // Apply fill to range A1:B2
        sheet.getStyle("A1:B2").getFill().applyFromArray({
            fillType: Fill.FILL_SOLID,
            startColor: { rgb: "FFFF00" }
        });

        expect(sheet.getCell("A1").getXfIndex()).toBe(1);
        expect(sheet.getCell("A2").getXfIndex()).toBe(1);
        expect(sheet.getCell("B1").getXfIndex()).toBe(1);
        expect(sheet.getCell("B2").getXfIndex()).toBe(1);
        expect(sheet.getCell("C1").getXfIndex()).toBe(0); // Outside range

        const style = spreadsheet.getCellXfByIndex(1);
        expect(style.getFill().getFillType()).toBe(Fill.FILL_SOLID);
        expect(style.getFill().getStartColor().getRGB()).toBe("FFFF00");
    });

    test("Supervisor getter returns shared component value", () => {
        const spreadsheet = new Spreadsheet();
        const sheet = spreadsheet.getActiveSheet();
        
        // Set A1 to bold manually (non-supervisor way just for setup, though we usually use supervisor)
        const workbook = spreadsheet;
        const boldStyle = workbook.getDefaultStyle().clone();
        boldStyle.getFont().setBold(true);
        workbook.addCellXf(boldStyle);
        sheet.getCell("A1").setXfIndex(boldStyle.getIndex());

        // Get via supervisor
        const supervisor = sheet.getStyle("A1");
        expect(supervisor.getFont().getBold()).toBe(true);
        
        // B1 is still default
        sheet.setSelectedCells("B1");
        expect(supervisor.getFont().getBold()).toBe(false);
    });
});
