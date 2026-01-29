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
}
