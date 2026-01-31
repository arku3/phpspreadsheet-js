import { create } from 'xmlbuilder2';
import type { Worksheet as CoreWorksheet } from '../../core/worksheet.ts';
import { Coordinate } from '../../utils/coordinate.ts';
import type { Table as WorksheetTable } from '../../worksheet/table.ts';
import { WriterPart } from './writer-part.ts';

/**
 * Generates table XML parts (xl/tables/table{n}.xml).
 */
export class TablePart extends WriterPart {
    /**
     * Write a single table definition.
     *
     * @param table The table model.
     * @param tableRef Global table id (1-based) within the XLSX package.
     */
    public writeTable(table: WorksheetTable, tableRef: number): string {
        const range = table.getRange();
        const xmlName = `Table${tableRef}`;
        const displayName = table.getName() !== '' ? table.getName() : xmlName;

        const root = create({ version: '1.0', encoding: 'UTF-8', standalone: true }).ele('table', {
            xmlns: 'http://schemas.openxmlformats.org/spreadsheetml/2006/main',
            id: String(tableRef),
            name: xmlName,
            displayName,
            ref: range,
            headerRowCount: table.getShowHeader() ? '1' : '0',
            totalsRowCount: table.getShowTotals() ? '1' : '0',
        });

        const [[startCol, startRow], [endCol]] = Coordinate.rangeBoundaries(range);
        const columnCount = Math.max(1, endCol - startCol + 1);

        // AutoFilter: PhpSpreadsheet writes this when header row is shown and filtering is enabled.
        // Our Table model doesn't expose allowFilter/column options yet; emit the container only.
        if (table.getShowHeader()) {
            root.ele('autoFilter', { ref: range });
        }

        // Table Columns
        const tableColumns = root.ele('tableColumns', { count: String(columnCount) });
        const worksheet: CoreWorksheet = table.getWorksheet();
        const cells = worksheet.getCellCollection();

        for (let offset = 0; offset < columnCount; offset++) {
            const colIndex = startCol + offset;
            let name = `Column${offset + 1}`;
            if (table.getShowHeader()) {
                const coord = `${Coordinate.stringFromColumnIndex(colIndex)}${startRow}`;
                const cell = cells.get(coord);
                const value = cell?.getValue();
                if (value !== null && value !== undefined && String(value) !== '') {
                    name = String(value);
                }
            }

            tableColumns.ele('tableColumn', {
                id: String(offset + 1),
                name,
            });
        }

        // Table Style
        root.ele('tableStyleInfo', {
            name: 'TableStyleMedium9',
            showFirstColumn: '0',
            showLastColumn: '0',
            showRowStripes: '0',
            showColumnStripes: '0',
        });

        return root.end({ prettyPrint: true });
    }
}
