import { DefinedName } from './defined-name.ts';
import { Worksheet } from './worksheet.ts';

/**
 * Represents a Named Range in the spreadsheet.
 */
export class NamedRange extends DefinedName {
    constructor(
        name: string,
        worksheet: Worksheet | null = null,
        range: string = 'A1',
        localOnly: boolean = false,
        scope: Worksheet | null = null,
    ) {
        if (worksheet === null && scope === null) {
            throw new Error('You must specify a worksheet or a scope for a Named Range');
        }
        super(name, worksheet, range, localOnly, scope);
    }

    public getRange(): string {
        return this.getValue();
    }

    public setRange(range: string): this {
        this.setValue(range);
        return this;
    }
}
