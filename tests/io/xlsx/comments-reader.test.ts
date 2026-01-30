import { beforeAll, describe, expect, test } from 'bun:test';
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

    // This fixture is moderately large and XLSX parsing is not optimized yet.
    // Load once and reuse across tests.
    const LOAD_TIMEOUT_MS = 60_000;
    let formsCommentsWb: Awaited<ReturnType<XlsxReader['load']>>;

    beforeAll(async () => {
        const file = path.join(fixturesDir, 'formscomments.xlsx');
        const reader = new XlsxReader();
        formsCommentsWb = await reader.load(file);
    }, LOAD_TIMEOUT_MS);

    test('reads author + plain text + coordinates (classic comments)', () => {
        const commentsSheet = formsCommentsWb.getSheetByName('Comments');
        expect(commentsSheet).toBeDefined();

        const sheet = commentsSheet!;
        const comments = getCommentsSnapshot(sheet);

        expect([...comments.keys()].sort()).toEqual(['A1']);

        const a1 = comments.get('A1');
        expect(a1).toEqual({
            author: 'Owen Leibman',
            text: 'Owen Leibman:\nHello again.',
        });
    });

    test('reads comments from another sheet with shared strings present', () => {
        const formsCommentsSheet = formsCommentsWb.getSheetByName('FormsComments');
        expect(formsCommentsSheet).toBeDefined();

        const sheet = formsCommentsSheet!;
        const comments = getCommentsSnapshot(sheet);

        expect([...comments.keys()].sort()).toEqual(['F1']);

        const f1 = comments.get('F1');
        expect(f1).toEqual({
            author: 'Owen Leibman',
            text: 'Owen Leibman:\nHello\n',
        });
    });

    test('readDataOnly disables comments loading', async () => {
        const file = path.join(fixturesDir, 'drawing_in_comment.xlsx');
        const reader = new XlsxReader();
        const wb = await reader.load(file);
        const sheet = wb.getActiveSheet();
        const comments = getCommentsSnapshot(sheet);
        expect([...comments.keys()].sort()).toEqual(['A1']);
        expect(comments.get('A1')).toEqual({ author: 'Админ', text: '' });

        const dataOnlyReader = new XlsxReader();
        dataOnlyReader.setReadDataOnly(true);
        const wbDataOnly = await dataOnlyReader.load(file);
        expect(wbDataOnly.getActiveSheet().getComments().size).toBe(0);
    }, LOAD_TIMEOUT_MS);
});
