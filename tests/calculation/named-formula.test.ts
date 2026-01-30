import { expect, test, describe, beforeEach } from "bun:test";
import { Spreadsheet } from "../../src/core/spreadsheet.ts";
import { DefinedName } from "../../src/core/defined-name.ts";

// Create a concrete class for testing DefinedName if needed, 
// but Spreadsheet already uses NamedRange which extends it.
import { NamedRange } from "../../src/core/named-range.ts";

describe("Named Formulas", () => {
    let spreadsheet: Spreadsheet;

    beforeEach(() => {
        spreadsheet = new Spreadsheet();
    });

    test("Evaluate Named Formula", () => {
        const sheet = spreadsheet.getActiveSheet();
        sheet.setCellValue("A1", 10);
        sheet.setCellValue("A2", 20);
        
        // Define a name that is a formula
        const namedFormula = new NamedRange("MY_SUM", sheet, "=SUM(A1:A2)");
        spreadsheet.addDefinedName(namedFormula);
        
        sheet.setCellValue("B1", "=MY_SUM + 5");
        
        // getValue() returns the raw value/formula; use getCalculatedValue() to evaluate
        const result = sheet.getCell("B1").getCalculatedValue();
        expect(result).toBe(35);
    });
});
