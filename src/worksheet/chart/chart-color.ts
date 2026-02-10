/**
 * ChartColor - represents a color for chart elements with support for
 * different color types (RGB, scheme, standard) and properties (alpha, brightness).
 *
 * Ported from PhpSpreadsheet Chart/ChartColor.php
 */

export const EXCEL_COLOR_TYPE_STANDARD = 'prstClr';
export const EXCEL_COLOR_TYPE_SCHEME = 'schemeClr';
export const EXCEL_COLOR_TYPE_RGB = 'srgbClr';

export const EXCEL_COLOR_TYPES = [EXCEL_COLOR_TYPE_RGB, EXCEL_COLOR_TYPE_SCHEME, EXCEL_COLOR_TYPE_STANDARD] as const;

export type ExcelColorType = (typeof EXCEL_COLOR_TYPES)[number];

export interface ChartColorProperties {
    value: string;
    type?: ExcelColorType;
    alpha?: number | null;
    brightness?: number | null;
}

export class ChartColor {
    #value: string = '';
    #type: ExcelColorType | '' = '';
    #alpha: number | null = null;
    #brightness: number | null = null;

    constructor(
        value: string | ChartColorProperties = '',
        alpha: number | null = null,
        type: ExcelColorType | null = null,
        brightness: number | null = null,
    ) {
        if (typeof value === 'object' && value !== null) {
            this.setColorPropertiesArray(value);
        } else {
            this.setColorProperties(value as string, alpha, type, brightness);
        }
    }

    public getValue(): string {
        return this.#value;
    }

    public setValue(value: string): this {
        this.#value = value;
        return this;
    }

    public getType(): ExcelColorType | '' {
        return this.#type;
    }

    public setType(type: ExcelColorType | ''): this {
        this.#type = type;
        return this;
    }

    public getAlpha(): number | null {
        return this.#alpha;
    }

    public setAlpha(alpha: number | null): this {
        this.#alpha = alpha;
        return this;
    }

    public getBrightness(): number | null {
        return this.#brightness;
    }

    public setBrightness(brightness: number | null): this {
        this.#brightness = brightness;
        return this;
    }

    public setColorProperties(
        color: string | null | undefined,
        alpha: number | string | null | undefined = null,
        type: ExcelColorType | null | undefined = null,
        brightness: number | string | null | undefined = null,
    ): this {
        if (!type && color) {
            if (color.startsWith('*')) {
                type = EXCEL_COLOR_TYPE_SCHEME;
                color = color.slice(1);
            } else if (color.startsWith('/')) {
                type = EXCEL_COLOR_TYPE_STANDARD;
                color = color.slice(1);
            } else if (/^[0-9A-Fa-f]{6}$/.test(color)) {
                type = EXCEL_COLOR_TYPE_RGB;
            }
        }

        if (color !== null && color !== undefined) {
            this.setValue(color);
        }
        if (type !== null && type !== undefined) {
            this.setType(type);
        }
        if (alpha === null || alpha === undefined) {
            this.setAlpha(null);
        } else if (typeof alpha === 'number') {
            this.setAlpha(alpha);
        } else if (typeof alpha === 'string') {
            const numAlpha = Number(alpha);
            if (!Number.isNaN(numAlpha)) {
                this.setAlpha(numAlpha);
            }
        }

        if (brightness === null || brightness === undefined) {
            this.setBrightness(null);
        } else if (typeof brightness === 'number') {
            this.setBrightness(brightness);
        } else if (typeof brightness === 'string') {
            const numBrightness = Number(brightness);
            if (!Number.isNaN(numBrightness)) {
                this.setBrightness(numBrightness);
            }
        }

        return this;
    }

    public setColorPropertiesArray(color: ChartColorProperties): this {
        return this.setColorProperties(color.value, color.alpha ?? null, color.type ?? null, color.brightness ?? null);
    }

    public isUsable(): boolean {
        return this.#type !== '' && this.#value !== '';
    }

    public getColorProperty(propertyName: 'value' | 'type' | 'alpha' | 'brightness'): string | number | null {
        switch (propertyName) {
            case 'value':
                return this.#value;
            case 'type':
                return this.#type;
            case 'alpha':
                return this.#alpha;
            case 'brightness':
                return this.#brightness;
            default:
                return null;
        }
    }

    public static alphaToXml(alpha: number): string {
        return `${100 - alpha}000`;
    }

    public static alphaFromXml(alpha: number | string): number {
        return 100 - Math.floor(Number(alpha) / 1000);
    }
}
