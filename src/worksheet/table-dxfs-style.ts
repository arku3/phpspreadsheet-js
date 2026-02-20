import { Style } from '../style/style.ts';

export class TableDxfsStyle {
    #headerRow: number | null = null;
    #firstRowStripe: number | null = null;
    #secondRowStripe: number | null = null;
    #headerRowStyle: Style | null = null;
    #firstRowStripeStyle: Style | null = null;
    #secondRowStripeStyle: Style | null = null;
    #name: string;

    constructor(name: string) {
        this.#name = name;
    }

    public getName(): string {
        return this.#name;
    }

    public setHeaderRow(row: number): this {
        this.#headerRow = row;
        return this;
    }

    public getHeaderRow(): number | null {
        return this.#headerRow;
    }

    public setFirstRowStripe(row: number): this {
        this.#firstRowStripe = row;
        return this;
    }

    public getFirstRowStripe(): number | null {
        return this.#firstRowStripe;
    }

    public setSecondRowStripe(row: number): this {
        this.#secondRowStripe = row;
        return this;
    }

    public getSecondRowStripe(): number | null {
        return this.#secondRowStripe;
    }

    public setHeaderRowStyle(style: Style): this {
        this.#headerRowStyle = style;
        return this;
    }

    public getHeaderRowStyle(): Style | null {
        return this.#headerRowStyle;
    }

    public setFirstRowStripeStyle(style: Style): this {
        this.#firstRowStripeStyle = style;
        return this;
    }

    public getFirstRowStripeStyle(): Style | null {
        return this.#firstRowStripeStyle;
    }

    public setSecondRowStripeStyle(style: Style): this {
        this.#secondRowStripeStyle = style;
        return this;
    }

    public getSecondRowStripeStyle(): Style | null {
        return this.#secondRowStripeStyle;
    }
}
