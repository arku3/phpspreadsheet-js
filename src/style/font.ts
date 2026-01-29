import { Color } from './color.ts';
import { createHash } from 'node:crypto';

/**
 * Font style.
 */
export class Font {
    public static readonly UNDERLINE_NONE = 'none';
    public static readonly UNDERLINE_DOUBLE = 'double';
    public static readonly UNDERLINE_DOUBLEACCOUNTING = 'doubleAccounting';
    public static readonly UNDERLINE_SINGLE = 'single';
    public static readonly UNDERLINE_SINGLEACCOUNTING = 'singleAccounting';

    #name: string = 'Calibri';
    #size: number = 11;
    #bold: boolean = false;
    #italic: boolean = false;
    #superscript: boolean = false;
    #subscript: boolean = false;
    #underline: string = Font.UNDERLINE_NONE;
    #strikethrough: boolean = false;
    #color: Color;
    #scheme: string = '';

    constructor() {
        this.#color = new Color(Color.COLOR_BLACK);
    }

    public getName(): string {
        return this.#name;
    }

    public setName(name: string): this {
        this.#name = name || 'Calibri';
        return this;
    }

    public getSize(): number {
        return this.#size;
    }

    public setSize(size: number): this {
        this.#size = size > 0 ? size : 10;
        return this;
    }

    public getBold(): boolean {
        return this.#bold;
    }

    public setBold(bold: boolean): this {
        this.#bold = bold;
        return this;
    }

    public getItalic(): boolean {
        return this.#italic;
    }

    public setItalic(italic: boolean): this {
        this.#italic = italic;
        return this;
    }

    public getSuperscript(): boolean {
        return this.#superscript;
    }

    public setSuperscript(superscript: boolean): this {
        this.#superscript = superscript;
        if (superscript) {
            this.#subscript = false;
        }
        return this;
    }

    public getSubscript(): boolean {
        return this.#subscript;
    }

    public setSubscript(subscript: boolean): this {
        this.#subscript = subscript;
        if (subscript) {
            this.#superscript = false;
        }
        return this;
    }

    public getUnderline(): string {
        return this.#underline;
    }

    public setUnderline(underline: string): this {
        this.#underline = underline || Font.UNDERLINE_NONE;
        return this;
    }

    public getStrikethrough(): boolean {
        return this.#strikethrough;
    }

    public setStrikethrough(strikethrough: boolean): this {
        this.#strikethrough = strikethrough;
        return this;
    }

    public getColor(): Color {
        return this.#color;
    }

    public setColor(color: Color): this {
        this.#color = color;
        return this;
    }

    public getScheme(): string {
        return this.#scheme;
    }

    public setScheme(scheme: string): this {
        this.#scheme = scheme;
        return this;
    }

    /**
     * Get hash code.
     */
    public getHashCode(): string {
        return createHash('md5')
            .update(
                this.#name +
                this.#size +
                (this.#bold ? 't' : 'f') +
                (this.#italic ? 't' : 'f') +
                (this.#superscript ? 't' : 'f') +
                (this.#subscript ? 't' : 'f') +
                this.#underline +
                (this.#strikethrough ? 't' : 'f') +
                this.#color.getHashCode() +
                this.#scheme +
                'Font'
            )
            .digest('hex');
    }
}
