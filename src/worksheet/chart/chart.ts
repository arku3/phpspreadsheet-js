import type { Worksheet } from '../../core/worksheet.ts';
import { Color } from '../../style/color.ts';
import { Font } from '../../style/font.ts';
import { Coordinate } from '../../utils/coordinate.ts';
import { Axis } from './axis.ts';
import type { DataSeries } from './data-series.ts';

/**
 * A cell anchor position for a chart.
 */
export interface ChartPosition {
    /**
     * Cell coordinate in A1 notation (e.g. 'B2').
     */
    cell: string;

    /**
     * Optional X offset from the left edge of the cell.
     */
    offsetX?: number;

    /**
     * Optional Y offset from the top edge of the cell.
     */
    offsetY?: number;
}

/**
 * Legend position for chart.
 */
export type LegendPosition = 'top' | 'bottom' | 'left' | 'right' | 'none';

/**
 * Legend configuration for a chart.
 */
export interface LegendConfig {
    /**
     * Legend position.
     */
    position: LegendPosition;

    /**
     * Optional legend title.
     */
    title?: string;

    /**
     * Whether legend should overlay the chart area.
     */
    overlay?: boolean;
}

/**
 * Gridline styling options for chart axes.
 */
export interface GridlineStyle {
    color?: string | null;
    width?: number | null;
}

export interface ChartBorderStyle {
    color?: Color | null;
    width?: number | null;
}

export interface ChartGradientStop {
    position: number;
    color: Color;
}

export type ChartLayoutTarget = 'inner' | 'outer';
export type ChartLayoutMode = 'edge' | 'factor';

export interface ChartLayout {
    layoutTarget?: ChartLayoutTarget | null;
    xMode?: ChartLayoutMode | null;
    yMode?: ChartLayoutMode | null;
    x?: number | null;
    y?: number | null;
    w?: number | null;
    h?: number | null;
}

/**
 * @deprecated Use DataSeries from ./data-series.ts instead
 */
export interface ChartSeriesModel {
    idx?: number;
    order?: number | number[];
    categoryFormula: string | null;
    valuesFormula: string | null;
}

/**
 * @deprecated Use DataSeries[] instead
 */
export interface ChartModel {
    titleText: string | null;
    series: ChartSeriesModel[];
}

/**
 * Minimal chart domain model.
 *
 * This is a pure domain model (no XLSX IO). IO layers can attach
 * `chartXmlPath` later when reading chart parts.
 */
export class Chart {
    #name: string = '';

    #topLeftCell: string = 'A1';
    #topLeftOffsetX: number = 0;
    #topLeftOffsetY: number = 0;

    #bottomRightCell: string | null = null;
    #bottomRightOffsetX: number = 0;
    #bottomRightOffsetY: number = 0;

    #chartXmlPath: string | null = null;

    #titleText: string | null = null;
    #titleFont: Font | null = null;
    #plotArea: DataSeries[] = [];
    #plotAreaLayout: ChartLayout | null = null;

    // Chart area styling
    #chartAreaNoFill: boolean | null = null;
    #chartAreaNoBorder: boolean | null = null;
    #chartAreaFillColor: Color | null = null;
    #chartAreaBorderStyle: ChartBorderStyle | null = null;

    // Plot area styling
    #plotAreaNoFill: boolean | null = null;
    #plotAreaGradientStops: ChartGradientStop[] = [];
    #plotAreaGradientAngle: number | null = null;

    // View 3D settings
    #rotX: number | null = null;
    #rotY: number | null = null;
    #rAngAx: number | null = null;
    #perspective: number | null = null;

    // Surface chart series axis ID (read-only from XLSX)
    #serAxisId: string | null = null;

    // Axis objects for X and Y axes (used for date axis and other axis properties)
    #xAxis: Axis | null = null;
    #yAxis: Axis | null = null;

    // Axis titles
    #xAxisTitle: string | null = null;
    #yAxisTitle: string | null = null;

    // Axis title fonts
    #xAxisTitleFont: Font | null = null;
    #yAxisTitleFont: Font | null = null;

    // Axis gridlines
    #xAxisMajorGridlines: boolean | null = null;
    #xAxisMinorGridlines: boolean | null = null;
    #yAxisMajorGridlines: boolean | null = null;
    #yAxisMinorGridlines: boolean | null = null;

    // Axis gridline styling
    #xAxisMajorGridlineStyle: GridlineStyle | null = null;
    #xAxisMinorGridlineStyle: GridlineStyle | null = null;
    #yAxisMajorGridlineStyle: GridlineStyle | null = null;
    #yAxisMinorGridlineStyle: GridlineStyle | null = null;

    // Legend configuration
    #legendPosition: LegendPosition | null = 'right';
    #legendTitle: string | null = null;
    #legendOverlay: boolean = false;

    // Ownership tracking (set by Worksheet.addChart/removeChart).
    #worksheet: Worksheet | null = null;

    /**
     * Get chart name.
     */
    public getName(): string {
        return this.#name;
    }

    /**
     * Set chart name.
     */
    public setName(name: string): this {
        this.#name = name;
        return this;
    }

    /**
     * Get the top-left chart position.
     */
    public getTopLeftPosition(): Required<ChartPosition> {
        return {
            cell: this.#topLeftCell,
            offsetX: this.#topLeftOffsetX,
            offsetY: this.#topLeftOffsetY,
        };
    }

    /**
     * Set the top-left chart position.
     */
    public setTopLeftPosition(position: ChartPosition): this {
        const normalized = Chart.#normalizePosition(position);
        this.#topLeftCell = normalized.cell;
        this.#topLeftOffsetX = normalized.offsetX;
        this.#topLeftOffsetY = normalized.offsetY;
        return this;
    }

    /**
     * Get the bottom-right chart position (if set).
     */
    public getBottomRightPosition(): Required<ChartPosition> | null {
        if (this.#bottomRightCell === null) {
            return null;
        }

        return {
            cell: this.#bottomRightCell,
            offsetX: this.#bottomRightOffsetX,
            offsetY: this.#bottomRightOffsetY,
        };
    }

    /**
     * Set (or clear) the bottom-right chart position.
     */
    public setBottomRightPosition(position: ChartPosition | null): this {
        if (position === null) {
            this.#bottomRightCell = null;
            this.#bottomRightOffsetX = 0;
            this.#bottomRightOffsetY = 0;
            return this;
        }

        const normalized = Chart.#normalizePosition(position);
        this.#bottomRightCell = normalized.cell;
        this.#bottomRightOffsetX = normalized.offsetX;
        this.#bottomRightOffsetY = normalized.offsetY;
        return this;
    }

    /**
     * Path to the chart XML part inside an XLSX package (e.g. 'xl/charts/chart1.xml').
     *
     * Intended for reader implementations.
     */
    public getChartXmlPath(): string | null {
        return this.#chartXmlPath;
    }

    /**
     * Set path to the chart XML part inside an XLSX package.
     */
    public setChartXmlPath(chartXmlPath: string | null): this {
        this.#chartXmlPath = chartXmlPath;
        return this;
    }

    public getTitleText(): string | null {
        return this.#titleText;
    }

    public setTitleText(titleText: string | null): this {
        this.#titleText = titleText;
        return this;
    }

    /**
     * Get the chart title font.
     */
    public getTitleFont(): Font | null {
        return this.#titleFont;
    }

    /**
     * Set the chart title font.
     */
    public setTitleFont(font: Font | null): this {
        this.#titleFont = font;
        return this;
    }

    /**
     * Get the X-axis title text.
     */
    public getXAxisTitle(): string | null {
        return this.#xAxisTitle;
    }

    /**
     * Set the X-axis title text.
     */
    public setXAxisTitle(titleText: string | null): this {
        this.#xAxisTitle = titleText;
        return this;
    }

    /**
     * Get the X-axis title font.
     */
    public getXAxisTitleFont(): Font | null {
        return this.#xAxisTitleFont;
    }

    /**
     * Set the X-axis title font.
     */
    public setXAxisTitleFont(font: Font | null): this {
        this.#xAxisTitleFont = font;
        return this;
    }

    /**
     * Get the Y-axis title text.
     */
    public getYAxisTitle(): string | null {
        return this.#yAxisTitle;
    }

    /**
     * Set the Y-axis title text.
     */
    public setYAxisTitle(titleText: string | null): this {
        this.#yAxisTitle = titleText;
        return this;
    }

    /**
     * Get the Y-axis title font.
     */
    public getYAxisTitleFont(): Font | null {
        return this.#yAxisTitleFont;
    }

    /**
     * Set the Y-axis title font.
     */
    public setYAxisTitleFont(font: Font | null): this {
        this.#yAxisTitleFont = font;
        return this;
    }

    /**
     * Get whether major gridlines are shown for the X axis.
     */
    public getXAxisMajorGridlines(): boolean | null {
        return this.#xAxisMajorGridlines;
    }

    /**
     * Set whether major gridlines are shown for the X axis.
     */
    public setXAxisMajorGridlines(show: boolean | null): this {
        this.#xAxisMajorGridlines = show;
        return this;
    }

    /**
     * Get the X-axis major gridline style.
     */
    public getXAxisMajorGridlineStyle(): GridlineStyle | null {
        return this.#xAxisMajorGridlineStyle;
    }

    /**
     * Set the X-axis major gridline style.
     */
    public setXAxisMajorGridlineStyle(style: GridlineStyle | null): this {
        this.#xAxisMajorGridlineStyle = style;
        return this;
    }

    /**
     * Get whether minor gridlines are shown for the X axis.
     */
    public getXAxisMinorGridlines(): boolean | null {
        return this.#xAxisMinorGridlines;
    }

    /**
     * Set whether minor gridlines are shown for the X axis.
     */
    public setXAxisMinorGridlines(show: boolean | null): this {
        this.#xAxisMinorGridlines = show;
        return this;
    }

    /**
     * Get the X-axis minor gridline style.
     */
    public getXAxisMinorGridlineStyle(): GridlineStyle | null {
        return this.#xAxisMinorGridlineStyle;
    }

    /**
     * Set the X-axis minor gridline style.
     */
    public setXAxisMinorGridlineStyle(style: GridlineStyle | null): this {
        this.#xAxisMinorGridlineStyle = style;
        return this;
    }

    /**
     * Get whether major gridlines are shown for the Y axis.
     */
    public getYAxisMajorGridlines(): boolean | null {
        return this.#yAxisMajorGridlines;
    }

    /**
     * Set whether major gridlines are shown for the Y axis.
     */
    public setYAxisMajorGridlines(show: boolean | null): this {
        this.#yAxisMajorGridlines = show;
        return this;
    }

    /**
     * Get the Y-axis major gridline style.
     */
    public getYAxisMajorGridlineStyle(): GridlineStyle | null {
        return this.#yAxisMajorGridlineStyle;
    }

    /**
     * Set the Y-axis major gridline style.
     */
    public setYAxisMajorGridlineStyle(style: GridlineStyle | null): this {
        this.#yAxisMajorGridlineStyle = style;
        return this;
    }

    /**
     * Get whether minor gridlines are shown for the Y axis.
     */
    public getYAxisMinorGridlines(): boolean | null {
        return this.#yAxisMinorGridlines;
    }

    /**
     * Set whether minor gridlines are shown for the Y axis.
     */
    public setYAxisMinorGridlines(show: boolean | null): this {
        this.#yAxisMinorGridlines = show;
        return this;
    }

    /**
     * Get the Y-axis minor gridline style.
     */
    public getYAxisMinorGridlineStyle(): GridlineStyle | null {
        return this.#yAxisMinorGridlineStyle;
    }

    /**
     * Set the Y-axis minor gridline style.
     */
    public setYAxisMinorGridlineStyle(style: GridlineStyle | null): this {
        this.#yAxisMinorGridlineStyle = style;
        return this;
    }

    /**
     * @deprecated Use getPlotArea() with DataSeries instead
     */
    public getSeries(): ReadonlyArray<ChartSeriesModel> {
        // Convert DataSeries back to legacy format for backward compatibility
        return this.#plotArea.map((ds, idx) => ({
            idx,
            order: ds.getPlotOrder(),
            categoryFormula: ds.getPlotCategories()[0]?.getDataSource() ?? null,
            valuesFormula: ds.getPlotValues()[0]?.getDataSource() ?? null,
        }));
    }

    /**
     * @deprecated Use setPlotArea() with DataSeries instead
     */
    public setSeries(series: ChartSeriesModel[]): this {
        // Legacy support - will create placeholder DataSeries objects
        return this;
    }

    /**
     * Get the plot area (data series collection).
     */
    public getPlotArea(): DataSeries[] {
        return this.#plotArea;
    }

    /**
     * Set the plot area (data series collection).
     */
    public setPlotArea(plotArea: DataSeries[]): this {
        this.#plotArea = [...plotArea];
        return this;
    }

    /**
     * Get plot area layout settings.
     */
    public getPlotAreaLayout(): ChartLayout | null {
        return this.#plotAreaLayout;
    }

    /**
     * Set plot area layout settings.
     */
    public setPlotAreaLayout(layout: ChartLayout | null): this {
        this.#plotAreaLayout = layout;
        return this;
    }

    /**
     * Get chart area no-fill setting.
     */
    public getChartAreaNoFill(): boolean | null {
        return this.#chartAreaNoFill;
    }

    /**
     * Set chart area no-fill setting.
     */
    public setChartAreaNoFill(noFill: boolean | null): this {
        this.#chartAreaNoFill = noFill;
        return this;
    }

    /**
     * Get chart area no-border setting.
     */
    public getChartAreaNoBorder(): boolean | null {
        return this.#chartAreaNoBorder;
    }

    /**
     * Set chart area no-border setting.
     */
    public setChartAreaNoBorder(noBorder: boolean | null): this {
        this.#chartAreaNoBorder = noBorder;
        return this;
    }

    /**
     * Get chart area fill color.
     */
    public getChartAreaFillColor(): Color | null {
        return this.#chartAreaFillColor;
    }

    /**
     * Set chart area fill color.
     */
    public setChartAreaFillColor(color: Color | null): this {
        this.#chartAreaFillColor = color;
        return this;
    }

    /**
     * Get chart area border style.
     */
    public getChartAreaBorderStyle(): ChartBorderStyle | null {
        return this.#chartAreaBorderStyle;
    }

    /**
     * Set chart area border style.
     */
    public setChartAreaBorderStyle(style: ChartBorderStyle | null): this {
        this.#chartAreaBorderStyle = style;
        return this;
    }

    /**
     * Get plot area no-fill setting.
     */
    public getPlotAreaNoFill(): boolean | null {
        return this.#plotAreaNoFill;
    }

    /**
     * Set plot area no-fill setting.
     */
    public setPlotAreaNoFill(noFill: boolean | null): this {
        this.#plotAreaNoFill = noFill;
        return this;
    }

    /**
     * Get plot area gradient stops.
     */
    public getPlotAreaGradientStops(): ChartGradientStop[] {
        return [...this.#plotAreaGradientStops];
    }

    /**
     * Set plot area gradient stops.
     */
    public setPlotAreaGradientStops(stops: ChartGradientStop[]): this {
        this.#plotAreaGradientStops = [...stops];
        return this;
    }

    /**
     * Get plot area gradient angle (degrees).
     */
    public getPlotAreaGradientAngle(): number | null {
        return this.#plotAreaGradientAngle;
    }

    /**
     * Set plot area gradient angle (degrees).
     */
    public setPlotAreaGradientAngle(angle: number | null): this {
        this.#plotAreaGradientAngle = angle;
        return this;
    }

    /**
     * Get the X rotation for 3D view.
     */
    public getRotX(): number | null {
        return this.#rotX;
    }

    /**
     * Set the X rotation for 3D view.
     */
    public setRotX(rotX: number | null): this {
        this.#rotX = rotX;
        return this;
    }

    /**
     * Get the Y rotation for 3D view.
     */
    public getRotY(): number | null {
        return this.#rotY;
    }

    /**
     * Set the Y rotation for 3D view.
     */
    public setRotY(rotY: number | null): this {
        this.#rotY = rotY;
        return this;
    }

    /**
     * Get the right angle axis flag for 3D view.
     */
    public getRAngAx(): number | null {
        return this.#rAngAx;
    }

    /**
     * Set the right angle axis flag for 3D view.
     */
    public setRAngAx(rAngAx: number | null): this {
        this.#rAngAx = rAngAx;
        return this;
    }

    /**
     * Get the perspective value for 3D view.
     */
    public getPerspective(): number | null {
        return this.#perspective;
    }

    /**
     * Set the perspective value for 3D view.
     */
    public setPerspective(perspective: number | null): this {
        this.#perspective = perspective;
        return this;
    }

    /**
     * Get the series axis ID for surface charts.
     */
    public getSerAxisId(): string | null {
        return this.#serAxisId;
    }

    /**
     * Set the series axis ID for surface charts.
     */
    public setSerAxisId(serAxisId: string | null): this {
        this.#serAxisId = serAxisId;
        return this;
    }

    /**
     * Add a data series to the plot area.
     */
    public addDataSeries(dataSeries: DataSeries): this {
        this.#plotArea.push(dataSeries);
        return this;
    }

    // ===== Legend Methods =====

    /**
     * Get the legend position.
     */
    public getLegendPosition(): string | null {
        return this.#legendPosition;
    }

    /**
     * Set the legend position.
     * @param position - Legend position ('top', 'bottom', 'left', 'right', 'none')
     */
    public setLegendPosition(position: LegendPosition): void {
        this.#legendPosition = position;
    }

    /**
     * Get the legend title.
     */
    public getLegendTitle(): string | null {
        return this.#legendTitle;
    }

    /**
     * Set the legend title.
     * @param title - Legend title text
     */
    public setLegendTitle(title: string): void {
        this.#legendTitle = title;
    }

    /**
     * Get whether legend should overlay the chart.
     */
    public getLegendOverlay(): boolean {
        return this.#legendOverlay;
    }

    /**
     * Set whether legend should overlay the chart.
     * @param overlay - Whether legend should overlay chart area
     */
    public setLegendOverlay(overlay: boolean): void {
        this.#legendOverlay = overlay;
    }

    /**
     * Configure legend with a single method.
     * @param config - Legend configuration object
     */
    public setLegend(config: LegendConfig): void {
        this.#legendPosition = config.position;
        this.#legendTitle = config.title ?? null;
        this.#legendOverlay = config.overlay ?? false;
    }

    /**
     * @deprecated Use getPlotArea() instead
     */
    public getModel(): ChartModel {
        return {
            titleText: this.#titleText,
            series: [...this.getSeries()],
        };
    }

    /**
     * @deprecated Use setPlotArea() instead
     */
    public setModel(model: ChartModel): this {
        this.#titleText = model.titleText;
        // Legacy support - series will be empty
        return this;
    }

    /**
     * Get the owning worksheet (if attached).
     */
    public getWorksheet(): Worksheet | null {
        return this.#worksheet;
    }

    /**
     * Attach/detach this chart to/from a worksheet.
     *
     * Note: this does not update any worksheet collections.
     * Prefer `Worksheet.addChart()` and `Worksheet.removeChart()`.
     */
    public setWorksheet(worksheet: Worksheet | null): this {
        this.#worksheet = worksheet;
        return this;
    }

    /**
     * Detach this chart from any worksheet.
     */
    public detach(): void {
        this.#worksheet = null;
    }

    /**
     * Get the X-axis object (for date axis and other axis properties).
     */
    public getXAxis(): Axis | null {
        return this.#xAxis;
    }

    /**
     * Set the X-axis object.
     */
    public setXAxis(axis: Axis | null): this {
        this.#xAxis = axis;
        return this;
    }

    /**
     * Get the Y-axis object (for date axis and other axis properties).
     */
    public getYAxis(): Axis | null {
        return this.#yAxis;
    }

    /**
     * Set the Y-axis object.
     */
    public setYAxis(axis: Axis | null): this {
        this.#yAxis = axis;
        return this;
    }

    static #normalizePosition(position: ChartPosition): Required<ChartPosition> {
        return {
            cell: Chart.#normalizeCoordinate(position.cell),
            offsetX: position.offsetX ?? 0,
            offsetY: position.offsetY ?? 0,
        };
    }

    static #normalizeCoordinate(cellCoordinate: string): string {
        const coordinate = cellCoordinate.toUpperCase();
        if (Coordinate.coordinateIsRange(coordinate)) {
            throw new Error('Cell coordinate string can not be a range of cells.');
        }
        if (coordinate.includes('!')) {
            throw new Error('Cell coordinate must not include a worksheet reference.');
        }
        if (coordinate.includes('$')) {
            throw new Error('Cell coordinate string must not be absolute.');
        }
        if (coordinate.length === 0) {
            throw new Error('Cell coordinate can not be zero-length string.');
        }
        if (!/^[A-Z]+\d+$/.test(coordinate)) {
            throw new Error('Cell coordinate string is not a valid A1 reference.');
        }
        return coordinate;
    }
}
