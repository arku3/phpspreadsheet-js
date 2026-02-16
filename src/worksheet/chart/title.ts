import { RichText } from '../../rich-text/rich-text.ts';
import { Font } from '../../style/font.ts';
import type { ChartLayout } from './chart.ts';

/**
 * Chart title class.
 * Represents a chart title which can be a simple string, rich text, or formula-based.
 */
export class Title {
    /**
     * Title caption - can be a string, RichText, or array of RichText/string for multi-line titles.
     */
    #caption: string | RichText | (string | RichText)[];

    /**
     * Cell reference for formula-based titles (e.g., "'Sheet1'!$A$1").
     */
    #cellReference: string | null = null;

    /**
     * Title layout configuration.
     */
    #layout: ChartLayout | null = null;

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
        layout: ChartLayout | null = null,
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
    public getCaptionText(): string {
        const caption = this.#caption;

        if (typeof caption === 'string') {
            return caption;
        }

        if (caption instanceof RichText) {
            return caption.getPlainText();
        }

        if (Array.isArray(caption)) {
            return caption
                .map((item) => {
                    if (item instanceof RichText) {
                        return item.getPlainText();
                    }
                    return String(item);
                })
                .join('');
        }

        return '';
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
    public getCellReference(): string | null {
        return this.#cellReference;
    }

    /**
     * Set cell reference for formula-based titles.
     *
     * @param cellReference - Cell reference (e.g., "'Sheet1'!$A$1")
     * @returns this for method chaining
     */
    public setCellReference(cellReference: string | null): this {
        this.#cellReference = cellReference;
        return this;
    }

    /**
     * Check if this title is formula-based (has a cell reference).
     *
     * @returns true if cellReference is set
     */
    public isFormulaBased(): boolean {
        return this.#cellReference !== null && this.#cellReference !== '';
    }

    /**
     * Get layout.
     *
     * @returns Layout configuration or null
     */
    public getLayout(): ChartLayout | null {
        return this.#layout;
    }

    /**
     * Set layout.
     *
     * @param layout - Layout configuration
     * @returns this for method chaining
     */
    public setLayout(layout: ChartLayout | null): this {
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
}
