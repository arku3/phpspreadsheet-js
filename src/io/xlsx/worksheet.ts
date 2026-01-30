import { create } from 'xmlbuilder2';
import { Worksheet as CoreWorksheet } from '../../core/worksheet.ts';
import { DataType } from '../../core/cell.ts';
import { Coordinate } from '../../utils/coordinate.ts';
import { RichText } from '../../rich-text/rich-text.ts';
import { Run } from '../../rich-text/run.ts';
import { WriterPart } from './writer-part.ts';
import { AutoFilter } from '../../worksheet/auto-filter.ts';
import { Column as AutoFilterColumn } from '../../worksheet/auto-filter/column.ts';
import { Rule as AutoFilterRule } from '../../worksheet/auto-filter/column/rule.ts';
import { Conditional } from '../../style/conditional.ts';
import { ConditionalColorScale } from '../../style/conditional-formatting/conditional-color-scale.ts';
import { ConditionalDataBar } from '../../style/conditional-formatting/conditional-data-bar.ts';
import { ConditionalIconSet } from '../../style/conditional-formatting/conditional-icon-set.ts';

/**
 * Generates worksheet XMLs.
 */
export class Worksheet extends WriterPart {
    /**
     * Write worksheet to XML format.
     */
    public writeWorksheet(worksheet: CoreWorksheet, stringTable: (RichText | string)[]): string {
        const root = create({ version: '1.0', encoding: 'UTF-8', standalone: true })
            .ele('worksheet', {
                xmlns: 'http://schemas.openxmlformats.org/spreadsheetml/2006/main',
                'xmlns:r': 'http://schemas.openxmlformats.org/officeDocument/2006/relationships',
                'xmlns:mc': 'http://schemas.openxmlformats.org/compatibility/2006',
                'mc:Ignorable': 'x14ac',
                'xmlns:x14ac': 'http://schemas.microsoft.com/office/spreadsheetml/2009/9/ac'
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

        // pageMargins
        const margins = worksheet.getPageMargins();
        root.ele('pageMargins', {
            left: margins.getLeft(),
            right: margins.getRight(),
            top: margins.getTop(),
            bottom: margins.getBottom(),
            header: margins.getHeader(),
            footer: margins.getFooter()
        });

        // pageSetup
        this.writePageSetup(root, worksheet);

        return root.end({ prettyPrint: true });
    }

    /**
     * Write SheetViews.
     */
    private writeSheetViews(root: any, worksheet: CoreWorksheet): void {
        const sheetViews = root.ele('sheetViews');
        const sheetView = sheetViews.ele('sheetView', {
            tabSelected: worksheet.getParent().getActiveSheetIndex() === worksheet.getParent().getIndex(worksheet) ? '1' : '0',
            workbookViewId: '0'
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
        if (topLeftCell !== '' && topLeftCell !== 'A1' && worksheet.getPaneState() !== CoreWorksheet.PANE_FROZEN && worksheet.getPaneState() !== CoreWorksheet.PANE_FROZENSPLIT) {
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
                    normalFreeze = (xSplit <= 0) ? 'bottomLeft' : 'bottomRight';
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
                    customWidth: colDimension.getWidth() >= 0 ? '1' : '0'
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
            const dataValidationsEle = root.ele('dataValidations', { count: dataValidationCollection.size });
            
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
                    dvEle.ele('formula1', dv.getFormula1());
                }
                if (dv.getFormula2() !== '') {
                    dvEle.ele('formula2', dv.getFormula2());
                }
            }
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
                sqref: Coordinate.resolveUnionAndIntersection(cellCoordinate.replace(/\$/g, ''), ' ')
            });

            const cellRange = Coordinate.splitRange(cellCoordinate.replace(/\$/g, '').toUpperCase());
            const firstRange = cellRange[0];
            const firstPair = firstRange ? firstRange[0] : undefined;
            const topLeftCell = firstPair?.[0] ?? 'A1';

            for (const conditional of styles) {
                const type = conditional.getConditionType();
                const rule = cf.ele('cfRule', {
                    type: type,
                    priority: conditional.getPriority() || ++id
                });

                if (
                    type !== Conditional.CONDITION_COLORSCALE &&
                    type !== Conditional.CONDITION_DATABAR &&
                    type !== Conditional.CONDITION_ICONSET &&
                    !conditional.getNoFormatSet()
                ) {
                    try {
                        const dxfId = this.getParentWriter().getStylesConditionalHashTable().getIndexForHashCode(conditional.getHashCode());
                        rule.att('dxfId', String(dxfId));
                    } catch {
                        // DXF not found, skip dxfId
                    }
                }

                if (
                    (type === Conditional.CONDITION_CELLIS || type === Conditional.CONDITION_CONTAINSTEXT || type === Conditional.CONDITION_NOTCONTAINSTEXT || type === Conditional.CONDITION_BEGINSWITH || type === Conditional.CONDITION_ENDSWITH) &&
                    conditional.getOperatorType() !== ''
                ) {
                    rule.att('operator', conditional.getOperatorType());
                }

                if (conditional.getStopIfTrue()) {
                    rule.att('stopIfTrue', '1');
                }

                if (type === Conditional.CONDITION_CONTAINSTEXT || type === Conditional.CONDITION_NOTCONTAINSTEXT || type === Conditional.CONDITION_BEGINSWITH || type === Conditional.CONDITION_ENDSWITH) {
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

        const minCfvo = colorScale.getMinimumConditionalFormatValueObject();
        const minColor = colorScale.getMinimumColor();
        if (minCfvo) {
            const cfvo = cs.ele('cfvo', { type: minCfvo.getType() });
            if (minCfvo.getValue() !== null) cfvo.att('val', String(minCfvo.getValue()));
        }

        const midCfvo = colorScale.getMidpointConditionalFormatValueObject();
        if (midCfvo) {
            const cfvo = cs.ele('cfvo', { type: midCfvo.getType() });
            if (midCfvo.getValue() !== null) cfvo.att('val', String(midCfvo.getValue()));
        }

        const maxCfvo = colorScale.getMaximumConditionalFormatValueObject();
        const maxColor = colorScale.getMaximumColor();
        if (maxCfvo) {
            const cfvo = cs.ele('cfvo', { type: maxCfvo.getType() });
            if (maxCfvo.getValue() !== null) cfvo.att('val', String(maxCfvo.getValue()));
        }

        if (minColor && minColor.getARGB()) cs.ele('color', { rgb: minColor.getARGB() });
        if (colorScale.getMidpointColor() && colorScale.getMidpointColor()!.getARGB()) {
            cs.ele('color', { rgb: colorScale.getMidpointColor()!.getARGB() });
        }
        if (maxColor && maxColor.getARGB()) cs.ele('color', { rgb: maxColor.getARGB() });
    }

    private writeDataBarElements(rule: any, dataBar: ConditionalDataBar | null): void {
        if (!dataBar) return;
        const db = rule.ele('dataBar');
        if (dataBar.getShowValue() !== null) db.att('showValue', dataBar.getShowValue() ? '1' : '0');

        const minCfvo = dataBar.getMinimumConditionalFormatValueObject();
        if (minCfvo) {
            const cfvo = db.ele('cfvo', { type: minCfvo.getType() });
            if (minCfvo.getValue() !== null) cfvo.att('val', String(minCfvo.getValue()));
        }

        const maxCfvo = dataBar.getMaximumConditionalFormatValueObject();
        if (maxCfvo) {
            const cfvo = db.ele('cfvo', { type: maxCfvo.getType() });
            if (maxCfvo.getValue() !== null) cfvo.att('val', String(maxCfvo.getValue()));
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
            pageOrder: pageSetup.getPageOrder()
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
                colId: autoFilter.getColumnOffset(columnID)
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
                    top10Ele.att('top', rule.getGrouping() === AutoFilterRule.AUTOFILTER_COLUMN_RULE_TOPTEN_TOP ? '1' : '0');
                    top10Ele.att('percent', rule.getOperator() === AutoFilterRule.AUTOFILTER_COLUMN_RULE_TOPTEN_PERCENT ? '1' : '0');
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
            return stringTable.findIndex(item => item instanceof RichText && item.getHashCode() === hash);
        }
        const sValue = String(value);
        return stringTable.findIndex(item => typeof item === 'string' && item === sValue);
    }
}
