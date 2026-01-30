import fs from 'node:fs';
import { describe, expect, it } from 'bun:test';
import { Spreadsheet } from '../src/core/spreadsheet.ts';
import { XlsxWriter } from '../src/io/xlsx-writer.ts';
import { Workbook } from '../src/io/xlsx/workbook.ts';

describe('Workbook Writer Integration', () => {
    it('should write workbook protection and views', async () => {
        const spreadsheet = new Spreadsheet();
        spreadsheet.getSecurity().setLockStructure(true);
        spreadsheet.getSecurity().setWorkbookPassword('test');

        spreadsheet.setShowSheetTabs(false);
        spreadsheet.setTabRatio(500);

        const writer = new XlsxWriter(spreadsheet);
        const workbookPart = new Workbook(writer);
        const xml = workbookPart.writeWorkbook(spreadsheet, false, new Map());

        expect(xml).toContain('<workbookProtection');
        expect(xml).toContain('lockStructure="1"');
        expect(xml).toContain('workbookPassword="'); // It's hashed

        expect(xml).toContain('<bookViews>');
        expect(xml).toContain('showSheetTabs="0"');
        expect(xml).toContain('tabRatio="500"');
    });

    it('should write advanced password protection', () => {
        const spreadsheet = new Spreadsheet();
        const security = spreadsheet.getSecurity();
        security.setLockStructure(true);
        security.setWorkbookAlgorithmName('SHA-512');
        security.setWorkbookSaltValue('salt', true);
        security.setWorkbookSpinCount(10000);
        security.setWorkbookPassword('advanced');

        const writer = new XlsxWriter(spreadsheet);
        const workbookPart = new Workbook(writer);
        const xml = workbookPart.writeWorkbook(spreadsheet, false, new Map());

        expect(xml).toContain('workbookAlgorithmName="SHA-512"');
        expect(xml).toContain('workbookSaltValue="');
        expect(xml).toContain('workbookSpinCount="10000"');
        expect(xml).toContain('workbookHashValue="');
    });
});
