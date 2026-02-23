/**
 * Chart properties base class for line, glow, shadow, and soft edges.
 * Ported from PhpSpreadsheet Chart/Properties.php
 */

import { ChartColor, EXCEL_COLOR_TYPE_STANDARD, type ExcelColorType } from './chart-color.ts';

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

export const LINE_STYLE_COMPOUND_SIMPLE = 'sng';
export const LINE_STYLE_COMPOUND_DOUBLE = 'dbl';
export const LINE_STYLE_COMPOUND_THICKTHIN = 'thickThin';
export const LINE_STYLE_COMPOUND_THINTHICK = 'thinThick';
export const LINE_STYLE_COMPOUND_TRIPLE = 'tri';
export const LINE_STYLE_DASH_SOLID = 'solid';
export const LINE_STYLE_DASH_ROUND_DOT = 'sysDot';
export const LINE_STYLE_DASH_SQUARE_DOT = 'sysDash';
export const LINE_STYLE_DASH_DASH = 'dash';
export const LINE_STYLE_DASH_DASH_DOT = 'dashDot';
export const LINE_STYLE_DASH_LONG_DASH = 'lgDash';
export const LINE_STYLE_DASH_LONG_DASH_DOT = 'lgDashDot';
export const LINE_STYLE_DASH_LONG_DASH_DOT_DOT = 'lgDashDotDot';
export const LINE_STYLE_CAP_SQUARE = 'sq';
export const LINE_STYLE_CAP_ROUND = 'rnd';
export const LINE_STYLE_CAP_FLAT = 'flat';
export const LINE_STYLE_JOIN_ROUND = 'round';
export const LINE_STYLE_JOIN_MITER = 'miter';
export const LINE_STYLE_JOIN_BEVEL = 'bevel';
export const LINE_STYLE_ARROW_TYPE_NOARROW = null;
export const LINE_STYLE_ARROW_TYPE_ARROW = 'triangle';
export const LINE_STYLE_ARROW_TYPE_OPEN = 'arrow';
export const LINE_STYLE_ARROW_TYPE_STEALTH = 'stealth';
export const LINE_STYLE_ARROW_TYPE_DIAMOND = 'diamond';
export const LINE_STYLE_ARROW_TYPE_OVAL = 'oval';
export const LINE_STYLE_ARROW_SIZE_1 = 1;
export const LINE_STYLE_ARROW_SIZE_2 = 2;
export const LINE_STYLE_ARROW_SIZE_3 = 3;
export const LINE_STYLE_ARROW_SIZE_4 = 4;
export const LINE_STYLE_ARROW_SIZE_5 = 5;
export const LINE_STYLE_ARROW_SIZE_6 = 6;
export const LINE_STYLE_ARROW_SIZE_7 = 7;
export const LINE_STYLE_ARROW_SIZE_8 = 8;
export const LINE_STYLE_ARROW_SIZE_9 = 9;

export const SHADOW_PRESETS_NOSHADOW = null;
export const SHADOW_PRESETS_OUTER_BOTTTOM_RIGHT = 1;
export const SHADOW_PRESETS_OUTER_BOTTOM = 2;
export const SHADOW_PRESETS_OUTER_BOTTOM_LEFT = 3;
export const SHADOW_PRESETS_OUTER_RIGHT = 4;
export const SHADOW_PRESETS_OUTER_CENTER = 5;
export const SHADOW_PRESETS_OUTER_LEFT = 6;
export const SHADOW_PRESETS_OUTER_TOP_RIGHT = 7;
export const SHADOW_PRESETS_OUTER_TOP = 8;
export const SHADOW_PRESETS_OUTER_TOP_LEFT = 9;
export const SHADOW_PRESETS_INNER_BOTTTOM_RIGHT = 10;
export const SHADOW_PRESETS_INNER_BOTTOM = 11;
export const SHADOW_PRESETS_INNER_BOTTOM_LEFT = 12;
export const SHADOW_PRESETS_INNER_RIGHT = 13;
export const SHADOW_PRESETS_INNER_CENTER = 14;
export const SHADOW_PRESETS_INNER_LEFT = 15;
export const SHADOW_PRESETS_INNER_TOP_RIGHT = 16;
export const SHADOW_PRESETS_INNER_TOP = 17;
export const SHADOW_PRESETS_INNER_TOP_LEFT = 18;
export const SHADOW_PRESETS_PERSPECTIVE_BELOW = 19;
export const SHADOW_PRESETS_PERSPECTIVE_UPPER_RIGHT = 20;
export const SHADOW_PRESETS_PERSPECTIVE_UPPER_LEFT = 21;
export const SHADOW_PRESETS_PERSPECTIVE_LOWER_RIGHT = 22;
export const SHADOW_PRESETS_PERSPECTIVE_LOWER_LEFT = 23;

export const POINTS_WIDTH_MULTIPLIER = 12700;
export const ANGLE_MULTIPLIER = 60000;
export const PERCENTAGE_MULTIPLIER = 100000;
export const MAX_SKEW_ANGLE_XML = 90 * ANGLE_MULTIPLIER - 1;
export const MAX_SKEW_ANGLE_DEGREES = MAX_SKEW_ANGLE_XML / ANGLE_MULTIPLIER;

export interface ShadowSizeProperties {
    sx: number | null;
    sy: number | null;
    kx: number | null;
    ky: number | null;
}

export interface ShadowProperties {
    presets: number | null;
    effect: string | null;
    size: ShadowSizeProperties;
    blur: number | null;
    direction: number | null;
    distance: number | null;
    algn: string | null;
    rotWithShape: string | null;
}

export interface LineStyleArrowProperties {
    type: string;
    size: number | string;
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
        head: LineStyleArrowProperties;
        end: LineStyleArrowProperties;
    };
}

interface ColorPropertiesInput {
    value?: string | null;
    alpha?: number | string | null;
    brightness?: number | string | null;
    type?: ExcelColorType | string | null;
}

interface ColorPropertiesOutput {
    value: string | null;
    type: string | null;
    alpha: number | null;
}

/**
 * Properties - base class for chart element styling.
 */
export class Properties {
    public static readonly AXIS_LABELS_LOW = AXIS_LABELS_LOW;
    public static readonly AXIS_LABELS_HIGH = AXIS_LABELS_HIGH;
    public static readonly AXIS_LABELS_NEXT_TO = AXIS_LABELS_NEXT_TO;
    public static readonly AXIS_LABELS_NONE = AXIS_LABELS_NONE;

    public static readonly TICK_MARK_NONE = TICK_MARK_NONE;
    public static readonly TICK_MARK_INSIDE = TICK_MARK_INSIDE;
    public static readonly TICK_MARK_OUTSIDE = TICK_MARK_OUTSIDE;
    public static readonly TICK_MARK_CROSS = TICK_MARK_CROSS;

    public static readonly HORIZONTAL_CROSSES_AUTOZERO = HORIZONTAL_CROSSES_AUTOZERO;
    public static readonly HORIZONTAL_CROSSES_MAXIMUM = HORIZONTAL_CROSSES_MAXIMUM;

    public static readonly FORMAT_CODE_GENERAL = FORMAT_CODE_GENERAL;
    public static readonly FORMAT_CODE_NUMBER = FORMAT_CODE_NUMBER;
    public static readonly FORMAT_CODE_CURRENCY = FORMAT_CODE_CURRENCY;
    public static readonly FORMAT_CODE_ACCOUNTING = FORMAT_CODE_ACCOUNTING;
    public static readonly FORMAT_CODE_DATE = FORMAT_CODE_DATE;
    public static readonly FORMAT_CODE_DATE_ISO8601 = FORMAT_CODE_DATE_ISO8601;
    public static readonly FORMAT_CODE_TIME = FORMAT_CODE_TIME;
    public static readonly FORMAT_CODE_PERCENTAGE = FORMAT_CODE_PERCENTAGE;
    public static readonly FORMAT_CODE_FRACTION = FORMAT_CODE_FRACTION;
    public static readonly FORMAT_CODE_SCIENTIFIC = FORMAT_CODE_SCIENTIFIC;
    public static readonly FORMAT_CODE_TEXT = FORMAT_CODE_TEXT;
    public static readonly FORMAT_CODE_SPECIAL = FORMAT_CODE_SPECIAL;

    public static readonly ORIENTATION_NORMAL = ORIENTATION_NORMAL;
    public static readonly ORIENTATION_REVERSED = ORIENTATION_REVERSED;

    public static readonly LINE_STYLE_COMPOUND_SIMPLE = LINE_STYLE_COMPOUND_SIMPLE;
    public static readonly LINE_STYLE_COMPOUND_DOUBLE = LINE_STYLE_COMPOUND_DOUBLE;
    public static readonly LINE_STYLE_COMPOUND_THICKTHIN = LINE_STYLE_COMPOUND_THICKTHIN;
    public static readonly LINE_STYLE_COMPOUND_THINTHICK = LINE_STYLE_COMPOUND_THINTHICK;
    public static readonly LINE_STYLE_COMPOUND_TRIPLE = LINE_STYLE_COMPOUND_TRIPLE;
    public static readonly LINE_STYLE_DASH_SOLID = LINE_STYLE_DASH_SOLID;
    public static readonly LINE_STYLE_DASH_ROUND_DOT = LINE_STYLE_DASH_ROUND_DOT;
    public static readonly LINE_STYLE_DASH_SQUARE_DOT = LINE_STYLE_DASH_SQUARE_DOT;
    public static readonly LINE_STYLE_DASH_DASH = LINE_STYLE_DASH_DASH;
    public static readonly LINE_STYLE_DASH_DASH_DOT = LINE_STYLE_DASH_DASH_DOT;
    public static readonly LINE_STYLE_DASH_LONG_DASH = LINE_STYLE_DASH_LONG_DASH;
    public static readonly LINE_STYLE_DASH_LONG_DASH_DOT = LINE_STYLE_DASH_LONG_DASH_DOT;
    public static readonly LINE_STYLE_DASH_LONG_DASH_DOT_DOT = LINE_STYLE_DASH_LONG_DASH_DOT_DOT;
    public static readonly LINE_STYLE_CAP_SQUARE = LINE_STYLE_CAP_SQUARE;
    public static readonly LINE_STYLE_CAP_ROUND = LINE_STYLE_CAP_ROUND;
    public static readonly LINE_STYLE_CAP_FLAT = LINE_STYLE_CAP_FLAT;
    public static readonly LINE_STYLE_JOIN_ROUND = LINE_STYLE_JOIN_ROUND;
    public static readonly LINE_STYLE_JOIN_MITER = LINE_STYLE_JOIN_MITER;
    public static readonly LINE_STYLE_JOIN_BEVEL = LINE_STYLE_JOIN_BEVEL;
    public static readonly LINE_STYLE_ARROW_TYPE_NOARROW = LINE_STYLE_ARROW_TYPE_NOARROW;
    public static readonly LINE_STYLE_ARROW_TYPE_ARROW = LINE_STYLE_ARROW_TYPE_ARROW;
    public static readonly LINE_STYLE_ARROW_TYPE_OPEN = LINE_STYLE_ARROW_TYPE_OPEN;
    public static readonly LINE_STYLE_ARROW_TYPE_STEALTH = LINE_STYLE_ARROW_TYPE_STEALTH;
    public static readonly LINE_STYLE_ARROW_TYPE_DIAMOND = LINE_STYLE_ARROW_TYPE_DIAMOND;
    public static readonly LINE_STYLE_ARROW_TYPE_OVAL = LINE_STYLE_ARROW_TYPE_OVAL;
    public static readonly LINE_STYLE_ARROW_SIZE_1 = LINE_STYLE_ARROW_SIZE_1;
    public static readonly LINE_STYLE_ARROW_SIZE_2 = LINE_STYLE_ARROW_SIZE_2;
    public static readonly LINE_STYLE_ARROW_SIZE_3 = LINE_STYLE_ARROW_SIZE_3;
    public static readonly LINE_STYLE_ARROW_SIZE_4 = LINE_STYLE_ARROW_SIZE_4;
    public static readonly LINE_STYLE_ARROW_SIZE_5 = LINE_STYLE_ARROW_SIZE_5;
    public static readonly LINE_STYLE_ARROW_SIZE_6 = LINE_STYLE_ARROW_SIZE_6;
    public static readonly LINE_STYLE_ARROW_SIZE_7 = LINE_STYLE_ARROW_SIZE_7;
    public static readonly LINE_STYLE_ARROW_SIZE_8 = LINE_STYLE_ARROW_SIZE_8;
    public static readonly LINE_STYLE_ARROW_SIZE_9 = LINE_STYLE_ARROW_SIZE_9;

    public static readonly SHADOW_PRESETS_NOSHADOW = SHADOW_PRESETS_NOSHADOW;
    public static readonly SHADOW_PRESETS_OUTER_BOTTTOM_RIGHT = SHADOW_PRESETS_OUTER_BOTTTOM_RIGHT;
    public static readonly SHADOW_PRESETS_OUTER_BOTTOM = SHADOW_PRESETS_OUTER_BOTTOM;
    public static readonly SHADOW_PRESETS_OUTER_BOTTOM_LEFT = SHADOW_PRESETS_OUTER_BOTTOM_LEFT;
    public static readonly SHADOW_PRESETS_OUTER_RIGHT = SHADOW_PRESETS_OUTER_RIGHT;
    public static readonly SHADOW_PRESETS_OUTER_CENTER = SHADOW_PRESETS_OUTER_CENTER;
    public static readonly SHADOW_PRESETS_OUTER_LEFT = SHADOW_PRESETS_OUTER_LEFT;
    public static readonly SHADOW_PRESETS_OUTER_TOP_RIGHT = SHADOW_PRESETS_OUTER_TOP_RIGHT;
    public static readonly SHADOW_PRESETS_OUTER_TOP = SHADOW_PRESETS_OUTER_TOP;
    public static readonly SHADOW_PRESETS_OUTER_TOP_LEFT = SHADOW_PRESETS_OUTER_TOP_LEFT;
    public static readonly SHADOW_PRESETS_INNER_BOTTTOM_RIGHT = SHADOW_PRESETS_INNER_BOTTTOM_RIGHT;
    public static readonly SHADOW_PRESETS_INNER_BOTTOM = SHADOW_PRESETS_INNER_BOTTOM;
    public static readonly SHADOW_PRESETS_INNER_BOTTOM_LEFT = SHADOW_PRESETS_INNER_BOTTOM_LEFT;
    public static readonly SHADOW_PRESETS_INNER_RIGHT = SHADOW_PRESETS_INNER_RIGHT;
    public static readonly SHADOW_PRESETS_INNER_CENTER = SHADOW_PRESETS_INNER_CENTER;
    public static readonly SHADOW_PRESETS_INNER_LEFT = SHADOW_PRESETS_INNER_LEFT;
    public static readonly SHADOW_PRESETS_INNER_TOP_RIGHT = SHADOW_PRESETS_INNER_TOP_RIGHT;
    public static readonly SHADOW_PRESETS_INNER_TOP = SHADOW_PRESETS_INNER_TOP;
    public static readonly SHADOW_PRESETS_INNER_TOP_LEFT = SHADOW_PRESETS_INNER_TOP_LEFT;
    public static readonly SHADOW_PRESETS_PERSPECTIVE_BELOW = SHADOW_PRESETS_PERSPECTIVE_BELOW;
    public static readonly SHADOW_PRESETS_PERSPECTIVE_UPPER_RIGHT = SHADOW_PRESETS_PERSPECTIVE_UPPER_RIGHT;
    public static readonly SHADOW_PRESETS_PERSPECTIVE_UPPER_LEFT = SHADOW_PRESETS_PERSPECTIVE_UPPER_LEFT;
    public static readonly SHADOW_PRESETS_PERSPECTIVE_LOWER_RIGHT = SHADOW_PRESETS_PERSPECTIVE_LOWER_RIGHT;
    public static readonly SHADOW_PRESETS_PERSPECTIVE_LOWER_LEFT = SHADOW_PRESETS_PERSPECTIVE_LOWER_LEFT;

    public static readonly POINTS_WIDTH_MULTIPLIER = POINTS_WIDTH_MULTIPLIER;
    public static readonly ANGLE_MULTIPLIER = ANGLE_MULTIPLIER;
    public static readonly PERCENTAGE_MULTIPLIER = PERCENTAGE_MULTIPLIER;
    public static readonly MAX_SKEW_ANGLE_XML = MAX_SKEW_ANGLE_XML;
    public static readonly MAX_SKEW_ANGLE_DEGREES = MAX_SKEW_ANGLE_DEGREES;

    #objectState = false;
    #glowSize: number | null = null;
    #glowColor: ChartColor;
    #softEdges: { size: number | null } = { size: null };
    #shadowProperties: ShadowProperties;
    #shadowColor: ChartColor;
    #lineColor: ChartColor;
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

    private static readonly PRESETS_OPTIONS: Record<number, ShadowProperties> = {
        0: {
            presets: SHADOW_PRESETS_NOSHADOW,
            effect: null,
            size: { sx: null, sy: null, kx: null, ky: null },
            blur: null,
            direction: null,
            distance: null,
            algn: null,
            rotWithShape: null,
        },
        1: {
            presets: null,
            effect: 'outerShdw',
            size: { sx: null, sy: null, kx: null, ky: null },
            blur: 50800 / POINTS_WIDTH_MULTIPLIER,
            direction: 2700000 / ANGLE_MULTIPLIER,
            distance: 38100 / POINTS_WIDTH_MULTIPLIER,
            algn: 'tl',
            rotWithShape: '0',
        },
        2: {
            presets: null,
            effect: 'outerShdw',
            size: { sx: null, sy: null, kx: null, ky: null },
            blur: 50800 / POINTS_WIDTH_MULTIPLIER,
            direction: 5400000 / ANGLE_MULTIPLIER,
            distance: 38100 / POINTS_WIDTH_MULTIPLIER,
            algn: 't',
            rotWithShape: '0',
        },
        3: {
            presets: null,
            effect: 'outerShdw',
            size: { sx: null, sy: null, kx: null, ky: null },
            blur: 50800 / POINTS_WIDTH_MULTIPLIER,
            direction: 8100000 / ANGLE_MULTIPLIER,
            distance: 38100 / POINTS_WIDTH_MULTIPLIER,
            algn: 'tr',
            rotWithShape: '0',
        },
        4: {
            presets: null,
            effect: 'outerShdw',
            size: { sx: null, sy: null, kx: null, ky: null },
            blur: 50800 / POINTS_WIDTH_MULTIPLIER,
            direction: null,
            distance: 38100 / POINTS_WIDTH_MULTIPLIER,
            algn: 'l',
            rotWithShape: '0',
        },
        5: {
            presets: null,
            effect: 'outerShdw',
            size: { sx: 102000 / PERCENTAGE_MULTIPLIER, sy: 102000 / PERCENTAGE_MULTIPLIER, kx: null, ky: null },
            blur: 63500 / POINTS_WIDTH_MULTIPLIER,
            direction: null,
            distance: 38100 / POINTS_WIDTH_MULTIPLIER,
            algn: 'ctr',
            rotWithShape: '0',
        },
        6: {
            presets: null,
            effect: 'outerShdw',
            size: { sx: null, sy: null, kx: null, ky: null },
            blur: 50800 / POINTS_WIDTH_MULTIPLIER,
            direction: 10800000 / ANGLE_MULTIPLIER,
            distance: 38100 / POINTS_WIDTH_MULTIPLIER,
            algn: 'r',
            rotWithShape: '0',
        },
        7: {
            presets: null,
            effect: 'outerShdw',
            size: { sx: null, sy: null, kx: null, ky: null },
            blur: 50800 / POINTS_WIDTH_MULTIPLIER,
            direction: 18900000 / ANGLE_MULTIPLIER,
            distance: 38100 / POINTS_WIDTH_MULTIPLIER,
            algn: 'bl',
            rotWithShape: '0',
        },
        8: {
            presets: null,
            effect: 'outerShdw',
            size: { sx: null, sy: null, kx: null, ky: null },
            blur: 50800 / POINTS_WIDTH_MULTIPLIER,
            direction: 16200000 / ANGLE_MULTIPLIER,
            distance: 38100 / POINTS_WIDTH_MULTIPLIER,
            algn: null,
            rotWithShape: '0',
        },
        9: {
            presets: null,
            effect: 'outerShdw',
            size: { sx: null, sy: null, kx: null, ky: null },
            blur: 50800 / POINTS_WIDTH_MULTIPLIER,
            direction: 13500000 / ANGLE_MULTIPLIER,
            distance: 38100 / POINTS_WIDTH_MULTIPLIER,
            algn: 'br',
            rotWithShape: '0',
        },
        10: {
            presets: null,
            effect: 'innerShdw',
            size: { sx: null, sy: null, kx: null, ky: null },
            blur: 63500 / POINTS_WIDTH_MULTIPLIER,
            direction: 2700000 / ANGLE_MULTIPLIER,
            distance: 50800 / POINTS_WIDTH_MULTIPLIER,
            algn: null,
            rotWithShape: null,
        },
        11: {
            presets: null,
            effect: 'innerShdw',
            size: { sx: null, sy: null, kx: null, ky: null },
            blur: 63500 / POINTS_WIDTH_MULTIPLIER,
            direction: 5400000 / ANGLE_MULTIPLIER,
            distance: 50800 / POINTS_WIDTH_MULTIPLIER,
            algn: null,
            rotWithShape: null,
        },
        12: {
            presets: null,
            effect: 'innerShdw',
            size: { sx: null, sy: null, kx: null, ky: null },
            blur: 63500 / POINTS_WIDTH_MULTIPLIER,
            direction: 8100000 / ANGLE_MULTIPLIER,
            distance: 50800 / POINTS_WIDTH_MULTIPLIER,
            algn: null,
            rotWithShape: null,
        },
        13: {
            presets: null,
            effect: 'innerShdw',
            size: { sx: null, sy: null, kx: null, ky: null },
            blur: 63500 / POINTS_WIDTH_MULTIPLIER,
            direction: null,
            distance: 50800 / POINTS_WIDTH_MULTIPLIER,
            algn: null,
            rotWithShape: null,
        },
        14: {
            presets: null,
            effect: 'innerShdw',
            size: { sx: null, sy: null, kx: null, ky: null },
            blur: 114300 / POINTS_WIDTH_MULTIPLIER,
            direction: null,
            distance: null,
            algn: null,
            rotWithShape: null,
        },
        15: {
            presets: null,
            effect: 'innerShdw',
            size: { sx: null, sy: null, kx: null, ky: null },
            blur: 63500 / POINTS_WIDTH_MULTIPLIER,
            direction: 10800000 / ANGLE_MULTIPLIER,
            distance: 50800 / POINTS_WIDTH_MULTIPLIER,
            algn: null,
            rotWithShape: null,
        },
        16: {
            presets: null,
            effect: 'innerShdw',
            size: { sx: null, sy: null, kx: null, ky: null },
            blur: 63500 / POINTS_WIDTH_MULTIPLIER,
            direction: 18900000 / ANGLE_MULTIPLIER,
            distance: 50800 / POINTS_WIDTH_MULTIPLIER,
            algn: null,
            rotWithShape: null,
        },
        17: {
            presets: null,
            effect: 'innerShdw',
            size: { sx: null, sy: null, kx: null, ky: null },
            blur: 63500 / POINTS_WIDTH_MULTIPLIER,
            direction: 16200000 / ANGLE_MULTIPLIER,
            distance: 50800 / POINTS_WIDTH_MULTIPLIER,
            algn: null,
            rotWithShape: null,
        },
        18: {
            presets: null,
            effect: 'innerShdw',
            size: { sx: null, sy: null, kx: null, ky: null },
            blur: 63500 / POINTS_WIDTH_MULTIPLIER,
            direction: 13500000 / ANGLE_MULTIPLIER,
            distance: 50800 / POINTS_WIDTH_MULTIPLIER,
            algn: null,
            rotWithShape: null,
        },
        19: {
            presets: null,
            effect: 'outerShdw',
            size: { sx: 90000 / PERCENTAGE_MULTIPLIER, sy: -19000 / PERCENTAGE_MULTIPLIER, kx: null, ky: null },
            blur: 152400 / POINTS_WIDTH_MULTIPLIER,
            direction: 5400000 / ANGLE_MULTIPLIER,
            distance: 317500 / POINTS_WIDTH_MULTIPLIER,
            algn: null,
            rotWithShape: '0',
        },
        20: {
            presets: null,
            effect: 'outerShdw',
            size: { sx: null, sy: 23000 / PERCENTAGE_MULTIPLIER, kx: -1200000 / ANGLE_MULTIPLIER, ky: null },
            blur: 76200 / POINTS_WIDTH_MULTIPLIER,
            direction: 18900000 / ANGLE_MULTIPLIER,
            distance: null,
            algn: 'bl',
            rotWithShape: '0',
        },
        21: {
            presets: null,
            effect: 'outerShdw',
            size: { sx: null, sy: 23000 / PERCENTAGE_MULTIPLIER, kx: 1200000 / ANGLE_MULTIPLIER, ky: null },
            blur: 76200 / POINTS_WIDTH_MULTIPLIER,
            direction: 13500000 / ANGLE_MULTIPLIER,
            distance: null,
            algn: 'br',
            rotWithShape: '0',
        },
        22: {
            presets: null,
            effect: 'outerShdw',
            size: { sx: null, sy: -23000 / PERCENTAGE_MULTIPLIER, kx: -800400 / ANGLE_MULTIPLIER, ky: null },
            blur: 76200 / POINTS_WIDTH_MULTIPLIER,
            direction: 2700000 / ANGLE_MULTIPLIER,
            distance: 12700 / POINTS_WIDTH_MULTIPLIER,
            algn: 'bl',
            rotWithShape: '0',
        },
        23: {
            presets: null,
            effect: 'outerShdw',
            size: { sx: null, sy: -23000 / PERCENTAGE_MULTIPLIER, kx: 800400 / ANGLE_MULTIPLIER, ky: null },
            blur: 76200 / POINTS_WIDTH_MULTIPLIER,
            direction: 8100000 / ANGLE_MULTIPLIER,
            distance: 12700 / POINTS_WIDTH_MULTIPLIER,
            algn: 'br',
            rotWithShape: '0',
        },
    };

    private static readonly SHADOW_ARRAY_KEYS = ['size', 'color'] as const;

    private static readonly ARROW_SIZES: Record<number, { w: string; len: string }> = {
        1: { w: 'sm', len: 'sm' },
        2: { w: 'sm', len: 'med' },
        3: { w: 'sm', len: 'lg' },
        4: { w: 'med', len: 'sm' },
        5: { w: 'med', len: 'med' },
        6: { w: 'med', len: 'lg' },
        7: { w: 'lg', len: 'sm' },
        8: { w: 'lg', len: 'med' },
        9: { w: 'lg', len: 'lg' },
    };

    /**
     * Create a new Properties instance.
     */
    constructor() {
        this.#lineColor = new ChartColor();
        this.#glowColor = new ChartColor();
        this.#shadowColor = new ChartColor();
        this.#shadowColor.setType(EXCEL_COLOR_TYPE_STANDARD);
        this.#shadowColor.setValue('black');
        this.#shadowColor.setAlpha(40);
        this.#shadowProperties = Properties.cloneShadowProperties(Properties.PRESETS_OPTIONS[0]!);
    }

    /**
     * Get object state.
     */
    public getObjectState(): boolean {
        return this.#objectState;
    }

    /**
     * Activate this object.
     */
    public activateObject(): this {
        this.#objectState = true;
        return this;
    }

    /**
     * Convert points to XML value.
     */
    public static pointsToXml(width: number): string {
        return String(Math.trunc(width * POINTS_WIDTH_MULTIPLIER));
    }

    /**
     * Convert XML to points value.
     */
    public static xmlToPoints(width: string): number {
        return Number(width) / POINTS_WIDTH_MULTIPLIER;
    }

    /**
     * Convert angle to XML value.
     */
    public static angleToXml(angle: number): string {
        return String(Math.trunc(angle * ANGLE_MULTIPLIER));
    }

    /**
     * Convert XML to angle value.
     */
    public static xmlToAngle(angle: string): number {
        return Number(angle) / ANGLE_MULTIPLIER;
    }

    /**
     * Convert tenth of percent to XML value.
     */
    public static tenthOfPercentToXml(value: number): string {
        return String(Math.trunc(value * PERCENTAGE_MULTIPLIER));
    }

    /**
     * Convert XML to tenth of percent value.
     */
    public static xmlToTenthOfPercent(value: string): number {
        return Number(value) / PERCENTAGE_MULTIPLIER;
    }

    /**
     * Set glow properties.
     */
    public setGlowProperties(
        size: number,
        colorValue: string | null = null,
        colorAlpha: number | null = null,
        colorType: string | null = null,
    ): void {
        this.activateObject().setGlowSize(size);
        this.#glowColor.setColorProperties(colorValue, colorAlpha, colorType as ExcelColorType | null);
    }

    /**
     * Get glow property.
     */
    public getGlowProperty(property: string | string[]): null | Record<string, unknown> | number | string {
        if (property === 'size') {
            return this.#glowSize;
        }
        if (property === 'color') {
            return {
                value: this.#glowColor.getColorProperty('value'),
                type: this.#glowColor.getColorProperty('type'),
                alpha: this.#glowColor.getColorProperty('alpha'),
            };
        }
        if (Array.isArray(property) && property.length >= 2 && property[0] === 'color') {
            return this.#glowColor.getColorProperty(property[1] as 'value' | 'type' | 'alpha' | 'brightness');
        }
        return null;
    }

    /**
     * Get glow color property by name.
     */
    public getGlowColor(propertyName: 'value' | 'type' | 'alpha' | 'brightness' | 'lastClr'): string | number | null {
        return this.#glowColor.getColorProperty(propertyName);
    }

    /**
     * Get glow color object.
     */
    public getGlowColorObject(): ChartColor {
        return this.#glowColor;
    }

    /**
     * Get glow size.
     */
    public getGlowSize(): number | null {
        return this.#glowSize;
    }

    /**
     * Set soft edges size.
     */
    public setSoftEdges(size: number | null): void {
        if (size !== null) {
            this.activateObject();
            this.#softEdges.size = size;
        }
    }

    /**
     * Get soft edges size.
     */
    public getSoftEdgesSize(): number | null {
        return this.#softEdges.size;
    }

    /**
     * Set shadow property.
     */
    public setShadowProperty(propertyName: string, value: ColorPropertiesInput | number | string | null): this {
        this.activateObject();
        if (propertyName === 'color' && value !== null && typeof value === 'object') {
            const colorValue = value as ColorPropertiesInput;
            this.#shadowColor.setColorProperties(
                colorValue.value ?? null,
                colorValue.alpha ?? null,
                (colorValue.type ?? null) as ExcelColorType | null,
                colorValue.brightness ?? null,
            );
        } else {
            (this.#shadowProperties as unknown as Record<string, unknown>)[propertyName] = value;
        }
        return this;
    }

    /**
     * Set shadow properties.
     */
    public setShadowProperties(
        presets: number,
        colorValue: string | null = null,
        colorType: string | null = null,
        colorAlpha: number | string | null = null,
        blur: number | null = null,
        angle: number | string | null = null,
        distance: number | null = null,
    ): void {
        this.activateObject().setShadowPresetsProperties(presets);
        if (presets === 0) {
            this.#shadowColor.setType(EXCEL_COLOR_TYPE_STANDARD);
            this.#shadowColor.setValue('black');
            this.#shadowColor.setAlpha(40);
        }
        if (colorValue !== null) {
            this.#shadowColor.setValue(colorValue);
        }
        if (colorType !== null) {
            this.#shadowColor.setType(colorType as ExcelColorType);
        }
        if (Properties.isNumeric(colorAlpha)) {
            this.#shadowColor.setAlpha(Number(colorAlpha));
        }
        this.setShadowBlur(blur).setShadowAngle(angle).setShadowDistance(distance);
    }

    /**
     * Get shadow color object.
     */
    public getShadowColorObject(): ChartColor {
        return this.#shadowColor;
    }

    /**
     * Get shadow property.
     */
    public getShadowProperty(elements: string | Array<string | number>): Record<string, unknown> | string | null {
        if (elements === 'color') {
            return {
                value: this.#shadowColor.getValue(),
                type: this.#shadowColor.getType(),
                alpha: this.#shadowColor.getAlpha(),
            };
        }
        const retVal = this.getArrayElementsValue(
            this.#shadowProperties as unknown as Record<string, unknown>,
            elements,
        );
        if (typeof retVal === 'string' || typeof retVal === 'number' || typeof retVal === 'boolean') {
            return String(retVal);
        }
        if (retVal !== null && retVal !== undefined && typeof retVal !== 'object') {
            throw new Error('Unexpected value for shadowProperty');
        }
        return (retVal as Record<string, unknown> | null) ?? null;
    }

    /**
     * Get shadow array.
     */
    public getShadowArray(): Record<string, unknown> {
        const array = Properties.cloneShadowProperties(this.#shadowProperties);
        const result: Record<string, unknown> = {
            presets: array.presets,
            effect: array.effect,
            size: { ...array.size },
            blur: array.blur,
            direction: array.direction,
            distance: array.distance,
            algn: array.algn,
            rotWithShape: array.rotWithShape,
        };
        if (this.getShadowColorObject().isUsable()) {
            result.color = this.getShadowProperty('color');
        }
        return result;
    }

    /**
     * Copy line and effect styles from another Properties instance.
     */
    public copyLineStyles(otherProperties: Properties): void {
        this.#lineStyleProperties = otherProperties.#lineStyleProperties;
        this.#lineColor = otherProperties.#lineColor;
        this.#glowSize = otherProperties.#glowSize;
        this.#glowColor = otherProperties.#glowColor;
        this.#softEdges = otherProperties.#softEdges;
        this.#shadowProperties = otherProperties.#shadowProperties;
    }

    /**
     * Get line color.
     */
    public getLineColor(): ChartColor {
        return this.#lineColor;
    }

    /**
     * Set line color properties.
     */
    public setLineColorProperties(
        value: string | null,
        alpha: number | null = null,
        colorType: string | null = null,
    ): void {
        this.activateObject();
        this.#lineColor.setColorProperties(value, alpha, colorType as ExcelColorType | null);
    }

    /**
     * Get line color property.
     */
    public getLineColorProperty(
        propertyName: 'value' | 'type' | 'alpha' | 'brightness' | 'lastClr',
    ): string | number | null {
        return this.#lineColor.getColorProperty(propertyName);
    }

    /**
     * Set line style properties.
     */
    public setLineStyleProperties(
        lineWidth: number | string | null = null,
        compoundType: string | null = '',
        dashType: string | null = '',
        capType: string | null = '',
        joinType: string | null = '',
        headArrowType: string | null = '',
        headArrowSize: number = 0,
        endArrowType: string | null = '',
        endArrowSize: number = 0,
        headArrowWidth: string | null = '',
        headArrowLength: string | null = '',
        endArrowWidth: string | null = '',
        endArrowLength: string | null = '',
    ): void {
        this.activateObject();
        if (Properties.isNumeric(lineWidth)) {
            this.#lineStyleProperties.width = lineWidth;
        }
        if (compoundType !== '') {
            this.#lineStyleProperties.compound = compoundType ?? '';
        }
        if (dashType !== '') {
            this.#lineStyleProperties.dash = dashType ?? '';
        }
        if (capType !== '') {
            this.#lineStyleProperties.cap = capType ?? '';
        }
        if (joinType !== '') {
            this.#lineStyleProperties.join = joinType ?? '';
        }
        if (headArrowType !== '') {
            this.#lineStyleProperties.arrow.head.type = headArrowType ?? '';
        }
        if (Properties.ARROW_SIZES[headArrowSize]) {
            const headSizes = Properties.ARROW_SIZES[headArrowSize];
            this.#lineStyleProperties.arrow.head.size = headArrowSize;
            this.#lineStyleProperties.arrow.head.w = headSizes.w;
            this.#lineStyleProperties.arrow.head.len = headSizes.len;
        }
        if (endArrowType !== '') {
            this.#lineStyleProperties.arrow.end.type = endArrowType ?? '';
        }
        if (Properties.ARROW_SIZES[endArrowSize]) {
            const endSizes = Properties.ARROW_SIZES[endArrowSize];
            this.#lineStyleProperties.arrow.end.size = endArrowSize;
            this.#lineStyleProperties.arrow.end.w = endSizes.w;
            this.#lineStyleProperties.arrow.end.len = endSizes.len;
        }
        if (headArrowWidth !== '') {
            this.#lineStyleProperties.arrow.head.w = headArrowWidth ?? '';
        }
        if (headArrowLength !== '') {
            this.#lineStyleProperties.arrow.head.len = headArrowLength ?? '';
        }
        if (endArrowWidth !== '') {
            this.#lineStyleProperties.arrow.end.w = endArrowWidth ?? '';
        }
        if (endArrowLength !== '') {
            this.#lineStyleProperties.arrow.end.len = endArrowLength ?? '';
        }
    }

    /**
     * Get line style array.
     */
    public getLineStyleArray(): LineStyleProperties {
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

    /**
     * Set line style array.
     */
    public setLineStyleArray(lineStyleProperties: Partial<LineStyleProperties> = {}): this {
        this.activateObject();
        this.#lineStyleProperties.width = lineStyleProperties.width ?? null;
        this.#lineStyleProperties.compound = lineStyleProperties.compound ?? '';
        this.#lineStyleProperties.dash = lineStyleProperties.dash ?? '';
        this.#lineStyleProperties.cap = lineStyleProperties.cap ?? '';
        this.#lineStyleProperties.join = lineStyleProperties.join ?? '';
        this.#lineStyleProperties.arrow.head.type = lineStyleProperties.arrow?.head?.type ?? '';
        this.#lineStyleProperties.arrow.head.size = lineStyleProperties.arrow?.head?.size ?? '';
        this.#lineStyleProperties.arrow.head.w = lineStyleProperties.arrow?.head?.w ?? '';
        this.#lineStyleProperties.arrow.head.len = lineStyleProperties.arrow?.head?.len ?? '';
        this.#lineStyleProperties.arrow.end.type = lineStyleProperties.arrow?.end?.type ?? '';
        this.#lineStyleProperties.arrow.end.size = lineStyleProperties.arrow?.end?.size ?? '';
        this.#lineStyleProperties.arrow.end.w = lineStyleProperties.arrow?.end?.w ?? '';
        this.#lineStyleProperties.arrow.end.len = lineStyleProperties.arrow?.end?.len ?? '';
        return this;
    }

    /**
     * Set line style property.
     */
    public setLineStyleProperty(propertyName: string, value: unknown): this {
        this.activateObject();
        (this.#lineStyleProperties as unknown as Record<string, unknown>)[propertyName] = value;
        return this;
    }

    /**
     * Get line style property.
     */
    public getLineStyleProperty(elements: string | Array<string | number>): string | null {
        const retVal = this.getArrayElementsValue(
            this.#lineStyleProperties as unknown as Record<string, unknown>,
            elements,
        );
        if (typeof retVal === 'string' || typeof retVal === 'number' || typeof retVal === 'boolean') {
            return String(retVal);
        }
        if (retVal !== null && retVal !== undefined) {
            throw new Error('Unexpected value for lineStyleProperty');
        }
        return null;
    }

    /**
     * Get line style arrow parameters.
     */
    public getLineStyleArrowParameters(arrowSelector: 'head' | 'end', propertySelector: 'w' | 'len'): string {
        const size = Number(this.#lineStyleProperties.arrow[arrowSelector].size) || 0;
        return this.getLineStyleArrowSize(size, propertySelector);
    }

    /**
     * Get line style arrow width.
     */
    public getLineStyleArrowWidth(arrow: 'head' | 'end'): string | null {
        return this.getLineStyleProperty(['arrow', arrow, 'w']);
    }

    /**
     * Get line style arrow length.
     */
    public getLineStyleArrowLength(arrow: 'head' | 'end'): string | null {
        return this.getLineStyleProperty(['arrow', arrow, 'len']);
    }

    /**
     * Clone this Properties instance.
     */
    public clone(): Properties {
        const cloned = new Properties();
        cloned.#objectState = this.#objectState;
        cloned.#glowSize = this.#glowSize;
        cloned.#glowColor = Properties.cloneChartColor(this.#glowColor);
        cloned.#softEdges = { ...this.#softEdges };
        cloned.#shadowProperties = Properties.cloneShadowProperties(this.#shadowProperties);
        cloned.#shadowColor = Properties.cloneChartColor(this.#shadowColor);
        cloned.#lineColor = Properties.cloneChartColor(this.#lineColor);
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
        return cloned;
    }

    /**
     * Get shadow presets map for a preset index.
     */
    protected getShadowPresetsMap(presetsOption: number): ShadowProperties {
        return Properties.cloneShadowProperties(
            Properties.PRESETS_OPTIONS[presetsOption] ?? Properties.PRESETS_OPTIONS[0]!,
        );
    }

    /**
     * Get nested array element value.
     */
    protected getArrayElementsValue(
        properties: Record<string, unknown>,
        elements: string | number | Array<string | number>,
    ): unknown {
        let reference: unknown = properties;
        if (!Array.isArray(elements)) {
            if (reference && typeof reference === 'object') {
                return (reference as Record<string, unknown>)[String(elements)];
            }
            return undefined;
        }
        for (const key of elements) {
            if (reference && typeof reference === 'object') {
                reference = (reference as Record<string, unknown>)[String(key)];
            } else {
                return undefined;
            }
        }
        return reference;
    }

    /**
     * Set color properties helper.
     */
    protected setColorProperties(
        color: string | null,
        alpha: number | string | null,
        colorType: string | null,
    ): ColorPropertiesOutput {
        return {
            type: colorType ?? null,
            value: color ?? null,
            alpha: alpha === null ? null : Number(alpha),
        };
    }

    /**
     * Set shadow presets.
     */
    protected setShadowPresetsProperties(presets: number): this {
        this.#shadowProperties.presets = presets;
        this.setShadowPropertiesMapValues(this.getShadowPresetsMap(presets));
        return this;
    }

    /**
     * Set shadow properties from preset map.
     */
    protected setShadowPropertiesMapValues(propertiesMap: ShadowProperties, reference?: Record<string, unknown>): this {
        const baseReference = reference;
        for (const [propertyKey, propertyVal] of Object.entries(propertiesMap)) {
            if (propertyVal !== null && typeof propertyVal === 'object') {
                if (
                    Properties.SHADOW_ARRAY_KEYS.includes(propertyKey as (typeof Properties.SHADOW_ARRAY_KEYS)[number])
                ) {
                    if (propertyKey === 'size') {
                        this.#shadowProperties.size = {
                            ...this.#shadowProperties.size,
                            ...(propertyVal as ShadowSizeProperties),
                        };
                    }
                }
            } else {
                if (!baseReference) {
                    (this.#shadowProperties as unknown as Record<string, unknown>)[propertyKey] = propertyVal;
                } else {
                    reference![propertyKey] = propertyVal;
                }
            }
        }
        return this;
    }

    /**
     * Set shadow blur.
     */
    protected setShadowBlur(blur: number | null): this {
        if (blur !== null) {
            this.#shadowProperties.blur = blur;
        }
        return this;
    }

    /**
     * Set shadow angle.
     */
    protected setShadowAngle(angle: number | string | null): this {
        if (Properties.isNumeric(angle)) {
            this.#shadowProperties.direction = Number(angle);
        }
        return this;
    }

    /**
     * Set shadow distance.
     */
    protected setShadowDistance(distance: number | null): this {
        if (distance !== null) {
            this.#shadowProperties.distance = distance;
        }
        return this;
    }

    /**
     * Set glow size.
     */
    protected setGlowSize(size: number | null): this {
        this.#glowSize = size;
        return this;
    }

    /**
     * Get line style arrow size entry.
     */
    protected getLineStyleArrowSize(arraySelector: number, arrayKeySelector: 'w' | 'len'): string {
        return Properties.ARROW_SIZES[arraySelector]?.[arrayKeySelector] ?? '';
    }

    private static isNumeric(value: unknown): boolean {
        if (typeof value === 'number') {
            return !Number.isNaN(value);
        }
        if (typeof value === 'string') {
            return value.trim() !== '' && !Number.isNaN(Number(value));
        }
        return false;
    }

    private static cloneShadowProperties(properties: ShadowProperties): ShadowProperties {
        return {
            presets: properties.presets ?? null,
            effect: properties.effect ?? null,
            size: {
                sx: properties.size?.sx ?? null,
                sy: properties.size?.sy ?? null,
                kx: properties.size?.kx ?? null,
                ky: properties.size?.ky ?? null,
            },
            blur: properties.blur ?? null,
            direction: properties.direction ?? null,
            distance: properties.distance ?? null,
            algn: properties.algn ?? null,
            rotWithShape: properties.rotWithShape ?? null,
        };
    }

    private static cloneChartColor(color: ChartColor): ChartColor {
        const type = color.getType();
        return new ChartColor(
            color.getValue(),
            color.getAlpha(),
            type === '' ? undefined : type,
            color.getBrightness() ?? undefined,
            color.getLastClr() ?? undefined,
        );
    }
}
