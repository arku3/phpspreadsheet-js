/**
 * Helper class to manipulate cell coordinates.
 *
 * Internal storage uses 0-indexed integers (row, column).
 * External API (A1 notation) uses 1-based indexing for rows and A-Z for columns.
 */
export abstract class Coordinate {
    public static readonly A1_COORDINATE_REGEX = /^(?<col>\$?[A-Z]{1,3})(?<row>\$?\d{1,7})$/i;

    /**
     * Convert string coordinate to [column, row] (0-indexed).
     * @param cellAddress eg: 'A1'
     * @returns [column, row] (0-indexed)
     */
    public static coordinateFromString(cellAddress: string): [number, number] {
        const matches = cellAddress.match(this.A1_COORDINATE_REGEX);
        if (!matches || !matches.groups) {
            throw new Error(`Invalid cell coordinate ${cellAddress}`);
        }

        const colMatch = matches.groups['col'];
        const rowMatch = matches.groups['row'];

        if (colMatch === undefined || rowMatch === undefined) {
            throw new Error(`Invalid cell coordinate ${cellAddress}`);
        }

        const col = colMatch.replace(/\$/g, '');
        const row = rowMatch.replace(/\$/g, '');

        return [
            this.columnIndexFromString(col) - 1,
            parseInt(row, 10) - 1
        ];
    }

    /**
     * Convert string coordinate to [column, row] (1-indexed).
     * @param cellAddress eg: 'A1'
     * @returns [column, row] (1-indexed)
     */
    public static indexesFromString(cellAddress: string): [number, number] {
        const [col, row] = this.coordinateFromString(cellAddress);
        return [col + 1, row + 1];
    }

    /**
     * Column index from string (A = 1, B = 2, ...).
     * @param columnAddress eg 'A'
     * @returns Column index (1-based)
     */
    public static columnIndexFromString(columnAddress: string): number {
        columnAddress = columnAddress.toUpperCase();
        let index = 0;
        for (let i = 0; i < columnAddress.length; i++) {
            index = index * 26 + (columnAddress.charCodeAt(i) - 64);
        }
        return index;
    }

    /**
     * String from column index (1 = A, 2 = B, ...).
     * @param columnIndex Column index (1-based)
     * @returns Column address eg 'A'
     */
    public static stringFromColumnIndex(columnIndex: number): string {
        let columnAddress = '';
        while (columnIndex > 0) {
            const modulo = (columnIndex - 1) % 26;
            columnAddress = String.fromCharCode(65 + modulo) + columnAddress;
            columnIndex = Math.floor((columnIndex - modulo) / 26);
        }
        return columnAddress;
    }

    /**
     * Convert [column, row] (0-indexed) to string coordinate (eg: 'A1').
     * @param column 0-indexed column
     * @param row 0-indexed row
     * @returns A1 notation
     */
    public static stringFromCoordinate(column: number, row: number): string {
        return this.stringFromColumnIndex(column + 1) + (row + 1);
    }

    /**
     * Get range boundaries.
     *
     * @param range eg: 'A1:C5'
     * @returns [[startCol, startRow], [endCol, endRow]] (1-indexed)
     */
    public static rangeBoundaries(range: string): [[number, number], [number, number]] {
        range = range.toUpperCase();
        if (!range.includes(':')) {
            range = `${range}:${range}`;
        }
        const [start, end] = range.split(':');
        const [startCol, startRow] = this.indexesFromString(start!);
        const [endCol, endRow] = this.indexesFromString(end!);
        return [[startCol, startRow], [endCol, endRow]];
    }

    /**
     * Convert string coordinate to absolute coordinate (eg: 'A1' -> '$A$1').
     */
    public static absoluteCoordinate(coordinate: string): string {
        if (coordinate.includes(':')) {
            const [start, end] = coordinate.split(':');
            return `${this.absoluteCoordinate(start!)}:${this.absoluteCoordinate(end!)}`;
        }
        const matches = coordinate.match(this.A1_COORDINATE_REGEX);
        if (!matches || !matches.groups) {
            return coordinate;
        }
        let col = matches.groups['col']!;
        let row = matches.groups['row']!;
        if (!col.startsWith('$')) col = `$${col}`;
        if (!row.startsWith('$')) row = `$${row}`;
        return `${col}${row}`;
    }

    /**
     * Split range.
     *
     * @param range Range (e.g. 'A1:C5,D6:E10')
     */
    public static splitRange(range: string): string[][] {
        const parts = range.split(',');
        return parts.map(part => {
            if (part.includes(':')) {
                return part.split(':');
            }
            return [part];
        });
    }

    /**
     * Resolve union and intersection.
     */
    public static resolveUnionAndIntersection(cellCoordinate: string, separator: string = ' '): string {
        return cellCoordinate.replace(/,/g, separator);
    }
}
