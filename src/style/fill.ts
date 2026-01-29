import { Color } from './color.ts';
import { createHash } from 'node:crypto';

/**
 * Fill style.
 */
export class Fill {
    // Fill types
    public static readonly FILL_NONE = 'none';
    public static readonly FILL_SOLID = 'solid';
    public static readonly FILL_GRADIENT_LINEAR = 'linear';
    public static readonly FILL_GRADIENT_PATH = 'path';
    public static readonly FILL_PATTERN_DARKDOWN = 'darkDown';
    public static readonly FILL_PATTERN_DARKGRAY = 'darkGray';
    public static readonly FILL_PATTERN_DARKGRID = 'darkGrid';
    public static readonly FILL_PATTERN_DARKHORIZONTAL = 'darkHorizontal';
    public static readonly FILL_PATTERN_DARKTRELLIS = 'darkTrellis';
    public static readonly FILL_PATTERN_DARKUP = 'darkUp';
    public static readonly FILL_PATTERN_DARKVERTICAL = 'darkVertical';
    public static readonly FILL_PATTERN_GRAY0625 = 'gray0625';
    public static readonly FILL_PATTERN_GRAY125 = 'gray125';
    public static readonly FILL_PATTERN_LIGHTDOWN = 'lightDown';
    public static readonly FILL_PATTERN_LIGHTGRAY = 'lightGray';
    public static readonly FILL_PATTERN_LIGHTGRID = 'lightGrid';
    public static readonly FILL_PATTERN_LIGHTHORIZONTAL = 'lightHorizontal';
    public static readonly FILL_PATTERN_LIGHTTRELLIS = 'lightTrellis';
    public static readonly FILL_PATTERN_LIGHTUP = 'lightUp';
    public static readonly FILL_PATTERN_LIGHTVERTICAL = 'lightVertical';
    public static readonly FILL_PATTERN_MEDIUMGRAY = 'mediumGray';

    /**
     * Fill type.
     */
    #fillType: string = Fill.FILL_NONE;

    /**
     * Rotation.
     */
    #rotation: number = 0;

    /**
     * Start color.
     */
    #startColor: Color;

    /**
     * End color.
     */
    #endColor: Color;

    /**
     * Create a new Fill.
     */
    constructor() {
        this.#startColor = new Color(Color.COLOR_WHITE);
        this.#endColor = new Color(Color.COLOR_BLACK);
    }

    /**
     * Get Fill Type.
     */
    public getFillType(): string {
        return this.#fillType;
    }

    /**
     * Set Fill Type.
     */
    public setFillType(fillType: string): this {
        this.#fillType = fillType;
        return this;
    }

    /**
     * Get Rotation.
     */
    public getRotation(): number {
        return this.#rotation;
    }

    /**
     * Set Rotation.
     */
    public setRotation(rotation: number): this {
        this.#rotation = rotation;
        return this;
    }

    /**
     * Get Start Color.
     */
    public getStartColor(): Color {
        return this.#startColor;
    }

    /**
     * Set Start Color.
     */
    public setStartColor(color: Color): this {
        this.#startColor = color;
        return this;
    }

    /**
     * Get End Color.
     */
    public getEndColor(): Color {
        return this.#endColor;
    }

    /**
     * Set End Color.
     */
    public setEndColor(color: Color): this {
        this.#endColor = color;
        return this;
    }

    /**
     * Get hash code.
     */
    public getHashCode(): string {
        return createHash('md5')
            .update(
                this.#fillType +
                this.#rotation +
                (this.#fillType !== Fill.FILL_NONE ? this.#startColor.getHashCode() : '') +
                (this.#fillType !== Fill.FILL_NONE ? this.#endColor.getHashCode() : '') +
                'Fill'
            )
            .digest('hex');
    }
}
