import type { Spreadsheet } from '../../core/spreadsheet.ts';
import { RichText } from '../../rich-text/rich-text.ts';
import { Font } from '../../style/font.ts';
import type { ChartLayout } from './chart.ts';
import type { Layout } from './layout';

/**
 * Chart title class.
 * Represents a chart title which can be a simple string, rich text, or formula-based.
 */
export class Title {
    public static readonly TITLE_CELL_REFERENCE = /^(.*)![$]([A-Z]{1,3})[$](\d{1,7})$/i;
    /**
     * Title caption - can be a string, RichText, or array of RichText/string for multi-line titles.
     */
    #caption: string | RichText | (string | RichText)[];

    /**
     * Cell reference for formula-based titles (e.g., "'Sheet1'!$A$1").
     */
    #cellReference: string = '';

    /**
     * Title layout configuration.
     */
    #layout: ChartLayout | Layout | null = null;

    /**
     * Title font styling.
     */
    #font: Font | null = null;

    /**
     * Allow overlay of other elements.
     */
    #overlay = true;

    /**
     * Create a new Title.
     *
     * @param caption - The title caption (string, RichText, or array for multi-line)
     * @param layout - Optional layout configuration
     * @param overlay - Whether to allow overlay of other elements
     */
    constructor(
        caption: string | RichText | (string | RichText)[] = '',
        layout: ChartLayout | Layout | null = null,
        overlay = false,
    ) {
        this.#caption = caption;
        this.#layout = layout;
        this.setOverlay(overlay);
    }

    /**
     * Get caption.
     *
     * @returns The caption as string, RichText, or array
     */
    public getCaption(): string | RichText | (string | RichText)[] {
        return this.#caption;
    }

    /**
     * Set caption.
     *
     * @param caption - The caption to set
     * @returns this for method chaining
     */
    public setCaption(caption: string | RichText | (string | RichText)[]): this {
        this.#caption = caption;
        return this;
    }

    /**
     * Get the text content of the caption.
     * Returns plain text extracted from RichText if applicable.
     *
     * @returns Plain text string
     */
    public getCaptionText(spreadsheet: Spreadsheet | null = null): string {
        if (spreadsheet) {
            const calculated = this.getCalculatedTitle(spreadsheet);
            if (calculated !== null) {
                return calculated;
            }
        }
        return Title.captionToString(this.#caption);
    }

    /**
     * Get text - alias for getCaptionText() for compatibility.
     *
     * @returns Plain text string
     */
    public getText(): string {
        return this.getCaptionText();
    }

    /**
     * Get cell reference for formula-based titles.
     *
     * @returns Cell reference string or null
     */
    public getCellReference(): string {
        return this.#cellReference;
    }

    /**
     * Set cell reference for formula-based titles.
     *
     * @param cellReference - Cell reference (e.g., "'Sheet1'!$A$1")
     * @returns this for method chaining
     */
    public setCellReference(cellReference: string | null): this {
        this.#cellReference = cellReference ?? '';
        return this;
    }

    /**
     * Check if this title is formula-based (has a cell reference).
     *
     * @returns true if cellReference is set
     */
    public isFormulaBased(): boolean {
        return this.#cellReference !== '';
    }

    /**
     * Get layout.
     *
     * @returns Layout configuration or null
     */
    public getLayout(): ChartLayout | Layout | null {
        return this.#layout;
    }

    /**
     * Set layout.
     *
     * @param layout - Layout configuration
     * @returns this for method chaining
     */
    public setLayout(layout: ChartLayout | Layout | null): this {
        this.#layout = layout;
        return this;
    }

    /**
     * Get title font.
     */
    public getFont(): Font | null {
        return this.#font;
    }

    /**
     * Set title font.
     */
    public setFont(font: Font | null): this {
        this.#font = font;
        return this;
    }

    /**
     * Get allow overlay of other elements.
     *
     * @returns Whether overlay is allowed
     */
    public getOverlay(): boolean {
        return this.#overlay;
    }

    /**
     * Set allow overlay of other elements.
     *
     * @param overlay - Whether to allow overlay
     * @returns this for method chaining
     */
    public setOverlay(overlay: boolean): this {
        this.#overlay = overlay;
        return this;
    }

    public getCalculatedTitle(spreadsheet: Spreadsheet | null): string | null {
        if (!spreadsheet) {
            return null;
        }
        const cellReference = this.#cellReference;
        const match = Title.TITLE_CELL_REFERENCE.exec(cellReference);
        if (!match) {
            return null;
        }
        const sheetName = match[1]?.replace(/^'(.*)'$/, '$1') ?? '';
        const column = match[2] ?? '';
        const row = match[3] ?? '';
        const worksheet = spreadsheet.getSheetByName(sheetName);
        if (!worksheet) {
            return null;
        }
        const cell = worksheet.getCell(`${column}${row}`);
        return cell.getFormattedValue();
    }

    public clone(): Title {
        const cloned = new Title(Title.cloneCaption(this.#caption), this.#layout, this.#overlay);
        cloned.#cellReference = this.#cellReference;
        cloned.#font = this.#font ? this.#font.clone() : null;
        return cloned;
    }

    private static captionToString(caption: string | RichText | (string | RichText)[]): string {
        if (Array.isArray(caption)) {
            return caption.map((item) => (typeof item === 'string' ? item : item.getPlainText())).join('');
        }
        if (typeof caption === 'string') {
            return caption;
        }
        return caption.getPlainText();
    }

    private static cloneCaption(
        caption: string | RichText | (string | RichText)[],
    ): string | RichText | (string | RichText)[] {
        if (typeof caption === 'string') {
            return caption;
        }
        if (Array.isArray(caption)) {
            return caption.map((item) => (typeof item === 'string' ? item : Title.cloneRichText(item)));
        }
        return Title.cloneRichText(caption);
    }

    private static cloneRichText(richText: RichText): RichText {
        const cloned = new RichText();
        cloned.setRichTextElements([...richText.getRichTextElements()]);
        return cloned;
    }
}
