import { describe, expect, test } from 'bun:test';
import { Comment } from '../../src/core/comment.ts';
import { Spreadsheet } from '../../src/core/spreadsheet.ts';
import { RichText } from '../../src/rich-text/rich-text.ts';

describe('Classic Comments', () => {
    test('Worksheet.getComment creates and attaches by default', () => {
        const spreadsheet = new Spreadsheet();
        const sheet = spreadsheet.getActiveSheet();

        expect(sheet.hasComment('A1')).toBe(false);

        const comment = sheet.getComment('a1');
        expect(comment).toBeInstanceOf(Comment);
        expect(sheet.hasComment('A1')).toBe(true);
        expect(sheet.tryGetComment('A1')).toBe(comment);
        expect(comment.getAuthor()).toBe('Author');
        expect(comment.getVisible()).toBe(false);
        expect(comment.getText()).toBeInstanceOf(RichText);
        expect(comment.getText().getPlainText()).toBe('');
    });

    test('Worksheet.getComment(create=false) does not attach', () => {
        const spreadsheet = new Spreadsheet();
        const sheet = spreadsheet.getActiveSheet();

        const comment = sheet.getComment('B2', false);
        expect(comment).toBeInstanceOf(Comment);
        expect(sheet.hasComment('B2')).toBe(false);
        expect(sheet.tryGetComment('B2')).toBeNull();
    });

    test('Worksheet comment coordinate validation matches PhpSpreadsheet expectations', () => {
        const spreadsheet = new Spreadsheet();
        const sheet = spreadsheet.getActiveSheet();

        expect(() => sheet.getComment('A1:B2')).toThrow('Cell coordinate string can not be a range of cells.');
        expect(() => sheet.getComment('$A$1')).toThrow('Cell coordinate string must not be absolute.');
        expect(() => sheet.getComment('Sheet1!A1')).toThrow('Cell coordinate must not include a worksheet reference.');
        expect(() => sheet.getComment('')).toThrow('Cell coordinate can not be zero-length string.');
        expect(() => sheet.getComment('NOT_A_CELL')).toThrow('Cell coordinate string is not a valid A1 reference.');
    });

    test('Worksheet.removeComment removes and is idempotent', () => {
        const spreadsheet = new Spreadsheet();
        const sheet = spreadsheet.getActiveSheet();

        sheet.getComment('C3');
        expect(sheet.hasComment('C3')).toBe(true);

        sheet.removeComment('C3');
        expect(sheet.hasComment('C3')).toBe(false);
        expect(sheet.tryGetComment('C3')).toBeNull();

        sheet.removeComment('C3');
        expect(sheet.hasComment('C3')).toBe(false);
    });

    test('Worksheet.getComments and setComments', () => {
        const spreadsheet = new Spreadsheet();
        const sheet = spreadsheet.getActiveSheet();

        sheet.getComment('A1').setAuthor('Alice');
        expect(sheet.getComments().get('A1')?.getAuthor()).toBe('Alice');

        const replacement = new Map<string, Comment>();
        replacement.set('B2', new Comment().setAuthor('Bob'));
        sheet.setComments(replacement);

        expect(sheet.hasComment('A1')).toBe(false);
        expect(sheet.hasComment('B2')).toBe(true);
        expect(sheet.tryGetComment('B2')?.getAuthor()).toBe('Bob');
    });

    test('Cell comment convenience methods proxy to worksheet', () => {
        const spreadsheet = new Spreadsheet();
        const sheet = spreadsheet.getActiveSheet();

        const cell = sheet.getCell('D4');
        expect(cell.hasComment()).toBe(false);
        expect(cell.tryGetComment()).toBeNull();

        const comment = cell.getComment();
        comment.setAuthor('Carol').setVisible(true);
        expect(cell.hasComment()).toBe(true);
        expect(sheet.hasComment('D4')).toBe(true);
        expect(sheet.tryGetComment('D4')?.getVisible()).toBe(true);
        expect(sheet.tryGetComment('D4')?.getAuthor()).toBe('Carol');

        cell.removeComment();
        expect(cell.hasComment()).toBe(false);
        expect(sheet.hasComment('D4')).toBe(false);
    });
});
