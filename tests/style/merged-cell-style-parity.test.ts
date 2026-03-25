import { describe, expect, it } from 'bun:test';
import { Spreadsheet } from '../../src/core/spreadsheet.ts';
import { MergedCellStyle } from '../../src/style/conditional-formatting/merged-cell-style.ts';
import { Conditional } from '../../src/style/conditional.ts';
import { Style } from '../../src/style/style.ts';
import { TableDxfsStyle } from '../../src/worksheet/table-dxfs-style.ts';
import { Table } from '../../src/worksheet/table.ts';

describe('Merged Cell Style Parity', () => {
    it('should return tables with and without effective styles for a cell like PhpSpreadsheet', () => {
        const spreadsheet = new Spreadsheet();
        const sheet = spreadsheet.getActiveSheet();

        const styledTable = new Table('A1:B3', 'StyledTable');
        const styledDxfs = new TableDxfsStyle('StyledDxfs');
        styledDxfs.setHeaderRowStyle(new Style());
        styledTable.getStyle().setTableDxfsStyle(styledDxfs);
        sheet.addTable(styledTable);

        const plainTable = new Table('D1:E3', 'PlainTable');
        sheet.addTable(plainTable);

        expect(sheet.getTablesWithStylesForCell(sheet.getCell('A2')).map((table) => table.getName())).toEqual([
            'StyledTable',
        ]);
        expect(sheet.getTablesWithoutStylesForCell(sheet.getCell('D2')).map((table) => table.getName())).toEqual([
            'PlainTable',
        ]);
    });

    it('should apply built-in table header styling when no dxfs style exists', () => {
        const spreadsheet = new Spreadsheet();
        const sheet = spreadsheet.getActiveSheet();

        const table = new Table('A1:B3', 'BuiltInTable');
        sheet.addTable(table);

        const merged = new MergedCellStyle();
        const style = merged.getMergedStyle(sheet, 'A1');

        expect(merged.getMatched()).toBe(true);
        expect(style.getFill().getFillType()).toBe('solid');
        expect(style.getFill().getStartColor().getARGB()).toBe('FF000000');
        expect(style.getFont().getColor().getARGB()).toBe('FFFFFFFF');
    });

    it('should apply custom table stripe styles from dxfs tables', () => {
        const spreadsheet = new Spreadsheet();
        const sheet = spreadsheet.getActiveSheet();

        const table = new Table('A1:B4', 'StyledTable');
        const dxfs = new TableDxfsStyle('StyledDxfs');
        const stripeStyle = new Style();
        stripeStyle.getFill().setFillType('solid');
        stripeStyle.getFill().getStartColor().setARGB('FF112233');
        dxfs.setFirstRowStripeStyle(stripeStyle);
        table.getStyle().setTableDxfsStyle(dxfs);
        sheet.addTable(table);

        const merged = new MergedCellStyle();
        const style = merged.getMergedStyle(sheet, 'A2', true, false);

        expect(merged.getMatched()).toBe(true);
        expect(style.getFill().getFillType()).toBe('solid');
        expect(style.getFill().getStartColor().getARGB()).toBe('FF112233');
    });

    it('should stop conditional merging at the first matched rule inside merged styles', () => {
        const spreadsheet = new Spreadsheet();
        const sheet = spreadsheet.getActiveSheet();
        sheet.setCellValue('A2', 5);

        const table = new Table('A1:B4', 'StyledTable');
        const dxfs = new TableDxfsStyle('StyledDxfs');
        const stripeStyle = new Style();
        stripeStyle.getFill().setFillType('solid');
        stripeStyle.getFill().getStartColor().setARGB('FF112233');
        dxfs.setFirstRowStripeStyle(stripeStyle);
        table.getStyle().setTableDxfsStyle(dxfs);
        sheet.addTable(table);

        const firstConditional = new Conditional();
        firstConditional.setConditionType(Conditional.CONDITION_CELLIS);
        firstConditional.setOperatorType(Conditional.OPERATOR_EQUAL);
        firstConditional.setConditions([5]);
        firstConditional.getStyle().getFont().setBold(true);

        const secondConditional = new Conditional();
        secondConditional.setConditionType(Conditional.CONDITION_CELLIS);
        secondConditional.setOperatorType(Conditional.OPERATOR_EQUAL);
        secondConditional.setConditions([5]);
        secondConditional.getStyle().getFont().setItalic(true);

        sheet.setConditionalStyles('A2', [firstConditional, secondConditional]);

        const merged = new MergedCellStyle();
        const style = merged.getMergedStyle(sheet, 'A2');

        expect(merged.getMatched()).toBe(true);
        expect(style.getFont().getBold()).toBe(true);
        expect(style.getFont().getItalic()).not.toBe(true);
    });

    it('should bind tables to the worksheet when added', () => {
        const spreadsheet = new Spreadsheet();
        const sheet = spreadsheet.getActiveSheet();
        const table = new Table('C1:D3', 'BoundTable');

        const returned = sheet.addTable(table);

        expect(returned).toBe(sheet);
        expect(table.getWorksheet()).toBe(sheet);
        expect(sheet.getTableByName('BoundTable')).toBe(table);
    });
});
