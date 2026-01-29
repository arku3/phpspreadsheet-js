import { ConditionalFormatValueObject } from './conditional-format-value-object.ts';

/**
 * Conditional Data Bar.
 */
export class ConditionalDataBar {
    #showValue: boolean | null = null;
    #minimumConditionalFormatValueObject: ConditionalFormatValueObject | null = null;
    #maximumConditionalFormatValueObject: ConditionalFormatValueObject | null = null;
    #color: string = '';

    // TODO: support for conditionalFormattingRuleExt

    public getShowValue(): boolean | null {
        return this.#showValue;
    }

    public setShowValue(showValue: boolean): this {
        this.#showValue = showValue;
        return this;
    }

    public getMinimumConditionalFormatValueObject(): ConditionalFormatValueObject | null {
        return this.#minimumConditionalFormatValueObject;
    }

    public setMinimumConditionalFormatValueObject(minimumConditionalFormatValueObject: ConditionalFormatValueObject): this {
        this.#minimumConditionalFormatValueObject = minimumConditionalFormatValueObject;
        return this;
    }

    public getMaximumConditionalFormatValueObject(): ConditionalFormatValueObject | null {
        return this.#maximumConditionalFormatValueObject;
    }

    public setMaximumConditionalFormatValueObject(maximumConditionalFormatValueObject: ConditionalFormatValueObject): this {
        this.#maximumConditionalFormatValueObject = maximumConditionalFormatValueObject;
        return this;
    }

    public getColor(): string {
        return this.#color;
    }

    public setColor(color: string): this {
        this.#color = color;
        return this;
    }
}
