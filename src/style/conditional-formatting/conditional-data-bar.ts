import { ConditionalFormatValueObject } from './conditional-format-value-object.ts';
import { ConditionalFormattingRuleExtension } from './conditional-formatting-rule-extension.ts';

/**
 * Conditional Data Bar.
 */
export class ConditionalDataBar {
    #showValue: boolean | null = null;
    #minimumConditionalFormatValueObject: ConditionalFormatValueObject | null = null;
    #maximumConditionalFormatValueObject: ConditionalFormatValueObject | null = null;
    #color: string = '';

    #conditionalFormattingRuleExt: ConditionalFormattingRuleExtension | null = null;

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

    public setMinimumConditionalFormatValueObject(
        minimumConditionalFormatValueObject: ConditionalFormatValueObject,
    ): this {
        this.#minimumConditionalFormatValueObject = minimumConditionalFormatValueObject;
        return this;
    }

    public getMaximumConditionalFormatValueObject(): ConditionalFormatValueObject | null {
        return this.#maximumConditionalFormatValueObject;
    }

    public setMaximumConditionalFormatValueObject(
        maximumConditionalFormatValueObject: ConditionalFormatValueObject,
    ): this {
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

    public getConditionalFormattingRuleExt(): ConditionalFormattingRuleExtension | null {
        return this.#conditionalFormattingRuleExt;
    }

    public setConditionalFormattingRuleExt(
        conditionalFormattingRuleExt: ConditionalFormattingRuleExtension | null,
    ): this {
        this.#conditionalFormattingRuleExt = conditionalFormattingRuleExt;
        return this;
    }

    public clone(): ConditionalDataBar {
        const cloned = new ConditionalDataBar();
        if (this.#showValue !== null) {
            cloned.setShowValue(this.#showValue);
        }
        if (this.#minimumConditionalFormatValueObject) {
            cloned.setMinimumConditionalFormatValueObject(this.#minimumConditionalFormatValueObject.clone());
        }
        if (this.#maximumConditionalFormatValueObject) {
            cloned.setMaximumConditionalFormatValueObject(this.#maximumConditionalFormatValueObject.clone());
        }
        cloned.setColor(this.#color);
        cloned.setConditionalFormattingRuleExt(this.#conditionalFormattingRuleExt?.clone() ?? null);
        return cloned;
    }
}
