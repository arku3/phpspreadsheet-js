import { XlsxWriter } from '../xlsx-writer.ts';

/**
 * Abstract base class for all XLSX parts.
 */
export abstract class WriterPart {
    /**
     * Parent Xlsx object.
     */
    #parentWriter: XlsxWriter;

    /**
     * Set parent Xlsx object.
     */
    constructor(writer: XlsxWriter) {
        this.#parentWriter = writer;
    }

    /**
     * Get parent Xlsx object.
     */
    protected getParentWriter(): XlsxWriter {
        return this.#parentWriter;
    }
}
