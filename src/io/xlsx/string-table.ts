import { create } from 'xmlbuilder2';
import { DataType } from '../../core/cell.ts';
import { Worksheet } from '../../core/worksheet.ts';
import { RichText } from '../../rich-text/rich-text.ts';
import { Run } from '../../rich-text/run.ts';
import { Font } from '../../style/font.ts';
import { controlCharacterPHP2OOXML } from '../../utils/string-helper.ts';
import { WriterPart } from './writer-part.ts';

/**
 * Generates sharedStrings.xml.
 */
export class StringTable extends WriterPart {
    /**
     * Create worksheet stringtable.
     */
    public createStringTable(worksheet: Worksheet, existingTable: (RichText | string)[] = []): (RichText | string)[] {
        const aStringTable = [...existingTable];
        const aFlippedStringTable = this.flipStringTable(aStringTable);

        for (const coordinate of worksheet.getCellCollection().getCoordinates()) {
            const cell = worksheet.getCellCollection().get(coordinate)!;
            const cellValue = cell.getValue();
            const dataType = cell.getDataType();

            if (
                !(cellValue instanceof RichText) &&
                cellValue !== null &&
                cellValue !== '' &&
                (dataType === DataType.TYPE_STRING || dataType === DataType.TYPE_NULL)
            ) {
                const sValue = String(cellValue);
                if (aFlippedStringTable.get(sValue) === undefined) {
                    aStringTable.push(sValue);
                    aFlippedStringTable.set(sValue, aStringTable.length - 1);
                }
            } else if (cellValue instanceof RichText) {
                const hashCode = cellValue.getHashCode();
                if (aFlippedStringTable.get(hashCode) === undefined) {
                    aStringTable.push(cellValue);
                    aFlippedStringTable.set(hashCode, aStringTable.length - 1);
                }
            }
        }

        return aStringTable;
    }

    /**
     * Write string table to XML format.
     */
    public writeStringTable(stringTable: (RichText | string)[]): string {
        const root = create({ version: '1.0', encoding: 'UTF-8', standalone: true }).ele('sst', {
            xmlns: 'http://schemas.openxmlformats.org/spreadsheetml/2006/main',
            uniqueCount: stringTable.length,
        });

        for (const textElement of stringTable) {
            const si = root.ele('si');
            if (!(textElement instanceof RichText)) {
                const textToWrite = controlCharacterPHP2OOXML(textElement);
                const t = si.ele('t');
                if (textToWrite !== textToWrite.trim()) {
                    t.att('xml:space', 'preserve');
                }
                t.txt(textToWrite);
            } else {
                this.writeRichText(si, textElement);
            }
        }

        return root.end({ prettyPrint: true });
    }

    /**
     * Write Rich Text.
     */
    private writeRichText(si: any, richText: RichText): void {
        for (const element of richText.getRichTextElements()) {
            const r = si.ele('r');

            if (element instanceof Run) {
                const font = element.getFont();
                if (font) {
                    const rPr = r.ele('rPr');
                    if (font.getName()) rPr.ele('rFont').att('val', font.getName()!);
                    rPr.ele('b').att('val', font.getBold() ? 'true' : 'false');
                    rPr.ele('i').att('val', font.getItalic() ? 'true' : 'false');
                    if (font.getStrikethrough()) rPr.ele('strike').att('val', 'true');
                    if (font.getColor().getARGB()) rPr.ele('color').att('rgb', font.getColor().getARGB()!);
                    if (font.getSize()) rPr.ele('sz').att('val', String(font.getSize()));
                    if (font.getUnderline()) rPr.ele('u').att('val', font.getUnderline()!);
                    if (font.getSuperscript()) rPr.ele('vertAlign').att('val', 'superscript');
                    if (font.getSubscript()) rPr.ele('vertAlign').att('val', 'subscript');
                }
            }

            const t = r.ele('t');
            const text = controlCharacterPHP2OOXML(element.getText());
            if (text !== text.trim()) {
                t.att('xml:space', 'preserve');
            }
            t.txt(text);
        }
    }

    /**
     * Flip string table (for index searching).
     */
    private flipStringTable(stringTable: (RichText | string)[]): Map<string, number> {
        const map = new Map<string, number>();
        for (let i = 0; i < stringTable.length; i++) {
            const value = stringTable[i]!;
            if (!(value instanceof RichText)) {
                map.set(String(value), i);
            } else {
                map.set(value.getHashCode(), i);
            }
        }
        return map;
    }
}
