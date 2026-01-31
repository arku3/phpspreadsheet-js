import type { Worksheet } from '../../core/worksheet.ts';
import { Coordinate } from '../../utils/coordinate.ts';
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
        table.showHeader((headerRowCount ?? '') !== '0');
        table.showTotals((totalsRowCount ?? '') === '1');

        // Columns
        const columnsMatch = this.#tableXml.match(/<tableColumns\b[^>]*>([\s\S]*?)<\/tableColumns>/);
        const columnsInner = columnsMatch?.[1] ?? '';
        const columnTags = [...columnsInner.matchAll(/<tableColumn\b([^>]*)\/?>(?:[\s\S]*?<\/tableColumn>)?/g)];

        if (columnTags.length > 0) {
            let offset = 0;
            for (const m of columnTags) {
                const attrs = m[1] ?? '';
                const colNameRaw = TableReader.extractXmlAttribute(attrs, 'name') ?? `Column${offset + 1}`;
                table.addColumn(XlsxReader.decodeXmlEntities(colNameRaw));
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

        return table;
    }
}
