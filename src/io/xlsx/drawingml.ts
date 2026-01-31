import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { create } from 'xmlbuilder2';
import type { Worksheet } from '../../core/worksheet.ts';
import { Coordinate } from '../../utils/coordinate.ts';
import type { Chart } from '../../worksheet/chart/chart.ts';
import { Drawing } from '../../worksheet/drawing/drawing.ts';
import { WriterPart } from './writer-part.ts';

export interface DrawingMediaFile {
    filename: string;
    extension: string;
    data: Uint8Array;
}

export interface DrawingPartResult {
    drawingXml: string;
    drawingRelsXml: string;
    mediaFiles: DrawingMediaFile[];
    nextImageDataIndex: number;
    chartIndexes: number[];
}

const EMU_PER_PIXEL = 9525;

const MIME_TO_EXTENSION: Record<string, string> = {
    'image/png': 'png',
    'image/jpeg': 'jpeg',
    'image/jpg': 'jpg',
    'image/gif': 'gif',
    'image/bmp': 'bmp',
    'image/tiff': 'tiff',
    'image/x-emf': 'emf',
    'image/x-wmf': 'wmf',
};

const DEFAULT_EXTENSION_TO_MIME: Record<string, string> = {
    png: 'image/png',
    jpg: 'image/jpeg',
    jpeg: 'image/jpeg',
    gif: 'image/gif',
    bmp: 'image/bmp',
    tif: 'image/tiff',
    tiff: 'image/tiff',
    emf: 'image/x-emf',
    wmf: 'image/x-wmf',
};

const normalizeExtension = (ext: string): string => {
    const e = (ext ?? '').toLowerCase().trim();
    return e.startsWith('.') ? e.slice(1) : e;
};

const pixelsToEmuString = (px: number): string => {
    const v = Math.round((px ?? 0) * EMU_PER_PIXEL);
    return String(v);
};

const inferExtension = (drawing: Drawing): string => {
    const ext = normalizeExtension(drawing.getExtension());
    if (ext !== '') return ext;

    const mime = (drawing.getMimeType() ?? '').toLowerCase().trim();
    if (mime !== '' && MIME_TO_EXTENSION[mime]) return MIME_TO_EXTENSION[mime]!;

    const p = drawing.getPath();
    if (p !== '') {
        const pe = normalizeExtension(path.extname(p));
        if (pe !== '') return pe;
    }

    return 'png';
};

const md5Hex = (s: string): string => crypto.createHash('md5').update(s).digest('hex');

export class DrawingML extends WriterPart {
    /**
     * Write the drawing part + relationships for a worksheet.
     *
     * Output:
     * - xl/drawings/drawing{worksheetId}.xml
     * - xl/drawings/_rels/drawing{worksheetId}.xml.rels
     * - xl/media/*
     */
    public writeWorksheetDrawingParts(
        worksheet: Worksheet,
        _worksheetId: number,
        startImageDataIndex: number,
    ): DrawingPartResult | null {
        const drawings = worksheet.getDrawingCollection().filter((d): d is Drawing => d instanceof Drawing);
        const includeCharts = this.getParentWriter().getIncludeCharts();
        const charts = includeCharts ? [...worksheet.getChartCollection()] : [];

        if (drawings.length === 0 && charts.length === 0) return null;

        let imageDataIndex = startImageDataIndex;
        const mediaFiles: DrawingMediaFile[] = [];

        const drawingRoot = create({ version: '1.0', encoding: 'UTF-8', standalone: true }).ele('xdr:wsDr', {
            'xmlns:xdr': 'http://schemas.openxmlformats.org/drawingml/2006/spreadsheetDrawing',
            'xmlns:a': 'http://schemas.openxmlformats.org/drawingml/2006/main',
        });

        const rels: { id: string; type: string; target: string }[] = [];
        const chartIndexes: number[] = [];

        // rId numbering is per drawing relationship file; keep it contiguous across images + charts.
        let nextDrawingRelId = 1;

        for (let i = 0; i < drawings.length; i += 1) {
            const drawing = drawings[i]!;
            const relId = nextDrawingRelId++;

            const ext = inferExtension(drawing);
            const data = drawing.getImageData() ?? this.#readImageBytesFromPath(drawing.getPath());
            const filename = this.#getMediaFilename(drawing, ext, imageDataIndex);
            if (drawing.getImageData() !== null) {
                imageDataIndex += 1;
            }

            mediaFiles.push({ filename, extension: ext, data });
            rels.push({
                id: `rId${relId}`,
                type: 'http://schemas.openxmlformats.org/officeDocument/2006/relationships/image',
                target: `../media/${filename}`,
            });

            this.#writeDrawingAnchor(drawingRoot, drawing, relId);
        }

        for (let i = 0; i < charts.length; i += 1) {
            const chart = charts[i]!;
            const relId = nextDrawingRelId++;
            chartIndexes.push(this.getParentWriter().allocateChartIndex(chart));
            const chartIndex = chartIndexes[chartIndexes.length - 1]!;

            rels.push({
                id: `rId${relId}`,
                type: 'http://schemas.openxmlformats.org/officeDocument/2006/relationships/chart',
                target: `../charts/chart${chartIndex}.xml`,
            });

            this.#writeChartAnchor(drawingRoot, chart, relId);
        }

        const relsRoot = create({ version: '1.0', encoding: 'UTF-8', standalone: true }).ele('Relationships', {
            xmlns: 'http://schemas.openxmlformats.org/package/2006/relationships',
        });
        for (const rel of rels) {
            relsRoot.ele('Relationship', {
                Id: rel.id,
                Type: rel.type,
                Target: rel.target,
            });
        }

        return {
            drawingXml: drawingRoot.end({ prettyPrint: true }),
            drawingRelsXml: relsRoot.end({ prettyPrint: true }),
            mediaFiles,
            nextImageDataIndex: imageDataIndex,
            chartIndexes,
        };
    }

    public static inferImageExtensionForContentTypes(drawing: Drawing): string {
        return inferExtension(drawing);
    }

    public static contentTypeForImageExtension(extension: string): string {
        const ext = normalizeExtension(extension);
        if (ext === '') return 'image/png';
        return DEFAULT_EXTENSION_TO_MIME[ext] ?? 'application/octet-stream';
    }

    #getMediaFilename(drawing: Drawing, extension: string, imageDataIndex: number): string {
        const ext = normalizeExtension(extension) || 'png';
        if (drawing.getImageData() !== null) {
            return `image${imageDataIndex}.${ext}`;
        }
        const p = drawing.getPath();
        return `${md5Hex(p)}.${ext}`;
    }

    #readImageBytesFromPath(filePath: string): Uint8Array {
        const p = String(filePath ?? '');
        if (p === '') {
            throw new Error('Drawing has no imageData and no path.');
        }
        if (/^https?:\/\//i.test(p)) {
            throw new Error(`URL drawings are not supported yet: ${p}`);
        }
        return new Uint8Array(fs.readFileSync(p));
    }

    #writeDrawingAnchor(root: any, drawing: Drawing, relId: number): void {
        const [col1, row1] = Coordinate.indexesFromString(drawing.getCoordinates());
        const col0 = Math.max(0, col1 - 1);
        const row0 = Math.max(0, row1 - 1);

        const isTwoCell = drawing.getCoordinates2() !== '';

        const anchor = root.ele(isTwoCell ? 'xdr:twoCellAnchor' : 'xdr:oneCellAnchor');

        const from = anchor.ele('xdr:from');
        from.ele('xdr:col').txt(String(col0));
        from.ele('xdr:colOff').txt(pixelsToEmuString(drawing.getOffsetX()));
        from.ele('xdr:row').txt(String(row0));
        from.ele('xdr:rowOff').txt(pixelsToEmuString(drawing.getOffsetY()));

        if (isTwoCell) {
            const [col2, row2] = Coordinate.indexesFromString(drawing.getCoordinates2());
            const to = anchor.ele('xdr:to');
            to.ele('xdr:col').txt(String(Math.max(0, col2 - 1)));
            to.ele('xdr:colOff').txt(pixelsToEmuString(drawing.getOffsetX2()));
            to.ele('xdr:row').txt(String(Math.max(0, row2 - 1)));
            to.ele('xdr:rowOff').txt(pixelsToEmuString(drawing.getOffsetY2()));
        } else {
            anchor.ele('xdr:ext', {
                cx: pixelsToEmuString(drawing.getWidth()),
                cy: pixelsToEmuString(drawing.getHeight()),
            });
        }

        const pic = anchor.ele('xdr:pic');

        const nvPicPr = pic.ele('xdr:nvPicPr');
        {
            const name = drawing.getName() !== '' ? drawing.getName() : `Image ${relId}`;
            const descr =
                drawing.getDescription() !== ''
                    ? drawing.getDescription()
                    : drawing.getName() !== ''
                      ? drawing.getName()
                      : `Image ${relId}`;
            nvPicPr.ele('xdr:cNvPr', {
                id: String(relId),
                name,
                descr,
            });
        }
        const cNvPicPr = nvPicPr.ele('xdr:cNvPicPr');
        cNvPicPr.ele('a:picLocks', { noChangeAspect: '1' });

        const blipFill = pic.ele('xdr:blipFill');
        blipFill.ele('a:blip', {
            'xmlns:r': 'http://schemas.openxmlformats.org/officeDocument/2006/relationships',
            'r:embed': `rId${relId}`,
        });
        const stretch = blipFill.ele('a:stretch');
        stretch.ele('a:fillRect');

        const spPr = pic.ele('xdr:spPr');
        const xfrm = spPr.ele('a:xfrm', { rot: '0' });
        if (isTwoCell) {
            xfrm.ele('a:ext', {
                cx: pixelsToEmuString(drawing.getWidth()),
                cy: pixelsToEmuString(drawing.getHeight()),
            });
        }
        const prstGeom = spPr.ele('a:prstGeom', { prst: 'rect' });
        prstGeom.ele('a:avLst');

        anchor.ele('xdr:clientData');
    }

    #writeChartAnchor(root: any, chart: Chart, relId: number): void {
        const topLeft = chart.getTopLeftPosition();
        const bottomRight = chart.getBottomRightPosition();

        const [col1, row1] = Coordinate.indexesFromString(topLeft.cell);
        const col0 = Math.max(0, col1 - 1);
        const row0 = Math.max(0, row1 - 1);

        const isTwoCell = bottomRight !== null;
        const anchor = root.ele(isTwoCell ? 'xdr:twoCellAnchor' : 'xdr:oneCellAnchor');

        const from = anchor.ele('xdr:from');
        from.ele('xdr:col').txt(String(col0));
        from.ele('xdr:colOff').txt(pixelsToEmuString(topLeft.offsetX));
        from.ele('xdr:row').txt(String(row0));
        from.ele('xdr:rowOff').txt(pixelsToEmuString(topLeft.offsetY));

        if (isTwoCell) {
            const br = bottomRight!;
            const [col2, row2] = Coordinate.indexesFromString(br.cell);
            const to = anchor.ele('xdr:to');
            to.ele('xdr:col').txt(String(Math.max(0, col2 - 1)));
            to.ele('xdr:colOff').txt(pixelsToEmuString(br.offsetX));
            to.ele('xdr:row').txt(String(Math.max(0, row2 - 1)));
            to.ele('xdr:rowOff').txt(pixelsToEmuString(br.offsetY));
        } else {
            // Default chart size if only anchored by top-left.
            anchor.ele('xdr:ext', {
                cx: pixelsToEmuString(480),
                cy: pixelsToEmuString(288),
            });
        }

        const graphicFrame = anchor.ele('xdr:graphicFrame');
        const name = chart.getName() !== '' ? chart.getName() : `Chart ${relId}`;

        const nv = graphicFrame.ele('xdr:nvGraphicFramePr');
        nv.ele('xdr:cNvPr', { id: String(relId), name });
        nv.ele('xdr:cNvGraphicFramePr');

        const xfrm = graphicFrame.ele('xdr:xfrm');
        xfrm.ele('a:off', { x: '0', y: '0' });
        xfrm.ele('a:ext', { cx: '0', cy: '0' });

        const graphic = graphicFrame.ele('a:graphic');
        const graphicData = graphic.ele('a:graphicData', {
            uri: 'http://schemas.openxmlformats.org/drawingml/2006/chart',
        });
        graphicData.ele('c:chart', {
            'xmlns:c': 'http://schemas.openxmlformats.org/drawingml/2006/chart',
            'xmlns:r': 'http://schemas.openxmlformats.org/officeDocument/2006/relationships',
            'r:id': `rId${relId}`,
        });

        anchor.ele('xdr:clientData');
    }
}
