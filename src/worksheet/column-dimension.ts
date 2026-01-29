import { Coordinate } from '../utils/coordinate.ts';
import { Dimension } from './dimension.ts';

/**
 * Column dimension.
 */
export class ColumnDimension extends Dimension {
    public static readonly EXCEL_MAX_WIDTH = 255.0;

    /**
     * Column index.
     */
    #columnIndex: string | null;

    /**
     * Column width.
     */
    #width: number = -1;

    /**
     * Auto size?
     */
    #autoSize: boolean = false;

    /**
     * Create a new ColumnDimension.
     *
     * @param index Character column index
     */
    constructor(index: string | null = 'A') {
        super(0); // initial value for xfIndex
        this.#columnIndex = index;
    }

    /**
     * Get column index as string eg: 'A'.
     */
    public getColumnIndex(): string | null {
        return this.#columnIndex;
    }

    /**
     * Set column index as string eg: 'A'.
     */
    public setColumnIndex(index: string): this {
        this.#columnIndex = index;
        return this;
    }

    /**
     * Get column index as numeric.
     */
    public getColumnNumeric(): number {
        return Coordinate.columnIndexFromString(this.#columnIndex ?? '');
    }

    /**
     * Set column index as numeric.
     */
    public setColumnNumeric(index: number): this {
        this.#columnIndex = Coordinate.stringFromColumnIndex(index);
        return this;
    }

    /**
     * Get Width.
     */
    public getWidth(): number {
        return this.#width;
    }

    /**
     * Set Width.
     */
    public setWidth(width: number): this {
        this.#width = width;
        return this;
    }

    /**
     * Get width for output.
     */
    public getWidthForOutput(restrictMax: boolean = false): number {
        return (restrictMax && this.#width > ColumnDimension.EXCEL_MAX_WIDTH) ? ColumnDimension.EXCEL_MAX_WIDTH : this.#width;
    }

    /**
     * Get Auto Size.
     */
    public getAutoSize(): boolean {
        return this.#autoSize;
    }

    /**
     * Set Auto Size.
     */
    public setAutoSize(autosizeEnabled: boolean): this {
        this.#autoSize = autosizeEnabled;
        return this;
    }
}
