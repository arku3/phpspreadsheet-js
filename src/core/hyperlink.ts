/**
 * Hyperlink associated with a cell.
 *
 * Minimal port of PhpSpreadsheet's Cell\Hyperlink.
 */
export class Hyperlink {
    #url: string;
    #location: string;
    #tooltip: string;

    constructor(url: string = '', location: string = '', tooltip: string = '') {
        this.#url = url;
        this.#location = location;
        this.#tooltip = tooltip;
    }

    /**
     * Get hyperlink URL.
     */
    public getUrl(): string {
        return this.#url;
    }

    /**
     * Set hyperlink URL.
     */
    public setUrl(url: string): this {
        this.#url = url;
        return this;
    }

    /**
     * Get internal location (e.g., 'Sheet1!A1').
     */
    public getLocation(): string {
        return this.#location;
    }

    /**
     * Set internal location (e.g., 'Sheet1!A1').
     */
    public setLocation(location: string): this {
        this.#location = location;
        return this;
    }

    /**
     * Get tooltip.
     */
    public getTooltip(): string {
        return this.#tooltip;
    }

    /**
     * Set tooltip.
     */
    public setTooltip(tooltip: string): this {
        this.#tooltip = tooltip;
        return this;
    }

    /**
     * True if this hyperlink has no target information.
     */
    public isEmpty(): boolean {
        return this.#url === '' && this.#location === '' && this.#tooltip === '';
    }
}
