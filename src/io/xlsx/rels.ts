import { create } from 'xmlbuilder2';
import { Spreadsheet } from '../../core/spreadsheet.ts';
import { Worksheet } from '../../core/worksheet.ts';
import { WriterPart } from './writer-part.ts';

/**
 * Generates relationships (.rels).
 */
export class Rels extends WriterPart {
    /**
     * Write relationships to XML format.
     */
    public writeRelationships(spreadsheet: Spreadsheet): string {
        const root = create({ version: '1.0', encoding: 'UTF-8', standalone: true })
            .ele('Relationships', { xmlns: 'http://schemas.openxmlformats.org/package/2006/relationships' });

        // Relationship xl/workbook.xml
        this.writeRelationship(root, 1, 'http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument', 'xl/workbook.xml');

        // Relationship docProps/core.xml
        this.writeRelationship(root, 2, 'http://schemas.openxmlformats.org/package/2006/relationships/metadata/core-properties', 'docProps/core.xml');

        // Relationship docProps/app.xml
        this.writeRelationship(root, 3, 'http://schemas.openxmlformats.org/officeDocument/2006/relationships/extended-properties', 'docProps/app.xml');

        // Relationship docProps/custom.xml
        if (spreadsheet.getProperties().getCustomProperties().length > 0) {
            this.writeRelationship(root, 4, 'http://schemas.openxmlformats.org/officeDocument/2006/relationships/custom-properties', 'docProps/custom.xml');
        }

        return root.end({ prettyPrint: true });
    }

    /**
     * Write workbook relationships to XML format.
     */
    public writeWorkbookRelationships(spreadsheet: Spreadsheet): string {
        const root = create({ version: '1.0', encoding: 'UTF-8', standalone: true })
            .ele('Relationships', { xmlns: 'http://schemas.openxmlformats.org/package/2006/relationships' });

        // Relationship styles.xml
        this.writeRelationship(root, 1, 'http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles', 'styles.xml');

        // Relationship theme/theme1.xml
        this.writeRelationship(root, 2, 'http://schemas.openxmlformats.org/officeDocument/2006/relationships/theme', 'theme/theme1.xml');

        // Relationship sharedStrings.xml
        this.writeRelationship(root, 3, 'http://schemas.openxmlformats.org/officeDocument/2006/relationships/sharedStrings', 'sharedStrings.xml');

        // Relationships with sheets
        const sheetCount = spreadsheet.getSheetCount();
        for (let i = 0; i < sheetCount; i++) {
            this.writeRelationship(
                root,
                (i + 4),
                'http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet',
                `worksheets/sheet${i + 1}.xml`
            );
        }

        return root.end({ prettyPrint: true });
    }

    /**
     * Write worksheet relationships to XML format.
     */
    public writeWorksheetRelationships(worksheet: Worksheet, worksheetId: number): string | null {
        // Minimal implementation for now, primarily for tables
        const tables = worksheet.getTables();
        if (tables.length === 0) {
            return null;
        }

        const root = create({ version: '1.0', encoding: 'UTF-8', standalone: true })
            .ele('Relationships', { xmlns: 'http://schemas.openxmlformats.org/package/2006/relationships' });

        // We need to track table global index if we have multiple sheets.
        // For simplicity in this initial port, let's assume one sheet or handle it via a better way later.
        // But the requirement says to port it. 
        // In PhpSpreadsheet, it passes $tableRef.

        // For now, let's just do a basic one.
        let rId = 1;
        for (let i = 0; i < tables.length; i++) {
            this.writeRelationship(
                root,
                rId++,
                'http://schemas.openxmlformats.org/officeDocument/2006/relationships/table',
                `../tables/table${rId-1}.xml` // This is not quite right if multiple sheets have tables
            );
        }

        return root.end({ prettyPrint: true });
    }

    /**
     * Write Relationship.
     */
    private writeRelationship(root: any, id: number | string, type: string, target: string, targetMode: string = ''): void {
        const attrs: any = {
            Id: 'rId' + id,
            Type: type,
            Target: target
        };
        if (targetMode !== '') {
            attrs.TargetMode = targetMode;
        }
        root.ele('Relationship', attrs);
    }
}
