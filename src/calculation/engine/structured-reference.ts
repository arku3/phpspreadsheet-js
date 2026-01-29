import { Worksheet } from '../../core/worksheet.ts';
import { Cell } from '../../core/cell.ts';
import { Table } from '../../worksheet/table.ts';
import { Coordinate } from '../../utils/coordinate.ts';

/**
 * Structured Reference Resolver.
 */
export class StructuredReference {
    private static readonly ITEM_SPECIFIER_ALL = '#All';
    private static readonly ITEM_SPECIFIER_HEADERS = '#Headers';
    private static readonly ITEM_SPECIFIER_DATA = '#Data';
    private static readonly ITEM_SPECIFIER_TOTALS = '#Totals';
    private static readonly ITEM_SPECIFIER_THIS_ROW = '#This Row';

    private value: string;

    constructor(structuredReference: string) {
        this.value = structuredReference;
    }

    /**
     * Parse structured reference into A1 range.
     */
    public parse(cell: Cell): string {
        const worksheet = cell.getWorksheet();
        const workbook = worksheet.getParent();

        // 1. Identify Table Name and Reference part
        // Syntax: TableName[[#Specifier],[Column]] or [Column]
        let tableName = '';
        let reference = '';

        if (this.value.startsWith('[')) {
            reference = this.value;
        } else {
            const bracketIndex = this.value.indexOf('[');
            if (bracketIndex !== -1) {
                tableName = this.value.substring(0, bracketIndex);
                reference = this.value.substring(bracketIndex);
            }
        }

        // 2. Locate Table
        let table: Table | undefined;
        if (tableName) {
            table = worksheet.getTableByName(tableName);
            if (!table) {
                // Check workbook-wide tables
                for (let i = 0; i < 100; i++) { // Mock loop to find table across sheets if needed
                    const sheet = workbook.getSheet(i);
                    if (!sheet) break;
                    table = sheet.getTableByName(tableName);
                    if (table) break;
                }
            }
        } else {
            // Find table containing the current cell
            const tables = worksheet.getTables();
            for (const t of tables) {
                const boundaries = t.getRangeBoundaries();
                const [[minCol, minRow], [maxCol, maxRow]] = boundaries;
                const cellCol = cell.getColumn();
                const cellRow = cell.getRow();
                if (cellCol >= minCol && cellCol <= maxCol && cellRow >= minRow && cellRow <= maxRow) {
                    table = t;
                    break;
                }
            }
        }

        if (!table) {
            return '#REF!';
        }

        // 3. Resolve Reference
        const boundaries = table.getRangeBoundaries();
        const [[minCol, minRow], [maxCol, maxRow]] = boundaries;

        const hasHeaders = table.getShowHeader();
        const hasTotals = table.getShowTotals();

        const headerRow = hasHeaders ? minRow : null;
        const firstDataRow = hasHeaders ? minRow + 1 : minRow;
        const totalsRow = hasTotals ? maxRow : null;
        const lastDataRow = hasTotals ? maxRow - 1 : maxRow;

        // Simple column/row resolution
        // Handles: [Column], [#All], [#Data], [#Headers], [#Totals], [@Column]
        
        if (reference.includes('[@') || reference.includes('[#This Row]')) {
            // Current row reference
            return this.resolveRowReference(reference, table, cell.getRow());
        }

        return this.resolveColumnReference(reference, table, headerRow, firstDataRow, lastDataRow, totalsRow);
    }

    private resolveRowReference(reference: string, table: Table, row: number): string {
        // [@ColumnName]
        const colNameMatch = reference.match(/\[?@\[?([^\]]+)\]?\]?/);
        if (colNameMatch && colNameMatch[1]) {
            const colName = colNameMatch[1];
            const column = table.getColumn(colName);
            if (column) {
                const [[minCol]] = table.getRangeBoundaries();
                const colIndex = minCol + column.getIndex();
                return Coordinate.stringFromCoordinate(colIndex, row);
            }
        }
        return '#REF!';
    }

    private resolveColumnReference(
        reference: string, 
        table: Table, 
        headerRow: number | null, 
        firstDataRow: number, 
        lastDataRow: number, 
        totalsRow: number | null
    ): string {
        const [[minCol, _minRow], [maxCol, _maxRow]] = table.getRangeBoundaries();

        // Check for specifiers
        let startRow = firstDataRow;
        let endRow = lastDataRow;

        if (reference.includes(StructuredReference.ITEM_SPECIFIER_ALL)) {
            startRow = headerRow ?? firstDataRow;
            endRow = totalsRow ?? lastDataRow;
        } else if (reference.includes(StructuredReference.ITEM_SPECIFIER_HEADERS)) {
            if (headerRow === null) return '#REF!';
            startRow = headerRow;
            endRow = headerRow;
        } else if (reference.includes(StructuredReference.ITEM_SPECIFIER_TOTALS)) {
            if (totalsRow === null) return '#REF!';
            startRow = totalsRow;
            endRow = totalsRow;
        } else if (reference.includes(StructuredReference.ITEM_SPECIFIER_DATA)) {
            startRow = firstDataRow;
            endRow = lastDataRow;
        }

        // Check for column name
        // [Column] or [[#Data],[Column]]
        const colNameMatch = reference.match(/\[([^#@\]]+)\]/);
        if (colNameMatch && colNameMatch[1]) {
            const colName = colNameMatch[1];
            const column = table.getColumn(colName);
            if (column) {
                const targetCol = minCol + column.getIndex();
                const start = Coordinate.stringFromCoordinate(targetCol, startRow);
                const end = Coordinate.stringFromCoordinate(targetCol, endRow);
                return start === end ? start : `${start}:${end}`;
            }
        }

        // Default to entire table (selected rows)
        const startCoord = Coordinate.stringFromCoordinate(minCol, startRow);
        const endCoord = Coordinate.stringFromCoordinate(maxCol, endRow);
        return `${startCoord}:${endCoord}`;
    }
}
