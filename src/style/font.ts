import { createHash } from 'node:crypto';
import { countCharactersDbcs } from '../utils/string-helper.ts';
import { Alignment } from './alignment.ts';
import { Color } from './color.ts';
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

    public static readonly DEFAULT_COLUMN_WIDTHS: Record<
        string,
        Record<number, { px: number; width: number; height: number }>
    > = {
        Arial: {
            1: { px: 24, width: 12.0, height: 5.25 },
            2: { px: 24, width: 12.0, height: 5.25 },
            3: { px: 32, width: 10.6640625, height: 6.0 },
            4: { px: 32, width: 10.6640625, height: 6.75 },
            5: { px: 40, width: 10.0, height: 8.25 },
            6: { px: 48, width: 9.59765625, height: 8.25 },
            7: { px: 48, width: 9.59765625, height: 9.0 },
            8: { px: 56, width: 9.33203125, height: 11.25 },
            9: { px: 64, width: 9.140625, height: 12.0 },
            10: { px: 64, width: 9.140625, height: 12.75 },
        },
        Calibri: {
            1: { px: 24, width: 12.0, height: 5.25 },
            2: { px: 24, width: 12.0, height: 5.25 },
            3: { px: 32, width: 10.6640625, height: 6.0 },
            4: { px: 32, width: 10.6640625, height: 6.75 },
            5: { px: 40, width: 10.0, height: 8.25 },
            6: { px: 48, width: 9.59765625, height: 8.25 },
            7: { px: 48, width: 9.59765625, height: 9.0 },
            8: { px: 56, width: 9.33203125, height: 11.25 },
            9: { px: 56, width: 9.33203125, height: 12.0 },
            10: { px: 64, width: 9.140625, height: 12.75 },
            11: { px: 64, width: 9.140625, height: 15.0 },
        },
        Verdana: {
            1: { px: 24, width: 12.0, height: 5.25 },
            2: { px: 24, width: 12.0, height: 5.25 },
            3: { px: 32, width: 10.6640625, height: 6.0 },
            4: { px: 32, width: 10.6640625, height: 6.75 },
            5: { px: 40, width: 10.0, height: 8.25 },
            6: { px: 48, width: 9.59765625, height: 8.25 },
            7: { px: 48, width: 9.59765625, height: 9.0 },
            8: { px: 64, width: 9.140625, height: 10.5 },
            9: { px: 72, width: 9.0, height: 11.25 },
            10: { px: 72, width: 9.0, height: 12.75 },
        },
    };

    public static readonly DEFAULT_CALIBRI_11 = { px: 64, width: 9.140625, height: 15.0 };

    #name: string | null = 'Calibri';
    #size: number | null = 11;
    #bold: boolean | null = false;
    #italic: boolean | null = false;
    #superscript: boolean | null = false;
    #subscript: boolean | null = false;
    #underline: string | null = Font.UNDERLINE_NONE;
    #strikethrough: boolean | null = false;
    #color: Color;
    #autoColor: boolean = false;
    #scheme: string = '';

    // Chart and theme-specific font properties
    #cap: string = Font.CAP_NONE;
    #latin: string = '';
    #eastAsian: string = '';
    #complexScript: string = '';
    #baseLine: number = 0;
    #strikeType: string = '';

    constructor(isSupervisor: boolean = false, isConditional: boolean = false) {
        super(isSupervisor);
        if (isConditional) {
            this.#name = null;
            this.#size = null;
            this.#bold = null;
            this.#italic = null;
            this.#superscript = null;
            this.#subscript = null;
            this.#underline = null;
            this.#strikethrough = null;
        }
        this.#color = new Color(Color.COLOR_BLACK, isSupervisor, isConditional);
        // Bind for both supervisor and non-supervisor so Color knows its parent property.
        // Non-supervisor Color is still used by the supervisor chain for reading values.
        this.#color.bindParent(this, 'color');
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

    public getName(): string | null {
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
        }
        return this;
    }

    public getSize(): number | null {
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

    public getBold(): boolean | null {
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

    public getItalic(): boolean | null {
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

    public getSuperscript(): boolean | null {
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

    public getSubscript(): boolean | null {
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

    public getUnderline(): string | null {
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

    public getStrikethrough(): boolean | null {
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

    public getAutoColor(): boolean {
        if (this.isSupervisor) {
            return this.getSharedComponent().getAutoColor();
        }
        return this.#autoColor;
    }

    public setAutoColor(autoColor: boolean): this {
        if (this.isSupervisor) {
            const styleArray = this.getStyleArray({ autoColor });
            this.parent!.applyFromArray(styleArray);
        } else {
            this.#autoColor = autoColor;
        }
        return this;
    }

    public setHyperlinkTheme(): this {
        this.getColor().setHyperlinkTheme();
        this.setUnderline(Font.UNDERLINE_SINGLE);
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
        if (styleArray.autoColor !== undefined) {
            this.setAutoColor(Boolean(styleArray.autoColor));
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
                (this.#name ?? '') +
                    (this.#size ?? '') +
                    (this.#bold ? 't' : 'f') +
                    (this.#italic ? 't' : 'f') +
                    (this.#superscript ? 't' : 'f') +
                    (this.#subscript ? 't' : 'f') +
                    (this.#underline ?? '') +
                    (this.#strikethrough ? 't' : 'f') +
                    this.#color.getHashCode() +
                    this.#scheme +
                    this.#cap +
                    this.#latin +
                    this.#eastAsian +
                    this.#complexScript +
                    this.#baseLine +
                    this.#strikeType +
                    (this.#autoColor ? 't' : 'f') +
                    'Font',
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
        clone.#autoColor = this.#autoColor;
        return clone;
    }

    public static getDefaultColumnWidthByFont(font: Font, returnAsPixels: boolean = false): number {
        const name = font.getName() ?? 'Calibri';
        const size = Math.trunc(font.getSize() ?? 11);
        const mapping = Font.DEFAULT_COLUMN_WIDTHS[name]?.[size];
        if (mapping) {
            return returnAsPixels ? mapping.px : mapping.width;
        }
        const defaultMapping = Font.DEFAULT_COLUMN_WIDTHS.Calibri?.[11] ?? Font.DEFAULT_CALIBRI_11;
        const base = returnAsPixels ? defaultMapping.px : defaultMapping.width;
        const scaled = (base * size) / 11.0;
        return returnAsPixels ? Math.round(scaled) : scaled;
    }

    public static getDefaultRowHeightByFont(font: Font): number {
        const name = font.getName() ?? 'Calibri';
        const size = font.getSize() ?? 11;
        const mapping = Font.DEFAULT_COLUMN_WIDTHS[name]?.[Math.trunc(size)];
        if (mapping) {
            return mapping.height;
        }
        if (name === 'Arial' || name === 'Verdana') {
            const rowHeight = Font.DEFAULT_COLUMN_WIDTHS[name]?.[10]?.height ?? 12.75;
            return (rowHeight * size) / 10.0;
        }
        const calibriHeight = (Font.DEFAULT_COLUMN_WIDTHS.Calibri?.[11] ?? Font.DEFAULT_CALIBRI_11).height;
        return (calibriHeight * size) / 11.0;
    }

    public static calculateColumnWidth(
        font: Font,
        cellText: string,
        rotation: number,
        defaultFont: Font,
        filterAdjustment: boolean,
        indentAdjustment: number,
    ): number {
        if (cellText.includes('\n')) {
            let maxWidth = 0;
            for (const line of cellText.split('\n')) {
                maxWidth = Math.max(
                    maxWidth,
                    Font.calculateColumnWidth(font, line, 0, defaultFont, filterAdjustment, indentAdjustment),
                );
            }
            return maxWidth;
        }

        const adjustment = (filterAdjustment ? 3 : 1) + indentAdjustment * 2;
        const paddingText = 'n'.repeat(Math.max(0, adjustment));
        const cellWidth = Font.getTextWidthPixelsApprox(cellText, font, rotation);
        const paddingWidth = Font.getTextWidthPixelsApprox(paddingText, font, 0);
        const columnWidthPixels = cellWidth + paddingWidth;
        return Font.pixelsToCellDimension(columnWidthPixels, defaultFont);
    }

    public static getTextWidthPixelsApprox(text: string, font: Font, rotation: number): number {
        const name = font.getName() ?? 'Calibri';
        const size = font.getSize() ?? 11;
        const charCount = countCharactersDbcs(text);
        let width = 0;
        if (name === 'Arial' || name === 'Verdana') {
            width = 8 * charCount;
            width = (width * size) / 10.0;
        } else {
            width = 8.26 * charCount;
            width = (width * size) / 11.0;
        }

        if (rotation === Alignment.TEXTROTATION_STACK_PHPSPREADSHEET) {
            width = 4;
        } else if (rotation !== 0) {
            const angle = (rotation * Math.PI) / 180.0;
            width = width * Math.cos(angle) + (size * Math.abs(Math.sin(angle))) / 5.0;
        }

        return Math.round(width);
    }

    public static pixelsToCellDimension(pixelValue: number, defaultFont: Font): number {
        const name = defaultFont.getName() ?? 'Calibri';
        const size = Math.trunc(defaultFont.getSize() ?? 11);
        const mapping = Font.DEFAULT_COLUMN_WIDTHS[name]?.[size];
        if (mapping) {
            return (pixelValue * mapping.width) / mapping.px;
        }
        const defaultMapping = Font.DEFAULT_COLUMN_WIDTHS.Calibri?.[11] ?? Font.DEFAULT_CALIBRI_11;
        const scaledWidth = (defaultMapping.width * size) / 11.0;
        const scaledPx = (defaultMapping.px * size) / 11.0;
        return (pixelValue * scaledWidth) / scaledPx;
    }
}
