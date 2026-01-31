import fs from 'node:fs';
import archiver from 'archiver';
import { HashTable } from '../common/hash-table.ts';
import { Spreadsheet } from '../core/spreadsheet.ts';
import { Borders } from '../style/borders.ts';
import { Fill } from '../style/fill.ts';
import { Font } from '../style/font.ts';
import { NumberFormat } from '../style/number-format.ts';
import { Style } from '../style/style.ts';
import type { Chart } from '../worksheet/chart/chart.ts';
import type { IWriter } from './i-writer.ts';
import { writeChartXml } from './xlsx/charts.ts';
import { Comments } from './xlsx/comments.ts';
import { ContentTypes } from './xlsx/content-types.ts';
import { DocProps } from './xlsx/doc-props.ts';
import { DrawingML } from './xlsx/drawingml.ts';
import { Rels } from './xlsx/rels.ts';
import { StringTable } from './xlsx/string-table.ts';
import { Styles } from './xlsx/styles.ts';
import { Theme } from './xlsx/theme.ts';
import { Workbook } from './xlsx/workbook.ts';
import { Worksheet } from './xlsx/worksheet.ts';

/**
 * XLSX Writer.
 */
export class XlsxWriter implements IWriter {
    #spreadsheet: Spreadsheet;
    #preCalculateFormulas = false;
    #includeCharts = false;
    #stringTable: (string | any)[] = [];

    #chartIndexByChart: Map<Chart, number> = new Map();
    #nextChartIndex = 1;

    // Hash tables
    #fontHashTable: HashTable<Font> = new HashTable();
    #fillHashTable: HashTable<Fill> = new HashTable();
    #bordersHashTable: HashTable<Borders> = new HashTable();
    #numFmtHashTable: HashTable<NumberFormat> = new HashTable();
    #styleHashTable: HashTable<Style> = new HashTable();
    #stylesConditionalHashTable: HashTable<any> = new HashTable();

    // Writer parts
    #writerPartContentTypes: ContentTypes;
    #writerPartRels: Rels;
    #writerPartStringTable: StringTable;
    #writerPartWorkbook: Workbook;
    #writerPartWorksheet: Worksheet;
    #writerPartStyles: Styles;
    #writerPartDocProps: DocProps;
    #writerPartTheme: Theme;
    #writerPartComments: Comments;
    #writerPartDrawingML: DrawingML;

    constructor(spreadsheet: Spreadsheet) {
        this.#spreadsheet = spreadsheet;

        this.#writerPartContentTypes = new ContentTypes(this);
        this.#writerPartRels = new Rels(this);
        this.#writerPartStringTable = new StringTable(this);
        this.#writerPartWorkbook = new Workbook(this);
        this.#writerPartWorksheet = new Worksheet(this);
        this.#writerPartStyles = new Styles(this);
        this.#writerPartDocProps = new DocProps(this);
        this.#writerPartTheme = new Theme(this);
        this.#writerPartComments = new Comments(this);
        this.#writerPartDrawingML = new DrawingML(this);
    }

    public getFontHashTable(): HashTable<Font> {
        return this.#fontHashTable;
    }

    public getFillHashTable(): HashTable<Fill> {
        return this.#fillHashTable;
    }

    public getBordersHashTable(): HashTable<Borders> {
        return this.#bordersHashTable;
    }

    public getNumFmtHashTable(): HashTable<NumberFormat> {
        return this.#numFmtHashTable;
    }

    public getStyleHashTable(): HashTable<Style> {
        return this.#styleHashTable;
    }

    public getStylesConditionalHashTable(): HashTable<any> {
        return this.#stylesConditionalHashTable;
    }

    public createStyleDictionaries(): void {
        this.#styleHashTable = new HashTable();
        this.#styleHashTable.addFromSource(this.#writerPartStyles.allStyles(this.#spreadsheet));

        this.#stylesConditionalHashTable = new HashTable();
        this.#stylesConditionalHashTable.addFromSource(this.#writerPartStyles.allConditionalStyles(this.#spreadsheet));

        this.#fillHashTable = new HashTable();
        this.#fillHashTable.addFromSource(this.#writerPartStyles.allFills(this.#spreadsheet));

        this.#fontHashTable = new HashTable();
        this.#fontHashTable.addFromSource(this.#writerPartStyles.allFonts(this.#spreadsheet));

        this.#bordersHashTable = new HashTable();
        this.#bordersHashTable.addFromSource(this.#writerPartStyles.allBorders(this.#spreadsheet));

        this.#numFmtHashTable = new HashTable();
        this.#numFmtHashTable.addFromSource(this.#writerPartStyles.allNumberFormats(this.#spreadsheet));
    }

    public getSpreadsheet(): Spreadsheet {
        return this.#spreadsheet;
    }

    public getStringTable(): string[] {
        return this.#stringTable;
    }

    public getPreCalculateFormulas(): boolean {
        return this.#preCalculateFormulas;
    }

    public setPreCalculateFormulas(value: boolean): this {
        this.#preCalculateFormulas = value;
        return this;
    }

    public setIncludeCharts(value: boolean): this {
        this.#includeCharts = value;
        return this;
    }

    public getIncludeCharts(): boolean {
        return this.#includeCharts;
    }

    /**
     * Allocate a global chart index for this XLSX package.
     *
     * Charts are written as `xl/charts/chart{n}.xml` and referenced from
     * the worksheet drawing part.
     */
    public allocateChartIndex(chart: Chart): number {
        const existing = this.#chartIndexByChart.get(chart);
        if (existing !== undefined) return existing;

        const idx = this.#nextChartIndex++;
        this.#chartIndexByChart.set(chart, idx);
        return idx;
    }

    public getChartCount(): number {
        return this.#chartIndexByChart.size;
    }

    async save(filename: string): Promise<void> {
        return new Promise((resolve, reject) => {
            const output = fs.createWriteStream(filename);
            const archive = archiver('zip', {
                zlib: { level: 9 },
            });

            output.on('close', () => resolve());
            archive.on('error', (err) => reject(err));

            archive.pipe(output);

            // 0. Pre-allocate chart indexes so content types and rels are stable.
            this.#chartIndexByChart = new Map();
            this.#nextChartIndex = 1;
            if (this.#includeCharts) {
                for (let i = 0; i < this.#spreadsheet.getSheetCount(); i++) {
                    const sheet = this.#spreadsheet.getSheet(i);
                    for (const chart of sheet.getChartCollection()) {
                        this.allocateChartIndex(chart);
                    }
                }
            }

            // 1. Create string table
            this.#stringTable = [];
            for (let i = 0; i < this.#spreadsheet.getSheetCount(); i++) {
                this.#stringTable = this.#writerPartStringTable.createStringTable(
                    this.#spreadsheet.getSheet(i),
                    this.#stringTable,
                );
            }

            // 1a. Create style dictionaries
            this.createStyleDictionaries();

            // 2. Add [Content_Types].xml
            archive.append(this.#writerPartContentTypes.writeContentTypes(this.#spreadsheet), {
                name: '[Content_Types].xml',
            });

            // 3. Add relationships
            archive.append(this.#writerPartRels.writeRelationships(this.#spreadsheet), {
                name: '_rels/.rels',
            });
            const { xml: workbookRels, rIdMap } = this.#writerPartRels.writeWorkbookRelationships(this.#spreadsheet);
            archive.append(workbookRels, { name: 'xl/_rels/workbook.xml.rels' });

            // 4. Add string table
            archive.append(this.#writerPartStringTable.writeStringTable(this.#stringTable), {
                name: 'xl/sharedStrings.xml',
            });

            // 5. Add styles
            archive.append(this.#writerPartStyles.writeStyles(this.#spreadsheet), {
                name: 'xl/styles.xml',
            });

            // 5a. Add theme
            archive.append(this.#writerPartTheme.writeTheme(this.#spreadsheet), {
                name: 'xl/theme/theme1.xml',
            });

            // 5b. Add metadata
            archive.append(this.#writerPartDocProps.writeDocPropsApp(this.#spreadsheet), {
                name: 'docProps/app.xml',
            });
            archive.append(this.#writerPartDocProps.writeDocPropsCore(this.#spreadsheet), {
                name: 'docProps/core.xml',
            });
            const customProps = this.#writerPartDocProps.writeDocPropsCustom(this.#spreadsheet);
            if (customProps) {
                archive.append(customProps, { name: 'docProps/custom.xml' });
            }

            // 6. Add workbook
            archive.append(
                this.#writerPartWorkbook.writeWorkbook(this.#spreadsheet, this.#preCalculateFormulas, rIdMap),
                { name: 'xl/workbook.xml' },
            );

            // 7. Add worksheets
            let nextImageDataIndex = 1;
            const mediaWritten = new Set<string>();
            const chartsWritten = new Set<number>();
            for (let i = 0; i < this.#spreadsheet.getSheetCount(); i++) {
                const sheet = this.#spreadsheet.getSheet(i);
                archive.append(this.#writerPartWorksheet.writeWorksheet(sheet, this.#stringTable), {
                    name: `xl/worksheets/sheet${i + 1}.xml`,
                });

                // Worksheet rels (e.g. for drawings/comments, currently minimal)
                const sheetRels = this.#writerPartRels.writeWorksheetRelationships(sheet, i + 1);
                if (sheetRels) {
                    archive.append(sheetRels, {
                        name: `xl/worksheets/_rels/sheet${i + 1}.xml.rels`,
                    });
                }

                // Classic comments (notes)
                if (sheet.getComments().size > 0) {
                    archive.append(this.#writerPartComments.writeComments(sheet), {
                        name: `xl/comments${i + 1}.xml`,
                    });
                    archive.append(this.#writerPartComments.writeVmlDrawing(sheet), {
                        name: `xl/drawings/vmlDrawing${i + 1}.vml`,
                    });
                }

                // Worksheet drawings (DrawingML)
                const drawingParts = this.#writerPartDrawingML.writeWorksheetDrawingParts(
                    sheet,
                    i + 1,
                    nextImageDataIndex,
                );
                if (drawingParts) {
                    nextImageDataIndex = drawingParts.nextImageDataIndex;
                    archive.append(drawingParts.drawingXml, {
                        name: `xl/drawings/drawing${i + 1}.xml`,
                    });
                    archive.append(drawingParts.drawingRelsXml, {
                        name: `xl/drawings/_rels/drawing${i + 1}.xml.rels`,
                    });

                    for (const media of drawingParts.mediaFiles) {
                        const zipPath = `xl/media/${media.filename}`;
                        if (mediaWritten.has(zipPath)) continue;
                        mediaWritten.add(zipPath);
                        archive.append(Buffer.from(media.data), { name: zipPath });
                    }
                }

                if (this.#includeCharts) {
                    for (const chart of sheet.getChartCollection()) {
                        const chartIndex = this.allocateChartIndex(chart);
                        if (chartsWritten.has(chartIndex)) continue;
                        chartsWritten.add(chartIndex);
                        archive.append(writeChartXml(chart), {
                            name: `xl/charts/chart${chartIndex}.xml`,
                        });
                    }
                }
            }

            archive.finalize();
        });
    }
}
