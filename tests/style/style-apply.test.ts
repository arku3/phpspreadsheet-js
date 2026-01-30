import { describe, expect, test } from 'bun:test';
import { Alignment } from '../../src/style/alignment.ts';
import { Border } from '../../src/style/border.ts';
import { Borders } from '../../src/style/borders.ts';
import { Color } from '../../src/style/color.ts';
import { Fill } from '../../src/style/fill.ts';
import { Font } from '../../src/style/font.ts';
import { NumberFormat } from '../../src/style/number-format.ts';
import { Protection } from '../../src/style/protection.ts';
import { Style } from '../../src/style/style.ts';

describe('Style applyFromArray', () => {
    test('Alignment applyFromArray', () => {
        const alignment = new Alignment();
        alignment.applyFromArray({
            horizontal: 'centerContinuous',
            vertical: 'TOP',
            textRotation: 45,
            wrapText: true,
            shrinkToFit: true,
            indent: 2,
            readOrder: 1,
            justifyLastLine: true,
        });

        expect(alignment.getHorizontal()).toBe(Alignment.HORIZONTAL_CENTER_CONTINUOUS);
        expect(alignment.getVertical()).toBe(Alignment.VERTICAL_TOP);
        expect(alignment.getTextRotation()).toBe(45);
        expect(alignment.getWrapText()).toBe(true);
        expect(alignment.getShrinkToFit()).toBe(true);
        expect(alignment.getIndent()).toBe(2);
        expect(alignment.getReadOrder()).toBe(1);
        expect(alignment.getJustifyLastLine()).toBe(true);
    });

    test('Fill applyFromArray', () => {
        const fill = new Fill();
        fill.applyFromArray({
            fillType: Fill.FILL_SOLID,
            rotation: 30,
            startColor: { rgb: 'FF0000' },
            endColor: { argb: Color.COLOR_BLUE },
        });

        expect(fill.getFillType()).toBe(Fill.FILL_SOLID);
        expect(fill.getRotation()).toBe(30);
        expect(fill.getStartColor().getRGB()).toBe('FF0000');
        expect(fill.getEndColor().getARGB()).toBe(Color.COLOR_BLUE);

        fill.applyFromArray({
            color: { rgb: '00FF00' },
        });
        expect(fill.getStartColor().getRGB()).toBe('00FF00');
        expect(fill.getEndColor().getRGB()).toBe('00FF00');
    });

    test('Border and Borders applyFromArray', () => {
        const border = new Border();
        border.applyFromArray({
            borderStyle: Border.BORDER_THIN,
            color: { argb: Color.COLOR_RED },
        });
        expect(border.getBorderStyle()).toBe(Border.BORDER_THIN);
        expect(border.getColor().getARGB()).toBe(Color.COLOR_RED);

        const borders = new Borders();
        borders.applyFromArray({
            left: { borderStyle: Border.BORDER_DASHED },
            right: { borderStyle: Border.BORDER_DOUBLE },
            diagonalDirection: Borders.DIAGONAL_BOTH,
        });
        expect(borders.getLeft().getBorderStyle()).toBe(Border.BORDER_DASHED);
        expect(borders.getRight().getBorderStyle()).toBe(Border.BORDER_DOUBLE);
        expect(borders.getDiagonalDirection()).toBe(Borders.DIAGONAL_BOTH);

        borders.applyFromArray({
            allBorders: { borderStyle: Border.BORDER_THICK },
        });
        expect(borders.getTop().getBorderStyle()).toBe(Border.BORDER_THICK);
        expect(borders.getBottom().getBorderStyle()).toBe(Border.BORDER_THICK);
        expect(borders.getLeft().getBorderStyle()).toBe(Border.BORDER_THICK);
        expect(borders.getRight().getBorderStyle()).toBe(Border.BORDER_THICK);
    });

    test('NumberFormat and Protection applyFromArray', () => {
        const numberFormat = new NumberFormat();
        numberFormat.applyFromArray({
            formatCode: NumberFormat.FORMAT_DATE_DDMMYYYY,
        });
        expect(numberFormat.getFormatCode()).toBe(NumberFormat.FORMAT_DATE_DDMMYYYY);

        const protection = new Protection();
        protection.applyFromArray({
            locked: Protection.PROTECTION_PROTECTED,
            hidden: Protection.PROTECTION_UNPROTECTED,
        });
        expect(protection.getLocked()).toBe(Protection.PROTECTION_PROTECTED);
        expect(protection.getHidden()).toBe(Protection.PROTECTION_UNPROTECTED);
    });

    test('Font applyFromArray', () => {
        const font = new Font();
        font.applyFromArray({
            name: 'Arial',
            size: 14,
            bold: true,
            italic: true,
            underline: Font.UNDERLINE_SINGLE,
            strikethrough: true,
            color: { rgb: '123456' },
        });

        expect(font.getName()).toBe('Arial');
        expect(font.getSize()).toBe(14);
        expect(font.getBold()).toBe(true);
        expect(font.getItalic()).toBe(true);
        expect(font.getUnderline()).toBe(Font.UNDERLINE_SINGLE);
        expect(font.getStrikethrough()).toBe(true);
        expect(font.getColor().getRGB()).toBe('123456');
    });

    test('Style applyFromArray', () => {
        const style = new Style();
        style.applyFromArray({
            font: { name: 'Verdana', bold: true },
            fill: { fillType: Fill.FILL_SOLID, color: { rgb: 'CCCCCC' } },
            borders: { allBorders: { borderStyle: Border.BORDER_THIN } },
            alignment: { horizontal: 'center' },
            numberFormat: { formatCode: NumberFormat.FORMAT_NUMBER_00 },
            protection: { locked: Protection.PROTECTION_PROTECTED },
            quotePrefix: true,
            checkBox: true,
        });

        expect(style.getFont().getName()).toBe('Verdana');
        expect(style.getFont().getBold()).toBe(true);
        expect(style.getFill().getFillType()).toBe(Fill.FILL_SOLID);
        expect(style.getFill().getStartColor().getRGB()).toBe('CCCCCC');
        expect(style.getBorders().getTop().getBorderStyle()).toBe(Border.BORDER_THIN);
        expect(style.getAlignment().getHorizontal()).toBe(Alignment.HORIZONTAL_CENTER);
        expect(style.getNumberFormat().getFormatCode()).toBe(NumberFormat.FORMAT_NUMBER_00);
        expect(style.getProtection().getLocked()).toBe(Protection.PROTECTION_PROTECTED);
        expect(style.getQuotePrefix()).toBe(true);
        expect(style.getCheckBox()).toBe(true);
    });
});
