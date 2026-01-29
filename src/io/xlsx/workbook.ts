import { create } from 'xmlbuilder2';
import { Spreadsheet } from '../../core/spreadsheet.ts';
import { WriterPart } from './writer-part.ts';

/**
 * Generates workbook.xml.
 */
export class Workbook extends WriterPart {
    /**
     * Write workbook to XML format.
     */
    public writeWorkbook(spreadsheet: Spreadsheet, preCalculateFormulas: boolean = false): string {
        const root = create({ version: '1.0', encoding: 'UTF-8', standalone: true })
            .ele('workbook', {
                xmlns: 'http://schemas.openxmlformats.org/spreadsheetml/2006/main',
                'xmlns:r': 'http://schemas.openxmlformats.org/officeDocument/2006/relationships'
            });

        // fileVersion
        root.ele('fileVersion', {
            appName: 'xl',
            lastEdited: '4',
            lowestEdited: '4',
            rupBuild: '4505'
        });

        // workbookPr
        root.ele('workbookPr', {
            codeName: 'ThisWorkbook'
        });

        // bookViews
        const bookViews = root.ele('bookViews');
        bookViews.ele('workbookView', {
            activeTab: 0 // TODO: Get from spreadsheet
        });

        // sheets
        const sheets = root.ele('sheets');
        const sheetCount = spreadsheet.getSheetCount();
        for (let i = 0; i < sheetCount; i++) {
            const sheet = spreadsheet.getSheet(i);
            sheets.ele('sheet', {
                name: sheet.getTitle(),
                sheetId: i + 1,
                'r:id': `rId${i + 4}` // rId1-3 are styles, theme, sharedStrings
            });
        }

        // calcPr
        root.ele('calcPr', {
            calcId: '999999',
            calcMode: 'auto',
            fullCalcOnLoad: preCalculateFormulas ? '0' : '1'
        });

        return root.end({ prettyPrint: true });
    }
}
