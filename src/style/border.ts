import { Color } from './color.ts';
import { createHash } from 'node:crypto';
import { Supervisor } from './supervisor.ts';

/**
 * Border style.
 */
export class Border extends Supervisor {
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
     * Parent property name.
     */
    #parentPropertyName: string | undefined;

    /**
     * Create a new Border.
     */
    constructor(isSupervisor: boolean = false) {
        super(isSupervisor);
        this.#color = new Color(Color.COLOR_BLACK, isSupervisor);
        if (isSupervisor) {
            this.#color.bindParent(this, 'color');
        }
    }

    /**
     * Bind parent.
     */
    public override bindParent(parent: any, parentPropertyName?: string): this {
        this.parent = parent;
        this.#parentPropertyName = parentPropertyName;
        return this;
    }

    /**
     * Get shared component.
     */
    public getSharedComponent(): Border {
        if (!this.parent) {
            throw new Error('No parent found.');
        }
        const parentComponent = (this.parent as any).getSharedComponent();
        if (this.#parentPropertyName === 'left') return parentComponent.getLeft();
        if (this.#parentPropertyName === 'right') return parentComponent.getRight();
        if (this.#parentPropertyName === 'top') return parentComponent.getTop();
        if (this.#parentPropertyName === 'bottom') return parentComponent.getBottom();
        if (this.#parentPropertyName === 'diagonal') return parentComponent.getDiagonal();
        
        throw new Error('Invalid parent property name.');
    }

    /**
     * Build style array from subcomponents.
     */
    public getStyleArray(array: any): any {
        if (!this.#parentPropertyName) {
            throw new Error('No parent property name found.');
        }
        const styleArray: any = { borders: {} };
        styleArray.borders[this.#parentPropertyName] = array;
        return styleArray;
    }

    /**
     * Get Border style.
     */
    public getBorderStyle(): string {
        if (this.isSupervisor) {
            return this.getSharedComponent().getBorderStyle();
        }
        return this.#borderStyle;
    }

    /**
     * Set Border style.
     */
    public setBorderStyle(style: string | boolean): this {
        if (this.isSupervisor) {
            const styleArray = this.getStyleArray({ borderStyle: style });
            (this.parent as any).applyFromArray(styleArray);
        } else {
            if (!style) {
                this.#borderStyle = Border.BORDER_NONE;
            } else if (style === true) {
                this.#borderStyle = Border.BORDER_MEDIUM;
            } else {
                this.#borderStyle = style as string;
            }
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
        if (this.isSupervisor) {
            const styleArray = this.getStyleArray({ color: { argb: color.getARGB() } });
            (this.parent as any).applyFromArray(styleArray);
        } else {
            this.#color = color;
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

        if (styleArray.borderStyle !== undefined) {
            this.setBorderStyle(styleArray.borderStyle as string | boolean);
        }
        if (styleArray.color !== undefined && typeof styleArray.color === 'object') {
            this.getColor().applyFromArray(styleArray.color as { rgb?: string; argb?: string; theme?: number });
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
                this.#borderStyle +
                this.#color.getHashCode() +
                'Border'
            )
            .digest('hex');
    }
}
