/**
 * Represents values for a data series in a chart.
 * Links chart data to worksheet cells.
 */
export class DataSeriesValues {
    #dataType: 'String' | 'Number' | null;
    #dataSource: string | null;
    #formatCode: string | null;
    #markerFillColor: string | null;
    #markerBorderColor: string | null;
    #pointCount: number;

    constructor(
        dataType: 'String' | 'Number' | null = null,
        dataSource: string | null = null,
        formatCode: string | null = null,
        pointCount: number = 0,
    ) {
        this.#dataType = dataType;
        this.#dataSource = dataSource;
        this.#formatCode = formatCode;
        this.#pointCount = pointCount;
        this.#markerFillColor = null;
        this.#markerBorderColor = null;
    }

    /**
     * Get the data type (String or Number).
     */
    getDataType(): 'String' | 'Number' | null {
        return this.#dataType;
    }

    /**
     * Set the data type.
     */
    setDataType(dataType: 'String' | 'Number' | null): void {
        this.#dataType = dataType;
    }

    /**
     * Get the data source (cell range reference like 'Sheet1!$A$1:$A$10').
     */
    getDataSource(): string | null {
        return this.#dataSource;
    }

    /**
     * Set the data source.
     */
    setDataSource(dataSource: string | null): void {
        this.#dataSource = dataSource;
    }

    /**
     * Get the format code.
     */
    getFormatCode(): string | null {
        return this.#formatCode;
    }

    /**
     * Set the format code.
     */
    setFormatCode(formatCode: string | null): void {
        this.#formatCode = formatCode;
    }

    /**
     * Get the point count.
     */
    getPointCount(): number {
        return this.#pointCount;
    }

    /**
     * Set the point count.
     */
    setPointCount(pointCount: number): void {
        this.#pointCount = pointCount;
    }

    /**
     * Get marker fill color (for line charts).
     */
    getMarkerFillColor(): string | null {
        return this.#markerFillColor;
    }

    /**
     * Set marker fill color.
     */
    setMarkerFillColor(color: string | null): void {
        this.#markerFillColor = color;
    }

    /**
     * Get marker border color (for line charts).
     */
    getMarkerBorderColor(): string | null {
        return this.#markerBorderColor;
    }

    /**
     * Set marker border color.
     */
    setMarkerBorderColor(color: string | null): void {
        this.#markerBorderColor = color;
    }

    /**
     * Check if this series is multi-level (has categories).
     */
    isMultiLevel(): boolean {
        // Multi-level charts (like sunburst) not implemented in basic version
        return false;
    }
}
