import { describe, expect, test } from 'bun:test';
import { Spreadsheet } from '../../../src/core/spreadsheet.ts';
import { XlsxWriter } from '../../../src/io/xlsx-writer.ts';
import { Worksheet } from '../../../src/io/xlsx/worksheet.ts';
import { Color } from '../../../src/style/color.ts';
import { ConditionalColorScale } from '../../../src/style/conditional-formatting/conditional-color-scale.ts';
import { ConditionalDataBarExtension } from '../../../src/style/conditional-formatting/conditional-data-bar-extension.ts';
import { ConditionalDataBar } from '../../../src/style/conditional-formatting/conditional-data-bar.ts';
import { ConditionalFormatValueObject } from '../../../src/style/conditional-formatting/conditional-format-value-object.ts';
import { ConditionalFormattingRuleExtension } from '../../../src/style/conditional-formatting/conditional-formatting-rule-extension.ts';
import { ConditionalIconSet } from '../../../src/style/conditional-formatting/conditional-icon-set.ts';
import { IconSetValues } from '../../../src/style/conditional-formatting/icon-set-values.ts';
import { Conditional } from '../../../src/style/conditional.ts';

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

    test('writeWorksheet with DataBar extension extLst', () => {
        const spreadsheet = new Spreadsheet();
        const sheet = spreadsheet.getActiveSheet();

        const conditional = new Conditional();
        conditional.setConditionType(Conditional.CONDITION_DATABAR);

        const extension = new ConditionalFormattingRuleExtension('{00000000-0000-4000-8000-000000000001}');
        extension.setSqref('A1:A10');
        extension.setDataBarExt(
            new ConditionalDataBarExtension()
                .setMinLength(10)
                .setMaxLength(90)
                .setBorder(true)
                .setGradient(false)
                .setDirection('rightToLeft')
                .setAxisPosition('middle')
                .setNegativeBarBorderColorSameAsPositive(true)
                .setMinimumConditionalFormatValueObject(new ConditionalFormatValueObject('formula', null, 'A1'))
                .setMaximumConditionalFormatValueObject(new ConditionalFormatValueObject('formula', null, 'A10'))
                .setBorderColor('FF112233')
                .setNegativeFillColor('FF445566')
                .setNegativeBorderColor('FF778899')
                .setAxisColor('FFABCDEF'),
        );

        const dataBar = new ConditionalDataBar();
        dataBar.setShowValue(false);
        dataBar.setColor('FF0000FF');
        dataBar.setMinimumConditionalFormatValueObject(new ConditionalFormatValueObject('formula', null, 'A1'));
        dataBar.setMaximumConditionalFormatValueObject(new ConditionalFormatValueObject('formula', null, 'A10'));
        dataBar.setConditionalFormattingRuleExt(extension);
        conditional.setDataBar(dataBar);

        sheet.setConditionalStyles('A1:A10', [conditional]);

        const writer = new XlsxWriter(spreadsheet);
        const worksheetWriter = new Worksheet(writer);
        writer.createStyleDictionaries();

        const xml = worksheetWriter.writeWorksheet(sheet, []);

        expect(xml).toContain('<ext uri="{B025F937-C7B1-47D3-B67F-A62EFF666E3E}">');
        expect(xml).toContain('<x14:id>{00000000-0000-4000-8000-000000000001}</x14:id>');
        expect(xml).toContain('<x14:conditionalFormatting>');
        expect(xml).toContain('<xm:sqref>A1:A10</xm:sqref>');
        expect(xml).toContain('<x14:cfRule type="dataBar" id="{00000000-0000-4000-8000-000000000001}">');
        expect(xml).toContain(
            '<x14:dataBar minLength="10" maxLength="90" direction="rightToLeft" axisPosition="middle" border="1" gradient="0" negativeBarBorderColorSameAsPositive="1">',
        );
        expect(xml).toContain('<x14:cfvo type="formula">');
        expect(xml).toContain('<xm:f>A1</xm:f>');
        expect(xml).toContain('<xm:f>A10</xm:f>');
        expect(xml).toContain('<x14:borderColor rgb="FF112233"/>');
        expect(xml).toContain('<x14:negativeFillColor rgb="FF445566"/>');
        expect(xml).toContain('<x14:negativeBorderColor rgb="FF778899"/>');
        expect(xml).toContain('<x14:axisColor rgb="FFABCDEF"/>');
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
        iconSet.setCfvos([
            new ConditionalFormatValueObject('percent', 0),
            new ConditionalFormatValueObject('percent', 33),
            new ConditionalFormatValueObject('percent', 67),
        ]);
        conditional.setIconSet(iconSet);

        sheet.setConditionalStyles('C1:C10', [conditional]);

        const writer = new XlsxWriter(spreadsheet);
        const worksheetWriter = new Worksheet(writer);
        writer.createStyleDictionaries();

        const xml = worksheetWriter.writeWorksheet(sheet, []);

        expect(xml).toContain('<conditionalFormatting sqref="C1:C10">');
        expect(xml).toContain('<cfRule type="iconSet"');
        // xmlbuilder2 self-closes empty elements; accept either form.
        expect(xml).toMatch(/<iconSet iconSet="3Arrows"(?:\/>|>)/);
        expect(xml).toContain('<cfvo type="percent" val="0"/>');
        expect(xml).toContain('<cfvo type="percent" val="33"/>');
        expect(xml).toContain('<cfvo type="percent" val="67"/>');
    });

    test('writeWorksheet with custom IconSet attributes and explicit gte values', () => {
        const spreadsheet = new Spreadsheet();
        const sheet = spreadsheet.getActiveSheet();

        const conditional = new Conditional();
        conditional.setConditionType(Conditional.CONDITION_ICONSET);

        const iconSet = new ConditionalIconSet();
        iconSet.setIconSetType(IconSetValues.ThreeArrows);
        iconSet.setReverse(true);
        iconSet.setShowValue(false);
        iconSet.setCustom(true);
        iconSet.setCfvos([
            new ConditionalFormatValueObject('percent', 0).setGreaterThanOrEqual(true),
            new ConditionalFormatValueObject('num', 10).setGreaterThanOrEqual(false),
            new ConditionalFormatValueObject('percentile', 90).setGreaterThanOrEqual(true),
        ]);
        conditional.setIconSet(iconSet);

        sheet.setConditionalStyles('C1:C10', [conditional]);

        const writer = new XlsxWriter(spreadsheet);
        const worksheetWriter = new Worksheet(writer);
        writer.createStyleDictionaries();

        const xml = worksheetWriter.writeWorksheet(sheet, []);

        expect(xml).toContain('<iconSet iconSet="3Arrows" reverse="1" showValue="0" custom="1">');
        expect(xml).toContain('<cfvo type="percent" val="0" gte="1"/>');
        expect(xml).toContain('<cfvo type="num" val="10" gte="0"/>');
        expect(xml).toContain('<cfvo type="percentile" val="90" gte="1"/>');
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
