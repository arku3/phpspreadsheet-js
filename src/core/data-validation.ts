/**
 * Data validation class for cell validation rules.
 * Based on PhpSpreadsheet DataValidation.
 */
export class DataValidation {
    // Data validation types
    static readonly TYPE_NONE = 'none';
    static readonly TYPE_CUSTOM = 'custom';
    static readonly TYPE_DATE = 'date';
    static readonly TYPE_DECIMAL = 'decimal';
    static readonly TYPE_LIST = 'list';
    static readonly TYPE_TEXTLENGTH = 'textLength';
    static readonly TYPE_TIME = 'time';
    static readonly TYPE_WHOLE = 'whole';

    // Data validation error styles
    static readonly STYLE_STOP = 'stop';
    static readonly STYLE_WARNING = 'warning';
    static readonly STYLE_INFORMATION = 'information';

    // Data validation operators
    static readonly OPERATOR_BETWEEN = 'between';
    static readonly OPERATOR_EQUAL = 'equal';
    static readonly OPERATOR_GREATERTHAN = 'greaterThan';
    static readonly OPERATOR_GREATERTHANOREQUAL = 'greaterThanOrEqual';
    static readonly OPERATOR_LESSTHAN = 'lessThan';
    static readonly OPERATOR_LESSTHANOREQUAL = 'lessThanOrEqual';
    static readonly OPERATOR_NOTBETWEEN = 'notBetween';
    static readonly OPERATOR_NOTEQUAL = 'notEqual';

    static readonly DEFAULT_OPERATOR = DataValidation.OPERATOR_BETWEEN;

    // Private fields
    #formula1: string = '';
    #formula2: string = '';
    #type: string = DataValidation.TYPE_NONE;
    #errorStyle: string = DataValidation.STYLE_STOP;
    #operator: string = DataValidation.DEFAULT_OPERATOR;
    #allowBlank: boolean = false;
    #showDropDown: boolean = false;
    #showInputMessage: boolean = false;
    #showErrorMessage: boolean = false;
    #errorTitle: string = '';
    #error: string = '';
    #promptTitle: string = '';
    #prompt: string = '';
    #sqref: string | null = null;

    /**
     * Get Formula 1.
     */
    getFormula1(): string {
        return this.#formula1;
    }

    /**
     * Set Formula 1.
     */
    setFormula1(formula: string): this {
        this.#formula1 = formula;
        return this;
    }

    /**
     * Get Formula 2.
     */
    getFormula2(): string {
        return this.#formula2;
    }

    /**
     * Set Formula 2.
     */
    setFormula2(formula: string): this {
        this.#formula2 = formula;
        return this;
    }

    /**
     * Get Type.
     */
    getType(): string {
        return this.#type;
    }

    /**
     * Set Type.
     */
    setType(type: string): this {
        this.#type = type;
        return this;
    }

    /**
     * Get Error style.
     */
    getErrorStyle(): string {
        return this.#errorStyle;
    }

    /**
     * Set Error style.
     */
    setErrorStyle(errorStyle: string): this {
        this.#errorStyle = errorStyle;
        return this;
    }

    /**
     * Get Operator.
     */
    getOperator(): string {
        return this.#operator;
    }

    /**
     * Set Operator.
     */
    setOperator(operator: string): this {
        this.#operator = operator === '' ? DataValidation.DEFAULT_OPERATOR : operator;
        return this;
    }

    /**
     * Get Allow Blank.
     */
    getAllowBlank(): boolean {
        return this.#allowBlank;
    }

    /**
     * Set Allow Blank.
     */
    setAllowBlank(allowBlank: boolean): this {
        this.#allowBlank = allowBlank;
        return this;
    }

    /**
     * Get Show DropDown.
     */
    getShowDropDown(): boolean {
        return this.#showDropDown;
    }

    /**
     * Set Show DropDown.
     */
    setShowDropDown(showDropDown: boolean): this {
        this.#showDropDown = showDropDown;
        return this;
    }

    /**
     * Get Show InputMessage.
     */
    getShowInputMessage(): boolean {
        return this.#showInputMessage;
    }

    /**
     * Set Show InputMessage.
     */
    setShowInputMessage(showInputMessage: boolean): this {
        this.#showInputMessage = showInputMessage;
        return this;
    }

    /**
     * Get Show ErrorMessage.
     */
    getShowErrorMessage(): boolean {
        return this.#showErrorMessage;
    }

    /**
     * Set Show ErrorMessage.
     */
    setShowErrorMessage(showErrorMessage: boolean): this {
        this.#showErrorMessage = showErrorMessage;
        return this;
    }

    /**
     * Get Error title.
     */
    getErrorTitle(): string {
        return this.#errorTitle;
    }

    /**
     * Set Error title.
     */
    setErrorTitle(errorTitle: string): this {
        this.#errorTitle = errorTitle;
        return this;
    }

    /**
     * Get Error.
     */
    getError(): string {
        return this.#error;
    }

    /**
     * Set Error.
     */
    setError(error: string): this {
        this.#error = error;
        return this;
    }

    /**
     * Get Prompt title.
     */
    getPromptTitle(): string {
        return this.#promptTitle;
    }

    /**
     * Set Prompt title.
     */
    setPromptTitle(promptTitle: string): this {
        this.#promptTitle = promptTitle;
        return this;
    }

    /**
     * Get Prompt.
     */
    getPrompt(): string {
        return this.#prompt;
    }

    /**
     * Set Prompt.
     */
    setPrompt(prompt: string): this {
        this.#prompt = prompt;
        return this;
    }

    /**
     * Get Sqref (cell reference/range).
     */
    getSqref(): string | null {
        return this.#sqref;
    }

    /**
     * Set Sqref (cell reference/range).
     */
    setSqref(sqref: string | null): this {
        this.#sqref = sqref;
        return this;
    }

    /**
     * Get hash code.
     */
    getHashCode(): string {
        return this.#formula1
            + this.#formula2
            + this.#type
            + this.#errorStyle
            + this.#operator
            + (this.#allowBlank ? 't' : 'f')
            + (this.#showDropDown ? 't' : 'f')
            + (this.#showInputMessage ? 't' : 'f')
            + (this.#showErrorMessage ? 't' : 'f')
            + this.#errorTitle
            + this.#error
            + this.#promptTitle
            + this.#prompt
            + (this.#sqref ?? '');
    }
}
