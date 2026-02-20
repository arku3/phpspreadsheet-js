import { DefinedName } from './defined-name.ts';
import { Worksheet } from './worksheet.ts';

export class NamedFormula extends DefinedName {
    constructor(
        name: string,
        worksheet: Worksheet | null = null,
        formula: string,
        localOnly: boolean = false,
        scope: Worksheet | null = null,
    ) {
        if (!formula) {
            throw new Error('Formula is required.');
        }
        super(name, worksheet, formula, localOnly, scope);
    }

    public getFormula(): string {
        return this.getValue();
    }

    public setFormula(formula: string): this {
        if (!formula) {
            throw new Error('Formula is required.');
        }
        this.setValue(formula);
        return this;
    }
}
