import { afterAll, beforeAll, describe, expect, test } from 'bun:test';
import { Spreadsheet } from '../../../src/core/spreadsheet.ts';
import { XlsxReader } from '../../../src/io/xlsx-reader.ts';
import { XlsxWriter } from '../../../src/io/xlsx-writer.ts';
import unzipper from 'unzipper';
import fs from 'node:fs';
import path from 'node:path';

describe('XlsxWriter Classic Comments', () => {
    const testDir = './test-output';
    const testFile = path.join(testDir, 'test-comments.xlsx');

    beforeAll(async () => {
        if (!fs.existsSync(testDir)) {
            fs.mkdirSync(testDir, { recursive: true });
        }

        const spreadsheet = new Spreadsheet();
        const sheet = spreadsheet.getActiveSheet();

        sheet.getCell('A1').setValue('Cell');
        sheet.getComment('A1').setAuthor('Alice').setVisible(true);

        const writer = new XlsxWriter(spreadsheet);
        await writer.save(testFile);
    });

    afterAll(() => {
        if (fs.existsSync(testFile)) {
            fs.unlinkSync(testFile);
        }
    });

    test('writes required parts and relationships', async () => {
        const zip = await unzipper.Open.file(testFile);

        const typesFile = zip.files.find(f => f.path === '[Content_Types].xml');
        expect(typesFile).toBeDefined();
        const typesXml = (await typesFile!.buffer()).toString('utf-8');
        expect(typesXml).toContain('Extension="vml"');
        expect(typesXml).toContain('PartName="/xl/comments1.xml"');

        const sheetFile = zip.files.find(f => f.path === 'xl/worksheets/sheet1.xml');
        expect(sheetFile).toBeDefined();
        const sheetXml = (await sheetFile!.buffer()).toString('utf-8');
        expect(sheetXml).toContain('legacyDrawing');
        expect(sheetXml).toContain('r:id="rId_comments_vml1"');

        const relsFile = zip.files.find(f => f.path === 'xl/worksheets/_rels/sheet1.xml.rels');
        expect(relsFile).toBeDefined();
        const relsXml = (await relsFile!.buffer()).toString('utf-8');
        expect(relsXml).toContain('Id="rId_comments_vml1"');
        expect(relsXml).toContain('relationships/vmlDrawing');
        expect(relsXml).toContain('Target="../drawings/vmlDrawing1.vml"');
        expect(relsXml).toContain('Id="rId_comments1"');
        expect(relsXml).toContain('relationships/comments');
        expect(relsXml).toContain('Target="../comments1.xml"');

        const commentsFile = zip.files.find(f => f.path === 'xl/comments1.xml');
        expect(commentsFile).toBeDefined();
        const commentsXml = (await commentsFile!.buffer()).toString('utf-8');
        expect(commentsXml).toContain('<authors>');
        expect(commentsXml).toContain('Alice');
        expect(commentsXml).toContain('ref="A1"');

        const vmlFile = zip.files.find(f => f.path === 'xl/drawings/vmlDrawing1.vml');
        expect(vmlFile).toBeDefined();
        const vmlXml = (await vmlFile!.buffer()).toString('utf-8');
        expect(vmlXml).toContain('x:ClientData');
        expect(vmlXml).toContain('<x:Row>0</x:Row>');
        expect(vmlXml).toContain('<x:Column>0</x:Column>');
    });

    test('XlsxReader loads classic comments unless readDataOnly', async () => {
        const reader = new XlsxReader();
        const loaded = await reader.load(testFile);
        const sheet = loaded.getActiveSheet();

        expect(sheet.hasComment('A1')).toBe(true);
        expect(sheet.getComment('A1').getAuthor()).toBe('Alice');
        expect(sheet.getComment('A1').getText().getPlainText()).toBe('');

        const dataOnlyReader = new XlsxReader();
        dataOnlyReader.setReadDataOnly(true);
        const loadedDataOnly = await dataOnlyReader.load(testFile);
        const sheetDataOnly = loadedDataOnly.getActiveSheet();
        expect(sheetDataOnly.hasComment('A1')).toBe(false);
    });
});
