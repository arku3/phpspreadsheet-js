import { createHash } from 'node:crypto';
import { Font } from '../style/font.ts';
import type { ITextElement } from './i-text-element.ts';

/**
 * Text element class.
 */
export class TextElement implements ITextElement {
    /**
     * Text.
     */
    #text: string;

    /**
     * Create a new TextElement instance.
     *
     * @param text Text
     */
    constructor(text: string = '') {
        this.#text = text;
    }

    /**
     * Get text.
     */
    public getText(): string {
        return this.#text;
    }

    /**
     * Set text.
     */
    public setText(text: string): this {
        this.#text = text;
        return this;
    }

    /**
     * Get font. For this class, the return value is always null.
     */
    public getFont(): Font | null {
        return null;
    }

    /**
     * Get hash code.
     */
    public getHashCode(): string {
        return createHash('md5')
            .update(this.#text + 'TextElement')
            .digest('hex');
    }
}
