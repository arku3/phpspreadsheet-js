import { Font } from './font.ts';
import { Fill } from './fill.ts';
import { Borders } from './borders.ts';
import { Alignment } from './alignment.ts';
import { NumberFormat } from './number-format.ts';
import { Protection } from './protection.ts';
import { createHash } from 'node:crypto';

/**
 * Style class.
 */
export class Style {
    /**
     * Font.
     */
    #font: Font;

    /**
     * Fill.
     */
    #fill: Fill;

    /**
     * Borders.
     */
    #borders: Borders;

    /**
     * Alignment.
     */
    #alignment: Alignment;

    /**
     * Number Format.
     */
    #numberFormat: NumberFormat;

    /**
     * Protection.
     */
    #protection: Protection;

    /**
     * Index of style in collection.
     */
    #index: number = 0;

    /**
     * Use Quote Prefix.
     */
    #quotePrefix: boolean = false;

    /**
     * Check Box.
     */
    #checkBox: boolean = false;

    /**
     * Create a new Style.
     */
    constructor() {
        this.#font = new Font();
        this.#fill = new Fill();
        this.#borders = new Borders();
        this.#alignment = new Alignment();
        this.#numberFormat = new NumberFormat();
        this.#protection = new Protection();
    }

    /**
     * Get Fill.
     */
    public getFill(): Fill {
        return this.#fill;
    }

    /**
     * Get Font.
     */
    public getFont(): Font {
        return this.#font;
    }

    /**
     * Set font.
     */
    public setFont(font: Font): this {
        this.#font = font;
        return this;
    }

    /**
     * Get Borders.
     */
    public getBorders(): Borders {
        return this.#borders;
    }

    /**
     * Get Alignment.
     */
    public getAlignment(): Alignment {
        return this.#alignment;
    }

    /**
     * Get Number Format.
     */
    public getNumberFormat(): NumberFormat {
        return this.#numberFormat;
    }

    /**
     * Get Protection.
     */
    public getProtection(): Protection {
        return this.#protection;
    }

    /**
     * Get quote prefix.
     */
    public getQuotePrefix(): boolean {
        return this.#quotePrefix;
    }

    /**
     * Set quote prefix.
     */
    public setQuotePrefix(quotePrefix: boolean): this {
        this.#quotePrefix = quotePrefix;
        return this;
    }

    /**
     * Get check box.
     */
    public getCheckBox(): boolean {
        return this.#checkBox;
    }

    /**
     * Set check box.
     */
    public setCheckBox(checkBox: boolean): this {
        this.#checkBox = checkBox;
        return this;
    }

    /**
     * Get index.
     */
    public getIndex(): number {
        return this.#index;
    }

    /**
     * Set index.
     */
    public setIndex(index: number): this {
        this.#index = index;
        return this;
    }

    /**
     * Apply styles from array.
     *
     * @param styleArray Array containing style information
     */
    public applyFromArray(styleArray: Record<string, unknown>): this {
        if (styleArray.fill !== undefined && typeof styleArray.fill === 'object') {
            this.getFill().applyFromArray(styleArray.fill as Record<string, unknown>);
        }
        if (styleArray.font !== undefined && typeof styleArray.font === 'object') {
            this.getFont().applyFromArray(styleArray.font as Record<string, unknown>);
        }
        if (styleArray.borders !== undefined && typeof styleArray.borders === 'object') {
            this.getBorders().applyFromArray(styleArray.borders as Record<string, unknown>);
        }
        if (styleArray.alignment !== undefined && typeof styleArray.alignment === 'object') {
            this.getAlignment().applyFromArray(styleArray.alignment as Record<string, unknown>);
        }
        if (styleArray.numberFormat !== undefined && typeof styleArray.numberFormat === 'object') {
            this.getNumberFormat().applyFromArray(styleArray.numberFormat as Record<string, unknown>);
        }
        if (styleArray.protection !== undefined && typeof styleArray.protection === 'object') {
            this.getProtection().applyFromArray(styleArray.protection as Record<string, unknown>);
        }
        if (styleArray.quotePrefix !== undefined) {
            this.setQuotePrefix(Boolean(styleArray.quotePrefix));
        }
        if (styleArray.checkBox !== undefined) {
            this.setCheckBox(Boolean(styleArray.checkBox));
        }
        return this;
    }

    /**
     * Get hash code.
     */
    public getHashCode(): string {
        return createHash('md5')
            .update(
                this.#fill.getHashCode() +
                this.#font.getHashCode() +
                this.#borders.getHashCode() +
                this.#alignment.getHashCode() +
                this.#numberFormat.getHashCode() +
                this.#protection.getHashCode() +
                (this.#quotePrefix ? 't' : 'f') +
                (this.#checkBox ? 't' : 'f') +
                'Style'
            )
            .digest('hex');
    }
}
