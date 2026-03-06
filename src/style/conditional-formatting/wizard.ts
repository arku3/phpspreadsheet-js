import { Conditional } from '../conditional.ts';
import { Blanks } from './wizard/blanks.ts';
import { CellValue } from './wizard/cell-value.ts';
import { DateValue } from './wizard/date-value.ts';
import { Duplicates } from './wizard/duplicates.ts';
import { Errors } from './wizard/errors.ts';
import { Expression } from './wizard/expression.ts';
import { TextValue } from './wizard/text-value.ts';

export class Wizard {
    public static readonly CELL_VALUE = 'cellValue';
    public static readonly TEXT_VALUE = 'textValue';
    public static readonly EXPRESSION = 'expression';
    public static readonly FORMULA = 'formula';
    public static readonly DATES_OCCURRING = 'datesOccurring';
    public static readonly DUPLICATES = 'duplicates';
    public static readonly UNIQUE = 'unique';

    public static readonly VALUE_TYPE_LITERAL = 'value';
    public static readonly VALUE_TYPE_CELL = 'cell';
    public static readonly VALUE_TYPE_FORMULA = 'formula';

    public static readonly ERRORS = 'errors';
    public static readonly NOT_ERRORS = 'notErrors';
    public static readonly BLANKS = 'blanks';
    public static readonly NOT_BLANKS = 'notBlanks';

    #cellRange: string;

    public constructor(cellRange: string) {
        this.#cellRange = cellRange;
    }

    public newRule(ruleType: string): CellValue | TextValue | Blanks | Errors | Expression | DateValue | Duplicates {
        switch (ruleType) {
            case Wizard.CELL_VALUE:
                return new CellValue(this.#cellRange);
            case Wizard.TEXT_VALUE:
                return new TextValue(this.#cellRange);
            case Wizard.BLANKS:
                return new Blanks(this.#cellRange);
            case Wizard.NOT_BLANKS:
                return new Blanks(this.#cellRange, true);
            case Wizard.ERRORS:
                return new Errors(this.#cellRange, true);
            case Wizard.NOT_ERRORS:
                return new Errors(this.#cellRange);
            case Wizard.EXPRESSION:
            case Wizard.FORMULA:
                return new Expression(this.#cellRange);
            case Wizard.DATES_OCCURRING:
                return new DateValue(this.#cellRange);
            case Wizard.DUPLICATES:
                return new Duplicates(this.#cellRange);
            case Wizard.UNIQUE:
                return new Duplicates(this.#cellRange, true);
            default:
                throw new Error('Invalid conditional formatting wizard rule type.');
        }
    }

    public static fromConditional(
        conditional: Conditional,
        cellRange: string = 'A1',
    ): CellValue | TextValue | Blanks | Errors | Expression | DateValue | Duplicates {
        const type = conditional.getConditionType();
        if (type === Conditional.CONDITION_CELLIS) {
            return CellValue.fromConditional(conditional, cellRange);
        }
        if (
            type === Conditional.CONDITION_CONTAINSTEXT ||
            type === Conditional.CONDITION_NOTCONTAINSTEXT ||
            type === Conditional.CONDITION_BEGINSWITH ||
            type === Conditional.CONDITION_ENDSWITH
        ) {
            return TextValue.fromConditional(conditional, cellRange);
        }
        if (type === Conditional.CONDITION_CONTAINSBLANKS || type === Conditional.CONDITION_NOTCONTAINSBLANKS) {
            return Blanks.fromConditional(conditional, cellRange);
        }
        if (type === Conditional.CONDITION_CONTAINSERRORS || type === Conditional.CONDITION_NOTCONTAINSERRORS) {
            return Errors.fromConditional(conditional, cellRange);
        }
        if (type === Conditional.CONDITION_EXPRESSION) {
            return Expression.fromConditional(conditional, cellRange);
        }
        if (type === Conditional.CONDITION_TIMEPERIOD) {
            return DateValue.fromConditional(conditional, cellRange);
        }
        if (type === Conditional.CONDITION_DUPLICATES || type === Conditional.CONDITION_UNIQUE) {
            return Duplicates.fromConditional(conditional, cellRange);
        }

        throw new Error('Invalid conditional formatting rule type.');
    }
}
