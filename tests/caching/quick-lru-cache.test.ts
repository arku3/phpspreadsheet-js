import { describe, expect, it } from 'bun:test';
import { QuickLRUCache } from '../../src/caching/quick-lru-cache';
import { Cell, DataType } from '../../src/core/cell';
import { Spreadsheet } from '../../src/core/spreadsheet';
import { Worksheet } from '../../src/core/worksheet';

describe('QuickLRUCache', () => {
    function createTestCell(): Cell {
        const spreadsheet = new Spreadsheet();
        const worksheet = spreadsheet.createSheet().setTitle('Test');
        return new Cell(null, DataType.TYPE_STRING, worksheet, 1, 1);
    }

    describe('Basic operations', () => {
        it('should store and retrieve cells', () => {
            const cache = new QuickLRUCache({ maxSize: 10 });
            const cell = createTestCell();
            cache.set('A1', cell);
            expect(cache.get('A1')).toBe(cell);
        });

        it('should return undefined for missing cells', () => {
            const cache = new QuickLRUCache({ maxSize: 10 });
            expect(cache.get('A1')).toBeUndefined();
        });

        it('should check if cell exists', () => {
            const cache = new QuickLRUCache({ maxSize: 10 });
            const cell = createTestCell();
            expect(cache.has('A1')).toBe(false);
            cache.set('A1', cell);
            expect(cache.has('A1')).toBe(true);
        });

        it('should delete cells', () => {
            const cache = new QuickLRUCache({ maxSize: 10 });
            const cell = createTestCell();
            cache.set('A1', cell);
            expect(cache.has('A1')).toBe(true);
            cache.delete('A1');
            expect(cache.has('A1')).toBe(false);
        });

        it('should clear all cells', () => {
            const cache = new QuickLRUCache({ maxSize: 10 });
            const cell = createTestCell();
            cache.set('A1', cell);
            cache.set('B2', cell);
            expect(cache.size()).toBe(2);
            cache.clear();
            expect(cache.size()).toBe(0);
        });

        it('should return correct size', () => {
            const cache = new QuickLRUCache({ maxSize: 10 });
            const cell = createTestCell();
            expect(cache.size()).toBe(0);
            cache.set('A1', cell);
            expect(cache.size()).toBe(1);
            cache.set('B2', cell);
            expect(cache.size()).toBe(2);
        });
    });

    describe('LRU eviction behavior (quick-lru specifics)', () => {
        it('should move old entries to secondary storage when maxSize exceeded', () => {
            const cache = new QuickLRUCache({ maxSize: 3 });
            const cell1 = createTestCell();
            const cell2 = createTestCell();
            const cell3 = createTestCell();
            const cell4 = createTestCell();

            cache.set('A1', cell1);
            cache.set('B2', cell2);
            cache.set('C3', cell3);
            expect(cache.size()).toBe(3); // All 3 are "recent"

            // Adding 4th moves oldest to "old" storage
            cache.set('D4', cell4);
            // Size stays at maxSize (3) - only tracks "recent" entries
            expect(cache.size()).toBe(3);
            // But all items are still accessible via has()
            expect(cache.has('A1')).toBe(true);
            expect(cache.has('B2')).toBe(true);
            expect(cache.has('C3')).toBe(true);
            expect(cache.has('D4')).toBe(true);
        });

        it('should promote old entries to recent on access', () => {
            const cache = new QuickLRUCache({ maxSize: 3 });
            const cell1 = createTestCell();
            const cell2 = createTestCell();
            const cell3 = createTestCell();
            const cell4 = createTestCell();

            cache.set('A1', cell1);
            cache.set('B2', cell2);
            cache.set('C3', cell3);
            cache.set('D4', cell4); // A1 is now "old"

            // Access A1 - it should be promoted to "recent"
            const retrieved = cache.get('A1');
            expect(retrieved).toBe(cell1);
            expect(cache.has('A1')).toBe(true);
        });

        it('should maintain size limit', () => {
            const cache = new QuickLRUCache({ maxSize: 3 });

            // Add many cells
            for (let i = 1; i <= 10; i++) {
                cache.set(`A${i}`, createTestCell());
            }

            // Size should never exceed maxSize
            expect(cache.size()).toBeLessThanOrEqual(3);
            // getMaxSize should still be 3
            expect(cache.getMaxSize()).toBe(3);
        });

        it('should call onEviction callback during resize', () => {
            const evicted: string[] = [];
            const cache = new QuickLRUCache({
                maxSize: 5,
                onEviction: (key) => evicted.push(key),
            });

            for (let i = 1; i <= 5; i++) {
                cache.set(`A${i}`, createTestCell());
            }
            expect(cache.size()).toBe(5);

            cache.resize(2);
            expect(cache.size()).toBe(2);
            expect(evicted.length).toBeGreaterThanOrEqual(3);
        });

        it('should resize and evict entries when reducing maxSize', () => {
            const evicted: string[] = [];
            const cache = new QuickLRUCache({
                maxSize: 5,
                onEviction: (key) => evicted.push(key),
            });

            for (let i = 1; i <= 5; i++) {
                cache.set(`A${i}`, createTestCell());
            }
            expect(cache.size()).toBe(5);

            cache.resize(2);
            expect(cache.size()).toBe(2);
            expect(evicted.length).toBeGreaterThanOrEqual(3);
        });
    });

    describe('Batch operations', () => {
        it('should support batch get', () => {
            const cache = new QuickLRUCache({ maxSize: 10 });
            const cell1 = createTestCell();
            const cell2 = createTestCell();

            cache.set('A1', cell1);
            cache.set('B2', cell2);

            const cells = cache.getBatch(['A1', 'B2', 'C3']);
            expect(cells[0]).toBe(cell1);
            expect(cells[1]).toBe(cell2);
            expect(cells[2]).toBeUndefined();
        });

        it('should support batch set', () => {
            const cache = new QuickLRUCache({ maxSize: 10 });
            const cell1 = createTestCell();
            const cell2 = createTestCell();

            cache.setBatch([
                ['A1', cell1],
                ['B2', cell2],
            ]);

            expect(cache.size()).toBe(2);
            expect(cache.has('A1')).toBe(true);
            expect(cache.has('B2')).toBe(true);
        });
    });

    describe('Validation', () => {
        it('should throw error for invalid maxSize', () => {
            expect(() => new QuickLRUCache({ maxSize: 0 })).toThrow('maxSize must be greater than 0');
            expect(() => new QuickLRUCache({ maxSize: -1 })).toThrow('maxSize must be greater than 0');
        });

        it('should throw error for invalid resize', () => {
            const cache = new QuickLRUCache({ maxSize: 10 });
            expect(() => cache.resize(0)).toThrow('maxSize must be greater than 0');
            expect(() => cache.resize(-5)).toThrow('maxSize must be greater than 0');
        });
    });

    describe('Integration with Worksheet', () => {
        it('should work as cache strategy for worksheet', () => {
            const spreadsheet = new Spreadsheet();
            const worksheet = spreadsheet.createSheet().setTitle('Test');
            const cache = new QuickLRUCache({ maxSize: 100 });

            worksheet.setCacheStrategy(cache);
            expect(worksheet.getCacheStrategy()).toBe(cache);

            const cell = worksheet.getCell('A1');
            cell.setValue('test value');

            expect(cache.has('A1')).toBe(true);
            expect(cache.get('A1')?.getValue()).toBe('test value');
        });

        it('should maintain cell access through cache', () => {
            const spreadsheet = new Spreadsheet();
            const worksheet = spreadsheet.createSheet().setTitle('Test');
            const cache = new QuickLRUCache({ maxSize: 100 });

            worksheet.setCacheStrategy(cache);

            const cell = worksheet.getCell('A1');
            cell.setValue(42);

            // Accessing through worksheet should return same cell
            const sameCell = worksheet.getCell('A1');
            expect(sameCell).toBe(cell);
            expect(sameCell.getValue()).toBe(42);
        });

        it('should handle eviction in worksheet context', () => {
            const spreadsheet = new Spreadsheet();
            const worksheet = spreadsheet.createSheet().setTitle('Test');
            const cache = new QuickLRUCache({ maxSize: 3 });

            worksheet.setCacheStrategy(cache);

            // Add cells beyond capacity
            worksheet.getCell('A1').setValue(1);
            worksheet.getCell('B2').setValue(2);
            worksheet.getCell('C3').setValue(3);
            worksheet.getCell('D4').setValue(4); // A1 moves to "old"
            worksheet.getCell('E5').setValue(5); // B2 moves to "old"
            worksheet.getCell('F6').setValue(6); // C3 moves to "old"

            // Some cells may have been evicted
            expect(cache.size()).toBeLessThanOrEqual(3);
        });
    });

    describe('Iterators', () => {
        it('should iterate over keys', () => {
            const cache = new QuickLRUCache({ maxSize: 10 });
            const cell = createTestCell();

            cache.set('A1', cell);
            cache.set('B2', cell);

            const keys = Array.from(cache.keys());
            expect(keys).toContain('A1');
            expect(keys).toContain('B2');
            expect(keys).toHaveLength(2);
        });

        it('should iterate over values', () => {
            const cache = new QuickLRUCache({ maxSize: 10 });
            const cell = createTestCell();

            cache.set('A1', cell);

            const values = Array.from(cache.values());
            expect(values).toContain(cell);
            expect(values).toHaveLength(1);
        });
    });

    describe('Additional quick-lru features', () => {
        it('should support getMaxSize', () => {
            const cache = new QuickLRUCache({ maxSize: 50 });
            expect(cache.getMaxSize()).toBe(50);
        });

        it('should resize up', () => {
            const cache = new QuickLRUCache({ maxSize: 3 });
            cache.set('A1', createTestCell());
            cache.set('B2', createTestCell());

            cache.resize(10);
            expect(cache.getMaxSize()).toBe(10);
            expect(cache.size()).toBe(2);
        });
    });
});
