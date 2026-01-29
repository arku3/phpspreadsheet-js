import { Color } from './color.ts';
import { createHash } from 'node:crypto';

/**
 * Border style.
 */
export class Border {
    // Border style
    public static readonly BORDER_NONE = 'none';
    public static readonly BORDER_DASHDOT = 'dashDot';
    public static readonly BORDER_DASHDOTDOT = 'dashDotDot';
    public static readonly BORDER_DASHED = 'dashed';
    public static readonly BORDER_DOTTED = 'dotted';
    public static readonly BORDER_DOUBLE = 'double';
    public static readonly BORDER_HAIR = 'hair';
    public static readonly BORDER_MEDIUM = 'medium';
    public static readonly BORDER_MEDIUMDASHDOT = 'mediumDashDot';
    public static readonly BORDER_MEDIUMDASHDOTDOT = 'mediumDashDotDot';
    public static readonly BORDER_MEDIUMDASHED = 'mediumDashed';
    public static readonly BORDER_SLANTDASHDOT = 'slantDashDot';
    public static readonly BORDER_THICK = 'thick';
    public static readonly BORDER_THIN = 'thin';
    public static readonly BORDER_OMIT = 'omit';

    /**
     * Border style.
     */
    #borderStyle: string = Border.BORDER_NONE;

    /**
     * Border color.
     */
    #color: Color;

    /**
     * Create a new Border.
     */
    constructor() {
        this.#color = new Color(Color.COLOR_BLACK);
    }

    /**
     * Get Border style.
     */
    public getBorderStyle(): string {
        return this.#borderStyle;
    }

    /**
     * Set Border style.
     */
    public setBorderStyle(style: string | boolean): this {
        if (!style) {
            this.#borderStyle = Border.BORDER_NONE;
        } else if (style === true) {
            this.#borderStyle = Border.BORDER_MEDIUM;
        } else {
            this.#borderStyle = style as string;
        }
        return this;
    }

    /**
     * Get Border Color.
     */
    public getColor(): Color {
        return this.#color;
    }

    /**
     * Set Border Color.
     */
    public setColor(color: Color): this {
        this.#color = color;
        return this;
    }

    /**
     * Get hash code.
     */
    public getHashCode(): string {
        return createHash('md5')
            .update(
                this.#borderStyle +
                this.#color.getHashCode() +
                'Border'
            )
            .digest('hex');
    }
}
