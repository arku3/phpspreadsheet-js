import type { CellCache } from '../caching/cell-cache.ts';
import { CellCollection } from './cell-collection.ts';
import type { Worksheet } from './worksheet.ts';

/**
 * Factory for creating cell collections.
 */
export class CellsFactory {
    /**
     * Create a cell collection instance for a worksheet.
     */
    public static getInstance(worksheet: Worksheet, cache: CellCache | null = null): CellCollection {
        if (cache) {
            return new CellCollection(worksheet, cache);
        }
        return new CellCollection(worksheet);
    }
}
