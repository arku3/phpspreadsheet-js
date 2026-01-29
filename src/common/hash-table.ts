/**
 * HashTable for managing unique objects.
 */
export class HashTable<T extends { getHashCode(): string }> {
    #items: T[] = [];
    #map: Map<string, number> = new Map();

    /**
     * Add from source.
     */
    public addFromSource(source: T[]): void {
        for (const item of source) {
            this.add(item);
        }
    }

    /**
     * Add item.
     */
    public add(item: T): void {
        const hashCode = item.getHashCode();
        if (!this.#map.has(hashCode)) {
            this.#items.push(item);
            this.#map.set(hashCode, this.#items.length - 1);
        }
    }

    /**
     * Get count.
     */
    public count(): number {
        return this.#items.length;
    }

    /**
     * Get item by index.
     */
    public getByIndex(index: number): T | null {
        return this.#items[index] ?? null;
    }

    /**
     * Get index for hash code.
     */
    public getIndexForHashCode(hashCode: string): number {
        const index = this.#map.get(hashCode);
        if (index === undefined) {
            throw new Error(`Hash code ${hashCode} not found.`);
        }
        return index;
    }

    /**
     * Get all items.
     */
    public getAll(): T[] {
        return [...this.#items];
    }
}
