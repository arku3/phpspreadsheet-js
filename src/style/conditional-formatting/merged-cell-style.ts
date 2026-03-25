import type { Worksheet } from '../../core/worksheet.ts';
import { Fill } from '../fill.ts';
import { Style } from '../style.ts';
import { CellStyleAssessor } from './cell-style-assessor.ts';
import { StyleMerger } from './style-merger.ts';

export class MergedCellStyle {
    static #headerStyle: Style | null = null;
    static #firstRowStyle: Style | null = null;

    #matched: boolean = false;

    public getMatched(): boolean {
        return this.#matched;
    }

    public getMergedStyle(
        worksheet: Worksheet,
        coordinate: string,
        tableFormats: boolean = true,
        conditionals: boolean = true,
        builtInTableStyles: boolean | null = null,
    ): Style {
        const resolvedBuiltInTableStyles = builtInTableStyles ?? tableFormats;
        this.#matched = false;

        const styleMerger = new StyleMerger(worksheet.getStyle(coordinate));

        if (tableFormats) {
            this.assessTables(worksheet, coordinate, styleMerger);
        }
        if (resolvedBuiltInTableStyles) {
            this.assessBuiltinTables(worksheet, coordinate, styleMerger);
        }
        if (conditionals) {
            this.assessConditionals(worksheet, coordinate, styleMerger);
        }

        return styleMerger.getStyle();
    }

    protected assessTables(worksheet: Worksheet, coordinate: string, styleMerger: StyleMerger): void {
        const tables = worksheet.getTablesWithStylesForCell(worksheet.getCell(coordinate));
        for (const table of tables) {
            const dxfsTableStyle = table.getStyle().getTableDxfsStyle();
            if (dxfsTableStyle === null) {
                continue;
            }

            const tableRow = table.getRowNumber(coordinate);
            if (tableRow === 0 && dxfsTableStyle.getHeaderRowStyle() !== null) {
                styleMerger.mergeStyle(dxfsTableStyle.getHeaderRowStyle()!);
                this.#matched = true;
            } else if (tableRow % 2 === 1 && dxfsTableStyle.getFirstRowStripeStyle() !== null) {
                styleMerger.mergeStyle(dxfsTableStyle.getFirstRowStripeStyle()!);
                this.#matched = true;
            } else if (tableRow % 2 === 0 && dxfsTableStyle.getSecondRowStripeStyle() !== null) {
                styleMerger.mergeStyle(dxfsTableStyle.getSecondRowStripeStyle()!);
                this.#matched = true;
            }
        }
    }

    protected assessBuiltinTables(worksheet: Worksheet, coordinate: string, styleMerger: StyleMerger): void {
        if (MergedCellStyle.#headerStyle === null) {
            MergedCellStyle.#headerStyle = new Style();
            MergedCellStyle.#headerStyle.getFill().setFillType(Fill.FILL_SOLID);
            MergedCellStyle.#headerStyle.getFill().getEndColor().setARGB('FF000000');
            MergedCellStyle.#headerStyle.getFill().getStartColor().setARGB('FF000000');
            MergedCellStyle.#headerStyle.getFont().getColor().setRGB('FFFFFF');
        }
        if (MergedCellStyle.#firstRowStyle === null) {
            MergedCellStyle.#firstRowStyle = new Style();
            MergedCellStyle.#firstRowStyle.getFill().setFillType(Fill.FILL_SOLID);
            MergedCellStyle.#firstRowStyle.getFill().getEndColor().setARGB('FFD9D9D9');
            MergedCellStyle.#firstRowStyle.getFill().getStartColor().setARGB('FFD9D9D9');
        }

        const tables = worksheet.getTablesWithoutStylesForCell(worksheet.getCell(coordinate));
        for (const table of tables) {
            const tableRow = table.getRowNumber(coordinate);
            if (tableRow === 0 && table.getShowHeaderRow()) {
                styleMerger.mergeStyle(MergedCellStyle.#headerStyle);
                this.#matched = true;
            } else if (tableRow % 2 === 1) {
                styleMerger.mergeStyle(MergedCellStyle.#firstRowStyle);
                this.#matched = true;
            }
        }
    }

    protected assessConditionals(worksheet: Worksheet, coordinate: string, styleMerger: StyleMerger): void {
        const conditionalRange = worksheet.getConditionalRange(coordinate) ?? coordinate;
        const assessor = new CellStyleAssessor(worksheet.getCell(coordinate), conditionalRange);
        const matchedStyle = assessor.matchConditionsReturnNullIfNoneMatched(
            worksheet.getConditionalStyles(coordinate),
            worksheet.getCell(coordinate).getCalculatedValueString(),
            true,
        );

        if (matchedStyle !== null) {
            this.#matched = true;
            styleMerger.mergeStyle(matchedStyle);
        }
    }
}
