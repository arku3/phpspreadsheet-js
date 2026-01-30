import { create } from 'xmlbuilder2';
import { Spreadsheet } from '../../core/spreadsheet.ts';
import { Style as InternalStyle } from '../../style/style.ts';
import { Font } from '../../style/font.ts';
import { Fill } from '../../style/fill.ts';
import { Borders } from '../../style/borders.ts';
import { Border } from '../../style/border.ts';
import { NumberFormat } from '../../style/number-format.ts';
import { Alignment } from '../../style/alignment.ts';
import { Protection } from '../../style/protection.ts';
import { WriterPart } from './writer-part.ts';

/**
 * Styles writer.
 */
export class Styles extends WriterPart {
    /**
     * Write styles to XML format.
     */
    public writeStyles(spreadsheet: Spreadsheet): string {
        const root = create({ version: '1.0', encoding: 'UTF-8', standalone: true })
            .ele('styleSheet', {
                xmlns: 'http://schemas.openxmlformats.org/spreadsheetml/2006/main'
            });

        const writer = this.getParentWriter();

        // numFmts
        const numFmtHashTable = writer.getNumFmtHashTable();
        if (numFmtHashTable.count() > 0) {
            const numFmts = root.ele('numFmts', { count: numFmtHashTable.count() });
            numFmtHashTable.getAll().forEach((numFmt, i) => {
                this.writeNumFmt(numFmts, numFmt, i);
            });
        }

        // fonts
        const fontHashTable = writer.getFontHashTable();
        const fonts = root.ele('fonts', { count: fontHashTable.count() });
        fontHashTable.getAll().forEach((font) => {
            this.writeFont(fonts, font, spreadsheet);
        });

        // fills
        const fillHashTable = writer.getFillHashTable();
        const fills = root.ele('fills', { count: fillHashTable.count() });
        fillHashTable.getAll().forEach((fill) => {
            this.writeFill(fills, fill);
        });

        // borders
        const bordersHashTable = writer.getBordersHashTable();
        const borders = root.ele('borders', { count: bordersHashTable.count() });
        bordersHashTable.getAll().forEach((border) => {
            this.writeBorder(borders, border);
        });

        // cellStyleXfs
        const cellStyleXfCollection = spreadsheet.getCellStyleXfCollection();
        const cellStyleXfs = root.ele('cellStyleXfs', { count: cellStyleXfCollection.length });
        cellStyleXfCollection.forEach((cellStyleXf) => {
            this.writeCellStyleXf(cellStyleXfs, cellStyleXf, spreadsheet, '');
        });

        // cellXfs
        const cellXfCollection = spreadsheet.getCellXfCollection();
        const cellXfs = root.ele('cellXfs', { count: cellXfCollection.length });
        
        const defaultAlignment = new Alignment();
        let defaultAlignHash = defaultAlignment.getHashCode();
        if (defaultAlignHash !== spreadsheet.getDefaultStyle().getAlignment().getHashCode()) {
            defaultAlignHash = '';
        }

        cellXfCollection.forEach((cellXf) => {
            this.writeCellStyleXf(cellXfs, cellXf, spreadsheet, defaultAlignHash);
        });

        // cellStyles
        const cellStyles = root.ele('cellStyles', { count: 1 });
        cellStyles.ele('cellStyle', {
            name: 'Normal',
            xfId: 0,
            builtinId: 0
        });

        // dxfs
        const conditionalHashTable = writer.getStylesConditionalHashTable();
        const dxfs = root.ele('dxfs', { count: conditionalHashTable.count() });
        conditionalHashTable.getAll().forEach((conditional) => {
            this.writeCellStyleDxf(dxfs, conditional.getStyle(), spreadsheet);
        });

        // tableStyles
        root.ele('tableStyles', {
            defaultTableStyle: 'TableStyleMedium9',
            defaultPivotStyle: 'PivotTableStyle1'
        });

        return root.end({ prettyPrint: true });
    }

    private writeNumFmt(parent: any, numFmt: NumberFormat, id: number): void {
        const formatCode = numFmt.getFormatCode();
        if (formatCode !== null) {
            parent.ele('numFmt', {
                numFmtId: id + 164,
                formatCode: formatCode
            });
        }
    }

    private writeFont(parent: any, font: Font, _spreadsheet: Spreadsheet): void {
        const f = parent.ele('font');
        if (font.getBold() !== null) f.ele('b', { val: font.getBold() ? '1' : '0' });
        if (font.getItalic() !== null) f.ele('i', { val: font.getItalic() ? '1' : '0' });
        if (font.getStrikethrough() !== null) f.ele('strike', { val: font.getStrikethrough() ? '1' : '0' });
        if (font.getUnderline() !== null) f.ele('u', { val: font.getUnderline() });
        
        if (font.getSuperscript()) {
            f.ele('vertAlign', { val: 'superscript' });
        } else if (font.getSubscript()) {
            f.ele('vertAlign', { val: 'subscript' });
        }

        if (font.getSize() !== null) f.ele('sz', { val: font.getSize() });
        
        this.writeColor(f, font.getColor());

        if (font.getName() !== null) {
            f.ele('name', { val: font.getName() });
        }
    }

    private writeFill(parent: any, fill: Fill): void {
        const f = parent.ele('fill');
        const fillType = fill.getFillType();
        
        if (fillType === 'linear' || fillType === 'path') {
            const gf = f.ele('gradientFill', {
                type: fillType,
                degree: fill.getRotation()
            });
            const stop0 = gf.ele('stop', { position: 0 });
            const startColor = fill.getStartColor().getARGB();
            if (startColor) {
                stop0.ele('color', { rgb: startColor });
            }
            const stop1 = gf.ele('stop', { position: 1 });
            const endColor = fill.getEndColor().getARGB();
            if (endColor) {
                stop1.ele('color', { rgb: endColor });
            }
        } else if (fillType !== null) {
            const pf = f.ele('patternFill', { patternType: fillType || 'none' });
            if (fillType !== 'none') {
                if (fill.getStartColor().getARGB()) {
                    pf.ele('fgColor', { rgb: fill.getStartColor().getARGB() });
                }
                if (fill.getEndColor().getARGB()) {
                    pf.ele('bgColor', { rgb: fill.getEndColor().getARGB() });
                }
            }
        }
    }

    private writeBorder(parent: any, borders: Borders): void {
        const b = parent.ele('border');
        
        if (borders.getDiagonalDirection() === Borders.DIAGONAL_UP) {
            b.att('diagonalUp', 'true');
            b.att('diagonalDown', 'false');
        } else if (borders.getDiagonalDirection() === Borders.DIAGONAL_DOWN) {
            b.att('diagonalUp', 'false');
            b.att('diagonalDown', 'true');
        } else if (borders.getDiagonalDirection() === Borders.DIAGONAL_BOTH) {
            b.att('diagonalUp', 'true');
            b.att('diagonalDown', 'true');
        }

        this.writeBorderPr(b, 'left', borders.getLeft());
        this.writeBorderPr(b, 'right', borders.getRight());
        this.writeBorderPr(b, 'top', borders.getTop());
        this.writeBorderPr(b, 'bottom', borders.getBottom());
        this.writeBorderPr(b, 'diagonal', borders.getDiagonal());
    }

    private writeBorderPr(parent: any, name: string, border: Border): void {
        const style = border.getBorderStyle();
        if (style === 'omit') return;

        const el = parent.ele(name);
        if (style !== 'none') {
            el.att('style', style);
            if (border.getColor().getARGB()) {
                el.ele('color', { rgb: border.getColor().getARGB() });
            }
        }
    }

    private writeColor(parent: any, color: any, name: string = 'color'): void {
        const el = parent.ele(name);
        if (color.getTheme() >= 0) {
            el.att('theme', String(color.getTheme()));
        } else if (color.getARGB()) {
            el.att('rgb', color.getARGB());
        }
    }

    private writeCellStyleDxf(parent: any, style: InternalStyle, spreadsheet: Spreadsheet): void {
        const dxf = parent.ele('dxf');
        this.writeFont(dxf, style.getFont(), spreadsheet);
        this.writeNumFmt(dxf, style.getNumberFormat(), 0); // PHP doesn't pass ID for DXF numFmt?
        this.writeFill(dxf, style.getFill());
        this.writeBorder(dxf, style.getBorders());
    }

    private writeCellStyleXf(parent: any, style: InternalStyle, spreadsheet: Spreadsheet, defaultAlignHash: string): void {
        const writer = this.getParentWriter();
        const xf = parent.ele('xf', {
            xfId: 0,
            fontId: writer.getFontHashTable().getIndexForHashCode(style.getFont().getHashCode()),
            fillId: writer.getFillHashTable().getIndexForHashCode(style.getFill().getHashCode()),
            borderId: writer.getBordersHashTable().getIndexForHashCode(style.getBorders().getHashCode())
        });

        if (style.getNumberFormat().getBuiltInFormatCode() === false) {
            xf.att('numFmtId', writer.getNumFmtHashTable().getIndexForHashCode(style.getNumberFormat().getHashCode()) + 164);
        } else {
            xf.att('numFmtId', style.getNumberFormat().getBuiltInFormatCode());
        }

        if (style.getQuotePrefix()) xf.att('quotePrefix', '1');

        xf.att('applyFont', '1');
        xf.att('applyFill', '1');
        xf.att('applyBorder', '1');
        xf.att('applyAlignment', '1');

        const align = style.getAlignment();
        const al = xf.ele('alignment');
        if (align.getHorizontal()) al.att('horizontal', align.getHorizontal()!);
        if (align.getVertical()) al.att('vertical', align.getVertical()!);
        if (align.getTextRotation() !== 0) {
            const textRotation = align.getTextRotation() >= 0
                ? align.getTextRotation()
                : 90 - align.getTextRotation();
            al.att('textRotation', textRotation);
        }
        if (align.getWrapText()) al.att('wrapText', 'true');
        if (align.getShrinkToFit()) al.att('shrinkToFit', 'true');
        if (align.getIndent() > 0) al.att('indent', align.getIndent());

        const protection = style.getProtection();
        if (protection.getLocked() !== 'inherit' || protection.getHidden() !== 'inherit') {
            xf.att('applyProtection', '1');
            const prot = xf.ele('protection');
            if (protection.getLocked() !== 'inherit') {
                prot.att('locked', protection.getLocked() === 'protected' ? 'true' : 'false');
            }
            if (protection.getHidden() !== 'inherit') {
                prot.att('hidden', protection.getHidden() === 'protected' ? 'true' : 'false');
            }
        }
    }

    /**
     * Get all unique styles.
     */
    public allStyles(spreadsheet: Spreadsheet): InternalStyle[] {
        // Include both cellXfs and cellStyleXfs.
        // cellStyleXfs always contain the "Normal" style (and potentially others)
        // which may differ from the default cellXf if user code mutates styles.
        return [...spreadsheet.getCellXfCollection(), ...spreadsheet.getCellStyleXfCollection()];
    }

    /**
     * Get all conditional styles.
     */
    public allConditionalStyles(spreadsheet: Spreadsheet): any[] {
        const styles: any[] = [];
        const sheetCount = spreadsheet.getSheetCount();
        for (let i = 0; i < sheetCount; i++) {
            for (const conditionalStyles of spreadsheet.getSheet(i).getConditionalStylesCollection().values()) {
                for (const conditionalStyle of conditionalStyles) {
                    styles.push(conditionalStyle);
                }
            }
        }
        return styles;
    }

    /**
     * Get all unique fills.
     */
    public allFills(spreadsheet: Spreadsheet): Fill[] {
        const fills = new Map<string, Fill>();
        
        // Two predefined fills
        const fill0 = new Fill();
        fill0.setFillType('none');
        fills.set(fill0.getHashCode(), fill0);

        const fill1 = new Fill();
        fill1.setFillType('gray125');
        fills.set(fill1.getHashCode(), fill1);

        for (const style of [...spreadsheet.getCellXfCollection(), ...spreadsheet.getCellStyleXfCollection()]) {
            const fill = style.getFill();
            fills.set(fill.getHashCode(), fill);
        }

        return Array.from(fills.values());
    }

    /**
     * Get all unique fonts.
     */
    public allFonts(spreadsheet: Spreadsheet): Font[] {
        const fonts = new Map<string, Font>();
        for (const style of [...spreadsheet.getCellXfCollection(), ...spreadsheet.getCellStyleXfCollection()]) {
            const font = style.getFont();
            fonts.set(font.getHashCode(), font);
        }
        return Array.from(fonts.values());
    }

    /**
     * Get all unique borders.
     */
    public allBorders(spreadsheet: Spreadsheet): Borders[] {
        const borders = new Map<string, Borders>();
        for (const style of [...spreadsheet.getCellXfCollection(), ...spreadsheet.getCellStyleXfCollection()]) {
            const border = style.getBorders();
            borders.set(border.getHashCode(), border);
        }
        return Array.from(borders.values());
    }

    /**
     * Get all unique number formats.
     */
    public allNumberFormats(spreadsheet: Spreadsheet): NumberFormat[] {
        const formats = new Map<string, NumberFormat>();
        for (const style of [...spreadsheet.getCellXfCollection(), ...spreadsheet.getCellStyleXfCollection()]) {
            const format = style.getNumberFormat();
            if (format.getBuiltInFormatCode() === false) {
                formats.set(format.getHashCode(), format);
            }
        }
        return Array.from(formats.values());
    }
}
