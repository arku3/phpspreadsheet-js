import { ConditionalDataBarExtension } from './conditional-data-bar-extension.ts';

export class ConditionalFormattingRuleExtension {
    public static readonly CONDITION_EXTENSION_DATABAR = 'dataBar';

    #id: string;
    #cfRule: string;
    #dataBar: ConditionalDataBarExtension | null = null;
    #sqref: string = '';

    constructor(
        id: string | null = null,
        cfRule: string = ConditionalFormattingRuleExtension.CONDITION_EXTENSION_DATABAR,
    ) {
        this.#id = id ?? this.generateUuid();
        this.#cfRule = cfRule;
    }

    private generateUuid(): string {
        return `{${crypto.randomUUID()}}`;
    }

    public getId(): string {
        return this.#id;
    }
    public setId(id: string): this {
        this.#id = id;
        return this;
    }
    public getCfRule(): string {
        return this.#cfRule;
    }
    public setCfRule(cfRule: string): this {
        this.#cfRule = cfRule;
        return this;
    }
    public getDataBarExt(): ConditionalDataBarExtension | null {
        return this.#dataBar;
    }
    public setDataBarExt(dataBar: ConditionalDataBarExtension): this {
        this.#dataBar = dataBar;
        return this;
    }
    public getSqref(): string {
        return this.#sqref;
    }
    public setSqref(sqref: string): this {
        this.#sqref = sqref;
        return this;
    }

    public clone(): ConditionalFormattingRuleExtension {
        const cloned = new ConditionalFormattingRuleExtension(this.#id, this.#cfRule);
        cloned.setSqref(this.#sqref);
        if (this.#dataBar) {
            cloned.setDataBarExt(this.#dataBar.clone());
        }
        return cloned;
    }
}
