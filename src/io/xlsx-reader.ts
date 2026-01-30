import type { IReader, WorksheetInfo } from './i-reader.ts';
import { Spreadsheet } from '../core/spreadsheet.ts';
import { open } from 'node:fs/promises';

/**
 * XLSX file reader.
 * Implements IReader interface for reading XLSX files.
 */
export class XlsxReader implements IReader {
    /**
     * Initial file to check in XLSX archive.
     */
    static INITIAL_FILE = '_rels/.rels';

    /**
     * Read empty cells?
     */
    #readEmptyCells = false;

    /**
     * Read default data (e.g., default styles)?
     */
    #readDefaultStyles = true;

    /**
     * Read data only (ignore styles)?
     */
    #readDataOnly = false;

    /**
     * Read filter (optional callback to filter worksheets).
     */
    #readFilter: ((worksheetName: string) => boolean) | null = null;

    /**
     * Can the current reader read the file?
     */
    async canRead(filename: string): Promise<boolean> {
        try {
            const file = await open(filename);
            await file.close();
            // TODO: Check if it's a valid ZIP file with required XLSX structure
            return true;
        } catch {
            return false;
        }
    }

    /**
     * List worksheet names in the file without loading the whole spreadsheet.
     */
    async listWorksheetNames(filename: string): Promise<string[]> {
        // TODO: Parse workbook.xml to extract sheet names
        return [];
    }

    /**
     * Return worksheet info.
     */
    async listWorksheetInfo(filename: string): Promise<WorksheetInfo[]> {
        // TODO: Parse worksheets to get dimensions
        return [];
    }

    /**
     * Loads a Spreadsheet from file.
     */
    async load(filename: string): Promise<Spreadsheet> {
        const spreadsheet = new Spreadsheet();
        
        // TODO: Implement full XLSX loading logic
        // 1. Open ZIP archive
        // 2. Read [Content_Types].xml
        // 3. Read _rels/.rels
        // 4. Read xl/_rels/workbook.xml.rels
        // 5. Read xl/workbook.xml
        // 6. Read xl/styles.xml
        // 7. Read xl/sharedStrings.xml
        // 8. Read each worksheet
        // 9. Apply styles, merge cells, etc.
        
        return spreadsheet;
    }

    /**
     * Set read empty cells.
     */
    setReadEmptyCells(value: boolean): void {
        this.#readEmptyCells = value;
    }

    /**
     * Get read empty cells.
     */
    getReadEmptyCells(): boolean {
        return this.#readEmptyCells;
    }

    /**
     * Set read default styles.
     */
    setReadDefaultStyles(value: boolean): void {
        this.#readDefaultStyles = value;
    }

    /**
     * Get read default styles.
     */
    getReadDefaultStyles(): boolean {
        return this.#readDefaultStyles;
    }

    /**
     * Set read data only.
     */
    setReadDataOnly(value: boolean): void {
        this.#readDataOnly = value;
    }

    /**
     * Get read data only.
     */
    getReadDataOnly(): boolean {
        return this.#readDataOnly;
    }

    /**
     * Set read filter callback.
     */
    setReadFilter(filter: ((worksheetName: string) => boolean) | null): void {
        this.#readFilter = filter;
    }

    /**
     * Get read filter callback.
     */
    getReadFilter(): ((worksheetName: string) => boolean) | null {
        return this.#readFilter;
    }
}
