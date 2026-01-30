import { describe, it, expect } from 'bun:test';
import { Spreadsheet } from '../src/core/spreadsheet.ts';
import { Worksheet } from '../src/core/worksheet.ts';
import { Font } from '../src/style/font.ts';
import { Alignment } from '../src/style/alignment.ts';
import { Color } from '../src/style/color.ts';
import { NumberFormat } from '../src/style/number-format.ts';

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
                strikeType: 'single'
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

        it('should format percentage', () => {
            const format = makeFormat('0.00%');
            
            expect(format.toFormattedString(0.1234)).toBe('12.34%');
        });

        it('should format Excel date serial number', () => {
            const format = makeFormat('yyyy-mm-dd');
            
            // Excel date serial number for 2024-01-15
            expect(format.toFormattedString(45306)).toContain('2024');
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
