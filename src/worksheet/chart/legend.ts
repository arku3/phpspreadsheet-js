/**
 * Legend - represents a chart legend with position, layout, and styling.
 *
 * Ported from PhpSpreadsheet Chart/Legend.php
 */

import { Font } from '../../style/font.ts';
import { AxisText } from './axis';
import type { ChartLayout, LegendPosition } from './chart';
import { ChartColor } from './chart-color';
import { GridLines } from './grid-lines';
import type { Layout } from './layout';

export type LegendLayout = ChartLayout | Layout | null;

/**
 * Legend position constants (matching PHP Legend.php).
 */
export const LEGEND_POSITION_RIGHT = 'r' as const;
export const LEGEND_POSITION_LEFT = 'l' as const;
export const LEGEND_POSITION_TOP = 't' as const;
export const LEGEND_POSITION_BOTTOM = 'b' as const;
export const LEGEND_POSITION_TOPRIGHT = 'tr' as const;
export const LEGEND_POSITION_CUSTOM = '??' as const;

export const XL_LEGEND_POSITION_BOTTOM = -4107;
export const XL_LEGEND_POSITION_CORNER = 2;
export const XL_LEGEND_POSITION_CUSTOM = -4161;
export const XL_LEGEND_POSITION_LEFT = -4131;
export const XL_LEGEND_POSITION_RIGHT = -4152;
export const XL_LEGEND_POSITION_TOP = -4160;

/**
 * Valid legend positions.
 */
export const VALID_POSITIONS = [
    LEGEND_POSITION_RIGHT,
    LEGEND_POSITION_LEFT,
    LEGEND_POSITION_TOP,
    LEGEND_POSITION_BOTTOM,
    LEGEND_POSITION_TOPRIGHT,
    LEGEND_POSITION_CUSTOM,
] as const;

/**
 * Maps short position codes to full LegendPosition type values.
 */
export const LEGEND_POSITION_TO_CONFIG: Record<string, LegendPosition> = {
    [LEGEND_POSITION_RIGHT]: 'right',
    [LEGEND_POSITION_LEFT]: 'left',
    [LEGEND_POSITION_TOP]: 'top',
    [LEGEND_POSITION_BOTTOM]: 'bottom',
    [LEGEND_POSITION_TOPRIGHT]: 'right', // Default to right for topright
    [LEGEND_POSITION_CUSTOM]: 'none',
};

/**
 * Maps LegendPosition type values to short position codes.
 */
export const CONFIG_TO_LEGEND_POSITION: Record<LegendPosition, string> = {
    right: LEGEND_POSITION_RIGHT,
    left: LEGEND_POSITION_LEFT,
    top: LEGEND_POSITION_TOP,
    bottom: LEGEND_POSITION_BOTTOM,
    none: LEGEND_POSITION_RIGHT, // Default for none
};

export const POSITION_XLREF: Record<number, string> = {
    [XL_LEGEND_POSITION_BOTTOM]: LEGEND_POSITION_BOTTOM,
    [XL_LEGEND_POSITION_CORNER]: LEGEND_POSITION_TOPRIGHT,
    [XL_LEGEND_POSITION_CUSTOM]: LEGEND_POSITION_CUSTOM,
    [XL_LEGEND_POSITION_LEFT]: LEGEND_POSITION_LEFT,
    [XL_LEGEND_POSITION_RIGHT]: LEGEND_POSITION_RIGHT,
    [XL_LEGEND_POSITION_TOP]: LEGEND_POSITION_TOP,
};

export class Legend {
    #position: string = LEGEND_POSITION_RIGHT;
    #layout: LegendLayout = null;
    #overlay: boolean = false;
    #borderLines: GridLines = new GridLines();
    #fillColor: ChartColor = new ChartColor();
    #textFont: Font | null = null;
    #legendText: AxisText | null = null;

    /**
     * Create a new Legend.
     */
    constructor(position: string = LEGEND_POSITION_RIGHT, layout: LegendLayout = null, overlay: boolean = true) {
        this.setPosition(position);
        this.#layout = layout;
        this.setOverlay(overlay);
    }

    /**
     * Get legend position as a short code.
     */
    public getPosition(): string {
        return this.#position;
    }

    /**
     * Set legend position using a short code.
     * Returns true if position is valid, false otherwise.
     */
    public setPosition(position: string): boolean {
        if (!VALID_POSITIONS.includes(position as (typeof VALID_POSITIONS)[number])) {
            return false;
        }
        this.#position = position;
        return true;
    }

    /**
     * Get the layout.
     */
    public getLayout(): LegendLayout {
        return this.#layout;
    }

    /**
     * Set the layout.
     */
    public setLayout(layout: LegendLayout): this {
        this.#layout = layout;
        return this;
    }

    /**
     * Get overlay setting.
     */
    public getOverlay(): boolean {
        return this.#overlay;
    }

    /**
     * Set overlay setting.
     */
    public setOverlay(overlay: boolean): void {
        this.#overlay = overlay;
    }

    /**
     * Get border lines.
     */
    public getBorderLines(): GridLines {
        return this.#borderLines;
    }

    /**
     * Set border lines.
     */
    public setBorderLines(borderLines: GridLines): this {
        this.#borderLines = borderLines;
        return this;
    }

    /**
     * Get fill color.
     */
    public getFillColor(): ChartColor {
        return this.#fillColor;
    }

    /**
     * Set fill color.
     */
    public setFillColor(fillColor: ChartColor | null): this {
        this.#fillColor = fillColor ?? new ChartColor();
        return this;
    }

    /**
     * Get legend text font.
     */
    public getTextFont(): Font | null {
        return this.#textFont;
    }

    /**
     * Set legend text font.
     */
    public setTextFont(font: Font | null): this {
        this.#textFont = font;
        return this;
    }

    public getPositionXL(): number | false {
        const entries = Object.entries(POSITION_XLREF);
        const found = entries.find(([, value]) => value === this.#position);
        if (!found) {
            return false;
        }
        return Number(found[0]);
    }

    public setPositionXL(positionXL: number): boolean {
        const position = POSITION_XLREF[positionXL];
        if (!position) {
            return false;
        }
        return this.setPosition(position);
    }

    public getLegendText(): AxisText | null {
        return this.#legendText;
    }

    public setLegendText(legendText: AxisText | null): this {
        this.#legendText = legendText;
        return this;
    }

    public clone(): Legend {
        const clonedLayout = Legend.cloneLayout(this.#layout);
        const cloned = new Legend(this.#position, clonedLayout, this.#overlay);
        cloned.#borderLines = this.#borderLines.clone();
        cloned.#fillColor = this.#fillColor.clone();
        cloned.#textFont = this.#textFont ? this.#textFont.clone() : null;
        cloned.#legendText = this.#legendText ? this.#legendText.clone() : null;
        return cloned;
    }

    private static cloneLayout(layout: LegendLayout): LegendLayout {
        if (!layout) {
            return null;
        }
        if (typeof (layout as Layout).clone === 'function') {
            return (layout as Layout).clone();
        }
        return { ...layout };
    }
}
