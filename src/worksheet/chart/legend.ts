/**
 * Legend - represents a chart legend with position, layout, and styling.
 *
 * Ported from PhpSpreadsheet Chart/Legend.php
 */

import { Font } from '../../style/font.ts';
import type { ChartLayout, LegendPosition } from './chart';
import type { ChartColor } from './chart-color';

/**
 * Simple GridLines representation for legend borders.
 * Can be expanded later with full Properties implementation.
 */
export interface GridLines {
    color?: string | null;
    width?: number | null;
    style?: string | null;
}

/**
 * Legend position constants (matching PHP Legend.php).
 */
export const LEGEND_POSITION_RIGHT = 'r' as const;
export const LEGEND_POSITION_LEFT = 'l' as const;
export const LEGEND_POSITION_TOP = 't' as const;
export const LEGEND_POSITION_BOTTOM = 'b' as const;
export const LEGEND_POSITION_TOPRIGHT = 'tr' as const;

/**
 * Valid legend positions.
 */
const VALID_POSITIONS = [
    LEGEND_POSITION_RIGHT,
    LEGEND_POSITION_LEFT,
    LEGEND_POSITION_TOP,
    LEGEND_POSITION_BOTTOM,
    LEGEND_POSITION_TOPRIGHT,
] as const;

/**
 * Maps short position codes to full LegendPosition type values.
 */
const POSITION_TO_LEGEND_POSITION: Record<string, LegendPosition> = {
    [LEGEND_POSITION_RIGHT]: 'right',
    [LEGEND_POSITION_LEFT]: 'left',
    [LEGEND_POSITION_TOP]: 'top',
    [LEGEND_POSITION_BOTTOM]: 'bottom',
    [LEGEND_POSITION_TOPRIGHT]: 'right', // Default to right for topright
};

/**
 * Maps LegendPosition type values to short position codes.
 */
const LEGEND_POSITION_TO_POSITION: Record<LegendPosition, string> = {
    right: LEGEND_POSITION_RIGHT,
    left: LEGEND_POSITION_LEFT,
    top: LEGEND_POSITION_TOP,
    bottom: LEGEND_POSITION_BOTTOM,
    none: LEGEND_POSITION_RIGHT, // Default for none
};

export class Legend {
    #position: string = LEGEND_POSITION_RIGHT;
    #layout: ChartLayout | null = null;
    #overlay: boolean = false;
    #borderLines: GridLines = {};
    #fillColor: ChartColor | null = null;
    #textFont: Font | null = null;

    /**
     * Create a new Legend.
     */
    constructor(position: string = LEGEND_POSITION_RIGHT, layout: ChartLayout | null = null, overlay: boolean = false) {
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
    public getLayout(): ChartLayout | null {
        return this.#layout;
    }

    /**
     * Set the layout.
     */
    public setLayout(layout: ChartLayout | null): this {
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
    public getFillColor(): ChartColor | null {
        return this.#fillColor;
    }

    /**
     * Set fill color.
     */
    public setFillColor(fillColor: ChartColor | null): this {
        this.#fillColor = fillColor;
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
}
