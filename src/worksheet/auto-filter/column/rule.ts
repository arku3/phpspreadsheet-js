import { Column } from '../column.ts';

export class Rule {
    public static readonly AUTOFILTER_RULETYPE_FILTER = 'filter';
    public static readonly AUTOFILTER_RULETYPE_DATEGROUP = 'dateGroupItem';
    public static readonly AUTOFILTER_RULETYPE_CUSTOMFILTER = 'customFilter';
    public static readonly AUTOFILTER_RULETYPE_DYNAMICFILTER = 'dynamicFilter';
    public static readonly AUTOFILTER_RULETYPE_TOPTENFILTER = 'top10Filter';

    public static readonly AUTOFILTER_RULETYPE_DATEGROUP_YEAR = 'year';
    public static readonly AUTOFILTER_RULETYPE_DATEGROUP_MONTH = 'month';
    public static readonly AUTOFILTER_RULETYPE_DATEGROUP_DAY = 'day';
    public static readonly AUTOFILTER_RULETYPE_DATEGROUP_HOUR = 'hour';
    public static readonly AUTOFILTER_RULETYPE_DATEGROUP_MINUTE = 'minute';
    public static readonly AUTOFILTER_RULETYPE_DATEGROUP_SECOND = 'second';

    public static readonly AUTOFILTER_RULETYPE_DYNAMIC_YESTERDAY = 'yesterday';
    public static readonly AUTOFILTER_RULETYPE_DYNAMIC_TODAY = 'today';
    public static readonly AUTOFILTER_RULETYPE_DYNAMIC_TOMORROW = 'tomorrow';
    public static readonly AUTOFILTER_RULETYPE_DYNAMIC_YEARTODATE = 'yearToDate';
    public static readonly AUTOFILTER_RULETYPE_DYNAMIC_THISYEAR = 'thisYear';
    public static readonly AUTOFILTER_RULETYPE_DYNAMIC_THISQUARTER = 'thisQuarter';
    public static readonly AUTOFILTER_RULETYPE_DYNAMIC_THISMONTH = 'thisMonth';
    public static readonly AUTOFILTER_RULETYPE_DYNAMIC_THISWEEK = 'thisWeek';
    public static readonly AUTOFILTER_RULETYPE_DYNAMIC_LASTYEAR = 'lastYear';
    public static readonly AUTOFILTER_RULETYPE_DYNAMIC_LASTQUARTER = 'lastQuarter';
    public static readonly AUTOFILTER_RULETYPE_DYNAMIC_LASTMONTH = 'lastMonth';
    public static readonly AUTOFILTER_RULETYPE_DYNAMIC_LASTWEEK = 'lastWeek';
    public static readonly AUTOFILTER_RULETYPE_DYNAMIC_NEXTYEAR = 'nextYear';
    public static readonly AUTOFILTER_RULETYPE_DYNAMIC_NEXTQUARTER = 'nextQuarter';
    public static readonly AUTOFILTER_RULETYPE_DYNAMIC_NEXTMONTH = 'nextMonth';
    public static readonly AUTOFILTER_RULETYPE_DYNAMIC_NEXTWEEK = 'nextWeek';
    public static readonly AUTOFILTER_RULETYPE_DYNAMIC_MONTH_1 = 'M1';
    public static readonly AUTOFILTER_RULETYPE_DYNAMIC_MONTH_2 = 'M2';
    public static readonly AUTOFILTER_RULETYPE_DYNAMIC_MONTH_3 = 'M3';
    public static readonly AUTOFILTER_RULETYPE_DYNAMIC_MONTH_4 = 'M4';
    public static readonly AUTOFILTER_RULETYPE_DYNAMIC_MONTH_5 = 'M5';
    public static readonly AUTOFILTER_RULETYPE_DYNAMIC_MONTH_6 = 'M6';
    public static readonly AUTOFILTER_RULETYPE_DYNAMIC_MONTH_7 = 'M7';
    public static readonly AUTOFILTER_RULETYPE_DYNAMIC_MONTH_8 = 'M8';
    public static readonly AUTOFILTER_RULETYPE_DYNAMIC_MONTH_9 = 'M9';
    public static readonly AUTOFILTER_RULETYPE_DYNAMIC_MONTH_10 = 'M10';
    public static readonly AUTOFILTER_RULETYPE_DYNAMIC_MONTH_11 = 'M11';
    public static readonly AUTOFILTER_RULETYPE_DYNAMIC_MONTH_12 = 'M12';
    public static readonly AUTOFILTER_RULETYPE_DYNAMIC_QUARTER_1 = 'Q1';
    public static readonly AUTOFILTER_RULETYPE_DYNAMIC_QUARTER_2 = 'Q2';
    public static readonly AUTOFILTER_RULETYPE_DYNAMIC_QUARTER_3 = 'Q3';
    public static readonly AUTOFILTER_RULETYPE_DYNAMIC_QUARTER_4 = 'Q4';
    public static readonly AUTOFILTER_RULETYPE_DYNAMIC_ABOVEAVERAGE = 'aboveAverage';
    public static readonly AUTOFILTER_RULETYPE_DYNAMIC_BELOWAVERAGE = 'belowAverage';

    public static readonly AUTOFILTER_COLUMN_RULE_EQUAL = 'equal';
    public static readonly AUTOFILTER_COLUMN_RULE_NOTEQUAL = 'notEqual';
    public static readonly AUTOFILTER_COLUMN_RULE_GREATERTHAN = 'greaterThan';
    public static readonly AUTOFILTER_COLUMN_RULE_GREATERTHANOREQUAL = 'greaterThanOrEqual';
    public static readonly AUTOFILTER_COLUMN_RULE_LESSTHAN = 'lessThan';
    public static readonly AUTOFILTER_COLUMN_RULE_LESSTHANOREQUAL = 'lessThanOrEqual';

    public static readonly AUTOFILTER_COLUMN_RULE_TOPTEN_BY_VALUE = 'byValue';
    public static readonly AUTOFILTER_COLUMN_RULE_TOPTEN_PERCENT = 'byPercent';

    public static readonly AUTOFILTER_COLUMN_RULE_TOPTEN_TOP = 'top';
    public static readonly AUTOFILTER_COLUMN_RULE_TOPTEN_BOTTOM = 'bottom';

    static readonly #RULE_TYPES = [
        Rule.AUTOFILTER_RULETYPE_FILTER,
        Rule.AUTOFILTER_RULETYPE_DATEGROUP,
        Rule.AUTOFILTER_RULETYPE_CUSTOMFILTER,
        Rule.AUTOFILTER_RULETYPE_DYNAMICFILTER,
        Rule.AUTOFILTER_RULETYPE_TOPTENFILTER,
    ];

    static readonly #DATE_TIME_GROUPS = [
        Rule.AUTOFILTER_RULETYPE_DATEGROUP_YEAR,
        Rule.AUTOFILTER_RULETYPE_DATEGROUP_MONTH,
        Rule.AUTOFILTER_RULETYPE_DATEGROUP_DAY,
        Rule.AUTOFILTER_RULETYPE_DATEGROUP_HOUR,
        Rule.AUTOFILTER_RULETYPE_DATEGROUP_MINUTE,
        Rule.AUTOFILTER_RULETYPE_DATEGROUP_SECOND,
    ];

    static readonly #DYNAMIC_TYPES = [
        Rule.AUTOFILTER_RULETYPE_DYNAMIC_YESTERDAY,
        Rule.AUTOFILTER_RULETYPE_DYNAMIC_TODAY,
        Rule.AUTOFILTER_RULETYPE_DYNAMIC_TOMORROW,
        Rule.AUTOFILTER_RULETYPE_DYNAMIC_YEARTODATE,
        Rule.AUTOFILTER_RULETYPE_DYNAMIC_THISYEAR,
        Rule.AUTOFILTER_RULETYPE_DYNAMIC_THISQUARTER,
        Rule.AUTOFILTER_RULETYPE_DYNAMIC_THISMONTH,
        Rule.AUTOFILTER_RULETYPE_DYNAMIC_THISWEEK,
        Rule.AUTOFILTER_RULETYPE_DYNAMIC_LASTYEAR,
        Rule.AUTOFILTER_RULETYPE_DYNAMIC_LASTQUARTER,
        Rule.AUTOFILTER_RULETYPE_DYNAMIC_LASTMONTH,
        Rule.AUTOFILTER_RULETYPE_DYNAMIC_LASTWEEK,
        Rule.AUTOFILTER_RULETYPE_DYNAMIC_NEXTYEAR,
        Rule.AUTOFILTER_RULETYPE_DYNAMIC_NEXTQUARTER,
        Rule.AUTOFILTER_RULETYPE_DYNAMIC_NEXTMONTH,
        Rule.AUTOFILTER_RULETYPE_DYNAMIC_NEXTWEEK,
        Rule.AUTOFILTER_RULETYPE_DYNAMIC_MONTH_1,
        Rule.AUTOFILTER_RULETYPE_DYNAMIC_MONTH_2,
        Rule.AUTOFILTER_RULETYPE_DYNAMIC_MONTH_3,
        Rule.AUTOFILTER_RULETYPE_DYNAMIC_MONTH_4,
        Rule.AUTOFILTER_RULETYPE_DYNAMIC_MONTH_5,
        Rule.AUTOFILTER_RULETYPE_DYNAMIC_MONTH_6,
        Rule.AUTOFILTER_RULETYPE_DYNAMIC_MONTH_7,
        Rule.AUTOFILTER_RULETYPE_DYNAMIC_MONTH_8,
        Rule.AUTOFILTER_RULETYPE_DYNAMIC_MONTH_9,
        Rule.AUTOFILTER_RULETYPE_DYNAMIC_MONTH_10,
        Rule.AUTOFILTER_RULETYPE_DYNAMIC_MONTH_11,
        Rule.AUTOFILTER_RULETYPE_DYNAMIC_MONTH_12,
        Rule.AUTOFILTER_RULETYPE_DYNAMIC_QUARTER_1,
        Rule.AUTOFILTER_RULETYPE_DYNAMIC_QUARTER_2,
        Rule.AUTOFILTER_RULETYPE_DYNAMIC_QUARTER_3,
        Rule.AUTOFILTER_RULETYPE_DYNAMIC_QUARTER_4,
        Rule.AUTOFILTER_RULETYPE_DYNAMIC_ABOVEAVERAGE,
        Rule.AUTOFILTER_RULETYPE_DYNAMIC_BELOWAVERAGE,
    ];

    static readonly #OPERATORS = [
        Rule.AUTOFILTER_COLUMN_RULE_EQUAL,
        Rule.AUTOFILTER_COLUMN_RULE_NOTEQUAL,
        Rule.AUTOFILTER_COLUMN_RULE_GREATERTHAN,
        Rule.AUTOFILTER_COLUMN_RULE_GREATERTHANOREQUAL,
        Rule.AUTOFILTER_COLUMN_RULE_LESSTHAN,
        Rule.AUTOFILTER_COLUMN_RULE_LESSTHANOREQUAL,
    ];

    static readonly #TOP_TEN_VALUE = [
        Rule.AUTOFILTER_COLUMN_RULE_TOPTEN_BY_VALUE,
        Rule.AUTOFILTER_COLUMN_RULE_TOPTEN_PERCENT,
    ];

    static readonly #TOP_TEN_TYPE = [Rule.AUTOFILTER_COLUMN_RULE_TOPTEN_TOP, Rule.AUTOFILTER_COLUMN_RULE_TOPTEN_BOTTOM];

    #parent: Column | null;
    #ruleType: string = Rule.AUTOFILTER_RULETYPE_FILTER;
    #value: any = '';
    #operator: string = Rule.AUTOFILTER_COLUMN_RULE_EQUAL;
    #grouping: string = '';

    constructor(parent: Column | null = null) {
        this.#parent = parent;
    }

    #setEvaluatedFalse(): void {
        this.#parent?.setEvaluatedFalse();
    }

    public getRuleType(): string {
        return this.#ruleType;
    }

    public setRuleType(ruleType: string): this {
        this.#setEvaluatedFalse();
        if (!Rule.#RULE_TYPES.includes(ruleType)) {
            throw new Error('Invalid rule type for column AutoFilter Rule.');
        }
        this.#ruleType = ruleType;
        return this;
    }

    public getValue(): any {
        return this.#value;
    }

    public setValue(value: any): this {
        this.#setEvaluatedFalse();
        if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
            let grouping = -1;
            for (const key in value) {
                const groupIdx = Rule.#DATE_TIME_GROUPS.indexOf(key);
                if (groupIdx === -1) {
                    delete value[key];
                } else {
                    grouping = Math.max(grouping, groupIdx);
                }
            }
            if (Object.keys(value).length === 0) {
                throw new Error('Invalid rule value for column AutoFilter Rule.');
            }
            this.setGrouping(Rule.#DATE_TIME_GROUPS[grouping]!);
        }
        this.#value = value;
        return this;
    }

    public getOperator(): string {
        return this.#operator;
    }

    public setOperator(operator: string): this {
        this.#setEvaluatedFalse();
        if (!operator) {
            operator = Rule.AUTOFILTER_COLUMN_RULE_EQUAL;
        }
        if (!Rule.#OPERATORS.includes(operator) && !Rule.#TOP_TEN_VALUE.includes(operator)) {
            throw new Error('Invalid operator for column AutoFilter Rule.');
        }
        this.#operator = operator;
        return this;
    }

    public getGrouping(): string {
        return this.#grouping;
    }

    public setGrouping(grouping: string): this {
        this.#setEvaluatedFalse();
        if (
            !Rule.#DATE_TIME_GROUPS.includes(grouping) &&
            !Rule.#DYNAMIC_TYPES.includes(grouping) &&
            !Rule.#TOP_TEN_TYPE.includes(grouping)
        ) {
            throw new Error('Invalid grouping for column AutoFilter Rule.');
        }
        this.#grouping = grouping;
        return this;
    }

    public setRule(operator: string, value: any, grouping: string | null = null): this {
        this.#setEvaluatedFalse();
        this.setOperator(operator);
        this.setValue(value);
        if (grouping !== null) {
            this.setGrouping(grouping);
        }
        return this;
    }

    public getParent(): Column | null {
        return this.#parent;
    }

    public setParent(parent: Column | null = null): this {
        this.#setEvaluatedFalse();
        this.#parent = parent;
        return this;
    }

    public clone(parent: Column | null = null): Rule {
        const cloned = new Rule(parent);
        cloned.setRuleType(this.#ruleType);
        cloned.setOperator(this.#operator);
        cloned.setValue(typeof this.#value === 'object' && this.#value !== null ? { ...this.#value } : this.#value);
        if (this.#grouping !== '') {
            cloned.setGrouping(this.#grouping);
        }

        return cloned;
    }
}
