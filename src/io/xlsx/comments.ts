import { create } from 'xmlbuilder2';
import { Worksheet } from '../../core/worksheet.ts';
import { WriterPart } from './writer-part.ts';
import { Coordinate } from '../../utils/coordinate.ts';
import { controlCharacterPHP2OOXML } from '../../utils/string-helper.ts';
import { RichText } from '../../rich-text/rich-text.ts';
import { Run } from '../../rich-text/run.ts';
import { VmlDrawing } from './vml-drawing.ts';

/**
 * Generates xl/commentsN.xml for classic worksheet comments (Excel "notes").
 */
export class Comments extends WriterPart {
    /**
     * Write classic comments part.
     */
    public writeComments(worksheet: Worksheet): string {
        const entries = [...worksheet.getComments().entries()];
        entries.sort((a, b) => {
            const [aCol, aRow] = Coordinate.indexesFromString(a[0]);
            const [bCol, bRow] = Coordinate.indexesFromString(b[0]);
            if (aRow !== bRow) return aRow - bRow;
            return aCol - bCol;
        });

        const authorIds = new Map<string, number>();
        const authors: string[] = [];

        for (const [, comment] of entries) {
            const author = String(comment.getAuthor?.() ?? 'Author');
            if (!authorIds.has(author)) {
                authorIds.set(author, authors.length);
                authors.push(author);
            }
        }

        const root = create({ version: '1.0', encoding: 'UTF-8', standalone: true })
            .ele('comments', { xmlns: 'http://schemas.openxmlformats.org/spreadsheetml/2006/main' });

        const authorsEle = root.ele('authors');
        for (const author of authors) {
            authorsEle.ele('author').txt(controlCharacterPHP2OOXML(author));
        }

        const list = root.ele('commentList');
        for (const [ref, comment] of entries) {
            const author = String(comment.getAuthor?.() ?? 'Author');
            const authorId = authorIds.get(author) ?? 0;

            const commentEle = list.ele('comment', {
                ref,
                authorId: String(authorId),
            });

            const text = commentEle.ele('text');
            const richText = comment.getText?.();
            if (richText instanceof RichText) {
                this.writeRichText(text, richText);
            } else {
                const t = text.ele('t');
                const s = controlCharacterPHP2OOXML(String(richText ?? ''));
                if (s !== s.trim()) {
                    t.att('xml:space', 'preserve');
                }
                t.txt(s);
            }
        }

        return root.end({ prettyPrint: true });
    }

    /**
     * Write VML drawing for classic comments.
     *
     * Output: xl/drawings/vmlDrawingN.vml
     */
    public writeVmlDrawing(worksheet: Worksheet): string {
        const vml = new VmlDrawing(this.getParentWriter());
        return vml.writeVmlDrawingComments(worksheet);
    }

    /**
     * Write RichText using the sharedStrings run schema.
     *
     * Matches PhpSpreadsheet's Xlsx StringTable writer behavior.
     */
    private writeRichText(root: any, richText: RichText): void {
        for (const element of richText.getRichTextElements()) {
            const r = root.ele('r');

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
}
