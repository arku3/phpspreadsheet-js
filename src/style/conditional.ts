import { createHash } from 'node:crypto';
import { Style } from './style.ts';
import { ConditionalDataBar } from './conditional-formatting/conditional-data-bar.ts';
import { ConditionalColorScale } from './conditional-formatting/conditional-color-scale.ts';
import { ConditionalIconSet } from './conditional-formatting/conditional-icon-set.ts';

/**
 * Conditional style.
 */
export class Conditional {
    // Condition types
    public static readonly CONDITION_NONE = 'none';
    public static readonly CONDITION_BEGINSWITH = 'beginsWith';
    public static readonly CONDITION_CELLIS = 'cellIs';
    public static readonly CONDITION_CONTAINSBLANKS = 'containsBlanks';
    public static readonly CONDITION_CONTAINSERRORS = 'containsErrors';
    public static readonly CONDITION_CONTAINSTEXT = 'containsText';
    public static readonly CONDITION_EXPRESSION = 'expression';
    public static readonly CONDITION_ENDSWITH = 'endsWith';
    public static readonly CONDITION_NOTCONTAINSBLANKS = 'notContainsBlanks';
    public static readonly CONDITION_NOTCONTAINSERRORS = 'notContainsErrors';
    public static readonly CONDITION_NOTCONTAINSTEXT = 'notContainsText';
    public static readonly CONDITION_TIMEPERIOD = 'timePeriod';
    public static readonly CONDITION_DUPLICATES = 'duplicateValues';
    public static readonly CONDITION_UNIQUE = 'uniqueValues';
    public static readonly CONDITION_COLORSCALE = 'colorScale';
    public static readonly CONDITION_DATABAR = 'dataBar';
    public static readonly CONDITION_ICONSET = 'iconSet';
    public static readonly CONDITION_ABVAVERAGE = 'aboveAverage';
    public static readonly CONDITION_TOP10 = 'top10';

    // Time periods
    public static readonly TIMEPERIOD_TODAY = 'today';
    public static readonly TIMEPERIOD_YESTERDAY = 'yesterday';
    public static readonly TIMEPERIOD_TOMORROW = 'tomorrow';
    public static readonly TIMEPERIOD_LAST_7_DAYS = 'last7Days';
    public static readonly TIMEPERIOD_LAST_WEEK = 'lastWeek';
    public static readonly TIMEPERIOD_THIS_WEEK = 'thisWeek';
    public static readonly TIMEPERIOD_NEXT_WEEK = 'nextWeek';
    public static readonly TIMEPERIOD_LAST_MONTH = 'lastMonth';
    public static readonly TIMEPERIOD_THIS_MONTH = 'thisMonth';
    public static readonly TIMEPERIOD_NEXT_MONTH = 'nextMonth';

    // Operator types
    public static readonly OPERATOR_NONE = '';
    public static readonly OPERATOR_BEGINSWITH = 'beginsWith';
    public static readonly OPERATOR_BETWEEN = 'between';
    public static readonly OPERATOR_CONTAINSTEXT = 'containsText';
    public static readonly OPERATOR_ENDSWITH = 'endsWith';
    public static readonly OPERATOR_EQUAL = 'equal';
    public static readonly OPERATOR_GREATERTHAN = 'greaterThan';
    public static readonly OPERATOR_GREATERTHANOREQUAL = 'greaterThanOrEqual';
    public static readonly OPERATOR_LESSTHAN = 'lessThan';
    public static readonly OPERATOR_LESSTHANOREQUAL = 'lessThanOrEqual';
    public static readonly OPERATOR_NOTBETWEEN = 'notBetween';
    public static readonly OPERATOR_NOTCONTAINSTEXT = 'notContainsText';
    public static readonly OPERATOR_NOTEQUAL = 'notEqual';

    #conditionType: string = Conditional.CONDITION_NONE;
    #operatorType: string = Conditional.OPERATOR_NONE;
    #text: string = '';
    #stopIfTrue: boolean = false;
    #conditions: (string | number)[] = [];
    #style: Style;
    #priority: number = 0;
    #noFormatSet: boolean = false;

    #dataBar: ConditionalDataBar | null = null;
    #colorScale: ConditionalColorScale | null = null;
    #iconSet: ConditionalIconSet | null = null;

    constructor() {
        this.#style = new Style(false);
    }

    public getConditionType(): string {
        return this.#conditionType;
    }

    public setConditionType(type: string): this {
        this.#conditionType = type;
        return this;
    }

    public getOperatorType(): string {
        return this.#operatorType;
    }

    public setOperatorType(type: string): this {
        this.#operatorType = type;
        return this;
    }

    public getText(): string {
        return this.#text;
    }

    public setText(text: string): this {
        this.#text = text;
        return this;
    }

    public getStopIfTrue(): boolean {
        return this.#stopIfTrue;
    }

    public setStopIfTrue(stop: boolean): this {
        this.#stopIfTrue = stop;
        return this;
    }

    public getConditions(): (string | number)[] {
        return this.#conditions;
    }

    public setConditions(conditions: (string | number)[] | string | number): this {
        if (!Array.isArray(conditions)) {
            conditions = [conditions];
        }
        this.#conditions = conditions;
        return this;
    }

    public addCondition(condition: string | number): this {
        this.#conditions.push(condition);
        return this;
    }

    public getStyle(): Style {
        return this.#style;
    }

    public setStyle(style: Style): this {
        this.#style = style;
        return this;
    }

    public getPriority(): number {
        return this.#priority;
    }

    public setPriority(priority: number): this {
        this.#priority = priority;
        return this;
    }

    public getNoFormatSet(): boolean {
        return this.#noFormatSet;
    }

    public setNoFormatSet(noFormatSet: boolean): this {
        this.#noFormatSet = noFormatSet;
        return this;
    }

    public getDataBar(): ConditionalDataBar | null {
        return this.#dataBar;
    }

    public setDataBar(dataBar: ConditionalDataBar): this {
        this.#dataBar = dataBar;
        return this;
    }

    public getColorScale(): ConditionalColorScale | null {
        return this.#colorScale;
    }

    public setColorScale(colorScale: ConditionalColorScale): this {
        this.#colorScale = colorScale;
        return this;
    }

    public getIconSet(): ConditionalIconSet | null {
        return this.#iconSet;
    }

    public setIconSet(iconSet: ConditionalIconSet): this {
        this.#iconSet = iconSet;
        return this;
    }

    /**
     * Get hash code.
     */
    public getHashCode(): string {
        return createHash('md5')
            .update(
                this.#conditionType +
                this.#operatorType +
                this.#conditions.join(';') +
                this.#style.getHashCode() +
                (this.#dataBar ? 'dataBar' : '') +
                (this.#colorScale ? 'colorScale' : '') +
                (this.#iconSet ? 'iconSet' : '') +
                'Conditional'
            )
            .digest('hex');
    }

    /**
     * Implement cloning.
     */
    public clone(): Conditional {
        const clone = new Conditional();
        clone.#conditionType = this.#conditionType;
        clone.#operatorType = this.#operatorType;
        clone.#text = this.#text;
        clone.#stopIfTrue = this.#stopIfTrue;
        clone.#conditions = [...this.#conditions];
        clone.#style = this.#style.clone();
        clone.#priority = this.#priority;
        clone.#noFormatSet = this.#noFormatSet;
        clone.#dataBar = this.#dataBar; // TODO: deep clone if needed
        clone.#colorScale = this.#colorScale; // TODO: deep clone if needed
        clone.#iconSet = this.#iconSet; // TODO: deep clone if needed
        return clone;
    }
}
