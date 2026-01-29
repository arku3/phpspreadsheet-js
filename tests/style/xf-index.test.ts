import { describe, expect, test } from "bun:test";
import { Spreadsheet } from "../../src/core/spreadsheet.ts";
import { Style } from "../../src/style/style.ts";

describe("Xf Index Management", () => {
    test("Default style index", () => {
        const spreadsheet = new Spreadsheet();
        const sheet = spreadsheet.getActiveSheet();
        const cell = sheet.getCell("A1");
        
        expect(cell.getXfIndex()).toBe(0);
        expect(cell.getStyle()).toBeInstanceOf(Style);
        expect(cell.getStyle().getIndex()).toBe(0);
    });

    test("Adding new style to workbook", () => {
        const spreadsheet = new Spreadsheet();
        const style = new Style();
        spreadsheet.addCellXf(style);
        
        expect(style.getIndex()).toBe(1);
        expect(spreadsheet.getCellXfCollection()).toHaveLength(2);
        expect(spreadsheet.getCellXfByIndex(1)).toBe(style);
    });

    test("Applying style to cell", () => {
        const spreadsheet = new Spreadsheet();
        const style = new Style();
        style.getFont().setBold(true);
        spreadsheet.addCellXf(style);
        
        const sheet = spreadsheet.getActiveSheet();
        const cell = sheet.getCell("B2");
        cell.setXfIndex(style.getIndex());
        
        expect(cell.getXfIndex()).toBe(1);
        expect(cell.getStyle().getFont().getBold()).toBe(true);
    });

    test("Removing style updates cell indices", () => {
        const spreadsheet = new Spreadsheet();
        const style1 = new Style(); // Index 1
        const style2 = new Style(); // Index 2
        spreadsheet.addCellXf(style1);
        spreadsheet.addCellXf(style2);
        
        const sheet = spreadsheet.getActiveSheet();
        const cellA1 = sheet.getCell("A1"); // Index 0
        const cellB2 = sheet.getCell("B2"); // Index 1
        const cellC3 = sheet.getCell("C3"); // Index 2
        
        cellB2.setXfIndex(1);
        cellC3.setXfIndex(2);
        
        spreadsheet.removeCellXfByIndex(1); // Remove style1
        
        expect(spreadsheet.getCellXfCollection()).toHaveLength(2);
        expect(style2.getIndex()).toBe(1);
        
        expect(cellA1.getXfIndex()).toBe(0);
        expect(cellB2.getXfIndex()).toBe(0); // Reset to default
        expect(cellC3.getXfIndex()).toBe(1); // Decremented
    });
});
