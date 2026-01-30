import type { XlsxReader } from '../xlsx-reader.ts';

/**
 * Abstract base class for all XLSX reader parts.
 */
export abstract class ReaderPart {
    /**
     * Parent XlsxReader object.
     */
    #parentReader: XlsxReader;

    /**
     * Set parent XlsxReader object.
     */
    constructor(reader: XlsxReader) {
        this.#parentReader = reader;
    }

    /**
     * Get parent XlsxReader object.
     */
    protected getParentReader(): XlsxReader {
        return this.#parentReader;
    }
}
