import { describe, expect, test } from "bun:test";
import { Spreadsheet } from "../../src/core/spreadsheet.ts";
import { PageSetup } from "../../src/worksheet/page-setup.ts";
import { PageMargins } from "../../src/worksheet/page-margins.ts";

describe("Worksheet Page Setup and Margins", () => {
    test("PageSetup default values and basic setters", () => {
        const spreadsheet = new Spreadsheet();
        const sheet = spreadsheet.getActiveSheet();
        const pageSetup = sheet.getPageSetup();

        expect(pageSetup.getPaperSize()).toBe(PageSetup.PAPERSIZE_LETTER);
        expect(pageSetup.getOrientation()).toBe(PageSetup.ORIENTATION_DEFAULT);

        pageSetup.setPaperSize(PageSetup.PAPERSIZE_A4);
        expect(pageSetup.getPaperSize()).toBe(PageSetup.PAPERSIZE_A4);

        pageSetup.setOrientation(PageSetup.ORIENTATION_LANDSCAPE);
        expect(pageSetup.getOrientation()).toBe(PageSetup.ORIENTATION_LANDSCAPE);
    });

    test("PageSetup print area management", () => {
        const spreadsheet = new Spreadsheet();
        const sheet = spreadsheet.getActiveSheet();
        const pageSetup = sheet.getPageSetup();

        expect(pageSetup.isPrintAreaSet()).toBe(false);
        
        pageSetup.setPrintArea("A1:C10");
        expect(pageSetup.getPrintArea()).toBe("A1:C10");
        expect(pageSetup.isPrintAreaSet()).toBe(true);

        pageSetup.addPrintArea("E1:F5");
        expect(pageSetup.getPrintArea(0)).toBe("A1:C10,E1:F5");
        expect(pageSetup.getPrintArea(1)).toBe("A1:C10");
        expect(pageSetup.getPrintArea(2)).toBe("E1:F5");

        pageSetup.clearPrintArea(1);
        expect(pageSetup.getPrintArea()).toBe("E1:F5");
        
        pageSetup.clearPrintArea();
        expect(pageSetup.isPrintAreaSet()).toBe(false);
    });

    test("PageMargins default values and unit conversions", () => {
        const spreadsheet = new Spreadsheet();
        const sheet = spreadsheet.getActiveSheet();
        const margins = sheet.getPageMargins();

        expect(margins.getLeft()).toBe(0.7);
        expect(margins.getTop()).toBe(0.75);

        margins.setLeft(PageMargins.fromCentimeters(2.54));
        expect(margins.getLeft()).toBe(1.0);
        expect(PageMargins.toCentimeters(margins.getLeft())).toBe(2.54);

        margins.setRight(PageMargins.fromMillimeters(25.4));
        expect(margins.getRight()).toBe(1.0);
    });
});
