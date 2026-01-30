/**
 * Conditional Format Value Object.
 */
export class ConditionalFormatValueObject {
    #type: string;
    #value: string | number | boolean | null;
    #cellFormula: string | null;
    #greaterThanOrEqual: boolean | null = null;

    constructor(
        type: string,
        value: string | number | boolean | null = null,
        cellFormula: string | null = null,
    ) {
        this.#type = type;
        this.#value = value;
        this.#cellFormula = cellFormula;
    }

    public getType(): string {
        return this.#type;
    }

    public setType(type: string): this {
        this.#type = type;
        return this;
    }

    public getValue(): string | number | boolean | null {
        return this.#value;
    }

    public setValue(value: string | number | boolean | null): this {
        this.#value = value;
        return this;
    }

    public getCellFormula(): string | null {
        return this.#cellFormula;
    }

    public setCellFormula(cellFormula: string | null): this {
        this.#cellFormula = cellFormula;
        return this;
    }

    public getGreaterThanOrEqual(): boolean | null {
        return this.#greaterThanOrEqual;
    }

    public setGreaterThanOrEqual(greaterThanOrEqual: boolean | null): this {
        this.#greaterThanOrEqual = greaterThanOrEqual;
        return this;
    }
}
