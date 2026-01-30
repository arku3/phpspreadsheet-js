import { create } from 'xmlbuilder2';
import { Spreadsheet } from '../../core/spreadsheet.ts';
import { WriterPart } from './writer-part.ts';

/**
 * Generates [Content_Types].xml.
 */
export class ContentTypes extends WriterPart {
    /**
     * Write content types to XML format.
     */
    public writeContentTypes(spreadsheet: Spreadsheet): string {
        const root = create({ version: '1.0', encoding: 'UTF-8', standalone: true })
            .ele('Types', { xmlns: 'http://schemas.openxmlformats.org/package/2006/content-types' });

        // Theme
        this.writeOverrideContentType(root, '/xl/theme/theme1.xml', 'application/vnd.openxmlformats-officedocument.theme+xml');

        // Styles
        this.writeOverrideContentType(root, '/xl/styles.xml', 'application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml');

        // Rels
        this.writeDefaultContentType(root, 'rels', 'application/vnd.openxmlformats-package.relationships+xml');

        // XML
        this.writeDefaultContentType(root, 'xml', 'application/xml');

        // VML drawings (classic comments "notes")
        this.writeDefaultContentType(root, 'vml', 'application/vnd.openxmlformats-officedocument.vmlDrawing');

        // Workbook
        this.writeOverrideContentType(root, '/xl/workbook.xml', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml');

        // DocProps
        this.writeOverrideContentType(root, '/docProps/app.xml', 'application/vnd.openxmlformats-officedocument.extended-properties+xml');
        this.writeOverrideContentType(root, '/docProps/core.xml', 'application/vnd.openxmlformats-package.core-properties+xml');

        // Worksheets
        const sheetCount = spreadsheet.getSheetCount();
        for (let i = 0; i < sheetCount; i++) {
            this.writeOverrideContentType(root, `/xl/worksheets/sheet${i + 1}.xml`, 'application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml');
        }

        // Shared strings
        this.writeOverrideContentType(root, '/xl/sharedStrings.xml', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sharedStrings+xml');

        // Table
        let tableIndex = 1;
        for (let i = 0; i < sheetCount; i++) {
            const tableCount = spreadsheet.getSheet(i).getTables().length;
            for (let t = 1; t <= tableCount; t++) {
                this.writeOverrideContentType(root, `/xl/tables/table${tableIndex++}.xml`, 'application/vnd.openxmlformats-officedocument.spreadsheetml.table+xml');
            }
        }

        // Comments (classic comments "notes")
        for (let i = 0; i < sheetCount; i++) {
            if (spreadsheet.getSheet(i).getComments().size > 0) {
                this.writeOverrideContentType(
                    root,
                    `/xl/comments${i + 1}.xml`,
                    'application/vnd.openxmlformats-officedocument.spreadsheetml.comments+xml'
                );
            }
        }

        return root.end({ prettyPrint: true });
    }

    /**
     * Write Default content type.
     */
    private writeDefaultContentType(root: any, extension: string, contentType: string): void {
        root.ele('Default', {
            Extension: extension,
            ContentType: contentType
        });
    }

    /**
     * Write Override content type.
     */
    private writeOverrideContentType(root: any, partName: string, contentType: string): void {
        root.ele('Override', {
            PartName: partName,
            ContentType: contentType
        });
    }
}
