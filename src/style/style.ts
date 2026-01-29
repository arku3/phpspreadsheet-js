/**
 * Cell style.
 */
export class Style {
    #index: number = -1;

    constructor() {
        // Basic initialization
    }

    /**
     * Get index.
     */
    public getIndex(): number {
        return this.#index;
    }

    /**
     * Set index.
     */
    public setIndex(index: number): void {
        this.#index = index;
    }
}
