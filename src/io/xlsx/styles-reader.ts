import type { XlsxReader } from '../xlsx-reader.ts';
import { ReaderPart } from './reader-part.ts';
import { Style } from '../../style/style.ts';
import { Font } from '../../style/font.ts';
import { Fill } from '../../style/fill.ts';
import { Borders } from '../../style/borders.ts';
import { Border } from '../../style/border.ts';
import { Alignment } from '../../style/alignment.ts';
import { NumberFormat } from '../../style/number-format.ts';

/**
 * Style data structure for parsed styles.
 */
export interface StyleData {
    numFmts: Map<number, string>; // numFmtId -> formatCode
    fonts: Font[];
    fills: Fill[];
    borders: Borders[];
    cellStyleXfs: Style[]; // Named styles
    cellXfs: Style[]; // Cell styles (these are applied to cells)
}

/**
 * Xlsx Styles reader.
 */
export class StylesReader extends ReaderPart {
    /**
     * Parse styles.xml and return style data.
     */
    public async readStyles(xmlContent: string): Promise<StyleData> {
        const styles: StyleData = {
            numFmts: new Map(),
            fonts: [],
            fills: [],
            borders: [],
            cellStyleXfs: [],
            cellXfs: []
        };

        // Parse number formats
        const numFmtMatches = xmlContent.matchAll(/<numFmt[^>]*numFmtId="(\d+)"[^>]*formatCode="([^"]*)"/g);
        for (const match of numFmtMatches) {
            const id = parseInt(match[1]!, 10);
            const formatCode = match[2]!;
            styles.numFmts.set(id, formatCode);
        }

        // Parse fonts
        const fontMatches = xmlContent.matchAll(/<font>([\s\S]*?)<\/font>/g);
        for (const match of fontMatches) {
            const fontContent = match[1]!;
            const font = this.parseFont(fontContent);
            styles.fonts.push(font);
        }

        // Parse fills
        const fillMatches = xmlContent.matchAll(/<fill>([\s\S]*?)<\/fill>/g);
        for (const match of fillMatches) {
            const fillContent = match[1]!;
            const fill = this.parseFill(fillContent);
            styles.fills.push(fill);
        }

        // Parse borders
        const borderMatches = xmlContent.matchAll(/<border[^>]*>([\s\S]*?)<\/border>/g);
        for (const match of borderMatches) {
            const borderContent = match[1]!;
            const borders = this.parseBorders(borderContent);
            styles.borders.push(borders);
        }

        // Parse cellStyleXfs (named styles)
        const cellStyleXfsSection = xmlContent.match(/<cellStyleXfs[^>]*>([\s\S]*?)<\/cellStyleXfs>/);
        if (cellStyleXfsSection && cellStyleXfsSection[1]) {
            const xfMatches = cellStyleXfsSection[1].matchAll(/<xf[^>]*>([\s\S]*?)<\/xf>/g);
            for (const match of xfMatches) {
                const xfTag = match[0]!;
                const xfContent = match[1]!;
                const style = this.parseCellXf(xfTag, xfContent, styles);
                styles.cellStyleXfs.push(style);
            }
        }

        // Parse cellXfs (cell styles)
        const cellXfsSection = xmlContent.match(/<cellXfs[^>]*>([\s\S]*?)<\/cellXfs>/);
        if (cellXfsSection && cellXfsSection[1]) {
            const xfMatches = cellXfsSection[1].matchAll(/<xf[^>]*>([\s\S]*?)<\/xf>/g);
            for (const match of xfMatches) {
                const xfTag = match[0]!;
                const xfContent = match[1]!;
                const style = this.parseCellXf(xfTag, xfContent, styles);
                styles.cellXfs.push(style);
            }
        }

        return styles;
    }

    /**
     * Parse font from XML content.
     */
    private parseFont(fontContent: string): Font {
        const font = new Font();

        // Parse name
        const nameMatch = fontContent.match(/<name[^>]*val="([^"]*)"/);
        if (nameMatch) {
            font.setName(nameMatch[1]!);
        }

        // Parse size
        const sizeMatch = fontContent.match(/<sz[^>]*val="([^"]*)"/);
        if (sizeMatch) {
            font.setSize(parseFloat(sizeMatch[1]!));
        }

        // Parse bold
        const boldTagMatch = fontContent.match(/<b(?:[^>]*)\/>/);
        if (boldTagMatch) {
            const isFalse = /val="0"/.test(boldTagMatch[0]);
            font.setBold(!isFalse);
        }

        // Parse italic
        const italicTagMatch = fontContent.match(/<i(?:[^>]*)\/>/);
        if (italicTagMatch) {
            const isFalse = /val="0"/.test(italicTagMatch[0]);
            font.setItalic(!isFalse);
        }

        // Parse underline
        const underlineMatch = fontContent.match(/<u[^>]*val="([^"]*)"/);
        if (underlineMatch) {
            font.setUnderline(underlineMatch[1]!);
        } else if (fontContent.includes('<u/>')) {
            font.setUnderline(Font.UNDERLINE_SINGLE);
        }

        // Parse strikethrough
        const strikeTagMatch = fontContent.match(/<strike(?:[^>]*)\/>/);
        if (strikeTagMatch) {
            const isFalse = /val="0"/.test(strikeTagMatch[0]);
            font.setStrikethrough(!isFalse);
        }

        // Parse color
        const colorMatch = fontContent.match(/<color[^>]*rgb="([^"]*)"/);
        if (colorMatch) {
            font.getColor().setARGB(colorMatch[1]!);
        }

        // Parse superscript/subscript
        const vertAlignMatch = fontContent.match(/<vertAlign[^>]*val="([^"]*)"/);
        if (vertAlignMatch) {
            if (vertAlignMatch[1] === 'superscript') {
                font.setSuperscript(true);
            } else if (vertAlignMatch[1] === 'subscript') {
                font.setSubscript(true);
            }
        }

        return font;
    }

    /**
     * Parse fill from XML content.
     */
    private parseFill(fillContent: string): Fill {
        const fill = new Fill();

        // Check for pattern fill
        const patternMatch = fillContent.match(/<patternFill[^>]*patternType="([^"]*)"/);
        if (patternMatch) {
            fill.setFillType(patternMatch[1]!);

            // Parse foreground color
            const fgColorMatch = fillContent.match(/<fgColor[^>]*rgb="([^"]*)"/);
            if (fgColorMatch) {
                fill.getStartColor().setARGB(fgColorMatch[1]!);
            }

            // Parse background color
            const bgColorMatch = fillContent.match(/<bgColor[^>]*rgb="([^"]*)"/);
            if (bgColorMatch) {
                fill.getEndColor().setARGB(bgColorMatch[1]!);
            }
        }

        return fill;
    }

    /**
     * Parse borders from XML content.
     */
    private parseBorders(borderContent: string): Borders {
        const borders = new Borders();

        // Parse left border
        const leftMatch = borderContent.match(/<left[^>]*>([\s\S]*?)<\/left>/);
        if (leftMatch) {
            const leftBorder = this.parseBorder(leftMatch[0]!);
            borders.getLeft().applyFromArray({
                borderStyle: leftBorder.getBorderStyle(),
                color: { argb: leftBorder.getColor().getARGB() }
            });
        }

        // Parse right border
        const rightMatch = borderContent.match(/<right[^>]*>([\s\S]*?)<\/right>/);
        if (rightMatch) {
            const rightBorder = this.parseBorder(rightMatch[0]!);
            borders.getRight().applyFromArray({
                borderStyle: rightBorder.getBorderStyle(),
                color: { argb: rightBorder.getColor().getARGB() }
            });
        }

        // Parse top border
        const topMatch = borderContent.match(/<top[^>]*>([\s\S]*?)<\/top>/);
        if (topMatch) {
            const topBorder = this.parseBorder(topMatch[0]!);
            borders.getTop().applyFromArray({
                borderStyle: topBorder.getBorderStyle(),
                color: { argb: topBorder.getColor().getARGB() }
            });
        }

        // Parse bottom border
        const bottomMatch = borderContent.match(/<bottom[^>]*>([\s\S]*?)<\/bottom>/);
        if (bottomMatch) {
            const bottomBorder = this.parseBorder(bottomMatch[0]!);
            borders.getBottom().applyFromArray({
                borderStyle: bottomBorder.getBorderStyle(),
                color: { argb: bottomBorder.getColor().getARGB() }
            });
        }

        // Parse diagonal border
        const diagonalMatch = borderContent.match(/<diagonal[^>]*>([\s\S]*?)<\/diagonal>/);
        if (diagonalMatch) {
            const diagonalBorder = this.parseBorder(diagonalMatch[0]!);
            borders.getDiagonal().applyFromArray({
                borderStyle: diagonalBorder.getBorderStyle(),
                color: { argb: diagonalBorder.getColor().getARGB() }
            });
        }

        return borders;
    }

    /**
     * Parse single border from XML content.
     */
    private parseBorder(borderContent: string): Border {
        const border = new Border();

        // Parse border style
        const styleMatch = borderContent.match(/<[^>]*style="([^"]*)"/);
        if (styleMatch) {
            border.setBorderStyle(styleMatch[1]!);
        }

        // Parse color
        const colorMatch = borderContent.match(/<color[^>]*rgb="([^"]*)"/);
        if (colorMatch) {
            border.getColor().setARGB(colorMatch[1]!);
        }

        return border;
    }

    /**
     * Parse cell xf (style) from XML content.
     */
    private parseCellXf(xfTag: string, xfContent: string, styles: StyleData): Style {
        const style = new Style();

        // Parse attributes from xf tag
        const numFmtIdMatch = xfTag.match(/numFmtId="(\d+)"/);
        const fontIdMatch = xfTag.match(/fontId="(\d+)"/);
        const fillIdMatch = xfTag.match(/fillId="(\d+)"/);
        const borderIdMatch = xfTag.match(/borderId="(\d+)"/);

        // Set number format
        if (numFmtIdMatch) {
            const numFmtId = parseInt(numFmtIdMatch[1]!, 10);
            const formatCode = styles.numFmts.get(numFmtId);
            if (formatCode) {
                style.getNumberFormat().setFormatCode(formatCode);
            } else if (numFmtId < 164) {
                // Built-in format - use General as default for now
                style.getNumberFormat().setFormatCode('General');
            }
        }

        // Set font
        if (fontIdMatch) {
            const fontId = parseInt(fontIdMatch[1]!, 10);
            if (fontId >= 0 && fontId < styles.fonts.length) {
                const font = styles.fonts[fontId]!;
                style.getFont().setName(font.getName());
                style.getFont().setSize(font.getSize());
                style.getFont().setBold(font.getBold());
                style.getFont().setItalic(font.getItalic());
                style.getFont().setUnderline(font.getUnderline());
                style.getFont().setStrikethrough(font.getStrikethrough());
                style.getFont().getColor().setARGB(font.getColor().getARGB());
            }
        }

        // Set fill
        if (fillIdMatch) {
            const fillId = parseInt(fillIdMatch[1]!, 10);
            if (fillId >= 0 && fillId < styles.fills.length) {
                const fill = styles.fills[fillId]!;
                style.getFill().setFillType(fill.getFillType());
                style.getFill().getStartColor().setARGB(fill.getStartColor().getARGB());
                style.getFill().getEndColor().setARGB(fill.getEndColor().getARGB());
            }
        }

        // Set borders
        if (borderIdMatch) {
            const borderId = parseInt(borderIdMatch[1]!, 10);
            if (borderId >= 0 && borderId < styles.borders.length) {
                const borders = styles.borders[borderId]!;
                style.getBorders().applyFromArray({
                    left: {
                        borderStyle: borders.getLeft().getBorderStyle(),
                        color: { argb: borders.getLeft().getColor().getARGB() }
                    },
                    right: {
                        borderStyle: borders.getRight().getBorderStyle(),
                        color: { argb: borders.getRight().getColor().getARGB() }
                    },
                    top: {
                        borderStyle: borders.getTop().getBorderStyle(),
                        color: { argb: borders.getTop().getColor().getARGB() }
                    },
                    bottom: {
                        borderStyle: borders.getBottom().getBorderStyle(),
                        color: { argb: borders.getBottom().getColor().getARGB() }
                    },
                    diagonal: {
                        borderStyle: borders.getDiagonal().getBorderStyle(),
                        color: { argb: borders.getDiagonal().getColor().getARGB() }
                    }
                });
            }
        }

        // Parse alignment
        const alignmentMatch = xfContent.match(/<alignment([^>]*)\/>/);
        if (alignmentMatch) {
            const alignmentAttrs = alignmentMatch[1]!;
            const alignment = this.parseAlignment(alignmentAttrs);
            style.getAlignment().setHorizontal(alignment.getHorizontal());
            style.getAlignment().setVertical(alignment.getVertical());
            style.getAlignment().setTextRotation(alignment.getTextRotation());
            style.getAlignment().setWrapText(alignment.getWrapText());
        }

        return style;
    }

    /**
     * Parse alignment from XML attributes.
     */
    private parseAlignment(alignmentAttrs: string): Alignment {
        const alignment = new Alignment();

        const horizontalMatch = alignmentAttrs.match(/horizontal="([^"]*)"/);
        if (horizontalMatch) {
            alignment.setHorizontal(horizontalMatch[1]!);
        }

        const verticalMatch = alignmentAttrs.match(/vertical="([^"]*)"/);
        if (verticalMatch) {
            alignment.setVertical(verticalMatch[1]!);
        }

        const textRotationMatch = alignmentAttrs.match(/textRotation="([^"]*)"/);
        if (textRotationMatch) {
            let textRotation = parseInt(textRotationMatch[1]!, 10);
            // Excel stores 91..180 as -1..-90, and 255 as stacked.
            if (textRotation > 90) {
                textRotation = 90 - textRotation;
            }
            alignment.setTextRotation(textRotation);
        }

        const wrapTextMatch = alignmentAttrs.match(/wrapText="([^"]*)"/);
        if (wrapTextMatch) {
            alignment.setWrapText(wrapTextMatch[1] === '1' || wrapTextMatch[1] === 'true');
        }

        return alignment;
    }
}
