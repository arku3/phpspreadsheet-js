import { describe, expect, test } from "bun:test";
import { Spreadsheet } from "../../src/core/spreadsheet.ts";
import { Worksheet } from "../../src/core/worksheet.ts";

describe("Worksheet Merged Cells", () => {
    test("mergeCells basic functionality", () => {
        const spreadsheet = new Spreadsheet();
        const sheet = spreadsheet.getActiveSheet();
        
        sheet.setCellValue("A1", "Top Left");
        sheet.setCellValue("B1", "Will be cleared");
        
        sheet.mergeCells("A1:B2");
        
        const mergeCells = sheet.getMergeCells();
        expect(mergeCells["A1:B2"]).toBe("A1:B2");
        expect(Object.keys(mergeCells).length).toBe(1);
        
        // Non-top-left cells should be cleared
        expect(sheet.getCell("B1").getValue()).toBe(null);
        expect(sheet.getCell("A2").getValue()).toBe(null);
        expect(sheet.getCell("B2").getValue()).toBe(null);
        expect(sheet.getCell("A1").getValue()).toBe("Top Left");
    });

    test("unmergeCells", () => {
        const spreadsheet = new Spreadsheet();
        const sheet = spreadsheet.getActiveSheet();
        
        sheet.mergeCells("A1:C1");
        expect(sheet.getMergeCells()["A1:C1"]).toBe("A1:C1");
        
        sheet.unmergeCells("A1:C1");
        expect(sheet.getMergeCells()["A1:C1"]).toBe(undefined);
    });

    test("mergeCells case insensitive and normalization", () => {
        const spreadsheet = new Spreadsheet();
        const sheet = spreadsheet.getActiveSheet();
        
        sheet.mergeCells("a1:b1");
        expect(sheet.getMergeCells()["A1:B1"]).toBe("A1:B1");
    });
});
