/**
 * Coordinate conversion utilities.
 * Handles A1 notation (A1, B2) and R1C1 notation (R1C1, R2C2).
 */
export class Coordinate {
    /**
     * Convert column letter to 1-based index.
     * A=1, B=2, ..., Z=26, AA=27, etc.
     */
    public static columnIndexFromString(column: string): number {
        let result = 0;
        const upperColumn = column.toUpperCase();
        
        for (let i = 0; i < upperColumn.length; i++) {
            result = result * 26 + (upperColumn.charCodeAt(i) - 64);
        }
        
        return result;
    }

    /**
     * Convert 1-based column index to letter.
     * 1=A, 2=B, ..., 26=Z, 27=AA, etc.
     */
    public static stringFromColumnIndex(columnIndex: number): string {
        let result = '';
        let index = columnIndex;
        
        while (index > 0) {
            index--;
            result = String.fromCharCode(65 + (index % 26)) + result;
            index = Math.floor(index / 26);
        }
        
        return result;
    }

    /**
     * Convert coordinate string to column and row.
     * Returns [columnIndex (1-based), row (1-based)]
     */
    public static indexesFromString(coordinate: string): [number, number] {
        const match = coordinate.match(/^([A-Z]+)(\d+)$/i);
        if (!match) return [1, 1];
        
        return [
            this.columnIndexFromString(match[1]!),
            parseInt(match[2]!, 10)
        ];
    }

    /**
     * Convert column and row indexes to coordinate string.
     * Both indexes are 1-based.
     */
    public static stringFromCoordinate(columnIndex: number, rowIndex: number): string {
        return this.stringFromColumnIndex(columnIndex) + rowIndex;
    }

    /**
     * Parse coordinate to get column letter and row number.
     * Returns [column (A, B, etc.), row (1, 2, etc.)]
     */
    public static coordinateFromString(coordinate: string): [string, number] {
        const match = coordinate.match(/^([A-Z]+)(\d+)$/i);
        if (!match) return ['A', 1];
        
        return [match[1]!.toUpperCase(), parseInt(match[2]!, 10)];
    }

    /**
     * Get range boundaries from range string.
     * Returns [[startCol, startRow], [endCol, endRow]] with 1-based indexes.
     */
    public static rangeBoundaries(range: string): [[number, number], [number, number]] {
        const cells = range.split(':');
        const start = cells[0]!;
        const end = cells[1] || start;
        
        const [startCol, startRow] = this.indexesFromString(start);
        const [endCol, endRow] = this.indexesFromString(end);
        
        return [[startCol, startRow], [endCol, endRow]];
    }

    /**
     * Split a multi-range string into individual ranges.
     * "A1:B2,C3:D4" -> [["A1", "B2"], ["C3", "D4"]]
     */
    public static splitRange(range: string): string[][] {
        const result: string[][] = [];
        const ranges = range.split(',');
        
        for (const r of ranges) {
            const cells = r.split(':');
            if (cells.length === 2) {
                result.push([cells[0]!.trim(), cells[1]!.trim()]);
            } else {
                result.push([cells[0]!.trim()]);
            }
        }
        
        return result;
    }

    /**
     * Convert R1C1 reference to A1 notation.
     * R1C1 format: R[row]C[column] where row and column are 1-indexed
     * Examples: R1C1 -> A1, R10C3 -> C10
     */
    public static R1C1ToA1(reference: string): string {
        const match = reference.match(/^R(\d+)C(\d+)$/i);
        if (!match) return reference;
        
        const row = parseInt(match[1]!, 10);
        const col = parseInt(match[2]!, 10);
        
        return this.stringFromColumnIndex(col) + row;
    }

    /**
     * Convert A1 reference to R1C1 notation.
     * Examples: A1 -> R1C1, C10 -> R10C3
     */
    public static A1ToR1C1(reference: string): string {
        const match = reference.match(/^([A-Z]+)(\d+)$/i);
        if (!match) return reference;
        
        const col = match[1]!;
        const row = parseInt(match[2]!, 10);
        const colIndex = this.columnIndexFromString(col);
        
        return `R${row}C${colIndex}`;
    }

    /**
     * Check if reference is in R1C1 format.
     */
    public static isR1C1(reference: string): boolean {
        return /^R\d+C\d+$/i.test(reference);
    }

    /**
     * Resolve union operator (comma) in cell reference.
     * "A1,B2" represents both A1 and B2
     */
    public static resolveUnion(cellCoordinate: string): string[] {
        return cellCoordinate.split(',').map(s => s.trim());
    }

    /**
     * Resolve intersection operator (space) in cell reference.
     * Currently returns the first valid coordinate as a placeholder
     * Full intersection would require range overlap calculation
     */
    public static resolveIntersection(cellCoordinate: string): string | null {
        const parts = cellCoordinate.split(/\s+/).map(s => s.trim()).filter(s => s);
        if (parts.length === 0) return null;
        return parts[0]!;
    }

    /**
     * Check if coordinate contains union (comma) operator.
     */
    public static hasUnionOperator(cellCoordinate: string): boolean {
        return cellCoordinate.includes(',');
    }

    /**
     * Check if coordinate contains intersection (space) operator.
     */
    public static hasIntersectionOperator(cellCoordinate: string): boolean {
        return /\s+/.test(cellCoordinate);
    }
}