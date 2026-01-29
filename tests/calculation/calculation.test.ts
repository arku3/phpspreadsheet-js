import { expect, test, describe, beforeEach } from "bun:test";
import { Spreadsheet } from "../../src/core/spreadsheet.ts";

describe("Calculation Engine", () => {
    let spreadsheet: Spreadsheet;

    beforeEach(() => {
        spreadsheet = new Spreadsheet();
    });

    test("Basic Arithmetic", () => {
        const sheet = spreadsheet.getActiveSheet();
        sheet.setCellValue("A1", 10);
        sheet.setCellValue("B1", 20);
        sheet.setCellValue("C1", "=A1+B1");
        expect(sheet.getCell("C1").getValue()).toBe(30);

        sheet.setCellValue("C2", "=B1-A1");
        expect(sheet.getCell("C2").getValue()).toBe(10);

        sheet.setCellValue("C3", "=A1*B1");
        expect(sheet.getCell("C3").getValue()).toBe(200);

        sheet.setCellValue("C4", "=B1/A1");
        expect(sheet.getCell("C4").getValue()).toBe(2);
    });

    test("Operator Precedence", () => {
        const sheet = spreadsheet.getActiveSheet();
        sheet.setCellValue("A1", "=1+2*3");
        expect(sheet.getCell("A1").getValue()).toBe(7);

        sheet.setCellValue("A2", "=(1+2)*3");
        expect(sheet.getCell("A2").getValue()).toBe(9);
    });

    test("Functions", () => {
        const sheet = spreadsheet.getActiveSheet();
        sheet.setCellValue("A1", 10);
        sheet.setCellValue("A2", 20);
        sheet.setCellValue("A3", 30);
        
        sheet.setCellValue("B1", "=SUM(A1:A3)");
        expect(sheet.getCell("B1").getValue()).toBe(60);

        sheet.setCellValue("B2", "=AVERAGE(A1:A3)");
        expect(sheet.getCell("B2").getValue()).toBe(20);

        sheet.setCellValue("B3", "=COUNT(A1:A3, \"test\", 40)");
        expect(sheet.getCell("B3").getValue()).toBe(4);
    });

    test("Logical IF", () => {
        const sheet = spreadsheet.getActiveSheet();
        sheet.setCellValue("A1", 10);
        sheet.setCellValue("B1", "=IF(A1>5, \"High\", \"Low\")");
        expect(sheet.getCell("B1").getValue()).toBe("High");

        sheet.setCellValue("A1", 2);
        expect(sheet.getCell("B1").getValue()).toBe("Low");
    });

    test("Nested Functions", () => {
        const sheet = spreadsheet.getActiveSheet();
        sheet.setCellValue("A1", 10);
        sheet.setCellValue("A2", 20);
        sheet.setCellValue("B1", "=IF(SUM(A1:A2)>25, \"Large\", \"Small\")");
        expect(sheet.getCell("B1").getValue()).toBe("Large");
    });

    test("Branch Pruning (Lazy IF)", () => {
        const sheet = spreadsheet.getActiveSheet();
        // If pruning works, the second argument (1/0) should NOT be evaluated if condition is false
        sheet.setCellValue("A1", 10);
        sheet.setCellValue("B1", "=IF(A1<5, 1/0, \"Safe\")");
        expect(sheet.getCell("B1").getValue()).toBe("Safe");
    });

    test("Cross-Sheet References", () => {
        const sheet1 = spreadsheet.getActiveSheet();
        sheet1.setTitle("DataSheet");
        sheet1.setCellValue("A1", 100);

        const sheet2 = spreadsheet.createSheet("CalcSheet");
        sheet2.setCellValue("A1", "=DataSheet!A1 + 50");
        expect(sheet2.getCell("A1").getValue()).toBe(150);

        sheet2.setCellValue("A2", "=SUM(DataSheet!A1, 10)");
        expect(sheet2.getCell("A2").getValue()).toBe(110);
    });

    test("Circular Reference", () => {
        const sheet = spreadsheet.getActiveSheet();
        sheet.setCellValue("A1", "=B1");
        sheet.setCellValue("B1", "=A1");
        expect(sheet.getCell("A1").getValue()).toBe("#CIRCULAR!");
    });

    test("Complex Functions", () => {
        const sheet = spreadsheet.getActiveSheet();
        sheet.setCellValue("A1", -10);
        sheet.setCellValue("B1", "=ABS(A1)");
        expect(sheet.getCell("B1").getValue()).toBe(10);

        sheet.setCellValue("A2", 1);
        sheet.setCellValue("A3", 5);
        sheet.setCellValue("A4", 2);
        sheet.setCellValue("B2", "=MAX(A2:A4)");
        sheet.setCellValue("B3", "=MIN(A2:A4)");
        expect(sheet.getCell("B2").getValue()).toBe(5);
        expect(sheet.getCell("B3").getValue()).toBe(1);

        sheet.setCellValue("A5", 1.2345);
        sheet.setCellValue("B4", "=ROUND(A5, 2)");
        expect(sheet.getCell("B4").getValue()).toBe(1.23);

        sheet.setCellValue("A6", "Hello");
        sheet.setCellValue("B5", "=LEN(A6)");
        sheet.setCellValue("B6", "=LEFT(A6, 2)");
        sheet.setCellValue("B7", "=RIGHT(A6, 2)");
        expect(sheet.getCell("B5").getValue()).toBe(5);
        expect(sheet.getCell("B6").getValue()).toBe("He");
        expect(sheet.getCell("B7").getValue()).toBe("lo");
    });
});
