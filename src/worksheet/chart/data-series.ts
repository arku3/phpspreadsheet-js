import { DataLabels } from './data-labels';
import { DataSeriesValues } from './data-series-values';

/**
 * Chart types supported by the data series.
 */
export type ChartType =
    | 'bar'
    | 'bar3D'
    | 'line'
    | 'line3D'
    | 'area'
    | 'area3D'
    | 'pie'
    | 'pie3D'
    | 'doughnut'
    | 'scatter'
    | 'surface'
    | 'surface3D'
    | 'radar'
    | 'bubble'
    | 'stock';

/**
 * Grouping types for bar/column charts.
 */
export type GroupingType = 'clustered' | 'stacked' | 'percentStacked' | 'standard';

/**
 * Direction for bar charts (horizontal bars or vertical columns).
 */
export type DirectionType = 'bar' | 'col' | 'column';

/**
 * Line style for line charts.
 */
export type LineStyle =
    | 'smooth'
    | 'line'
    | 'cubic'
    | 'cubicSpline'
    | 'straight'
    | 'solid'
    | 'dot'
    | 'dash'
    | 'lgDash'
    | 'dashDot'
    | 'lgDashDot'
    | 'lgDashDotDot'
    | 'sysDash'
    | 'sysDot'
    | 'sysDashDot'
    | 'sysDashDotDot';

/**
 * Marker symbol for line/scatter charts.
 */
export type MarkerSymbol =
    | 'circle'
    | 'dash'
    | 'diamond'
    | 'dot'
    | 'none'
    | 'plus'
    | 'square'
    | 'star'
    | 'triangle'
    | 'x';

/**
 * Represents a data series in a chart.
 * A chart can have multiple data series (e.g., multiple lines in a line chart).
 */
export class DataSeries {
    #plotType: ChartType;
    #grouping: GroupingType | null;
    #direction: DirectionType;
    #plotOrder: number[];
    #lineStyle: LineStyle | null;
    #plotLabel: DataSeriesValues[];
    #plotCategory: DataSeriesValues[];
    #plotValues: DataSeriesValues[];
    #smoothLine: boolean;
    #plotBubbleSizes: DataSeriesValues[];

    // Styling properties
    #fillColor: string | null;
    #lineColor: string | null;
    #borderColor: string | null;
    #lineWidth: number;
    #markerSymbol: MarkerSymbol | null;
    #markerSize: number;

    /**
     * Data labels configuration for this series.
     */
    #dataLabels: DataLabels | null;

    /**
     * Create a new data series.
     *
     * @param plotType - The chart type (bar, line, pie, etc.)
     * @param grouping - Grouping type for bar/column charts
     * @param plotOrder - Array of plot orders for each series
     * @param plotLabel - Array of labels for data points
     * @param plotCategory - Array of category axis values
     * @param plotValues - Array of data values for the series
     * @param direction - Direction for bar charts (bar=horizontal, col/column=vertical)
     * @param smoothLine - Whether lines should be smooth
     * @param lineStyle - Line style for the series
     */
    constructor(
        plotType: ChartType,
        grouping: GroupingType | null = null,
        plotOrder: number[] = [],
        plotLabel: DataSeriesValues[] = [],
        plotCategory: DataSeriesValues[] = [],
        plotValues: DataSeriesValues[] = [],
        direction: DirectionType | null = null,
        smoothLine: boolean = false,
        lineStyle: LineStyle | null = null,
    ) {
        this.#plotType = plotType;
        this.#grouping = grouping;
        this.#plotOrder = plotOrder;
        this.#plotValues = plotValues;

        // Ensure plotLabel and plotCategory have entries for the first plot value key
        const keys = plotValues.length > 0 ? [0] : [];
        this.#plotLabel = plotLabel;
        if (keys.length > 0 && !this.#plotLabel[keys[0]!]) {
            this.#plotLabel[keys[0]!] = new DataSeriesValues();
        }

        this.#plotCategory = plotCategory;
        if (keys.length > 0 && !this.#plotCategory[keys[0]!]) {
            this.#plotCategory[keys[0]!] = new DataSeriesValues();
        }

        this.#direction = direction ?? 'col';
        this.#smoothLine = smoothLine;
        this.#lineStyle = lineStyle;
        this.#plotBubbleSizes = [];

        // Initialize styling properties
        this.#fillColor = null;
        this.#lineColor = null;
        this.#borderColor = null;
        this.#lineWidth = 12700; // Default line width in EMUs (1pt = 12700 EMUs)
        this.#markerSymbol = null;
        this.#markerSize = 5; // Default marker size
        this.#dataLabels = null;
    }

    /**
     * Get the chart/plot type.
     */
    getPlotType(): ChartType {
        return this.#plotType;
    }

    /**
     * Set the chart/plot type.
     */
    setPlotType(plotType: ChartType): void {
        this.#plotType = plotType;
    }

    /**
     * Get the grouping type (for bar/column charts).
     */
    getGrouping(): GroupingType | null {
        return this.#grouping;
    }

    /**
     * Set the grouping type.
     */
    setGrouping(grouping: GroupingType | null): void {
        this.#grouping = grouping;
    }

    /**
     * Get the direction (bar=horizontal, col/column=vertical).
     */
    getDirection(): DirectionType {
        return this.#direction;
    }

    /**
     * Set the direction.
     */
    setDirection(direction: DirectionType | null): void {
        this.#direction = direction ?? 'col';
    }

    /**
     * Get the plot orders (positions in the chart).
     */
    getPlotOrder(): number[] {
        return this.#plotOrder;
    }

    /**
     * Get a plot order by index.
     * @param index - The index to look up
     * @returns The plot order at the index, or undefined if not found
     */
    getPlotOrderByIndex(index: number): number | undefined {
        if (index in this.#plotOrder) {
            return this.#plotOrder[index];
        }
        return undefined;
    }

    /**
     * Set the plot orders.
     */
    setPlotOrder(plotOrder: number[]): void {
        this.#plotOrder = plotOrder;
    }

    /**
     * Add a plot order.
     */
    addPlotOrder(plotOrder: number): void {
        this.#plotOrder.push(plotOrder);
    }

    /**
     * Get the line style for this series.
     */
    getLineStyle(): LineStyle | null {
        return this.#lineStyle;
    }

    /**
     * Get the data labels configuration for this series.
     */
    getDataLabels(): DataLabels | null {
        return this.#dataLabels;
    }

    /**
     * Set the data labels configuration for this series.
     * @param dataLabels - The data labels configuration
     */
    setDataLabels(dataLabels: DataLabels | null): void {
        this.#dataLabels = dataLabels;
    }

    /**
     * Set the line style.
     */
    setLineStyle(lineStyle: LineStyle | null): void {
        this.#lineStyle = lineStyle;
    }

    /**
     * Check if line should be smooth (for line charts).
     */
    getSmoothLine(): boolean {
        return this.#smoothLine;
    }

    /**
     * Set whether line should be smooth.
     */
    setSmoothLine(smooth: boolean): void {
        this.#smoothLine = smooth;
    }

    /**
     * Get the plot labels.
     */
    getPlotLabels(): DataSeriesValues[] {
        return this.#plotLabel;
    }

    /**
     * Get a plot label by index.
     * @param index - The index to look up
     * @returns The plot label at the index, or undefined if not found
     */
    getPlotLabelByIndex(index: number): DataSeriesValues | undefined {
        if (index in this.#plotLabel) {
            return this.#plotLabel[index];
        }
        return undefined;
    }

    /**
     * Set the plot labels.
     */
    setPlotLabels(plotLabels: DataSeriesValues[]): void {
        this.#plotLabel = plotLabels;
    }

    /**
     * Add a plot label.
     */
    addPlotLabel(plotLabel: DataSeriesValues): void {
        this.#plotLabel.push(plotLabel);
    }

    /**
     * Get the plot categories.
     */
    getPlotCategories(): DataSeriesValues[] {
        return this.#plotCategory;
    }

    /**
     * Get a plot category by index.
     * @param index - The index to look up
     * @returns The plot category at the index, or undefined if not found
     */
    getPlotCategoryByIndex(index: number): DataSeriesValues | undefined {
        if (index in this.#plotCategory) {
            return this.#plotCategory[index];
        }
        // Also check if there's a value at the numeric position in keys
        const keys = Object.keys(this.#plotCategory).map(Number);
        if (keys.length > index && index >= 0) {
            return this.#plotCategory[keys[index]!];
        }
        return undefined;
    }

    /**
     * Set the plot categories.
     */
    setPlotCategories(plotCategories: DataSeriesValues[]): void {
        this.#plotCategory = plotCategories;
    }

    /**
     * Add a plot category.
     */
    addPlotCategory(plotCategory: DataSeriesValues): void {
        this.#plotCategory.push(plotCategory);
    }

    /**
     * Get the plot values (data points).
     */
    getPlotValues(): DataSeriesValues[] {
        return this.#plotValues;
    }

    /**
     * Set the plot values.
     */
    setPlotValues(plotValues: DataSeriesValues[]): void {
        this.#plotValues = plotValues;
    }

    /**
     * Add plot values to the series.
     */
    addPlotValues(plotValues: DataSeriesValues): void {
        this.#plotValues.push(plotValues);
    }

    /**
     * Get the bubble sizes (for bubble charts).
     */
    getPlotBubbleSizes(): DataSeriesValues[] {
        return this.#plotBubbleSizes;
    }

    /**
     * Set the bubble sizes.
     */
    setPlotBubbleSizes(plotBubbleSizes: DataSeriesValues[]): void {
        this.#plotBubbleSizes = plotBubbleSizes;
    }

    /**
     * Get the count of data series values.
     * @deprecated Use getPlotSeriesCount() instead
     */
    getSeriesValueCount(): number {
        return this.#plotValues.length;
    }

    /**
     * Get the number of plot series.
     */
    getPlotSeriesCount(): number {
        return this.#plotValues.length;
    }

    /**
     * Get plot values by index.
     * @param index - The index to look up
     * @returns The plot values at the index, or undefined if not found
     */
    getPlotValuesByIndex(index: number): DataSeriesValues | undefined {
        if (index in this.#plotValues) {
            return this.#plotValues[index];
        }
        return undefined;
    }

    /**
     * Get the count of data points (values) in this series.
     */
    getPointCount(): number {
        // Return the count from the first plot values if available
        if (this.#plotValues.length > 0) {
            return this.#plotValues[0]?.getPointCount() ?? 0;
        }
        return 0;
    }

    // ===== Styling Methods =====

    /**
     * Get the fill color (hex string like 'FF0000' for red).
     */
    getFillColor(): string | null {
        return this.#fillColor;
    }

    /**
     * Set the fill color.
     * @param color - Hex color string (e.g., 'FF0000' for red)
     */
    setFillColor(color: string): void {
        this.#fillColor = color;
    }

    /**
     * Get the line/border color (hex string).
     */
    getLineColor(): string | null {
        return this.#lineColor;
    }

    /**
     * Set the line/border color.
     * @param color - Hex color string (e.g., '000000' for black)
     */
    setLineColor(color: string): void {
        this.#lineColor = color;
    }

    /**
     * Get the border color (hex string).
     * Alias for getLineColor for API consistency.
     */
    getBorderColor(): string | null {
        return this.#borderColor ?? this.#lineColor;
    }

    /**
     * Set the border color.
     * @param color - Hex color string (e.g., '000000' for black)
     */
    setBorderColor(color: string): void {
        this.#borderColor = color;
        this.#lineColor = color; // Also set lineColor for backward compatibility
    }

    /**
     * Get the line width (in EMUs, where 1pt = 12700 EMUs).
     */
    getLineWidth(): number {
        return this.#lineWidth;
    }

    /**
     * Set the line width.
     * @param width - Line width in EMUs (12700 = 1pt, 25400 = 2pt, etc.)
     */
    setLineWidth(width: number): void {
        this.#lineWidth = width;
    }

    /**
     * Get the marker symbol (for line/scatter charts).
     */
    getMarkerSymbol(): MarkerSymbol | null {
        return this.#markerSymbol;
    }

    /**
     * Set the marker symbol.
     * @param symbol - Marker symbol type
     */
    setMarkerSymbol(symbol: MarkerSymbol | null): void {
        this.#markerSymbol = symbol;
    }

    /**
     * Get the marker size.
     */
    getMarkerSize(): number {
        return this.#markerSize;
    }

    /**
     * Set the marker size.
     * @param size - Marker size (default 5)
     */
    setMarkerSize(size: number): void {
        this.#markerSize = size;
    }
}
