import { expect, test, describe } from 'bun:test';
import { Spreadsheet } from '../../../src/core/spreadsheet.ts';
import { Worksheet } from '../../../src/io/xlsx/worksheet.ts';
import { XlsxWriter } from '../../../src/io/xlsx-writer.ts';
import { Conditional } from '../../../src/style/conditional.ts';
import { ConditionalDataBar } from '../../../src/style/conditional-formatting/conditional-data-bar.ts';
import { ConditionalColorScale } from '../../../src/style/conditional-formatting/conditional-color-scale.ts';
import { ConditionalIconSet } from '../../../src/style/conditional-formatting/conditional-icon-set.ts';
import { IconSetValues } from '../../../src/style/conditional-formatting/icon-set-values.ts';
import { Color } from '../../../src/style/color.ts';

describe('XLSX Worksheet Writer - Conditional Formatting', () => {
    test('writeWorksheet with DataBar', () => {
        const spreadsheet = new Spreadsheet();
        const sheet = spreadsheet.getActiveSheet();
        
        const conditional = new Conditional();
        conditional.setConditionType(Conditional.CONDITION_DATABAR);
        
        const dataBar = new ConditionalDataBar();
        dataBar.setShowValue(false);
        dataBar.setColor('FF0000FF');
        conditional.setDataBar(dataBar);
        
        sheet.setConditionalStyles('A1:A10', [conditional]);
        
        const writer = new XlsxWriter(spreadsheet);
        const worksheetWriter = new Worksheet(writer);
        
        // We need to initialize style dictionaries so dxfId can be looked up (though DataBar doesn't use it)
        writer.createStyleDictionaries();
        
        const xml = worksheetWriter.writeWorksheet(sheet, []);
        
        expect(xml).toContain('<conditionalFormatting sqref="A1:A10">');
        expect(xml).toContain('<cfRule type="dataBar"');
        expect(xml).toContain('<dataBar showValue="0">');
        expect(xml).toContain('<cfvo type="min"/>');
        expect(xml).toContain('<cfvo type="max"/>');
        expect(xml).toContain('<color rgb="FF0000FF"/>');
    });

    test('writeWorksheet with ColorScale', () => {
        const spreadsheet = new Spreadsheet();
        const sheet = spreadsheet.getActiveSheet();
        
        const conditional = new Conditional();
        conditional.setConditionType(Conditional.CONDITION_COLORSCALE);
        
        const colorScale = new ConditionalColorScale();
        colorScale.setMinimumColor(new Color('FFFF0000'));
        colorScale.setMaximumColor(new Color('FF00FF00'));
        conditional.setColorScale(colorScale);
        
        sheet.setConditionalStyles('B1:B10', [conditional]);
        
        const writer = new XlsxWriter(spreadsheet);
        const worksheetWriter = new Worksheet(writer);
        writer.createStyleDictionaries();
        
        const xml = worksheetWriter.writeWorksheet(sheet, []);
        
        expect(xml).toContain('<conditionalFormatting sqref="B1:B10">');
        expect(xml).toContain('<cfRule type="colorScale"');
        expect(xml).toContain('<colorScale>');
        expect(xml).toContain('<cfvo type="min"/>');
        expect(xml).toContain('<cfvo type="max"/>');
        expect(xml).toContain('<color rgb="FFFF0000"/>');
        expect(xml).toContain('<color rgb="FF00FF00"/>');
    });

    test('writeWorksheet with IconSet', () => {
        const spreadsheet = new Spreadsheet();
        const sheet = spreadsheet.getActiveSheet();
        
        const conditional = new Conditional();
        conditional.setConditionType(Conditional.CONDITION_ICONSET);
        
        const iconSet = new ConditionalIconSet();
        iconSet.setIconSetType(IconSetValues.ThreeArrows);
        conditional.setIconSet(iconSet);
        
        sheet.setConditionalStyles('C1:C10', [conditional]);
        
        const writer = new XlsxWriter(spreadsheet);
        const worksheetWriter = new Worksheet(writer);
        writer.createStyleDictionaries();
        
        const xml = worksheetWriter.writeWorksheet(sheet, []);
        
        expect(xml).toContain('<conditionalFormatting sqref="C1:C10">');
        expect(xml).toContain('<cfRule type="iconSet"');
        expect(xml).toContain('<iconSet iconSet="3Arrows">');
        expect(xml).toContain('<cfvo type="percent" val="0"/>');
        expect(xml).toContain('<cfvo type="percent" val="33"/>');
        expect(xml).toContain('<cfvo type="percent" val="67"/>');
    });

    test('writeWorksheet with Text Condition', () => {
        const spreadsheet = new Spreadsheet();
        const sheet = spreadsheet.getActiveSheet();
        
        const conditional = new Conditional();
        conditional.setConditionType(Conditional.CONDITION_CONTAINSTEXT);
        conditional.setOperatorType(Conditional.OPERATOR_CONTAINSTEXT);
        conditional.setText('test');
        
        sheet.setConditionalStyles('D1', [conditional]);
        
        const writer = new XlsxWriter(spreadsheet);
        const worksheetWriter = new Worksheet(writer);
        writer.createStyleDictionaries();
        
        const xml = worksheetWriter.writeWorksheet(sheet, []);
        
        expect(xml).toContain('<conditionalFormatting sqref="D1">');
        expect(xml).toContain('<cfRule type="containsText"');
        expect(xml).toContain('operator="containsText"');
        expect(xml).toContain('text="test"');
        expect(xml).toContain('<formula>NOT(ISERROR(SEARCH("test",D1)))</formula>');
    });
});
