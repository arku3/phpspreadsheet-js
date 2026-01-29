import { Spreadsheet } from '../core/spreadsheet.ts';

/**
 * Interface for spreadsheet writers.
 */
export interface IWriter {
    /**
     * Save the spreadsheet to a file.
     *
     * @param filename Path to save the file
     */
    save(filename: string): Promise<void>;

    /**
     * Get pre-calculate formulas flag.
     */
    getPreCalculateFormulas(): boolean;

    /**
     * Set pre-calculate formulas flag.
     *
     * @param value
     */
    setPreCalculateFormulas(value: boolean): this;
}
