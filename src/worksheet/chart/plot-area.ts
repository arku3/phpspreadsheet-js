import type { Worksheet } from '../../core/worksheet';
import type { ChartLayout } from './chart';
import type { ChartColor } from './chart-color';
import { DataSeries } from './data-series';
import type { DataSeriesValues } from './data-series-values';
import type { Layout } from './layout';

/**
 * Gradient fill stop for plot area background.
 */
export interface PlotAreaGradientStop {
    position: number;
    color: ChartColor;
}

/**
 * Represents the plot area of a chart.
 * The plot area contains the data series and visual elements like bars, lines, etc.
 *
 * Based on PhpSpreadsheet PlotArea.php
 */
export class PlotArea {
    #plotSeries: DataSeries[] = [];
    #plotCategories: DataSeriesValues[] = [];
    #plotVisibleOnly: boolean = true;
    #noFill: boolean = false;
    #gradientFillStops: PlotAreaGradientStop[] = [];
    #gradientFillAngle: number | null = null;
    #gapWidth: number | null = null;
    #upBars: unknown | null = null;
    #downBars: unknown | null = null;
    #layout: ChartLayout | Layout | null = null;
    #useUpBars: boolean = false;
    #useDownBars: boolean = false;

    /**
     * Create a new PlotArea.
     *
     * @param layout - Optional layout configuration
     * @param plotSeries - Array of data series
     */
    constructor(layout: ChartLayout | Layout | null = null, plotSeries: DataSeries[] = []) {
        this.#layout = layout;
        this.#plotSeries = plotSeries;
    }

    /**
     * Get the layout configuration.
     */
    getLayout(): ChartLayout | Layout | null {
        return this.#layout;
    }

    /**
     * Set the layout configuration.
     */
    setLayout(layout: ChartLayout | Layout | null): this {
        this.#layout = layout;
        return this;
    }

    /**
     * Get the plot series (data series groups).
     */
    getPlotSeries(): DataSeries[] {
        return this.#plotSeries;
    }

    getPlotGroup(): DataSeries[] {
        return this.#plotSeries;
    }

    /**
     * Set the plot series.
     */
    setPlotSeries(plotSeries: DataSeries[]): this {
        this.#plotSeries = plotSeries;
        return this;
    }

    /**
     * Get the number of plot groups (data series groups).
     */
    getPlotGroupCount(): number {
        return this.#plotSeries.length;
    }

    /**
     * Get the total count of all plot series across all groups.
     * This sums up the series count from each DataSeries.
     */
    getPlotSeriesCount(): number {
        let seriesCount = 0;
        for (const plot of this.#plotSeries) {
            seriesCount += plot.getPlotValues().length;
        }
        return seriesCount;
    }

    /**
     * Get a plot group (DataSeries) by index.
     *
     * @param index - The index of the plot group
     * @returns The DataSeries at the specified index
     * @throws Error if index is out of bounds
     */
    getPlotGroupByIndex(index: number): DataSeries {
        if (this.#plotSeries[index]) {
            return this.#plotSeries[index]!;
        }
        return new DataSeries(null, null, [index]);
    }

    public refresh(worksheet: Worksheet): void {
        for (const plot of this.#plotSeries) {
            plot.refresh(worksheet);
        }
    }

    /**
     * Get the plot categories array.
     */
    getPlotCategories(): DataSeriesValues[] {
        return this.#plotCategories;
    }

    /**
     * Set the plot categories array.
     */
    setPlotCategories(plotCategories: DataSeriesValues[]): this {
        this.#plotCategories = plotCategories;
        return this;
    }

    /**
     * Get a plot category by index.
     *
     * @param index - The index of the category
     * @returns The DataSeriesValues at the specified index, or undefined if not found
     */
    getPlotCategoriesByIndex(index: number): DataSeriesValues | false {
        return this.#plotCategories[index] ?? false;
    }

    /**
     * Get whether only the plot area should be visible (not chart area).
     */
    getPlotVisibleOnly(): boolean {
        return this.#plotVisibleOnly;
    }

    /**
     * Set whether only the plot area should be visible.
     */
    setPlotVisibleOnly(plotVisibleOnly: boolean): this {
        this.#plotVisibleOnly = plotVisibleOnly;
        return this;
    }

    /**
     * Get whether the plot area has no fill (show Excel gridlines through chart).
     */
    getNoFill(): boolean {
        return this.#noFill;
    }

    /**
     * Set whether the plot area has no fill.
     */
    setNoFill(noFill: boolean): this {
        this.#noFill = noFill;
        return this;
    }

    /**
     * Get the gradient fill stops.
     */
    getGradientFillStops(): PlotAreaGradientStop[] {
        return this.#gradientFillStops;
    }

    /**
     * Set the gradient fill stops.
     */
    setGradientFillStops(stops: PlotAreaGradientStop[]): this {
        this.#gradientFillStops = stops;
        return this;
    }

    /**
     * Set gradient fill properties (stops and angle).
     */
    setGradientFillProperties(stops: PlotAreaGradientStop[], angle: number | null): this {
        this.#gradientFillStops = stops;
        this.#gradientFillAngle = angle;
        return this;
    }

    /**
     * Get the gradient fill angle (in degrees).
     */
    getGradientFillAngle(): number | null {
        return this.#gradientFillAngle;
    }

    /**
     * Set the gradient fill angle (in degrees).
     */
    setGradientFillAngle(angle: number | null): this {
        this.#gradientFillAngle = angle;
        return this;
    }

    /**
     * Get the gap width for bar charts (percentage, default is usually 150).
     */
    getGapWidth(): number | null {
        return this.#gapWidth;
    }

    /**
     * Set the gap width for bar charts.
     */
    setGapWidth(gapWidth: number | null): this {
        this.#gapWidth = gapWidth;
        return this;
    }

    /**
     * Get the up bars configuration (for stock charts).
     */
    getUpBars(): unknown | null {
        return this.#upBars;
    }

    /**
     * Set the up bars configuration.
     */
    setUpBars(upBars: unknown | null): this {
        this.#upBars = upBars;
        return this;
    }

    /**
     * Get the down bars configuration (for stock charts).
     */
    getDownBars(): unknown | null {
        return this.#downBars;
    }

    /**
     * Set the down bars configuration.
     */
    setDownBars(downBars: unknown | null): this {
        this.#downBars = downBars;
        return this;
    }

    getUseUpBars(): boolean {
        return this.#useUpBars;
    }

    setUseUpBars(useUpBars: boolean): this {
        this.#useUpBars = useUpBars;
        return this;
    }

    getUseDownBars(): boolean {
        return this.#useDownBars;
    }

    setUseDownBars(useDownBars: boolean): this {
        this.#useDownBars = useDownBars;
        return this;
    }

    /**
     * Add a data series to the plot area.
     */
    addDataSeries(dataSeries: DataSeries): this {
        this.#plotSeries.push(dataSeries);
        return this;
    }

    /**
     * Create a deep clone of this PlotArea.
     */
    clone(): PlotArea {
        const clonedLayout = PlotArea.cloneLayout(this.#layout);
        const cloned = new PlotArea(
            clonedLayout,
            this.#plotSeries.map((series) => series.clone()),
        );

        cloned.setPlotCategories(this.#plotCategories.map((category) => category.clone()));
        cloned.setPlotVisibleOnly(this.#plotVisibleOnly);
        cloned.setNoFill(this.#noFill);
        cloned.setGradientFillStops([...this.#gradientFillStops]);
        cloned.setGradientFillAngle(this.#gradientFillAngle);
        cloned.setGapWidth(this.#gapWidth);
        cloned.setUpBars(this.#upBars);
        cloned.setDownBars(this.#downBars);
        cloned.setUseUpBars(this.#useUpBars);
        cloned.setUseDownBars(this.#useDownBars);

        return cloned;
    }

    private static cloneLayout(layout: ChartLayout | Layout | null): ChartLayout | Layout | null {
        if (!layout) {
            return null;
        }
        if (typeof (layout as Layout).clone === 'function') {
            return (layout as Layout).clone();
        }
        return { ...layout };
    }
}
