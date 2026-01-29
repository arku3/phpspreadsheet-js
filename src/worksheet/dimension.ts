/**
 * Base class for ColumnDimension and RowDimension.
 */
export abstract class Dimension {
    /**
     * Visible?
     */
    #visible: boolean = true;

    /**
     * Outline level.
     */
    #outlineLevel: number = 0;

    /**
     * Collapsed.
     */
    #collapsed: boolean = false;

    /**
     * Index to cellXf.
     */
    #xfIndex: number | null = null;

    /**
     * Create a new Dimension.
     *
     * @param initialValue Numeric row index or null
     */
    constructor(initialValue: number | null = null) {
        this.#xfIndex = initialValue;
    }

    /**
     * Get Visible.
     */
    public getVisible(): boolean {
        return this.#visible;
    }

    /**
     * Set Visible.
     */
    public setVisible(visible: boolean): this {
        this.#visible = visible;
        return this;
    }

    /**
     * Get Outline Level.
     */
    public getOutlineLevel(): number {
        return this.#outlineLevel;
    }

    /**
     * Set Outline Level.
     * Value must be between 0 and 7.
     */
    public setOutlineLevel(level: number): this {
        if (level < 0 || level > 7) {
            throw new Error('Outline level must range between 0 and 7.');
        }
        this.#outlineLevel = level;
        return this;
    }

    /**
     * Get Collapsed.
     */
    public getCollapsed(): boolean {
        return this.#collapsed;
    }

    /**
     * Set Collapsed.
     */
    public setCollapsed(collapsed: boolean): this {
        this.#collapsed = collapsed;
        return this;
    }

    /**
     * Get index to cellXf.
     */
    public getXfIndex(): number | null {
        return this.#xfIndex;
    }

    /**
     * Set index to cellXf.
     */
    public setXfIndex(xfIndex: number): this {
        this.#xfIndex = xfIndex;
        return this;
    }
}
