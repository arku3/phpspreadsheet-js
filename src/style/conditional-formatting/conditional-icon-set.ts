import { ConditionalFormatValueObject } from './conditional-format-value-object.ts';
import { IconSetValues } from './icon-set-values.ts';

/**
 * Conditional Icon Set.
 */
export class ConditionalIconSet {
    /** The icon set to display. */
    #iconSetType: IconSetValues | null = null;

    /** If true, reverses the default order of the icons in this icon set. */
    #reverse: boolean | null = null;

    /** Indicates whether to show the values of the cells on which this icon set is applied. */
    #showValue: boolean | null = null;

    /**
     * If true, indicates that the icon set is a custom icon set.
     */
    #custom: boolean | null = null;

    /** @var ConditionalFormatValueObject[] */
    #cfvos: ConditionalFormatValueObject[] = [];

    public getIconSetType(): IconSetValues | null {
        return this.#iconSetType;
    }

    public setIconSetType(type: IconSetValues): this {
        this.#iconSetType = type;
        return this;
    }

    public getReverse(): boolean | null {
        return this.#reverse;
    }

    public setReverse(reverse: boolean): this {
        this.#reverse = reverse;
        return this;
    }

    public getShowValue(): boolean | null {
        return this.#showValue;
    }

    public setShowValue(showValue: boolean): this {
        this.#showValue = showValue;
        return this;
    }

    public getCustom(): boolean | null {
        return this.#custom;
    }

    public setCustom(custom: boolean): this {
        this.#custom = custom;
        return this;
    }

    /**
     * Get the conditional format value objects.
     */
    public getCfvos(): ConditionalFormatValueObject[] {
        return this.#cfvos;
    }

    /**
     * Set the conditional format value objects.
     */
    public setCfvos(cfvos: ConditionalFormatValueObject[]): this {
        this.#cfvos = cfvos;
        return this;
    }
}
