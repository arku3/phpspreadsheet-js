import type { Worksheet } from '../../core/worksheet.ts';
import { Coordinate } from '../../utils/coordinate.ts';
import { TableStyle } from '../../worksheet/table-style.ts';
import { Table } from '../../worksheet/table.ts';
import { XlsxReader } from '../xlsx-reader.ts';
import { ReaderPart } from './reader-part.ts';

/**
 * XLSX table part reader (xl/tables/tableN.xml).
 *
 * Minimal PhpSpreadsheet parity:
 * - name/displayName
 * - ref range (with '$' stripped)
 * - header/totals flags
 * - columns (names only)
 */
export class TableReader extends ReaderPart {
    #worksheet: Worksheet;
    #tableXml: string;

    public constructor(reader: XlsxReader, worksheet: Worksheet, tableXml: string) {
        super(reader);
        this.#worksheet = worksheet;
        this.#tableXml = tableXml;
    }

    private static extractXmlAttribute(tagAttrs: string, attrName: string): string | null {
        const m = tagAttrs.match(new RegExp(`${attrName}="([^"]*)"`));
        return m && m[1] !== undefined ? m[1] : null;
    }

    /**
     * Parse the table XML and return a Table instance, or null if invalid.
     */
    public load(): Table | null {
        const tableTagAttrs = this.#tableXml.match(/<table\b([^>]*)>/)?.[1] ?? '';
        const refRaw = TableReader.extractXmlAttribute(tableTagAttrs, 'ref') ?? '';
        const tableRange = refRaw.replace(/\$/g, '').toUpperCase();
        if (!tableRange.includes(':')) {
            return null;
        }

        const displayNameRaw = TableReader.extractXmlAttribute(tableTagAttrs, 'displayName') ?? '';
        const nameRaw = TableReader.extractXmlAttribute(tableTagAttrs, 'name') ?? '';
        const tableName = XlsxReader.decodeXmlEntities(displayNameRaw !== '' ? displayNameRaw : nameRaw);

        const headerRowCount = TableReader.extractXmlAttribute(tableTagAttrs, 'headerRowCount');
        const totalsRowCount = TableReader.extractXmlAttribute(tableTagAttrs, 'totalsRowCount');

        const table = new Table(tableName, tableRange, this.#worksheet);
        table.setShowHeaderRow((headerRowCount ?? '') !== '0');
        table.setShowTotalsRow((totalsRowCount ?? '') === '1');

        // AutoFilter (allowFilter + filter button visibility)
        const autoFilterMatch = this.#tableXml.match(/<autoFilter\b[^>]*>([\s\S]*?)<\/autoFilter>/);
        if (autoFilterMatch && autoFilterMatch[1]) {
            const filterColumns = [...autoFilterMatch[1].matchAll(/<filterColumn\b([^>]*)>/g)];
            if (filterColumns.length === 0) {
                table.setAllowFilter(false);
            } else {
                for (const filterColumn of filterColumns) {
                    const attrs = filterColumn[1] ?? '';
                    const colId = Number.parseInt(TableReader.extractXmlAttribute(attrs, 'colId') ?? '0', 10);
                    const hidden = TableReader.extractXmlAttribute(attrs, 'hiddenButton') === '1';
                    const column = table.getColumnByOffset(colId);
                    if (column !== false) {
                        column.setShowFilterButton(!hidden);
                    }
                }
            }
        } else {
            table.setAllowFilter(false);
        }

        // Columns
        const columnsMatch = this.#tableXml.match(/<tableColumns\b[^>]*>([\s\S]*?)<\/tableColumns>/);
        const columnsInner = columnsMatch?.[1] ?? '';
        const columnTags = [...columnsInner.matchAll(/<tableColumn\b([^>]*)\/?>(?:[\s\S]*?<\/tableColumn>)?/g)];

        if (columnTags.length > 0) {
            let offset = 0;
            for (const m of columnTags) {
                const attrs = m[1] ?? '';
                const colNameRaw = TableReader.extractXmlAttribute(attrs, 'name') ?? `Column${offset + 1}`;
                const column = table.addColumn(XlsxReader.decodeXmlEntities(colNameRaw));
                if (table.getShowTotalsRow()) {
                    const totalsRowLabel = TableReader.extractXmlAttribute(attrs, 'totalsRowLabel');
                    if (totalsRowLabel) {
                        column.setTotalsRowLabel(XlsxReader.decodeXmlEntities(totalsRowLabel));
                    }
                    const totalsRowFunction = TableReader.extractXmlAttribute(attrs, 'totalsRowFunction');
                    if (totalsRowFunction) {
                        column.setTotalsRowFunction(totalsRowFunction);
                    }
                }
                const fullTag = m[0] ?? '';
                const formulaMatch = fullTag.match(
                    /<calculatedColumnFormula[^>]*>([\s\S]*?)<\/calculatedColumnFormula>/,
                );
                if (formulaMatch && formulaMatch[1]) {
                    column.setColumnFormula(XlsxReader.decodeXmlEntities(formulaMatch[1]));
                }
                offset++;
            }
        } else {
            // Fallback: infer column count from range.
            const boundaries = Coordinate.rangeBoundaries(tableRange);
            if (boundaries) {
                const [[startCol], [endCol]] = boundaries;
                const columnCount = Math.max(1, endCol - startCol + 1);
                for (let i = 0; i < columnCount; i++) {
                    table.addColumn(`Column${i + 1}`);
                }
            }
        }

        // Table style info
        const tableStyleMatch = this.#tableXml.match(/<tableStyleInfo\b([^>]*)\/>/);
        if (tableStyleMatch) {
            const attrs = tableStyleMatch[1] ?? '';
            const style = new TableStyle();
            const theme = TableReader.extractXmlAttribute(attrs, 'name') ?? '';
            if (theme !== '') {
                style.setTheme(theme);
            }
            style.setShowRowStripes(TableReader.extractXmlAttribute(attrs, 'showRowStripes') === '1');
            style.setShowColumnStripes(TableReader.extractXmlAttribute(attrs, 'showColumnStripes') === '1');
            style.setShowFirstColumn(TableReader.extractXmlAttribute(attrs, 'showFirstColumn') === '1');
            style.setShowLastColumn(TableReader.extractXmlAttribute(attrs, 'showLastColumn') === '1');
            table.setStyle(style);
        }

        return table;
    }
}
