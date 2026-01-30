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

    /** True if cfvos were auto-generated defaults for the current icon set type. */
    #cfvosAuto: boolean = false;

    #ensureDefaultCfvos(): void {
        if (!this.#iconSetType) return;

        // Most built-in icon set names start with their icon count (e.g. "3Arrows", "4Rating", "5Quarters").
        const match = /^([3-5])/.exec(this.#iconSetType);
        const count = match ? Number(match[1]) : 3;

        const cfvos: ConditionalFormatValueObject[] = [];
        for (let i = 0; i < count; i++) {
            const val = i === 0 ? 0 : Math.round((i * 100) / count);
            cfvos.push(new ConditionalFormatValueObject('percent', val));
        }

        this.#cfvos = cfvos;
        this.#cfvosAuto = true;
    }

    public getIconSetType(): IconSetValues | null {
        return this.#iconSetType;
    }

    public setIconSetType(type: IconSetValues): this {
        this.#iconSetType = type;

        // Excel writes a default set of cfvo thresholds for built-in icon sets.
        // If the user hasn't provided explicit thresholds, populate sensible defaults.
        if (this.#cfvos.length === 0 || this.#cfvosAuto) {
            this.#ensureDefaultCfvos();
        }
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
        if (this.#cfvos.length === 0 && this.#iconSetType) {
            this.#ensureDefaultCfvos();
        }
        return this.#cfvos;
    }

    /**
     * Set the conditional format value objects.
     */
    public setCfvos(cfvos: ConditionalFormatValueObject[]): this {
        this.#cfvos = cfvos;
        this.#cfvosAuto = false;
        return this;
    }
}
