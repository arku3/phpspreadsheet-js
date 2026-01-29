import { TextElement } from './text-element.ts';
import { Font } from '../style/font.ts';
import { createHash } from 'node:crypto';

/**
 * Rich text run class.
 */
export class Run extends TextElement {
    /**
     * Font.
     */
    #font: Font | null;

    /**
     * Create a new Run instance.
     *
     * @param text Text
     */
    constructor(text: string = '') {
        super(text);
        this.#font = new Font();
    }

    /**
     * Get font.
     */
    public override getFont(): Font | null {
        return this.#font;
    }

    /**
     * Set font.
     */
    public setFont(font: Font | null = null): this {
        this.#font = font;
        return this;
    }

    /**
     * Get hash code.
     */
    public override getHashCode(): string {
        return createHash('md5')
            .update(
                this.getText() +
                (this.#font ? this.#font.getHashCode() : '') +
                'Run'
            )
            .digest('hex');
    }
}
