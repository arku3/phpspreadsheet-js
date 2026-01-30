import { create } from 'xmlbuilder2';
import { Worksheet } from '../../core/worksheet.ts';
import { WriterPart } from './writer-part.ts';
import { Coordinate } from '../../utils/coordinate.ts';

/**
 * Generates VML drawings for classic worksheet comments.
 *
 * Output: xl/drawings/vmlDrawingN.vml
 */
export class VmlDrawing extends WriterPart {
    /**
     * Write the VML drawing part for worksheet comments.
     */
    public writeVmlDrawingComments(worksheet: Worksheet): string {
        const entries = [...worksheet.getComments().entries()];
        entries.sort((a, b) => {
            const [aCol, aRow] = Coordinate.indexesFromString(a[0]);
            const [bCol, bRow] = Coordinate.indexesFromString(b[0]);
            if (aRow !== bRow) return aRow - bRow;
            return aCol - bCol;
        });

        const root = create({ version: '1.0', encoding: 'UTF-8', standalone: true })
            .ele('xml', {
                'xmlns:v': 'urn:schemas-microsoft-com:vml',
                'xmlns:o': 'urn:schemas-microsoft-com:office:office',
                'xmlns:x': 'urn:schemas-microsoft-com:office:excel',
            });

        // o:shapelayout
        const shapelayout = root.ele('o:shapelayout', { 'v:ext': 'edit' });
        shapelayout.ele('o:idmap', { 'v:ext': 'edit', data: '1' });

        // v:shapetype
        const shapetype = root.ele('v:shapetype', {
            id: '_x0000_t202',
            coordsize: '21600,21600',
            'o:spt': '202',
            path: 'm,l,21600r21600,l21600,xe',
        });
        shapetype.ele('v:stroke', { joinstyle: 'miter' });
        shapetype.ele('v:path', { gradientshapeok: 't', 'o:connecttype': 'rect' });

        for (const [ref, comment] of entries) {
            const [column, row] = Coordinate.indexesFromString(ref);

            // PhpSpreadsheet: 1024 + col + row, truncated to 4 chars.
            const idRaw = String(1024 + column + row);
            const id = idRaw.slice(0, 4);

            const visible = Boolean(comment.getVisible?.());

            // Defaults mirror PhpSpreadsheet's Comment defaults.
            const marginLeft = '59.25pt';
            const marginTop = '1.5pt';
            const width = '96pt';
            const height = '55.5pt';
            const fillRgb = 'FFFFE1';

            const shape = root.ele('v:shape', {
                id: `_x0000_s${id}`,
                type: '#_x0000_t202',
                style: `position:absolute;margin-left:${marginLeft};margin-top:${marginTop};width:${width};height:${height};z-index:1;visibility:${visible ? 'visible' : 'hidden'}`,
                fillcolor: `#${fillRgb}`,
                'o:insetmode': 'auto',
            });

            shape.ele('v:fill', { color2: `#${fillRgb}` });
            shape.ele('v:shadow', { on: 't', color: 'black', obscured: 't' });
            shape.ele('v:path', { 'o:connecttype': 'none' });

            const textbox = shape.ele('v:textbox', { style: 'mso-direction-alt:auto' });
            textbox.ele('div', { style: 'text-align:left' });

            const clientData = shape.ele('x:ClientData', { ObjectType: 'Note' });
            clientData.ele('x:MoveWithCells').txt('');
            clientData.ele('x:SizeWithCells').txt('');
            clientData.ele('x:AutoFill').txt('False');
            clientData.ele('x:Row').txt(String(row - 1));
            clientData.ele('x:Column').txt(String(column - 1));
        }

        return root.end({ prettyPrint: true });
    }
}
