import { Color } from './color.ts';
import { createHash } from 'node:crypto';
import { Supervisor } from './supervisor.ts';

/**
 * Font style.
 */
export class Font extends Supervisor {
    public static readonly UNDERLINE_NONE = 'none';
    public static readonly UNDERLINE_DOUBLE = 'double';
    public static readonly UNDERLINE_DOUBLEACCOUNTING = 'doubleAccounting';
    public static readonly UNDERLINE_SINGLE = 'single';
    public static readonly UNDERLINE_SINGLEACCOUNTING = 'singleAccounting';

    // Capitalization constants
    public static readonly CAP_ALL = 'all';
    public static readonly CAP_SMALL = 'small';
    public static readonly CAP_NONE = 'none';

    #name: string = 'Calibri';
    #size: number = 11;
    #bold: boolean = false;
    #italic: boolean = false;
    #superscript: boolean = false;
    #subscript: boolean = false;
    #underline: string = Font.UNDERLINE_NONE;
    #strikethrough: boolean = false;
    #color: Color;
    #scheme: string = '';
    
    // Chart and theme-specific font properties
    #cap: string = Font.CAP_NONE;
    #latin: string = '';
    #eastAsian: string = '';
    #complexScript: string = '';
    #baseLine: number = 0;
    #strikeType: string = '';

    constructor(isSupervisor: boolean = false) {
        super(isSupervisor);
        this.#color = new Color(Color.COLOR_BLACK, isSupervisor);
        if (isSupervisor) {
            this.#color.bindParent(this, 'color');
        }
    }

    /**
     * Get shared component.
     */
    public getSharedComponent(): Font {
        if (!this.parent) {
            throw new Error('No parent found.');
        }
        return this.parent.getSharedComponent().getFont();
    }

    /**
     * Build style array from subcomponents.
     */
    public getStyleArray(array: any): any {
        return { font: array };
    }

    public getName(): string {
        if (this.isSupervisor) {
            return this.getSharedComponent().getName();
        }
        return this.#name;
    }

    public setName(name: string): this {
        if (this.isSupervisor) {
            const styleArray = this.getStyleArray({ name: name });
            this.parent!.applyFromArray(styleArray);
        } else {
            this.#name = name || 'Calibri';
            this.#scheme = '';
        }
        return this;
    }

    public getSize(): number {
        if (this.isSupervisor) {
            return this.getSharedComponent().getSize();
        }
        return this.#size;
    }

    public setSize(size: number): this {
        if (this.isSupervisor) {
            const styleArray = this.getStyleArray({ size: size });
            this.parent!.applyFromArray(styleArray);
        } else {
            this.#size = size > 0 ? size : 10;
        }
        return this;
    }

    public getBold(): boolean {
        if (this.isSupervisor) {
            return this.getSharedComponent().getBold();
        }
        return this.#bold;
    }

    public setBold(bold: boolean): this {
        if (this.isSupervisor) {
            const styleArray = this.getStyleArray({ bold: bold });
            this.parent!.applyFromArray(styleArray);
        } else {
            this.#bold = bold;
        }
        return this;
    }

    public getItalic(): boolean {
        if (this.isSupervisor) {
            return this.getSharedComponent().getItalic();
        }
        return this.#italic;
    }

    public setItalic(italic: boolean): this {
        if (this.isSupervisor) {
            const styleArray = this.getStyleArray({ italic: italic });
            this.parent!.applyFromArray(styleArray);
        } else {
            this.#italic = italic;
        }
        return this;
    }

    public getSuperscript(): boolean {
        if (this.isSupervisor) {
            return this.getSharedComponent().getSuperscript();
        }
        return this.#superscript;
    }

    public setSuperscript(superscript: boolean): this {
        if (this.isSupervisor) {
            const styleArray = this.getStyleArray({ superscript: superscript });
            this.parent!.applyFromArray(styleArray);
        } else {
            this.#superscript = superscript;
            if (superscript) {
                this.#subscript = false;
            }
        }
        return this;
    }

    public getSubscript(): boolean {
        if (this.isSupervisor) {
            return this.getSharedComponent().getSubscript();
        }
        return this.#subscript;
    }

    public setSubscript(subscript: boolean): this {
        if (this.isSupervisor) {
            const styleArray = this.getStyleArray({ subscript: subscript });
            this.parent!.applyFromArray(styleArray);
        } else {
            this.#subscript = subscript;
            if (subscript) {
                this.#superscript = false;
            }
        }
        return this;
    }

    public getUnderline(): string {
        if (this.isSupervisor) {
            return this.getSharedComponent().getUnderline();
        }
        return this.#underline;
    }

    public setUnderline(underline: string): this {
        if (this.isSupervisor) {
            const styleArray = this.getStyleArray({ underline: underline });
            this.parent!.applyFromArray(styleArray);
        } else {
            this.#underline = underline || Font.UNDERLINE_NONE;
        }
        return this;
    }

    public getStrikethrough(): boolean {
        if (this.isSupervisor) {
            return this.getSharedComponent().getStrikethrough();
        }
        return this.#strikethrough;
    }

    public setStrikethrough(strikethrough: boolean): this {
        if (this.isSupervisor) {
            const styleArray = this.getStyleArray({ strikethrough: strikethrough });
            this.parent!.applyFromArray(styleArray);
        } else {
            this.#strikethrough = strikethrough;
        }
        return this;
    }

    public getColor(): Color {
        return this.#color;
    }

    public setColor(color: Color): this {
        if (this.isSupervisor) {
            const styleArray = this.getStyleArray({ color: { argb: color.getARGB() } });
            this.parent!.applyFromArray(styleArray);
        } else {
            this.#color = color;
        }
        return this;
    }

    public getScheme(): string {
        if (this.isSupervisor) {
            return this.getSharedComponent().getScheme();
        }
        return this.#scheme;
    }

    public setScheme(scheme: string): this {
        if (this.isSupervisor) {
            const styleArray = this.getStyleArray({ scheme: scheme });
            this.parent!.applyFromArray(styleArray);
        } else {
            this.#scheme = scheme;
        }
        return this;
    }

    // Chart and theme-specific font properties

    public getCap(): string {
        if (this.isSupervisor) {
            return this.getSharedComponent().getCap();
        }
        return this.#cap;
    }

    public setCap(cap: string): this {
        if (this.isSupervisor) {
            const styleArray = this.getStyleArray({ cap: cap });
            this.parent!.applyFromArray(styleArray);
        } else {
            this.#cap = cap || Font.CAP_NONE;
        }
        return this;
    }

    public getLatin(): string {
        if (this.isSupervisor) {
            return this.getSharedComponent().getLatin();
        }
        return this.#latin;
    }

    public setLatin(latin: string): this {
        if (this.isSupervisor) {
            const styleArray = this.getStyleArray({ latin: latin });
            this.parent!.applyFromArray(styleArray);
        } else {
            this.#latin = latin;
        }
        return this;
    }

    public getEastAsian(): string {
        if (this.isSupervisor) {
            return this.getSharedComponent().getEastAsian();
        }
        return this.#eastAsian;
    }

    public setEastAsian(eastAsian: string): this {
        if (this.isSupervisor) {
            const styleArray = this.getStyleArray({ eastAsian: eastAsian });
            this.parent!.applyFromArray(styleArray);
        } else {
            this.#eastAsian = eastAsian;
        }
        return this;
    }

    public getComplexScript(): string {
        if (this.isSupervisor) {
            return this.getSharedComponent().getComplexScript();
        }
        return this.#complexScript;
    }

    public setComplexScript(complexScript: string): this {
        if (this.isSupervisor) {
            const styleArray = this.getStyleArray({ complexScript: complexScript });
            this.parent!.applyFromArray(styleArray);
        } else {
            this.#complexScript = complexScript;
        }
        return this;
    }

    public getBaseLine(): number {
        if (this.isSupervisor) {
            return this.getSharedComponent().getBaseLine();
        }
        return this.#baseLine;
    }

    public setBaseLine(baseLine: number): this {
        if (this.isSupervisor) {
            const styleArray = this.getStyleArray({ baseLine: baseLine });
            this.parent!.applyFromArray(styleArray);
        } else {
            this.#baseLine = baseLine;
        }
        return this;
    }

    public getStrikeType(): string {
        if (this.isSupervisor) {
            return this.getSharedComponent().getStrikeType();
        }
        return this.#strikeType;
    }

    public setStrikeType(strikeType: string): this {
        if (this.isSupervisor) {
            const styleArray = this.getStyleArray({ strikeType: strikeType });
            this.parent!.applyFromArray(styleArray);
        } else {
            this.#strikeType = strikeType;
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
            this.parent!.applyFromArray(styleArrayLocal);
            return this;
        }

        if (styleArray.name !== undefined) {
            this.setName(String(styleArray.name));
        }
        if (styleArray.bold !== undefined) {
            this.setBold(Boolean(styleArray.bold));
        }
        if (styleArray.italic !== undefined) {
            this.setItalic(Boolean(styleArray.italic));
        }
        if (styleArray.superscript !== undefined) {
            this.setSuperscript(Boolean(styleArray.superscript));
        }
        if (styleArray.subscript !== undefined) {
            this.setSubscript(Boolean(styleArray.subscript));
        }
        if (styleArray.underline !== undefined) {
            this.setUnderline(String(styleArray.underline));
        }
        if (styleArray.strikethrough !== undefined) {
            this.setStrikethrough(Boolean(styleArray.strikethrough));
        }
        if (styleArray.color !== undefined && typeof styleArray.color === 'object') {
            this.getColor().applyFromArray(styleArray.color as { rgb?: string; argb?: string; theme?: number });
        }
        if (styleArray.size !== undefined) {
            this.setSize(Number(styleArray.size));
        }
        if (styleArray.scheme !== undefined) {
            this.setScheme(String(styleArray.scheme));
        }
        if (styleArray.cap !== undefined) {
            this.setCap(String(styleArray.cap));
        }
        if (styleArray.latin !== undefined) {
            this.setLatin(String(styleArray.latin));
        }
        if (styleArray.eastAsian !== undefined) {
            this.setEastAsian(String(styleArray.eastAsian));
        }
        if (styleArray.complexScript !== undefined) {
            this.setComplexScript(String(styleArray.complexScript));
        }
        if (styleArray.baseLine !== undefined) {
            this.setBaseLine(Number(styleArray.baseLine));
        }
        if (styleArray.strikeType !== undefined) {
            this.setStrikeType(String(styleArray.strikeType));
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
                this.#name +
                this.#size +
                (this.#bold ? 't' : 'f') +
                (this.#italic ? 't' : 'f') +
                (this.#superscript ? 't' : 'f') +
                (this.#subscript ? 't' : 'f') +
                this.#underline +
                (this.#strikethrough ? 't' : 'f') +
                this.#color.getHashCode() +
                this.#scheme +
                this.#cap +
                this.#latin +
                this.#eastAsian +
                this.#complexScript +
                this.#baseLine +
                this.#strikeType +
                'Font'
            )
            .digest('hex');
    }

    /**
     * Implement cloning.
     */
    public clone(): Font {
        const clone = new Font(this.isSupervisor);
        clone.#name = this.#name;
        clone.#size = this.#size;
        clone.#bold = this.#bold;
        clone.#italic = this.#italic;
        clone.#superscript = this.#superscript;
        clone.#subscript = this.#subscript;
        clone.#underline = this.#underline;
        clone.#strikethrough = this.#strikethrough;
        clone.#color = this.#color.clone();
        clone.#scheme = this.#scheme;
        clone.#cap = this.#cap;
        clone.#latin = this.#latin;
        clone.#eastAsian = this.#eastAsian;
        clone.#complexScript = this.#complexScript;
        clone.#baseLine = this.#baseLine;
        clone.#strikeType = this.#strikeType;
        return clone;
    }
}
