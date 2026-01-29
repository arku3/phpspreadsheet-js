import { createHash } from 'node:crypto';
import { Supervisor } from './supervisor.ts';

/**
 * Color style.
 */
export class Color extends Supervisor {
    public static readonly COLOR_BLACK = 'FF000000';
    public static readonly COLOR_WHITE = 'FFFFFFFF';
    public static readonly COLOR_RED = 'FFFF0000';
    public static readonly COLOR_DARKRED = 'FF800000';
    public static readonly COLOR_BLUE = 'FF0000FF';
    public static readonly COLOR_DARKBLUE = 'FF000080';
    public static readonly COLOR_GREEN = 'FF00FF00';
    public static readonly COLOR_DARKGREEN = 'FF008000';
    public static readonly COLOR_YELLOW = 'FFFFFF00';
    public static readonly COLOR_DARKYELLOW = 'FF808000';
    public static readonly COLOR_MAGENTA = 'FFFF00FF';
    public static readonly COLOR_CYAN = 'FF00FFFF';

    public static readonly NAMED_COLOR_TRANSLATIONS: Record<string, string> = {
        'Black': Color.COLOR_BLACK,
        'White': Color.COLOR_WHITE,
        'Red': Color.COLOR_RED,
        'Green': Color.COLOR_GREEN,
        'Blue': Color.COLOR_BLUE,
        'Yellow': Color.COLOR_YELLOW,
        'Magenta': Color.COLOR_MAGENTA,
        'Cyan': Color.COLOR_CYAN,
    };

    #argb: string;
    #theme: number = -1;

    constructor(colorValue: string = Color.COLOR_BLACK, isSupervisor: boolean = false) {
        super(isSupervisor);
        this.#argb = this.validateColor(colorValue);
    }

    /**
     * Get shared component.
     */
    public getSharedComponent(): Color {
        if (!this.parent) {
            throw new Error('No parent found.');
        }
        return (this.parent as any).getSharedComponent().getColor();
    }

    /**
     * Build style array from subcomponents.
     */
    public getStyleArray(array: any): any {
        if (!this.parent) {
            throw new Error('No parent found.');
        }
        const key = (this as any).parentPropertyName || 'color';
        const obj: any = {};
        obj[key] = array;
        return (this.parent as any).getStyleArray(obj);
    }

    private validateColor(colorValue: string): string {
        if (!colorValue) {
            return Color.COLOR_BLACK;
        }

        const named = colorValue.charAt(0).toUpperCase() + colorValue.slice(1).toLowerCase();
        if (Color.NAMED_COLOR_TRANSLATIONS[named]) {
            return Color.NAMED_COLOR_TRANSLATIONS[named]!;
        }

        if (/^[A-F0-9]{8}$/i.test(colorValue)) {
            return colorValue.toUpperCase();
        }

        if (/^[A-F0-9]{6}$/i.test(colorValue)) {
            return 'FF' + colorValue.toUpperCase();
        }

        return Color.COLOR_BLACK;
    }

    public getARGB(): string {
        if (this.isSupervisor) {
            return this.getSharedComponent().getARGB();
        }
        return this.#argb;
    }

    public setARGB(colorValue: string = Color.COLOR_BLACK): void {
        if (this.isSupervisor) {
            const styleArray = this.getStyleArray({ argb: colorValue });
            (this.parent as any).applyFromArray(styleArray);
        } else {
            this.#argb = this.validateColor(colorValue);
        }
    }

    public getRGB(): string {
        return this.getARGB().substring(2);
    }

    public setRGB(colorValue: string = Color.COLOR_BLACK): void {
        this.setARGB(colorValue);
    }

    public getTheme(): number {
        if (this.isSupervisor) {
            return this.getSharedComponent().getTheme();
        }
        return this.#theme;
    }

    public setTheme(theme: number): void {
        if (this.isSupervisor) {
            const styleArray = this.getStyleArray({ theme: theme });
            (this.parent as any).applyFromArray(styleArray);
        } else {
            this.#theme = theme;
        }
    }

    /**
     * Apply styles from array.
     *
     * @param styleArray Array containing style information
     */
    public applyFromArray(styleArray: { rgb?: string; argb?: string; theme?: number }): this {
        if (this.isSupervisor) {
            const styleArrayLocal = this.getStyleArray(styleArray);
            (this.parent as any).applyFromArray(styleArrayLocal);
            return this;
        }

        if (styleArray.rgb !== undefined) {
            this.setRGB(styleArray.rgb);
        }
        if (styleArray.argb !== undefined) {
            this.setARGB(styleArray.argb);
        }
        if (styleArray.theme !== undefined) {
            this.setTheme(styleArray.theme);
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
            .update(this.#argb + this.#theme + 'Color')
            .digest('hex');
    }

    /**
     * Implement cloning.
     */
    public clone(): Color {
        const clone = new Color(this.#argb, this.isSupervisor);
        clone.#theme = this.#theme;
        return clone;
    }
}
