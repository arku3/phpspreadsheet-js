import { ChartColor } from './chart-color.ts';

/**
 * Represents a single data point in a chart series with custom styling.
 * Used for per-data-point colors, borders, and explosion (for pie/doughnut charts).
 */
export class DataPoint {
    #idx: number;
    #fillColor: ChartColor | null;
    #borderColor: ChartColor | null;
    #explosion: number | null;
    #noFill: boolean | null;
    #noBorder: boolean | null;
    #bubble3D: boolean | null;

    /**
     * Create a new DataPoint.
     *
     * @param idx - The point index in the series (0-based)
     * @param fillColor - Optional fill color for this data point
     * @param borderColor - Optional border color for this data point
     */
    constructor(idx: number, fillColor: ChartColor | null = null, borderColor: ChartColor | null = null) {
        this.#idx = idx;
        this.#fillColor = fillColor;
        this.#borderColor = borderColor;
        this.#explosion = null;
        this.#noFill = null;
        this.#noBorder = null;
        this.#bubble3D = null;
    }

    /**
     * Get the point index in the series.
     */
    getIdx(): number {
        return this.#idx;
    }

    /**
     * Set the point index in the series.
     */
    setIdx(idx: number): void {
        this.#idx = idx;
    }

    /**
     * Get the fill color for this data point.
     */
    getFillColor(): ChartColor | null {
        return this.#fillColor;
    }

    /**
     * Set the fill color for this data point.
     */
    setFillColor(color: ChartColor | null): void {
        this.#fillColor = color;
    }

    /**
     * Get the border color for this data point.
     */
    getBorderColor(): ChartColor | null {
        return this.#borderColor;
    }

    /**
     * Set the border color for this data point.
     */
    setBorderColor(color: ChartColor | null): void {
        this.#borderColor = color;
    }

    /**
     * Get the explosion value (for pie/doughnut charts).
     * This determines how far the slice is exploded from the center.
     * Value is in percentage (0-100).
     */
    getExplosion(): number | null {
        return this.#explosion;
    }

    /**
     * Set the explosion value (for pie/doughnut charts).
     *
     * @param explosion - Explosion percentage (0-100)
     */
    setExplosion(explosion: number | null): void {
        this.#explosion = explosion;
    }

    /**
     * Get whether this data point should have no fill.
     */
    getNoFill(): boolean | null {
        return this.#noFill;
    }

    /**
     * Set whether this data point should have no fill.
     */
    setNoFill(noFill: boolean | null): void {
        this.#noFill = noFill;
    }

    /**
     * Get whether this data point should have no border.
     */
    getNoBorder(): boolean | null {
        return this.#noBorder;
    }

    /**
     * Set whether this data point should have no border.
     */
    setNoBorder(noBorder: boolean | null): void {
        this.#noBorder = noBorder;
    }

    /**
     * Get whether this data point is 3D (for bubble charts).
     */
    getBubble3D(): boolean | null {
        return this.#bubble3D;
    }

    /**
     * Set whether this data point is 3D (for bubble charts).
     */
    setBubble3D(bubble3D: boolean | null): void {
        this.#bubble3D = bubble3D;
    }

    /**
     * Check if this data point has any custom styling.
     */
    hasCustomStyling(): boolean {
        return (
            this.#fillColor !== null ||
            this.#borderColor !== null ||
            this.#explosion !== null ||
            this.#noFill !== null ||
            this.#noBorder !== null ||
            this.#bubble3D !== null
        );
    }
}
