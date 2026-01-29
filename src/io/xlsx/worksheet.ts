import { create } from 'xmlbuilder2';
import { Worksheet as CoreWorksheet } from '../../core/worksheet.ts';
import { DataType } from '../../core/cell.ts';
import { Coordinate } from '../../utils/coordinate.ts';
import { RichText } from '../../rich-text/rich-text.ts';
import { Run } from '../../rich-text/run.ts';
import { WriterPart } from './writer-part.ts';

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

        // cols
        this.writeCols(root, worksheet);

        // sheetData
        this.writeSheetData(root, worksheet, stringTable);

        // mergeCells
        this.writeMergeCells(root, worksheet);

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
            const rowEle = sheetData.ele('row', { r: row });
            
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

    private getStringTableIndex(value: any, stringTable: (RichText | string)[]): number {
        if (value instanceof RichText) {
            const hash = value.getHashCode();
            return stringTable.findIndex(item => item instanceof RichText && item.getHashCode() === hash);
        }
        const sValue = String(value);
        return stringTable.findIndex(item => typeof item === 'string' && item === sValue);
    }
}
