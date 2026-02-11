/**
 * GridLines class - represents line styling for chart borders and gridlines.
 * Ported from PhpSpreadsheet Chart/GridLines.php which extends Properties.php
 *
 * Used by both Legend (for borders) and Axis (for gridlines).
 */

import { ChartColor } from './chart-color';

export interface ShadowProperties {
    presets?: number | null;
    effect?: string | null;
    size?: {
        sx?: number | null;
        sy?: number | null;
        kx?: number | null;
        ky?: number | null;
    };
    blur?: number | null;
    direction?: number | null;
    distance?: number | null;
    algn?: string | null;
    rotWithShape?: string | null;
}

export interface GlowProperties {
    size?: number | null;
    color?: ChartColor | null;
}

export interface SoftEdgesProperties {
    size?: number | null;
}

export interface LineStyleProperties {
    width?: number | null;
    compound?: string | null;
    dash?: string | null;
    cap?: string | null;
    join?: string | null;
    arrow?: {
        head?: {
            type?: string | null;
            size?: number | string | null;
            w?: string | null;
            len?: string | null;
        };
        end?: {
            type?: string | null;
            size?: number | string | null;
            w?: string | null;
            len?: string | null;
        };
    };
}

export class GridLines {
    #lineColor: ChartColor | null = null;
    #lineWidth: number | null = null;
    #lineStyle: LineStyleProperties = {
        width: null,
        compound: null,
        dash: null,
        cap: null,
        join: null,
        arrow: {
            head: {
                type: null,
                size: null,
                w: null,
                len: null,
            },
            end: {
                type: null,
                size: null,
                w: null,
                len: null,
            },
        },
    };
    #shadow: ShadowProperties = {
        presets: null,
        effect: null,
        size: {
            sx: null,
            sy: null,
            kx: null,
            ky: null,
        },
        blur: null,
        direction: null,
        distance: null,
        algn: null,
        rotWithShape: null,
    };
    #glow: GlowProperties = {
        size: null,
        color: null,
    };
    #softEdges: SoftEdgesProperties = {
        size: null,
    };
    #objectState: boolean = false;

    constructor() {}

    /**
     * Get object state - used for minor gridlines.
     */
    public getObjectState(): boolean {
        return this.#objectState;
    }

    /**
     * Activate this object - marks it as being used.
     */
    public activateObject(): this {
        this.#objectState = true;
        return this;
    }

    /**
     * Get line color.
     */
    public getLineColor(): ChartColor | null {
        return this.#lineColor;
    }

    /**
     * Set line color.
     */
    public setLineColor(color: ChartColor | null): this {
        this.#lineColor = color;
        this.activateObject();
        return this;
    }

    /**
     * Get line width.
     */
    public getLineWidth(): number | null {
        return this.#lineWidth ?? this.#lineStyle.width ?? null;
    }

    /**
     * Set line width.
     */
    public setLineWidth(width: number | null): this {
        this.#lineWidth = width;
        this.#lineStyle.width = width;
        this.activateObject();
        return this;
    }

    /**
     * Get line style (dash type: solid, dash, etc.).
     */
    public getLineStyle(): string | null {
        return this.#lineStyle.dash ?? null;
    }

    /**
     * Set line style (dash type: solid, dash, etc.).
     */
    public setLineStyle(style: string | null): this {
        this.#lineStyle.dash = style;
        this.activateObject();
        return this;
    }

    /**
     * Get full line style properties.
     */
    public getLineStyleProperties(): LineStyleProperties {
        return {
            width: this.#lineStyle.width,
            compound: this.#lineStyle.compound,
            dash: this.#lineStyle.dash,
            cap: this.#lineStyle.cap,
            join: this.#lineStyle.join,
            arrow: {
                head: { ...this.#lineStyle.arrow?.head },
                end: { ...this.#lineStyle.arrow?.end },
            },
        };
    }

    /**
     * Set full line style properties.
     */
    public setLineStyleProperties(properties: Partial<LineStyleProperties>): this {
        this.#lineStyle = {
            ...this.#lineStyle,
            ...properties,
            arrow: {
                head: { ...this.#lineStyle.arrow?.head, ...properties.arrow?.head },
                end: { ...this.#lineStyle.arrow?.end, ...properties.arrow?.end },
            },
        };
        this.activateObject();
        return this;
    }

    /**
     * Get shadow properties.
     */
    public getShadow(): ShadowProperties {
        return {
            presets: this.#shadow.presets,
            effect: this.#shadow.effect,
            size: { ...this.#shadow.size },
            blur: this.#shadow.blur,
            direction: this.#shadow.direction,
            distance: this.#shadow.distance,
            algn: this.#shadow.algn,
            rotWithShape: this.#shadow.rotWithShape,
        };
    }

    /**
     * Set shadow properties.
     */
    public setShadow(shadow: Partial<ShadowProperties>): this {
        this.#shadow = {
            ...this.#shadow,
            ...shadow,
            size: { ...this.#shadow.size, ...shadow.size },
        };
        this.activateObject();
        return this;
    }

    /**
     * Get glow properties.
     */
    public getGlow(): GlowProperties {
        return {
            size: this.#glow.size,
            color: this.#glow.color,
        };
    }

    /**
     * Set glow properties.
     */
    public setGlow(glow: Partial<GlowProperties>): this {
        this.#glow = { ...this.#glow, ...glow };
        this.activateObject();
        return this;
    }

    /**
     * Get soft edges properties.
     */
    public getSoftEdges(): SoftEdgesProperties {
        return {
            size: this.#softEdges.size,
        };
    }

    /**
     * Set soft edges properties.
     */
    public setSoftEdges(softEdges: Partial<SoftEdgesProperties>): this {
        this.#softEdges = { ...this.#softEdges, ...softEdges };
        this.activateObject();
        return this;
    }

    /**
     * Create a clone of this GridLines object.
     */
    public clone(): GridLines {
        const cloned = new GridLines();
        cloned.#lineColor = this.#lineColor
            ? new ChartColor(
                  this.#lineColor.getValue(),
                  this.#lineColor.getAlpha(),
                  this.#lineColor.getType() || undefined,
                  this.#lineColor.getBrightness() || undefined,
              )
            : null;
        cloned.#lineWidth = this.#lineWidth;
        cloned.#lineStyle = this.getLineStyleProperties();
        cloned.#shadow = this.getShadow();
        cloned.#glow = {
            size: this.#glow.size,
            color: this.#glow.color
                ? new ChartColor(
                      this.#glow.color.getValue(),
                      this.#glow.color.getAlpha(),
                      this.#glow.color.getType() || undefined,
                      this.#glow.color.getBrightness() || undefined,
                  )
                : null,
        };
        cloned.#softEdges = this.getSoftEdges();
        cloned.#objectState = this.#objectState;
        return cloned;
    }
}
