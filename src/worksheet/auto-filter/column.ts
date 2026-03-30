import { AutoFilter } from '../auto-filter.ts';
import { Rule } from './column/rule.ts';

export class Column {
    public static readonly AUTOFILTER_FILTERTYPE_FILTER = 'filters';
    public static readonly AUTOFILTER_FILTERTYPE_CUSTOMFILTER = 'customFilters';
    public static readonly AUTOFILTER_FILTERTYPE_DYNAMICFILTER = 'dynamicFilter';
    public static readonly AUTOFILTER_FILTERTYPE_TOPTENFILTER = 'top10';

    static readonly #FILTER_TYPES = [
        Column.AUTOFILTER_FILTERTYPE_FILTER,
        Column.AUTOFILTER_FILTERTYPE_CUSTOMFILTER,
        Column.AUTOFILTER_FILTERTYPE_DYNAMICFILTER,
        Column.AUTOFILTER_FILTERTYPE_TOPTENFILTER,
    ];

    public static readonly AUTOFILTER_COLUMN_JOIN_AND = 'and';
    public static readonly AUTOFILTER_COLUMN_JOIN_OR = 'or';

    static readonly #RULE_JOINS = [Column.AUTOFILTER_COLUMN_JOIN_AND, Column.AUTOFILTER_COLUMN_JOIN_OR];

    #parent: AutoFilter | null;
    #columnIndex: string;
    #filterType: string = Column.AUTOFILTER_FILTERTYPE_FILTER;
    #join: string = Column.AUTOFILTER_COLUMN_JOIN_OR;
    #ruleset: Rule[] = [];
    #attributes: Map<string, string | number> = new Map();

    constructor(column: string, parent: AutoFilter | null = null) {
        this.#columnIndex = column;
        this.#parent = parent;
    }

    public setEvaluatedFalse(): void {
        this.#parent?.setEvaluated(false);
    }

    public getColumnIndex(): string {
        return this.#columnIndex;
    }

    public setColumnIndex(column: string): this {
        this.setEvaluatedFalse();
        column = column.toUpperCase();
        this.#parent?.testColumnInRange(column);
        this.#columnIndex = column;
        return this;
    }

    public getParent(): AutoFilter | null {
        return this.#parent;
    }

    public setParent(parent: AutoFilter | null = null): this {
        this.setEvaluatedFalse();
        this.#parent = parent;
        return this;
    }

    public getFilterType(): string {
        return this.#filterType;
    }

    public setFilterType(filterType: string): this {
        this.setEvaluatedFalse();
        if (!Column.#FILTER_TYPES.includes(filterType)) {
            throw new Error('Invalid filter type for column AutoFilter.');
        }
        if (filterType === Column.AUTOFILTER_FILTERTYPE_CUSTOMFILTER && this.#ruleset.length > 2) {
            throw new Error('No more than 2 rules are allowed in a Custom Filter');
        }
        this.#filterType = filterType;
        return this;
    }

    public getJoin(): string {
        return this.#join;
    }

    public setJoin(join: string): this {
        this.setEvaluatedFalse();
        join = join.toLowerCase();
        if (!Column.#RULE_JOINS.includes(join)) {
            throw new Error('Invalid rule connection for column AutoFilter.');
        }
        this.#join = join;
        return this;
    }

    public setAttributes(attributes: Record<string, string | number>): this {
        this.setEvaluatedFalse();
        this.#attributes = new Map(Object.entries(attributes));
        return this;
    }

    public setAttribute(name: string, value: string | number): this {
        this.setEvaluatedFalse();
        this.#attributes.set(name, value);
        return this;
    }

    public getAttributes(): Map<string, string | number> {
        return this.#attributes;
    }

    public getAttribute(name: string): string | number | null {
        return this.#attributes.get(name) ?? null;
    }

    public ruleCount(): number {
        return this.#ruleset.length;
    }

    public getRules(): Rule[] {
        return this.#ruleset;
    }

    public getRule(index: number): Rule {
        if (!this.#ruleset[index]) {
            this.#ruleset[index] = new Rule(this);
        }
        return this.#ruleset[index]!;
    }

    public createRule(): Rule {
        this.setEvaluatedFalse();
        if (this.#filterType === Column.AUTOFILTER_FILTERTYPE_CUSTOMFILTER && this.#ruleset.length >= 2) {
            throw new Error('No more than 2 rules are allowed in a Custom Filter');
        }
        const rule = new Rule(this);
        this.#ruleset.push(rule);
        return rule;
    }

    public addRule(rule: Rule): this {
        this.setEvaluatedFalse();
        rule.setParent(this);
        this.#ruleset.push(rule);
        return this;
    }

    public deleteRule(index: number): this {
        this.setEvaluatedFalse();
        if (this.#ruleset[index]) {
            this.#ruleset.splice(index, 1);
            if (this.#ruleset.length <= 1) {
                this.setJoin(Column.AUTOFILTER_COLUMN_JOIN_OR);
            }
        }
        return this;
    }

    public clearRules(): this {
        this.setEvaluatedFalse();
        this.#ruleset = [];
        this.setJoin(Column.AUTOFILTER_COLUMN_JOIN_OR);
        return this;
    }

    public clone(parent: AutoFilter | null = null): Column {
        const cloned = new Column(this.#columnIndex, parent);
        cloned.setFilterType(this.#filterType);
        cloned.setJoin(this.#join);
        cloned.setAttributes(Object.fromEntries(this.#attributes));

        for (const rule of this.#ruleset) {
            cloned.addRule(rule.clone(cloned));
        }

        return cloned;
    }
}
