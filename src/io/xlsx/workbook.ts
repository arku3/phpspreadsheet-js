import { create } from 'xmlbuilder2';
import { DefinedName } from '../../core/defined-name.ts';
import { Spreadsheet } from '../../core/spreadsheet.ts';
import type { Worksheet } from '../../core/worksheet.ts';
import { Coordinate } from '../../utils/coordinate.ts';
import { WriterPart } from './writer-part.ts';

/**
 * Generates workbook.xml.
 */
export class Workbook extends WriterPart {
    /**
     * Write workbook to XML format.
     */
    public writeWorkbook(
        spreadsheet: Spreadsheet,
        preCalculateFormulas: boolean = false,
        rIdMap: Map<string, string>,
    ): string {
        const root = create({ version: '1.0', encoding: 'UTF-8', standalone: true }).ele('workbook', {
            xmlns: 'http://schemas.openxmlformats.org/spreadsheetml/2006/main',
            'xmlns:r': 'http://schemas.openxmlformats.org/officeDocument/2006/relationships',
        });

        // fileVersion
        root.ele('fileVersion', {
            appName: 'xl',
            lastEdited: '4',
            lowestEdited: '4',
            rupBuild: '4505',
        });

        // workbookPr
        root.ele('workbookPr', {
            codeName: 'ThisWorkbook',
            defaultThemeVersion: '124226',
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
            const sheetState = sheet.getSheetState();
            const attrs: Record<string, string | number> = {
                name: sheet.getTitle(),
                sheetId: i + 1,
                'r:id': rId,
            };

            // Match PhpSpreadsheet: omit state for visible sheets.
            if (sheetState !== 'visible' && sheetState !== '') {
                attrs.state = sheetState;
            }

            sheets.ele('sheet', attrs);
        }

        // definedNames (always present, per PhpSpreadsheet ordering)
        this.#writeDefinedNames(root, spreadsheet);

        // calcPr
        root.ele('calcPr', {
            calcId: '999999',
            calcMode: 'auto',
            fullCalcOnLoad: preCalculateFormulas ? '0' : '1',
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
            activeTab: spreadsheet.getActiveSheetIndex().toString(),
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

    #writeDefinedNames(root: any, spreadsheet: Spreadsheet): void {
        const definedNamesEl = root.ele('definedNames');

        for (const definedName of spreadsheet.getDefinedNames()) {
            this.#writeDefinedName(definedNamesEl, spreadsheet, definedName);
        }

        const sheetCount = spreadsheet.getSheetCount();
        for (let i = 0; i < sheetCount; i++) {
            const worksheet = spreadsheet.getSheet(i);
            this.#writeNamedRangeForAutofilter(definedNamesEl, worksheet, i);
            this.#writeNamedRangeForPrintTitles(definedNamesEl, worksheet, i);
            this.#writeNamedRangeForPrintArea(definedNamesEl, worksheet, i);
        }
    }

    #writeDefinedName(parent: any, spreadsheet: Spreadsheet, definedName: DefinedName): void {
        let localSheetId: number | null = null;

        if (definedName.getLocalOnly()) {
            const scope = definedName.getScope();
            if (!scope) {
                return;
            }

            const idx = spreadsheet.getIndex(scope);
            if (idx < 0) {
                // Parity with PhpSpreadsheet: deleting a sheet with local-only names may make scope invalid.
                return;
            }
            localSheetId = idx;
        }

        const el = parent.ele('definedName', {
            name: definedName.getName(),
            ...(localSheetId !== null ? { localSheetId: String(localSheetId) } : {}),
        });

        el.txt(this.#getDefinedRange(definedName));
    }

    #writeNamedRangeForAutofilter(parent: any, worksheet: Worksheet, worksheetId: number): void {
        const autoFilterRange = worksheet.getAutoFilter().getRange();
        if (!autoFilterRange) {
            return;
        }

        const split = Coordinate.splitRange(autoFilterRange);
        const first = split[0];
        if (!first || !first[0]) {
            return;
        }

        const start = Workbook.#stripWorksheetRef(first[0]);
        const end = first[1] ? Workbook.#stripWorksheetRef(first[1]) : null;

        const startAbs = Coordinate.absoluteCoordinate(start ?? '');
        const endAbs = end ? Coordinate.absoluteCoordinate(end ?? '') : null;
        const rangeAbs = endAbs ? `${startAbs}:${endAbs}` : startAbs;

        parent
            .ele('definedName', {
                name: '_xlnm._FilterDatabase',
                localSheetId: String(worksheetId),
                hidden: '1',
            })
            .txt(`${Workbook.#quoteSheetName(worksheet.getTitle())}!${rangeAbs}`);
    }

    #writeNamedRangeForPrintTitles(parent: any, worksheet: Worksheet, worksheetId: number): void {
        const pageSetup = worksheet.getPageSetup();
        if (!pageSetup.isColumnsToRepeatAtLeftSet() && !pageSetup.isRowsToRepeatAtTopSet()) {
            return;
        }

        const sheetPrefix = `${Workbook.#quoteSheetName(worksheet.getTitle())}!`;
        let settingString = '';

        if (pageSetup.isColumnsToRepeatAtLeftSet()) {
            const [startCol, endCol] = pageSetup.getColumnsToRepeatAtLeft();
            // PhpSpreadsheet writes repeat columns as provided by PageSetup.
            settingString += `${sheetPrefix}$${startCol}:$${endCol}`;
        }

        if (pageSetup.isRowsToRepeatAtTopSet()) {
            if (pageSetup.isColumnsToRepeatAtLeftSet()) {
                settingString += ',';
            }
            const [startRow, endRow] = pageSetup.getRowsToRepeatAtTop();
            settingString += `${sheetPrefix}$${startRow}:$${endRow}`;
        }

        parent
            .ele('definedName', {
                name: '_xlnm.Print_Titles',
                localSheetId: String(worksheetId),
            })
            .txt(settingString);
    }

    #writeNamedRangeForPrintArea(parent: any, worksheet: Worksheet, worksheetId: number): void {
        const pageSetup = worksheet.getPageSetup();
        if (!pageSetup.isPrintAreaSet()) {
            return;
        }

        const sheetPrefix = `${Workbook.#quoteSheetName(worksheet.getTitle())}!`;
        const printArea = Coordinate.splitRange(pageSetup.getPrintArea());

        const chunks: string[] = [];
        for (const rect of printArea) {
            const start = rect[0];
            const end = rect[1];
            if (!start || !end) {
                continue;
            }

            const startAbs = Coordinate.absoluteCoordinate(start);
            const endAbs = Coordinate.absoluteCoordinate(end);
            chunks.push(`${sheetPrefix}${startAbs}:${endAbs}`);
        }

        parent
            .ele('definedName', {
                name: '_xlnm.Print_Area',
                localSheetId: String(worksheetId),
            })
            .txt(chunks.join(','));
    }

    #getDefinedRange(definedName: DefinedName): string {
        let definedRange = definedName.getValue();

        // Port of PhpSpreadsheet's Calculation::CALCULATION_REGEXP_CELLREF_RELATIVE usage.
        // Note: use RegExp ctor to avoid escape pitfalls in regex literals.
        const cellRefRelative =
            '((([^\\s\\(,!&%^\\/\\*\\+<>=:`-]*)|(\'(?:[^\']|\'[^!])+?\')|("(?:[^"]|"[^!])+?"))!)?(\\$?\\b[a-z]{1,3})(\\$?\\d{1,7})(?![\\w.])';
        const regex = new RegExp(cellRefRelative, 'gim');

        const matches: Array<{ offset: number; length: number; worksheet: string; column: string; row: string }> = [];
        let match: RegExpExecArray | null;
        while ((match = regex.exec(definedRange)) !== null) {
            matches.push({
                offset: match.index,
                length: match[0].length,
                worksheet: match[2] ?? '',
                column: match[6] ?? '',
                row: match[7] ?? '',
            });
            // Defensive: avoid infinite loop with zero-length matches.
            if (match[0].length === 0) {
                regex.lastIndex++;
            }
        }

        for (let i = matches.length - 1; i >= 0; i--) {
            const entry = matches[i]!;
            const { offset, length, column, row } = entry;

            let worksheet = entry.worksheet;
            if (!worksheet) {
                if (offset === 0 || definedRange[offset - 1] !== ':') {
                    worksheet = definedName.getWorksheet()?.getTitle() ?? '';
                }
            } else {
                // Parity with PhpSpreadsheet: trim surrounding quotes, then unescape doubled apostrophes.
                worksheet = worksheet.replace(/^'+|'+$/g, '');
                worksheet = worksheet.replace(/''/g, "'");
            }

            let newRange = '';
            if (worksheet) {
                newRange = `${Workbook.#quoteSheetName(worksheet)}!`;
            }
            newRange += `${column}${row}`;

            definedRange = definedRange.slice(0, offset) + newRange + definedRange.slice(offset + length);
        }

        if (definedRange.startsWith('=')) {
            definedRange = definedRange.slice(1);
        }

        return definedRange;
    }

    static #quoteSheetName(sheetName: string): string {
        return `'${sheetName.replace(/'/g, "''")}'`;
    }

    static #stripWorksheetRef(reference: string): string {
        const bangIndex = reference.lastIndexOf('!');
        return bangIndex >= 0 ? reference.slice(bangIndex + 1) : reference;
    }
}
