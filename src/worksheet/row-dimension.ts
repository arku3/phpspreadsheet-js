import { Dimension } from './dimension.ts';

/**
 * Row dimension.
 */
export class RowDimension extends Dimension {
    /**
     * Row index.
     */
    #rowIndex: number | null;

    /**
     * Row height (in pt).
     */
    #height: number = -1;

    /**
     * ZeroHeight for Row?
     */
    #zeroHeight: boolean = false;

    /**
     * Custom format?
     */
    #customFormat: boolean = false;

    /**
     * Visible after filter?
     */
    #visibleAfterFilter: boolean = true;

    /**
     * Create a new RowDimension.
     *
     * @param index Numeric row index
     */
    constructor(index: number | null = 0) {
        super(null); // initial value for xfIndex
        this.#rowIndex = index;
    }

    /**
     * Get row index.
     */
    public getRowIndex(): number | null {
        return this.#rowIndex;
    }

    /**
     * Set row index.
     */
    public setRowIndex(index: number): this {
        this.#rowIndex = index;
        return this;
    }

    /**
     * Get Row Height.
     */
    public getRowHeight(): number {
        return this.#height;
    }

    /**
     * Set Row Height.
     */
    public setRowHeight(height: number): this {
        this.#height = height;
        this.#customFormat = false;
        return this;
    }

    /**
     * Get ZeroHeight.
     */
    public getZeroHeight(): boolean {
        return this.#zeroHeight;
    }

    /**
     * Set ZeroHeight.
     */
    public setZeroHeight(zeroHeight: boolean): this {
        this.#zeroHeight = zeroHeight;
        return this;
    }

    /**
     * Get CustomFormat.
     */
    public getCustomFormat(): boolean {
        return this.#customFormat;
    }

    /**
     * Set CustomFormat.
     */
    public setCustomFormat(customFormat: boolean, height: number | null = -1): this {
        this.#customFormat = customFormat;
        if (height !== null) {
            this.#height = height;
        }
        return this;
    }

    /**
     * Get visible after filter.
     */
    public getVisibleAfterFilter(): boolean {
        return this.#visibleAfterFilter;
    }

    /**
     * Set visible after filter.
     */
    public setVisibleAfterFilter(visibleAfterFilter: boolean): this {
        this.#visibleAfterFilter = visibleAfterFilter;
        return this;
    }
}
