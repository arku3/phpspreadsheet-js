import { Helpers } from '../../calculation/helpers';
import type { Worksheet } from '../../core/worksheet';
import { Coordinate } from '../../utils/coordinate';
import { ChartColor, EXCEL_COLOR_TYPE_RGB, EXCEL_COLOR_TYPE_SCHEME, EXCEL_COLOR_TYPE_STANDARD } from './chart-color';
import type { Layout } from './layout';
import { Properties } from './properties';
import type { TrendLine } from './trend-line';

export const DATASERIES_TYPE_STRING = 'String' as const;
export const DATASERIES_TYPE_NUMBER = 'Number' as const;

/**
 * Represents values for a data series in a chart.
 * Links chart data to worksheet cells.
 */
export class DataSeriesValues extends Properties {
    #dataType: 'String' | 'Number' | null = DATASERIES_TYPE_NUMBER;
    #dataSource: string | null;
    #formatCode: string | null;
    #markerFillColor: string | null;
    #markerBorderColor: string | null;
    #pointCount: number;
    #dataValues: unknown[] | null = [];
    #trendLines: TrendLine[];
    #pointMarker: string | null;
    #pointSize: number;
    #fillColor: ChartColor | ChartColor[] | null = null;
    #scatterLines: boolean = true;
    #bubble3D: boolean = false;
    #labelLayout: Layout | null = null;
    #smoothLine: boolean = false;

    constructor(
        dataType: 'String' | 'Number' | null = DATASERIES_TYPE_NUMBER,
        dataSource: string | null = null,
        formatCode: string | null = null,
        pointCount: number = 0,
        dataValues: unknown[] | null = [],
        marker: string | null = null,
        fillColor: ChartColor | ChartColor[] | string | string[] | null = null,
        pointSize: number | string = 3,
    ) {
        super();
        this.setDataType(dataType);
        this.#dataSource = dataSource;
        this.#formatCode = formatCode;
        this.#pointCount = pointCount;
        this.#dataValues = dataValues;
        this.#markerFillColor = null;
        this.#markerBorderColor = null;
        this.#trendLines = [];
        this.#pointMarker = marker;
        this.#pointSize = Number.isFinite(Number(pointSize)) ? Number(pointSize) : 3;
        if (fillColor !== null) {
            this.setFillColor(fillColor);
        }
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
    setDataType(dataType: 'String' | 'Number' | null): this {
        if (dataType && dataType !== DATASERIES_TYPE_STRING && dataType !== DATASERIES_TYPE_NUMBER) {
            throw new Error('Invalid datatype for chart data series values');
        }
        this.#dataType = dataType;
        return this;
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
    setDataSource(dataSource: string | null): this {
        this.#dataSource = dataSource;
        return this;
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
    setFormatCode(formatCode: string | null): this {
        this.#formatCode = formatCode;
        return this;
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
    setPointCount(pointCount: number): this {
        this.#pointCount = pointCount;
        return this;
    }

    /**
     * Get marker fill color (for line charts).
     */
    getMarkerFillColor(): ChartColor {
        return this.getMarkerFillColorObject();
    }

    /**
     * Set marker fill color.
     */
    setMarkerFillColor(color: ChartColor | string | null): this {
        if (color instanceof ChartColor) {
            this.#markerFillColor = DataSeriesValues.chartColorToString(color);
        } else {
            this.#markerFillColor = color;
        }
        return this;
    }

    /**
     * Get marker border color (for line charts).
     */
    getMarkerBorderColor(): ChartColor {
        return this.getMarkerBorderColorObject();
    }

    /**
     * Set marker border color.
     */
    setMarkerBorderColor(color: ChartColor | string | null): this {
        if (color instanceof ChartColor) {
            this.#markerBorderColor = DataSeriesValues.chartColorToString(color);
        } else {
            this.#markerBorderColor = color;
        }
        return this;
    }

    /**
     * Check if this series is multi-level (has categories).
     */
    isMultiLevel(): boolean {
        return this.isMultiLevelSeries() ?? false;
    }

    isMultiLevelSeries(): boolean | null {
        if (!this.#dataValues || this.#dataValues.length === 0) {
            return null;
        }
        return Array.isArray(this.#dataValues[0]);
    }

    multiLevelCount(): number {
        if (!this.#dataValues || this.#dataValues.length === 0) {
            return 0;
        }
        return Array.isArray(this.#dataValues[0]) ? this.#dataValues.length : 0;
    }

    /**
     * Get trend lines for this data series.
     */
    getTrendLines(): TrendLine[] {
        return this.#trendLines;
    }

    /**
     * Set trend lines for this data series.
     */
    setTrendLines(trendLines: TrendLine[]): this {
        this.#trendLines = trendLines;
        return this;
    }

    /**
     * Add a trend line to this data series.
     */
    addTrendLine(trendLine: TrendLine): void {
        this.#trendLines.push(trendLine);
    }

    /**
     * Get point marker (for line charts).
     */
    getPointMarker(): string | null {
        return this.#pointMarker;
    }

    /**
     * Set point marker.
     */
    setPointMarker(marker: string | null): this {
        this.#pointMarker = marker;
        return this;
    }

    /**
     * Get point size.
     */
    getPointSize(): number {
        return this.#pointSize;
    }

    /**
     * Set point size.
     */
    setPointSize(size: number): this {
        this.#pointSize = size;
        return this;
    }

    getDataValues(): unknown[] | null {
        return this.#dataValues;
    }

    getDataValue(): unknown {
        if (!this.#dataValues) {
            return null;
        }
        if (this.#dataValues.length === 1) {
            return this.#dataValues[0];
        }
        return this.#dataValues;
    }

    setDataValues(dataValues: unknown[]): this {
        const pointCount = Array.isArray(dataValues) ? dataValues.length : 0;
        this.#dataValues = Helpers.flattenArray(dataValues);
        this.#pointCount = pointCount;
        return this;
    }

    refresh(worksheet: Worksheet, flatten: boolean = true): void {
        if (!this.#dataSource) {
            return;
        }
        const calculation = worksheet.getParent()?.getCalculationEngine();
        if (!calculation) {
            return;
        }
        const formula = `=${this.#dataSource}`;
        const value = calculation.calculateFormula(formula, worksheet) ?? null;
        if (flatten) {
            const flattened = Helpers.flattenArray(value ?? []);
            this.#dataValues = flattened.map((entry) =>
                typeof entry === 'string' && entry.startsWith('#') ? 0.0 : entry,
            );
        } else {
            const dataValue = value ?? null;
            const flattened = Helpers.flattenArray(dataValue ?? []);
            const { rowCount, columnCount } = DataSeriesValues.getRangeDimensions(this.#dataSource ?? '');
            if (rowCount === 1 || columnCount === 1 || rowCount === 0 || columnCount === 0) {
                this.#dataValues = flattened;
            } else {
                const rows = Array.isArray(dataValue) ? dataValue : [];
                const firstRow = Array.isArray(rows[0]) ? (rows[0] as unknown[]) : [];
                const multiLevel = firstRow.map((entry) => [entry]);
                for (let row = 1; row < rowCount; row += 1) {
                    const rowValues = Array.isArray(rows[row]) ? (rows[row] as unknown[]) : [];
                    for (let column = 0; column < columnCount; column += 1) {
                        const valueAt = rowValues[column];
                        if (multiLevel[column]) {
                            multiLevel[column]!.unshift(valueAt);
                        }
                    }
                }
                this.#dataValues = multiLevel;
            }
        }
        this.#pointCount = this.#dataValues ? this.#dataValues.length : 0;
    }

    getFillColor(): string | string[] {
        if (!this.#fillColor) {
            return '';
        }
        if (Array.isArray(this.#fillColor)) {
            return this.#fillColor.map((color) => DataSeriesValues.chartColorToString(color));
        }
        return DataSeriesValues.chartColorToString(this.#fillColor);
    }

    getFillColorObject(): ChartColor | ChartColor[] | null {
        return this.#fillColor;
    }

    setFillColor(color: ChartColor | ChartColor[] | string | string[]): this {
        if (Array.isArray(color)) {
            this.#fillColor = color.map((value) => DataSeriesValues.normalizeChartColor(value));
        } else {
            this.#fillColor = DataSeriesValues.normalizeChartColor(color);
        }
        return this;
    }

    getMarkerFillColorObject(): ChartColor {
        return DataSeriesValues.normalizeChartColor(this.#markerFillColor ?? '');
    }

    getMarkerBorderColorObject(): ChartColor {
        return DataSeriesValues.normalizeChartColor(this.#markerBorderColor ?? '');
    }

    getScatterLines(): boolean {
        return this.#scatterLines;
    }

    setScatterLines(scatterLines: boolean): this {
        this.#scatterLines = scatterLines;
        return this;
    }

    getBubble3D(): boolean {
        return this.#bubble3D;
    }

    setBubble3D(bubble3D: boolean): this {
        this.#bubble3D = bubble3D;
        return this;
    }

    getLabelLayout(): Layout | null {
        return this.#labelLayout;
    }

    setLabelLayout(labelLayout: Layout | null): this {
        this.#labelLayout = labelLayout;
        return this;
    }

    getSmoothLine(): boolean {
        return this.#smoothLine;
    }

    setSmoothLine(smoothLine: boolean): this {
        this.#smoothLine = smoothLine;
        return this;
    }

    getLineWidth(): number | null {
        const value = this.getLineStyleProperty('width');
        const numeric = value === null ? null : Number(value);
        return numeric !== null && Number.isFinite(numeric) ? numeric : null;
    }

    setLineWidth(value: number): this {
        this.setLineStyleProperty('width', value);
        return this;
    }

    public override clone(): DataSeriesValues {
        const cloned = new DataSeriesValues(
            this.#dataType,
            this.#dataSource,
            this.#formatCode,
            this.#pointCount,
            this.#dataValues ? [...this.#dataValues] : this.#dataValues,
            this.#pointMarker,
            this.#fillColor
                ? Array.isArray(this.#fillColor)
                    ? this.#fillColor.map((color) => color.clone())
                    : this.#fillColor.clone()
                : null,
            this.#pointSize,
        );
        cloned.copyLineStyles(this);
        cloned.#markerFillColor = this.#markerFillColor;
        cloned.#markerBorderColor = this.#markerBorderColor;
        cloned.#scatterLines = this.#scatterLines;
        cloned.#bubble3D = this.#bubble3D;
        cloned.#smoothLine = this.#smoothLine;
        cloned.#labelLayout = this.#labelLayout ? this.#labelLayout.clone() : null;
        cloned.#trendLines = this.#trendLines.map((trendLine) => trendLine.clone() as TrendLine);
        return cloned;
    }

    private static normalizeChartColor(color: ChartColor | string): ChartColor {
        if (color instanceof ChartColor) {
            return color;
        }
        if (typeof color === 'string') {
            if (color === '') {
                return new ChartColor();
            }
            if (color.startsWith('*')) {
                return new ChartColor(color.slice(1), null, EXCEL_COLOR_TYPE_SCHEME);
            }
            if (color.startsWith('/')) {
                return new ChartColor(color.slice(1), null, EXCEL_COLOR_TYPE_STANDARD);
            }
            if (/^[a-f0-9]{6}$/i.test(color)) {
                return new ChartColor(color, null, EXCEL_COLOR_TYPE_RGB);
            }
            throw new Error(`Invalid hex color for chart series (color: "${color}")`);
        }
        return new ChartColor();
    }

    private static chartColorToString(color: ChartColor): string {
        const type = color.getType();
        const value = color.getValue();
        if (!type || !value) {
            return '';
        }
        if (type === EXCEL_COLOR_TYPE_SCHEME) {
            return `*${value}`;
        }
        if (type === EXCEL_COLOR_TYPE_STANDARD) {
            return `/${value}`;
        }
        return value;
    }

    private static getRangeDimensions(dataSource: string): { rowCount: number; columnCount: number } {
        if (!dataSource.includes('!') || !dataSource.includes(':')) {
            return { rowCount: 0, columnCount: 0 };
        }
        const reference = dataSource.split('!')[1] ?? '';
        const cleaned = reference.replace(/\$/g, '');
        if (!cleaned.includes(':')) {
            return { rowCount: 0, columnCount: 0 };
        }
        const [[startCol, startRow], [endCol, endRow]] = Coordinate.rangeBoundaries(cleaned);
        return {
            rowCount: Math.abs(endRow - startRow) + 1,
            columnCount: Math.abs(endCol - startCol) + 1,
        };
    }
}
