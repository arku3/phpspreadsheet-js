import { afterEach, describe, expect, it } from 'bun:test';
import { Spreadsheet } from '../src/core/spreadsheet.ts';
import { Worksheet } from '../src/core/worksheet.ts';
import { Alignment } from '../src/style/alignment.ts';
import { Color } from '../src/style/color.ts';
import { Font } from '../src/style/font.ts';
import { NumberFormat } from '../src/style/number-format.ts';
import { setDecimalSeparator, setThousandsSeparator } from '../src/utils/string-helper.ts';

afterEach(() => {
    setDecimalSeparator('.');
    setThousandsSeparator(',');
});

describe('Style Module Parity Fixes', () => {
    describe('Font Chart Properties', () => {
        it('should get and set cap property', () => {
            const font = new Font();

            expect(font.getCap()).toBe(Font.CAP_NONE);

            font.setCap(Font.CAP_ALL);
            expect(font.getCap()).toBe(Font.CAP_ALL);

            font.setCap(Font.CAP_SMALL);
            expect(font.getCap()).toBe(Font.CAP_SMALL);
        });

        it('should get and set latin property', () => {
            const font = new Font();

            font.setLatin('Times New Roman');
            expect(font.getLatin()).toBe('Times New Roman');
        });

        it('should get and set eastAsian property', () => {
            const font = new Font();

            font.setEastAsian('MS Mincho');
            expect(font.getEastAsian()).toBe('MS Mincho');
        });

        it('should get and set complexScript property', () => {
            const font = new Font();

            font.setComplexScript('Tahoma');
            expect(font.getComplexScript()).toBe('Tahoma');
        });

        it('should get and set baseLine property', () => {
            const font = new Font();

            font.setBaseLine(100);
            expect(font.getBaseLine()).toBe(100);
        });

        it('should get and set strikeType property', () => {
            const font = new Font();

            font.setStrikeType('double');
            expect(font.getStrikeType()).toBe('double');
        });

        it('should apply chart properties from array', () => {
            const font = new Font();

            font.applyFromArray({
                cap: Font.CAP_ALL,
                latin: 'Arial',
                eastAsian: 'SimSun',
                complexScript: 'Times New Roman',
                baseLine: 50,
                strikeType: 'single',
            });

            expect(font.getCap()).toBe(Font.CAP_ALL);
            expect(font.getLatin()).toBe('Arial');
            expect(font.getEastAsian()).toBe('SimSun');
            expect(font.getComplexScript()).toBe('Times New Roman');
            expect(font.getBaseLine()).toBe(50);
            expect(font.getStrikeType()).toBe('single');
        });
    });

    describe('Alignment Rotation Validation', () => {
        it('should accept valid rotation values between -90 and 90', () => {
            const alignment = new Alignment();

            alignment.setTextRotation(-90);
            expect(alignment.getTextRotation()).toBe(-90);

            alignment.setTextRotation(0);
            expect(alignment.getTextRotation()).toBe(0);

            alignment.setTextRotation(45);
            expect(alignment.getTextRotation()).toBe(45);

            alignment.setTextRotation(90);
            expect(alignment.getTextRotation()).toBe(90);
        });

        it('should accept rotation value of 255 for vertical (stacked) text', () => {
            const alignment = new Alignment();

            alignment.setTextRotation(255);
            expect(alignment.getTextRotation()).toBe(-165);
        });

        it('should throw error for rotation values outside valid range', () => {
            const alignment = new Alignment();

            expect(() => alignment.setTextRotation(-91)).toThrow();
            expect(() => alignment.setTextRotation(91)).toThrow();
            expect(() => alignment.setTextRotation(180)).toThrow();
        });
    });

    describe('Color hasChanged Tracking', () => {
        it('should track hasChanged flag', () => {
            const color = new Color(Color.COLOR_BLACK);

            expect(color.getHasChanged()).toBe(false);

            color.setHasChanged(true);
            expect(color.getHasChanged()).toBe(true);

            color.setHasChanged(false);
            expect(color.getHasChanged()).toBe(false);
        });

        it('should apply hasChanged from array', () => {
            const color = new Color(Color.COLOR_BLACK);

            color.applyFromArray({ hasChanged: true });
            expect(color.getHasChanged()).toBe(true);
        });
    });

    describe('Color setHyperlinkTheme', () => {
        it('should set hyperlink theme color', () => {
            const color = new Color(Color.COLOR_BLACK);

            const result = color.setHyperlinkTheme();

            expect(result).toBe(color); // Chainable
            expect(color.getARGB()).toBe('FF0563C1'); // Standard link blue
            expect(color.getTheme()).toBe(10); // Hyperlink theme index
        });
    });

    describe('NumberFormat toFormattedString', () => {
        const makeFormat = (formatCode: string): NumberFormat => {
            const format = new NumberFormat();
            format.setFormatCode(formatCode);
            return format;
        };

        it('should format number with General format', () => {
            const format = makeFormat(NumberFormat.FORMAT_GENERAL);

            expect(format.toFormattedString(123)).toBe('123');
            expect(format.toFormattedString(123.456)).toBe('123.456');
        });

        it('should format number with fixed decimals', () => {
            const format = makeFormat('0.00');

            expect(format.toFormattedString(123.456)).toBe('123.46');
            expect(format.toFormattedString(123)).toBe('123.00');
        });

        it('should format number with thousands separator', () => {
            const format = makeFormat('#,##0');

            expect(format.toFormattedString(1234567)).toBe('1,234,567');
        });

        it('should format currency', () => {
            const format = makeFormat('$#,##0.00');

            expect(format.toFormattedString(1234.5)).toBe('$1,234.50');
            expect(format.toFormattedString(-1234.5)).toBe('-$1,234.50');
        });

        it('should preserve currency tokens in numeric formats', () => {
            expect(makeFormat('[$USD-409]#,##0.00').toFormattedString(1234.5)).toBe('USD1,234.50');
            expect(makeFormat('[$EUR]#,##0.00').toFormattedString(1234.5)).toBe('EUR1,234.50');
            expect(makeFormat('[$€]#,##0.00').toFormattedString(1234.5)).toBe('€1,234.50');
        });

        it('should format percentage', () => {
            const format = makeFormat('0.00%');

            expect(format.toFormattedString(0.1234)).toBe('12.34%');
        });

        it('should format Excel date serial number', () => {
            const format = makeFormat('yyyy-mm-dd');

            // Excel date serial number for 2024-01-15
            expect(format.toFormattedString(45306)).toBe('2024-01-15');
        });

        it('should format Excel time fraction', () => {
            const format = makeFormat('h:mm:ss');

            // 0.5 = 12:00:00 noon
            expect(format.toFormattedString(0.5)).toBe('12:00:00');
        });

        it('should handle null and undefined values', () => {
            const format = makeFormat(NumberFormat.FORMAT_GENERAL);

            expect(format.toFormattedString(null)).toBe('');
            expect(format.toFormattedString(undefined)).toBe('');
        });

        it('should handle non-numeric strings', () => {
            const format = makeFormat(NumberFormat.FORMAT_GENERAL);

            expect(format.toFormattedString('hello')).toBe('hello');
        });

        it('should map built-in format code index and sync format', () => {
            expect(NumberFormat.builtInFormatCode(3)).toBe('#,##0');
            expect(NumberFormat.builtInFormatCodeIndex('#,##0')).toBe(3);

            const format = new NumberFormat();
            format.setBuiltInFormatCode(4);
            expect(format.getBuiltInFormatCode()).toBe(4);
            expect(format.getFormatCode()).toBe('#,##0.00');
        });

        it('should use PHP built-in date registry values', () => {
            expect(NumberFormat.builtInFormatCode(14)).toBe(NumberFormat.FORMAT_DATE_XLSX14_ACTUAL);
            expect(NumberFormat.builtInFormatCode(22)).toBe(NumberFormat.FORMAT_DATE_XLSX22_ACTUAL);
            expect(NumberFormat.builtInFormatCode(47)).toBe('mm:ss.0');
        });

        it('should use PHP locale built-in registry values', () => {
            expect(NumberFormat.builtInFormatCode(50)).toBe('[$-404]e/m/d');
            expect(NumberFormat.builtInFormatCode(53)).toBe('m"月"d"日"');
            expect(NumberFormat.builtInFormatCode(55)).toBe('yyyy"年"m"月"');
            expect(NumberFormat.builtInFormatCode(59)).toBe('t0');
            expect(NumberFormat.builtInFormatCode(60)).toBe('t0.00');
            expect(NumberFormat.builtInFormatCode(61)).toBe('t#,##0');
            expect(NumberFormat.builtInFormatCode(62)).toBe('t#,##0.00');
            expect(NumberFormat.builtInFormatCode(67)).toBe('t0%');
            expect(NumberFormat.builtInFormatCode(68)).toBe('t0.00%');
            expect(NumberFormat.builtInFormatCode(69)).toBe('t# ?/?');
            expect(NumberFormat.builtInFormatCode(70)).toBe('t# ??/??');
        });

        it('should convert system date/time formats on extended getFormatCode', () => {
            const format = new NumberFormat();

            format.setFormatCode(`${NumberFormat.FORMAT_SYSDATE_F800}dddd, mmmm dd, yyyy`);
            expect(format.getFormatCode(true)).toBe(NumberFormat.getLongDateFormat());

            format.setFormatCode(`${NumberFormat.FORMAT_SYSTIME_F400}h:mm:ss AM/PM`);
            expect(format.getFormatCode(true)).toBe(NumberFormat.getTimeFormat());
        });

        it('should format text with @ placeholder', () => {
            const format = makeFormat('"value: "@');

            expect(format.toFormattedString('hello')).toBe('value: hello');
        });

        it('should select numeric sections by sign', () => {
            const format = makeFormat('0.00;[Red](0.00);"zero"');

            expect(format.toFormattedString(12.3)).toBe('12.30');
            expect(format.toFormattedString(-12.3)).toBe('(12.30)');
            expect(format.toFormattedString(0)).toBe('zero');
        });

        it('should format scaled values with trailing commas', () => {
            const format = makeFormat('0.0,');

            expect(format.toFormattedString(12345)).toBe('12.3');
        });

        it('should format fractional values', () => {
            const format = makeFormat('# ?/?');

            expect(format.toFormattedString(1.25)).toBe('1 1/4');
        });

        it('should format improper fractions without integer placeholder', () => {
            const format = makeFormat('?/?');

            expect(format.toFormattedString(1.25)).toBe('5/4');
        });

        it('should format scientific values', () => {
            const format = makeFormat('0.00E+00');

            expect(format.toFormattedString(1234)).toBe('1.23E+3');
        });

        it('should preserve quoted literals in numeric formats', () => {
            const format = makeFormat('0.00" kg"');

            expect(format.toFormattedString(12.3)).toBe('12.30 kg');
        });

        it('should support complex numeric masks with embedded separators', () => {
            expect(makeFormat('000-000').toFormattedString(123456)).toBe('123-456');
            expect(makeFormat('00-000').toFormattedString(123)).toBe('00-123');
            expect(makeFormat('000-00-0000-0').toFormattedString(20100357)).toBe('002-01-0035-7');
            expect(makeFormat('000-00-00.00-0').toFormattedString(20100.357)).toBe('002-01-00.35-7');
            expect(makeFormat('000\.00\.00\.00\.00').toFormattedString(20100.357)).toBe('002.01.00.35.70');
            expect(makeFormat('000 0.0').toFormattedString(97.15)).toBe('009 7.2');
            expect(makeFormat('000 0.0').toFormattedString(97.13)).toBe('009 7.1');
            expect(makeFormat('0 000.000000').toFormattedString(-2.7e-5)).toBe('-0 000.000027');
            expect(makeFormat('0 000.000000').toFormattedString(-4e-5)).toBe('-0 000.000040');
        });

        it('should preserve ? placeholder spacing in numeric masks', () => {
            expect(makeFormat('??0').toFormattedString(12)).toBe(' 12');
            expect(makeFormat('0.0?').toFormattedString(1.2)).toBe('1.2 ');
        });

        it('should preserve ? placeholder spacing in percentage masks', () => {
            expect(makeFormat('0.0?%').toFormattedString(0.125)).toBe('12.5 %');
        });

        it('should support textual month tokens', () => {
            expect(makeFormat('d-mmm-yy').toFormattedString(45306)).toBe('15-Jan-24');
            expect(makeFormat('mmmm d, yyyy').toFormattedString(45306)).toBe('January 15, 2024');
        });

        it('should treat uppercase date tokens like PHP', () => {
            const format = makeFormat('YYYY-MM-DD');

            expect(format.toFormattedString(45306)).toBe('2024-01-15');
        });

        it('should support padded elapsed time tokens', () => {
            expect(makeFormat('[hh]:mm:ss').toFormattedString(1.5)).toBe('36:00:00');
            expect(makeFormat('[mm]').toFormattedString(0.5)).toBe('720');
        });

        it('should round fractional seconds with carry', () => {
            const format = makeFormat('mm:ss.0');

            expect(format.toFormattedString(59.96 / 86400)).toBe('01:00.0');
        });

        it('should handle early 1900 serial dates like PHP', () => {
            const format = makeFormat('yyyy-mm-dd');

            expect(format.toFormattedString(1)).toBe('1900-01-01');
            expect(format.toFormattedString(59)).toBe('1900-02-28');
        });

        it('should pass section color into callback formatting', () => {
            const value = NumberFormat.toFormattedString(
                12.3,
                '[Red]0.0',
                (formatted, color) => `${color}:${formatted}`,
            );

            expect(value).toBe('Red:12.3');
        });

        it('should map indexed formatter colors through the BIFF8 palette', () => {
            const value = NumberFormat.toFormattedString(
                12.3,
                '[Color 10]0.0',
                (formatted, color) => `${color}:${formatted}`,
            );

            expect(value).toBe('#008000:12.3');
        });

        it('should support lessFloatPrecision for general format', () => {
            const formatted = NumberFormat.toFormattedString(1.234567890123, 'General', null, true);

            expect(formatted).toBe('1.23456789');
        });

        it('should adjust locale separators for numeric and percentage formats', () => {
            setDecimalSeparator(',');
            setThousandsSeparator('.');

            expect(makeFormat('#,##0.00').toFormattedString(1234.5)).toBe('1.234,50');
            expect(makeFormat('0.00%').toFormattedString(0.125)).toBe('12,50%');
        });

        it('should adjust locale separators for general and scientific formats', () => {
            setDecimalSeparator(',');
            setThousandsSeparator('.');

            expect(NumberFormat.toFormattedString(1234.5, 'General')).toBe('1234,5');
            expect(makeFormat('0.00E+00').toFormattedString(1234)).toBe('1,23E+3');
        });

        it('should include built-in format code in hash', () => {
            const custom = new NumberFormat();
            custom.setFormatCode('#,##0');

            const builtIn = new NumberFormat();
            builtIn.setBuiltInFormatCode(3);

            expect(custom.getHashCode()).toBe(builtIn.getHashCode());

            builtIn.setBuiltInFormatCode(4);
            expect(custom.getHashCode()).not.toBe(builtIn.getHashCode());
        });
    });

    describe('Integration: Cell.getFormattedValue()', () => {
        it('should return formatted value based on cell style', () => {
            const spreadsheet = new Spreadsheet();
            const worksheet = spreadsheet.getActiveSheet();

            const cell = worksheet.getCell('A1');
            cell.setValue(1234.567);

            // Get style and set number format
            const style = spreadsheet.getCellXfByIndex(cell.getXfIndex());
            style.getNumberFormat().setFormatCode('0.00');

            expect(cell.getFormattedValue()).toBe('1234.57');
        });

        it('should return empty string for null values', () => {
            const spreadsheet = new Spreadsheet();
            const worksheet = spreadsheet.getActiveSheet();

            const cell = worksheet.getCell('A1');
            cell.setValue(null);

            expect(cell.getFormattedValue()).toBe('');
        });
    });
});
