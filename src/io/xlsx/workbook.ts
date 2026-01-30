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
    public writeWorkbook(spreadsheet: Spreadsheet, preCalculateFormulas: boolean = false, rIdMap: Map<string, string>): string {
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
            codeName: 'ThisWorkbook',
            defaultThemeVersion: '124226'
        });

        // workbookProtection
        this.#writeWorkbookProtection(root, spreadsheet);

        // bookViews
        this.#writeBookViews(root, spreadsheet);

        // sheets
        const sheets = root.ele('sheets');
        const sheetCount = spreadsheet.getSheetCount();
        for (let i = 0; i < sheetCount; i++) {
            const sheet = spreadsheet.getSheet(i);
            const sheetTarget = `worksheets/sheet${i + 1}.xml`;
            const rId = rIdMap.get(sheetTarget) ?? `rId${i + 4}`;
            sheets.ele('sheet', {
                name: sheet.getTitle(),
                sheetId: i + 1,
                'r:id': rId
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

    /**
     * Write workbook protection.
     */
    #writeWorkbookProtection(root: any, spreadsheet: Spreadsheet): void {
        const security = spreadsheet.getSecurity();
        if (security.isSecurityEnabled()) {
            const protection = root.ele('workbookProtection');
            if (security.getLockRevision()) {
                protection.att('lockRevision', '1');
            }
            if (security.getLockStructure()) {
                protection.att('lockStructure', '1');
            }
            if (security.getLockWindows()) {
                protection.att('lockWindows', '1');
            }

            if (security.getWorkbookPassword() !== '') {
                protection.att('workbookPassword', security.getWorkbookPassword());
            }

            if (security.getRevisionsPassword() !== '') {
                protection.att('revisionsPassword', security.getRevisionsPassword());
            }

            if (security.advancedPassword()) {
                protection.att('workbookAlgorithmName', security.getWorkbookAlgorithmName());
                protection.att('workbookHashValue', security.getWorkbookHashValue());
                protection.att('workbookSaltValue', security.getWorkbookSaltValue());
                protection.att('workbookSpinCount', security.getWorkbookSpinCount().toString());
            }

            if (security.advancedRevisionsPassword()) {
                protection.att('revisionsAlgorithmName', security.getRevisionsAlgorithmName());
                protection.att('revisionsHashValue', security.getRevisionsHashValue());
                protection.att('revisionsSaltValue', security.getRevisionsSaltValue());
                protection.att('revisionsSpinCount', security.getRevisionsSpinCount().toString());
            }
        }
    }

    /**
     * Write book views.
     */
    #writeBookViews(root: any, spreadsheet: Spreadsheet): void {
        const bookViews = root.ele('bookViews');
        const attributes: any = {
            activeTab: spreadsheet.getActiveSheetIndex().toString()
        };

        if (spreadsheet.getAutoFilterDateGrouping() === false) {
            attributes.autoFilterDateGrouping = '0';
        }
        if (spreadsheet.getFirstSheetIndex() > 0) {
            attributes.firstSheetIndex = spreadsheet.getFirstSheetIndex().toString();
        }
        if (spreadsheet.getMinimized()) {
            attributes.minimized = '1';
        }
        if (spreadsheet.getShowHorizontalScroll() === false) {
            attributes.showHorizontalScroll = '0';
        }
        if (spreadsheet.getShowSheetTabs() === false) {
            attributes.showSheetTabs = '0';
        }
        if (spreadsheet.getShowVerticalScroll() === false) {
            attributes.showVerticalScroll = '0';
        }
        if (spreadsheet.getTabRatio() !== 600) {
            attributes.tabRatio = spreadsheet.getTabRatio().toString();
        }
        if (spreadsheet.getVisibility() !== Spreadsheet.VISIBILITY_VISIBLE) {
            attributes.visibility = spreadsheet.getVisibility();
        }

        bookViews.ele('workbookView', attributes);
    }
}
