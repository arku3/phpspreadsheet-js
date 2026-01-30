import { describe, expect, test } from 'bun:test';
import path from 'node:path';
import { XlsxReader } from '../../../src/io/xlsx-reader.ts';

type ExpectedComment = {
    author: string;
    text: string;
};

const normalizeNewlines = (value: string): string => value.replace(/\r\n/g, '\n');

const getCommentsSnapshot = (sheet: { getComments(): ReadonlyMap<string, any> }): Map<string, ExpectedComment> => {
    const out = new Map<string, ExpectedComment>();
    for (const [coord, comment] of sheet.getComments()) {
        out.set(coord, {
            author: String(comment.getAuthor()),
            text: normalizeNewlines(String(comment.getText()?.getPlainText?.() ?? '')),
        });
    }
    return out;
};

describe('XlsxReader Classic Comments', () => {
    const fixturesDir = path.join(process.cwd(), 'tests', 'fixtures', 'xlsx', 'comments');

    const TEST_TIMEOUT_MS = 20_000;

    const loadFixture = async (filename: string, options?: { readDataOnly?: boolean; sheetNames?: string[] }) => {
        const file = path.join(fixturesDir, filename);
        const reader = new XlsxReader();
        if (options?.readDataOnly) {
            reader.setReadDataOnly(true);
        }
        if (options?.sheetNames && options.sheetNames.length > 0) {
            const allow = new Set(options.sheetNames);
            reader.setReadFilter(name => allow.has(name));
        }
        return reader.load(file);
    };

    test('reads author + plain text + coordinates (classic comments)', async () => {
        const wb = await loadFixture('formscomments.xlsx', { sheetNames: ['Comments'] });
        const sheet = wb.getSheetByName('Comments');
        expect(sheet).toBeDefined();

        const commentsSheet = sheet!;
        const comments = getCommentsSnapshot(commentsSheet);

        expect([...comments.keys()].sort()).toEqual(['A1']);

        const a1 = comments.get('A1');
        expect(a1).toEqual({
            author: 'Owen Leibman',
            text: 'Owen Leibman:\nHello again.',
        });
    }, TEST_TIMEOUT_MS);

    test('reads comments from another sheet with shared strings present', async () => {
        const wb = await loadFixture('formscomments.xlsx', { sheetNames: ['FormsComments'] });
        const sheet = wb.getSheetByName('FormsComments');
        expect(sheet).toBeDefined();

        const formsCommentsSheet = sheet!;
        const comments = getCommentsSnapshot(formsCommentsSheet);

        expect([...comments.keys()].sort()).toEqual(['F1']);

        const f1 = comments.get('F1');
        expect(f1).toEqual({
            author: 'Owen Leibman',
            text: 'Owen Leibman:\nHello\n',
        });
    }, TEST_TIMEOUT_MS);

    test('readDataOnly disables comments loading', async () => {
        const wb = await loadFixture('drawing_in_comment.xlsx');
        const sheet = wb.getActiveSheet();
        const comments = getCommentsSnapshot(sheet);
        expect([...comments.keys()].sort()).toEqual(['A1']);
        expect(comments.get('A1')).toEqual({ author: 'Админ', text: '' });

        const wbDataOnly = await loadFixture('drawing_in_comment.xlsx', { readDataOnly: true });
        expect(wbDataOnly.getActiveSheet().getComments().size).toBe(0);
    }, TEST_TIMEOUT_MS);
});
