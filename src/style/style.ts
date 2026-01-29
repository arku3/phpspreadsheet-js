import { createHash } from 'node:crypto';
import { Alignment } from './alignment.ts';
import { Borders } from './borders.ts';
import { Fill } from './fill.ts';
import { Font } from './font.ts';
import { NumberFormat } from './number-format.ts';
import { Protection } from './protection.ts';
import { Supervisor } from './supervisor.ts';
import { Coordinate } from '../utils/coordinate.ts';

/**
 * Style class.
 */
export class Style extends Supervisor {
    /**
     * Font.
     */
    #font: Font;

    /**
     * Fill.
     */
    #fill: Fill;

    /**
     * Borders.
     */
    #borders: Borders;

    /**
     * Alignment.
     */
    #alignment: Alignment;

    /**
     * Number Format.
     */
    #numberFormat: NumberFormat;

    /**
     * Protection.
     */
    #protection: Protection;

    /**
     * Index of style in collection.
     */
    #index: number = 0;

    /**
     * Use Quote Prefix.
     */
    #quotePrefix: boolean = false;

    /**
     * Check Box.
     */
    #checkBox: boolean = false;

    /**
     * Create a new Style.
     */
    constructor(isSupervisor: boolean = false) {
        super(isSupervisor);
        this.#font = new Font(isSupervisor);
        this.#fill = new Fill(isSupervisor);
        this.#borders = new Borders(isSupervisor);
        this.#alignment = new Alignment(isSupervisor);
        this.#numberFormat = new NumberFormat(isSupervisor);
        this.#protection = new Protection();

        if (isSupervisor) {
            this.#font.bindParent(this);
            this.#fill.bindParent(this);
            this.#borders.bindParent(this);
            this.#alignment.bindParent(this);
            this.#numberFormat.bindParent(this);
        }
    }

    /**
     * Get shared component.
     */
    public getSharedComponent(): Style {
        if (!this.parent) {
            throw new Error('No parent found.');
        }

        const activeSheet = this.getActiveSheet();
        const coordinate = Style.getFirstCoordinateFromSelection(this.getSelectedCells());
        const cell = activeSheet.getCell(coordinate);
        return activeSheet.getParent().getCellXfByIndex(cell.getXfIndex());
    }

    /**
     * Build style array from subcomponents.
     */
    public getStyleArray(array: any): any {
        return array;
    }

    /**
     * Get Fill.
     */
    public getFill(): Fill {
        return this.#fill;
    }

    /**
     * Get Font.
     */
    public getFont(): Font {
        return this.#font;
    }

    /**
     * Set font.
     */
    public setFont(font: Font): this {
        this.#font = font;
        return this;
    }

    /**
     * Get Borders.
     */
    public getBorders(): Borders {
        return this.#borders;
    }

    /**
     * Get Alignment.
     */
    public getAlignment(): Alignment {
        return this.#alignment;
    }

    /**
     * Get Number Format.
     */
    public getNumberFormat(): NumberFormat {
        return this.#numberFormat;
    }

    /**
     * Get Protection.
     */
    public getProtection(): Protection {
        return this.#protection;
    }

    /**
     * Get quote prefix.
     */
    public getQuotePrefix(): boolean {
        if (this.isSupervisor) {
            return this.getSharedComponent().getQuotePrefix();
        }
        return this.#quotePrefix;
    }

    /**
     * Set quote prefix.
     */
    public setQuotePrefix(quotePrefix: boolean): this {
        if (this.isSupervisor) {
            this.applyFromArray({ quotePrefix });
        } else {
            this.#quotePrefix = quotePrefix;
        }
        return this;
    }

    /**
     * Get check box.
     */
    public getCheckBox(): boolean {
        if (this.isSupervisor) {
            return this.getSharedComponent().getCheckBox();
        }
        return this.#checkBox;
    }

    /**
     * Set check box.
     */
    public setCheckBox(checkBox: boolean): this {
        if (this.isSupervisor) {
            this.applyFromArray({ checkBox });
        } else {
            this.#checkBox = checkBox;
        }
        return this;
    }

    /**
     * Get index.
     */
    public getIndex(): number {
        if (this.isSupervisor) {
            return this.getSharedComponent().getIndex();
        }
        return this.#index;
    }

    /**
     * Set index.
     */
    public setIndex(index: number): this {
        this.#index = index;
        return this;
    }

    /**
     * Apply styles from array.
     *
     * @param styleArray Array containing style information
     */
    public applyFromArray(styleArray: Record<string, any>): this {
        if (this.isSupervisor) {
            this.applyFromArraySupervisor(styleArray);
            return this;
        }
        if (styleArray.fill !== undefined && typeof styleArray.fill === 'object') {
            this.getFill().applyFromArray(styleArray.fill);
        }
        if (styleArray.font !== undefined && typeof styleArray.font === 'object') {
            this.getFont().applyFromArray(styleArray.font);
        }
        if (styleArray.borders !== undefined && typeof styleArray.borders === 'object') {
            this.getBorders().applyFromArray(styleArray.borders);
        }
        if (styleArray.alignment !== undefined && typeof styleArray.alignment === 'object') {
            this.getAlignment().applyFromArray(styleArray.alignment);
        }
        if (styleArray.numberFormat !== undefined && typeof styleArray.numberFormat === 'object') {
            this.getNumberFormat().applyFromArray(styleArray.numberFormat);
        }
        if (styleArray.protection !== undefined && typeof styleArray.protection === 'object') {
            this.getProtection().applyFromArray(styleArray.protection);
        }
        if (styleArray.quotePrefix !== undefined) {
            this.setQuotePrefix(Boolean(styleArray.quotePrefix));
        }
        if (styleArray.checkBox !== undefined) {
            this.setCheckBox(Boolean(styleArray.checkBox));
        }
        return this;
    }

    private applyFromArraySupervisor(styleArray: Record<string, any>): void {
        const activeSheet = this.getActiveSheet();
        const workbook = activeSheet.getParent();
        const ranges = Style.splitRanges(this.getSelectedCells());

        for (const range of ranges) {
            const { startCol, startRow, endCol, endRow } = Style.normalizeRange(range);
            for (let row = startRow; row <= endRow; row++) {
                for (let col = startCol; col <= endCol; col++) {
                    const coordinate = Coordinate.stringFromCoordinate(col, row);
                    const cell = activeSheet.getCell(coordinate);
                    const oldStyle = workbook.getCellXfByIndex(cell.getXfIndex());
                    const newStyle = oldStyle.clone();
                    newStyle.applyFromArray(styleArray);

                    const existing = workbook.getCellXfByHashCode(newStyle.getHashCode());
                    const newIndex = existing === false ? this.addStyleToWorkbook(workbook, newStyle) : existing.getIndex();
                    cell.setXfIndex(newIndex);
                }
            }
        }
    }

    private addStyleToWorkbook(workbook: { addCellXf: (style: Style) => void }, style: Style): number {
        workbook.addCellXf(style);
        return style.getIndex();
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
                this.#fill.getHashCode() +
                this.#font.getHashCode() +
                this.#borders.getHashCode() +
                this.#alignment.getHashCode() +
                this.#numberFormat.getHashCode() +
                this.#protection.getHashCode() +
                (this.#quotePrefix ? 't' : 'f') +
                (this.#checkBox ? 't' : 'f') +
                'Style'
            )
            .digest('hex');
    }

    public clone(): Style {
        const style = new Style();
        style.applyFromArray(this.exportArray());
        const builtInFormatCode = this.getNumberFormat().getBuiltInFormatCode();
        if (builtInFormatCode !== false) {
            style.getNumberFormat().setBuiltInFormatCode(builtInFormatCode);
        }
        return style;
    }

    private exportArray(): Record<string, unknown> {
        const font = this.getFont();
        const fill = this.getFill();
        const borders = this.getBorders();
        const alignment = this.getAlignment();
        const numberFormat = this.getNumberFormat();
        const protection = this.getProtection();

        return {
            fill: {
                fillType: fill.getFillType(),
                rotation: fill.getRotation(),
                startColor: {
                    argb: fill.getStartColor().getARGB(),
                    theme: fill.getStartColor().getTheme(),
                    tint: fill.getStartColor().getTint(),
                },
                endColor: {
                    argb: fill.getEndColor().getARGB(),
                    theme: fill.getEndColor().getTheme(),
                    tint: fill.getEndColor().getTint(),
                },
            },
            font: {
                name: font.getName(),
                size: font.getSize(),
                bold: font.getBold(),
                italic: font.getItalic(),
                superscript: font.getSuperscript(),
                subscript: font.getSubscript(),
                underline: font.getUnderline(),
                strikethrough: font.getStrikethrough(),
                color: {
                    argb: font.getColor().getARGB(),
                    theme: font.getColor().getTheme(),
                    tint: font.getColor().getTint(),
                },
                scheme: font.getScheme(),
            },
            borders: {
                left: {
                    borderStyle: borders.getLeft().getBorderStyle(),
                    color: {
                        argb: borders.getLeft().getColor().getARGB(),
                        theme: borders.getLeft().getColor().getTheme(),
                        tint: borders.getLeft().getColor().getTint(),
                    },
                },
                right: {
                    borderStyle: borders.getRight().getBorderStyle(),
                    color: {
                        argb: borders.getRight().getColor().getARGB(),
                        theme: borders.getRight().getColor().getTheme(),
                        tint: borders.getRight().getColor().getTint(),
                    },
                },
                top: {
                    borderStyle: borders.getTop().getBorderStyle(),
                    color: {
                        argb: borders.getTop().getColor().getARGB(),
                        theme: borders.getTop().getColor().getTheme(),
                        tint: borders.getTop().getColor().getTint(),
                    },
                },
                bottom: {
                    borderStyle: borders.getBottom().getBorderStyle(),
                    color: {
                        argb: borders.getBottom().getColor().getARGB(),
                        theme: borders.getBottom().getColor().getTheme(),
                        tint: borders.getBottom().getColor().getTint(),
                    },
                },
                diagonal: {
                    borderStyle: borders.getDiagonal().getBorderStyle(),
                    color: {
                        argb: borders.getDiagonal().getColor().getARGB(),
                        theme: borders.getDiagonal().getColor().getTheme(),
                        tint: borders.getDiagonal().getColor().getTint(),
                    },
                },
                diagonalDirection: borders.getDiagonalDirection(),
            },
            alignment: {
                horizontal: alignment.getHorizontal(),
                vertical: alignment.getVertical(),
                textRotation: alignment.getTextRotation(),
                wrapText: alignment.getWrapText(),
                shrinkToFit: alignment.getShrinkToFit(),
                indent: alignment.getIndent(),
                readOrder: alignment.getReadOrder(),
                justifyLastLine: alignment.getJustifyLastLine(),
            },
            numberFormat: {
                formatCode: numberFormat.getFormatCode(),
            },
            protection: {
                locked: protection.getLocked(),
                hidden: protection.getHidden(),
            },
            quotePrefix: this.getQuotePrefix(),
            checkBox: this.getCheckBox(),
        };
    }

    private static splitRanges(selection: string): string[] {
        return selection
            .split(/[\s,]+/)
            .map(range => range.trim())
            .filter(range => range.length > 0);
    }

    private static getFirstCoordinateFromSelection(selection: string): string {
        const ranges = Style.splitRanges(selection);
        const first = ranges[0] ?? 'A1';
        if (first.includes(':')) {
            return first.split(':')[0]!.toUpperCase();
        }
        return first.toUpperCase();
    }

    private static normalizeRange(range: string): { startCol: number; startRow: number; endCol: number; endRow: number } {
        const parts = range.split(':');
        const start = parts[0] ?? 'A1';
        const end = parts[1] ?? start;

        const [startColRaw, startRowRaw] = Coordinate.coordinateFromString(start);
        const [endColRaw, endRowRaw] = Coordinate.coordinateFromString(end);

        const startCol = Math.min(startColRaw, endColRaw);
        const endCol = Math.max(startColRaw, endColRaw);
        const startRow = Math.min(startRowRaw, endRowRaw);
        const endRow = Math.max(startRowRaw, endRowRaw);

        return { startCol, startRow, endCol, endRow };
    }
}
