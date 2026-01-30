import { Worksheet } from './worksheet.ts';

/**
 * Base class for Defined Names (Named Ranges or Named Formulas).
 */
export abstract class DefinedName {
    #name: string;
    #worksheet: Worksheet | null;
    #value: string;
    #localOnly: boolean;
    #scope: Worksheet | null;

    constructor(
        name: string,
        worksheet: Worksheet | null = null,
        value: string = '',
        localOnly: boolean = false,
        scope: Worksheet | null = null,
    ) {
        this.#name = name;
        this.#worksheet = worksheet || scope;
        this.#value = value;
        this.#localOnly = localOnly;
        this.#scope = localOnly ? scope || worksheet : null;
    }

    public getName(): string {
        return this.#name;
    }

    public getValue(): string {
        return this.#value;
    }

    public setValue(value: string): void {
        this.#value = value;
    }

    public getWorksheet(): Worksheet | null {
        return this.#worksheet;
    }

    public getLocalOnly(): boolean {
        return this.#localOnly;
    }

    public getScope(): Worksheet | null {
        return this.#scope;
    }

    public isFormula(): boolean {
        return this.#value.startsWith('=');
    }
}
