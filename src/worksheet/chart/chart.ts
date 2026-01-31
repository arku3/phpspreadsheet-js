import type { Worksheet } from '../../core/worksheet.ts';
import { Coordinate } from '../../utils/coordinate.ts';

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

export interface ChartSeriesModel {
    idx?: number;
    order?: number;
    categoryFormula: string | null;
    valuesFormula: string | null;
}

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
    #series: ChartSeriesModel[] = [];

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

    public getSeries(): ReadonlyArray<ChartSeriesModel> {
        return this.#series;
    }

    public setSeries(series: ChartSeriesModel[]): this {
        this.#series = [...series];
        return this;
    }

    public getModel(): ChartModel {
        return {
            titleText: this.#titleText,
            series: [...this.#series],
        };
    }

    public setModel(model: ChartModel): this {
        this.#titleText = model.titleText;
        this.#series = [...model.series];
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
