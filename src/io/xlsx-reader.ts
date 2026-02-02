import { open, readFile } from 'node:fs/promises';
import path from 'node:path';
import unzipper from 'unzipper';
import { NamedRange } from '../core/named-range.ts';
import { Spreadsheet } from '../core/spreadsheet.ts';
import { Worksheet } from '../core/worksheet.ts';
import { RichText } from '../rich-text/rich-text.ts';
import { Coordinate } from '../utils/coordinate.ts';
import { Column as AutoFilterColumn } from '../worksheet/auto-filter/column.ts';
import { Rule as AutoFilterRule } from '../worksheet/auto-filter/column/rule.ts';
import { Chart, type ChartSeriesModel, type LegendPosition } from '../worksheet/chart/chart.ts';
import { DataSeriesValues } from '../worksheet/chart/data-series-values.ts';
import { DataSeries } from '../worksheet/chart/data-series.ts';
import { Drawing } from '../worksheet/drawing/drawing.ts';
import { Pane } from '../worksheet/pane.ts';
import type { IReader, WorksheetInfo } from './i-reader.ts';
import { StylesReader, type StyleData } from './xlsx/styles-reader.ts';
import { TableReader } from './xlsx/table-reader.ts';

/**
 * XLSX file reader.
 * Implements IReader interface for reading XLSX files.
 */
export class XlsxReader implements IReader {
    /**
     * Initial file to check in XLSX archive.
     */
    static INITIAL_FILE = '_rels/.rels';

    /**
     * Read empty cells?
     */
    #readEmptyCells = false;

    /**
     * Read default data (e.g., default styles)?
     */
    #readDefaultStyles = true;

    /**
     * Read data only (ignore styles)?
     */
    #readDataOnly = false;

    /**
     * Read filter (optional callback to filter worksheets).
     */
    #readFilter: ((worksheetName: string) => boolean) | null = null;

    /**
     * Include charts in the loaded Spreadsheet?
     */
    #includeCharts = false;

    /**
     * Path to styles.xml in the ZIP file.
     */
    private stylesPath: string | null = null;

    static readonly #COMMENTS_REL_TYPE = 'http://schemas.openxmlformats.org/officeDocument/2006/relationships/comments';
    static readonly #VMLDRAWING_REL_TYPE =
        'http://schemas.openxmlformats.org/officeDocument/2006/relationships/vmlDrawing';
    static readonly #DRAWING_REL_TYPE = 'http://schemas.openxmlformats.org/officeDocument/2006/relationships/drawing';
    static readonly #CHART_REL_TYPE = 'http://schemas.openxmlformats.org/officeDocument/2006/relationships/chart';
    static readonly #TABLE_REL_TYPE = 'http://schemas.openxmlformats.org/officeDocument/2006/relationships/table';

    static readonly #EMU_PER_PIXEL = 9525;

    static decodeXmlEntities(value: string): string {
        // Minimal XML entity decoding.
        // Supports: named entities (&amp; &lt; &gt; &quot; &apos;) + numeric entities.
        return value.replace(/&(#x[0-9A-Fa-f]+|#\d+|amp|lt|gt|quot|apos);/g, (m, g1: string) => {
            switch (g1) {
                case 'amp':
                    return '&';
                case 'lt':
                    return '<';
                case 'gt':
                    return '>';
                case 'quot':
                    return '"';
                case 'apos':
                    return "'";
                default: {
                    const toChar = (codePoint: number): string | null => {
                        if (!Number.isFinite(codePoint) || codePoint < 0 || codePoint > 0x10ffff) {
                            return null;
                        }
                        // Exclude UTF-16 surrogate range.
                        if (codePoint >= 0xd800 && codePoint <= 0xdfff) {
                            return null;
                        }
                        try {
                            return String.fromCodePoint(codePoint);
                        } catch {
                            return null;
                        }
                    };

                    if (g1.startsWith('#x')) {
                        const codePoint = Number.parseInt(g1.slice(2), 16);
                        return toChar(codePoint) ?? m;
                    }
                    if (g1.startsWith('#')) {
                        const codePoint = Number.parseInt(g1.slice(1), 10);
                        return toChar(codePoint) ?? m;
                    }
                    return m;
                }
            }
        });
    }

    static #resolveRelationshipTarget(basePartPath: string, target: string): string {
        const cleanedTarget = target.replace(/^\//, '');
        if (target.startsWith('/')) {
            return cleanedTarget;
        }
        const baseDir = path.posix.dirname(basePartPath);
        return path.posix.normalize(path.posix.join(baseDir, cleanedTarget));
    }

    static readonly #XML_ATTR_REGEX_CACHE = new Map<string, RegExp>();

    static #escapeRegExpLiteral(value: string): string {
        return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    }

    static #extractXmlAttribute(tagAttrs: string, attrName: string): string | null {
        // Safe attribute extraction:
        // - does not match substrings (e.g. id vs sheetId)
        // - supports both single and double quotes
        // - escapes attribute name for regex
        let re = XlsxReader.#XML_ATTR_REGEX_CACHE.get(attrName);
        if (!re) {
            const escapedAttrName = XlsxReader.#escapeRegExpLiteral(attrName);
            re = new RegExp(`(?:^|\\s)${escapedAttrName}\\s*=\\s*(?:'([^']*)'|\"([^\"]*)\")`);
            XlsxReader.#XML_ATTR_REGEX_CACHE.set(attrName, re);
        }
        const m = tagAttrs.match(re);
        const value = m?.[1] ?? m?.[2];
        return value !== undefined ? value : null;
    }

    static #castXsdBoolean(value: string): boolean {
        // Match PhpSpreadsheet Reader\Xlsx\BaseParserClass::boolean.
        // - numeric strings: cast to bool ("0" => false, "1" => true, "2" => true)
        // - non-numeric strings: only "true" or "TRUE" are true
        const v = value.trim();
        if (v === '') {
            return false;
        }

        // Approximation of PHP is_numeric for our XML attribute strings.
        // Accept integers/decimals/scientific, but not hex.
        if (/^[+-]?(?:\d+\.?\d*|\d*\.?\d+)(?:[eE][+-]?\d+)?$/.test(v)) {
            const n = Number(v);
            return Number.isFinite(n) && n !== 0;
        }

        return v === 'true' || v === 'TRUE';
    }

    static #extractTextFromTNodes(xml: string): string {
        // Extract concatenated text from all <t> elements in document order.
        // Handles xml:space="preserve" by keeping raw text; for non-preserve, trims indentation newlines.
        const parts: string[] = [];
        const tMatches = xml.matchAll(/<t([^>]*)>([\s\S]*?)<\/t>/g);
        for (const match of tMatches) {
            const attrs = match[1] ?? '';
            const raw = match[2] ?? '';
            const preserve = /xml:space\s*=\s*"preserve"/.test(attrs);
            const value = preserve ? raw : raw.replace(/^[\r\n\t ]+|[\r\n\t ]+$/g, '');
            parts.push(XlsxReader.decodeXmlEntities(value));
        }
        return parts.join('');
    }

    static #extractTextFromATNodes(xml: string): string {
        // Extract concatenated text from all <a:t> elements in document order.
        // Handles xml:space="preserve" similarly to sharedStrings parsing.
        const parts: string[] = [];
        const tMatches = xml.matchAll(/<a:t([^>]*)>([\s\S]*?)<\/a:t>/g);
        for (const match of tMatches) {
            const attrs = match[1] ?? '';
            const raw = match[2] ?? '';
            const preserve = /xml:space\s*=\s*"preserve"/.test(attrs);
            const value = preserve ? raw : raw.replace(/^[\r\n\t ]+|[\r\n\t ]+$/g, '');
            parts.push(XlsxReader.decodeXmlEntities(value));
        }
        return parts.join('');
    }

    static #parseNumberOrString(value: string): string | number {
        const trimmed = value.trim();
        if (trimmed === '') {
            return '';
        }
        const n = Number(trimmed);
        return Number.isFinite(n) ? n : trimmed;
    }

    static #matchFirstXmlElement(xml: string, tagName: string): { attrs: string; inner: string } | null {
        const re = new RegExp(`<${tagName}\\b([^>]*?)(?:\\/\\s*>|>([\\s\\S]*?)<\\/${tagName}\\s*>)`);
        const m = xml.match(re);
        if (!m) {
            return null;
        }
        return { attrs: m[1] ?? '', inner: m[2] ?? '' };
    }

    static #parseXsdInt(value: string | null): number | null {
        if (value === null) return null;
        const n = Number.parseInt(value, 10);
        return Number.isFinite(n) ? n : null;
    }

    static #parseXsdBoolean(value: string | null): boolean | null {
        if (value === null) return null;
        return XlsxReader.#castXsdBoolean(value);
    }

    static #parseXsdFloat(value: string | null): number | null {
        if (value === null) return null;
        const n = Number.parseFloat(value);
        return Number.isFinite(n) ? n : null;
    }

    static #extractXmlTextContentSafe(xml: string, tagName: string): string {
        // Use explicit escaping for RegExp boundary tokens.
        const m = xml.match(new RegExp(`<${tagName}\\b[^>]*>([\\s\\S]*?)<\\/${tagName}\\s*>`));
        if (!m || m[1] === undefined) return '';
        return XlsxReader.decodeXmlEntities(m[1]);
    }

    static #loadWorksheetPageSetupFromXml(wsXml: string, worksheet: Worksheet): void {
        // Match PhpSpreadsheet Reader/Xlsx/PageSetup.php

        // 1) pageMargins
        const pageMargins = XlsxReader.#matchFirstXmlElement(wsXml, 'pageMargins');
        if (pageMargins) {
            const margins = worksheet.getPageMargins();
            const left = XlsxReader.#parseXsdFloat(XlsxReader.#extractXmlAttribute(pageMargins.attrs, 'left'));
            const right = XlsxReader.#parseXsdFloat(XlsxReader.#extractXmlAttribute(pageMargins.attrs, 'right'));
            const top = XlsxReader.#parseXsdFloat(XlsxReader.#extractXmlAttribute(pageMargins.attrs, 'top'));
            const bottom = XlsxReader.#parseXsdFloat(XlsxReader.#extractXmlAttribute(pageMargins.attrs, 'bottom'));
            const header = XlsxReader.#parseXsdFloat(XlsxReader.#extractXmlAttribute(pageMargins.attrs, 'header'));
            const footer = XlsxReader.#parseXsdFloat(XlsxReader.#extractXmlAttribute(pageMargins.attrs, 'footer'));

            if (left !== null) margins.setLeft(left);
            if (right !== null) margins.setRight(right);
            if (top !== null) margins.setTop(top);
            if (bottom !== null) margins.setBottom(bottom);
            if (header !== null) margins.setHeader(header);
            if (footer !== null) margins.setFooter(footer);
        }

        // 2) pageSetup
        const pageSetupEl = XlsxReader.#matchFirstXmlElement(wsXml, 'pageSetup');
        if (pageSetupEl) {
            const ps = worksheet.getPageSetup();
            const orientation = XlsxReader.#extractXmlAttribute(pageSetupEl.attrs, 'orientation');
            if (orientation !== null) {
                try {
                    ps.setOrientation(XlsxReader.decodeXmlEntities(orientation));
                } catch {
                    // Ignore invalid orientation.
                }
            }

            const paperSize = XlsxReader.#parseXsdInt(XlsxReader.#extractXmlAttribute(pageSetupEl.attrs, 'paperSize'));
            if (paperSize !== null) {
                ps.setPaperSize(paperSize);
            }

            const scale = XlsxReader.#parseXsdInt(XlsxReader.#extractXmlAttribute(pageSetupEl.attrs, 'scale'));
            if (scale !== null) {
                try {
                    ps.setScale(scale, false);
                } catch {
                    // Ignore invalid scale.
                }
            }

            const fitToHeight = XlsxReader.#parseXsdInt(
                XlsxReader.#extractXmlAttribute(pageSetupEl.attrs, 'fitToHeight'),
            );
            if (fitToHeight !== null && fitToHeight >= 0) {
                ps.setFitToHeight(fitToHeight, false);
            }

            const fitToWidth = XlsxReader.#parseXsdInt(
                XlsxReader.#extractXmlAttribute(pageSetupEl.attrs, 'fitToWidth'),
            );
            if (fitToWidth !== null && fitToWidth >= 0) {
                ps.setFitToWidth(fitToWidth, false);
            }

            const firstPageNumber = XlsxReader.#parseXsdInt(
                XlsxReader.#extractXmlAttribute(pageSetupEl.attrs, 'firstPageNumber'),
            );
            const useFirstPageNumber = XlsxReader.#parseXsdBoolean(
                XlsxReader.#extractXmlAttribute(pageSetupEl.attrs, 'useFirstPageNumber'),
            );
            if (firstPageNumber !== null && useFirstPageNumber === true) {
                ps.setFirstPageNumber(firstPageNumber);
            }

            const pageOrder = XlsxReader.#extractXmlAttribute(pageSetupEl.attrs, 'pageOrder');
            if (pageOrder !== null) {
                const decoded = XlsxReader.decodeXmlEntities(pageOrder);
                ps.setPageOrder(decoded);
            }
        }

        // 3) headerFooter
        const headerFooterEl = XlsxReader.#matchFirstXmlElement(wsXml, 'headerFooter');
        if (headerFooterEl) {
            const hf = worksheet.getHeaderFooter();

            const differentOddEven = XlsxReader.#parseXsdBoolean(
                XlsxReader.#extractXmlAttribute(headerFooterEl.attrs, 'differentOddEven'),
            );
            hf.setDifferentOddEven(differentOddEven === true);

            const differentFirst = XlsxReader.#parseXsdBoolean(
                XlsxReader.#extractXmlAttribute(headerFooterEl.attrs, 'differentFirst'),
            );
            hf.setDifferentFirst(differentFirst === true);

            const scaleWithDoc = XlsxReader.#parseXsdBoolean(
                XlsxReader.#extractXmlAttribute(headerFooterEl.attrs, 'scaleWithDoc'),
            );
            // PhpSpreadsheet default true; only false when explicitly false.
            hf.setScaleWithDocument(!(scaleWithDoc === false));

            const alignWithMargins = XlsxReader.#parseXsdBoolean(
                XlsxReader.#extractXmlAttribute(headerFooterEl.attrs, 'alignWithMargins'),
            );
            // PhpSpreadsheet default true; only false when explicitly false.
            hf.setAlignWithMargins(!(alignWithMargins === false));

            const inner = headerFooterEl.inner;
            hf.setOddHeader(XlsxReader.#extractXmlTextContentSafe(inner, 'oddHeader'));
            hf.setOddFooter(XlsxReader.#extractXmlTextContentSafe(inner, 'oddFooter'));
            hf.setEvenHeader(XlsxReader.#extractXmlTextContentSafe(inner, 'evenHeader'));
            hf.setEvenFooter(XlsxReader.#extractXmlTextContentSafe(inner, 'evenFooter'));
            hf.setFirstHeader(XlsxReader.#extractXmlTextContentSafe(inner, 'firstHeader'));
            hf.setFirstFooter(XlsxReader.#extractXmlTextContentSafe(inner, 'firstFooter'));
        }

        // 4) pageBreaks
        // rowBreaks: brk@id is 1-based row, coordinate is A{id}
        const rowBreaksMatch = wsXml.match(/<rowBreaks\b[^>]*>([\s\S]*?)<\/rowBreaks\s*>/);
        const rowBreaksInner = rowBreaksMatch?.[1] ?? '';
        if (rowBreaksInner !== '') {
            const brks = rowBreaksInner.matchAll(/<brk\b([^>]*)\/?\s*>/g);
            for (const m of brks) {
                const attrs = m[1] ?? '';
                const id = XlsxReader.#parseXsdInt(XlsxReader.#extractXmlAttribute(attrs, 'id'));
                if (id === null || id < 1) {
                    continue;
                }
                const man = XlsxReader.#parseXsdBoolean(XlsxReader.#extractXmlAttribute(attrs, 'man'));
                if (man === true) {
                    worksheet.setBreak(`A${id}`, Worksheet.BREAK_ROW);
                }
            }
        }

        // colBreaks: brk@id is 0-based column; coordinate is stringFromColumnIndex(id+1) + '1'
        const colBreaksMatch = wsXml.match(/<colBreaks\b[^>]*>([\s\S]*?)<\/colBreaks\s*>/);
        const colBreaksInner = colBreaksMatch?.[1] ?? '';
        if (colBreaksInner !== '') {
            const brks = colBreaksInner.matchAll(/<brk\b([^>]*)\/?\s*>/g);
            for (const m of brks) {
                const attrs = m[1] ?? '';
                const id = XlsxReader.#parseXsdInt(XlsxReader.#extractXmlAttribute(attrs, 'id'));
                if (id === null || id < 0) {
                    continue;
                }
                const man = XlsxReader.#parseXsdBoolean(XlsxReader.#extractXmlAttribute(attrs, 'man'));
                if (man === true) {
                    const col = Coordinate.stringFromColumnIndex(id + 1);
                    worksheet.setBreak(`${col}1`, Worksheet.BREAK_COLUMN);
                }
            }
        }
    }

    static #loadWorksheetSheetViewsFromXml(wsXml: string, worksheet: Worksheet): void {
        const sheetViewsMatch = wsXml.match(/<sheetViews\b[^>]*>([\s\S]*?)<\/sheetViews\s*>/);
        const sheetViewsXml = sheetViewsMatch?.[1] ?? '';
        if (sheetViewsXml === '') {
            return;
        }

        const sheetView = XlsxReader.#matchFirstXmlElement(sheetViewsXml, 'sheetView');
        if (!sheetView) {
            return;
        }

        const attrs = sheetView.attrs;

        const topLeftCellRaw = XlsxReader.#extractXmlAttribute(attrs, 'topLeftCell');
        if (topLeftCellRaw !== null) {
            const topLeftCell = XlsxReader.decodeXmlEntities(topLeftCellRaw).replace(/\$/g, '').toUpperCase();
            try {
                worksheet.setTopLeftCell(topLeftCell);
            } catch {
                // Ignore invalid topLeftCell.
            }
        }

        const showGridLines = XlsxReader.#parseXsdBoolean(XlsxReader.#extractXmlAttribute(attrs, 'showGridLines'));
        if (showGridLines !== null) {
            worksheet.setShowGridlines(showGridLines);
        }

        const showRowColHeaders = XlsxReader.#parseXsdBoolean(
            XlsxReader.#extractXmlAttribute(attrs, 'showRowColHeaders'),
        );
        if (showRowColHeaders !== null) {
            worksheet.setShowRowColHeaders(showRowColHeaders);
        }

        const rightToLeft = XlsxReader.#parseXsdBoolean(XlsxReader.#extractXmlAttribute(attrs, 'rightToLeft'));
        if (rightToLeft !== null) {
            worksheet.setRightToLeft(rightToLeft);
        }

        const zoomScale = XlsxReader.#parseXsdInt(XlsxReader.#extractXmlAttribute(attrs, 'zoomScale'));
        if (zoomScale !== null) {
            const safe = zoomScale <= 0 ? 100 : zoomScale;
            try {
                worksheet.getSheetView().setZoomScale(safe);
            } catch {
                // Ignore invalid zoomScale.
            }
        }

        const zoomScaleNormal = XlsxReader.#parseXsdInt(XlsxReader.#extractXmlAttribute(attrs, 'zoomScaleNormal'));
        if (zoomScaleNormal !== null) {
            const safe = zoomScaleNormal <= 0 ? 100 : zoomScaleNormal;
            try {
                worksheet.getSheetView().setZoomScaleNormal(safe);
            } catch {
                // Ignore invalid zoomScaleNormal.
            }
        }

        const zoomScalePageLayoutView = XlsxReader.#parseXsdInt(
            XlsxReader.#extractXmlAttribute(attrs, 'zoomScalePageLayoutView'),
        );
        if (zoomScalePageLayoutView !== null && zoomScalePageLayoutView > 0) {
            try {
                worksheet.getSheetView().setZoomScalePageLayoutView(zoomScalePageLayoutView);
            } catch {
                // Ignore invalid zoomScalePageLayoutView.
            }
        }

        const zoomScaleSheetLayoutView = XlsxReader.#parseXsdInt(
            XlsxReader.#extractXmlAttribute(attrs, 'zoomScaleSheetLayoutView'),
        );
        if (zoomScaleSheetLayoutView !== null && zoomScaleSheetLayoutView > 0) {
            try {
                worksheet.getSheetView().setZoomScaleSheetLayoutView(zoomScaleSheetLayoutView);
            } catch {
                // Ignore invalid zoomScaleSheetLayoutView.
            }
        }

        const showZerosRaw = XlsxReader.#extractXmlAttribute(attrs, 'showZeros');
        if (showZerosRaw !== null) {
            worksheet.getSheetView().setShowZeros(XlsxReader.#castXsdBoolean(showZerosRaw));
        }

        const viewRaw = XlsxReader.#extractXmlAttribute(attrs, 'view');
        if (viewRaw !== null) {
            try {
                worksheet.getSheetView().setView(XlsxReader.decodeXmlEntities(viewRaw));
            } catch {
                // Ignore invalid view.
            }
        }

        // Parse panes.
        const pane = XlsxReader.#matchFirstXmlElement(sheetView.inner, 'pane');
        let usesPanes = false;
        let activePaneInPane: string | null = null;
        if (pane) {
            usesPanes = true;
            const paneAttrs = pane.attrs;

            const xSplit = XlsxReader.#parseXsdInt(XlsxReader.#extractXmlAttribute(paneAttrs, 'xSplit')) ?? 0;
            const ySplit = XlsxReader.#parseXsdInt(XlsxReader.#extractXmlAttribute(paneAttrs, 'ySplit')) ?? 0;
            worksheet.setXSplit(xSplit);
            worksheet.setYSplit(ySplit);

            const state = XlsxReader.decodeXmlEntities(XlsxReader.#extractXmlAttribute(paneAttrs, 'state') ?? '');
            worksheet.setPaneState(state);

            const paneTopLeftAttr = XlsxReader.#extractXmlAttribute(paneAttrs, 'topLeftCell');
            const paneTopLeftCell = paneTopLeftAttr
                ? XlsxReader.decodeXmlEntities(paneTopLeftAttr).replace(/\$/g, '').toUpperCase()
                : 'A1';
            if (paneTopLeftAttr !== null) {
                try {
                    worksheet.setPaneTopLeftCell(paneTopLeftCell);
                    if (state === Worksheet.PANE_FROZEN || state === Worksheet.PANE_FROZENSPLIT) {
                        worksheet.setTopLeftCell(paneTopLeftCell);
                    }
                } catch {
                    // Ignore invalid pane topLeftCell.
                }
            }

            // Default to 'topLeft' if panes exist and activePane missing.
            activePaneInPane = XlsxReader.#extractXmlAttribute(paneAttrs, 'activePane');
            const activePane = activePaneInPane !== null ? XlsxReader.decodeXmlEntities(activePaneInPane) : 'topLeft';
            worksheet.setActivePane(activePane);

            if (state === Worksheet.PANE_FROZEN || state === Worksheet.PANE_FROZENSPLIT) {
                // Match PhpSpreadsheet: freeze cell is based only on xSplit/ySplit (not paneTopLeftCell).
                const freezeCell = `${Coordinate.stringFromColumnIndex(xSplit + 1)}${ySplit + 1}`;
                worksheet.freezePane(
                    freezeCell,
                    paneTopLeftAttr ? paneTopLeftCell : null,
                    state === Worksheet.PANE_FROZENSPLIT,
                );
            }

            // Match PhpSpreadsheet: preserve the pane's activePane after freezePane recalculations.
            worksheet.setActivePane(activePane);
        }

        // Parse selections (sheetViews/sheetView/selection).
        const selectionMatches = sheetView.inner.matchAll(/<selection\b([^>]*)\/?>(?:[\s\S]*?<\/selection\s*>)?/g);
        for (const sm of selectionMatches) {
            const selAttrs = sm[1] ?? '';
            let position = XlsxReader.decodeXmlEntities(XlsxReader.#extractXmlAttribute(selAttrs, 'pane') ?? '');
            const activeCellRaw = XlsxReader.#extractXmlAttribute(selAttrs, 'activeCell');
            const sqrefRaw = XlsxReader.#extractXmlAttribute(selAttrs, 'sqref');

            const activeCell = activeCellRaw
                ? XlsxReader.decodeXmlEntities(activeCellRaw).replace(/\$/g, '').toUpperCase()
                : '';
            let sqref = sqrefRaw ? XlsxReader.decodeXmlEntities(sqrefRaw) : '';
            if (sqref.includes(' ')) {
                sqref = sqref.split(' ')[0] ?? '';
            }
            sqref = sqref.replace(/\$/g, '').toUpperCase();

            if (usesPanes && position === '') {
                position = 'topLeft';
            }

            if (position === '') {
                if (sqref !== '') {
                    try {
                        worksheet.setSelectedCells(sqref);
                    } catch {
                        // Ignore invalid sqref.
                    }
                }
                continue;
            }

            // Ignore unknown panes.
            const panes = worksheet.getPanes();
            if (!(position in panes)) {
                continue;
            }

            worksheet.setPane(position, new Pane(position, sqref, activeCell));
            if (position === worksheet.getActivePane() && sqref !== '') {
                try {
                    worksheet.setSelectedCells(sqref);
                } catch {
                    // Ignore invalid sqref.
                }
            }
        }
    }

    static #loadWorksheetSheetViewOptionsFromXml(wsXml: string, worksheet: Worksheet, readDataOnly: boolean): void {
        // Match PhpSpreadsheet Reader/Xlsx/SheetViewOptions.php

        // 1) sheetPr: tabColor, codeName, outlinePr, pageSetUpPr
        const sheetPr = XlsxReader.#matchFirstXmlElement(wsXml, 'sheetPr');
        if (sheetPr) {
            // codeName attribute
            const codeNameRaw = XlsxReader.#extractXmlAttribute(sheetPr.attrs, 'codeName');
            if (codeNameRaw !== null) {
                worksheet.setCodeName(XlsxReader.decodeXmlEntities(codeNameRaw));
            }

            // outlinePr summary flags (defaults true)
            const outlinePr = XlsxReader.#matchFirstXmlElement(sheetPr.inner, 'outlinePr');
            if (outlinePr) {
                const summaryRightRaw = XlsxReader.#extractXmlAttribute(outlinePr.attrs, 'summaryRight');
                if (summaryRightRaw !== null && !XlsxReader.#castXsdBoolean(summaryRightRaw)) {
                    worksheet.setShowSummaryRight(false);
                } else {
                    worksheet.setShowSummaryRight(true);
                }

                const summaryBelowRaw = XlsxReader.#extractXmlAttribute(outlinePr.attrs, 'summaryBelow');
                if (summaryBelowRaw !== null && !XlsxReader.#castXsdBoolean(summaryBelowRaw)) {
                    worksheet.setShowSummaryBelow(false);
                } else {
                    worksheet.setShowSummaryBelow(true);
                }
            }

            // pageSetUpPr fitToPage (defaults true when element exists)
            const pageSetUpPr = XlsxReader.#matchFirstXmlElement(sheetPr.inner, 'pageSetUpPr');
            if (pageSetUpPr) {
                const fitToPageRaw = XlsxReader.#extractXmlAttribute(pageSetUpPr.attrs, 'fitToPage');
                if (fitToPageRaw !== null && !XlsxReader.#castXsdBoolean(fitToPageRaw)) {
                    worksheet.getPageSetup().setFitToPage(false);
                } else {
                    worksheet.getPageSetup().setFitToPage(true);
                }
            }

            // tabColor
            const tabColor = XlsxReader.#matchFirstXmlElement(sheetPr.inner, 'tabColor');
            if (tabColor) {
                const rgb = XlsxReader.#extractXmlAttribute(tabColor.attrs, 'rgb');
                if (rgb !== null) {
                    worksheet.getTabColor().setARGB(rgb);
                } else {
                    const theme = XlsxReader.#parseXsdInt(XlsxReader.#extractXmlAttribute(tabColor.attrs, 'theme'));
                    if (theme !== null && theme >= 0) {
                        worksheet.getTabColor().setTheme(theme);
                    }

                    // Tint is currently ignored for tabColor unless rgb is provided.
                    // (We don't yet have a theme-reader or a shared color reader that applies tint.)
                }
            } else {
                // Match PhpSpreadsheet: tabColor element missing means the tab color is unset.
                worksheet.resetTabColor();
            }
        }

        // 2) sheetFormatPr: defaultRowHeight, defaultColWidth, zeroHeight
        const sheetFormatPr = XlsxReader.#matchFirstXmlElement(wsXml, 'sheetFormatPr');
        if (sheetFormatPr) {
            const customHeightRaw = XlsxReader.#extractXmlAttribute(sheetFormatPr.attrs, 'customHeight');
            const defaultRowHeight = XlsxReader.#parseXsdFloat(
                XlsxReader.#extractXmlAttribute(sheetFormatPr.attrs, 'defaultRowHeight'),
            );
            if (customHeightRaw !== null && XlsxReader.#castXsdBoolean(customHeightRaw) && defaultRowHeight !== null) {
                worksheet.getDefaultRowDimension().setRowHeight(defaultRowHeight);
            }

            const defaultColWidth = XlsxReader.#parseXsdFloat(
                XlsxReader.#extractXmlAttribute(sheetFormatPr.attrs, 'defaultColWidth'),
            );
            if (defaultColWidth !== null) {
                worksheet.getDefaultColumnDimension().setWidth(defaultColWidth);
            }

            const zeroHeightRaw = XlsxReader.#extractXmlAttribute(sheetFormatPr.attrs, 'zeroHeight');
            if (zeroHeightRaw !== null && XlsxReader.#castXsdBoolean(zeroHeightRaw)) {
                worksheet.getDefaultRowDimension().setZeroHeight(true);
            }
        }

        // 3) printOptions (skip in readDataOnly)
        if (!readDataOnly) {
            const printOptions = XlsxReader.#matchFirstXmlElement(wsXml, 'printOptions');
            if (printOptions) {
                const gridLinesRaw = XlsxReader.#extractXmlAttribute(printOptions.attrs, 'gridLines');
                if (gridLinesRaw !== null && XlsxReader.#castXsdBoolean(gridLinesRaw)) {
                    const gridLinesSetRaw = XlsxReader.#extractXmlAttribute(printOptions.attrs, 'gridLinesSet');
                    if (gridLinesSetRaw === null || XlsxReader.#castXsdBoolean(gridLinesSetRaw)) {
                        worksheet.setPrintGridlines(true);
                    }
                }

                const horizontalCenteredRaw = XlsxReader.#extractXmlAttribute(printOptions.attrs, 'horizontalCentered');
                if (horizontalCenteredRaw !== null && XlsxReader.#castXsdBoolean(horizontalCenteredRaw)) {
                    worksheet.getPageSetup().setHorizontalCentered(true);
                }

                const verticalCenteredRaw = XlsxReader.#extractXmlAttribute(printOptions.attrs, 'verticalCentered');
                if (verticalCenteredRaw !== null && XlsxReader.#castXsdBoolean(verticalCenteredRaw)) {
                    worksheet.getPageSetup().setVerticalCentered(true);
                }
            }
        }
    }

    static #loadWorksheetColumnAndRowAttributesFromXml(
        wsXml: string,
        worksheet: Worksheet,
        readDataOnly: boolean,
    ): void {
        // Port of PhpSpreadsheet Reader\Xlsx\ColumnAndRowAttributes.
        // - Column: width/hidden/collapsed/outlineLevel always; style only when !readDataOnly.
        // - Row: all attributes only when !readDataOnly.

        // cols/col
        const colsMatch = wsXml.match(/<cols\b[^>]*>([\s\S]*?)<\/cols\s*>/);
        const colsXml = colsMatch?.[1] ?? '';
        if (colsXml !== '') {
            const colMatches = colsXml.matchAll(/<col\b([^>]*?)(?:\/\s*>|>([\s\S]*?)<\/col\s*>)/g);
            for (const m of colMatches) {
                const attrs = m[1] ?? '';

                const min = XlsxReader.#parseXsdInt(XlsxReader.#extractXmlAttribute(attrs, 'min'));
                const max = XlsxReader.#parseXsdInt(XlsxReader.#extractXmlAttribute(attrs, 'max'));
                if (min === null || max === null) {
                    continue;
                }

                const width = XlsxReader.#parseXsdFloat(XlsxReader.#extractXmlAttribute(attrs, 'width'));
                const hidden = XlsxReader.#parseXsdBoolean(XlsxReader.#extractXmlAttribute(attrs, 'hidden')) === true;
                const collapsed =
                    XlsxReader.#parseXsdBoolean(XlsxReader.#extractXmlAttribute(attrs, 'collapsed')) === true;
                const outlineLevel = XlsxReader.#parseXsdInt(XlsxReader.#extractXmlAttribute(attrs, 'outlineLevel'));

                const styleIndex = !readDataOnly
                    ? XlsxReader.#parseXsdInt(XlsxReader.#extractXmlAttribute(attrs, 'style'))
                    : null;

                for (let colIndex = min; colIndex <= max && colIndex <= 16384; colIndex++) {
                    const columnAddress = Coordinate.stringFromColumnIndex(colIndex);
                    const dim = worksheet.getColumnDimension(columnAddress);
                    if (styleIndex !== null) {
                        dim.setXfIndex(styleIndex);
                    }
                    if (hidden) {
                        dim.setVisible(false);
                    }
                    if (collapsed) {
                        dim.setCollapsed(true);
                    }
                    if (outlineLevel !== null && outlineLevel > 0) {
                        try {
                            dim.setOutlineLevel(outlineLevel);
                        } catch {
                            // Ignore invalid outlineLevel.
                        }
                    }
                    if (width !== null) {
                        dim.setWidth(width);
                    }
                }
            }
        }

        // sheetData/row
        if (readDataOnly) {
            return;
        }

        const sheetDataMatch = wsXml.match(/<sheetData\b[^>]*>([\s\S]*?)<\/sheetData\s*>/);
        const sheetDataXml = sheetDataMatch?.[1] ?? '';
        if (sheetDataXml === '') {
            return;
        }

        const rowMatches = sheetDataXml.matchAll(/<row\b([^>]*?)(?:\/\s*>|>([\s\S]*?)<\/row\s*>)/g);
        for (const m of rowMatches) {
            const attrs = m[1] ?? '';

            const rowIndex = XlsxReader.#parseXsdInt(XlsxReader.#extractXmlAttribute(attrs, 'r'));
            if (rowIndex === null) {
                continue;
            }

            const rowHeight = XlsxReader.#parseXsdFloat(XlsxReader.#extractXmlAttribute(attrs, 'ht'));
            const customFormat = XlsxReader.#parseXsdBoolean(XlsxReader.#extractXmlAttribute(attrs, 'customFormat'));
            const customHeight = XlsxReader.#parseXsdBoolean(XlsxReader.#extractXmlAttribute(attrs, 'customHeight'));
            const hidden = XlsxReader.#parseXsdBoolean(XlsxReader.#extractXmlAttribute(attrs, 'hidden')) === true;
            const collapsed = XlsxReader.#parseXsdBoolean(XlsxReader.#extractXmlAttribute(attrs, 'collapsed')) === true;
            const outlineLevel = XlsxReader.#parseXsdInt(XlsxReader.#extractXmlAttribute(attrs, 'outlineLevel'));
            const styleIndex = XlsxReader.#parseXsdInt(XlsxReader.#extractXmlAttribute(attrs, 's'));

            const dim = worksheet.getRowDimension(rowIndex);
            if (styleIndex !== null) {
                dim.setXfIndex(styleIndex);
            }
            if (hidden) {
                dim.setVisible(false);
            }
            if (collapsed) {
                dim.setCollapsed(true);
            }
            if (outlineLevel !== null && outlineLevel > 0) {
                try {
                    dim.setOutlineLevel(outlineLevel);
                } catch {
                    // Ignore invalid outlineLevel.
                }
            }

            // Match PhpSpreadsheet Reader/Xlsx/ColumnAndRowAttributes row logic:
            // - height is driven by ht (customHeight is informational)
            // - customFormat must not drive height
            if (rowHeight !== null) {
                // Apply height from ht regardless of customFormat.
                // If customHeight is present, it should generally be true when ht is meaningful.
                // We don't gate on customHeight to match PhpSpreadsheet reader behavior.
                void customHeight;
                dim.setRowHeight(rowHeight);

                if (customFormat === true) {
                    // Preserve customFormat flag without overriding the height.
                    dim.setCustomFormat(true, null);
                }
            }
        }
    }

    static #loadAutoFilterColumnsFromXml(autoFilterInnerXml: string, worksheet: Worksheet): void {
        const autoFilter = worksheet.getAutoFilter();

        const filterColumnMatches = autoFilterInnerXml.matchAll(
            /<filterColumn\b([^>]*?)(?:\/\s*>|>([\s\S]*?)<\/filterColumn\s*>)/g,
        );
        for (const filterColumnMatch of filterColumnMatches) {
            try {
                const filterColumnAttrs = filterColumnMatch[1] ?? '';
                const filterColumnInner = filterColumnMatch[2] ?? '';

                const colIdStr = XlsxReader.#extractXmlAttribute(filterColumnAttrs, 'colId');
                if (!colIdStr) {
                    continue;
                }
                const colId = Number.parseInt(colIdStr, 10);
                if (!Number.isFinite(colId) || colId < 0) {
                    continue;
                }

                let column: AutoFilterColumn;
                try {
                    column = autoFilter.getColumnByOffset(colId);
                } catch {
                    continue;
                }

                // Clear any prior state; worksheet XML should be authoritative.
                column.clearRules();
                column.setAttributes({});

                // 1) filters
                const filters = XlsxReader.#matchFirstXmlElement(filterColumnInner, 'filters');
                if (filters) {
                    column.setFilterType(AutoFilterColumn.AUTOFILTER_FILTERTYPE_FILTER);
                    const blank = XlsxReader.#extractXmlAttribute(filters.attrs, 'blank');
                    if (blank === '1') {
                        column.setAttribute('blank', 1);
                    }

                    for (const m of filters.inner.matchAll(/<filter\b([^>]*?)\/?\s*>/g)) {
                        const attrs = m[1] ?? '';
                        const valAttr = XlsxReader.#extractXmlAttribute(attrs, 'val');
                        if (valAttr === null) {
                            continue;
                        }
                        const value = XlsxReader.decodeXmlEntities(valAttr);
                        try {
                            column.createRule().setRuleType(AutoFilterRule.AUTOFILTER_RULETYPE_FILTER).setValue(value);
                        } catch {
                            // Ignore invalid rule.
                        }
                    }

                    const dateGroupMatches = filters.inner.matchAll(/<dateGroupItem\b([^>]*?)(?:\/\s*>|>)/g);
                    for (const m of dateGroupMatches) {
                        const attrs = m[1] ?? '';
                        const dateTimeGrouping = XlsxReader.#extractXmlAttribute(attrs, 'dateTimeGrouping');
                        if (!dateTimeGrouping) {
                            continue;
                        }

                        const value: Record<string, number> = {};
                        for (const key of ['year', 'month', 'day', 'hour', 'minute', 'second'] as const) {
                            const raw = XlsxReader.#extractXmlAttribute(attrs, key);
                            if (raw === null) {
                                continue;
                            }
                            const n = Number.parseInt(raw, 10);
                            if (Number.isFinite(n)) {
                                value[key] = n;
                            }
                        }
                        if (Object.keys(value).length === 0) {
                            continue;
                        }

                        try {
                            const rule = column.createRule().setRuleType(AutoFilterRule.AUTOFILTER_RULETYPE_DATEGROUP);
                            rule.setValue(value);
                            try {
                                rule.setGrouping(dateTimeGrouping);
                            } catch {
                                // Ignore invalid grouping.
                            }
                        } catch {
                            // Ignore invalid rule.
                        }
                    }

                    continue;
                }

                // 2) customFilters
                const customFilters = XlsxReader.#matchFirstXmlElement(filterColumnInner, 'customFilters');
                if (customFilters) {
                    column.setFilterType(AutoFilterColumn.AUTOFILTER_FILTERTYPE_CUSTOMFILTER);
                    const and = XlsxReader.#extractXmlAttribute(customFilters.attrs, 'and');
                    column.setJoin(
                        and === '1'
                            ? AutoFilterColumn.AUTOFILTER_COLUMN_JOIN_AND
                            : AutoFilterColumn.AUTOFILTER_COLUMN_JOIN_OR,
                    );

                    const customFilterMatches = customFilters.inner.matchAll(/<customFilter\b([^>]*?)(?:\/\s*>|>)/g);
                    for (const m of customFilterMatches) {
                        const attrs = m[1] ?? '';
                        const operator =
                            XlsxReader.#extractXmlAttribute(attrs, 'operator') ??
                            AutoFilterRule.AUTOFILTER_COLUMN_RULE_EQUAL;
                        const valAttr = XlsxReader.#extractXmlAttribute(attrs, 'val');
                        if (valAttr === null) {
                            continue;
                        }
                        const value = XlsxReader.decodeXmlEntities(valAttr);
                        try {
                            const rule = column
                                .createRule()
                                .setRuleType(AutoFilterRule.AUTOFILTER_RULETYPE_CUSTOMFILTER);
                            rule.setOperator(operator);
                            rule.setValue(value);
                        } catch {
                            // Ignore invalid rule.
                        }
                    }
                    continue;
                }

                // 3) dynamicFilter
                const dynamicFilter = XlsxReader.#matchFirstXmlElement(filterColumnInner, 'dynamicFilter');
                if (dynamicFilter) {
                    column.setFilterType(AutoFilterColumn.AUTOFILTER_FILTERTYPE_DYNAMICFILTER);
                    const type = XlsxReader.#extractXmlAttribute(dynamicFilter.attrs, 'type');
                    const valAttr = XlsxReader.#extractXmlAttribute(dynamicFilter.attrs, 'val');
                    const maxValAttr = XlsxReader.#extractXmlAttribute(dynamicFilter.attrs, 'maxVal');
                    if (valAttr !== null) {
                        column.setAttribute(
                            'val',
                            XlsxReader.#parseNumberOrString(XlsxReader.decodeXmlEntities(valAttr)),
                        );
                    }
                    if (maxValAttr !== null) {
                        column.setAttribute(
                            'maxVal',
                            XlsxReader.#parseNumberOrString(XlsxReader.decodeXmlEntities(maxValAttr)),
                        );
                    }

                    try {
                        const rule = column.createRule().setRuleType(AutoFilterRule.AUTOFILTER_RULETYPE_DYNAMICFILTER);
                        if (type) {
                            try {
                                rule.setGrouping(type);
                            } catch {
                                // Ignore invalid grouping.
                            }
                        }
                    } catch {
                        // Ignore invalid rule.
                    }
                    continue;
                }

                // 4) top10
                const top10 = XlsxReader.#matchFirstXmlElement(filterColumnInner, 'top10');
                if (top10) {
                    column.setFilterType(AutoFilterColumn.AUTOFILTER_FILTERTYPE_TOPTENFILTER);

                    const topAttr = XlsxReader.#extractXmlAttribute(top10.attrs, 'top');
                    const percentAttr = XlsxReader.#extractXmlAttribute(top10.attrs, 'percent');
                    const valAttr = XlsxReader.#extractXmlAttribute(top10.attrs, 'val');
                    const filterValAttr = XlsxReader.#extractXmlAttribute(top10.attrs, 'filterVal');

                    if (filterValAttr !== null) {
                        // Match writer: store filterVal in maxVal.
                        column.setAttribute(
                            'maxVal',
                            XlsxReader.#parseNumberOrString(XlsxReader.decodeXmlEntities(filterValAttr)),
                        );
                    }

                    try {
                        const grouping =
                            topAttr === '0'
                                ? AutoFilterRule.AUTOFILTER_COLUMN_RULE_TOPTEN_BOTTOM
                                : AutoFilterRule.AUTOFILTER_COLUMN_RULE_TOPTEN_TOP;
                        const operator =
                            percentAttr === '1'
                                ? AutoFilterRule.AUTOFILTER_COLUMN_RULE_TOPTEN_PERCENT
                                : AutoFilterRule.AUTOFILTER_COLUMN_RULE_TOPTEN_BY_VALUE;

                        const rule = column.createRule().setRuleType(AutoFilterRule.AUTOFILTER_RULETYPE_TOPTENFILTER);
                        rule.setGrouping(grouping);
                        rule.setOperator(operator);
                        if (valAttr !== null) {
                            rule.setValue(XlsxReader.#parseNumberOrString(XlsxReader.decodeXmlEntities(valAttr)));
                        }
                    } catch {
                        // Ignore invalid rule.
                    }
                }
            } catch {
                // Ignore invalid filterColumn blocks.
            }
        }
    }

    static #testIfDefinedNameFormula(value: string): boolean {
        // Port of PhpSpreadsheet DefinedName::testIfFormula.
        let v = value.trim();
        if (v.startsWith('=')) {
            v = v.slice(1);
        }

        // Numeric constants are treated as named formulas in PhpSpreadsheet.
        if (/^[+-]?(?:\d+\.?\d*|\d*\.?\d+)(?:[eE][+-]?\d+)?$/.test(v)) {
            return true;
        }

        const identifyFormula = /[^_\p{N}\p{L}:, \$'!]/u;
        let check = true;
        for (const segment of v.split("'")) {
            if (check && identifyFormula.test(segment)) {
                return true;
            }
            check = !check;
        }

        return false;
    }

    static #inferSheetNameFromDefinedNameValue(value: string): string | null {
        // Try to extract the first worksheet reference in a defined name value.
        // Match PhpSpreadsheet behavior: split on comma/space outside quotes and only
        // use the first token for sheet inference.
        let v = value.trim();
        if (v.startsWith('=')) {
            v = v.slice(1).trim();
        }

        v = XlsxReader.#firstTokenSplitOnCommaOrSpaceOutsideQuotes(v);

        if (!v.includes('!')) {
            return null;
        }

        if (v.startsWith("'")) {
            for (let i = 1; i < v.length - 1; i++) {
                if (v[i] !== "'") {
                    continue;
                }
                if (v[i + 1] === "'") {
                    i++;
                    continue;
                }
                if (v[i + 1] === '!') {
                    return v.slice(1, i).replace(/''/g, "'");
                }
                break;
            }
        }

        const bangIndex = v.indexOf('!');
        if (bangIndex <= 0) {
            return null;
        }
        return v
            .slice(0, bangIndex)
            .replace(/^'+|'+$/g, '')
            .replace(/''/g, "'");
    }

    static #splitOnCommasOutsideQuotes(value: string): string[] {
        // Split on commas, but ignore commas inside single-quoted sheet names.
        // Supports doubled apostrophes inside quoted sheet names.
        const parts: string[] = [];
        let current = '';
        let inQuotes = false;

        for (let i = 0; i < value.length; i++) {
            const ch = value[i] ?? '';
            if (ch === "'") {
                if (inQuotes && value[i + 1] === "'") {
                    current += "''";
                    i++;
                    continue;
                }
                inQuotes = !inQuotes;
                current += ch;
                continue;
            }

            if (ch === ',' && !inQuotes) {
                parts.push(current);
                current = '';
                continue;
            }

            current += ch;
        }

        parts.push(current);
        return parts;
    }

    static #firstTokenSplitOnCommaOrSpaceOutsideQuotes(value: string): string {
        // Extract the first token split on comma/space outside quotes.
        // This matches the PhpSpreadsheet reader logic used for resolving a worksheet.
        let inQuotes = false;
        for (let i = 0; i < value.length; i++) {
            const ch = value[i] ?? '';
            if (ch === "'") {
                if (inQuotes && value[i + 1] === "'") {
                    i++;
                    continue;
                }
                inQuotes = !inQuotes;
                continue;
            }
            if (!inQuotes && (ch === ',' || /\s/.test(ch))) {
                return value.slice(0, i).trim();
            }
        }
        return value.trim();
    }

    static #extractPrintAreaChunks(value: string): string[] {
        // Extract print area references similarly to PhpSpreadsheet: find all occurrences
        // of (optional sheet!)A1(:B2) chunks.
        // We do not split on commas directly because commas may appear in quoted sheet names.
        const text = value.trim();

        const chunks: string[] = [];
        const pattern =
            /(?:(?:'(?:(?:[^']|'')+)')|[^'!,\s]+)!\$?[A-Z]{1,3}\$?\d+(?::\$?[A-Z]{1,3}\$?\d+)?|\$?[A-Z]{1,3}\$?\d+(?::\$?[A-Z]{1,3}\$?\d+)?/g;
        const matches = text.matchAll(pattern);
        for (const m of matches) {
            const chunk = (m[0] ?? '').trim();
            if (chunk !== '') {
                chunks.push(chunk);
            }
        }
        return chunks;
    }

    static #stripWorksheetRef(ref: string): string {
        const bangIndex = ref.lastIndexOf('!');
        return bangIndex >= 0 ? ref.slice(bangIndex + 1) : ref;
    }

    static #stripDollarAfterBang(value: string): string {
        // Match PhpSpreadsheet behavior: if there is a worksheet prefix, only strip '$'
        // after the first '!'. Otherwise strip all '$'.
        const bangIndex = value.indexOf('!');
        if (bangIndex >= 0) {
            return value.slice(0, bangIndex + 1) + value.slice(bangIndex + 1).replace(/\$/g, '');
        }
        return value.replace(/\$/g, '');
    }

    #loadDefinedNamesFromWorkbookXml(
        workbookXml: string,
        spreadsheet: Spreadsheet,
        mapSheetId: Array<number | null>,
    ): void {
        const definedNamesMatch = workbookXml.match(/<definedNames\b[^>]*>([\s\S]*?)<\/definedNames>/);
        if (!definedNamesMatch || !definedNamesMatch[1]) {
            return;
        }

        const inner = definedNamesMatch[1];

        // Single pass to preserve document order (self-closing tags included).
        const definedNameMatches = [
            ...inner.matchAll(/<definedName\b([^>]*?)(?:>([\s\S]*?)<\/definedName\s*>|\/\s*>)/g),
        ].map((m) => ({ attrs: m[1] ?? '', rawInnerText: m[2] ?? '' }));

        const resolveLocalSheet = (localSheetIdStr: string | null): Worksheet | null => {
            if (localSheetIdStr === null) return null;
            const localSheetId = Number.parseInt(localSheetIdStr, 10);
            const mapped = Number.isFinite(localSheetId) ? mapSheetId[localSheetId] : null;
            if (mapped === null || mapped === undefined) {
                return null;
            }
            try {
                return spreadsheet.getSheet(mapped);
            } catch {
                return null;
            }
        };

        // 1) Apply built-in defined names to worksheet state.
        for (const { attrs, rawInnerText } of definedNameMatches) {
            const rawName = XlsxReader.#extractXmlAttribute(attrs, 'name');
            if (!rawName) continue;
            const name = XlsxReader.decodeXmlEntities(rawName);
            if (!name.startsWith('_xlnm.')) continue;

            const localSheetIdStr = XlsxReader.#extractXmlAttribute(attrs, 'localSheetId');
            if (localSheetIdStr === null) {
                // Built-ins are worksheet scoped in PhpSpreadsheet.
                continue;
            }
            const worksheet = resolveLocalSheet(localSheetIdStr);
            if (!worksheet) continue;

            const extractedRange = XlsxReader.#stripDollarAfterBang(XlsxReader.decodeXmlEntities(rawInnerText).trim());
            if (extractedRange === '') continue;

            if (name === '_xlnm._FilterDatabase') {
                // Match PhpSpreadsheet: ignore hidden="1" _FilterDatabase.
                const hidden = XlsxReader.#extractXmlAttribute(attrs, 'hidden');
                if (hidden === '1') {
                    continue;
                }
                for (const rawPart of XlsxReader.#splitOnCommasOutsideQuotes(extractedRange)) {
                    const part = rawPart.trim();
                    if (!part.includes(':')) continue;
                    const range = XlsxReader.#stripWorksheetRef(part);
                    try {
                        worksheet.getAutoFilter().setRange(range);
                    } catch {
                        // Ignore invalid ranges.
                    }
                }
                continue;
            }

            if (name === '_xlnm.Print_Titles') {
                const pageSetup = worksheet.getPageSetup();
                for (const rawPart of XlsxReader.#splitOnCommasOutsideQuotes(extractedRange)) {
                    const part = XlsxReader.#stripWorksheetRef(rawPart.trim());
                    if (part === '') continue;

                    const colMatch = part.match(/^([A-Z]{1,3}):([A-Z]{1,3})$/);
                    if (colMatch?.[1] && colMatch[2]) {
                        pageSetup.setColumnsToRepeatAtLeftByStartAndEnd(colMatch[1], colMatch[2]);
                        continue;
                    }
                    const rowMatch = part.match(/^(\d+):(\d+)$/);
                    if (rowMatch?.[1] && rowMatch[2]) {
                        pageSetup.setRowsToRepeatAtTopByStartAndEnd(
                            Number.parseInt(rowMatch[1], 10),
                            Number.parseInt(rowMatch[2], 10),
                        );
                    }
                }
                continue;
            }

            if (name === '_xlnm.Print_Area') {
                const pageSetup = worksheet.getPageSetup();
                let firstSet = false;

                for (const rawPart of XlsxReader.#extractPrintAreaChunks(extractedRange)) {
                    const part = XlsxReader.#stripWorksheetRef(rawPart.trim());
                    if (part === '') continue;

                    let range = part;
                    if (!range.includes(':')) {
                        // PhpSpreadsheet converts single-cell print areas to a 2D range.
                        range = `${range}:${range}`;
                    }

                    // PageSetup rejects absolute refs and worksheet refs.
                    range = range.replace(/\$/g, '');
                    if (!range.includes(':') || range.includes('!')) continue;
                    try {
                        if (!firstSet) {
                            pageSetup.setPrintArea(range);
                            firstSet = true;
                        } else {
                            pageSetup.addPrintArea(range);
                        }
                    } catch {
                        // Ignore invalid ranges.
                    }
                }
            }
        }

        // 2) Add user-defined names (named ranges / named formulas).
        for (const { attrs, rawInnerText } of definedNameMatches) {
            const rawName = XlsxReader.#extractXmlAttribute(attrs, 'name');
            if (!rawName) continue;
            const name = XlsxReader.decodeXmlEntities(rawName);

            if (name.startsWith('_xlnm.')) {
                // Built-ins are applied above; do not model as user-defined names.
                continue;
            }

            const extractedRange = XlsxReader.decodeXmlEntities(rawInnerText).trim();
            if (extractedRange === '') continue;

            const localSheetIdStr = XlsxReader.#extractXmlAttribute(attrs, 'localSheetId');

            let localOnly = false;
            let scope: Worksheet | null = null;
            let worksheetForResolution: Worksheet | null = null;

            if (localSheetIdStr !== null) {
                scope = resolveLocalSheet(localSheetIdStr);
                if (!scope) {
                    // Sheet not loaded (read filter), skip local-only names.
                    continue;
                }
                localOnly = true;

                // If the value references another sheet and it's loaded, associate the name with that sheet.
                const inferredSheetName = extractedRange.includes('!')
                    ? XlsxReader.#inferSheetNameFromDefinedNameValue(extractedRange)
                    : null;
                const inferred = inferredSheetName ? spreadsheet.getSheetByName(inferredSheetName) : undefined;
                worksheetForResolution = inferred ?? scope;
            } else {
                const inferredSheetName = extractedRange.includes('!')
                    ? XlsxReader.#inferSheetNameFromDefinedNameValue(extractedRange)
                    : null;
                worksheetForResolution = inferredSheetName
                    ? (spreadsheet.getSheetByName(inferredSheetName) ?? null)
                    : null;
            }

            const isFormula = XlsxReader.#testIfDefinedNameFormula(extractedRange);
            let storedValue = extractedRange;

            if (!localOnly) {
                // PhpSpreadsheet behavior: only force #REF! for global names that reference a sheet
                // (contain '!') but cannot be resolved.
                if (extractedRange.includes('!') && !worksheetForResolution && !isFormula) {
                    storedValue = '#REF!';
                }
            }

            if (isFormula) {
                if (!storedValue.startsWith('=')) {
                    storedValue = `=${storedValue}`;
                }
            } else if (storedValue.startsWith('=')) {
                storedValue = storedValue.slice(1);
            }

            // Our NamedRange implementation requires a worksheet/scope; keep a stable default.
            if (!worksheetForResolution) {
                try {
                    worksheetForResolution = spreadsheet.getSheet(0);
                } catch {
                    continue;
                }
            }

            const existing = spreadsheet.getDefinedNames().find((dn) => {
                if (dn.getName() !== name) return false;
                if (localOnly) {
                    return dn.getLocalOnly() && dn.getScope() === scope;
                }
                return !dn.getLocalOnly();
            });
            if (existing) continue;

            const definedName = new NamedRange(name, worksheetForResolution, storedValue, localOnly, scope);
            spreadsheet.addDefinedName(definedName);
        }
    }

    static #parseChartTitleText(chartXml: string): string | null {
        const titleMatch = chartXml.match(/<c:title\b[^>]*>([\s\S]*?)<\/c:title>/);
        if (!titleMatch || !titleMatch[1]) {
            return null;
        }

        const titleInner = titleMatch[1];
        const txMatch = titleInner.match(/<c:tx\b[^>]*>([\s\S]*?)<\/c:tx>/);
        if (!txMatch || !txMatch[1]) {
            return null;
        }

        const txInner = txMatch[1];

        // c:tx/c:rich//a:t
        const richMatch = txInner.match(/<c:rich\b[^>]*>([\s\S]*?)<\/c:rich>/);
        if (richMatch && richMatch[1] !== undefined) {
            const richText = XlsxReader.#extractTextFromATNodes(richMatch[1]);
            if (richText !== '') {
                return richText;
            }
        }

        // c:tx/c:strRef/c:strCache//c:v
        const strRefMatch = txInner.match(/<c:strRef\b[^>]*>([\s\S]*?)<\/c:strRef>/);
        const strCacheMatch = strRefMatch?.[1]?.match(/<c:strCache\b[^>]*>([\s\S]*?)<\/c:strCache>/);
        if (strCacheMatch && strCacheMatch[1] !== undefined) {
            const parts: string[] = [];
            const vMatches = strCacheMatch[1].matchAll(/<c:v\b[^>]*>([\s\S]*?)<\/c:v>/g);
            for (const v of vMatches) {
                parts.push(XlsxReader.decodeXmlEntities((v[1] ?? '').trim()));
            }
            const value = parts.join('');
            if (value !== '') {
                return value;
            }
        }

        return null;
    }

    static #parseChartSeries(chartXml: string): ChartSeriesModel[] {
        const series: ChartSeriesModel[] = [];
        const serMatches = chartXml.matchAll(/<c:ser\b[^>]*>([\s\S]*?)<\/c:ser>/g);

        const parseValTag = (serInner: string, tagName: 'cat' | 'val'): string | null => {
            const tagMatch = serInner.match(new RegExp(`<c:${tagName}\\b[^>]*>([\\s\\S]*?)<\\/c:${tagName}>`));
            const tagInner = tagMatch?.[1] ?? '';
            if (tagInner === '') {
                return null;
            }

            const refMatch = tagInner.match(
                /<c:(strRef|numRef|multiLvlStrRef|multiLvlNumRef)\b[^>]*>([\s\S]*?)<\/c:\1>/,
            );
            const refInner = refMatch?.[2] ?? '';
            if (refInner === '') {
                return null;
            }

            const fMatch = refInner.match(/<c:f\b[^>]*>([\s\S]*?)<\/c:f>/);
            const f = fMatch?.[1] ?? '';
            return f !== '' ? XlsxReader.decodeXmlEntities(f.trim()) : null;
        };

        for (const match of serMatches) {
            const serInner = match[1] ?? '';
            const idxAttrs = serInner.match(/<c:idx\b([^>]*)\/>/)?.[1] ?? null;
            const orderAttrs = serInner.match(/<c:order\b([^>]*)\/>/)?.[1] ?? null;
            const idxStr = idxAttrs ? XlsxReader.#extractXmlAttribute(idxAttrs, 'val') : null;
            const orderStr = orderAttrs ? XlsxReader.#extractXmlAttribute(orderAttrs, 'val') : null;

            const idx = idxStr ? Number.parseInt(idxStr, 10) : NaN;
            const order = orderStr ? Number.parseInt(orderStr, 10) : NaN;

            const model: ChartSeriesModel = {
                categoryFormula: parseValTag(serInner, 'cat'),
                valuesFormula: parseValTag(serInner, 'val'),
            };
            if (Number.isFinite(idx)) {
                model.idx = idx;
            }
            if (Number.isFinite(order)) {
                model.order = order;
            }
            series.push(model);
        }

        return series;
    }

    /**
     * Parse chart data with styling (DataSeries, legend, etc.)
     */
    static #parseChartDataWithStyling(chartXml: string): {
        dataSeries: DataSeries[];
        legend: { position: LegendPosition; title?: string; overlay: boolean } | null;
    } {
        const dataSeries: DataSeries[] = [];
        let legend: { position: LegendPosition; title?: string; overlay: boolean } | null = null;

        // Parse legend
        const legendMatch = chartXml.match(/<c:legend\b[^>]*>([\s\S]*?)<\/c:legend>/);
        if (legendMatch && legendMatch[1]) {
            const legendInner = legendMatch[1];

            // Parse legend position
            const legendPosMatch = legendInner.match(/<c:legendPos\b[^>]*\bval="([^"]*)"/);
            const posMap: Record<string, LegendPosition> = {
                t: 'top',
                b: 'bottom',
                l: 'left',
                r: 'right',
            };
            const position = posMap[legendPosMatch?.[1] ?? 'r'] ?? 'right';

            // Parse overlay
            const overlayMatch = legendInner.match(/<c:overlay\b[^>]*\bval="([^"]*)"/);
            const overlay = overlayMatch?.[1] === '1';

            legend = { position, overlay };

            // Parse legend title if present
            const titleMatch = legendInner.match(/<c:tx\b[^>]*>([\s\S]*?)<\/c:tx>/);
            if (titleMatch && titleMatch[1]) {
                const titleText = XlsxReader.#extractTextFromATNodes(titleMatch[1]);
                if (titleText) {
                    legend.title = titleText;
                }
            }
        }

        // Determine chart type from plot area
        const plotAreaMatch = chartXml.match(/<c:plotArea\b[^>]*>([\s\S]*?)<\/c:plotArea>/);
        if (!plotAreaMatch || !plotAreaMatch[1]) {
            return { dataSeries, legend };
        }

        const plotAreaInner = plotAreaMatch[1];

        // Map chart type elements to plot types
        const chartTypeMap: Record<string, string> = {
            'c:barChart': 'bar',
            'c:lineChart': 'line',
            'c:pieChart': 'pie',
            'c:areaChart': 'area',
            'c:scatterChart': 'scatter',
            'c:bubbleChart': 'bubble',
            'c:doughnutChart': 'doughnut',
            'c:radarChart': 'radar',
            'c:surfaceChart': 'surface',
            'c:stockChart': 'stock',
        };

        // Find chart type
        let plotType = 'bar';
        for (const [tag, type] of Object.entries(chartTypeMap)) {
            if (plotAreaInner.includes(`<${tag}`)) {
                plotType = type;
                break;
            }
        }

        // Parse data series
        const serMatches = chartXml.matchAll(/<c:ser\b[^>]*>([\s\S]*?)<\/c:ser>/g);

        for (const match of serMatches) {
            const serInner = match[1] ?? '';

            // Create data series
            const series = new DataSeries(plotType as any);

            // Parse idx and order
            const idxMatch = serInner.match(/<c:idx\b[^>]*\bval="([^"]*)"/);
            const orderMatch = serInner.match(/<c:order\b[^>]*\bval="([^"]*)"/);
            if (idxMatch) {
                series.setPlotOrder(Number.parseInt(idxMatch[1]!, 10));
            } else if (orderMatch) {
                series.setPlotOrder(Number.parseInt(orderMatch[1]!, 10));
            }

            // Parse shape properties (styling)
            const spPrMatch = serInner.match(/<c:spPr\b[^>]*>([\s\S]*?)<\/c:spPr>/);
            if (spPrMatch && spPrMatch[1]) {
                const spPrInner = spPrMatch[1];

                // Parse fill color
                const solidFillMatch = spPrInner.match(/<a:solidFill>([\s\S]*?)<\/a:solidFill>/);
                if (solidFillMatch && solidFillMatch[1]) {
                    const srgbMatch = solidFillMatch[1].match(/<a:srgbClr\b[^>]*\bval="([^"]*)"/);
                    if (srgbMatch) {
                        series.setFillColor(srgbMatch[1]!);
                    }
                }

                // Parse line/border properties
                const lnMatch = spPrInner.match(/<a:ln\b([^>]*)>([\s\S]*?)<\/a:ln>/);
                if (lnMatch) {
                    // Parse line width
                    const wMatch = lnMatch[1]?.match(/\bw="([^"]*)"/);
                    if (wMatch) {
                        series.setLineWidth(Number.parseInt(wMatch[1]!, 10));
                    }

                    // Parse line/border color
                    const lnSolidFill = lnMatch[2]?.match(/<a:solidFill>([\s\S]*?)<\/a:solidFill>/);
                    if (lnSolidFill && lnSolidFill[1]) {
                        const lnSrgbMatch = lnSolidFill[1].match(/<a:srgbClr\b[^>]*\bval="([^"]*)"/);
                        if (lnSrgbMatch) {
                            series.setBorderColor(lnSrgbMatch[1]!);
                        }
                    }
                }
            }

            // Parse category (cat/xVal)
            const catMatch = serInner.match(/<c:cat\b[^>]*>([\s\S]*?)<\/c:cat>/);
            const xValMatch = serInner.match(/<c:xVal\b[^>]*>([\s\S]*?)<\/c:xVal>/);
            const catContent = catMatch?.[1] ?? xValMatch?.[1];
            if (catContent) {
                const fMatch = catContent.match(/<c:f>([^<]*)<\/c:f>/);
                if (fMatch && fMatch[1]) {
                    const isNum = catContent.includes('<c:numRef') || catContent.includes('<c:numCache');
                    series.setPlotCategory(new DataSeriesValues(isNum ? 'Number' : 'String', fMatch[1]));
                }
            }

            // Parse values (val/yVal)
            const valMatch = serInner.match(/<c:val\b[^>]*>([\s\S]*?)<\/c:val>/);
            const yValMatch = serInner.match(/<c:yVal\b[^>]*>([\s\S]*?)<\/c:yVal>/);
            const valContent = valMatch?.[1] ?? yValMatch?.[1];
            if (valContent) {
                const fMatch = valContent.match(/<c:f>([^<]*)<\/c:f>/);
                if (fMatch && fMatch[1]) {
                    series.addPlotValues(new DataSeriesValues('Number', fMatch[1]));
                }
            }

            dataSeries.push(series);
        }

        return { dataSeries, legend };
    }

    static #parseRichTextFromXml(textXml: string): RichText {
        // Minimal rich text parser: keeps run boundaries, ignores formatting.
        // If there are <r> nodes, each becomes a text run; otherwise fall back to <t> concatenation.
        const richText = new RichText();

        const rMatches = [...textXml.matchAll(/<r\b[^>]*>([\s\S]*?)<\/r>/g)];
        if (rMatches.length > 0) {
            for (const rMatch of rMatches) {
                const rInner = rMatch[1] ?? '';
                const t = XlsxReader.#extractTextFromTNodes(rInner);
                if (t !== '') {
                    richText.createTextRun(t);
                }
            }
            return richText;
        }

        const t = XlsxReader.#extractTextFromTNodes(textXml);
        if (t !== '') {
            richText.createText(t);
        }
        return richText;
    }

    static #parseRelationshipsXml(
        relsXml: string,
    ): Array<{ id: string; type: string; target: string; targetMode: string | null }> {
        const relationships: Array<{
            id: string;
            type: string;
            target: string;
            targetMode: string | null;
        }> = [];
        const relMatches = relsXml.matchAll(/<Relationship\b([^>]*)\/>/g);
        for (const match of relMatches) {
            const attrs = match[1] ?? '';
            const id = XlsxReader.#extractXmlAttribute(attrs, 'Id');
            const type = XlsxReader.#extractXmlAttribute(attrs, 'Type');
            const target = XlsxReader.#extractXmlAttribute(attrs, 'Target');
            const targetMode = XlsxReader.#extractXmlAttribute(attrs, 'TargetMode');
            if (id && type && target) {
                relationships.push({ id, type, target, targetMode });
            }
        }
        return relationships;
    }

    async #readZipTextFile(zip: unzipper.CentralDirectory, zipPath: string): Promise<string | null> {
        const entry = zip.files.find((f) => f.path === zipPath);
        if (!entry) {
            return null;
        }
        const buf = await entry.buffer();
        return buf.toString('utf-8');
    }

    async #readZipBinaryFile(zip: unzipper.CentralDirectory, zipPath: string): Promise<Uint8Array | null> {
        const entry = zip.files.find((f) => f.path === zipPath);
        if (!entry) {
            return null;
        }
        return new Uint8Array(await entry.buffer());
    }

    static #normalizeToUint8Array(data: Uint8Array | ArrayBuffer): Uint8Array {
        return data instanceof Uint8Array ? data : new Uint8Array(data);
    }

    async #openZipFromBuffer(data: Uint8Array | ArrayBuffer): Promise<unzipper.CentralDirectory> {
        const uint8 = XlsxReader.#normalizeToUint8Array(data);
        return unzipper.Open.buffer(Buffer.from(uint8));
    }

    static #emuToPx(emu: number): number {
        if (!Number.isFinite(emu)) {
            return 0;
        }
        return Math.round(emu / XlsxReader.#EMU_PER_PIXEL);
    }

    static #mimeTypeFromExtension(ext: string): string {
        const normalized = ext.toLowerCase();
        switch (normalized) {
            case 'png':
                return 'image/png';
            case 'jpg':
            case 'jpeg':
                return 'image/jpeg';
            case 'gif':
                return 'image/gif';
            case 'bmp':
                return 'image/bmp';
            case 'webp':
                return 'image/webp';
            case 'tif':
            case 'tiff':
                return 'image/tiff';
            default:
                return '';
        }
    }

    async #loadWorksheetDrawings(
        zip: unzipper.CentralDirectory,
        worksheetPath: string,
        worksheetXml: string,
        worksheet: Worksheet,
    ): Promise<void> {
        const drawingTagMatches = [...worksheetXml.matchAll(/<drawing\b([^>]*)\/>/g)];
        if (drawingTagMatches.length === 0) {
            return;
        }

        const worksheetRelsPath = worksheetPath
            .replace('xl/worksheets/', 'xl/worksheets/_rels/')
            .replace('.xml', '.xml.rels');
        const relsXml = await this.#readZipTextFile(zip, worksheetRelsPath);
        if (!relsXml) {
            return;
        }

        const rels = XlsxReader.#parseRelationshipsXml(relsXml);

        for (const drawingTagMatch of drawingTagMatches) {
            const attrs = drawingTagMatch[1] ?? '';
            const rId = XlsxReader.#extractXmlAttribute(attrs, 'r:id') ?? XlsxReader.#extractXmlAttribute(attrs, 'id');
            if (!rId) {
                continue;
            }

            const drawingRel = rels.find((r) => r.id === rId && r.type === XlsxReader.#DRAWING_REL_TYPE);
            const drawingTarget = drawingRel?.target;
            if (!drawingTarget) {
                continue;
            }

            const drawingPath = XlsxReader.#resolveRelationshipTarget(worksheetPath, drawingTarget);
            const drawingXml = await this.#readZipTextFile(zip, drawingPath);
            if (!drawingXml) {
                continue;
            }

            const drawingRelsPath = path.posix.join(
                path.posix.dirname(drawingPath),
                '_rels',
                `${path.posix.basename(drawingPath)}.rels`,
            );
            const drawingRelsXml = await this.#readZipTextFile(zip, drawingRelsPath);
            const drawingRels = drawingRelsXml ? XlsxReader.#parseRelationshipsXml(drawingRelsXml) : [];

            const anchorMatches = drawingXml.matchAll(
                /<xdr:(oneCellAnchor|twoCellAnchor)\b[^>]*>([\s\S]*?)<\/xdr:\1>/g,
            );

            for (const anchorMatch of anchorMatches) {
                const anchorType = anchorMatch[1] ?? '';
                const anchorInner = anchorMatch[2] ?? '';
                void anchorType;

                const fromMatch = anchorInner.match(/<xdr:from\b[^>]*>([\s\S]*?)<\/xdr:from>/);
                const fromInner = fromMatch?.[1] ?? '';

                const col = Number.parseInt((fromInner.match(/<xdr:col>(\d+)<\/xdr:col>/)?.[1] ?? '0').trim(), 10);
                const row = Number.parseInt((fromInner.match(/<xdr:row>(\d+)<\/xdr:row>/)?.[1] ?? '0').trim(), 10);
                const colOffEmu = Number.parseInt(
                    (fromInner.match(/<xdr:colOff>(\d+)<\/xdr:colOff>/)?.[1] ?? '0').trim(),
                    10,
                );
                const rowOffEmu = Number.parseInt(
                    (fromInner.match(/<xdr:rowOff>(\d+)<\/xdr:rowOff>/)?.[1] ?? '0').trim(),
                    10,
                );

                const coordinates = Coordinate.stringFromCoordinate(col + 1, row + 1);

                let cxEmu = 0;
                let cyEmu = 0;
                const extMatch = anchorInner.match(/<xdr:ext\b[^>]*cx="(\d+)"[^>]*cy="(\d+)"[^>]*\/>/);
                if (extMatch) {
                    cxEmu = Number.parseInt(extMatch[1] ?? '0', 10);
                    cyEmu = Number.parseInt(extMatch[2] ?? '0', 10);
                } else {
                    const aExtMatch = anchorInner.match(/<a:ext\b[^>]*cx="(\d+)"[^>]*cy="(\d+)"[^>]*\/>/);
                    if (aExtMatch) {
                        cxEmu = Number.parseInt(aExtMatch[1] ?? '0', 10);
                        cyEmu = Number.parseInt(aExtMatch[2] ?? '0', 10);
                    }
                }

                const embedId = anchorInner.match(/r:embed="([^"]+)"/)?.[1] ?? null;

                let imageBytes: Uint8Array | null = null;
                let extension = '';
                let mimeType = '';
                if (embedId) {
                    const imgRel = drawingRels.find((r) => r.id === embedId);
                    if (imgRel?.target) {
                        const mediaPath = XlsxReader.#resolveRelationshipTarget(drawingPath, imgRel.target);
                        imageBytes = await this.#readZipBinaryFile(zip, mediaPath);

                        const ext = path.posix.extname(mediaPath);
                        extension = ext.startsWith('.') ? ext.slice(1).toLowerCase() : ext.toLowerCase();
                        mimeType = XlsxReader.#mimeTypeFromExtension(extension);
                    }
                }

                // Only create a Drawing if it references an image.
                if (!imageBytes) {
                    continue;
                }

                const drawing = new Drawing();
                drawing.setCoordinates(coordinates);
                drawing.setOffsetX(XlsxReader.#emuToPx(colOffEmu));
                drawing.setOffsetY(XlsxReader.#emuToPx(rowOffEmu));
                drawing.setWidth(XlsxReader.#emuToPx(cxEmu));
                drawing.setHeight(XlsxReader.#emuToPx(cyEmu));
                drawing.setImageData(imageBytes, mimeType, extension);

                // Attach to worksheet.
                worksheet.addDrawing(drawing);
            }
        }
    }

    async #loadWorksheetCharts(
        zip: unzipper.CentralDirectory,
        worksheetPath: string,
        worksheetXml: string,
        worksheet: Worksheet,
    ): Promise<void> {
        if (!this.#includeCharts) {
            return;
        }

        const drawingTagMatches = [...worksheetXml.matchAll(/<drawing\b([^>]*)\/>/g)];
        if (drawingTagMatches.length === 0) {
            return;
        }

        const worksheetRelsPath = worksheetPath
            .replace('xl/worksheets/', 'xl/worksheets/_rels/')
            .replace('.xml', '.xml.rels');
        const relsXml = await this.#readZipTextFile(zip, worksheetRelsPath);
        if (!relsXml) {
            return;
        }

        const rels = XlsxReader.#parseRelationshipsXml(relsXml);

        const parseCellAnchor = (
            anchorInner: string,
            tag: 'from' | 'to',
        ): { cell: string; offX: number; offY: number } | null => {
            const m = anchorInner.match(new RegExp(`<xdr:${tag}\\b[^>]*>([\\s\\S]*?)<\\/xdr:${tag}>`));
            if (!m || !m[1]) {
                return null;
            }
            const inner = m[1];

            const col = Number.parseInt((inner.match(/<xdr:col>(\d+)<\/xdr:col>/)?.[1] ?? '0').trim(), 10);
            const row = Number.parseInt((inner.match(/<xdr:row>(\d+)<\/xdr:row>/)?.[1] ?? '0').trim(), 10);
            const colOffEmu = Number.parseInt((inner.match(/<xdr:colOff>(\d+)<\/xdr:colOff>/)?.[1] ?? '0').trim(), 10);
            const rowOffEmu = Number.parseInt((inner.match(/<xdr:rowOff>(\d+)<\/xdr:rowOff>/)?.[1] ?? '0').trim(), 10);

            return {
                cell: Coordinate.stringFromCoordinate(col + 1, row + 1),
                offX: XlsxReader.#emuToPx(colOffEmu),
                offY: XlsxReader.#emuToPx(rowOffEmu),
            };
        };

        const parseAbsoluteAnchor = (anchorInner: string): { cell: string; offX: number; offY: number } | null => {
            const posMatch = anchorInner.match(/<xdr:pos\b[^>]*x="(\d+)"[^>]*y="(\d+)"[^>]*\/>/);
            if (!posMatch) {
                return null;
            }
            const xEmu = Number.parseInt(posMatch[1] ?? '0', 10);
            const yEmu = Number.parseInt(posMatch[2] ?? '0', 10);
            return {
                cell: 'A1',
                offX: XlsxReader.#emuToPx(xEmu),
                offY: XlsxReader.#emuToPx(yEmu),
            };
        };

        for (const drawingTagMatch of drawingTagMatches) {
            const attrs = drawingTagMatch[1] ?? '';
            const rId = XlsxReader.#extractXmlAttribute(attrs, 'r:id') ?? XlsxReader.#extractXmlAttribute(attrs, 'id');
            if (!rId) {
                continue;
            }

            const drawingRel = rels.find((r) => r.id === rId && r.type === XlsxReader.#DRAWING_REL_TYPE);
            const drawingTarget = drawingRel?.target;
            if (!drawingTarget) {
                continue;
            }

            const drawingPath = XlsxReader.#resolveRelationshipTarget(worksheetPath, drawingTarget);
            const drawingXml = await this.#readZipTextFile(zip, drawingPath);
            if (!drawingXml) {
                continue;
            }

            const drawingRelsPath = path.posix.join(
                path.posix.dirname(drawingPath),
                '_rels',
                `${path.posix.basename(drawingPath)}.rels`,
            );
            const drawingRelsXml = await this.#readZipTextFile(zip, drawingRelsPath);
            const drawingRels = drawingRelsXml ? XlsxReader.#parseRelationshipsXml(drawingRelsXml) : [];

            const anchorMatches = drawingXml.matchAll(
                /<xdr:(oneCellAnchor|twoCellAnchor|absoluteAnchor)\b[^>]*>([\s\S]*?)<\/xdr:\1>/g,
            );

            for (const anchorMatch of anchorMatches) {
                const anchorType = anchorMatch[1] ?? '';
                const anchorInner = anchorMatch[2] ?? '';

                const graphicFrames = anchorInner.matchAll(/<xdr:graphicFrame\b[^>]*>([\s\S]*?)<\/xdr:graphicFrame>/g);
                for (const gf of graphicFrames) {
                    const graphicFrameInner = gf[1] ?? '';
                    const isChart =
                        /<a:graphicData\b[^>]*\buri="http:\/\/schemas\.openxmlformats\.org\/drawingml\/2006\/chart"/.test(
                            graphicFrameInner,
                        );
                    if (!isChart) {
                        continue;
                    }

                    const chartRid = graphicFrameInner.match(/<c:chart\b[^>]*\br:id="([^"]+)"/)?.[1] ?? null;
                    if (!chartRid) {
                        continue;
                    }

                    const chartRel = drawingRels.find(
                        (r) => r.id === chartRid && r.type === XlsxReader.#CHART_REL_TYPE,
                    );
                    if (!chartRel?.target) {
                        continue;
                    }

                    const chartXmlPath = XlsxReader.#resolveRelationshipTarget(drawingPath, chartRel.target);

                    const chartXml = await this.#readZipTextFile(zip, chartXmlPath);

                    const chart = new Chart();
                    chart.setChartXmlPath(chartXmlPath);

                    const cNvPrMatch = graphicFrameInner.match(/<xdr:cNvPr\b([^>]*)\/?>(?:[\s\S]*?)?/);
                    if (cNvPrMatch) {
                        const attrs = cNvPrMatch[1] ?? '';
                        const name = XlsxReader.#extractXmlAttribute(attrs, 'name');
                        if (name) {
                            chart.setName(name);
                        }
                    }

                    if (chartXml) {
                        chart.setTitleText(XlsxReader.#parseChartTitleText(chartXml));
                        chart.setSeries(XlsxReader.#parseChartSeries(chartXml));
                        // Parse new-style chart data with styling
                        const { dataSeries, legend } = XlsxReader.#parseChartDataWithStyling(chartXml);
                        if (dataSeries.length > 0) {
                            chart.setPlotArea(dataSeries);
                        }
                        if (legend) {
                            chart.setLegendPosition(legend.position);
                            if (legend.title) {
                                chart.setLegendTitle(legend.title);
                            }
                            chart.setLegendOverlay(legend.overlay);
                        }
                    }

                    if (anchorType === 'twoCellAnchor') {
                        const from = parseCellAnchor(anchorInner, 'from');
                        const to = parseCellAnchor(anchorInner, 'to');
                        if (from) {
                            chart.setTopLeftPosition({ cell: from.cell, offsetX: from.offX, offsetY: from.offY });
                        }
                        if (to) {
                            chart.setBottomRightPosition({ cell: to.cell, offsetX: to.offX, offsetY: to.offY });
                        }
                    } else if (anchorType === 'oneCellAnchor') {
                        const from = parseCellAnchor(anchorInner, 'from');
                        if (from) {
                            chart.setTopLeftPosition({ cell: from.cell, offsetX: from.offX, offsetY: from.offY });
                        }
                    } else if (anchorType === 'absoluteAnchor') {
                        const pos = parseAbsoluteAnchor(anchorInner);
                        if (pos) {
                            chart.setTopLeftPosition({ cell: pos.cell, offsetX: pos.offX, offsetY: pos.offY });
                        }
                    }

                    worksheet.addChart(chart);
                }
            }
        }
    }

    async #loadWorksheetTables(
        zip: unzipper.CentralDirectory,
        worksheetPath: string,
        worksheetXml: string,
        worksheet: Worksheet,
    ): Promise<void> {
        const tablePartsMatch = worksheetXml.match(/<tableParts\b[^>]*>([\s\S]*?)<\/tableParts>/);
        if (!tablePartsMatch || !tablePartsMatch[1]) {
            return;
        }

        const inner = tablePartsMatch[1];
        const partMatches = [...inner.matchAll(/<tablePart\b([^>]*)\/>/g)];
        if (partMatches.length === 0) {
            return;
        }

        const worksheetRelsPath = worksheetPath
            .replace('xl/worksheets/', 'xl/worksheets/_rels/')
            .replace('.xml', '.xml.rels');
        const relsXml = await this.#readZipTextFile(zip, worksheetRelsPath);
        if (!relsXml) {
            return;
        }
        const rels = XlsxReader.#parseRelationshipsXml(relsXml);

        for (const m of partMatches) {
            const attrs = m[1] ?? '';
            const rId = XlsxReader.#extractXmlAttribute(attrs, 'r:id') ?? XlsxReader.#extractXmlAttribute(attrs, 'id');
            if (!rId) {
                continue;
            }

            const tableRel = rels.find((r) => r.id === rId && r.type === XlsxReader.#TABLE_REL_TYPE);
            if (!tableRel?.target) {
                continue;
            }

            const tablePath = XlsxReader.#resolveRelationshipTarget(worksheetPath, tableRel.target);
            const tableXml = await this.#readZipTextFile(zip, tablePath);
            if (!tableXml) {
                continue;
            }

            const table = new TableReader(this, worksheet, tableXml).load();
            if (!table) {
                continue;
            }
            worksheet.addTable(table);
        }
    }

    /**
     * Can the current reader read the file?
     */
    async canRead(filename: string): Promise<boolean> {
        try {
            const file = await open(filename);
            await file.close();
            // TODO: Check if it's a valid ZIP file with required XLSX structure
            return true;
        } catch {
            return false;
        }
    }

    /**
     * List worksheet names in the file without loading the whole spreadsheet.
     */
    async #listWorksheetNamesFromZip(zip: unzipper.CentralDirectory): Promise<string[]> {
        const relsFile = zip.files.find((f) => f.path === '_rels/.rels');
        if (!relsFile) {
            throw new Error('Invalid XLSX file: missing _rels/.rels');
        }

        const relsContent = await relsFile.buffer();
        const relsXml = relsContent.toString('utf-8');

        // Extract workbook path from rels
        const workbookMatch = relsXml.match(/Target="([^"]*workbook\.xml)"/);
        if (!workbookMatch) {
            throw new Error('Invalid XLSX file: cannot find workbook.xml in _rels/.rels');
        }

        const workbookPath = (workbookMatch[1] ?? '').replace(/^\//, '');
        if (!workbookPath) {
            throw new Error('Invalid XLSX file: cannot determine workbook path');
        }
        const workbookFile = zip.files.find((f) => f.path === workbookPath);
        if (!workbookFile) {
            throw new Error(`Invalid XLSX file: missing ${workbookPath}`);
        }

        const workbookContent = await workbookFile.buffer();
        const workbookXml = workbookContent.toString('utf-8');

        // Extract sheet names
        const sheetNames: string[] = [];
        const sheetMatches = workbookXml.matchAll(/<sheet\b([^>]*)\/?>(?:[\s\S]*?<\/sheet\s*>)?/g);
        for (const match of sheetMatches) {
            const attrs = match[1] ?? '';
            const nameRaw = XlsxReader.#extractXmlAttribute(attrs, 'name');
            if (nameRaw) {
                sheetNames.push(XlsxReader.decodeXmlEntities(nameRaw));
            }
        }

        return sheetNames;
    }

    /**
     * List worksheet names in the buffer without loading the whole spreadsheet.
     */
    public async listWorksheetNamesFromBuffer(data: Uint8Array | ArrayBuffer): Promise<string[]> {
        try {
            const zip = await this.#openZipFromBuffer(data);
            return await this.#listWorksheetNamesFromZip(zip);
        } catch (error) {
            if (error instanceof Error) {
                throw new Error(`Failed to read XLSX file: ${error.message}`);
            }
            throw new Error('Failed to read XLSX file');
        }
    }

    /**
     * List worksheet names in the file without loading the whole spreadsheet.
     */
    async listWorksheetNames(filename: string): Promise<string[]> {
        let data: Uint8Array;
        try {
            data = await readFile(filename);
        } catch (error) {
            if (error instanceof Error) {
                throw new Error(`Failed to read XLSX file: ${error.message}`);
            }
            throw new Error('Failed to read XLSX file');
        }

        return this.listWorksheetNamesFromBuffer(data);
    }

    /**
     * Return worksheet info.
     */
    async #listWorksheetInfoFromZip(zip: unzipper.CentralDirectory): Promise<WorksheetInfo[]> {
        const relsFile = zip.files.find((f) => f.path === '_rels/.rels');
        if (!relsFile) {
            throw new Error('Invalid XLSX file: missing _rels/.rels');
        }

        const relsContent = await relsFile.buffer();
        const relsXml = relsContent.toString('utf-8');

        const workbookMatch = relsXml.match(/Target="([^"]*workbook\.xml)"/);
        if (!workbookMatch) {
            throw new Error('Invalid XLSX file: cannot find workbook.xml in _rels/.rels');
        }

        const workbookPath = (workbookMatch[1] ?? '').replace(/^\//, '');
        if (!workbookPath) {
            throw new Error('Invalid XLSX file: cannot determine workbook path');
        }
        const workbookRelPath = workbookPath.replace('xl/', 'xl/_rels/').replace('.xml', '.xml.rels');

        const workbookFile = zip.files.find((f) => f.path === workbookPath);
        if (!workbookFile) {
            throw new Error(`Invalid XLSX file: missing ${workbookPath}`);
        }

        const workbookContent = await workbookFile.buffer();
        const workbookXml = workbookContent.toString('utf-8');

        // Parse workbook relationships to find worksheet paths
        const workbookRelsFile = zip.files.find((f) => f.path === workbookRelPath);
        const worksheetPaths: Map<string, string> = new Map();

        if (workbookRelsFile) {
            const relsContent = await workbookRelsFile.buffer();
            const relsXml = relsContent.toString('utf-8');

            const worksheetMatches = relsXml.matchAll(
                /<Relationship[^>]*Id="([^"]+)"[^>]*Type="[^"]*worksheet"[^>]*Target="([^"]+)"/g,
            );
            for (const match of worksheetMatches) {
                const rId = match[1];
                const target = match[2];
                if (rId && target) {
                    const cleanTarget = target.replace(/^\//, '');
                    worksheetPaths.set(rId, cleanTarget.startsWith('xl/') ? cleanTarget : `xl/${cleanTarget}`);
                }
            }
        }

        // Parse sheets from workbook.xml
        // Note: attribute order is not guaranteed; parse attributes rather than relying on regex group order.
        const sheetMatches = workbookXml.matchAll(/<sheet\b([^>]*)\/?>(?:[\s\S]*?<\/sheet\s*>)?/g);
        const sheets: { name: string; rId: string; state: string }[] = [];
        for (const match of sheetMatches) {
            const attrs = match[1] ?? '';
            const nameRaw = XlsxReader.#extractXmlAttribute(attrs, 'name');
            const rId = XlsxReader.#extractXmlAttribute(attrs, 'r:id') ?? XlsxReader.#extractXmlAttribute(attrs, 'id');
            if (!nameRaw || !rId) {
                continue;
            }

            const name = XlsxReader.decodeXmlEntities(nameRaw);
            const stateRaw = XlsxReader.#extractXmlAttribute(attrs, 'state');
            const state = stateRaw !== null ? XlsxReader.decodeXmlEntities(stateRaw) : 'visible';
            sheets.push({ name, rId, state });
        }

        const worksheetInfo: WorksheetInfo[] = [];

        // Get info for each worksheet
        for (const sheetInfo of sheets) {
            const worksheetPath = worksheetPaths.get(sheetInfo.rId);
            if (!worksheetPath) {
                continue;
            }

            const wsFile = zip.files.find((f) => f.path === worksheetPath);
            if (!wsFile) {
                continue;
            }

            const wsContent = await wsFile.buffer();
            const wsXml = wsContent.toString('utf-8');

            // Find dimension from <dimension> tag if present
            let totalRows = 0;
            let lastColumnIndex = 0;
            let lastColumnLetter = 'A';

            const dimensionMatch = wsXml.match(/<dimension[^>]*ref="([^"]+)"/);
            if (dimensionMatch && dimensionMatch[1]) {
                const range = dimensionMatch[1];
                const boundaries = Coordinate.rangeBoundaries(range);
                if (boundaries) {
                    const [[, startRow], [endCol, endRow]] = boundaries;
                    void startRow;
                    totalRows = endRow;
                    lastColumnIndex = endCol;
                    lastColumnLetter = Coordinate.stringFromColumnIndex(endCol);
                }
            } else {
                // Parse cell references to find max row and column
                const cellMatches = wsXml.matchAll(/<c[^>]*r="([A-Z]+\d+)"/g);
                let maxRow = 0;
                let maxCol = 0;

                for (const cellMatch of cellMatches) {
                    const cellRef = cellMatch[1];
                    if (cellRef) {
                        const [colIndex, rowIndex] = Coordinate.indexesFromString(cellRef);
                        if (rowIndex > maxRow) {
                            maxRow = rowIndex;
                        }
                        if (colIndex > maxCol) {
                            maxCol = colIndex;
                        }
                    }
                }

                totalRows = maxRow;
                lastColumnIndex = maxCol;
                lastColumnLetter = maxCol > 0 ? Coordinate.stringFromColumnIndex(maxCol) : 'A';
            }

            // PhpSpreadsheet behavior: an empty sheet defaults to A1 (1x1)
            // This covers cases where the worksheet XML omits <dimension> and contains no rows/cells.
            if (totalRows === 0) {
                totalRows = 1;
            }
            if (lastColumnIndex === 0) {
                lastColumnIndex = 1;
                lastColumnLetter = 'A';
            }

            const totalColumns = lastColumnIndex;

            worksheetInfo.push({
                worksheetName: sheetInfo.name,
                lastColumnLetter: lastColumnLetter,
                lastColumnIndex: lastColumnIndex - 1, // Convert to 0-based
                totalRows: totalRows,
                totalColumns: totalColumns,
                sheetState: sheetInfo.state,
            });
        }

        return worksheetInfo;
    }

    /**
     * Return worksheet info from a buffer.
     */
    public async listWorksheetInfoFromBuffer(data: Uint8Array | ArrayBuffer): Promise<WorksheetInfo[]> {
        try {
            const zip = await this.#openZipFromBuffer(data);
            return await this.#listWorksheetInfoFromZip(zip);
        } catch (error) {
            if (error instanceof Error) {
                throw new Error(`Failed to read worksheet info: ${error.message}`);
            }
            throw new Error('Failed to read worksheet info');
        }
    }

    /**
     * Return worksheet info.
     */
    async listWorksheetInfo(filename: string): Promise<WorksheetInfo[]> {
        let data: Uint8Array;
        try {
            data = await readFile(filename);
        } catch (error) {
            if (error instanceof Error) {
                throw new Error(`Failed to read worksheet info: ${error.message}`);
            }
            throw new Error('Failed to read worksheet info');
        }

        return this.listWorksheetInfoFromBuffer(data);
    }

    /**
     * Loads a Spreadsheet from an XLSX buffer.
     */
    public async loadFromBuffer(data: Uint8Array | ArrayBuffer): Promise<Spreadsheet> {
        try {
            const zip = await this.#openZipFromBuffer(data);

            // Find workbook path
            const relsFile = zip.files.find((f) => f.path === '_rels/.rels');
            if (!relsFile) {
                throw new Error('Invalid XLSX file: missing _rels/.rels');
            }

            const relsContent = await relsFile.buffer();
            const relsXml = relsContent.toString('utf-8');

            const workbookMatch = relsXml.match(/Target="([^"]*workbook\.xml)"/);
            if (!workbookMatch) {
                throw new Error('Invalid XLSX file: cannot find workbook.xml');
            }

            const workbookPath = (workbookMatch[1] ?? '').replace(/^\//, '');
            if (!workbookPath) {
                throw new Error('Invalid XLSX file: cannot determine workbook path');
            }

            const workbookRelPath = workbookPath.replace('xl/', 'xl/_rels/').replace('.xml', '.xml.rels');

            // Parse workbook relationships to find worksheets and shared strings
            const workbookRelsFile = zip.files.find((f) => f.path === workbookRelPath);
            const worksheetPaths: Map<string, string> = new Map();
            let sharedStringsPath: string | null = null;

            if (workbookRelsFile) {
                const relsContent = await workbookRelsFile.buffer();
                const relsXml = relsContent.toString('utf-8');

                // Find worksheet relationships
                const worksheetMatches = relsXml.matchAll(
                    /<Relationship[^>]*Id="([^"]+)"[^>]*Type="[^"]*worksheet"[^>]*Target="([^"]+)"/g,
                );
                for (const match of worksheetMatches) {
                    const rId = match[1];
                    const target = match[2];
                    if (rId && target) {
                        const cleanTarget = target.replace(/^\//, '');
                        worksheetPaths.set(rId, cleanTarget.startsWith('xl/') ? cleanTarget : `xl/${cleanTarget}`);
                    }
                }

                // Find shared strings
                const sharedStringsMatch = relsXml.match(
                    /<Relationship[^>]*Type="[^"]*sharedStrings"[^>]*Target="([^"]+)"/,
                );
                if (sharedStringsMatch && sharedStringsMatch[1]) {
                    const ssPath = sharedStringsMatch[1].replace(/^\//, '');
                    if (!ssPath.startsWith('xl/')) {
                        sharedStringsPath = `xl/${ssPath}`;
                    } else {
                        sharedStringsPath = ssPath;
                    }
                }

                // Find styles
                const stylesMatch = relsXml.match(/<Relationship[^>]*Type="[^"]*styles"[^>]*Target="([^"]+)"/);
                if (stylesMatch && stylesMatch[1]) {
                    const stylesPath = stylesMatch[1].replace(/^\//, '');
                    if (!stylesPath.startsWith('xl/')) {
                        this.stylesPath = `xl/${stylesPath}`;
                    } else {
                        this.stylesPath = stylesPath;
                    }
                }
            }

            // Read shared strings if present
            const sharedStrings: string[] = [];
            if (sharedStringsPath) {
                const ssFile = zip.files.find((f) => f.path === sharedStringsPath);
                if (ssFile) {
                    const ssContent = await ssFile.buffer();
                    const ssXml = ssContent.toString('utf-8');
                    const siMatches = ssXml.matchAll(/<si>(.*?)<\/si>/gs);
                    for (const match of siMatches) {
                        const textContent = match[1];
                        if (textContent) {
                            // Extract text from all <t> tags (supports rich text <r><t>...)
                            sharedStrings.push(XlsxReader.#extractTextFromTNodes(textContent));
                        } else {
                            sharedStrings.push('');
                        }
                    }
                }
            }

            // Read styles if present and not in data-only mode
            let styleData: StyleData | null = null;
            if (!this.#readDataOnly && this.stylesPath) {
                const stylesFile = zip.files.find((f) => f.path === this.stylesPath);
                if (stylesFile) {
                    const stylesContent = await stylesFile.buffer();
                    const stylesXml = stylesContent.toString('utf-8');
                    const stylesReader = new StylesReader(this);
                    styleData = await stylesReader.readStyles(stylesXml);
                }
            }

            // Read workbook.xml to get sheet information
            const workbookFile = zip.files.find((f) => f.path === workbookPath);
            if (!workbookFile) {
                throw new Error(`Invalid XLSX file: missing ${workbookPath}`);
            }

            const workbookContent = await workbookFile.buffer();
            const workbookXml = workbookContent.toString('utf-8');

            const workbookViewAttrs = !this.#readDataOnly
                ? (workbookXml.match(/<workbookView\b([^>]*)\/?>(?:[\s\S]*?<\/workbookView>)?/)?.[1] ?? null)
                : null;

            // Create spreadsheet
            const spreadsheet = new Spreadsheet();
            let defaultSheetUsed = false;

            // Add styles to spreadsheet if available
            if (styleData && styleData.cellXfs.length > 0) {
                // Replace the default style collection to keep xf indices aligned
                // with the file (xfIndex 0 must refer to the first parsed cellXf).
                spreadsheet.removeCellXfByIndex(0);
                for (const cellXf of styleData.cellXfs) {
                    spreadsheet.addCellXf(cellXf);
                }
            }

            // Parse sheets from workbook.xml (including visibility state)
            // Match PhpSpreadsheet: only set sheetState when attribute is present/non-empty.
            const sheetMatches = workbookXml.matchAll(/<sheet\b([^>]*)\/?>(?:[\s\S]*?<\/sheet\s*>)?/g);
            const sheets: { name: string; rId: string; state: string | null }[] = [];
            for (const match of sheetMatches) {
                const attrs = match[1] ?? '';
                const nameRaw = XlsxReader.#extractXmlAttribute(attrs, 'name');
                const rId =
                    XlsxReader.#extractXmlAttribute(attrs, 'r:id') ?? XlsxReader.#extractXmlAttribute(attrs, 'id');
                if (!nameRaw || !rId) {
                    continue;
                }

                const name = XlsxReader.decodeXmlEntities(nameRaw);
                const stateRaw = XlsxReader.#extractXmlAttribute(attrs, 'state');
                const state = stateRaw !== null ? XlsxReader.decodeXmlEntities(stateRaw) : null;
                sheets.push({ name, rId, state });
            }

            // Default active sheet index to the first loaded worksheet from the file.
            spreadsheet.setActiveSheetIndex(0);

            // Track mapping from workbook sheet order to loaded sheet index.
            // Needed when a read filter excludes sheets.
            const mapSheetId: Array<number | null> = new Array(sheets.length).fill(null);
            let loadedSheetCount = 0;

            // Load each worksheet
            for (const [sheetOrderIndex, sheetInfo] of sheets.entries()) {
                // Apply read filter if set
                if (this.#readFilter && !this.#readFilter(sheetInfo.name)) {
                    continue;
                }

                const worksheetPath = worksheetPaths.get(sheetInfo.rId);
                if (!worksheetPath) {
                    continue;
                }

                // Get or create worksheet - reuse default sheet for first sheet
                let worksheet = spreadsheet.getSheetByName(sheetInfo.name);
                if (!worksheet) {
                    if (!defaultSheetUsed && spreadsheet.getSheetCount() === 1 && loadedSheetCount === 0) {
                        // Reuse the default sheet
                        worksheet = spreadsheet.getSheet(0);
                        if (worksheet) {
                            worksheet.setTitle(sheetInfo.name);
                            defaultSheetUsed = true;
                        }
                    } else {
                        worksheet = spreadsheet.createSheet();
                        worksheet.setTitle(sheetInfo.name);
                    }
                } else if (!defaultSheetUsed && loadedSheetCount === 0 && spreadsheet.getSheetCount() === 1) {
                    // If the first sheet happens to match the default sheet name, still treat
                    // the default sheet as consumed so we don't reuse it for subsequent sheets.
                    defaultSheetUsed = spreadsheet.getIndex(worksheet) === 0;
                }

                if (sheetInfo.state !== null && sheetInfo.state !== '') {
                    worksheet.setSheetState(sheetInfo.state);
                }

                // Read worksheet XML
                const wsFile = zip.files.find((f) => f.path === worksheetPath);
                if (!wsFile) {
                    continue;
                }

                mapSheetId[sheetOrderIndex] = spreadsheet.getIndex(worksheet);
                loadedSheetCount++;

                const wsContent = await wsFile.buffer();
                const wsXml = wsContent.toString('utf-8');

                // Parse sheetViews (view settings, selections, panes).
                if (!this.#readDataOnly) {
                    try {
                        XlsxReader.#loadWorksheetSheetViewsFromXml(wsXml, worksheet);
                    } catch {
                        // Ignore invalid sheetViews blocks.
                    }

                    // Parse pageMargins/pageSetup/headerFooter/page breaks.
                    try {
                        XlsxReader.#loadWorksheetPageSetupFromXml(wsXml, worksheet);
                    } catch {
                        // Ignore invalid page setup blocks.
                    }
                }

                // Parse sheetPr/sheetFormatPr/printOptions (printOptions only when !readDataOnly).
                try {
                    XlsxReader.#loadWorksheetSheetViewOptionsFromXml(wsXml, worksheet, this.#readDataOnly);
                } catch {
                    // Ignore invalid sheet options blocks.
                }

                // Parse column/row dimension attributes.
                // Note: this must run regardless of readDataOnly for column width/hidden.
                try {
                    XlsxReader.#loadWorksheetColumnAndRowAttributesFromXml(wsXml, worksheet, this.#readDataOnly);
                } catch {
                    // Ignore invalid cols/row blocks.
                }

                // Parse <autoFilter ref="..."> directly from worksheet XML.
                // Match PhpSpreadsheet AutoFilter::load: strip '$' and ignore invalid ranges.
                const autoFilterMatches = wsXml.matchAll(
                    /<autoFilter\b([^>]*?)(?:\/\s*>|>([\s\S]*?)<\/autoFilter\s*>)/g,
                );
                for (const match of autoFilterMatches) {
                    try {
                        const attrs = match[1] ?? '';
                        const inner = match[2] ?? '';
                        const refAttr = XlsxReader.#extractXmlAttribute(attrs, 'ref');
                        if (!refAttr) {
                            continue;
                        }
                        const ref = XlsxReader.decodeXmlEntities(refAttr).replace(/\$/g, '');
                        if (ref === '') {
                            continue;
                        }

                        try {
                            worksheet.getAutoFilter().setRange(ref);
                        } catch {
                            // Ignore invalid ranges.
                            continue;
                        }

                        // Parse filter rules inside <autoFilter>.
                        if (inner !== '') {
                            try {
                                XlsxReader.#loadAutoFilterColumnsFromXml(inner, worksheet);
                            } catch {
                                // Ignore invalid AutoFilter blocks.
                            }
                        }
                    } catch {
                        // Ignore invalid AutoFilter blocks.
                    }
                }

                // Parse cells from worksheet - parse cell elements directly
                const cellMatches = wsXml.matchAll(/<c[^>]*r="([A-Z]+\d+)"[^>]*>([\s\S]*?)<\/c>/g);
                for (const cellMatch of cellMatches) {
                    const cellRef = cellMatch[1];
                    const cellContent = cellMatch[2];
                    if (!cellRef || !cellContent) continue;

                    // Get the full cell element to extract attributes
                    const fullCellMatch = wsXml.match(new RegExp(`<c[^>]*r="${cellRef}"([^>]*)>`));
                    const cellAttrs = fullCellMatch && fullCellMatch[1] ? fullCellMatch[1] : '';

                    // Extract style index
                    const styleMatch = cellAttrs.match(/s="(\d+)"/);
                    const styleIndex = styleMatch ? parseInt(styleMatch[1]!, 10) : null;

                    // Determine cell type and value
                    const typeMatch = cellContent.match(/<v>([^<]*)<\/v>/);
                    const formulaMatch = cellContent.match(/<f>([^<]*)<\/f>/);

                    const cell = worksheet.getCell(cellRef);

                    // Apply style if available and not in data-only mode
                    if (styleIndex !== null && !this.#readDataOnly && styleData) {
                        // Assign xf index directly; styles are stored in the workbook collection.
                        cell.setXfIndex(styleIndex);
                    }

                    if (formulaMatch && formulaMatch[1]) {
                        cell.setValue('=' + formulaMatch[1]);
                    } else if (typeMatch && typeMatch[1]) {
                        const value = typeMatch[1];
                        // Check if it's a shared string reference
                        const isSharedString = cellAttrs.includes('t="s"');

                        if (isSharedString) {
                            const ssIndex = parseInt(value, 10);
                            if (!isNaN(ssIndex) && ssIndex >= 0 && ssIndex < sharedStrings.length) {
                                const ssValue = sharedStrings[ssIndex];
                                if (ssValue !== undefined) {
                                    cell.setValue(ssValue);
                                }
                            }
                        } else {
                            // Try to parse as number
                            const numValue = parseFloat(value);
                            if (!isNaN(numValue)) {
                                cell.setValue(numValue);
                            } else {
                                cell.setValue(value);
                            }
                        }
                    }
                }

                // Parse tables (tableParts + xl/tables/tableN.xml)
                await this.#loadWorksheetTables(zip, worksheetPath, wsXml, worksheet);

                // Parse merge cells
                if (!this.#readDataOnly) {
                    // Parse worksheet drawings (images) before other relationship-based parts.
                    await this.#loadWorksheetDrawings(zip, worksheetPath, wsXml, worksheet);

                    // Parse worksheet charts (discovery only; no chart XML parsing yet).
                    await this.#loadWorksheetCharts(zip, worksheetPath, wsXml, worksheet);

                    const mergeCellsMatch = wsXml.match(/<mergeCells[^>]*>([\s\S]*?)<\/mergeCells>/);
                    if (mergeCellsMatch && mergeCellsMatch[1]) {
                        const mergeCellsContent = mergeCellsMatch[1];
                        const mergeCellMatches = mergeCellsContent.matchAll(/<mergeCell[^>]*ref="([^"]*)"[^>]*\/>/g);
                        for (const mergeMatch of mergeCellMatches) {
                            const range = mergeMatch[1];
                            if (range) {
                                worksheet.mergeCells(range);
                            }
                        }
                    }

                    // Parse hyperlinks
                    const hyperlinksMatch = wsXml.match(/<hyperlinks[^>]*>([\s\S]*?)<\/hyperlinks>/);
                    if (hyperlinksMatch && hyperlinksMatch[1]) {
                        const hyperlinksContent = hyperlinksMatch[1];
                        const hyperlinkMatches = hyperlinksContent.matchAll(
                            /<hyperlink[^>]*ref="([^"]*)"[^>]*r:id="([^"]*)"(?:[^>]*location="([^"]*)")?[^>]*\/>/g,
                        );
                        for (const linkMatch of hyperlinkMatches) {
                            const cellRef = linkMatch[1];
                            const rId = linkMatch[2];
                            const location = linkMatch[3];

                            if (cellRef && rId) {
                                // Resolve rId to actual URL
                                const hyperlinkRelPath = worksheetPath
                                    .replace('worksheets/', 'worksheets/_rels/')
                                    .replace('.xml', '.xml.rels');
                                const hyperlinkRelsFile = zip.files.find((f) => f.path === hyperlinkRelPath);

                                if (hyperlinkRelsFile) {
                                    const relsContent = await hyperlinkRelsFile.buffer();
                                    const relsXml = relsContent.toString('utf-8');
                                    const urlMatch = relsXml.match(
                                        new RegExp(`<Relationship[^>]*Id="${rId}"[^>]*Target="([^"]*)"`),
                                    );

                                    if (urlMatch && urlMatch[1]) {
                                        const url = urlMatch[1];
                                        const cell = worksheet.getCell(cellRef);
                                        cell.getHyperlink().setUrl(url);
                                        if (location) {
                                            cell.getHyperlink().setLocation(location);
                                        }
                                    }
                                }
                            }
                        }
                    }

                    // Parse classic comments (notes)
                    // - relationships from xl/worksheets/_rels/sheetN.xml.rels
                    // - xl/commentsN.xml contains authors + commentList
                    const worksheetRelsPath = worksheetPath
                        .replace('xl/worksheets/', 'xl/worksheets/_rels/')
                        .replace('.xml', '.xml.rels');
                    const relsXml = await this.#readZipTextFile(zip, worksheetRelsPath);
                    if (relsXml) {
                        const rels = XlsxReader.#parseRelationshipsXml(relsXml);
                        const commentsRel = rels.find((r) => r.type === XlsxReader.#COMMENTS_REL_TYPE);
                        const vmlRel = rels.find((r) => r.type === XlsxReader.#VMLDRAWING_REL_TYPE);

                        // VML drawings may exist for classic comments; v1 skips geometry but must not crash.
                        if (vmlRel) {
                            const _vmlPath = XlsxReader.#resolveRelationshipTarget(worksheetPath, vmlRel.target);
                            // Intentionally ignored for now.
                            void _vmlPath;
                        }

                        if (commentsRel) {
                            const commentsPath = XlsxReader.#resolveRelationshipTarget(
                                worksheetPath,
                                commentsRel.target,
                            );
                            const commentsXml = await this.#readZipTextFile(zip, commentsPath);
                            if (commentsXml) {
                                const authors: string[] = [];
                                const authorsSection = commentsXml.match(/<authors[^>]*>([\s\S]*?)<\/authors>/);
                                if (authorsSection && authorsSection[1]) {
                                    const authorMatches = authorsSection[1].matchAll(
                                        /<author[^>]*>([\s\S]*?)<\/author>/g,
                                    );
                                    for (const a of authorMatches) {
                                        const raw = a[1] ?? '';
                                        authors.push(XlsxReader.decodeXmlEntities(raw));
                                    }
                                }

                                const commentListSection = commentsXml.match(
                                    /<commentList[^>]*>([\s\S]*?)<\/commentList>/,
                                );
                                const commentListXml = commentListSection?.[1] ?? '';
                                const commentMatches = commentListXml.matchAll(
                                    /<comment\b([^>]*)>([\s\S]*?)<\/comment>/g,
                                );
                                for (const c of commentMatches) {
                                    const attrs = c[1] ?? '';
                                    const inner = c[2] ?? '';

                                    const ref = XlsxReader.#extractXmlAttribute(attrs, 'ref');
                                    const authorIdStr = XlsxReader.#extractXmlAttribute(attrs, 'authorId');
                                    if (!ref) {
                                        continue;
                                    }

                                    const authorId = authorIdStr ? Number.parseInt(authorIdStr, 10) : NaN;
                                    const author =
                                        Number.isFinite(authorId) && authorId >= 0 && authorId < authors.length
                                            ? (authors[authorId] ?? 'Author')
                                            : 'Author';

                                    const textMatch = inner.match(/<text\b[^>]*>([\s\S]*?)<\/text>/);
                                    const textXml = textMatch?.[1] ?? '';
                                    const richText = XlsxReader.#parseRichTextFromXml(textXml);

                                    try {
                                        const comment = worksheet.getComment(ref);
                                        comment.setAuthor(author);
                                        comment.setText(richText);
                                    } catch {
                                        // Ignore invalid coordinates.
                                    }
                                }
                            }
                        }
                    }

                    // Parse data validations
                    const dataValidationsMatch = wsXml.match(/<dataValidations[^>]*>([\s\S]*?)<\/dataValidations>/);
                    if (dataValidationsMatch && dataValidationsMatch[1]) {
                        const dataValidationsContent = dataValidationsMatch[1];
                        const dataValidationMatches = dataValidationsContent.matchAll(
                            /<dataValidation([^>]*)>([\s\S]*?)<\/dataValidation>/g,
                        );

                        for (const dvMatch of dataValidationMatches) {
                            const dvAttrs = dvMatch[1];
                            const dvContent = dvMatch[2];

                            if (!dvAttrs || !dvContent) continue;

                            // Parse attributes
                            const typeMatch = dvAttrs.match(/type="([^"]*)"/);
                            const errorStyleMatch = dvAttrs.match(/errorStyle="([^"]*)"/);
                            const operatorMatch = dvAttrs.match(/operator="([^"]*)"/);
                            const allowBlankMatch = dvAttrs.match(/allowBlank="([^"]*)"/);
                            const showDropDownMatch = dvAttrs.match(/showDropDown="([^"]*)"/);
                            const showInputMessageMatch = dvAttrs.match(/showInputMessage="([^"]*)"/);
                            const showErrorMessageMatch = dvAttrs.match(/showErrorMessage="([^"]*)"/);
                            const errorTitleMatch = dvAttrs.match(/errorTitle="([^"]*)"/);
                            const errorMatch = dvAttrs.match(/error="([^"]*)"/);
                            const promptTitleMatch = dvAttrs.match(/promptTitle="([^"]*)"/);
                            const promptMatch = dvAttrs.match(/prompt="([^"]*)"/);
                            const sqrefMatch = dvAttrs.match(/sqref="([^"]*)"/);

                            // Parse formulas
                            const formula1Match = dvContent.match(/<formula1>([^<]*)<\/formula1>/);
                            const formula2Match = dvContent.match(/<formula2>([^<]*)<\/formula2>/);

                            if (sqrefMatch && sqrefMatch[1]) {
                                const sqref = sqrefMatch[1];

                                // Create data validation
                                const { DataValidation } = await import('../core/data-validation.ts');
                                const dataValidation = new DataValidation();

                                if (typeMatch && typeMatch[1]) dataValidation.setType(typeMatch[1]);
                                if (errorStyleMatch && errorStyleMatch[1])
                                    dataValidation.setErrorStyle(errorStyleMatch[1]);
                                if (operatorMatch && operatorMatch[1]) dataValidation.setOperator(operatorMatch[1]);
                                if (allowBlankMatch && allowBlankMatch[1])
                                    dataValidation.setAllowBlank(allowBlankMatch[1] === '1');
                                if (showDropDownMatch && showDropDownMatch[1])
                                    dataValidation.setShowDropDown(showDropDownMatch[1] === '0'); // Note: inverted
                                if (showInputMessageMatch && showInputMessageMatch[1])
                                    dataValidation.setShowInputMessage(showInputMessageMatch[1] === '1');
                                if (showErrorMessageMatch && showErrorMessageMatch[1])
                                    dataValidation.setShowErrorMessage(showErrorMessageMatch[1] === '1');
                                if (errorTitleMatch && errorTitleMatch[1])
                                    dataValidation.setErrorTitle(errorTitleMatch[1]);
                                if (errorMatch && errorMatch[1]) dataValidation.setError(errorMatch[1]);
                                if (promptTitleMatch && promptTitleMatch[1])
                                    dataValidation.setPromptTitle(promptTitleMatch[1]);
                                if (promptMatch && promptMatch[1]) dataValidation.setPrompt(promptMatch[1]);
                                dataValidation.setSqref(sqref);
                                if (formula1Match && formula1Match[1]) dataValidation.setFormula1(formula1Match[1]);
                                if (formula2Match && formula2Match[1]) dataValidation.setFormula2(formula2Match[1]);

                                worksheet.setDataValidation(sqref, dataValidation);
                            }
                        }
                    }
                }
            }

            // Parse workbook defined names after sheets are loaded so localSheetId
            // can be mapped through the read filter.
            this.#loadDefinedNamesFromWorkbookXml(workbookXml, spreadsheet, mapSheetId);

            // Apply workbook view settings (bookViews/workbookView) after loading sheets,
            // so activeTab can be remapped when a read filter excludes sheets.
            if (workbookViewAttrs) {
                const activeTabStr = XlsxReader.#extractXmlAttribute(workbookViewAttrs, 'activeTab');
                if (activeTabStr !== null) {
                    const activeTab = Number.parseInt(activeTabStr, 10);
                    const mapped = Number.isFinite(activeTab) ? mapSheetId[activeTab] : null;
                    if (mapped !== null && mapped !== undefined) {
                        spreadsheet.setActiveSheetIndex(mapped);
                    }
                }

                const showHorizontalScroll = XlsxReader.#extractXmlAttribute(workbookViewAttrs, 'showHorizontalScroll');
                if (showHorizontalScroll !== null) {
                    spreadsheet.setShowHorizontalScroll(XlsxReader.#castXsdBoolean(showHorizontalScroll));
                }

                const showVerticalScroll = XlsxReader.#extractXmlAttribute(workbookViewAttrs, 'showVerticalScroll');
                if (showVerticalScroll !== null) {
                    spreadsheet.setShowVerticalScroll(XlsxReader.#castXsdBoolean(showVerticalScroll));
                }

                const showSheetTabs = XlsxReader.#extractXmlAttribute(workbookViewAttrs, 'showSheetTabs');
                if (showSheetTabs !== null) {
                    spreadsheet.setShowSheetTabs(XlsxReader.#castXsdBoolean(showSheetTabs));
                }

                const minimized = XlsxReader.#extractXmlAttribute(workbookViewAttrs, 'minimized');
                if (minimized !== null) {
                    spreadsheet.setMinimized(XlsxReader.#castXsdBoolean(minimized));
                }

                const autoFilterDateGrouping = XlsxReader.#extractXmlAttribute(
                    workbookViewAttrs,
                    'autoFilterDateGrouping',
                );
                if (autoFilterDateGrouping !== null) {
                    spreadsheet.setAutoFilterDateGrouping(XlsxReader.#castXsdBoolean(autoFilterDateGrouping));
                }

                const firstSheetStr =
                    XlsxReader.#extractXmlAttribute(workbookViewAttrs, 'firstSheet') ??
                    XlsxReader.#extractXmlAttribute(workbookViewAttrs, 'firstSheetIndex');
                if (firstSheetStr !== null) {
                    const firstSheet = Number.parseInt(firstSheetStr, 10);
                    if (Number.isFinite(firstSheet) && firstSheet >= 0) {
                        spreadsheet.setFirstSheetIndex(firstSheet);
                    }
                }

                const visibility = XlsxReader.#extractXmlAttribute(workbookViewAttrs, 'visibility');
                if (visibility !== null) {
                    spreadsheet.setVisibility(visibility);
                }

                const tabRatioStr = XlsxReader.#extractXmlAttribute(workbookViewAttrs, 'tabRatio');
                if (tabRatioStr !== null) {
                    const tabRatio = Number.parseInt(tabRatioStr, 10);
                    if (Number.isFinite(tabRatio)) {
                        spreadsheet.setTabRatio(tabRatio);
                    }
                }
            }

            return spreadsheet;
        } catch (error) {
            if (error instanceof Error) {
                throw new Error(`Failed to load XLSX file: ${error.message}`);
            }
            throw new Error('Failed to load XLSX file');
        }
    }

    /**
     * Loads a Spreadsheet from file.
     */
    async load(filename: string): Promise<Spreadsheet> {
        let data: Uint8Array;
        try {
            data = await readFile(filename);
        } catch (error) {
            if (error instanceof Error) {
                throw new Error(`Failed to load XLSX file: ${error.message}`);
            }
            throw new Error('Failed to load XLSX file');
        }

        // Delegate all parsing logic to the buffer-based loader.
        return this.loadFromBuffer(data);
    }

    /**
     * Set read empty cells.
     */
    setReadEmptyCells(value: boolean): void {
        this.#readEmptyCells = value;
    }

    /**
     * Get read empty cells.
     */
    getReadEmptyCells(): boolean {
        return this.#readEmptyCells;
    }

    /**
     * Set read default styles.
     */
    setReadDefaultStyles(value: boolean): void {
        this.#readDefaultStyles = value;
    }

    /**
     * Get read default styles.
     */
    getReadDefaultStyles(): boolean {
        return this.#readDefaultStyles;
    }

    /**
     * Set read data only.
     */
    setReadDataOnly(value: boolean): void {
        this.#readDataOnly = value;
    }

    /**
     * Get read data only.
     */
    getReadDataOnly(): boolean {
        return this.#readDataOnly;
    }

    /**
     * Set read filter callback.
     */
    setReadFilter(filter: ((worksheetName: string) => boolean) | null): void {
        this.#readFilter = filter;
    }

    /**
     * Get read filter callback.
     */
    getReadFilter(): ((worksheetName: string) => boolean) | null {
        return this.#readFilter;
    }

    /**
     * Enable/disable reading embedded charts.
     */
    setIncludeCharts(value: boolean): void {
        this.#includeCharts = value;
    }

    /**
     * True if the reader will discover embedded charts.
     */
    getIncludeCharts(): boolean {
        return this.#includeCharts;
    }
}
