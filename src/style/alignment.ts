import { createHash } from 'node:crypto';

/**
 * Alignment style.
 */
export class Alignment {
    // Horizontal alignment styles
    public static readonly HORIZONTAL_GENERAL = 'general';
    public static readonly HORIZONTAL_LEFT = 'left';
    public static readonly HORIZONTAL_RIGHT = 'right';
    public static readonly HORIZONTAL_CENTER = 'center';
    public static readonly HORIZONTAL_CENTER_CONTINUOUS = 'centerContinuous';
    public static readonly HORIZONTAL_JUSTIFY = 'justify';
    public static readonly HORIZONTAL_FILL = 'fill';
    public static readonly HORIZONTAL_DISTRIBUTED = 'distributed';

    // Vertical alignment styles
    public static readonly VERTICAL_BOTTOM = 'bottom';
    public static readonly VERTICAL_TOP = 'top';
    public static readonly VERTICAL_CENTER = 'center';
    public static readonly VERTICAL_JUSTIFY = 'justify';
    public static readonly VERTICAL_DISTRIBUTED = 'distributed';

    // Read order
    public static readonly READORDER_CONTEXT = 0;
    public static readonly READORDER_LTR = 1;
    public static readonly READORDER_RTL = 2;

    /**
     * Horizontal alignment.
     */
    #horizontal: string = Alignment.HORIZONTAL_GENERAL;

    /**
     * Vertical alignment.
     */
    #vertical: string = Alignment.VERTICAL_BOTTOM;

    /**
     * Text rotation.
     */
    #textRotation: number = 0;

    /**
     * Wrap text.
     */
    #wrapText: boolean = false;

    /**
     * Shrink to fit.
     */
    #shrinkToFit: boolean = false;

    /**
     * Indent.
     */
    #indent: number = 0;

    /**
     * Read order.
     */
    #readOrder: number = 0;

    /**
     * Justify last line.
     */
    #justifyLastLine: boolean = false;

    /**
     * Get horizontal.
     */
    public getHorizontal(): string {
        return this.#horizontal;
    }

    /**
     * Set horizontal.
     */
    public setHorizontal(horizontal: string): this {
        this.#horizontal = horizontal;
        return this;
    }

    /**
     * Get vertical.
     */
    public getVertical(): string {
        return this.#vertical;
    }

    /**
     * Set vertical.
     */
    public setVertical(vertical: string): this {
        this.#vertical = vertical;
        return this;
    }

    /**
     * Get text rotation.
     */
    public getTextRotation(): number {
        return this.#textRotation;
    }

    /**
     * Set text rotation.
     */
    public setTextRotation(rotation: number): this {
        this.#textRotation = rotation;
        return this;
    }

    /**
     * Get wrap text.
     */
    public getWrapText(): boolean {
        return this.#wrapText;
    }

    /**
     * Set wrap text.
     */
    public setWrapText(wrapText: boolean): this {
        this.#wrapText = wrapText;
        return this;
    }

    /**
     * Get shrink to fit.
     */
    public getShrinkToFit(): boolean {
        return this.#shrinkToFit;
    }

    /**
     * Set shrink to fit.
     */
    public setShrinkToFit(shrinkToFit: boolean): this {
        this.#shrinkToFit = shrinkToFit;
        return this;
    }

    /**
     * Get indent.
     */
    public getIndent(): number {
        return this.#indent;
    }

    /**
     * Set indent.
     */
    public setIndent(indent: number): this {
        this.#indent = indent;
        return this;
    }

    /**
     * Get read order.
     */
    public getReadOrder(): number {
        return this.#readOrder;
    }

    /**
     * Set read order.
     */
    public setReadOrder(readOrder: number): this {
        this.#readOrder = readOrder;
        return this;
    }

    /**
     * Get justify last line.
     */
    public getJustifyLastLine(): boolean {
        return this.#justifyLastLine;
    }

    /**
     * Set justify last line.
     */
    public setJustifyLastLine(justifyLastLine: boolean): this {
        this.#justifyLastLine = justifyLastLine;
        return this;
    }

    /**
     * Apply styles from array.
     *
     * @param styleArray Array containing style information
     */
    public applyFromArray(styleArray: Record<string, unknown>): this {
        if (styleArray.horizontal !== undefined) {
            let horizontal = String(styleArray.horizontal).toLowerCase();
            if (horizontal === 'centercontinuous') {
                horizontal = Alignment.HORIZONTAL_CENTER_CONTINUOUS;
            }
            this.setHorizontal(horizontal);
        }
        if (styleArray.vertical !== undefined) {
            this.setVertical(String(styleArray.vertical).toLowerCase());
        }
        if (styleArray.textRotation !== undefined) {
            this.setTextRotation(Number(styleArray.textRotation));
        }
        if (styleArray.wrapText !== undefined) {
            this.setWrapText(Boolean(styleArray.wrapText));
        }
        if (styleArray.shrinkToFit !== undefined) {
            this.setShrinkToFit(Boolean(styleArray.shrinkToFit));
        }
        if (styleArray.indent !== undefined) {
            this.setIndent(Number(styleArray.indent));
        }
        if (styleArray.readOrder !== undefined) {
            this.setReadOrder(Number(styleArray.readOrder));
        }
        if (styleArray.justifyLastLine !== undefined) {
            this.setJustifyLastLine(Boolean(styleArray.justifyLastLine));
        }
        return this;
    }

    /**
     * Get hash code.
     */
    public getHashCode(): string {
        return createHash('md5')
            .update(
                this.#horizontal +
                this.#vertical +
                this.#textRotation +
                (this.#wrapText ? 't' : 'f') +
                (this.#shrinkToFit ? 't' : 'f') +
                this.#indent +
                this.#readOrder +
                (this.#justifyLastLine ? 't' : 'f') +
                'Alignment'
            )
            .digest('hex');
    }
}
