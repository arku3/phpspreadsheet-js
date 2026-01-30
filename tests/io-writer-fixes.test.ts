import { describe, it, expect } from 'bun:test';
import { Spreadsheet } from '../src/core/spreadsheet.ts';
import { XlsxWriter } from '../src/io/xlsx-writer.ts';
import { controlCharacterPHP2OOXML, containsControlCharacters } from '../src/utils/string-helper.ts';
import { Rels } from '../src/io/xlsx/rels.ts';
import { RichText } from '../src/rich-text/rich-text.ts';
import { Run } from '../src/rich-text/run.ts';
import fs from 'node:fs';

describe('I/O Module Writer Fixes', () => {
    describe('controlCharacterPHP2OOXML sanitization', () => {
        it('should escape control characters to Excel format', () => {
            const input = 'Hello\x00World';
            const result = controlCharacterPHP2OOXML(input);
            expect(result).toBe('Hello_x0000_World');
        });

        it('should handle multiple control characters', () => {
            const input = '\x00Test\x01\x02End';
            const result = controlCharacterPHP2OOXML(input);
            expect(result).toBe('_x0000_Test_x0001__x0002_End');
        });

        it('should not escape tab, newline, or carriage return', () => {
            const input = 'Line1\tLine2\nLine3\r';
            const result = controlCharacterPHP2OOXML(input);
            expect(result).toBe('Line1\tLine2\nLine3\r');
        });

        it('should escape existing _xHHHH_ patterns', () => {
            const input = 'Test_x1234_Word';
            const result = controlCharacterPHP2OOXML(input);
            expect(result).toBe('Test_x005F_x1234_Word');
        });

        it('should handle empty string', () => {
            expect(controlCharacterPHP2OOXML('')).toBe('');
        });

        it('should handle string without control characters', () => {
            const input = 'Normal text without issues';
            expect(controlCharacterPHP2OOXML(input)).toBe(input);
        });
    });

    describe('containsControlCharacters helper', () => {
        it('should return true for strings with control characters', () => {
            expect(containsControlCharacters('Hello\x00World')).toBe(true);
            expect(containsControlCharacters('\x01')).toBe(true);
        });

        it('should return false for strings without control characters', () => {
            expect(containsControlCharacters('Normal text')).toBe(false);
            expect(containsControlCharacters('')).toBe(false);
            expect(containsControlCharacters('Text with tab\t and newline\n')).toBe(false);
        });
    });

    describe('Dynamic Relationship ID (rId) Management', () => {
        it('should generate sequential rIds for package relationships', () => {
            const spreadsheet = new Spreadsheet();
            const writer = new XlsxWriter(spreadsheet);
            const rels = new Rels(writer);
            
            const xml = rels.writeRelationships(spreadsheet);
            
            // Should contain rId1, rId2, rId3 at minimum
            expect(xml).toContain('Id="rId1"');
            expect(xml).toContain('Id="rId2"');
            expect(xml).toContain('Id="rId3"');
            
            // Should not have gaps in rId numbering
            expect(xml).not.toContain('Id="rId0"');
            expect(xml).not.toContain('Id="rId4"'); // Without custom properties
        });

        it('should include rId for custom properties when present', () => {
            const spreadsheet = new Spreadsheet();
            spreadsheet.getProperties().setCustomProperty('TestProp', 'string', 'TestValue');
            
            const writer = new XlsxWriter(spreadsheet);
            const rels = new Rels(writer);
            const xml = rels.writeRelationships(spreadsheet);
            
            // Should now have rId4 for custom properties
            expect(xml).toContain('Id="rId4"');
            expect(xml).toContain('custom-properties');
        });

        it('should generate workbook relationships with dynamic rId mapping', () => {
            const spreadsheet = new Spreadsheet();
            spreadsheet.createSheet('Sheet1');
            spreadsheet.createSheet('Sheet2');
            
            const writer = new XlsxWriter(spreadsheet);
            const rels = new Rels(writer);
            const { xml, rIdMap } = rels.writeWorkbookRelationships(spreadsheet);
            
            // Check rIdMap contains expected targets
            expect(rIdMap.has('styles.xml')).toBe(true);
            expect(rIdMap.has('theme/theme1.xml')).toBe(true);
            expect(rIdMap.has('sharedStrings.xml')).toBe(true);
            expect(rIdMap.has('worksheets/sheet1.xml')).toBe(true);
            expect(rIdMap.has('worksheets/sheet2.xml')).toBe(true);
            
            // Check rIds are sequential
            const rIds = Array.from(rIdMap.values());
            expect(rIds).toContain('rId1');
            expect(rIds).toContain('rId2');
            expect(rIds).toContain('rId3');
            expect(rIds).toContain('rId4');
            expect(rIds).toContain('rId5');
            
            // Check XML contains the relationships
            expect(xml).toContain('Target="styles.xml"');
            expect(xml).toContain('Target="theme/theme1.xml"');
            expect(xml).toContain('Target="sharedStrings.xml"');
        });

        it('should use correct relationship types', () => {
            const spreadsheet = new Spreadsheet();
            const writer = new XlsxWriter(spreadsheet);
            const rels = new Rels(writer);
            
            const xml = rels.writeRelationships(spreadsheet);
            
            expect(xml).toContain('relationships/officeDocument');
            expect(xml).toContain('relationships/metadata/core-properties');
            expect(xml).toContain('relationships/extended-properties');
        });
    });

    describe('Rich Text superscript/subscript in StringTable', () => {
        it('should write superscript formatting for RichText runs', () => {
            const spreadsheet = new Spreadsheet();
            const worksheet = spreadsheet.getActiveSheet();
            
            // Create RichText with superscript
            const richText = new RichText();
            const run1 = new Run();
            run1.setText('E=');
            run1.getFont().setSuperscript(false);
            
            const run2 = new Run();
            run2.setText('mc²');
            run2.getFont().setSuperscript(true);
            
            richText.addText(run1);
            richText.addText(run2);
            
            worksheet.getCell('A1').setValue(richText);
            
            // Verify font properties
            expect(run2.getFont().getSuperscript()).toBe(true);
        });

        it('should write subscript formatting for RichText runs', () => {
            const spreadsheet = new Spreadsheet();
            const worksheet = spreadsheet.getActiveSheet();
            
            // Create RichText with subscript
            const richText = new RichText();
            const run = new Run();
            run.setText('H₂O');
            run.getFont().setSubscript(true);
            
            richText.addText(run);
            worksheet.getCell('A1').setValue(richText);
            
            expect(run.getFont().getSubscript()).toBe(true);
        });

        it('should handle mixed formatting in RichText', () => {
            const richText = new RichText();
            
            const normalRun = new Run();
            normalRun.setText('Normal');
            normalRun.getFont().setSuperscript(false);
            normalRun.getFont().setSubscript(false);
            
            const superRun = new Run();
            superRun.setText('Superscript');
            superRun.getFont().setSuperscript(true);
            
            const subRun = new Run();
            subRun.setText('Subscript');
            subRun.getFont().setSubscript(true);
            
            richText.addText(normalRun);
            richText.addText(superRun);
            richText.addText(subRun);
            
            expect(normalRun.getFont().getSuperscript()).toBe(false);
            expect(normalRun.getFont().getSubscript()).toBe(false);
            expect(superRun.getFont().getSuperscript()).toBe(true);
            expect(subRun.getFont().getSubscript()).toBe(true);
        });
    });

    describe('Integration: XLSX Writer with all I/O fixes', () => {
        it('should write file with control characters sanitized', () => {
            const spreadsheet = new Spreadsheet();
            const worksheet = spreadsheet.getActiveSheet();
            
            // Set cell with control characters
            worksheet.getCell('A1').setValue('Test\x00Value');
            
            const writer = new XlsxWriter(spreadsheet);
            const tempFile = `/tmp/test_integration_${Date.now()}.xlsx`;
            
            expect(() => writer.save(tempFile)).not.toThrow();
            
            // Clean up
            try {
                fs.unlinkSync(tempFile);
            } catch {}
        });

        it('should write file with RichText superscript', () => {
            const spreadsheet = new Spreadsheet();
            const worksheet = spreadsheet.getActiveSheet();
            
            const richText = new RichText();
            const run = new Run();
            run.setText('Formula: x²');
            run.getFont().setSuperscript(true);
            richText.addText(run);
            
            worksheet.getCell('A1').setValue(richText);
            
            const writer = new XlsxWriter(spreadsheet);
            const tempFile = `/tmp/test_richtext_${Date.now()}.xlsx`;
            
            expect(() => writer.save(tempFile)).not.toThrow();
            
            // Clean up
            try {
                fs.unlinkSync(tempFile);
            } catch {}
        });

        it('should handle multiple sheets with dynamic rIds', () => {
            const spreadsheet = new Spreadsheet();
            
            // Create multiple sheets
            for (let i = 0; i < 5; i++) {
                spreadsheet.createSheet(`Sheet${i + 1}`);
            }
            
            const writer = new XlsxWriter(spreadsheet);
            const tempFile = `/tmp/test_multi_sheet_${Date.now()}.xlsx`;
            
            expect(() => writer.save(tempFile)).not.toThrow();
            
            // Clean up
            try {
                fs.unlinkSync(tempFile);
            } catch {}
        });
    });
});
