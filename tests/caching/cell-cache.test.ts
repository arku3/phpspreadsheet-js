import { describe, expect, it } from 'bun:test';
import { MemoryCache } from '../../src/caching/memory-cache';
import { Cell, DataType } from '../../src/core/cell';
import { Spreadsheet } from '../../src/core/spreadsheet';
import { Worksheet } from '../../src/core/worksheet';

describe('CellCache', () => {
    describe('MemoryCache', () => {
        function createCacheWithMockCell(): { cache: MemoryCache; mockCell: Cell } {
            const cache = new MemoryCache();
            const spreadsheet = new Spreadsheet();
            const worksheet = spreadsheet.createSheet().setTitle('Test');
            const mockCell = new Cell(null, DataType.TYPE_STRING, worksheet, 1, 1);
            return { cache, mockCell };
        }

        it('should store and retrieve cells', () => {
            const { cache, mockCell } = createCacheWithMockCell();
            cache.set('A1', mockCell);
            expect(cache.get('A1')).toBe(mockCell);
        });

        it('should return undefined for missing cells', () => {
            const { cache } = createCacheWithMockCell();
            expect(cache.get('A1')).toBeUndefined();
        });

        it('should check if cell exists', () => {
            const { cache, mockCell } = createCacheWithMockCell();
            expect(cache.has('A1')).toBe(false);
            cache.set('A1', mockCell);
            expect(cache.has('A1')).toBe(true);
        });

        it('should delete cells', () => {
            const { cache, mockCell } = createCacheWithMockCell();
            cache.set('A1', mockCell);
            expect(cache.has('A1')).toBe(true);
            cache.delete('A1');
            expect(cache.has('A1')).toBe(false);
        });

        it('should clear all cells', () => {
            const { cache, mockCell } = createCacheWithMockCell();
            cache.set('A1', mockCell);
            cache.set('B2', mockCell);
            expect(cache.size()).toBe(2);
            cache.clear();
            expect(cache.size()).toBe(0);
        });

        it('should return correct size', () => {
            const { cache, mockCell } = createCacheWithMockCell();
            expect(cache.size()).toBe(0);
            cache.set('A1', mockCell);
            expect(cache.size()).toBe(1);
            cache.set('B2', mockCell);
            expect(cache.size()).toBe(2);
        });

        it('should iterate over keys', () => {
            const { cache, mockCell } = createCacheWithMockCell();
            cache.set('A1', mockCell);
            cache.set('B2', mockCell);
            const keys = Array.from(cache.keys());
            expect(keys).toContain('A1');
            expect(keys).toContain('B2');
            expect(keys).toHaveLength(2);
        });

        it('should iterate over values', () => {
            const { cache, mockCell } = createCacheWithMockCell();
            cache.set('A1', mockCell);
            const values = Array.from(cache.values());
            expect(values).toContain(mockCell);
            expect(values).toHaveLength(1);
        });

        it('should support batch get', () => {
            const { cache, mockCell } = createCacheWithMockCell();
            cache.set('A1', mockCell);
            cache.set('B2', mockCell);
            const cells = cache.getBatch(['A1', 'B2', 'C3']);
            expect(cells[0]).toBe(mockCell);
            expect(cells[1]).toBe(mockCell);
            expect(cells[2]).toBeUndefined();
        });

        it('should support batch set', () => {
            const { cache, mockCell } = createCacheWithMockCell();
            cache.setBatch([
                ['A1', mockCell],
                ['B2', mockCell],
            ]);
            expect(cache.size()).toBe(2);
            expect(cache.has('A1')).toBe(true);
            expect(cache.has('B2')).toBe(true);
        });
    });

    describe('CellCollection with caching', () => {
        function createTestWorksheet(): { spreadsheet: Spreadsheet; worksheet: Worksheet } {
            const spreadsheet = new Spreadsheet();
            const worksheet = spreadsheet.createSheet().setTitle('Test');
            return { spreadsheet, worksheet };
        }

        it('should use MemoryCache by default', () => {
            const { worksheet } = createTestWorksheet();
            const cell = worksheet.getCell('A1');
            cell.setValue('test');
            expect(worksheet.getCell('A1').getValue()).toBe('test');
        });

        it('should support setting cache strategy', () => {
            const { worksheet } = createTestWorksheet();
            const customCache = new MemoryCache();
            worksheet.setCacheStrategy(customCache);
            expect(worksheet.getCacheStrategy()).toBe(customCache);
        });

        it('should store cells in custom cache', () => {
            const { worksheet } = createTestWorksheet();
            const customCache = new MemoryCache();
            worksheet.setCacheStrategy(customCache);

            const cell = worksheet.getCell('A1');
            cell.setValue('custom');

            expect(customCache.has('A1')).toBe(true);
            expect(customCache.get('A1')?.getValue()).toBe('custom');
        });
    });

    describe('Backward compatibility', () => {
        it('should work with existing code without changes', () => {
            const spreadsheet = new Spreadsheet();
            const worksheet = spreadsheet.createSheet().setTitle('Test');

            // Existing API usage
            const cellA1 = worksheet.getCell('A1');
            cellA1.setValue(100);

            const cellB2 = worksheet.getCell('B2');
            cellB2.setValue('Hello');

            expect(worksheet.getCell('A1').getValue()).toBe(100);
            expect(worksheet.getCell('B2').getValue()).toBe('Hello');
        });

        it('should maintain cell references', () => {
            const spreadsheet = new Spreadsheet();
            const worksheet = spreadsheet.createSheet().setTitle('Test');

            const cell = worksheet.getCell('A1');
            cell.setValue(1);

            // Same reference should be returned
            const sameCell = worksheet.getCell('A1');
            expect(sameCell).toBe(cell);
        });
    });
});
