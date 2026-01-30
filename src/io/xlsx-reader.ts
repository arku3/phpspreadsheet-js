import type { IReader, WorksheetInfo } from './i-reader.ts';
import { Spreadsheet } from '../core/spreadsheet.ts';
import { Coordinate } from '../utils/coordinate.ts';
import { open } from 'node:fs/promises';
import unzipper from 'unzipper';
import { StylesReader, type StyleData } from './xlsx/styles-reader.ts';

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
     * Path to styles.xml in the ZIP file.
     */
    private stylesPath: string | null = null;

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
    async listWorksheetNames(filename: string): Promise<string[]> {
        try {
            const zip = await unzipper.Open.file(filename);
            const relsFile = zip.files.find(f => f.path === '_rels/.rels');
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
            const workbookFile = zip.files.find(f => f.path === workbookPath);
            if (!workbookFile) {
                throw new Error(`Invalid XLSX file: missing ${workbookPath}`);
            }
            
            const workbookContent = await workbookFile.buffer();
            const workbookXml = workbookContent.toString('utf-8');
            
            // Extract sheet names
            const sheetNames: string[] = [];
            const sheetMatches = workbookXml.match(/<sheet[^>]*name="([^"]+)"/g);
            if (sheetMatches) {
                for (const match of sheetMatches) {
                    const nameMatch = match.match(/name="([^"]+)"/);
                    if (nameMatch && nameMatch[1]) {
                        sheetNames.push(nameMatch[1]);
                    }
                }
            }
            
            return sheetNames;
        } catch (error) {
            if (error instanceof Error) {
                throw new Error(`Failed to read XLSX file: ${error.message}`);
            }
            throw new Error('Failed to read XLSX file');
        }
    }

    /**
     * Return worksheet info.
     */
    async listWorksheetInfo(filename: string): Promise<WorksheetInfo[]> {
        try {
            const zip = await unzipper.Open.file(filename);
            const relsFile = zip.files.find(f => f.path === '_rels/.rels');
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

            const workbookFile = zip.files.find(f => f.path === workbookPath);
            if (!workbookFile) {
                throw new Error(`Invalid XLSX file: missing ${workbookPath}`);
            }

            const workbookContent = await workbookFile.buffer();
            const workbookXml = workbookContent.toString('utf-8');

            // Parse workbook relationships to find worksheet paths
            const workbookRelsFile = zip.files.find(f => f.path === workbookRelPath);
            const worksheetPaths: Map<string, string> = new Map();

            if (workbookRelsFile) {
                const relsContent = await workbookRelsFile.buffer();
                const relsXml = relsContent.toString('utf-8');

                const worksheetMatches = relsXml.matchAll(/<Relationship[^>]*Id="([^"]+)"[^>]*Type="[^"]*worksheet"[^>]*Target="([^"]+)"/g);
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
            const sheetMatches = workbookXml.matchAll(/<sheet[^>]*name="([^"]+)"[^>]*sheetId="(\d+)"(?:[^>]*state="([^"]*)")?[^>]*r:id="([^"]+)"/g);
            const sheets: { name: string; rId: string; state: string }[] = [];
            for (const match of sheetMatches) {
                const name = match[1];
                const state = match[3];
                const rId = match[4];
                if (name && rId) {
                    sheets.push({ name, rId, state: state || 'visible' });
                }
            }

            const worksheetInfo: WorksheetInfo[] = [];

            // Get info for each worksheet
            for (const sheetInfo of sheets) {
                const worksheetPath = worksheetPaths.get(sheetInfo.rId);
                if (!worksheetPath) {
                    continue;
                }

                const wsFile = zip.files.find(f => f.path === worksheetPath);
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

                const totalColumns = lastColumnIndex;

                worksheetInfo.push({
                    worksheetName: sheetInfo.name,
                    lastColumnLetter: lastColumnLetter,
                    lastColumnIndex: lastColumnIndex - 1, // Convert to 0-based
                    totalRows: totalRows,
                    totalColumns: totalColumns,
                    sheetState: sheetInfo.state
                });
            }

            return worksheetInfo;
        } catch (error) {
            if (error instanceof Error) {
                throw new Error(`Failed to read worksheet info: ${error.message}`);
            }
            throw new Error('Failed to read worksheet info');
        }
    }

    /**
     * Loads a Spreadsheet from file.
     */
    async load(filename: string): Promise<Spreadsheet> {
        try {
            const zip = await unzipper.Open.file(filename);
            
            // Find workbook path
            const relsFile = zip.files.find(f => f.path === '_rels/.rels');
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
            const workbookRelsFile = zip.files.find(f => f.path === workbookRelPath);
            const worksheetPaths: Map<string, string> = new Map();
            let sharedStringsPath: string | null = null;
            
            if (workbookRelsFile) {
                const relsContent = await workbookRelsFile.buffer();
                const relsXml = relsContent.toString('utf-8');
                
                // Find worksheet relationships
                const worksheetMatches = relsXml.matchAll(/<Relationship[^>]*Id="([^"]+)"[^>]*Type="[^"]*worksheet"[^>]*Target="([^"]+)"/g);
                for (const match of worksheetMatches) {
                    const rId = match[1];
                    const target = match[2];
                    if (rId && target) {
                        const cleanTarget = target.replace(/^\//, '');
                        worksheetPaths.set(rId, cleanTarget.startsWith('xl/') ? cleanTarget : `xl/${cleanTarget}`);
                    }
                }
                
                // Find shared strings
                const sharedStringsMatch = relsXml.match(/<Relationship[^>]*Type="[^"]*sharedStrings"[^>]*Target="([^"]+)"/);
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
                const ssFile = zip.files.find(f => f.path === sharedStringsPath);
                if (ssFile) {
                    const ssContent = await ssFile.buffer();
                    const ssXml = ssContent.toString('utf-8');
                    const siMatches = ssXml.matchAll(/<si>(.*?)<\/si>/gs);
                    for (const match of siMatches) {
                        const textContent = match[1];
                        if (textContent) {
                            // Extract text from <t> tags
                            const textMatch = textContent.match(/<t>([^<]*)<\/t>/);
                            sharedStrings.push(textMatch && textMatch[1] ? textMatch[1] : '');
                        } else {
                            sharedStrings.push('');
                        }
                    }
                }
            }
            
            // Read styles if present and not in data-only mode
            let styleData: StyleData | null = null;
            if (!this.#readDataOnly && this.stylesPath) {
                const stylesFile = zip.files.find(f => f.path === this.stylesPath);
                if (stylesFile) {
                    const stylesContent = await stylesFile.buffer();
                    const stylesXml = stylesContent.toString('utf-8');
                    const stylesReader = new StylesReader(this);
                    styleData = await stylesReader.readStyles(stylesXml);
                }
            }
            
            // Read workbook.xml to get sheet information
            const workbookFile = zip.files.find(f => f.path === workbookPath);
            if (!workbookFile) {
                throw new Error(`Invalid XLSX file: missing ${workbookPath}`);
            }
            
            const workbookContent = await workbookFile.buffer();
            const workbookXml = workbookContent.toString('utf-8');
            
            // Create spreadsheet
            const spreadsheet = new Spreadsheet();
            let defaultSheetUsed = false;
            
            // Add styles to spreadsheet if available
            if (styleData && styleData.cellXfs.length > 0) {
                for (const cellXf of styleData.cellXfs) {
                    spreadsheet.addCellXf(cellXf);
                }
            }
            
            // Parse sheets from workbook.xml
            const sheetMatches = workbookXml.matchAll(/<sheet[^>]*name="([^"]+)"[^>]*sheetId="(\d+)"[^>]*r:id="([^"]+)"/g);
            const sheets: { name: string; rId: string }[] = [];
            for (const match of sheetMatches) {
                const name = match[1];
                const rId = match[3];
                if (name && rId) {
                    sheets.push({ name, rId });
                }
            }
            
            // Load each worksheet
            for (const sheetInfo of sheets) {
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
                    if (!defaultSheetUsed && spreadsheet.getSheetCount() === 1) {
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
                }
                
                // Read worksheet XML
                const wsFile = zip.files.find(f => f.path === worksheetPath);
                if (!wsFile) {
                    continue;
                }
                
                const wsContent = await wsFile.buffer();
                const wsXml = wsContent.toString('utf-8');
                
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
                        const cellStyle = spreadsheet.getCellXfByIndex(styleIndex);
                        if (cellStyle) {
                            // Copy style properties manually since exportArray is private
                            const targetStyle = cell.getStyle();
                            targetStyle.getFont().applyFromArray({
                                name: cellStyle.getFont().getName(),
                                size: cellStyle.getFont().getSize(),
                                bold: cellStyle.getFont().getBold(),
                                italic: cellStyle.getFont().getItalic(),
                                underline: cellStyle.getFont().getUnderline(),
                                strikethrough: cellStyle.getFont().getStrikethrough(),
                                color: { argb: cellStyle.getFont().getColor().getARGB() }
                            });
                            targetStyle.getFill().applyFromArray({
                                fillType: cellStyle.getFill().getFillType(),
                                startColor: { argb: cellStyle.getFill().getStartColor().getARGB() },
                                endColor: { argb: cellStyle.getFill().getEndColor().getARGB() }
                            });
                            targetStyle.getBorders().applyFromArray({
                                left: {
                                    borderStyle: cellStyle.getBorders().getLeft().getBorderStyle(),
                                    color: { argb: cellStyle.getBorders().getLeft().getColor().getARGB() }
                                },
                                right: {
                                    borderStyle: cellStyle.getBorders().getRight().getBorderStyle(),
                                    color: { argb: cellStyle.getBorders().getRight().getColor().getARGB() }
                                },
                                top: {
                                    borderStyle: cellStyle.getBorders().getTop().getBorderStyle(),
                                    color: { argb: cellStyle.getBorders().getTop().getColor().getARGB() }
                                },
                                bottom: {
                                    borderStyle: cellStyle.getBorders().getBottom().getBorderStyle(),
                                    color: { argb: cellStyle.getBorders().getBottom().getColor().getARGB() }
                                },
                                diagonal: {
                                    borderStyle: cellStyle.getBorders().getDiagonal().getBorderStyle(),
                                    color: { argb: cellStyle.getBorders().getDiagonal().getColor().getARGB() }
                                }
                            });
                            targetStyle.getAlignment().applyFromArray({
                                horizontal: cellStyle.getAlignment().getHorizontal(),
                                vertical: cellStyle.getAlignment().getVertical(),
                                textRotation: cellStyle.getAlignment().getTextRotation(),
                                wrapText: cellStyle.getAlignment().getWrapText()
                            });
                            targetStyle.getNumberFormat().applyFromArray({
                                formatCode: cellStyle.getNumberFormat().getFormatCode()
                            });
                        }
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
}
