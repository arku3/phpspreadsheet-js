import { Font } from '../style/font.ts';

/**
 * Rich text element interface.
 */
export interface ITextElement {
    /**
     * Get text.
     */
    getText(): string;

    /**
     * Set text.
     *
     * @param text Text
     */
    setText(text: string): this;

    /**
     * Get font.
     */
    getFont(): Font | null;

    /**
     * Get hash code.
     */
    getHashCode(): string;
}

