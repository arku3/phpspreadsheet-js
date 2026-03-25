import { create } from 'xmlbuilder2';
import { Coordinate } from '../../utils/coordinate.ts';
import { Column as AutoFilterColumn } from '../../worksheet/auto-filter/column.ts';
import { Rule as AutoFilterRule } from '../../worksheet/auto-filter/column/rule.ts';
import type { Table as WorksheetTable } from '../../worksheet/table.ts';
import { WriterPart } from './writer-part.ts';

/**
 * Generates table XML parts (xl/tables/table{n}.xml).
 */
export class TablePart extends WriterPart {
    private writeAutoFilterColumn(parent: any, column: AutoFilterColumn, colId: number): void {
        const rules = column.getRules();
        if (rules.length === 0) {
            return;
        }

        const filterColumnEle = parent.ele('filterColumn', { colId: String(colId) });
        const filterType = column.getFilterType();

        if (filterType === AutoFilterColumn.AUTOFILTER_FILTERTYPE_DYNAMICFILTER) {
            const dynamicFilterEle = filterColumnEle.ele('dynamicFilter');
            for (const rule of rules) {
                dynamicFilterEle.att('type', rule.getGrouping());
                const val = column.getAttribute('val');
                if (val !== null) dynamicFilterEle.att('val', String(val));
                const maxVal = column.getAttribute('maxVal');
                if (maxVal !== null) dynamicFilterEle.att('maxVal', String(maxVal));
            }
            return;
        }

        if (filterType === AutoFilterColumn.AUTOFILTER_FILTERTYPE_TOPTENFILTER) {
            const top10Ele = filterColumnEle.ele('top10');
            for (const rule of rules) {
                top10Ele.att(
                    'top',
                    rule.getGrouping() === AutoFilterRule.AUTOFILTER_COLUMN_RULE_TOPTEN_TOP ? '1' : '0',
                );
                top10Ele.att(
                    'percent',
                    rule.getOperator() === AutoFilterRule.AUTOFILTER_COLUMN_RULE_TOPTEN_PERCENT ? '1' : '0',
                );
                top10Ele.att('val', String(rule.getValue()));
            }
            return;
        }

        if (filterType === AutoFilterColumn.AUTOFILTER_FILTERTYPE_CUSTOMFILTER) {
            const customFiltersEle = filterColumnEle.ele('customFilters');
            if (column.getJoin() === AutoFilterColumn.AUTOFILTER_COLUMN_JOIN_AND) {
                customFiltersEle.att('and', '1');
            }
            for (const rule of rules) {
                const customFilterEle = customFiltersEle.ele('customFilter');
                if (rule.getOperator() !== AutoFilterRule.AUTOFILTER_COLUMN_RULE_EQUAL) {
                    customFilterEle.att('operator', rule.getOperator());
                }
                customFilterEle.att('val', String(rule.getValue()));
            }
            return;
        }

        const filtersEle = filterColumnEle.ele('filters');
        for (const rule of rules) {
            if (
                rule.getRuleType() === AutoFilterRule.AUTOFILTER_RULETYPE_FILTER &&
                rule.getOperator() === AutoFilterRule.AUTOFILTER_COLUMN_RULE_EQUAL &&
                rule.getValue() === ''
            ) {
                filtersEle.att('blank', '1');
            } else if (rule.getRuleType() === AutoFilterRule.AUTOFILTER_RULETYPE_FILTER) {
                filtersEle.ele('filter', { val: String(rule.getValue()) });
            } else if (rule.getRuleType() === AutoFilterRule.AUTOFILTER_RULETYPE_DATEGROUP) {
                const dateGroupItemEle = filtersEle.ele('dateGroupItem');
                const value = rule.getValue() as Record<string, string | number>;
                for (const [key, entry] of Object.entries(value)) {
                    dateGroupItemEle.att(key, String(entry));
                }
                dateGroupItemEle.att('dateTimeGrouping', rule.getGrouping());
            }
        }
    }

    /**
     * Write a single table definition.
     *
     * @param table The table model.
     * @param tableRef Global table id (1-based) within the XLSX package.
     */
    public writeTable(table: WorksheetTable, tableRef: number): string {
        const range = table.getRange();
        const xmlName = `Table${tableRef}`;
        const displayName = table.getName() !== '' ? table.getName() : xmlName;

        const root = create({ version: '1.0', encoding: 'UTF-8', standalone: true }).ele('table', {
            xmlns: 'http://schemas.openxmlformats.org/spreadsheetml/2006/main',
            id: String(tableRef),
            name: xmlName,
            displayName,
            ref: range,
            headerRowCount: table.getShowHeader() ? '1' : '0',
            totalsRowCount: table.getShowTotals() ? '1' : '0',
        });

        const [[startCol, startRow], [endCol]] = Coordinate.rangeBoundaries(range);
        const columnCount = Math.max(1, endCol - startCol + 1);

        // AutoFilter: PhpSpreadsheet writes this when header row is shown and filtering is enabled.
        if (table.getShowHeader() && table.getAllowFilter()) {
            const autoFilterEle = root.ele('autoFilter', { ref: range });

            for (let offset = 0; offset < columnCount; offset++) {
                const column = table.getColumnByOffset(offset);
                if (!column.getShowFilterButton()) {
                    autoFilterEle.ele('filterColumn', {
                        colId: String(offset),
                        hiddenButton: '1',
                    });
                    continue;
                }

                this.writeAutoFilterColumn(autoFilterEle, table.getAutoFilter().getColumnByOffset(offset), offset);
            }
        }

        // Table Columns
        const tableColumns = root.ele('tableColumns', { count: String(columnCount) });
        const worksheet = table.getWorksheet();
        const cells = worksheet?.getCellCollection();

        for (let offset = 0; offset < columnCount; offset++) {
            const colIndex = startCol + offset;
            let name = `Column${offset + 1}`;
            if (table.getShowHeader() && cells) {
                const coord = `${Coordinate.stringFromColumnIndex(colIndex)}${startRow}`;
                const cell = cells.get(coord);
                const value = cell?.getValue();
                if (value !== null && value !== undefined && String(value) !== '') {
                    name = String(value);
                }
            }

            const column = table.getColumnByOffset(offset);
            const attrs: Record<string, string> = {
                id: String(offset + 1),
                name,
            };
            if (table.getShowTotals() && column.getTotalsRowLabel()) {
                attrs.totalsRowLabel = column.getTotalsRowLabel() ?? '';
            }
            if (table.getShowTotals() && column.getTotalsRowFunction()) {
                attrs.totalsRowFunction = column.getTotalsRowFunction() ?? '';
            }
            const tableColumn = tableColumns.ele('tableColumn', attrs);
            if (column.getColumnFormula()) {
                tableColumn.ele('calculatedColumnFormula').txt(column.getColumnFormula() ?? '');
            }
        }

        // Table Style
        const style = table.getStyle();
        root.ele('tableStyleInfo', {
            name: style.getTheme(),
            showFirstColumn: style.getShowFirstColumn() ? '1' : '0',
            showLastColumn: style.getShowLastColumn() ? '1' : '0',
            showRowStripes: style.getShowRowStripes() ? '1' : '0',
            showColumnStripes: style.getShowColumnStripes() ? '1' : '0',
        });

        return root.end({ prettyPrint: true });
    }
}
