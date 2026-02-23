import { Font } from '../../style/font';
import { ChartColor } from './chart-color';
import { GridLines } from './grid-lines';
import type { Title } from './title';

export type AxisType = 'catAx' | 'dateAx' | 'valAx' | 'serAx';

export const AXIS_TYPE_CATEGORY = 'catAx' as const;
export const AXIS_TYPE_DATE = 'dateAx' as const;
export const AXIS_TYPE_VALUE = 'valAx' as const;
export const AXIS_TYPE_SERIES = 'serAx' as const;

export interface AxisNumberProperties {
    formatCode: string;
    sourceLinked: number;
    numeric: boolean | null;
}

export interface AxisOptions {
    minimum: string | null;
    maximum: string | null;
    major_unit: string | null;
    minor_unit: string | null;
    orientation: string;
    minor_tick_mark: string;
    major_tick_mark: string;
    axis_labels: string;
    horizontal_crosses: string;
    horizontal_crosses_value: string | null;
    textRotation: string | null;
    hidden: string | null;
    majorTimeUnit: string;
    minorTimeUnit: string;
    baseTimeUnit: string;
    logBase: string | null;
    dispUnitsBuiltIn: string | null;
}

export interface ScalingProperties {
    logBase: number | null;
    min: number | null;
    max: number | null;
    orientation: 'minMax' | 'maxMin';
}

export interface LineStyleArrow {
    type: string;
    size: string | number;
    w: string;
    len: string;
}

export interface LineStyleProperties {
    width: number | string | null;
    compound: string;
    dash: string;
    cap: string;
    join: string;
    arrow: {
        head: LineStyleArrow;
        end: LineStyleArrow;
    };
}

export const AXIS_LABELS_LOW = 'low';
export const AXIS_LABELS_HIGH = 'high';
export const AXIS_LABELS_NEXT_TO = 'nextTo';
export const AXIS_LABELS_NONE = 'none';

export const TICK_MARK_NONE = 'none';
export const TICK_MARK_INSIDE = 'in';
export const TICK_MARK_OUTSIDE = 'out';
export const TICK_MARK_CROSS = 'cross';

export const HORIZONTAL_CROSSES_AUTOZERO = 'autoZero';
export const HORIZONTAL_CROSSES_MAXIMUM = 'max';

export const FORMAT_CODE_GENERAL = 'General';
export const FORMAT_CODE_NUMBER = '#,##0.00';
export const FORMAT_CODE_CURRENCY = '$#,##0.00';
export const FORMAT_CODE_ACCOUNTING = '_($* #,##0.00_);_($* (#,##0.00);_($* "-"??_);_(@_)';
export const FORMAT_CODE_DATE = 'm/d/yyyy';
export const FORMAT_CODE_DATE_ISO8601 = 'yyyy-mm-dd';
export const FORMAT_CODE_TIME = '[$-F400]h:mm:ss AM/PM';
export const FORMAT_CODE_PERCENTAGE = '0.00%';
export const FORMAT_CODE_FRACTION = '# ?/?';
export const FORMAT_CODE_SCIENTIFIC = '0.00E+00';
export const FORMAT_CODE_TEXT = '@';
export const FORMAT_CODE_SPECIAL = '00000';

export const ORIENTATION_NORMAL = 'minMax';
export const ORIENTATION_REVERSED = 'maxMin';

export const TIME_UNIT_DAYS = 'days';
export const TIME_UNIT_MONTHS = 'months';
export const TIME_UNIT_YEARS = 'years';

export const DISP_UNITS_HUNDREDS = 'hundreds';
export const DISP_UNITS_THOUSANDS = 'thousands';
export const DISP_UNITS_TEN_THOUSANDS = 'tenThousands';
export const DISP_UNITS_HUNDRED_THOUSANDS = 'hundredThousands';
export const DISP_UNITS_MILLIONS = 'millions';
export const DISP_UNITS_TEN_MILLIONS = 'tenMillions';
export const DISP_UNITS_HUNDRED_MILLIONS = 'hundredMillions';
export const DISP_UNITS_BILLIONS = 'billions';
export const DISP_UNITS_TRILLIONS = 'trillions';
export const TRILLION_INDEX = 1000000000000;
export const DISP_UNITS_BUILTIN_INT: Record<number, string> = {
    100: DISP_UNITS_HUNDREDS,
    1000: DISP_UNITS_THOUSANDS,
    10000: DISP_UNITS_TEN_THOUSANDS,
    100000: DISP_UNITS_HUNDRED_THOUSANDS,
    1000000: DISP_UNITS_MILLIONS,
    10000000: DISP_UNITS_TEN_MILLIONS,
    100000000: DISP_UNITS_HUNDRED_MILLIONS,
    1000000000: DISP_UNITS_BILLIONS,
    1000000000000: DISP_UNITS_TRILLIONS,
};

export { GridLines as AxisGridLines };

/**
 * AxisText class - represents text formatting for axis labels.
 * Simplified version based on PHP AxisText which extends Properties.
 */
export class AxisText {
    #rotation: number | null = null;
    #font: Font;
    #fillColor: ChartColor | null = null;

    constructor() {
        this.#font = new Font();
    }

    public getRotation(): number | null {
        return this.#rotation;
    }

    public setRotation(rotation: number | null): this {
        this.#rotation = rotation;
        return this;
    }

    public getFillColorObject(): ChartColor {
        if (!this.#fillColor) {
            this.#fillColor = new ChartColor();
        }
        return this.#fillColor;
    }

    public getFont(): Font {
        return this.#font;
    }

    public setFont(font: Font): this {
        this.#font = font;
        return this;
    }

    public clone(): AxisText {
        const cloned = new AxisText();
        cloned.#rotation = this.#rotation;
        cloned.#font = this.#font.clone();
        cloned.#fillColor = this.#fillColor ? this.#fillColor.clone() : null;
        return cloned;
    }
}

/**
 * Axis class - represents a chart axis (X, Y, or secondary).
 * Ported from PhpSpreadsheet Chart/Axis.php
 */
export class Axis {
    #axisType: AxisType | '' = '';
    #axisNumber: AxisNumberProperties = {
        formatCode: FORMAT_CODE_GENERAL,
        sourceLinked: 1,
        numeric: null,
    };
    #axisOptions: AxisOptions = {
        minimum: null,
        maximum: null,
        major_unit: null,
        minor_unit: null,
        orientation: ORIENTATION_NORMAL,
        minor_tick_mark: TICK_MARK_NONE,
        major_tick_mark: TICK_MARK_NONE,
        axis_labels: AXIS_LABELS_NEXT_TO,
        horizontal_crosses: HORIZONTAL_CROSSES_AUTOZERO,
        horizontal_crosses_value: null,
        textRotation: null,
        hidden: null,
        majorTimeUnit: TIME_UNIT_YEARS,
        minorTimeUnit: TIME_UNIT_MONTHS,
        baseTimeUnit: TIME_UNIT_DAYS,
        logBase: null,
        dispUnitsBuiltIn: null,
    };
    #fillColor: ChartColor;
    #lineColor: ChartColor | null = null;
    #lineStyleProperties: LineStyleProperties = {
        width: null,
        compound: '',
        dash: '',
        cap: '',
        join: '',
        arrow: {
            head: { type: '', size: '', w: '', len: '' },
            end: { type: '', size: '', w: '', len: '' },
        },
    };
    #majorGridlines: GridLines | null = null;
    #minorGridlines: GridLines | null = null;
    #title: Title | null = null;
    #axisText: AxisText | null = null;
    #dispUnitsTitle: Title | null = null;
    #crossBetween: string = '';
    #noFill: boolean = false;

    // Axis scaling properties (separate from axisOptions for better type safety)
    #scalingLogBase: number | null = null;
    #scalingMin: number | null = null;
    #scalingMax: number | null = null;
    #scalingOrientation: 'minMax' | 'maxMin' = 'minMax';

    constructor() {
        this.#fillColor = new ChartColor();
    }

    // Axis Type
    public getAxisType(): AxisType | '' {
        return this.#axisType;
    }

    public setAxisType(type: AxisType): this {
        if (type === AXIS_TYPE_CATEGORY || type === AXIS_TYPE_VALUE || type === AXIS_TYPE_DATE) {
            this.#axisType = type;
        } else {
            this.#axisType = '';
        }
        return this;
    }

    // Axis Number
    public getAxisNumber(): AxisNumberProperties {
        return { ...this.#axisNumber };
    }

    public setAxisNumber(axisNumber: AxisNumberProperties): this {
        this.#axisNumber = { ...axisNumber };
        return this;
    }

    public setAxisNumberProperties(formatCode: string, numeric: boolean | null = null, sourceLinked: number = 0): this {
        this.#axisNumber.formatCode = formatCode;
        this.#axisNumber.sourceLinked = sourceLinked;
        if (numeric !== null) {
            this.#axisNumber.numeric = numeric;
        } else if (['#,##0.00', 'm/d/yyyy', 'yyyy-mm-dd'].includes(formatCode)) {
            this.#axisNumber.numeric = true;
        }
        return this;
    }

    public getAxisNumberFormat(): string {
        return this.#axisNumber.formatCode;
    }

    public getAxisNumberSourceLinked(): string {
        return String(this.#axisNumber.sourceLinked);
    }

    public getAxisIsNumericFormat(): boolean {
        return this.#axisType === AXIS_TYPE_DATE || !!this.#axisNumber.numeric;
    }

    // Axis Options
    public getAxisOptions(): AxisOptions {
        return { ...this.#axisOptions };
    }

    public setAxisOptions(options: AxisOptions): this {
        this.#axisOptions = { ...options };
        return this;
    }

    public setAxisOption(key: keyof AxisOptions, value: string | number | null): this {
        if (value !== null && value !== '') {
            this.#axisOptions[key] = String(value) as never;
        }
        return this;
    }

    public getAxisOptionsProperty(property: keyof AxisOptions): string | null {
        if (property === 'textRotation' && this.#axisText !== null) {
            const rotation = this.#axisText.getRotation();
            if (rotation !== null) {
                return String(rotation);
            }
        }
        return this.#axisOptions[property] as string | null;
    }

    public setAxisOptionsProperties(
        axisLabels: string,
        horizontalCrossesValue: string | null = null,
        horizontalCrosses: string | null = null,
        axisOrientation: string | null = null,
        majorTmt: string | null = null,
        minorTmt: string | null = null,
        minimum: number | string | null = null,
        maximum: number | string | null = null,
        majorUnit: number | string | null = null,
        minorUnit: number | string | null = null,
        textRotation: number | string | null = null,
        hidden: string | null = null,
        baseTimeUnit: string | null = null,
        majorTimeUnit: string | null = null,
        minorTimeUnit: string | null = null,
        logBase: number | string | null = null,
        dispUnitsBuiltIn: string | null = null,
    ): this {
        this.#axisOptions.axis_labels = axisLabels;
        this.setAxisOption('horizontal_crosses_value', horizontalCrossesValue);
        this.setAxisOption('horizontal_crosses', horizontalCrosses);
        this.setAxisOption('orientation', axisOrientation);
        this.setAxisOption('major_tick_mark', majorTmt);
        this.setAxisOption('minor_tick_mark', minorTmt);
        this.setAxisOption('minimum', minimum);
        this.setAxisOption('maximum', maximum);
        this.setAxisOption('major_unit', majorUnit);
        this.setAxisOption('minor_unit', minorUnit);
        this.setAxisOption('textRotation', textRotation);
        this.setAxisOption('hidden', hidden);
        this.setAxisOption('baseTimeUnit', baseTimeUnit);
        this.setAxisOption('majorTimeUnit', majorTimeUnit);
        this.setAxisOption('minorTimeUnit', minorTimeUnit);
        this.setAxisOption('logBase', logBase);
        this.setAxisOption('dispUnitsBuiltIn', dispUnitsBuiltIn);
        return this;
    }

    public setAxisOrientation(orientation: string): this {
        this.#axisOptions.orientation = orientation;
        return this;
    }

    // Fill Color
    public getFillColor(): ChartColor {
        return this.#fillColor;
    }

    public getFillColorObject(): ChartColor {
        return this.#fillColor;
    }

    public setFillColor(color: ChartColor): this {
        this.#fillColor = color;
        return this;
    }

    public setFillParameters(color: string | null, alpha: number | null = null, colorType: string = 'srgbClr'): this {
        this.#fillColor.setColorProperties(color, alpha, colorType as never);
        return this;
    }

    public getFillProperty(property: 'value' | 'type' | 'alpha' | 'brightness'): string | number | null {
        return this.#fillColor.getColorProperty(property);
    }

    public getNoFill(): boolean {
        return this.#noFill;
    }

    public setNoFill(noFill: boolean): this {
        this.#noFill = noFill;
        return this;
    }

    // Line Color
    public getLineColor(): ChartColor | null {
        return this.#lineColor;
    }

    public setLineColor(color: ChartColor | null): this {
        this.#lineColor = color;
        return this;
    }

    // Line Style Properties
    public getLineStyleProperties(): LineStyleProperties {
        return {
            width: this.#lineStyleProperties.width,
            compound: this.#lineStyleProperties.compound,
            dash: this.#lineStyleProperties.dash,
            cap: this.#lineStyleProperties.cap,
            join: this.#lineStyleProperties.join,
            arrow: {
                head: { ...this.#lineStyleProperties.arrow.head },
                end: { ...this.#lineStyleProperties.arrow.end },
            },
        };
    }

    public setLineStyleProperties(properties: LineStyleProperties): this {
        this.#lineStyleProperties = {
            width: properties.width,
            compound: properties.compound,
            dash: properties.dash,
            cap: properties.cap,
            join: properties.join,
            arrow: {
                head: { ...properties.arrow.head },
                end: { ...properties.arrow.end },
            },
        };
        return this;
    }

    // Gridlines
    public getMajorGridlines(): GridLines | null {
        return this.#majorGridlines;
    }

    public setMajorGridlines(gridlines: GridLines | null): this {
        this.#majorGridlines = gridlines;
        return this;
    }

    public getMinorGridlines(): GridLines | null {
        return this.#minorGridlines;
    }

    public setMinorGridlines(gridlines: GridLines | null): this {
        this.#minorGridlines = gridlines;
        return this;
    }

    // Title
    public getTitle(): Title | null {
        return this.#title;
    }

    public setTitle(title: Title | null): this {
        this.#title = title;
        return this;
    }

    // Axis Text
    public getAxisText(): AxisText | null {
        return this.#axisText;
    }

    public setAxisText(axisText: AxisText | null): this {
        this.#axisText = axisText;
        return this;
    }

    // Display Units Title
    public getDispUnitsTitle(): Title | null {
        return this.#dispUnitsTitle;
    }

    public setDispUnitsTitle(title: Title | null): this {
        this.#dispUnitsTitle = title;
        return this;
    }

    // Cross Between
    public getCrossBetween(): string {
        return this.#crossBetween;
    }

    public setCrossBetween(crossBetween: string): this {
        this.#crossBetween = crossBetween;
        return this;
    }

    // Axis Scaling Properties
    /**
     * Get the logarithmic base for the axis.
     * @returns The logarithmic base (typically 10), or null if linear scale.
     */
    public getLogBase(): number | null {
        return this.#scalingLogBase;
    }

    /**
     * Set the logarithmic base for the axis.
     * @param logBase - The logarithmic base (typically 10), or null for linear scale.
     */
    public setLogBase(logBase: number | null): this {
        this.#scalingLogBase = logBase;
        return this;
    }

    /**
     * Get the minimum axis value.
     * @returns The minimum value, or null for automatic.
     */
    public getMin(): number | null {
        return this.#scalingMin;
    }

    /**
     * Set the minimum axis value.
     * @param min - The minimum value, or null for automatic.
     */
    public setMin(min: number | null): this {
        this.#scalingMin = min;
        return this;
    }

    /**
     * Get the maximum axis value.
     * @returns The maximum value, or null for automatic.
     */
    public getMax(): number | null {
        return this.#scalingMax;
    }

    /**
     * Set the maximum axis value.
     * @param max - The maximum value, or null for automatic.
     */
    public setMax(max: number | null): this {
        this.#scalingMax = max;
        return this;
    }

    /**
     * Get the axis orientation.
     * @returns 'minMax' for normal orientation, 'maxMin' for reversed.
     */
    public getOrientation(): 'minMax' | 'maxMin' {
        return this.#scalingOrientation;
    }

    /**
     * Set the axis orientation.
     * @param orientation - 'minMax' for normal, 'maxMin' for reversed.
     */
    public setOrientation(orientation: 'minMax' | 'maxMin'): this {
        this.#scalingOrientation = orientation;
        this.#axisOptions.orientation = orientation;
        return this;
    }

    // Scaling (convenience method for axis options)
    public getScaling(): ScalingProperties {
        return {
            logBase: this.#scalingLogBase,
            min: this.#scalingMin,
            max: this.#scalingMax,
            orientation: this.#scalingOrientation,
        };
    }

    public setScaling(scaling: ScalingProperties): this {
        this.#scalingLogBase = scaling.logBase;
        this.#scalingMin = scaling.min;
        this.#scalingMax = scaling.max;
        this.#scalingOrientation = scaling.orientation;
        this.#axisOptions.orientation = scaling.orientation;
        return this;
    }

    // Clone method for deep copy
    public clone(): Axis {
        const cloned = new Axis();
        cloned.#axisType = this.#axisType;
        cloned.#axisNumber = { ...this.#axisNumber };
        cloned.#axisOptions = { ...this.#axisOptions };
        cloned.#fillColor = new ChartColor(
            this.#fillColor.getValue(),
            this.#fillColor.getAlpha(),
            this.#fillColor.getType() || undefined,
            this.#fillColor.getBrightness() || undefined,
        );
        if (this.#lineColor) {
            cloned.#lineColor = new ChartColor(
                this.#lineColor.getValue(),
                this.#lineColor.getAlpha(),
                this.#lineColor.getType() || undefined,
                this.#lineColor.getBrightness() || undefined,
            );
        }
        cloned.#lineStyleProperties = {
            width: this.#lineStyleProperties.width,
            compound: this.#lineStyleProperties.compound,
            dash: this.#lineStyleProperties.dash,
            cap: this.#lineStyleProperties.cap,
            join: this.#lineStyleProperties.join,
            arrow: {
                head: { ...this.#lineStyleProperties.arrow.head },
                end: { ...this.#lineStyleProperties.arrow.end },
            },
        };
        if (this.#majorGridlines) {
            cloned.#majorGridlines = this.#majorGridlines.clone();
        }
        if (this.#minorGridlines) {
            cloned.#minorGridlines = this.#minorGridlines.clone();
        }
        if (this.#title) {
            // Title doesn't have a clone method yet, create a simple copy
            cloned.#title = this.#title; // Shallow copy for now
        }
        if (this.#axisText) {
            cloned.#axisText = this.#axisText.clone();
        }
        if (this.#dispUnitsTitle) {
            cloned.#dispUnitsTitle = this.#dispUnitsTitle;
        }
        cloned.#crossBetween = this.#crossBetween;
        cloned.#noFill = this.#noFill;
        cloned.#scalingLogBase = this.#scalingLogBase;
        cloned.#scalingMin = this.#scalingMin;
        cloned.#scalingMax = this.#scalingMax;
        cloned.#scalingOrientation = this.#scalingOrientation;
        return cloned;
    }
}
