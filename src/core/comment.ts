import { RichText } from '../rich-text/rich-text.ts';
import { Color } from '../style/color.ts';
import { Drawing } from '../worksheet/drawing/drawing.ts';

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
    public static readonly TEXTBOX_DIRECTION_RTL = 'rtl';
    public static readonly TEXTBOX_DIRECTION_LTR = 'ltr';
    public static readonly TEXTBOX_DIRECTION_AUTO = 'auto';
    public static readonly TEXTBOX_DIRECTION_CONTEXT = 'context';

    #author: string;
    #text: RichText;
    #visible: boolean;
    #position: CommentPosition | null;
    #width: string;
    #height: string;
    #marginLeft: string;
    #marginTop: string;
    #fillColor: Color;
    #alignment: string;
    #backgroundImage: Drawing | null;
    #textBoxDirection: string;

    constructor() {
        // Match PhpSpreadsheet default.
        this.#author = 'Author';
        this.#text = new RichText();
        this.#visible = false;
        this.#position = null;
        this.#width = '96pt';
        this.#height = '55.5pt';
        this.#marginLeft = '59.25pt';
        this.#marginTop = '1.5pt';
        this.#fillColor = new Color('FFFFFFE1');
        this.#alignment = 'general';
        this.#backgroundImage = null;
        this.#textBoxDirection = Comment.TEXTBOX_DIRECTION_CONTEXT;
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

    public getWidth(): string {
        return this.#width;
    }

    public setWidth(width: string): this {
        this.#width = width;
        return this;
    }

    public getHeight(): string {
        return this.#height;
    }

    public setHeight(height: string): this {
        this.#height = height;
        return this;
    }

    public getMarginLeft(): string {
        return this.#marginLeft;
    }

    public setMarginLeft(marginLeft: string): this {
        this.#marginLeft = marginLeft;
        return this;
    }

    public getMarginTop(): string {
        return this.#marginTop;
    }

    public setMarginTop(marginTop: string): this {
        this.#marginTop = marginTop;
        return this;
    }

    public getFillColor(): Color {
        return this.#fillColor;
    }

    public setFillColor(color: Color): this {
        this.#fillColor = color;
        return this;
    }

    public getAlignment(): string {
        return this.#alignment;
    }

    public setAlignment(alignment: string): this {
        this.#alignment = alignment;
        return this;
    }

    public getBackgroundImage(): Drawing | null {
        return this.#backgroundImage;
    }

    public setBackgroundImage(backgroundImage: Drawing | null): this {
        this.#backgroundImage = backgroundImage;
        return this;
    }

    public getTextBoxDirection(): string {
        return this.#textBoxDirection;
    }

    public setTextBoxDirection(direction: string): this {
        const normalized = direction.toLowerCase();
        if (
            normalized !== Comment.TEXTBOX_DIRECTION_RTL &&
            normalized !== Comment.TEXTBOX_DIRECTION_LTR &&
            normalized !== Comment.TEXTBOX_DIRECTION_AUTO &&
            normalized !== Comment.TEXTBOX_DIRECTION_CONTEXT
        ) {
            throw new Error(`Invalid textbox direction ${direction}`);
        }
        this.#textBoxDirection = normalized;
        return this;
    }

    public getHashCode(): string {
        const content = [
            this.#author,
            this.#text.getHashCode(),
            this.#width,
            this.#height,
            this.#marginLeft,
            this.#marginTop,
            this.#visible ? 't' : 'f',
            this.#fillColor.getHashCode(),
            this.#alignment,
            this.#backgroundImage ? this.#backgroundImage.getCoordinates() : '',
            this.#textBoxDirection,
            'Comment',
        ].join('');
        return Bun.hash(content).toString(16);
    }

    public clone(): Comment {
        const comment = new Comment();
        comment
            .setAuthor(this.#author)
            .setText(this.#text)
            .setVisible(this.#visible)
            .setPosition(this.#position)
            .setWidth(this.#width)
            .setHeight(this.#height)
            .setMarginLeft(this.#marginLeft)
            .setMarginTop(this.#marginTop)
            .setFillColor(this.#fillColor)
            .setAlignment(this.#alignment)
            .setTextBoxDirection(this.#textBoxDirection);

        if (this.#backgroundImage) {
            comment.setBackgroundImage(this.#backgroundImage.clone());
        }

        return comment;
    }

    public toString(): string {
        return this.#text.getPlainText();
    }
}
