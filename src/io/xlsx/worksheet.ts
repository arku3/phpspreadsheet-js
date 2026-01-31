import { create } from 'xmlbuilder2';
import { DataType } from '../../core/cell.ts';
import { Worksheet as CoreWorksheet } from '../../core/worksheet.ts';
import { RichText } from '../../rich-text/rich-text.ts';
import { Run } from '../../rich-text/run.ts';
import { ConditionalColorScale } from '../../style/conditional-formatting/conditional-color-scale.ts';
import { ConditionalDataBar } from '../../style/conditional-formatting/conditional-data-bar.ts';
import { ConditionalIconSet } from '../../style/conditional-formatting/conditional-icon-set.ts';
import { Conditional } from '../../style/conditional.ts';
import { Coordinate } from '../../utils/coordinate.ts';
import { AutoFilter } from '../../worksheet/auto-filter.ts';
import { Column as AutoFilterColumn } from '../../worksheet/auto-filter/column.ts';
import { Rule as AutoFilterRule } from '../../worksheet/auto-filter/column/rule.ts';
import { WriterPart } from './writer-part.ts';

/**
 * Generates worksheet XMLs.
 */
export class Worksheet extends WriterPart {
    private static normalizeConditionalTopLeftCell(cellRef: string): string {
        const cleaned = (cellRef ?? '').replace(/\$/g, '').toUpperCase();
        if (cleaned === '') return 'A1';

        // Column-only refs like "D" can happen for column ranges like "D:D".
        // Conditional formatting formulas require an A1-style cell reference (e.g. "D1").
        if (/^[A-Z]+$/.test(cleaned)) return `${cleaned}1`;
        // Row-only refs like "1" can happen for row ranges like "1:1".
        if (/^\d+$/.test(cleaned)) return `A${cleaned}`;

        return cleaned;
    }

    /**
     * Write worksheet to XML format.
     */
    public writeWorksheet(worksheet: CoreWorksheet, stringTable: (RichText | string)[]): string {
        const root = create({ version: '1.0', encoding: 'UTF-8', standalone: true }).ele('worksheet', {
            xmlns: 'http://schemas.openxmlformats.org/spreadsheetml/2006/main',
            'xmlns:r': 'http://schemas.openxmlformats.org/officeDocument/2006/relationships',
            'xmlns:mc': 'http://schemas.openxmlformats.org/compatibility/2006',
            'mc:Ignorable': 'x14ac',
            'xmlns:x14ac': 'http://schemas.microsoft.com/office/spreadsheetml/2009/9/ac',
        });

        // sheetViews
        this.writeSheetViews(root, worksheet);

        // sheetFormatPr
        this.writeSheetFormatPr(root, worksheet);

        // cols
        this.writeCols(root, worksheet);

        // sheetData
        this.writeSheetData(root, worksheet, stringTable);

        // mergeCells
        this.writeMergeCells(root, worksheet);

        // autoFilter
        this.writeAutoFilter(root, worksheet);

        // conditionalFormatting
        this.writeConditionalFormatting(root, worksheet);

        // dataValidations
        this.writeDataValidations(root, worksheet);

        // hyperlinks
        this.writeHyperlinks(root, worksheet);

        // pageMargins
        const margins = worksheet.getPageMargins();
        root.ele('pageMargins', {
            left: margins.getLeft(),
            right: margins.getRight(),
            top: margins.getTop(),
            bottom: margins.getBottom(),
            header: margins.getHeader(),
            footer: margins.getFooter(),
        });

        // pageSetup
        this.writePageSetup(root, worksheet);

        // drawing (DrawingML worksheet images)
        this.writeDrawing(root, worksheet);

        // legacyDrawing (classic comments)
        this.writeLegacyDrawing(root, worksheet);

        // tableParts
        this.writeTableParts(root, worksheet);

        return root.end({ prettyPrint: true });
    }

    /**
     * Write tableParts.
     */
    private writeTableParts(root: any, worksheet: CoreWorksheet): void {
        const tableCount = worksheet.getTables().length;
        if (tableCount === 0) {
            return;
        }

        const tableParts = root.ele('tableParts', { count: String(tableCount) });
        for (let t = 1; t <= tableCount; t++) {
            tableParts.ele('tablePart', {
                'r:id': `rId_table_${t}`,
            });
        }
    }

    /**
     * Write LegacyDrawing for classic comments (notes).
     */
    private writeLegacyDrawing(root: any, worksheet: CoreWorksheet): void {
        if (worksheet.getComments().size === 0) {
            return;
        }

        root.ele('legacyDrawing', {
            'r:id': 'rId_comments_vml1',
        });
    }

    private writeDrawing(root: any, worksheet: CoreWorksheet): void {
        const hasDrawings = worksheet.getDrawingCollection().length > 0;
        const hasCharts = worksheet.getChartCollection().length > 0;
        const includeCharts = this.getParentWriter().getIncludeCharts();

        if (!hasDrawings && !(includeCharts && hasCharts)) {
            return;
        }

        root.ele('drawing', {
            'r:id': 'rId_drawing1',
        });
    }

    /**
     * Write SheetViews.
     */
    private writeSheetViews(root: any, worksheet: CoreWorksheet): void {
        const sheetViews = root.ele('sheetViews');
        const sheetView = sheetViews.ele('sheetView', {
            tabSelected:
                worksheet.getParent().getActiveSheetIndex() === worksheet.getParent().getIndex(worksheet) ? '1' : '0',
            workbookViewId: '0',
        });

        const sv = worksheet.getSheetView();
        if (sv.getZoomScale() !== null && sv.getZoomScale() !== 100) {
            sheetView.att('zoomScale', String(sv.getZoomScale()));
        }
        if (sv.getZoomScaleNormal() !== null && sv.getZoomScaleNormal() !== 100) {
            sheetView.att('zoomScaleNormal', String(sv.getZoomScaleNormal()));
        }
        if (sv.getZoomScalePageLayoutView() !== 100) {
            sheetView.att('zoomScalePageLayoutView', String(sv.getZoomScalePageLayoutView()));
        }
        if (sv.getZoomScaleSheetLayoutView() !== 100) {
            sheetView.att('zoomScaleSheetLayoutView', String(sv.getZoomScaleSheetLayoutView()));
        }

        if (sv.getShowZeros() === false) {
            sheetView.att('showZeros', '0');
        }

        if (sv.getView() !== 'normal') {
            sheetView.att('view', sv.getView());
        }

        if (worksheet.getShowGridlines()) {
            sheetView.att('showGridLines', 'true');
        } else {
            sheetView.att('showGridLines', 'false');
        }

        if (worksheet.getShowRowColHeaders()) {
            sheetView.att('showRowColHeaders', '1');
        } else {
            sheetView.att('showRowColHeaders', '0');
        }

        if (worksheet.getRightToLeft()) {
            sheetView.att('rightToLeft', 'true');
        }

        const topLeftCell = worksheet.getTopLeftCell();
        if (
            topLeftCell !== '' &&
            topLeftCell !== 'A1' &&
            worksheet.getPaneState() !== CoreWorksheet.PANE_FROZEN &&
            worksheet.getPaneState() !== CoreWorksheet.PANE_FROZENSPLIT
        ) {
            sheetView.att('topLeftCell', topLeftCell);
        }

        const activeCell = worksheet.getActiveCell();
        const sqref = worksheet.getSelectedCells();

        if (worksheet.usesPanes()) {
            const pane = sheetView.ele('pane');
            const xSplit = worksheet.getXSplit();
            const ySplit = worksheet.getYSplit();
            const activePane = worksheet.getActivePane();
            const paneTopLeftCell = worksheet.getPaneTopLeftCell();
            const paneState = worksheet.getPaneState();

            let normalFreeze = '';
            if (paneState === CoreWorksheet.PANE_FROZEN) {
                if (ySplit > 0) {
                    normalFreeze = xSplit <= 0 ? 'bottomLeft' : 'bottomRight';
                } else {
                    normalFreeze = 'topRight';
                }
            }

            if (xSplit > 0) {
                pane.att('xSplit', String(xSplit));
            }
            if (ySplit > 0) {
                pane.att('ySplit', String(ySplit));
            }
            if (normalFreeze !== '') {
                pane.att('activePane', normalFreeze);
            } else if (activePane !== '') {
                pane.att('activePane', activePane);
            }
            if (paneState !== '') {
                pane.att('state', paneState);
            }
            if (paneTopLeftCell !== '') {
                pane.att('topLeftCell', paneTopLeftCell);
            }

            if (normalFreeze !== '') {
                const selection = sheetView.ele('selection');
                selection.att('pane', normalFreeze);
                if (activeCell !== '') {
                    selection.att('activeCell', activeCell);
                }
                if (sqref !== '') {
                    selection.att('sqref', sqref);
                }
            } else {
                const panes = worksheet.getPanes();
                for (const position in panes) {
                    const p = panes[position];
                    if (p) {
                        const selection = sheetView.ele('selection');
                        selection.att('pane', p.getPosition());
                        if (p.getActiveCell() !== '') {
                            selection.att('activeCell', p.getActiveCell());
                        }
                        if (p.getSqref() !== '') {
                            selection.att('sqref', p.getSqref());
                        }
                    }
                }
            }
        } else {
            if (activeCell !== '' || sqref !== '') {
                const selection = sheetView.ele('selection');
                if (activeCell !== '') {
                    selection.att('activeCell', activeCell);
                }
                if (sqref !== '') {
                    selection.att('sqref', sqref);
                }
            }
        }
    }

    /**
     * Write SheetFormatPr.
     */
    private writeSheetFormatPr(root: any, worksheet: CoreWorksheet): void {
        const sheetFormatPr = root.ele('sheetFormatPr');

        // Default row height
        if (worksheet.getDefaultRowDimension().getRowHeight() >= 0) {
            sheetFormatPr.att('customHeight', '1');
            sheetFormatPr.att('defaultRowHeight', String(worksheet.getDefaultRowDimension().getRowHeight()));
        } else {
            sheetFormatPr.att('defaultRowHeight', '14.4');
        }

        // Set Zero Height row
        if (worksheet.getDefaultRowDimension().getZeroHeight()) {
            sheetFormatPr.att('zeroHeight', '1');
        }

        // Default column width
        if (worksheet.getDefaultColumnDimension().getWidth() >= 0) {
            sheetFormatPr.att('defaultColWidth', String(worksheet.getDefaultColumnDimension().getWidthForOutput()));
        }

        // Outline level - row
        let outlineLevelRow = 0;
        for (const dimension of worksheet.getRowDimensions().values()) {
            if (dimension.getOutlineLevel() > outlineLevelRow) {
                outlineLevelRow = dimension.getOutlineLevel();
            }
        }
        sheetFormatPr.att('outlineLevelRow', String(outlineLevelRow));

        // Outline level - column
        let outlineLevelCol = 0;
        for (const dimension of worksheet.getColumnDimensions().values()) {
            if (dimension.getOutlineLevel() > outlineLevelCol) {
                outlineLevelCol = dimension.getOutlineLevel();
            }
        }
        sheetFormatPr.att('outlineLevelCol', String(outlineLevelCol));
    }

    /**
     * Write Cols.
     */
    private writeCols(root: any, worksheet: CoreWorksheet): void {
        const columnDimensions = Array.from(worksheet.getColumnDimensions().values());
        if (columnDimensions.length > 0) {
            const cols = root.ele('cols');
            for (const colDimension of columnDimensions) {
                const col = cols.ele('col', {
                    min: colDimension.getColumnNumeric(),
                    max: colDimension.getColumnNumeric(),
                    width: colDimension.getWidth() < 0 ? '9.10' : colDimension.getWidthForOutput(),
                    customWidth: colDimension.getWidth() >= 0 ? '1' : '0',
                });
                if (!colDimension.getVisible()) {
                    col.att('hidden', '1');
                }
                if (colDimension.getOutlineLevel() > 0) {
                    col.att('outlineLevel', String(colDimension.getOutlineLevel()));
                }
                if (colDimension.getCollapsed()) {
                    col.att('collapsed', '1');
                }
                if (colDimension.getXfIndex() !== null && colDimension.getXfIndex()! > 0) {
                    col.att('style', String(colDimension.getXfIndex()));
                }
            }
        }
    }

    /**
     * Write sheetData.
     */
    private writeSheetData(root: any, worksheet: CoreWorksheet, stringTable: (RichText | string)[]): void {
        const sheetData = root.ele('sheetData');

        const cells = worksheet.getCellCollection().getCells();
        // Group cells by row
        const cellsByRow = new Map<number, any[]>();
        for (const cell of cells) {
            const row = cell.getRow();
            if (!cellsByRow.has(row)) {
                cellsByRow.set(row, []);
            }
            cellsByRow.get(row)!.push(cell);
        }

        // Get all rows that have dimensions or cells
        const rowIndices = new Set<number>(cellsByRow.keys());
        for (const rowIndex of worksheet.getRowDimensions().keys()) {
            rowIndices.add(rowIndex);
        }

        // Sort rows
        const sortedRows = Array.from(rowIndices).sort((a, b) => a - b);

        for (const row of sortedRows) {
            const rowEle = sheetData.ele('row', { r: row + 1 });

            // Row dimensions
            if (worksheet.rowDimensionExists(row)) {
                const rowDimension = worksheet.getRowDimension(row);
                if (rowDimension.getRowHeight() >= 0) {
                    rowEle.att('ht', String(rowDimension.getRowHeight()));
                    rowEle.att('customHeight', '1');
                }
                if (!rowDimension.getVisible()) {
                    rowEle.att('hidden', '1');
                }
                if (rowDimension.getOutlineLevel() > 0) {
                    rowEle.att('outlineLevel', String(rowDimension.getOutlineLevel()));
                }
                if (rowDimension.getCollapsed()) {
                    rowEle.att('collapsed', '1');
                }
                if (rowDimension.getXfIndex() !== null && rowDimension.getXfIndex()! > 0) {
                    rowEle.att('s', String(rowDimension.getXfIndex()));
                    rowEle.att('customFormat', '1');
                }
            }

            const rowCells = (cellsByRow.get(row) || []).sort((a, b) => {
                const colA = a.getColumn();
                const colB = b.getColumn();
                return colA - colB;
            });

            for (const cell of rowCells) {
                const cellEle = rowEle.ele('c', { r: cell.getCoordinate() });

                // Style index
                if (cell.getXfIndex() > 0) {
                    cellEle.att('s', String(cell.getXfIndex()));
                }

                const value = cell.getValue();
                const dataType = cell.getDataType();

                if (dataType === DataType.TYPE_BOOL) {
                    cellEle.att('t', 'b');
                    cellEle.ele('v').txt(value ? '1' : '0');
                } else if (dataType === DataType.TYPE_NUMERIC) {
                    cellEle.ele('v').txt(String(value));
                } else if (dataType === DataType.TYPE_ERROR) {
                    cellEle.att('t', 'e');
                    cellEle.ele('v').txt(String(value));
                } else if (dataType === DataType.TYPE_FORMULA) {
                    cellEle.ele('f').txt(String(value).substring(1));
                    if (this.getParentWriter().getPreCalculateFormulas()) {
                        const calculatedValue = cell.getCalculatedValue();
                        if (calculatedValue !== undefined && calculatedValue !== null) {
                            cellEle.ele('v').txt(String(calculatedValue));
                        }
                    }
                } else if (value !== null && value !== '') {
                    // Shared string or inline string
                    if (dataType === DataType.TYPE_INLINE) {
                        cellEle.att('t', 'inlineStr');
                        const is = cellEle.ele('is');
                        if (value instanceof RichText) {
                            this.writeRichText(is, value);
                        } else {
                            is.ele('t').txt(String(value));
                        }
                    } else {
                        // Shared string
                        cellEle.att('t', 's');
                        const stringIndex = this.getStringTableIndex(value, stringTable);
                        if (stringIndex !== -1) {
                            cellEle.ele('v').txt(String(stringIndex));
                        }
                    }
                }
            }
        }
    }

    /**
     * Write Rich Text.
     */
    private writeRichText(root: any, richText: RichText): void {
        for (const element of richText.getRichTextElements()) {
            const r = root.ele('r');

            if (element instanceof Run) {
                const font = element.getFont();
                if (font) {
                    const rPr = r.ele('rPr');
                    if (font.getName()) rPr.ele('rFont').att('val', font.getName()!);
                    if (font.getBold()) rPr.ele('b');
                    if (font.getItalic()) rPr.ele('i');
                    if (font.getStrikethrough()) rPr.ele('strike');
                    if (font.getColor().getARGB()) rPr.ele('color').att('rgb', font.getColor().getARGB()!);
                    if (font.getSize()) rPr.ele('sz').att('val', String(font.getSize()));
                    if (font.getUnderline()) rPr.ele('u').att('val', font.getUnderline()!);
                }
            }

            const t = r.ele('t');
            const text = element.getText();
            if (text !== text.trim()) {
                t.att('xml:space', 'preserve');
            }
            t.txt(text);
        }
    }

    /**
     * Write Merge Cells.
     */
    private writeMergeCells(root: any, worksheet: CoreWorksheet): void {
        const mergeCells = Object.keys(worksheet.getMergeCells());
        if (mergeCells.length > 0) {
            const mergeCellsEle = root.ele('mergeCells', { count: mergeCells.length });
            for (const mergeCell of mergeCells) {
                mergeCellsEle.ele('mergeCell', { ref: mergeCell });
            }
        }
    }

    /**
     * Write Data Validations.
     */
    private writeDataValidations(root: any, worksheet: CoreWorksheet): void {
        const dataValidationCollection = worksheet.getDataValidationCollection();

        if (dataValidationCollection.size > 0) {
            const dataValidationsEle = root.ele('dataValidations', {
                count: dataValidationCollection.size,
            });

            for (const [coordinate, dv] of dataValidationCollection) {
                const dvEle = dataValidationsEle.ele('dataValidation');

                // Type
                if (dv.getType() !== '') {
                    dvEle.att('type', dv.getType());
                }

                // Error style
                if (dv.getErrorStyle() !== '') {
                    dvEle.att('errorStyle', dv.getErrorStyle());
                }

                // Operator
                if (dv.getOperator() !== '') {
                    dvEle.att('operator', dv.getOperator());
                }

                // Boolean attributes (note: showDropDown is inverted)
                dvEle.att('allowBlank', dv.getAllowBlank() ? '1' : '0');
                dvEle.att('showDropDown', dv.getShowDropDown() ? '0' : '1');
                dvEle.att('showInputMessage', dv.getShowInputMessage() ? '1' : '0');
                dvEle.att('showErrorMessage', dv.getShowErrorMessage() ? '1' : '0');

                // Error messages
                if (dv.getErrorTitle() !== '') {
                    dvEle.att('errorTitle', dv.getErrorTitle());
                }
                if (dv.getError() !== '') {
                    dvEle.att('error', dv.getError());
                }

                // Prompt messages
                if (dv.getPromptTitle() !== '') {
                    dvEle.att('promptTitle', dv.getPromptTitle());
                }
                if (dv.getPrompt() !== '') {
                    dvEle.att('prompt', dv.getPrompt());
                }

                // Cell reference/range
                dvEle.att('sqref', dv.getSqref() ?? coordinate);

                // Formulas
                if (dv.getFormula1() !== '') {
                    dvEle.ele('formula1').txt(dv.getFormula1());
                }
                if (dv.getFormula2() !== '') {
                    dvEle.ele('formula2').txt(dv.getFormula2());
                }
            }
        }
    }

    /**
     * Write Hyperlinks.
     */
    private writeHyperlinks(root: any, worksheet: CoreWorksheet): void {
        const cellCollection = worksheet.getCellCollection();
        const cells = cellCollection.getCells();

        type ExternalHyperlink = { ref: string; url: string; location: string };
        type InternalHyperlink = { ref: string; location: string };

        const externalLinks: ExternalHyperlink[] = [];
        const internalLinks: InternalHyperlink[] = [];

        for (const cell of cells) {
            // Avoid creating hyperlink objects unless one is present.
            if (!('hasHyperlink' in cell) || typeof (cell as any).hasHyperlink !== 'function') {
                continue;
            }

            if (!(cell as any).hasHyperlink()) {
                continue;
            }

            const hyperlink = (cell as any).getHyperlink();
            const ref = (cell as any).getCoordinate();
            const url = String(hyperlink.getUrl?.() ?? '');
            const location = String(hyperlink.getLocation?.() ?? '');

            if (url !== '') {
                externalLinks.push({ ref, url, location });
            } else if (location !== '') {
                internalLinks.push({ ref, location });
            }
        }

        if (externalLinks.length === 0 && internalLinks.length === 0) {
            return;
        }

        const sortByCellRef = (a: { ref: string }, b: { ref: string }): number => {
            const [aCol, aRow] = Coordinate.indexesFromString(a.ref);
            const [bCol, bRow] = Coordinate.indexesFromString(b.ref);
            if (aRow !== bRow) return aRow - bRow;
            return aCol - bCol;
        };

        externalLinks.sort(sortByCellRef);
        internalLinks.sort(sortByCellRef);

        const hyperlinksEle = root.ele('hyperlinks');

        // Relationship ids must match xl/worksheets/_rels/sheetN.xml.rels.
        let rId = 1;
        for (const link of externalLinks) {
            const attrs: Record<string, string> = {
                ref: link.ref,
                'r:id': `rId${rId++}`,
            };
            if (link.location !== '') {
                attrs.location = link.location;
            }
            hyperlinksEle.ele('hyperlink', attrs);
        }

        for (const link of internalLinks) {
            hyperlinksEle.ele('hyperlink', {
                ref: link.ref,
                location: link.location,
            });
        }
    }

    /**
     * Write ConditionalFormatting.
     */
    private writeConditionalFormatting(root: any, worksheet: CoreWorksheet): void {
        const stylesCollection = worksheet.getConditionalStylesCollection();
        if (stylesCollection.size === 0) {
            return;
        }

        let id = 0;
        for (const styles of stylesCollection.values()) {
            for (const conditional of styles) {
                id = Math.max(id, conditional.getPriority());
            }
        }

        for (const [cellCoordinate, styles] of stylesCollection) {
            const cf = root.ele('conditionalFormatting', {
                sqref: Coordinate.resolveUnionAndIntersection(cellCoordinate.replace(/\$/g, ''), ' '),
            });

            const cellRange = Coordinate.splitRange(cellCoordinate.replace(/\$/g, '').toUpperCase());
            const firstRange = cellRange[0];
            const firstPair = firstRange ? firstRange[0] : undefined;
            const topLeftCell = Worksheet.normalizeConditionalTopLeftCell(firstPair?.[0] ?? 'A1');

            for (const conditional of styles) {
                const type = conditional.getConditionType();
                const rule = cf.ele('cfRule', {
                    type: type,
                    priority: conditional.getPriority() || ++id,
                });

                if (
                    type !== Conditional.CONDITION_COLORSCALE &&
                    type !== Conditional.CONDITION_DATABAR &&
                    type !== Conditional.CONDITION_ICONSET &&
                    !conditional.getNoFormatSet()
                ) {
                    try {
                        const dxfId = this.getParentWriter()
                            .getStylesConditionalHashTable()
                            .getIndexForHashCode(conditional.getHashCode());
                        rule.att('dxfId', String(dxfId));
                    } catch {
                        // DXF not found, skip dxfId
                    }
                }

                if (
                    (type === Conditional.CONDITION_CELLIS ||
                        type === Conditional.CONDITION_CONTAINSTEXT ||
                        type === Conditional.CONDITION_NOTCONTAINSTEXT ||
                        type === Conditional.CONDITION_BEGINSWITH ||
                        type === Conditional.CONDITION_ENDSWITH) &&
                    conditional.getOperatorType() !== ''
                ) {
                    rule.att('operator', conditional.getOperatorType());
                }

                if (conditional.getStopIfTrue()) {
                    rule.att('stopIfTrue', '1');
                }

                if (
                    type === Conditional.CONDITION_CONTAINSTEXT ||
                    type === Conditional.CONDITION_NOTCONTAINSTEXT ||
                    type === Conditional.CONDITION_BEGINSWITH ||
                    type === Conditional.CONDITION_ENDSWITH
                ) {
                    this.writeTextCondElements(rule, conditional, topLeftCell);
                } else if (type === Conditional.CONDITION_COLORSCALE) {
                    this.writeColorScaleElements(rule, conditional.getColorScale());
                } else if (type === Conditional.CONDITION_DATABAR) {
                    this.writeDataBarElements(rule, conditional.getDataBar());
                } else if (type === Conditional.CONDITION_ICONSET) {
                    this.writeIconSetElements(rule, conditional.getIconSet());
                } else {
                    this.writeOtherCondElements(rule, conditional, topLeftCell);
                }
            }
        }
    }

    private writeTextCondElements(rule: any, conditional: Conditional, _topLeftCell: string): void {
        const txt = conditional.getText();
        if (txt) {
            rule.att('text', txt);
            const conditions = conditional.getConditions();
            if (conditions.length === 0) {
                const operator = conditional.getOperatorType();
                if (operator === 'containsText') {
                    rule.ele('formula').txt(`NOT(ISERROR(SEARCH("${txt}",${_topLeftCell})))`);
                } else if (operator === 'beginsWith') {
                    rule.ele('formula').txt(`LEFT(${_topLeftCell},LEN("${txt}"))="${txt}"`);
                } else if (operator === 'endsWith') {
                    rule.ele('formula').txt(`RIGHT(${_topLeftCell},LEN("${txt}"))="${txt}"`);
                } else if (operator === 'notContains') {
                    rule.ele('formula').txt(`ISERROR(SEARCH("${txt}",${_topLeftCell}))`);
                }
            } else {
                for (const condition of conditions) {
                    rule.ele('formula').txt(String(condition));
                }
            }
        }
    }

    private writeColorScaleElements(rule: any, colorScale: ConditionalColorScale | null): void {
        if (!colorScale) return;
        const cs = rule.ele('colorScale');

        const writeCfvo = (type: string, val: string | number | boolean | null): void => {
            const cfvo = cs.ele('cfvo', { type });
            if (val !== null) cfvo.att('val', String(val));
        };

        const minCfvo = colorScale.getMinimumConditionalFormatValueObject();
        const minArgb = colorScale.getMinimumColor()?.getARGB() ?? null;
        const useMin = minCfvo !== null || minArgb !== null;
        if (useMin) {
            let type = 'min';
            let value: string | number | boolean | null = null;
            if (minCfvo !== null) {
                const typex = minCfvo.getType();
                if (typex === 'formula') {
                    const formula = minCfvo.getCellFormula();
                    if (formula !== null) {
                        type = typex;
                        value = formula;
                    }
                } else {
                    type = typex;
                    const defaults: Record<string, string> = {
                        number: '0',
                        percent: '0',
                        percentile: '10',
                    };
                    value = minCfvo.getValue() ?? defaults[type] ?? null;
                }
            }
            writeCfvo(type, value);
        }

        const midCfvo = colorScale.getMidpointConditionalFormatValueObject();
        const midArgb = colorScale.getMidpointColor()?.getARGB() ?? null;
        const useMid = midCfvo !== null || midArgb !== null;
        if (useMid) {
            let type = 'percentile';
            let value: string | number | boolean | null = '50';
            if (midCfvo !== null) {
                type = midCfvo.getType();
                if (type === 'formula') {
                    const formula = midCfvo.getCellFormula();
                    if (formula !== null) {
                        value = formula;
                    } else {
                        type = 'percentile';
                        value = '50';
                    }
                } else {
                    const defaults: Record<string, string> = {
                        number: '0',
                        percent: '50',
                        percentile: '50',
                    };
                    value = midCfvo.getValue() ?? defaults[type] ?? null;
                }
            }
            writeCfvo(type, value);
        }

        const maxCfvo = colorScale.getMaximumConditionalFormatValueObject();
        const maxArgb = colorScale.getMaximumColor()?.getARGB() ?? null;
        const useMax = maxCfvo !== null || maxArgb !== null;
        if (useMax) {
            let type = 'max';
            let value: string | number | boolean | null = null;
            if (maxCfvo !== null) {
                const typex = maxCfvo.getType();
                if (typex === 'formula') {
                    const formula = maxCfvo.getCellFormula();
                    if (formula !== null) {
                        type = typex;
                        value = formula;
                    }
                } else {
                    type = typex;
                    const defaults: Record<string, string> = {
                        number: '0',
                        percent: '100',
                        percentile: '90',
                    };
                    value = maxCfvo.getValue() ?? defaults[type] ?? null;
                }
            }
            writeCfvo(type, value);
        }

        if (useMin) {
            const color = cs.ele('color');
            if (minArgb !== null) color.att('rgb', minArgb);
        }
        if (useMid) {
            const color = cs.ele('color');
            if (midArgb !== null) color.att('rgb', midArgb);
        }
        if (useMax) {
            const color = cs.ele('color');
            if (maxArgb !== null) color.att('rgb', maxArgb);
        }
    }

    private writeDataBarElements(rule: any, dataBar: ConditionalDataBar | null): void {
        if (!dataBar) return;
        const db = rule.ele('dataBar');
        if (dataBar.getShowValue() !== null) db.att('showValue', dataBar.getShowValue() ? '1' : '0');

        const minCfvo = dataBar.getMinimumConditionalFormatValueObject();
        {
            const type = minCfvo?.getType() ?? 'min';
            const val = type === 'formula' ? (minCfvo?.getCellFormula() ?? null) : (minCfvo?.getValue() ?? null);
            const cfvo = db.ele('cfvo', { type });
            if (val !== null) cfvo.att('val', String(val));
        }

        const maxCfvo = dataBar.getMaximumConditionalFormatValueObject();
        {
            const type = maxCfvo?.getType() ?? 'max';
            const val = type === 'formula' ? (maxCfvo?.getCellFormula() ?? null) : (maxCfvo?.getValue() ?? null);
            const cfvo = db.ele('cfvo', { type });
            if (val !== null) cfvo.att('val', String(val));
        }

        if (dataBar.getColor()) {
            db.ele('color', { rgb: dataBar.getColor() });
        }
    }

    private writeIconSetElements(rule: any, iconSet: ConditionalIconSet | null): void {
        if (!iconSet) return;
        const is = rule.ele('iconSet');
        if (iconSet.getIconSetType()) is.att('iconSet', iconSet.getIconSetType());
        if (iconSet.getReverse() !== null) is.att('reverse', iconSet.getReverse() ? '1' : '0');
        if (iconSet.getShowValue() !== null) is.att('showValue', iconSet.getShowValue() ? '1' : '0');

        for (const cfvoObj of iconSet.getCfvos()) {
            const cfvo = is.ele('cfvo', { type: cfvoObj.getType() });
            if (cfvoObj.getValue() !== null) cfvo.att('val', String(cfvoObj.getValue()));
            if (cfvoObj.getGreaterThanOrEqual() !== null) cfvo.att('gte', cfvoObj.getGreaterThanOrEqual() ? '1' : '0');
        }
    }

    private writeOtherCondElements(rule: any, conditional: Conditional, topLeftCell: string): void {
        const conditions = conditional.getConditions();
        if (conditions.length > 0) {
            for (const condition of conditions) {
                rule.ele('formula').txt(String(condition));
            }
        } else {
            const type = conditional.getConditionType();
            if (type === Conditional.CONDITION_CONTAINSBLANKS) {
                rule.ele('formula').txt(`LEN(TRIM(${topLeftCell}))=0`);
            } else if (type === Conditional.CONDITION_NOTCONTAINSBLANKS) {
                rule.ele('formula').txt(`LEN(TRIM(${topLeftCell}))>0`);
            } else if (type === Conditional.CONDITION_CONTAINSERRORS) {
                rule.ele('formula').txt(`ISERROR(${topLeftCell})`);
            } else if (type === Conditional.CONDITION_NOTCONTAINSERRORS) {
                rule.ele('formula').txt(`NOT(ISERROR(${topLeftCell}))`);
            }
        }
    }

    /**
     * Write Page Setup.
     */
    private writePageSetup(root: any, worksheet: CoreWorksheet): void {
        const pageSetup = worksheet.getPageSetup();

        root.ele('pageSetup', {
            orientation: pageSetup.getOrientation(),
            paperSize: pageSetup.getPaperSize(),
            scale: pageSetup.getScale() || '100',
            fitToHeight: pageSetup.getFitToHeight() || '1',
            fitToWidth: pageSetup.getFitToWidth() || '1',
            firstPageNumber: pageSetup.getFirstPageNumber() || '1',
            useFirstPageNumber: pageSetup.getFirstPageNumber() !== null ? '1' : '0',
            pageOrder: pageSetup.getPageOrder(),
        });
    }

    /**
     * Write AutoFilter.
     */
    private writeAutoFilter(root: any, worksheet: CoreWorksheet): void {
        const autoFilter = worksheet.getAutoFilter();
        const range = autoFilter.getRange();
        if (range === '') {
            return;
        }

        const autoFilterEle = root.ele('autoFilter', { ref: range });

        for (const [columnID, column] of autoFilter.getColumns()) {
            const rules = column.getRules();
            if (rules.length === 0 && column.getAttributes().size === 0) {
                continue;
            }

            const filterColumnEle = autoFilterEle.ele('filterColumn', {
                colId: autoFilter.getColumnOffset(columnID),
            });

            const filterType = column.getFilterType();
            const attributes = column.getAttributes();

            if (filterType === AutoFilterColumn.AUTOFILTER_FILTERTYPE_DYNAMICFILTER) {
                const dynamicFilterEle = filterColumnEle.ele('dynamicFilter');
                for (const rule of rules) {
                    dynamicFilterEle.att('type', rule.getGrouping());
                    const val = column.getAttribute('val');
                    if (val !== null) dynamicFilterEle.att('val', String(val));
                    const maxVal = column.getAttribute('maxVal');
                    if (maxVal !== null) dynamicFilterEle.att('maxVal', String(maxVal));
                }
            } else if (filterType === AutoFilterColumn.AUTOFILTER_FILTERTYPE_TOPTENFILTER) {
                const top10Ele = filterColumnEle.ele('top10');
                for (const rule of rules) {
                    top10Ele.att(
                        'top',
                        rule.getGrouping() === AutoFilterRule.AUTOFILTER_COLUMN_RULE_TOPTEN_TOP ? '1' : '0',
                    );
                    top10Ele.att(
                        'percent',
                        rule.getOperator() === AutoFilterRule.AUTOFILTER_COLUMN_RULE_TOPTEN_PERCENT ? '1' : '0',
                    );
                    top10Ele.att('val', String(rule.getValue()));
                    const filterVal = column.getAttribute('maxVal');
                    if (filterVal !== null) top10Ele.att('filterVal', String(filterVal));
                }
            } else if (filterType === AutoFilterColumn.AUTOFILTER_FILTERTYPE_CUSTOMFILTER) {
                const customFiltersEle = filterColumnEle.ele('customFilters');
                if (column.getJoin() === AutoFilterColumn.AUTOFILTER_COLUMN_JOIN_AND) {
                    customFiltersEle.att('and', '1');
                }
                for (const rule of rules) {
                    const customFilterEle = customFiltersEle.ele('customFilter');
                    const operator = rule.getOperator();
                    if (operator !== AutoFilterRule.AUTOFILTER_COLUMN_RULE_EQUAL) {
                        customFilterEle.att('operator', operator);
                    }
                    customFilterEle.att('val', String(rule.getValue()));
                }
            } else {
                const filtersEle = filterColumnEle.ele('filters');
                const blank = column.getAttribute('blank');
                if (blank !== null) filtersEle.att('blank', blank ? '1' : '0');

                for (const rule of rules) {
                    if (rule.getRuleType() === AutoFilterRule.AUTOFILTER_RULETYPE_FILTER) {
                        filtersEle.ele('filter', { val: String(rule.getValue()) });
                    } else if (rule.getRuleType() === AutoFilterRule.AUTOFILTER_RULETYPE_DATEGROUP) {
                        const dateGroupItemEle = filtersEle.ele('dateGroupItem');
                        const value = rule.getValue() as Record<string, any>;
                        for (const [key, val] of Object.entries(value)) {
                            dateGroupItemEle.att(key, String(val));
                        }
                        dateGroupItemEle.att('dateTimeGrouping', rule.getGrouping());
                    }
                }
            }
        }
    }

    private getStringTableIndex(value: any, stringTable: (RichText | string)[]): number {
        if (value instanceof RichText) {
            const hash = value.getHashCode();
            return stringTable.findIndex((item) => item instanceof RichText && item.getHashCode() === hash);
        }
        const sValue = String(value);
        return stringTable.findIndex((item) => typeof item === 'string' && item === sValue);
    }
}
