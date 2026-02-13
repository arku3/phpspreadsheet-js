/**
 * Effects module - shadow, glow, and soft edges for chart elements
 * Ported from PhpSpreadsheet Chart/Properties.php
 */

import { ChartColor } from './chart-color';

/**
 * Shadow effect properties
 */
export interface ShadowProperties {
    presets?: number | null;
    effect?: 'outerShdw' | 'innerShdw' | null;
    color?: ChartColor | null;
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

/**
 * Glow effect properties
 */
export interface GlowProperties {
    size?: number | null;
    color?: ChartColor | null;
}

/**
 * Soft edges effect properties
 */
export interface SoftEdgesProperties {
    size?: number | null;
}

/**
 * Combined effects for chart elements
 */
export interface Effects {
    shadow?: ShadowProperties | null;
    glow?: GlowProperties | null;
    softEdges?: SoftEdgesProperties | null;
}

/**
 * Effect presets constants
 */
export const SHADOW_PRESETS_NOSHADOW = null;
export const SHADOW_PRESETS_OUTER_BOTTOM_RIGHT = 1;
export const SHADOW_PRESETS_OUTER_BOTTOM = 2;
export const SHADOW_PRESETS_OUTER_BOTTOM_LEFT = 3;
export const SHADOW_PRESETS_OUTER_RIGHT = 4;
export const SHADOW_PRESETS_OUTER_CENTER = 5;
export const SHADOW_PRESETS_OUTER_LEFT = 6;
export const SHADOW_PRESETS_OUTER_TOP_RIGHT = 7;
export const SHADOW_PRESETS_OUTER_TOP = 8;
export const SHADOW_PRESETS_OUTER_TOP_LEFT = 9;
export const SHADOW_PRESETS_INNER_BOTTOM_RIGHT = 10;
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

/**
 * Multiplier constants for XML conversion
 */
export const POINTS_WIDTH_MULTIPLIER = 12700;
export const ANGLE_MULTIPLIER = 60000;
export const PERCENTAGE_MULTIPLIER = 100000;

/**
 * Shadow preset options map
 */
export const PRESETS_OPTIONS: Record<number, ShadowProperties> = {
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
        effect: 'outerShdw',
        blur: 50800 / POINTS_WIDTH_MULTIPLIER,
        distance: 38100 / POINTS_WIDTH_MULTIPLIER,
        direction: 2700000 / ANGLE_MULTIPLIER,
        algn: 'tl',
        rotWithShape: '0',
    },
    2: {
        effect: 'outerShdw',
        blur: 50800 / POINTS_WIDTH_MULTIPLIER,
        distance: 38100 / POINTS_WIDTH_MULTIPLIER,
        direction: 5400000 / ANGLE_MULTIPLIER,
        algn: 't',
        rotWithShape: '0',
    },
    3: {
        effect: 'outerShdw',
        blur: 50800 / POINTS_WIDTH_MULTIPLIER,
        distance: 38100 / POINTS_WIDTH_MULTIPLIER,
        direction: 8100000 / ANGLE_MULTIPLIER,
        algn: 'tr',
        rotWithShape: '0',
    },
    4: {
        effect: 'outerShdw',
        blur: 50800 / POINTS_WIDTH_MULTIPLIER,
        distance: 38100 / POINTS_WIDTH_MULTIPLIER,
        algn: 'l',
        rotWithShape: '0',
    },
    5: {
        effect: 'outerShdw',
        size: { sx: 102000 / PERCENTAGE_MULTIPLIER, sy: 102000 / PERCENTAGE_MULTIPLIER },
        blur: 63500 / POINTS_WIDTH_MULTIPLIER,
        distance: 38100 / POINTS_WIDTH_MULTIPLIER,
        algn: 'ctr',
        rotWithShape: '0',
    },
    6: {
        effect: 'outerShdw',
        blur: 50800 / POINTS_WIDTH_MULTIPLIER,
        distance: 38100 / POINTS_WIDTH_MULTIPLIER,
        direction: 10800000 / ANGLE_MULTIPLIER,
        algn: 'r',
        rotWithShape: '0',
    },
    7: {
        effect: 'outerShdw',
        blur: 50800 / POINTS_WIDTH_MULTIPLIER,
        distance: 38100 / POINTS_WIDTH_MULTIPLIER,
        direction: 18900000 / ANGLE_MULTIPLIER,
        algn: 'bl',
        rotWithShape: '0',
    },
    8: {
        effect: 'outerShdw',
        blur: 50800 / POINTS_WIDTH_MULTIPLIER,
        distance: 38100 / POINTS_WIDTH_MULTIPLIER,
        direction: 16200000 / ANGLE_MULTIPLIER,
        rotWithShape: '0',
    },
    9: {
        effect: 'outerShdw',
        blur: 50800 / POINTS_WIDTH_MULTIPLIER,
        distance: 38100 / POINTS_WIDTH_MULTIPLIER,
        direction: 13500000 / ANGLE_MULTIPLIER,
        algn: 'br',
        rotWithShape: '0',
    },
    10: {
        effect: 'innerShdw',
        blur: 63500 / POINTS_WIDTH_MULTIPLIER,
        distance: 50800 / POINTS_WIDTH_MULTIPLIER,
        direction: 2700000 / ANGLE_MULTIPLIER,
    },
    11: {
        effect: 'innerShdw',
        blur: 63500 / POINTS_WIDTH_MULTIPLIER,
        distance: 50800 / POINTS_WIDTH_MULTIPLIER,
        direction: 5400000 / ANGLE_MULTIPLIER,
    },
    12: {
        effect: 'innerShdw',
        blur: 63500 / POINTS_WIDTH_MULTIPLIER,
        distance: 50800 / POINTS_WIDTH_MULTIPLIER,
        direction: 8100000 / ANGLE_MULTIPLIER,
    },
    13: {
        effect: 'innerShdw',
        blur: 63500 / POINTS_WIDTH_MULTIPLIER,
        distance: 50800 / POINTS_WIDTH_MULTIPLIER,
    },
    14: {
        effect: 'innerShdw',
        blur: 114300 / POINTS_WIDTH_MULTIPLIER,
    },
    15: {
        effect: 'innerShdw',
        blur: 63500 / POINTS_WIDTH_MULTIPLIER,
        distance: 50800 / POINTS_WIDTH_MULTIPLIER,
        direction: 10800000 / ANGLE_MULTIPLIER,
    },
    16: {
        effect: 'innerShdw',
        blur: 63500 / POINTS_WIDTH_MULTIPLIER,
        distance: 50800 / POINTS_WIDTH_MULTIPLIER,
        direction: 18900000 / ANGLE_MULTIPLIER,
    },
    17: {
        effect: 'innerShdw',
        blur: 63500 / POINTS_WIDTH_MULTIPLIER,
        distance: 50800 / POINTS_WIDTH_MULTIPLIER,
        direction: 16200000 / ANGLE_MULTIPLIER,
    },
    18: {
        effect: 'innerShdw',
        blur: 63500 / POINTS_WIDTH_MULTIPLIER,
        distance: 50800 / POINTS_WIDTH_MULTIPLIER,
        direction: 13500000 / ANGLE_MULTIPLIER,
    },
    19: {
        effect: 'outerShdw',
        blur: 152400 / POINTS_WIDTH_MULTIPLIER,
        distance: 317500 / POINTS_WIDTH_MULTIPLIER,
        size: { sx: 90000 / PERCENTAGE_MULTIPLIER, sy: -19000 / PERCENTAGE_MULTIPLIER },
        direction: 5400000 / ANGLE_MULTIPLIER,
        rotWithShape: '0',
    },
    20: {
        effect: 'outerShdw',
        blur: 76200 / POINTS_WIDTH_MULTIPLIER,
        direction: 18900000 / ANGLE_MULTIPLIER,
        size: { sy: 23000 / PERCENTAGE_MULTIPLIER, kx: -1200000 / ANGLE_MULTIPLIER },
        algn: 'bl',
        rotWithShape: '0',
    },
    21: {
        effect: 'outerShdw',
        blur: 76200 / POINTS_WIDTH_MULTIPLIER,
        direction: 13500000 / ANGLE_MULTIPLIER,
        size: { sy: 23000 / PERCENTAGE_MULTIPLIER, kx: 1200000 / ANGLE_MULTIPLIER },
        algn: 'br',
        rotWithShape: '0',
    },
    22: {
        effect: 'outerShdw',
        blur: 76200 / POINTS_WIDTH_MULTIPLIER,
        distance: 12700 / POINTS_WIDTH_MULTIPLIER,
        direction: 2700000 / ANGLE_MULTIPLIER,
        size: { sy: -23000 / PERCENTAGE_MULTIPLIER, kx: -800400 / ANGLE_MULTIPLIER },
        algn: 'bl',
        rotWithShape: '0',
    },
    23: {
        effect: 'outerShdw',
        blur: 76200 / POINTS_WIDTH_MULTIPLIER,
        distance: 12700 / POINTS_WIDTH_MULTIPLIER,
        direction: 8100000 / ANGLE_MULTIPLIER,
        size: { sy: -23000 / PERCENTAGE_MULTIPLIER, kx: 800400 / ANGLE_MULTIPLIER },
        algn: 'br',
        rotWithShape: '0',
    },
};

/**
 * Utility functions for converting between points and XML values
 */
export function pointsToXml(width: number): string {
    return String(Math.floor(width * POINTS_WIDTH_MULTIPLIER));
}

export function xmlToPoints(width: string): number {
    return Number(width) / POINTS_WIDTH_MULTIPLIER;
}

export function angleToXml(angle: number): string {
    return String(Math.floor(angle * ANGLE_MULTIPLIER));
}

export function xmlToAngle(angle: string): number {
    return Number(angle) / ANGLE_MULTIPLIER;
}

export function tenthOfPercentToXml(value: number): string {
    return String(Math.floor(value * PERCENTAGE_MULTIPLIER));
}

export function xmlToTenthOfPercent(value: string): number {
    return Number(value) / PERCENTAGE_MULTIPLIER;
}

/**
 * EffectProperties class - handles shadow, glow, and soft edges for chart elements
 * Ported from PhpSpreadsheet Chart/Properties.php
 */
export class EffectProperties {
    #objectState = false;
    #glowSize: number | null = null;
    #glowColor: ChartColor;
    #softEdges: SoftEdgesProperties = { size: null };
    #shadow: ShadowProperties = {
        presets: null,
        effect: null,
        size: { sx: null, sy: null, kx: null, ky: null },
        blur: null,
        direction: null,
        distance: null,
        algn: null,
        rotWithShape: null,
    };
    #shadowColor: ChartColor;

    constructor() {
        this.#glowColor = new ChartColor();
        this.#shadowColor = new ChartColor();
        this.#shadowColor.setType('prstClr');
        this.#shadowColor.setValue('black');
        this.#shadowColor.setAlpha(40);
    }

    /**
     * Get object state - used to check if effects are configured
     */
    public getObjectState(): boolean {
        return this.#objectState;
    }

    /**
     * Activate this object - marks it as being used
     */
    public activateObject(): this {
        this.#objectState = true;
        return this;
    }

    /**
     * Get glow size
     */
    public getGlowSize(): number | null {
        return this.#glowSize;
    }

    /**
     * Set glow size
     */
    public setGlowSize(size: number | null): this {
        this.#glowSize = size;
        return this;
    }

    /**
     * Get glow color
     */
    public getGlowColor(): ChartColor {
        return this.#glowColor;
    }

    /**
     * Set glow properties
     */
    public setGlowProperties(
        size: number,
        colorValue?: string | null,
        colorAlpha?: number | null,
        colorType?: string | null,
    ): void {
        this.activateObject();
        this.setGlowSize(size);
        this.#glowColor.setColorPropertiesArray({
            value: colorValue ?? '',
            type: (colorType as any) ?? undefined,
            alpha: colorAlpha ?? undefined,
        });
    }

    /**
     * Get glow property by name or array path
     */
    public getGlowProperty(property: string | string[]): unknown {
        if (property === 'size') {
            return this.#glowSize;
        }
        if (property === 'color') {
            return {
                value: this.#glowColor.getValue(),
                type: this.#glowColor.getType(),
                alpha: this.#glowColor.getAlpha(),
            };
        }
        if (Array.isArray(property) && property.length >= 2 && property[0] === 'color') {
            return this.#glowColor.getColorProperty(property[1] as 'value' | 'type' | 'alpha' | 'brightness');
        }
        return null;
    }

    /**
     * Get soft edges size
     */
    public getSoftEdgesSize(): number | null {
        return this.#softEdges.size ?? null;
    }

    /**
     * Set soft edges size
     */
    public setSoftEdges(size: number | null): void {
        if (size !== null) {
            this.activateObject();
            this.#softEdges.size = size;
        }
    }

    /**
     * Get soft edges properties
     */
    public getSoftEdges(): SoftEdgesProperties {
        return { size: this.#softEdges.size };
    }

    /**
     * Get shadow color
     */
    public getShadowColor(): ChartColor {
        return this.#shadowColor;
    }

    /**
     * Set shadow property
     */
    public setShadowProperty(propertyName: string, value: unknown): this {
        this.activateObject();
        if (propertyName === 'color' && typeof value === 'object' && value !== null) {
            const colorValue = value as { value?: string; alpha?: number | null; type?: string };
            this.#shadowColor.setColorPropertiesArray({
                value: colorValue.value ?? '',
                type: (colorValue.type as any) ?? undefined,
                alpha: colorValue.alpha ?? undefined,
            });
        } else {
            (this.#shadow as Record<string, unknown>)[propertyName] = value;
        }
        return this;
    }

    /**
     * Get shadow property by name or array path
     */
    public getShadowProperty(property: string | string[]): unknown {
        if (property === 'color') {
            return {
                value: this.#shadowColor.getValue(),
                type: this.#shadowColor.getType(),
                alpha: this.#shadowColor.getAlpha(),
            };
        }
        if (property === 'effect') {
            return this.#shadow.effect;
        }
        if (Array.isArray(property)) {
            let ref: unknown = this.#shadow;
            for (const key of property) {
                if (ref && typeof ref === 'object' && key in ref) {
                    ref = (ref as Record<string, unknown>)[key];
                } else {
                    return null;
                }
            }
            return ref;
        }
        return (this.#shadow as Record<string, unknown>)[property] ?? null;
    }

    /**
     * Get all shadow properties
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
     * Set shadow properties
     */
    public setShadowProperties(
        presets: number,
        colorValue?: string | null,
        colorType?: string | null,
        colorAlpha?: number | null,
        blur?: number | null,
        angle?: number | null,
        distance?: number | null,
    ): void {
        this.activateObject();
        this.setShadowPresetsProperties(presets);
        if (presets === 0) {
            this.#shadowColor.setType('prstClr');
            this.#shadowColor.setValue('black');
            this.#shadowColor.setAlpha(40);
        }
        if (colorValue !== null && colorValue !== undefined) {
            this.#shadowColor.setValue(colorValue);
        }
        if (colorType !== null && colorType !== undefined) {
            this.#shadowColor.setType(colorType as any);
        }
        if (colorAlpha !== null && colorAlpha !== undefined) {
            this.#shadowColor.setAlpha(colorAlpha);
        }
        if (blur !== null && blur !== undefined) {
            this.#shadow.blur = blur;
        }
        if (angle !== null && angle !== undefined) {
            this.#shadow.direction = angle;
        }
        if (distance !== null && distance !== undefined) {
            this.#shadow.distance = distance;
        }
    }

    /**
     * Set shadow preset properties
     */
    private setShadowPresetsProperties(presets: number): void {
        this.#shadow.presets = presets;
        const presetMap = PRESETS_OPTIONS[presets] ?? PRESETS_OPTIONS[0];
        if (presetMap) {
            this.setShadowPropertiesMapValues(presetMap);
        }
    }

    /**
     * Set shadow properties from preset map
     */
    private setShadowPropertiesMapValues(propertiesMap: ShadowProperties, reference?: Record<string, unknown>): void {
        const baseReference = reference;
        for (const [propertyKey, propertyVal] of Object.entries(propertiesMap)) {
            if (propertyVal !== null && typeof propertyVal === 'object' && !Array.isArray(propertyVal)) {
                if (propertyKey === 'size') {
                    this.#shadow.size = { ...this.#shadow.size, ...propertyVal };
                }
            } else {
                if (baseReference === undefined) {
                    (this.#shadow as Record<string, unknown>)[propertyKey] = propertyVal;
                } else if (reference) {
                    reference[propertyKey] = propertyVal;
                }
            }
        }
    }

    /**
     * Clone this EffectProperties
     */
    public clone(): EffectProperties {
        const cloned = new EffectProperties();
        cloned.#objectState = this.#objectState;
        cloned.#glowSize = this.#glowSize;
        cloned.#glowColor = new ChartColor(
            this.#glowColor.getValue(),
            this.#glowColor.getAlpha(),
            this.#glowColor.getType() || undefined,
            this.#glowColor.getBrightness() || undefined,
        );
        cloned.#softEdges = { ...this.#softEdges };
        cloned.#shadow = this.getShadow();
        cloned.#shadowColor = new ChartColor(
            this.#shadowColor.getValue(),
            this.#shadowColor.getAlpha(),
            this.#shadowColor.getType() || undefined,
            this.#shadowColor.getBrightness() || undefined,
        );
        return cloned;
    }
}
