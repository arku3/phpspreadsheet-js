/**
 * Page setup.
 */
export class PageSetup {
    // Paper size
    public static readonly PAPERSIZE_LETTER = 1;
    public static readonly PAPERSIZE_LETTER_SMALL = 2;
    public static readonly PAPERSIZE_TABLOID = 3;
    public static readonly PAPERSIZE_LEDGER = 4;
    public static readonly PAPERSIZE_LEGAL = 5;
    public static readonly PAPERSIZE_STATEMENT = 6;
    public static readonly PAPERSIZE_EXECUTIVE = 7;
    public static readonly PAPERSIZE_A3 = 8;
    public static readonly PAPERSIZE_A4 = 9;
    public static readonly PAPERSIZE_A4_SMALL = 10;
    public static readonly PAPERSIZE_A5 = 11;
    public static readonly PAPERSIZE_B4 = 12;
    public static readonly PAPERSIZE_B5 = 13;
    public static readonly PAPERSIZE_FOLIO = 14;
    public static readonly PAPERSIZE_QUARTO = 15;
    public static readonly PAPERSIZE_STANDARD_1 = 16;
    public static readonly PAPERSIZE_STANDARD_2 = 17;
    public static readonly PAPERSIZE_NOTE = 18;
    public static readonly PAPERSIZE_NO9_ENVELOPE = 19;
    public static readonly PAPERSIZE_NO10_ENVELOPE = 20;
    public static readonly PAPERSIZE_NO11_ENVELOPE = 21;
    public static readonly PAPERSIZE_NO12_ENVELOPE = 22;
    public static readonly PAPERSIZE_NO14_ENVELOPE = 23;
    public static readonly PAPERSIZE_C = 24;
    public static readonly PAPERSIZE_D = 25;
    public static readonly PAPERSIZE_E = 26;
    public static readonly PAPERSIZE_DL_ENVELOPE = 27;
    public static readonly PAPERSIZE_C5_ENVELOPE = 28;
    public static readonly PAPERSIZE_C3_ENVELOPE = 29;
    public static readonly PAPERSIZE_C4_ENVELOPE = 30;
    public static readonly PAPERSIZE_C6_ENVELOPE = 31;
    public static readonly PAPERSIZE_C65_ENVELOPE = 32;
    public static readonly PAPERSIZE_B4_ENVELOPE = 33;
    public static readonly PAPERSIZE_B5_ENVELOPE = 34;
    public static readonly PAPERSIZE_B6_ENVELOPE = 35;
    public static readonly PAPERSIZE_ITALY_ENVELOPE = 36;
    public static readonly PAPERSIZE_MONARCH_ENVELOPE = 37;
    public static readonly PAPERSIZE_6_3_4_ENVELOPE = 38;
    public static readonly PAPERSIZE_US_STANDARD_FANFOLD = 39;
    public static readonly PAPERSIZE_GERMAN_STANDARD_FANFOLD = 40;
    public static readonly PAPERSIZE_GERMAN_LEGAL_FANFOLD = 41;
    public static readonly PAPERSIZE_ISO_B4 = 42;
    public static readonly PAPERSIZE_JAPANESE_DOUBLE_POSTCARD = 43;
    public static readonly PAPERSIZE_STANDARD_PAPER_1 = 44;
    public static readonly PAPERSIZE_STANDARD_PAPER_2 = 45;
    public static readonly PAPERSIZE_STANDARD_PAPER_3 = 46;
    public static readonly PAPERSIZE_INVITE_ENVELOPE = 47;
    public static readonly PAPERSIZE_LETTER_EXTRA_PAPER = 48;
    public static readonly PAPERSIZE_LEGAL_EXTRA_PAPER = 49;
    public static readonly PAPERSIZE_TABLOID_EXTRA_PAPER = 50;
    public static readonly PAPERSIZE_A4_EXTRA_PAPER = 51;
    public static readonly PAPERSIZE_LETTER_TRANSVERSE_PAPER = 52;
    public static readonly PAPERSIZE_A4_TRANSVERSE_PAPER = 53;
    public static readonly PAPERSIZE_LETTER_EXTRA_TRANSVERSE_PAPER = 54;
    public static readonly PAPERSIZE_SUPERA_SUPERA_A4_PAPER = 55;
    public static readonly PAPERSIZE_SUPERB_SUPERB_A3_PAPER = 56;
    public static readonly PAPERSIZE_LETTER_PLUS_PAPER = 57;
    public static readonly PAPERSIZE_A4_PLUS_PAPER = 58;
    public static readonly PAPERSIZE_A5_TRANSVERSE_PAPER = 59;
    public static readonly PAPERSIZE_JIS_B5_TRANSVERSE_PAPER = 60;
    public static readonly PAPERSIZE_A3_EXTRA_PAPER = 61;
    public static readonly PAPERSIZE_A5_EXTRA_PAPER = 62;
    public static readonly PAPERSIZE_ISO_B5_EXTRA_PAPER = 63;
    public static readonly PAPERSIZE_A2_PAPER = 64;
    public static readonly PAPERSIZE_A3_TRANSVERSE_PAPER = 65;
    public static readonly PAPERSIZE_A3_EXTRA_TRANSVERSE_PAPER = 66;

    // Page orientation
    public static readonly ORIENTATION_DEFAULT = 'default';
    public static readonly ORIENTATION_LANDSCAPE = 'landscape';
    public static readonly ORIENTATION_PORTRAIT = 'portrait';

    // Print Range Set Method
    public static readonly SETPRINTRANGE_OVERWRITE = 'O';
    public static readonly SETPRINTRANGE_INSERT = 'I';

    public static readonly PAGEORDER_OVER_THEN_DOWN = 'overThenDown';
    public static readonly PAGEORDER_DOWN_THEN_OVER = 'downThenOver';

    /**
     * Paper size default.
     */
    static #paperSizeDefault: number = PageSetup.PAPERSIZE_LETTER;

    /**
     * Paper size.
     */
    #paperSize: number | null = null;

    /**
     * Orientation default.
     */
    static #orientationDefault: string = PageSetup.ORIENTATION_DEFAULT;

    /**
     * Orientation.
     */
    #orientation: string;

    /**
     * Scale (Print Scale).
     */
    #scale: number | null = 100;

    /**
     * Fit To Page.
     */
    #fitToPage: boolean = false;

    /**
     * Fit To Height.
     */
    #fitToHeight: number | null = 1;

    /**
     * Fit To Width.
     */
    #fitToWidth: number | null = 1;

    /**
     * Columns to repeat at left.
     */
    #columnsToRepeatAtLeft: [string, string] = ['', ''];

    /**
     * Rows to repeat at top.
     */
    #rowsToRepeatAtTop: [number, number] = [0, 0];

    /**
     * Center page horizontally.
     */
    #horizontalCentered: boolean = false;

    /**
     * Center page vertically.
     */
    #verticalCentered: boolean = false;

    /**
     * Print area.
     */
    #printArea: string | null = null;

    /**
     * First page number.
     */
    #firstPageNumber: number | null = null;

    #pageOrder: string = PageSetup.PAGEORDER_DOWN_THEN_OVER;

    /**
     * Create a new PageSetup.
     */
    constructor() {
        this.#orientation = PageSetup.#orientationDefault;
    }

    /**
     * Get Paper Size.
     */
    public getPaperSize(): number {
        return this.#paperSize ?? PageSetup.#paperSizeDefault;
    }

    /**
     * Set Paper Size.
     */
    public setPaperSize(paperSize: number): this {
        this.#paperSize = paperSize;
        return this;
    }

    /**
     * Get Paper Size default.
     */
    public static getPaperSizeDefault(): number {
        return PageSetup.#paperSizeDefault;
    }

    /**
     * Set Paper Size Default.
     */
    public static setPaperSizeDefault(paperSize: number): void {
        PageSetup.#paperSizeDefault = paperSize;
    }

    /**
     * Get Orientation.
     */
    public getOrientation(): string {
        return this.#orientation;
    }

    /**
     * Set Orientation.
     */
    public setOrientation(orientation: string): this {
        if (
            orientation === PageSetup.ORIENTATION_LANDSCAPE ||
            orientation === PageSetup.ORIENTATION_PORTRAIT ||
            orientation === PageSetup.ORIENTATION_DEFAULT
        ) {
            this.#orientation = orientation;
        }
        return this;
    }

    public static getOrientationDefault(): string {
        return PageSetup.#orientationDefault;
    }

    public static setOrientationDefault(orientation: string): void {
        if (
            orientation === PageSetup.ORIENTATION_LANDSCAPE ||
            orientation === PageSetup.ORIENTATION_PORTRAIT ||
            orientation === PageSetup.ORIENTATION_DEFAULT
        ) {
            PageSetup.#orientationDefault = orientation;
        }
    }

    /**
     * Get Scale.
     */
    public getScale(): number | null {
        return this.#scale;
    }

    /**
     * Set Scale.
     */
    public setScale(scale: number | null, update: boolean = true): this {
        if (scale === null || scale >= 0) {
            this.#scale = scale;
            if (update) {
                this.#fitToPage = false;
            }
        } else {
            throw new Error('Scale must not be negative');
        }
        return this;
    }

    /**
     * Get Fit To Page.
     */
    public getFitToPage(): boolean {
        return this.#fitToPage;
    }

    /**
     * Set Fit To Page.
     */
    public setFitToPage(fitToPage: boolean): this {
        this.#fitToPage = fitToPage;
        return this;
    }

    /**
     * Get Fit To Height.
     */
    public getFitToHeight(): number | null {
        return this.#fitToHeight;
    }

    /**
     * Set Fit To Height.
     */
    public setFitToHeight(fitToHeight: number | null, update: boolean = true): this {
        this.#fitToHeight = fitToHeight;
        if (update) {
            this.#fitToPage = true;
        }
        return this;
    }

    /**
     * Get Fit To Width.
     */
    public getFitToWidth(): number | null {
        return this.#fitToWidth;
    }

    /**
     * Set Fit To Width.
     */
    public setFitToWidth(value: number | null, update: boolean = true): this {
        this.#fitToWidth = value;
        if (update) {
            this.#fitToPage = true;
        }
        return this;
    }

    /**
     * Is Columns to repeat at left set?
     */
    public isColumnsToRepeatAtLeftSet(): boolean {
        return this.#columnsToRepeatAtLeft[0] !== '' && this.#columnsToRepeatAtLeft[1] !== '';
    }

    /**
     * Get Columns to repeat at left.
     */
    public getColumnsToRepeatAtLeft(): [string, string] {
        return this.#columnsToRepeatAtLeft;
    }

    /**
     * Set Columns to repeat at left.
     */
    public setColumnsToRepeatAtLeft(columnsToRepeatAtLeft: [string, string]): this {
        this.#columnsToRepeatAtLeft = columnsToRepeatAtLeft;
        return this;
    }

    /**
     * Set Columns to repeat at left by start and end.
     */
    public setColumnsToRepeatAtLeftByStartAndEnd(start: string, end: string): this {
        this.#columnsToRepeatAtLeft = [start, end];
        return this;
    }

    /**
     * Is Rows to repeat at top set?
     */
    public isRowsToRepeatAtTopSet(): boolean {
        return this.#rowsToRepeatAtTop[0] !== 0 && this.#rowsToRepeatAtTop[1] !== 0;
    }

    /**
     * Get Rows to repeat at top.
     */
    public getRowsToRepeatAtTop(): [number, number] {
        return this.#rowsToRepeatAtTop;
    }

    /**
     * Set Rows to repeat at top.
     */
    public setRowsToRepeatAtTop(rowsToRepeatAtTop: [number, number]): this {
        this.#rowsToRepeatAtTop = rowsToRepeatAtTop;
        return this;
    }

    /**
     * Set Rows to repeat at top by start and end.
     */
    public setRowsToRepeatAtTopByStartAndEnd(start: number, end: number): this {
        this.#rowsToRepeatAtTop = [start, end];
        return this;
    }

    /**
     * Get center page horizontally.
     */
    public getHorizontalCentered(): boolean {
        return this.#horizontalCentered;
    }

    /**
     * Set center page horizontally.
     */
    public setHorizontalCentered(value: boolean): this {
        this.#horizontalCentered = value;
        return this;
    }

    /**
     * Get center page vertically.
     */
    public getVerticalCentered(): boolean {
        return this.#verticalCentered;
    }

    /**
     * Set center page vertically.
     */
    public setVerticalCentered(value: boolean): this {
        this.#verticalCentered = value;
        return this;
    }

    /**
     * Get print area.
     */
    public getPrintArea(index: number = 0): string {
        if (index === 0) {
            return this.#printArea ?? '';
        }
        const printAreas = (this.#printArea ?? '').split(',');
        if (printAreas[index - 1] !== undefined) {
            return printAreas[index - 1]!;
        }
        throw new Error('Requested Print Area does not exist');
    }

    /**
     * Is print area set?
     */
    public isPrintAreaSet(index: number = 0): boolean {
        if (index === 0) {
            return this.#printArea !== null;
        }
        const printAreas = (this.#printArea ?? '').split(',');
        return printAreas[index - 1] !== undefined;
    }

    /**
     * Clear a print area.
     */
    public clearPrintArea(index: number = 0): this {
        if (index === 0) {
            this.#printArea = null;
        } else {
            const printAreas = (this.#printArea ?? '').split(',');
            if (printAreas[index - 1] !== undefined) {
                printAreas.splice(index - 1, 1);
                this.#printArea = printAreas.length > 0 ? printAreas.join(',') : null;
            }
        }
        return this;
    }

    /**
     * Set print area.
     */
    public setPrintArea(value: string, index: number = 0, method: string = PageSetup.SETPRINTRANGE_OVERWRITE): this {
        if (value.includes('!')) {
            throw new Error('Cell coordinate must not specify a worksheet.');
        } else if (!value.includes(':')) {
            throw new Error('Cell coordinate must be a range of cells.');
        } else if (value.includes('$')) {
            throw new Error('Cell coordinate must not be absolute.');
        }
        value = value.toUpperCase();
        if (!this.#printArea) {
            index = 0;
        }

        if (method === PageSetup.SETPRINTRANGE_OVERWRITE) {
            if (index === 0) {
                this.#printArea = value;
            } else {
                const printAreas = (this.#printArea ?? '').split(',');
                if (index < 0) {
                    index = printAreas.length - Math.abs(index) + 1;
                }
                if (index <= 0 || index > printAreas.length) {
                    throw new Error('Invalid index for setting print range.');
                }
                printAreas[index - 1] = value;
                this.#printArea = printAreas.join(',');
            }
        } else if (method === PageSetup.SETPRINTRANGE_INSERT) {
            if (index === 0) {
                this.#printArea = this.#printArea ? this.#printArea + ',' + value : value;
            } else {
                const printAreas = (this.#printArea ?? '').split(',');
                if (index < 0) {
                    index = Math.abs(index) - 1;
                }
                if (index > printAreas.length) {
                    throw new Error('Invalid index for setting print range.');
                }
                printAreas.splice(index, 0, value);
                this.#printArea = printAreas.join(',');
            }
        } else {
            throw new Error('Invalid method for setting print range.');
        }
        return this;
    }

    /**
     * Add a new print area.
     */
    public addPrintArea(value: string, index: number = -1): this {
        return this.setPrintArea(value, index, PageSetup.SETPRINTRANGE_INSERT);
    }

    /**
     * Get first page number.
     */
    public getFirstPageNumber(): number | null {
        return this.#firstPageNumber;
    }

    /**
     * Set first page number.
     */
    public setFirstPageNumber(value: number | null): this {
        this.#firstPageNumber = value;
        return this;
    }

    /**
     * Reset first page number.
     */
    public resetFirstPageNumber(): this {
        return this.setFirstPageNumber(null);
    }

    public getPageOrder(): string {
        return this.#pageOrder;
    }

    public setPageOrder(pageOrder: string | null): this {
        if (
            pageOrder === null ||
            pageOrder === PageSetup.PAGEORDER_DOWN_THEN_OVER ||
            pageOrder === PageSetup.PAGEORDER_OVER_THEN_DOWN
        ) {
            this.#pageOrder = pageOrder ?? PageSetup.PAGEORDER_DOWN_THEN_OVER;
        }
        return this;
    }
}
