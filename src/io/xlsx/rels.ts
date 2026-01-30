import { create } from 'xmlbuilder2';
import { Spreadsheet } from '../../core/spreadsheet.ts';
import { Worksheet } from '../../core/worksheet.ts';
import { WriterPart } from './writer-part.ts';

/**
 * Represents a relationship entry.
 */
interface Relationship {
    id: string;
    type: string;
    target: string;
    targetMode?: string;
}

/**
 * Generates relationships (.rels) with dynamic rId management.
 */
export class Rels extends WriterPart {
    #nextRId = 1;

    /**
     * Get the next available rId and increment the counter.
     */
    private getNextRId(): string {
        return `rId${this.#nextRId++}`;
    }

    /**
     * Reset the rId counter for a new relationship file.
     */
    private resetRId(): void {
        this.#nextRId = 1;
    }

    /**
     * Write relationships to XML format (package level _rels/.rels).
     */
    public writeRelationships(spreadsheet: Spreadsheet): string {
        this.resetRId();
        const relationships: Relationship[] = [];

        // Relationship xl/workbook.xml
        relationships.push({
            id: this.getNextRId(),
            type: 'http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument',
            target: 'xl/workbook.xml'
        });

        // Relationship docProps/core.xml
        relationships.push({
            id: this.getNextRId(),
            type: 'http://schemas.openxmlformats.org/package/2006/relationships/metadata/core-properties',
            target: 'docProps/core.xml'
        });

        // Relationship docProps/app.xml
        relationships.push({
            id: this.getNextRId(),
            type: 'http://schemas.openxmlformats.org/officeDocument/2006/relationships/extended-properties',
            target: 'docProps/app.xml'
        });

        // Relationship docProps/custom.xml (if custom properties exist)
        if (spreadsheet.getProperties().getCustomProperties().length > 0) {
            relationships.push({
                id: this.getNextRId(),
                type: 'http://schemas.openxmlformats.org/officeDocument/2006/relationships/custom-properties',
                target: 'docProps/custom.xml'
            });
        }

        return this.writeRelationshipsXml(relationships);
    }

    /**
     * Write workbook relationships to XML format (xl/_rels/workbook.xml.rels).
     * Returns both the XML and a map of target -> rId for reference by workbook.xml.
     */
    public writeWorkbookRelationships(spreadsheet: Spreadsheet): { xml: string; rIdMap: Map<string, string> } {
        this.resetRId();
        const relationships: Relationship[] = [];
        const rIdMap = new Map<string, string>();

        // Relationship styles.xml
        const stylesRId = this.getNextRId();
        relationships.push({
            id: stylesRId,
            type: 'http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles',
            target: 'styles.xml'
        });
        rIdMap.set('styles.xml', stylesRId);

        // Relationship theme/theme1.xml
        const themeRId = this.getNextRId();
        relationships.push({
            id: themeRId,
            type: 'http://schemas.openxmlformats.org/officeDocument/2006/relationships/theme',
            target: 'theme/theme1.xml'
        });
        rIdMap.set('theme/theme1.xml', themeRId);

        // Relationship sharedStrings.xml
        const sharedStringsRId = this.getNextRId();
        relationships.push({
            id: sharedStringsRId,
            type: 'http://schemas.openxmlformats.org/officeDocument/2006/relationships/sharedStrings',
            target: 'sharedStrings.xml'
        });
        rIdMap.set('sharedStrings.xml', sharedStringsRId);

        // Relationships with sheets
        const sheetCount = spreadsheet.getSheetCount();
        for (let i = 0; i < sheetCount; i++) {
            const sheetTarget = `worksheets/sheet${i + 1}.xml`;
            const sheetRId = this.getNextRId();
            relationships.push({
                id: sheetRId,
                type: 'http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet',
                target: sheetTarget
            });
            rIdMap.set(sheetTarget, sheetRId);
        }

        const xml = this.writeRelationshipsXml(relationships);
        return { xml, rIdMap };
    }

    /**
     * Write worksheet relationships to XML format.
     */
    public writeWorksheetRelationships(worksheet: Worksheet, worksheetId: number): string | null {
        this.resetRId();
        const tables = worksheet.getTables();
        
        if (tables.length === 0) {
            return null;
        }

        const relationships: Relationship[] = [];

        for (let i = 0; i < tables.length; i++) {
            relationships.push({
                id: this.getNextRId(),
                type: 'http://schemas.openxmlformats.org/officeDocument/2006/relationships/table',
                target: `../tables/table${i + 1}.xml`
            });
        }

        return this.writeRelationshipsXml(relationships);
    }

    /**
     * Generate the XML from a list of relationships.
     */
    private writeRelationshipsXml(relationships: Relationship[]): string {
        const root = create({ version: '1.0', encoding: 'UTF-8', standalone: true })
            .ele('Relationships', { xmlns: 'http://schemas.openxmlformats.org/package/2006/relationships' });

        for (const rel of relationships) {
            const attrs: any = {
                Id: rel.id,
                Type: rel.type,
                Target: rel.target
            };
            if (rel.targetMode) {
                attrs.TargetMode = rel.targetMode;
            }
            root.ele('Relationship', attrs);
        }

        return root.end({ prettyPrint: true });
    }
}
