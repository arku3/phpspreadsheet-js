import { DataLabels } from './data-labels';
import type { DataSeriesValues } from './data-series-values';

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
    #direction: DirectionType | null;
    #plotOrder: number;
    #lineStyle: LineStyle | null;
    #plotLabel: DataSeriesValues | null;
    #plotCategory: DataSeriesValues | null;
    #plotValues: DataSeriesValues[];
    #smoothLine: boolean;
    #plotBubbleSizes: DataSeriesValues | null;

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
     * @param direction - Direction for bar charts (bar=horizontal, col/column=vertical)
     * @param plotOrder - The order this series appears in the chart (0 = first)
     * @param plotLabel - Labels for data points (optional)
     * @param plotCategory - Category axis values (optional, for charts with categories)
     * @param plotValues - Array of data values for the series
     */
    constructor(
        plotType: ChartType,
        grouping: GroupingType | null = null,
        direction: DirectionType | null = null,
        plotOrder: number = 0,
        plotLabel: DataSeriesValues | null = null,
        plotCategory: DataSeriesValues | null = null,
        plotValues: DataSeriesValues[] = [],
    ) {
        this.#plotType = plotType;
        this.#grouping = grouping;
        this.#direction = direction;
        this.#plotOrder = plotOrder;
        this.#plotLabel = plotLabel;
        this.#plotCategory = plotCategory;
        this.#plotValues = plotValues;
        this.#lineStyle = null;
        this.#smoothLine = false;
        this.#plotBubbleSizes = null;

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
    getDirection(): DirectionType | null {
        return this.#direction;
    }

    /**
     * Set the direction.
     */
    setDirection(direction: DirectionType | null): void {
        this.#direction = direction;
    }

    /**
     * Get the plot order (position in the chart).
     */
    getPlotOrder(): number {
        return this.#plotOrder;
    }

    /**
     * Set the plot order.
     */
    setPlotOrder(plotOrder: number): void {
        this.#plotOrder = plotOrder;
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
    getPlotLabel(): DataSeriesValues | null {
        return this.#plotLabel;
    }

    /**
     * Set the plot labels.
     */
    setPlotLabel(plotLabel: DataSeriesValues | null): void {
        this.#plotLabel = plotLabel;
    }

    /**
     * Get the category data.
     */
    getPlotCategory(): DataSeriesValues | null {
        return this.#plotCategory;
    }

    /**
     * Set the category data.
     */
    setPlotCategory(plotCategory: DataSeriesValues | null): void {
        this.#plotCategory = plotCategory;
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
    getPlotBubbleSizes(): DataSeriesValues | null {
        return this.#plotBubbleSizes;
    }

    /**
     * Set the bubble sizes.
     */
    setPlotBubbleSizes(plotBubbleSizes: DataSeriesValues | null): void {
        this.#plotBubbleSizes = plotBubbleSizes;
    }

    /**
     * Get the count of data series values.
     */
    getSeriesValueCount(): number {
        return this.#plotValues.length;
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
