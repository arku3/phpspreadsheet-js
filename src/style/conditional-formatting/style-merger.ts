import { Border } from '../border.ts';
import { Borders } from '../borders.ts';
import { Fill } from '../fill.ts';
import { Font } from '../font.ts';
import { Style } from '../style.ts';

export class StyleMerger {
    protected baseStyle: Style;

    constructor(baseStyle: Style) {
        // Setting to baseStyle sometimes causes problems later on.
        // In PHP they use exportArray/applyFromArray to clone.
        this.baseStyle = baseStyle.clone();
    }

    public getStyle(): Style {
        return this.baseStyle;
    }

    public mergeStyle(style: Style): void {
        if (style.getNumberFormat().getFormatCode() !== null) {
            this.baseStyle
                .getNumberFormat()
                .setFormatCode(style.getNumberFormat().getFormatCode()!);
        }
        this.mergeFontStyle(this.baseStyle.getFont(), style.getFont());
        this.mergeFillStyle(this.baseStyle.getFill(), style.getFill());
        this.mergeBordersStyle(this.baseStyle.getBorders(), style.getBorders());
    }

    protected mergeFontStyle(baseFontStyle: Font, fontStyle: Font): void {
        if (fontStyle.getBold() !== null) {
            baseFontStyle.setBold(fontStyle.getBold());
        }
        if (fontStyle.getItalic() !== null) {
            baseFontStyle.setItalic(fontStyle.getItalic());
        }
        if (fontStyle.getStrikethrough() !== null) {
            baseFontStyle.setStrikethrough(fontStyle.getStrikethrough());
        }
        if (fontStyle.getUnderline() !== null) {
            baseFontStyle.setUnderline(fontStyle.getUnderline());
        }
        if (fontStyle.getColor().getARGB() !== null || fontStyle.getColor().getTheme() >= 0) {
            baseFontStyle.setColor(fontStyle.getColor());
        }
    }

    protected mergeFillStyle(baseFillStyle: Fill, fillStyle: Fill): void {
        if (fillStyle.getFillType() !== null) {
            baseFillStyle.setFillType(fillStyle.getFillType());
        }
        baseFillStyle.setRotation(fillStyle.getRotation());
        if (
            fillStyle.getStartColor().getARGB() !== null ||
            fillStyle.getStartColor().getTheme() >= 0
        ) {
            baseFillStyle.setStartColor(fillStyle.getStartColor());
        }
        if (fillStyle.getEndColor().getARGB() !== null || fillStyle.getEndColor().getTheme() >= 0) {
            baseFillStyle.setEndColor(fillStyle.getEndColor());
        }
    }

    protected mergeBordersStyle(baseBordersStyle: Borders, bordersStyle: Borders): void {
        this.mergeBorderStyle(baseBordersStyle.getTop(), bordersStyle.getTop());
        this.mergeBorderStyle(baseBordersStyle.getBottom(), bordersStyle.getBottom());
        this.mergeBorderStyle(baseBordersStyle.getLeft(), bordersStyle.getLeft());
        this.mergeBorderStyle(baseBordersStyle.getRight(), bordersStyle.getRight());
    }

    protected mergeBorderStyle(baseBorderStyle: Border, borderStyle: Border): void {
        if (borderStyle.getBorderStyle() !== 'omit') {
            baseBorderStyle.setBorderStyle(borderStyle.getBorderStyle());
        }
        if (borderStyle.getColor().getARGB() !== null || borderStyle.getColor().getTheme() >= 0) {
            baseBorderStyle.setColor(borderStyle.getColor());
        }
    }
}
