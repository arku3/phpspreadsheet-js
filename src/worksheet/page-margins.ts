/**
 * Page margins.
 */
export class PageMargins {
    /**
     * Left.
     */
    #left: number = 0.7;

    /**
     * Right.
     */
    #right: number = 0.7;

    /**
     * Top.
     */
    #top: number = 0.75;

    /**
     * Bottom.
     */
    #bottom: number = 0.75;

    /**
     * Header.
     */
    #header: number = 0.3;

    /**
     * Footer.
     */
    #footer: number = 0.3;

    /**
     * Create a new PageMargins.
     */
    constructor() {}

    /**
     * Get Left.
     */
    public getLeft(): number {
        return this.#left;
    }

    /**
     * Set Left.
     */
    public setLeft(left: number): this {
        this.#left = left;
        return this;
    }

    /**
     * Get Right.
     */
    public getRight(): number {
        return this.#right;
    }

    /**
     * Set Right.
     */
    public setRight(right: number): this {
        this.#right = right;
        return this;
    }

    /**
     * Get Top.
     */
    public getTop(): number {
        return this.#top;
    }

    /**
     * Set Top.
     */
    public setTop(top: number): this {
        this.#top = top;
        return this;
    }

    /**
     * Get Bottom.
     */
    public getBottom(): number {
        return this.#bottom;
    }

    /**
     * Set Bottom.
     */
    public setBottom(bottom: number): this {
        this.#bottom = bottom;
        return this;
    }

    /**
     * Get Header.
     */
    public getHeader(): number {
        return this.#header;
    }

    /**
     * Set Header.
     */
    public setHeader(header: number): this {
        this.#header = header;
        return this;
    }

    /**
     * Get Footer.
     */
    public getFooter(): number {
        return this.#footer;
    }

    /**
     * Set Footer.
     */
    public setFooter(footer: number): this {
        this.#footer = footer;
        return this;
    }

    public static fromCentimeters(value: number): number {
        return value / 2.54;
    }

    public static toCentimeters(value: number): number {
        return value * 2.54;
    }

    public static fromMillimeters(value: number): number {
        return value / 25.4;
    }

    public static toMillimeters(value: number): number {
        return value * 25.4;
    }

    public static fromPoints(value: number): number {
        return value / 72;
    }

    public static toPoints(value: number): number {
        return value * 72;
    }
}
