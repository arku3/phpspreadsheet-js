import { expect, test, describe } from "bun:test";
import { Spreadsheet } from "../../src/core/spreadsheet.ts";
import { Style } from "../../src/style/style.ts";

describe("Spreadsheet Garbage Collection", () => {
    test("garbageCollect removes unused styles and remaps used ones", () => {
        const spreadsheet = new Spreadsheet();
        const sheet = spreadsheet.getActiveSheet();

        // Initial state: index 0 is default style
        expect(spreadsheet.getCellXfCollection().length).toBe(1);

        // Add some styles
        const style1 = new Style();
        style1.getFont().setBold(true as any);
        spreadsheet.addCellXf(style1); // Index 1

        const style2 = new Style();
        style2.getFont().setItalic(true as any);
        spreadsheet.addCellXf(style2); // Index 2

        const style3 = new Style();
        style3.getFont().setUnderline(true as any);
        spreadsheet.addCellXf(style3); // Index 3

        expect(spreadsheet.getCellXfCollection().length).toBe(4);

        // Use index 1 in a cell
        sheet.getCell("A1").setXfIndex(1);

        // Use index 3 in a row dimension
        sheet.getRowDimension(1).setXfIndex(3);

        // Style index 2 is unused.

        spreadsheet.garbageCollect();

        // After garbage collection:
        // Index 0 (default) - kept (mapped to 0)
        // Index 1 (bold) - kept (mapped to 1)
        // Index 2 (italic) - removed
        // Index 3 (underline) - kept (mapped to 2)

        const collection = spreadsheet.getCellXfCollection();
        expect(collection.length).toBe(3);
        
        expect(collection[0]!.getHashCode()).toBe(new Style().getHashCode());
        expect(collection[1]!.getFont().getBold()).toBe(true as any);
        expect(collection[2]!.getFont().getUnderline()).toBe(true as any);

        // Verify cell re-mapping
        expect(sheet.getCell("A1").getXfIndex()).toBe(1);

        // Verify row dimension re-mapping
        expect(sheet.getRowDimension(1).getXfIndex()).toBe(2);
    });

    test("garbageCollect handles column dimensions", () => {
        const spreadsheet = new Spreadsheet();
        const sheet = spreadsheet.getActiveSheet();

        const style1 = new Style();
        style1.getFont().setBold(true as any);
        spreadsheet.addCellXf(style1); // Index 1

        sheet.getColumnDimension("A").setXfIndex(1);

        spreadsheet.garbageCollect();

        expect(spreadsheet.getCellXfCollection().length).toBe(2);
        expect(sheet.getColumnDimension("A").getXfIndex()).toBe(1);
    });

    test("garbageCollect always keeps index 0", () => {
        const spreadsheet = new Spreadsheet();
        // Index 0 is not used anywhere else
        
        spreadsheet.garbageCollect();
        
        expect(spreadsheet.getCellXfCollection().length).toBe(1);
        expect(spreadsheet.getCellXfCollection()[0]).toBeDefined();
    });
});
