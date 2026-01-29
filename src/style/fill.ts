import { Color } from './color.ts';
import { createHash } from 'node:crypto';
import { Supervisor } from './supervisor.ts';

/**
 * Fill style.
 */
export class Fill extends Supervisor {
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
    constructor(isSupervisor: boolean = false) {
        super(isSupervisor);
        this.#startColor = new Color(Color.COLOR_WHITE, isSupervisor);
        this.#endColor = new Color(Color.COLOR_BLACK, isSupervisor);
        if (isSupervisor) {
            this.#startColor.bindParent(this);
            this.#endColor.bindParent(this);
        }
    }

    /**
     * Get shared component.
     */
    public getSharedComponent(): Fill {
        if (!this.parent) {
            throw new Error('No parent found.');
        }
        return (this.parent as any).getSharedComponent().getFill();
    }

    /**
     * Build style array from subcomponents.
     */
    public getStyleArray(array: any): any {
        return { fill: array };
    }

    /**
     * Get Fill Type.
     */
    public getFillType(): string {
        if (this.isSupervisor) {
            return this.getSharedComponent().getFillType();
        }
        return this.#fillType;
    }

    /**
     * Set Fill Type.
     */
    public setFillType(fillType: string): this {
        if (this.isSupervisor) {
            const styleArray = this.getStyleArray({ fillType: fillType });
            (this.parent as any).applyFromArray(styleArray);
        } else {
            this.#fillType = fillType;
        }
        return this;
    }

    /**
     * Get Rotation.
     */
    public getRotation(): number {
        if (this.isSupervisor) {
            return this.getSharedComponent().getRotation();
        }
        return this.#rotation;
    }

    /**
     * Set Rotation.
     */
    public setRotation(rotation: number): this {
        if (this.isSupervisor) {
            const styleArray = this.getStyleArray({ rotation: rotation });
            (this.parent as any).applyFromArray(styleArray);
        } else {
            this.#rotation = rotation;
        }
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
        if (this.isSupervisor) {
            const styleArray = this.getStyleArray({ startColor: { argb: color.getARGB() } });
            (this.parent as any).applyFromArray(styleArray);
        } else {
            this.#startColor = color;
        }
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
        if (this.isSupervisor) {
            const styleArray = this.getStyleArray({ endColor: { argb: color.getARGB() } });
            (this.parent as any).applyFromArray(styleArray);
        } else {
            this.#endColor = color;
        }
        return this;
    }

    /**
     * Apply styles from array.
     *
     * @param styleArray Array containing style information
     */
    public applyFromArray(styleArray: Record<string, unknown>): this {
        if (this.isSupervisor) {
            const styleArrayLocal = this.getStyleArray(styleArray);
            (this.parent as any).applyFromArray(styleArrayLocal);
            return this;
        }

        if (styleArray.fillType !== undefined) {
            this.setFillType(String(styleArray.fillType));
        }
        if (styleArray.rotation !== undefined) {
            this.setRotation(Number(styleArray.rotation));
        }
        if (styleArray.startColor !== undefined && typeof styleArray.startColor === 'object') {
            this.getStartColor().applyFromArray(styleArray.startColor as { rgb?: string; argb?: string; theme?: number });
        }
        if (styleArray.endColor !== undefined && typeof styleArray.endColor === 'object') {
            this.getEndColor().applyFromArray(styleArray.endColor as { rgb?: string; argb?: string; theme?: number });
        }
        if (styleArray.color !== undefined && typeof styleArray.color === 'object') {
            this.getStartColor().applyFromArray(styleArray.color as { rgb?: string; argb?: string; theme?: number });
            this.getEndColor().applyFromArray(styleArray.color as { rgb?: string; argb?: string; theme?: number });
        }
        return this;
    }

    /**
     * Get hash code.
     */
    public getHashCode(): string {
        if (this.isSupervisor) {
            return this.getSharedComponent().getHashCode();
        }
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
