import type { ITextElement } from './i-text-element.ts';
import { TextElement } from './text-element.ts';
import { Run } from './run.ts';
import { Cell, DataType } from '../core/cell.ts';
import { createHash } from 'node:crypto';

/**
 * Rich text class.
 */
export class RichText {
    /**
     * Rich text elements.
     */
    #richTextElements: ITextElement[] = [];

    /**
     * Create a new RichText instance.
     *
     * @param cell Optional Cell to create rich text from
     */
    constructor(cell?: Cell) {
        if (cell) {
            const value = cell.getValue();
            const text = typeof value === 'string' ? value : String(value ?? '');
            if (text !== '') {
                const run = new Run(text);
                const font = cell.getWorksheet().getStyle(cell.getCoordinate()).getFont();
                run.setFont(font.clone());
                this.addText(run);
            }
            cell.setValueExplicit(this, DataType.TYPE_STRING);
        }
    }

    /**
     * Add text.
     *
     * @param element Rich text element
     */
    public addText(element: ITextElement): this {
        this.#richTextElements.push(element);
        return this;
    }

    /**
     * Create text.
     *
     * @param text Text
     */
    public createText(text: string): TextElement {
        const element = new TextElement(text);
        this.addText(element);
        return element;
    }

    /**
     * Create text run.
     *
     * @param text Text
     */
    public createTextRun(text: string): Run {
        const element = new Run(text);
        this.addText(element);
        return element;
    }

    /**
     * Get plain text.
     */
    public getPlainText(): string {
        return this.#richTextElements.map(element => element.getText()).join('');
    }

    /**
     * Convert to string.
     */
    public toString(): string {
        return this.getPlainText();
    }

    /**
     * Get rich text elements.
     */
    public getRichTextElements(): ITextElement[] {
        return this.#richTextElements;
    }

    /**
     * Set rich text elements.
     */
    public setRichTextElements(elements: ITextElement[]): this {
        this.#richTextElements = elements;
        return this;
    }

    /**
     * Get hash code.
     */
    public getHashCode(): string {
        const hash = createHash('md5');
        for (const element of this.#richTextElements) {
            hash.update(element.getHashCode());
        }
        hash.update('RichText');
        return hash.digest('hex');
    }
}
