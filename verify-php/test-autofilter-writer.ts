import { Spreadsheet } from "./src/core/spreadsheet.ts";
import { XlsxWriter } from "./src/io/xlsx-writer.ts";
import { Rule } from "./src/worksheet/auto-filter/column/rule.ts";
import { Column } from "./src/worksheet/auto-filter/column.ts";

async function main() {
    const spreadsheet = new Spreadsheet();
    const sheet = spreadsheet.getActiveSheet();
    sheet.setTitle("AutoFilter Test");

    // Sample Data
    const data = [
        ["Product", "Description", "Stock"],
        ["Apple", "Sweet Red", 10],
        ["Banana", "Yellow Long", 50],
        ["Cherry", "Small Red", 30],
        ["Apple", "Green Tart", 5],
        ["Date", "Brown sweet", 15],
    ];

    data.forEach((row, r) => {
        row.forEach((val, c) => {
            sheet.setCellValue(`${String.fromCharCode(65 + c)}${r + 1}`, val);
        });
    });

    const autoFilter = sheet.getAutoFilter();
    autoFilter.setRange("A1:C6");

    // 1. Simple Filter on Column A (Product) for "Apple"
    autoFilter.getColumn("A")
        .setFilterType(Column.AUTOFILTER_FILTERTYPE_FILTER)
        .createRule()
        .setRuleType(Rule.AUTOFILTER_RULETYPE_FILTER)
        .setValue("Apple");

    // 2. Custom Filter on Column B (Description) for anything containing "sweet" (case-insensitive in Excel usually)
    autoFilter.getColumn("B")
        .setFilterType(Column.AUTOFILTER_FILTERTYPE_CUSTOMFILTER)
        .createRule()
        .setOperator(Rule.AUTOFILTER_COLUMN_RULE_EQUAL)
        .setValue("*sweet*");

    // 3. Top 10 Filter on Column C (Stock) - Top 2
    autoFilter.getColumn("C")
        .setFilterType(Column.AUTOFILTER_FILTERTYPE_TOPTENFILTER)
        .createRule()
        .setRuleType(Rule.AUTOFILTER_RULETYPE_TOPTENFILTER)
        .setOperator(Rule.AUTOFILTER_COLUMN_RULE_TOPTEN_BY_VALUE)
        .setGrouping(Rule.AUTOFILTER_COLUMN_RULE_TOPTEN_TOP)
        .setValue(2);

    // Apply the filters to hide rows
    console.log("Applying filters...");
    autoFilter.showHideRows();

    // Save
    const writer = new XlsxWriter(spreadsheet);
    const filename = "autofilter-test.xlsx";
    console.log(`Saving to ${filename}...`);
    await writer.save(filename);
    console.log("Done!");
}

main().catch(console.error);
