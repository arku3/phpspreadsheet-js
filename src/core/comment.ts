import { RichText } from '../rich-text/rich-text.ts';

/**
 * Optional comment positioning metadata.
 *
 * TODO: Implement full Excel/PhpSpreadsheet parity for classic comment sizing/anchors.
 */
export interface CommentPosition {
    /** Left offset in pixels. */
    x?: number;
    /** Top offset in pixels. */
    y?: number;
    /** Width in pixels. */
    width?: number;
    /** Height in pixels. */
    height?: number;
}

/**
 * Classic worksheet comment (Excel "note").
 *
 * Mirrors the core API shape of PhpSpreadsheet's Comment for author/text/visibility.
 */
export class Comment {
    #author: string;
    #text: RichText;
    #visible: boolean;
    #position: CommentPosition | null;

    constructor() {
        // Match PhpSpreadsheet default.
        this.#author = 'Author';
        this.#text = new RichText();
        this.#visible = false;
        this.#position = null;
    }

    /**
     * Get the comment author.
     */
    public getAuthor(): string {
        return this.#author;
    }

    /**
     * Set the comment author.
     */
    public setAuthor(author: string): this {
        this.#author = author;
        return this;
    }

    /**
     * Get the rich text body.
     */
    public getText(): RichText {
        return this.#text;
    }

    /**
     * Set the rich text body.
     */
    public setText(text: RichText): this {
        this.#text = text;
        return this;
    }

    /**
     * True if the comment is visible by default.
     */
    public getVisible(): boolean {
        return this.#visible;
    }

    /**
     * Set whether the comment is visible by default.
     */
    public setVisible(visible: boolean): this {
        this.#visible = visible;
        return this;
    }

    /**
     * Get positioning metadata (if present).
     */
    public getPosition(): CommentPosition | null {
        return this.#position;
    }

    /**
     * Set positioning metadata.
     */
    public setPosition(position: CommentPosition | null): this {
        this.#position = position;
        return this;
    }
}
