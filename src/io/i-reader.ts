import type { Spreadsheet } from '../core/spreadsheet.ts';

/**
 * Interface for all Spreadsheet readers.
 */
export interface IReader {
    /**
     * Can the current reader read the file?
     */
    canRead(filename: string): Promise<boolean>;

    /**
     * List worksheet names in the file without loading the whole spreadsheet.
     */
    listWorksheetNames(filename: string): Promise<string[]>;

    /**
     * Return worksheet info (Name, Last Column Letter, Last Column Index, Total Rows, Total Columns).
     */
    listWorksheetInfo(filename: string): Promise<WorksheetInfo[]>;

    /**
     * Loads a Spreadsheet from file.
     */
    load(filename: string): Promise<Spreadsheet>;
}

/**
 * Worksheet info structure.
 */
export interface WorksheetInfo {
    worksheetName: string;
    lastColumnLetter: string;
    lastColumnIndex: number;
    totalRows: number;
    totalColumns: number;
    sheetState: string;
}
