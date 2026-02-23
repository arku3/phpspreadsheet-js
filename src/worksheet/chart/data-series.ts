import type { Worksheet } from '../../core/worksheet';
import { DataLabels } from './data-labels';
import { DataPoint } from './data-point';
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
    | 'stock'
    | 'barChart'
    | 'bar3DChart'
    | 'lineChart'
    | 'line3DChart'
    | 'areaChart'
    | 'area3DChart'
    | 'pieChart'
    | 'pie3DChart'
    | 'doughnutChart'
    | 'donutChart'
    | 'scatterChart'
    | 'surfaceChart'
    | 'surface3DChart'
    | 'radarChart'
    | 'bubbleChart'
    | 'stockChart'
    | 'candleChart';

/**
 * Grouping types for bar/column charts.
 */
export type GroupingType = 'clustered' | 'stacked' | 'percentStacked' | 'standard';

/**
 * Direction for bar charts (horizontal bars or vertical columns).
 */
export type DirectionType = 'bar' | 'col' | 'column';

export const TYPE_BARCHART = 'barChart' as const;
export const TYPE_BARCHART_3D = 'bar3DChart' as const;
export const TYPE_LINECHART = 'lineChart' as const;
export const TYPE_LINECHART_3D = 'line3DChart' as const;
export const TYPE_AREACHART = 'areaChart' as const;
export const TYPE_AREACHART_3D = 'area3DChart' as const;
export const TYPE_PIECHART = 'pieChart' as const;
export const TYPE_PIECHART_3D = 'pie3DChart' as const;
export const TYPE_DOUGHNUTCHART = 'doughnutChart' as const;
export const TYPE_DONUTCHART = 'donutChart' as const;
export const TYPE_SCATTERCHART = 'scatterChart' as const;
export const TYPE_SURFACECHART = 'surfaceChart' as const;
export const TYPE_SURFACECHART_3D = 'surface3DChart' as const;
export const TYPE_RADARCHART = 'radarChart' as const;
export const TYPE_BUBBLECHART = 'bubbleChart' as const;
export const TYPE_STOCKCHART = 'stockChart' as const;
export const TYPE_CANDLECHART = 'candleChart' as const;

export const GROUPING_CLUSTERED = 'clustered' as const;
export const GROUPING_STACKED = 'stacked' as const;
export const GROUPING_PERCENT_STACKED = 'percentStacked' as const;
export const GROUPING_STANDARD = 'standard' as const;

export const DIRECTION_BAR = 'bar' as const;
export const DIRECTION_HORIZONTAL = 'bar' as const;
export const DIRECTION_COL = 'col' as const;
export const DIRECTION_COLUMN = 'column' as const;

export const STYLE_LINEMARKER = 'lineMarker' as const;
export const STYLE_SMOOTHMARKER = 'smoothMarker' as const;
export const STYLE_MARKER = 'marker' as const;
export const STYLE_FILLED = 'filled' as const;

export const EMPTY_AS_GAP = 'gap' as const;
export const EMPTY_AS_ZERO = 'zero' as const;
export const EMPTY_AS_SPAN = 'span' as const;
export const DEFAULT_EMPTY_AS = EMPTY_AS_GAP;
export const VALID_EMPTY_AS = [EMPTY_AS_GAP, EMPTY_AS_ZERO, EMPTY_AS_SPAN] as const;

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
    #plotType: ChartType | null;
    #grouping: GroupingType | null;
    #direction: DirectionType;
    #plotOrder: number[];
    #lineStyle: LineStyle | null;
    #plotLabel: DataSeriesValues[];
    #plotCategory: DataSeriesValues[];
    #plotValues: DataSeriesValues[];
    #smoothLine: boolean;
    #plotBubbleSizes: DataSeriesValues[];
    #plotStyle: string | null = null;

    // Per-data-point styling
    #plotPoints: DataPoint[];

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
        plotType: ChartType | null = null,
        grouping: GroupingType | null = null,
        plotOrder: number[] = [],
        plotLabel: DataSeriesValues[] = [],
        plotCategory: DataSeriesValues[] = [],
        plotValues: DataSeriesValues[] = [],
        direction: DirectionType | null = null,
        smoothLine: boolean = false,
        lineStyle: LineStyle | null = null,
        plotStyle: string | null = null,
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
        this.#plotStyle = plotStyle;
        this.#plotBubbleSizes = [];
        this.#plotPoints = [];

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
    getPlotType(): ChartType | null {
        return this.#plotType;
    }

    /**
     * Set the chart/plot type.
     */
    setPlotType(plotType: ChartType): this {
        this.#plotType = plotType;
        return this;
    }

    /**
     * Get the grouping type (for bar/column charts).
     */
    getGrouping(): GroupingType | null {
        return this.#grouping;
    }

    getPlotGrouping(): GroupingType | null {
        return this.#grouping;
    }

    /**
     * Set the grouping type.
     */
    setGrouping(grouping: GroupingType | null): void {
        this.#grouping = grouping;
    }

    setPlotGrouping(grouping: GroupingType): this {
        this.#grouping = grouping;
        return this;
    }

    /**
     * Get the direction (bar=horizontal, col/column=vertical).
     */
    getDirection(): DirectionType {
        return this.#direction;
    }

    getPlotDirection(): DirectionType {
        return this.#direction;
    }

    /**
     * Set the direction.
     */
    setDirection(direction: DirectionType | null): void {
        this.#direction = direction ?? 'col';
    }

    setPlotDirection(direction: DirectionType): this {
        this.#direction = direction;
        return this;
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

    getPlotStyle(): string | null {
        return this.#plotStyle;
    }

    setPlotStyle(plotStyle: string | null): this {
        this.#plotStyle = plotStyle;
        return this;
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

    refresh(worksheet: Worksheet): void {
        for (const plotValue of this.#plotValues) {
            plotValue.refresh(worksheet, true);
        }
        for (const plotLabel of this.#plotLabel) {
            plotLabel.refresh(worksheet, true);
        }
        for (const plotCategory of this.#plotCategory) {
            plotCategory.refresh(worksheet, false);
        }
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
    getPlotLabelByIndex(index: number): DataSeriesValues | false {
        if (index in this.#plotLabel) {
            return this.#plotLabel[index]!;
        }
        return false;
    }

    /**
     * Set the plot labels.
     */
    setPlotLabels(plotLabels: DataSeriesValues[]): this {
        this.#plotLabel = plotLabels;
        return this;
    }

    /**
     * Add a plot label.
     */
    addPlotLabel(plotLabel: DataSeriesValues): this {
        this.#plotLabel.push(plotLabel);
        return this;
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
    getPlotCategoryByIndex(index: number): DataSeriesValues | false {
        if (index in this.#plotCategory) {
            return this.#plotCategory[index]!;
        }
        // Also check if there's a value at the numeric position in keys
        const keys = Object.keys(this.#plotCategory).map(Number);
        if (keys.length > index && index >= 0) {
            return this.#plotCategory[keys[index]!] ?? false;
        }
        return false;
    }

    /**
     * Set the plot categories.
     */
    setPlotCategories(plotCategories: DataSeriesValues[]): this {
        this.#plotCategory = plotCategories;
        return this;
    }

    /**
     * Add a plot category.
     */
    addPlotCategory(plotCategory: DataSeriesValues): this {
        this.#plotCategory.push(plotCategory);
        return this;
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
    setPlotValues(plotValues: DataSeriesValues[]): this {
        this.#plotValues = plotValues;
        return this;
    }

    /**
     * Add plot values to the series.
     */
    addPlotValues(plotValues: DataSeriesValues): this {
        this.#plotValues.push(plotValues);
        return this;
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
    setPlotBubbleSizes(plotBubbleSizes: DataSeriesValues[]): this {
        this.#plotBubbleSizes = plotBubbleSizes;
        return this;
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
    getPlotValuesByIndex(index: number): DataSeriesValues | false {
        if (index in this.#plotValues) {
            return this.#plotValues[index]!;
        }
        return false;
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

    // ===== Per-Data-Point Styling Methods =====

    /**
     * Get all plot points with custom styling.
     */
    getPlotPoints(): DataPoint[] {
        return this.#plotPoints;
    }

    /**
     * Set all plot points with custom styling.
     * @param plotPoints - Array of DataPoint objects
     */
    setPlotPoints(plotPoints: DataPoint[]): void {
        this.#plotPoints = plotPoints;
    }

    /**
     * Add a plot point with custom styling.
     * @param plotPoint - The DataPoint to add
     */
    addPlotPoint(plotPoint: DataPoint): void {
        this.#plotPoints.push(plotPoint);
    }

    /**
     * Get a plot point by its index.
     * @param idx - The point index to look up
     * @returns The DataPoint at the index, or undefined if not found
     */
    getPlotPointByIndex(idx: number): DataPoint | undefined {
        return this.#plotPoints.find((point) => point.getIdx() === idx);
    }

    /**
     * Remove a plot point by its index.
     * @param idx - The point index to remove
     * @returns True if the point was found and removed, false otherwise
     */
    removePlotPoint(idx: number): boolean {
        const index = this.#plotPoints.findIndex((point) => point.getIdx() === idx);
        if (index >= 0) {
            this.#plotPoints.splice(index, 1);
            return true;
        }
        return false;
    }

    /**
     * Clear all plot points.
     */
    clearPlotPoints(): void {
        this.#plotPoints = [];
    }

    clone(): DataSeries {
        const cloned = new DataSeries(
            this.#plotType,
            this.#grouping,
            [...this.#plotOrder],
            this.#plotLabel,
            this.#plotCategory.map((category) => category.clone()),
            this.#plotValues.map((value) => value.clone()),
            this.#direction,
            this.#smoothLine,
            this.#lineStyle,
            this.#plotStyle,
        );

        cloned.setPlotBubbleSizes(this.#plotBubbleSizes.map((bubble) => bubble.clone()));
        if (this.#fillColor !== null) {
            cloned.setFillColor(this.#fillColor);
        }
        if (this.#lineColor !== null) {
            cloned.setLineColor(this.#lineColor);
        }
        if (this.#borderColor !== null) {
            cloned.setBorderColor(this.#borderColor);
        }
        cloned.setLineWidth(this.#lineWidth);
        cloned.setMarkerSymbol(this.#markerSymbol);
        cloned.setMarkerSize(this.#markerSize);
        cloned.setDataLabels(this.#dataLabels);
        cloned.setPlotPoints([...this.#plotPoints]);

        return cloned;
    }
}
