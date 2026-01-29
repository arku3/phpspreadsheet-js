import { createHash } from 'node:crypto';
import { Supervisor } from './supervisor.ts';
import { RgbTint } from './rgb-tint.ts';

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

    private static readonly INDEXED_COLORS: Record<number, string> = {
        1: 'FF000000', //  System Colour #1 - Black
        2: 'FFFFFFFF', //  System Colour #2 - White
        3: 'FFFF0000', //  System Colour #3 - Red
        4: 'FF00FF00', //  System Colour #4 - Green
        5: 'FF0000FF', //  System Colour #5 - Blue
        6: 'FFFFFF00', //  System Colour #6 - Yellow
        7: 'FFFF00FF', //  System Colour #7- Magenta
        8: 'FF00FFFF', //  System Colour #8- Cyan
        9: 'FF800000', //  Standard Colour #9
        10: 'FF008000', //  Standard Colour #10
        11: 'FF000080', //  Standard Colour #11
        12: 'FF808000', //  Standard Colour #12
        13: 'FF800080', //  Standard Colour #13
        14: 'FF008080', //  Standard Colour #14
        15: 'FFC0C0C0', //  Standard Colour #15
        16: 'FF808080', //  Standard Colour #16
        17: 'FF9999FF', //  Chart Fill Colour #17
        18: 'FF993366', //  Chart Fill Colour #18
        19: 'FFFFFFCC', //  Chart Fill Colour #19
        20: 'FFCCFFFF', //  Chart Fill Colour #20
        21: 'FF660066', //  Chart Fill Colour #21
        22: 'FFFF8080', //  Chart Fill Colour #22
        23: 'FF0066CC', //  Chart Fill Colour #23
        24: 'FFCCCCFF', //  Chart Fill Colour #24
        25: 'FF000080', //  Chart Line Colour #25
        26: 'FFFF00FF', //  Chart Line Colour #26
        27: 'FFFFFF00', //  Chart Line Colour #27
        28: 'FF00FFFF', //  Chart Line Colour #28
        29: 'FF800080', //  Chart Line Colour #29
        30: 'FF800000', //  Chart Line Colour #30
        31: 'FF008080', //  Chart Line Colour #31
        32: 'FF0000FF', //  Chart Line Colour #32
        33: 'FF00CCFF', //  Standard Colour #33
        34: 'FFCCFFFF', //  Standard Colour #34
        35: 'FFCCFFCC', //  Standard Colour #35
        36: 'FFFFFF99', //  Standard Colour #36
        37: 'FF99CCFF', //  Standard Colour #37
        38: 'FFFF99CC', //  Standard Colour #38
        39: 'FFCC99FF', //  Standard Colour #39
        40: 'FFFFCC99', //  Standard Colour #40
        41: 'FF3366FF', //  Standard Colour #41
        42: 'FF33CCCC', //  Standard Colour #42
        43: 'FF99CC00', //  Standard Colour #43
        44: 'FFFFCC00', //  Standard Colour #44
        45: 'FFFF9900', //  Standard Colour #45
        46: 'FFFF6600', //  Standard Colour #46
        47: 'FF666699', //  Standard Colour #47
        48: 'FF969696', //  Standard Colour #48
        49: 'FF003366', //  Standard Colour #49
        50: 'FF339966', //  Standard Colour #50
        51: 'FF003300', //  Standard Colour #51
        52: 'FF333300', //  Standard Colour #52
        53: 'FF993300', //  Standard Colour #53
        54: 'FF993366', //  Standard Colour #54
        55: 'FF333399', //  Standard Colour #55
        56: 'FF333333', //  Standard Colour #56
    };

    #argb: string;
    #theme: number = -1;
    #tint: number = 0;

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

    /**
     * Get theme color from workbook theme.
     */
    public getThemeColor(): string | null {
        if (this.#theme < 0) {
            return null;
        }

        let themeColors: string[] = [];
        const spreadsheet = (this.parent as any)?.getActiveSheet()?.getParent() || (this.parent as any)?.getParent();
        if (spreadsheet) {
            themeColors = spreadsheet.getTheme().getThemeColors();
        }

        if (themeColors[this.#theme]) {
            return themeColors[this.#theme]!;
        }

        return null;
    }

    /**
     * Resolve color to ARGB (considering theme and tint).
     */
    public resolveColor(): string {
        let argb = this.getARGB();
        const themeColor = this.getThemeColor();

        if (themeColor) {
            argb = themeColor;
        }

        if (this.#tint !== 0) {
            argb = Color.changeBrightness(argb, this.#tint);
        }

        return argb;
    }

    /**
     * Change brightness of a color.
     */
    public static changeBrightness(hexColorValue: string, adjustPercentage: number): string {
        const rgba = hexColorValue.length === 8;
        const percentage = Math.max(-1.0, Math.min(1.0, adjustPercentage));

        const red = parseInt(hexColorValue.substring(rgba ? 2 : 0, rgba ? 4 : 2), 16);
        const green = parseInt(hexColorValue.substring(rgba ? 4 : 2, rgba ? 6 : 4), 16);
        const blue = parseInt(hexColorValue.substring(rgba ? 6 : 4, rgba ? 8 : 6), 16);

        const tint = RgbTint.rgbAndTintToRgb(red, green, blue, percentage);
        return (rgba ? 'FF' : '') + tint;
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

    public getTint(): number {
        if (this.isSupervisor) {
            return this.getSharedComponent().getTint();
        }
        return this.#tint;
    }

    public setTint(tint: number): void {
        if (this.isSupervisor) {
            const styleArray = this.getStyleArray({ tint: tint });
            (this.parent as any).applyFromArray(styleArray);
        } else {
            this.#tint = tint;
        }
    }

    /**
     * Apply styles from array.
     *
     * @param styleArray Array containing style information
     */
    public applyFromArray(styleArray: { rgb?: string; argb?: string; theme?: number; tint?: number }): this {
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
        if (styleArray.tint !== undefined) {
            this.setTint(styleArray.tint);
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
            .update(this.#argb + this.#theme + this.#tint + 'Color')
            .digest('hex');
    }

    /**
     * Get indexed color.
     *
     * @param colorIndex Index entry point into the colour array
     * @param background Flag to indicate whether default background or foreground colour
     *                                            should be returned if the indexed colour doesn't exist
     * @param palette
     */
    public static indexedColor(colorIndex: number, background: boolean = false, palette?: string[]): Color {
        if (!palette || palette.length === 0) {
            if (Color.INDEXED_COLORS[colorIndex]) {
                return new Color(Color.INDEXED_COLORS[colorIndex]);
            }
        } else {
            if (palette[colorIndex]) {
                return new Color(palette[colorIndex]);
            }
        }

        return background ? new Color(Color.COLOR_WHITE) : new Color(Color.COLOR_BLACK);
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
