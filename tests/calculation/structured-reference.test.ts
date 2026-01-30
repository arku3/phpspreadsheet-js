import { expect, test, describe, beforeEach } from "bun:test";
import { Spreadsheet } from "../../src/core/spreadsheet.ts";
import { Calculation } from "../../src/calculation/calculation.ts";
import { Table } from "../../src/worksheet/table.ts";

describe("Structured References", () => {
    let spreadsheet: Spreadsheet;
    let calculation: Calculation;

    beforeEach(() => {
        spreadsheet = new Spreadsheet();
        calculation = new Calculation();
    });

    test("Evaluate Structured Reference [@Column]", () => {
        const sheet = spreadsheet.getActiveSheet();
        
        // Setup Table data
        sheet.setCellValue("A1", "Product");
        sheet.setCellValue("B1", "Price");
        sheet.setCellValue("A2", "Apple");
        sheet.setCellValue("B2", 10);
        sheet.setCellValue("A3", "Orange");
        sheet.setCellValue("B3", 20);

        // Create Table
        const table = new Table("Sales", "A1:B3", sheet);
        table.addColumn("Product");
        table.addColumn("Price");
        sheet.addTable(table);

        // Formula using structured reference for current row
        const formula = "=Sales[@Price] * 2";
        
        // B2 is 10, so result at row 2 should be 20
        const resultRow2 = calculation.calculateFormula(formula, sheet, "C2");
        expect(resultRow2).toBe(20);

        // B3 is 20, so result at row 3 should be 40
        const resultRow3 = calculation.calculateFormula(formula, sheet, "C3");
        expect(resultRow3).toBe(40);
    });

    test("Evaluate Structured Reference [[#This Row],[Column]]", () => {
        const sheet = spreadsheet.getActiveSheet();

        // Setup Table data
        sheet.setCellValue("A1", "Product");
        sheet.setCellValue("B1", "Price");
        sheet.setCellValue("A2", "Apple");
        sheet.setCellValue("B2", 10);
        sheet.setCellValue("A3", "Orange");
        sheet.setCellValue("B3", 20);

        // Create Table
        const table = new Table("Sales", "A1:B3", sheet);
        table.addColumn("Product");
        table.addColumn("Price");
        sheet.addTable(table);

        const formula = "=Sales[[#This Row],[Price]] * 2";

        const resultRow2 = calculation.calculateFormula(formula, sheet, "C2");
        expect(resultRow2).toBe(20);

        const resultRow3 = calculation.calculateFormula(formula, sheet, "C3");
        expect(resultRow3).toBe(40);
    });

    test("Evaluate Structured Reference [Column] (Range)", () => {
        const sheet = spreadsheet.getActiveSheet();
        
        sheet.setCellValue("A1", "Val");
        sheet.setCellValue("A2", 10);
        sheet.setCellValue("A3", 20);
        sheet.setCellValue("A4", 30);

        const table = new Table("Table1", "A1:A4", sheet);
        table.addColumn("Val");
        sheet.addTable(table);

        const formula = "=SUM(Table1[Val])";
        const result = calculation.calculateFormula(formula, sheet, "B1");
        expect(result).toBe(60);
    });

    test("Evaluate Structured Reference with Specifiers [#Data]", () => {
        const sheet = spreadsheet.getActiveSheet();
        
        sheet.setCellValue("A1", "Header");
        sheet.setCellValue("A2", 100);
        sheet.setCellValue("A3", 200);
        sheet.setCellValue("A4", "Total");

        const table = new Table("Table2", "A1:A4", sheet);
        table.addColumn("Header");
        table.showTotals(true);
        sheet.addTable(table);

        // [#Data] should only include 100 and 200
        const formula = "=SUM(Table2[#Data])";
        const result = calculation.calculateFormula(formula, sheet, "B1");
        expect(result).toBe(300);
    });
});
