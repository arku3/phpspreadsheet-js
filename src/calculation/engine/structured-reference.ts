import { Cell } from '../../core/cell.ts';
import { Worksheet } from '../../core/worksheet.ts';
import { Coordinate } from '../../utils/coordinate.ts';
import { Table } from '../../worksheet/table.ts';

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
        if (!workbook) {
            return '#REF!';
        }

        const [cellCol1, cellRow1] = Coordinate.indexesFromString(cell.getCoordinate());

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
                for (let i = 0; i < workbook.getSheetCount(); i++) {
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
                if (cellCol1 >= minCol && cellCol1 <= maxCol && cellRow1 >= minRow && cellRow1 <= maxRow) {
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
            const cellRef = this.resolveRowReference(reference, table, cellRow1);
            if (cellRef === '#REF!') return cellRef;

            const tableSheet = table.getWorksheet();
            if (tableSheet !== worksheet) {
                return `'${tableSheet.getTitle()}'!${cellRef}`;
            }

            return cellRef;
        }

        const rangeRef = this.resolveColumnReference(reference, table, headerRow, firstDataRow, lastDataRow, totalsRow);
        if (rangeRef === '#REF!') return rangeRef;

        const tableSheet = table.getWorksheet();
        if (tableSheet !== worksheet) {
            return `'${tableSheet.getTitle()}'!${rangeRef}`;
        }

        return rangeRef;
    }

    private resolveRowReference(reference: string, table: Table, row: number): string {
        // Supports [@Column] and [[#This Row],[Column]]

        const extractTopLevelGroups = (text: string): string[] => {
            const groups: string[] = [];
            let depth = 0;
            let start = -1;
            for (let i = 0; i < text.length; i++) {
                const c = text[i];
                if (c === '[') {
                    if (depth === 0) start = i;
                    depth++;
                } else if (c === ']') {
                    depth = Math.max(0, depth - 1);
                    if (depth === 0 && start !== -1) {
                        groups.push(text.slice(start + 1, i));
                        start = -1;
                    }
                }
            }
            return groups;
        };

        // PhpSpreadsheet removes the "[#This Row]," marker before column substitution.
        let working = reference;
        if (working.includes(`[${StructuredReference.ITEM_SPECIFIER_THIS_ROW}],`)) {
            working = working.replace(`[${StructuredReference.ITEM_SPECIFIER_THIS_ROW}],`, '');
        }
        if (working.includes(`[${StructuredReference.ITEM_SPECIFIER_THIS_ROW}]`)) {
            working = working.replace(`[${StructuredReference.ITEM_SPECIFIER_THIS_ROW}]`, '');
        }

        // Fast-path for [@Column]
        const atMatch = working.match(/\[@([^\]]+)\]/);
        if (atMatch?.[1]) {
            const colName = atMatch[1].trim();
            const column = table.getColumn(colName);
            if (!column) return '#REF!';
            const [[minCol]] = table.getRangeBoundaries();
            return Coordinate.stringFromCoordinate(minCol + column.getIndex(), row);
        }

        // General case: find the first non-# group, drilling into nested brackets.
        const groups = extractTopLevelGroups(working);
        let colName = '';
        for (const group of groups) {
            const trimmed = group.trim();
            if (!trimmed) continue;
            if (trimmed.startsWith('#')) continue;

            // Nested form: [[Column]] -> outer group content is "[Column]".
            if (trimmed.includes('[')) {
                const inner = extractTopLevelGroups(trimmed)
                    .map((s) => s.trim())
                    .find((s) => s !== '' && !s.startsWith('#'));
                if (inner) {
                    colName = inner;
                    break;
                }
            }

            colName = trimmed;
            break;
        }

        colName = colName.trim();
        if (!colName) return '#REF!';

        const column = table.getColumn(colName);
        if (!column) return '#REF!';

        const [[minCol]] = table.getRangeBoundaries();
        const colIndex = minCol + column.getIndex();
        return Coordinate.stringFromCoordinate(colIndex, row);
    }

    private resolveColumnReference(
        reference: string,
        table: Table,
        headerRow: number | null,
        firstDataRow: number,
        lastDataRow: number,
        totalsRow: number | null,
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
