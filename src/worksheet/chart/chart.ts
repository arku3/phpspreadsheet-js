import type { Worksheet } from '../../core/worksheet.ts';
import { Color } from '../../style/color.ts';
import { Font } from '../../style/font.ts';
import { Axis } from './axis.ts';
import { ChartColor } from './chart-color.ts';
import { DEFAULT_EMPTY_AS, VALID_EMPTY_AS, type DataSeries } from './data-series.ts';
import type { GlowProperties, ShadowProperties, SoftEdgesProperties } from './effects.ts';
import { GridLines } from './grid-lines.ts';
import { Legend } from './legend.ts';
import { PlotArea } from './plot-area.ts';
import { Title } from './title.ts';

/**
 * Effects for chart elements (shadow, glow, soft edges).
 */
export interface Effects {
    shadow?: ShadowProperties | null;
    glow?: GlowProperties | null;
    softEdges?: SoftEdgesProperties | null;
}

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
    public static readonly DEFAULT_DISPLAY_BLANKS_AS = DEFAULT_EMPTY_AS;

    #name: string = '';

    #topLeftCell: string = 'A1';
    #topLeftOffsetX: number = 0;
    #topLeftOffsetY: number = 0;

    #bottomRightCell: string = '';
    #bottomRightOffsetX: number = 10;
    #bottomRightOffsetY: number = 10;

    #chartXmlPath: string | null = null;

    #titleText: string | null = null;
    #titleFont: Font | null = null;
    #title: Title | null = null;
    #plotArea: DataSeries[] = [];
    #plotAreaLayout: ChartLayout | null = null;
    #plotAreaObject: PlotArea | null = null;

    #plotVisibleOnly: boolean = true;
    #displayBlanksAs: string = Chart.DEFAULT_DISPLAY_BLANKS_AS;
    #xAxisLabel: Title | null = null;
    #yAxisLabel: Title | null = null;
    #chartAxisX: Axis = new Axis();
    #chartAxisY: Axis = new Axis();
    #majorGridlines: GridLines | null = null;
    #minorGridlines: GridLines | null = null;
    #borderLines: GridLines = new GridLines();
    #fillColor: ChartColor = new ChartColor();
    #oneCellAnchor: boolean = false;
    #autoTitleDeleted: boolean = false;
    #roundedCorners: boolean = false;
    #renderedWidth: number | null = null;
    #renderedHeight: number | null = null;

    // Chart area styling
    #chartAreaNoFill: boolean | null = null;
    #chartAreaNoBorder: boolean | null = null;
    #chartAreaFillColor: Color | null = null;
    #chartAreaBorderStyle: ChartBorderStyle | null = null;

    // Chart area effects
    #chartAreaEffects: Effects | null = null;
    #chartAreaShadow: ShadowProperties | null = null;
    #chartAreaGlow: GlowProperties | null = null;
    #chartAreaSoftEdges: SoftEdgesProperties | null = null;

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
    #legend: Legend | null = null;

    // Ownership tracking (set by Worksheet.addChart/removeChart).
    #worksheet: Worksheet | null = null;

    public constructor(
        name: string = '',
        title: Title | null = null,
        legend: Legend | null = null,
        plotArea: PlotArea | null = null,
        plotVisibleOnly: boolean = true,
        displayBlanksAs: string = Chart.DEFAULT_DISPLAY_BLANKS_AS,
        xAxisLabel: Title | null = null,
        yAxisLabel: Title | null = null,
        xAxis: Axis | null = null,
        yAxis: Axis | null = null,
        majorGridlines: GridLines | null = null,
        minorGridlines: GridLines | null = null,
    ) {
        this.#name = name;
        this.#title = title;
        this.#legend = legend;
        this.#plotAreaObject = plotArea;
        this.#plotVisibleOnly = plotVisibleOnly;
        this.setDisplayBlanksAs(displayBlanksAs);
        this.#xAxisLabel = xAxisLabel;
        this.#yAxisLabel = yAxisLabel;
        this.#chartAxisX = xAxis ?? new Axis();
        this.#chartAxisY = yAxis ?? new Axis();
        this.#majorGridlines = majorGridlines;
        this.#minorGridlines = minorGridlines;
        if (majorGridlines) {
            this.#chartAxisY.setMajorGridlines(majorGridlines);
        }
        if (minorGridlines) {
            this.#chartAxisY.setMinorGridlines(minorGridlines);
        }
    }

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

    public getTopLeftCell(): string {
        return this.#topLeftCell;
    }

    public setTopLeftCell(cellAddress: string): this {
        this.#topLeftCell = cellAddress;
        return this;
    }

    public getTopLeftOffset(): { X: number; Y: number } {
        return { X: this.#topLeftOffsetX, Y: this.#topLeftOffsetY };
    }

    public setTopLeftOffset(xOffset: number | null, yOffset: number | null): this {
        if (xOffset !== null) {
            this.#topLeftOffsetX = xOffset;
        }
        if (yOffset !== null) {
            this.#topLeftOffsetY = yOffset;
        }
        return this;
    }

    public getTopLeftXOffset(): number {
        return this.#topLeftOffsetX;
    }

    public setTopLeftXOffset(xOffset: number): this {
        this.#topLeftOffsetX = xOffset;
        return this;
    }

    public getTopLeftYOffset(): number {
        return this.#topLeftOffsetY;
    }

    public setTopLeftYOffset(yOffset: number): this {
        this.#topLeftOffsetY = yOffset;
        return this;
    }

    /**
     * Set the top-left chart position.
     */
    public setTopLeftPosition(position: ChartPosition): this;
    public setTopLeftPosition(cellAddress: string, xOffset?: number | null, yOffset?: number | null): this;
    public setTopLeftPosition(
        positionOrCell: ChartPosition | string,
        xOffset: number | null = null,
        yOffset: number | null = null,
    ): this {
        if (typeof positionOrCell === 'string') {
            this.#topLeftCell = positionOrCell;
            if (xOffset !== null) {
                this.#topLeftOffsetX = xOffset;
            }
            if (yOffset !== null) {
                this.#topLeftOffsetY = yOffset;
            }
            return this;
        }

        const normalized = Chart.#normalizePosition(positionOrCell);
        this.#topLeftCell = normalized.cell;
        if (normalized.offsetX !== undefined) {
            this.#topLeftOffsetX = normalized.offsetX;
        }
        if (normalized.offsetY !== undefined) {
            this.#topLeftOffsetY = normalized.offsetY;
        }
        return this;
    }

    /**
     * Get the bottom-right chart position (if set).
     */
    public getBottomRightPosition(): Required<ChartPosition> {
        return {
            cell: this.#bottomRightCell,
            offsetX: this.#bottomRightOffsetX,
            offsetY: this.#bottomRightOffsetY,
        };
    }

    public getBottomRightCell(): string {
        return this.#bottomRightCell;
    }

    public setBottomRightCell(cellAddress: string = ''): this {
        this.#bottomRightCell = cellAddress;
        return this;
    }

    public getBottomRightOffset(): { X: number; Y: number } {
        return { X: this.#bottomRightOffsetX, Y: this.#bottomRightOffsetY };
    }

    public setBottomRightOffset(xOffset: number | null, yOffset: number | null): this {
        if (xOffset !== null) {
            this.#bottomRightOffsetX = xOffset;
        }
        if (yOffset !== null) {
            this.#bottomRightOffsetY = yOffset;
        }
        return this;
    }

    public getBottomRightXOffset(): number {
        return this.#bottomRightOffsetX;
    }

    public setBottomRightXOffset(xOffset: number): this {
        this.#bottomRightOffsetX = xOffset;
        return this;
    }

    public getBottomRightYOffset(): number {
        return this.#bottomRightOffsetY;
    }

    public setBottomRightYOffset(yOffset: number): this {
        this.#bottomRightOffsetY = yOffset;
        return this;
    }

    /**
     * Set (or clear) the bottom-right chart position.
     */
    public setBottomRightPosition(position: ChartPosition | null): this;
    public setBottomRightPosition(cellAddress?: string, xOffset?: number | null, yOffset?: number | null): this;
    public setBottomRightPosition(
        positionOrCell: ChartPosition | string | null | undefined = '',
        xOffset: number | null = null,
        yOffset: number | null = null,
    ): this {
        if (positionOrCell === null) {
            this.#bottomRightCell = '';
            this.#bottomRightOffsetX = 0;
            this.#bottomRightOffsetY = 0;
            return this;
        }

        if (typeof positionOrCell === 'string') {
            this.#bottomRightCell = positionOrCell;
            if (xOffset !== null) {
                this.#bottomRightOffsetX = xOffset;
            }
            if (yOffset !== null) {
                this.#bottomRightOffsetY = yOffset;
            }
            return this;
        }

        const normalized = Chart.#normalizePosition(positionOrCell);
        this.#bottomRightCell = normalized.cell;
        if (normalized.offsetX !== undefined) {
            this.#bottomRightOffsetX = normalized.offsetX;
        }
        if (normalized.offsetY !== undefined) {
            this.#bottomRightOffsetY = normalized.offsetY;
        }
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
     * Get the chart title object.
     */
    public getTitle(): Title | null {
        return this.#title;
    }

    /**
     * Set the chart title object.
     */
    public setTitle(title: Title | null): this {
        this.#title = title;
        return this;
    }

    public getXAxisLabel(): Title | null {
        return this.#xAxisLabel;
    }

    public setXAxisLabel(label: Title): this {
        this.#xAxisLabel = label;
        return this;
    }

    public getYAxisLabel(): Title | null {
        return this.#yAxisLabel;
    }

    public setYAxisLabel(label: Title): this {
        this.#yAxisLabel = label;
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

    public getPlotAreaObject(): PlotArea | null {
        return this.#plotAreaObject;
    }

    public getPlotAreaOrThrow(): PlotArea {
        if (!this.#plotAreaObject) {
            throw new Error('Chart has no PlotArea');
        }
        return this.#plotAreaObject;
    }

    public setPlotAreaObject(plotArea: PlotArea): this {
        this.#plotAreaObject = plotArea;
        return this;
    }

    public getPlotVisibleOnly(): boolean {
        return this.#plotVisibleOnly;
    }

    public setPlotVisibleOnly(plotVisibleOnly: boolean): this {
        this.#plotVisibleOnly = plotVisibleOnly;
        return this;
    }

    public getDisplayBlanksAs(): string {
        return this.#displayBlanksAs;
    }

    public setDisplayBlanksAs(displayBlanksAs: string): this {
        const normalized = displayBlanksAs.toLowerCase();
        this.#displayBlanksAs = VALID_EMPTY_AS.includes(normalized as (typeof VALID_EMPTY_AS)[number])
            ? normalized
            : Chart.DEFAULT_DISPLAY_BLANKS_AS;
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
     * Get chart area effects.
     */
    public getChartAreaEffects(): Effects | null {
        return this.#chartAreaEffects;
    }

    /**
     * Set chart area effects.
     */
    public setChartAreaEffects(effects: Effects | null): this {
        this.#chartAreaEffects = effects;
        return this;
    }

    public getNoFill(): boolean {
        return this.#chartAreaNoFill ?? false;
    }

    public setNoFill(noFill: boolean): this {
        this.#chartAreaNoFill = noFill;
        return this;
    }

    public getNoBorder(): boolean {
        return this.#chartAreaNoBorder ?? false;
    }

    public setNoBorder(noBorder: boolean): this {
        this.#chartAreaNoBorder = noBorder;
        return this;
    }

    public getRoundedCorners(): boolean {
        return this.#roundedCorners;
    }

    public setRoundedCorners(roundedCorners: boolean | null): this {
        if (roundedCorners !== null) {
            this.#roundedCorners = roundedCorners;
        }
        return this;
    }

    public getBorderLines(): GridLines {
        return this.#borderLines;
    }

    public setBorderLines(borderLines: GridLines): this {
        this.#borderLines = borderLines;
        return this;
    }

    public getFillColor(): ChartColor {
        return this.#fillColor;
    }

    public setRenderedWidth(width: number | null): this {
        this.#renderedWidth = width;
        return this;
    }

    public getRenderedWidth(): number | null {
        return this.#renderedWidth;
    }

    public setRenderedHeight(height: number | null): this {
        this.#renderedHeight = height;
        return this;
    }

    public getRenderedHeight(): number | null {
        return this.#renderedHeight;
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

    public getOneCellAnchor(): boolean {
        return this.#oneCellAnchor;
    }

    public setOneCellAnchor(oneCellAnchor: boolean): this {
        this.#oneCellAnchor = oneCellAnchor;
        return this;
    }

    public getAutoTitleDeleted(): boolean {
        return this.#autoTitleDeleted;
    }

    public setAutoTitleDeleted(autoTitleDeleted: boolean): this {
        this.#autoTitleDeleted = autoTitleDeleted;
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
     * Get the Legend object.
     */
    public getLegend(): Legend | null {
        return this.#legend;
    }

    /**
     * Set the Legend object.
     */
    public setLegendObject(legend: Legend | null): this {
        this.#legend = legend;
        return this;
    }

    public setLegend(legend: Legend): this;
    public setLegend(config: LegendConfig): this;
    public setLegend(legendOrConfig: Legend | LegendConfig): this {
        if (legendOrConfig instanceof Legend) {
            this.#legend = legendOrConfig;
            return this;
        }

        this.#legendPosition = legendOrConfig.position;
        this.#legendTitle = legendOrConfig.title ?? null;
        this.#legendOverlay = legendOrConfig.overlay ?? false;
        return this;
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

    public getChartAxisX(): Axis {
        return this.#chartAxisX;
    }

    public setChartAxisX(axis: Axis | null): this {
        this.#chartAxisX = axis ?? new Axis();
        return this;
    }

    public getChartAxisY(): Axis {
        return this.#chartAxisY;
    }

    public setChartAxisY(axis: Axis | null): this {
        this.#chartAxisY = axis ?? new Axis();
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

    public refresh(): void {
        if (this.#worksheet && this.#plotAreaObject) {
            this.#plotAreaObject.refresh(this.#worksheet);
        }
    }

    public render(_outputDestination: string | null = null): boolean {
        return false;
    }

    public clone(): Chart {
        const chart = new Chart(
            this.#name,
            this.#title ? this.#title.clone() : null,
            this.#legend ? this.#legend.clone() : null,
            this.#plotAreaObject ? this.#plotAreaObject.clone() : null,
            this.#plotVisibleOnly,
            this.#displayBlanksAs,
            this.#xAxisLabel ? this.#xAxisLabel.clone() : null,
            this.#yAxisLabel ? this.#yAxisLabel.clone() : null,
            this.#chartAxisX ? this.#chartAxisX.clone() : null,
            this.#chartAxisY ? this.#chartAxisY.clone() : null,
            this.#majorGridlines ? this.#majorGridlines.clone() : null,
            this.#minorGridlines ? this.#minorGridlines.clone() : null,
        );

        chart
            .setTopLeftPosition(this.getTopLeftPosition())
            .setBottomRightPosition(this.getBottomRightPosition())
            .setChartXmlPath(this.getChartXmlPath())
            .setTitleText(this.getTitleText())
            .setTitleFont(this.getTitleFont())
            .setXAxisTitle(this.getXAxisTitle())
            .setXAxisTitleFont(this.getXAxisTitleFont())
            .setYAxisTitle(this.getYAxisTitle())
            .setYAxisTitleFont(this.getYAxisTitleFont())
            .setXAxisMajorGridlines(this.getXAxisMajorGridlines())
            .setXAxisMajorGridlineStyle(this.getXAxisMajorGridlineStyle())
            .setXAxisMinorGridlines(this.getXAxisMinorGridlines())
            .setXAxisMinorGridlineStyle(this.getXAxisMinorGridlineStyle())
            .setYAxisMajorGridlines(this.getYAxisMajorGridlines())
            .setYAxisMajorGridlineStyle(this.getYAxisMajorGridlineStyle())
            .setYAxisMinorGridlines(this.getYAxisMinorGridlines())
            .setYAxisMinorGridlineStyle(this.getYAxisMinorGridlineStyle())
            .setSeries([...this.getSeries()])
            .setPlotArea([...this.getPlotArea()])
            .setPlotAreaLayout(this.getPlotAreaLayout())
            .setChartAreaNoFill(this.getChartAreaNoFill())
            .setChartAreaNoBorder(this.getChartAreaNoBorder())
            .setChartAreaFillColor(this.getChartAreaFillColor())
            .setChartAreaBorderStyle(this.getChartAreaBorderStyle())
            .setChartAreaEffects(this.getChartAreaEffects())
            .setPlotAreaNoFill(this.getPlotAreaNoFill())
            .setPlotAreaGradientStops([...this.getPlotAreaGradientStops()])
            .setPlotAreaGradientAngle(this.getPlotAreaGradientAngle())
            .setRotX(this.getRotX())
            .setRotY(this.getRotY())
            .setRAngAx(this.getRAngAx())
            .setPerspective(this.getPerspective())
            .setSerAxisId(this.getSerAxisId())
            .setXAxis(this.getXAxis())
            .setYAxis(this.getYAxis())
            .setPlotVisibleOnly(this.#plotVisibleOnly)
            .setDisplayBlanksAs(this.#displayBlanksAs)
            .setChartAxisX(this.#chartAxisX ? this.#chartAxisX.clone() : null)
            .setChartAxisY(this.#chartAxisY ? this.#chartAxisY.clone() : null)
            .setOneCellAnchor(this.#oneCellAnchor)
            .setAutoTitleDeleted(this.#autoTitleDeleted)
            .setRoundedCorners(this.#roundedCorners)
            .setRenderedWidth(this.#renderedWidth)
            .setRenderedHeight(this.#renderedHeight);

        if (this.#xAxisLabel) {
            chart.setXAxisLabel(this.#xAxisLabel.clone());
        }
        if (this.#yAxisLabel) {
            chart.setYAxisLabel(this.#yAxisLabel.clone());
        }

        chart.setModel(this.getModel());
        chart.setWorksheet(null);

        chart.#borderLines = this.#borderLines.clone();
        chart.#fillColor = this.#fillColor.clone();

        return chart;
    }

    static #normalizePosition(position: ChartPosition): Required<ChartPosition> {
        return {
            cell: Chart.#normalizeCoordinate(position.cell),
            offsetX: position.offsetX ?? 0,
            offsetY: position.offsetY ?? 0,
        };
    }

    static #normalizeCoordinate(cellCoordinate: string): string {
        return cellCoordinate;
    }
}
