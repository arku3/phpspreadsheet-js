import fs from 'node:fs';
import archiver from 'archiver';
import { Spreadsheet } from '../core/spreadsheet.ts';
import type { IWriter } from './i-writer.ts';
import { ContentTypes } from './xlsx/content-types.ts';
import { Rels } from './xlsx/rels.ts';
import { StringTable } from './xlsx/string-table.ts';
import { Workbook } from './xlsx/workbook.ts';
import { Worksheet } from './xlsx/worksheet.ts';
import { Styles } from './xlsx/styles.ts';
import { HashTable } from '../common/hash-table.ts';
import { Font } from '../style/font.ts';
import { Fill } from '../style/fill.ts';
import { Borders } from '../style/borders.ts';
import { NumberFormat } from '../style/number-format.ts';
import { Style } from '../style/style.ts';

/**
 * XLSX Writer.
 */
export class XlsxWriter implements IWriter {
    #spreadsheet: Spreadsheet;
    #preCalculateFormulas = false;
    #stringTable: (string | any)[] = [];
    
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

    constructor(spreadsheet: Spreadsheet) {
        this.#spreadsheet = spreadsheet;
        
        this.#writerPartContentTypes = new ContentTypes(this);
        this.#writerPartRels = new Rels(this);
        this.#writerPartStringTable = new StringTable(this);
        this.#writerPartWorkbook = new Workbook(this);
        this.#writerPartWorksheet = new Worksheet(this);
        this.#writerPartStyles = new Styles(this);
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

    async save(filename: string): Promise<void> {
        return new Promise((resolve, reject) => {
            const output = fs.createWriteStream(filename);
            const archive = archiver('zip', {
                zlib: { level: 9 }
            });

            output.on('close', () => resolve());
            archive.on('error', (err) => reject(err));

            archive.pipe(output);

            // 1. Create string table
            this.#stringTable = [];
            for (let i = 0; i < this.#spreadsheet.getSheetCount(); i++) {
                this.#stringTable = this.#writerPartStringTable.createStringTable(
                    this.#spreadsheet.getSheet(i),
                    this.#stringTable
                );
            }

            // 1a. Create style dictionaries
            this.createStyleDictionaries();

            // 2. Add [Content_Types].xml
            archive.append(this.#writerPartContentTypes.writeContentTypes(this.#spreadsheet), { name: '[Content_Types].xml' });

            // 3. Add relationships
            archive.append(this.#writerPartRels.writeRelationships(this.#spreadsheet), { name: '_rels/.rels' });
            archive.append(this.#writerPartRels.writeWorkbookRelationships(this.#spreadsheet), { name: 'xl/_rels/workbook.xml.rels' });

            // 4. Add string table
            archive.append(this.#writerPartStringTable.writeStringTable(this.#stringTable), { name: 'xl/sharedStrings.xml' });

            // 5. Add styles
            archive.append(this.#writerPartStyles.writeStyles(this.#spreadsheet), { name: 'xl/styles.xml' });

            // 6. Add workbook
            archive.append(this.#writerPartWorkbook.writeWorkbook(this.#spreadsheet, this.#preCalculateFormulas), { name: 'xl/workbook.xml' });

            // 7. Add worksheets
            for (let i = 0; i < this.#spreadsheet.getSheetCount(); i++) {
                const sheet = this.#spreadsheet.getSheet(i);
                archive.append(this.#writerPartWorksheet.writeWorksheet(sheet, this.#stringTable), { name: `xl/worksheets/sheet${i + 1}.xml` });
                
                // Worksheet rels (e.g. for drawings/comments, currently minimal)
                const sheetRels = this.#writerPartRels.writeWorksheetRelationships(sheet, i + 1);
                if (sheetRels) {
                    archive.append(sheetRels, { name: `xl/worksheets/_rels/sheet${i + 1}.xml.rels` });
                }
            }

            archive.finalize();
        });
    }
}
