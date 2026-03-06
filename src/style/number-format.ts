import { createHash } from 'node:crypto';
import { NumberFormatter } from './number-formatter.ts';
import { Supervisor } from './supervisor.ts';

/**
 * Number format style.
 */
export class NumberFormat extends Supervisor {
    // Pre-defined formats
    public static readonly FORMAT_GENERAL = 'General';
    public static readonly FORMAT_TEXT = '@';
    public static readonly FORMAT_NUMBER = '0';
    public static readonly FORMAT_NUMBER_0 = '0.0';
    public static readonly FORMAT_NUMBER_00 = '0.00';
    public static readonly FORMAT_NUMBER_COMMA_SEPARATED1 = '#,##0.00';
    public static readonly FORMAT_NUMBER_COMMA_SEPARATED2 = '#,##0.00_-';
    public static readonly FORMAT_PERCENTAGE = '0%';
    public static readonly FORMAT_PERCENTAGE_0 = '0.0%';
    public static readonly FORMAT_PERCENTAGE_00 = '0.00%';
    public static readonly FORMAT_DATE_YYYYMMDD = 'yyyy-mm-dd';
    public static readonly FORMAT_DATE_DDMMYYYY = 'dd/mm/yyyy';
    public static readonly FORMAT_DATE_DMYSLASH = 'd/m/yy';
    public static readonly FORMAT_DATE_DMYMINUS = 'd-m-yy';
    public static readonly FORMAT_DATE_DMMINUS = 'd-m';
    public static readonly FORMAT_DATE_MYMINUS = 'm-yy';
    public static readonly FORMAT_DATE_XLSX14 = 'mm-dd-yy';
    public static readonly FORMAT_DATE_XLSX14_ACTUAL = 'm/d/yyyy';
    public static readonly FORMAT_DATE_XLSX15 = 'd-mmm-yy';
    public static readonly FORMAT_DATE_XLSX16 = 'd-mmm';
    public static readonly FORMAT_DATE_XLSX17 = 'mmm-yy';
    public static readonly FORMAT_DATE_XLSX22 = 'm/d/yy h:mm';
    public static readonly FORMAT_DATE_XLSX22_ACTUAL = 'm/d/yyyy h:mm';
    public static readonly FORMAT_DATE_DATETIME = 'd/m/yy h:mm';
    public static readonly FORMAT_DATE_TIME1 = 'h:mm AM/PM';
    public static readonly FORMAT_DATE_TIME2 = 'h:mm:ss AM/PM';
    public static readonly FORMAT_DATE_TIME3 = 'h:mm';
    public static readonly FORMAT_DATE_TIME4 = 'h:mm:ss';
    public static readonly FORMAT_DATE_TIME5 = 'mm:ss';
    public static readonly FORMAT_DATE_TIME6 = 'h:mm:ss';
    public static readonly FORMAT_DATE_TIME7 = 'i:s.S';
    public static readonly FORMAT_DATE_TIME8 = 'h:mm:ss;@';
    public static readonly FORMAT_DATE_YYYYMMDDSLASH = 'yyyy/mm/dd;@';
    public static readonly FORMAT_DATE_LONG_DATE = 'dddd, mmmm d, yyyy';

    public static readonly FORMAT_SYSDATE_X = '[$-x-sysdate]';
    public static readonly FORMAT_SYSDATE_F800 = '[$-F800]';
    public static readonly FORMAT_SYSTIME_X = '[$-x-systime]';
    public static readonly FORMAT_SYSTIME_F400 = '[$-F400]';

    public static readonly FORMAT_CURRENCY_USD_INTEGER = '$#,##0_-';
    public static readonly FORMAT_CURRENCY_USD = '$#,##0.00_-';
    public static readonly FORMAT_CURRENCY_EUR_INTEGER = '#,##0_-[$€]';
    public static readonly FORMAT_CURRENCY_EUR = '#,##0.00_-[$€]';
    public static readonly FORMAT_ACCOUNTING_USD = '_("$"* #,##0.00_);_("$"* \\(#,##0.00\\);_("$"* "-"??_);_(@_)';
    public static readonly FORMAT_ACCOUNTING_EUR = '_("€"* #,##0.00_);_("€"* \\(#,##0.00\\);_("€"* "-"??_);_(@_)';

    public static readonly SHORT_DATE_INDEX = 14;
    public static readonly DATE_TIME_INDEX = 22;

    public static readonly DATE_TIME_OR_DATETIME_ARRAY = [
        NumberFormat.FORMAT_DATE_YYYYMMDD,
        NumberFormat.FORMAT_DATE_DDMMYYYY,
        NumberFormat.FORMAT_DATE_DMYSLASH,
        NumberFormat.FORMAT_DATE_DMYMINUS,
        NumberFormat.FORMAT_DATE_DMMINUS,
        NumberFormat.FORMAT_DATE_MYMINUS,
        NumberFormat.FORMAT_DATE_XLSX14,
        NumberFormat.FORMAT_DATE_XLSX14_ACTUAL,
        NumberFormat.FORMAT_DATE_XLSX15,
        NumberFormat.FORMAT_DATE_XLSX16,
        NumberFormat.FORMAT_DATE_XLSX17,
        NumberFormat.FORMAT_DATE_XLSX22,
        NumberFormat.FORMAT_DATE_XLSX22_ACTUAL,
        NumberFormat.FORMAT_DATE_DATETIME,
        NumberFormat.FORMAT_DATE_TIME1,
        NumberFormat.FORMAT_DATE_TIME2,
        NumberFormat.FORMAT_DATE_TIME3,
        NumberFormat.FORMAT_DATE_TIME4,
        NumberFormat.FORMAT_DATE_TIME5,
        NumberFormat.FORMAT_DATE_TIME6,
        NumberFormat.FORMAT_DATE_TIME7,
        NumberFormat.FORMAT_DATE_TIME8,
        NumberFormat.FORMAT_DATE_YYYYMMDDSLASH,
        NumberFormat.FORMAT_DATE_LONG_DATE,
    ] as const;

    public static readonly TIME_OR_DATETIME_ARRAY = [
        NumberFormat.FORMAT_DATE_XLSX22,
        NumberFormat.FORMAT_DATE_DATETIME,
        NumberFormat.FORMAT_DATE_TIME1,
        NumberFormat.FORMAT_DATE_TIME2,
        NumberFormat.FORMAT_DATE_TIME3,
        NumberFormat.FORMAT_DATE_TIME4,
        NumberFormat.FORMAT_DATE_TIME5,
        NumberFormat.FORMAT_DATE_TIME6,
        NumberFormat.FORMAT_DATE_TIME7,
        NumberFormat.FORMAT_DATE_TIME8,
    ] as const;

    static #shortDateFormat = NumberFormat.FORMAT_DATE_XLSX14_ACTUAL;
    static #longDateFormat = NumberFormat.FORMAT_DATE_LONG_DATE;
    static #dateTimeFormat = NumberFormat.FORMAT_DATE_XLSX22_ACTUAL;
    static #timeFormat = NumberFormat.FORMAT_DATE_TIME2;

    static readonly #builtInFormats: Record<number, string> = {
        0: NumberFormat.FORMAT_GENERAL,
        1: '0',
        2: '0.00',
        3: '#,##0',
        4: '#,##0.00',
        9: '0%',
        10: '0.00%',
        11: '0.00E+00',
        12: '# ?/?',
        13: '# ??/??',
        14: NumberFormat.FORMAT_DATE_XLSX14_ACTUAL,
        15: NumberFormat.FORMAT_DATE_XLSX15,
        16: NumberFormat.FORMAT_DATE_XLSX16,
        17: NumberFormat.FORMAT_DATE_XLSX17,
        18: 'h:mm AM/PM',
        19: 'h:mm:ss AM/PM',
        20: 'h:mm',
        21: 'h:mm:ss',
        22: NumberFormat.FORMAT_DATE_XLSX22_ACTUAL,
        37: '#,##0_);(#,##0)',
        38: '#,##0_);[Red](#,##0)',
        39: '#,##0.00_);(#,##0.00)',
        40: '#,##0.00_);[Red](#,##0.00)',
        44: '_(* #,##0_);_(* \(#,##0\);_(* "-"_);_(@_)',
        45: 'mm:ss',
        46: '[h]:mm:ss',
        47: 'mm:ss.0',
        48: '##0.0E+0',
        49: '@',
        27: '[$-404]e/m/d',
        28: '[$-411]ggge"年"m"月"d"日"',
        29: '[$-411]ggge"年"m"月"d"日"',
        30: 'm/d/yy',
        31: 'yyyy"年"m"月"d"日"',
        32: 'h"時"mm"分"',
        33: 'h"時"mm"分"ss"秒"',
        34: 'yyyy"年"m"月"',
        35: 'm"月"d"日"',
        36: '[$-404]e/m/d',
        50: '[$-404]e/m/d',
        51: '[$-411]ggge"年"m"月"d"日"',
        52: 'yyyy"年"m"月"',
        53: 'm"月"d"日"',
        54: '[$-411]ggge"年"m"月"d"日"',
        55: 'yyyy"年"m"月"',
        56: 'm"月"d"日"',
        57: '[$-404]e/m/d',
        58: '[$-411]ggge"年"m"月"d"日"',
        59: 't0',
        60: 't0.00',
        61: 't#,##0',
        62: 't#,##0.00',
        67: 't0%',
        68: 't0.00%',
        69: 't# ?/?',
        70: 't# ??/??',
        71: '[$-411]ggge"年"m"月"d"日"',
        72: '[$-411]ggge"年"m"月"d"日"',
        73: '[$-411]ggge"年"m"月"d"日"',
        74: '[$-411]hh"時"mm"分"',
        75: '[$-411]hh"時"mm"分"ss"秒"',
        76: '[$-804]上午/下午h"時"mm"分"',
        77: '[$-804]上午/下午h"時"mm"分"ss"秒"',
        78: '[$-804]mm"月"dd"日"',
        79: '[$-804]mm"月"dd"日"',
        80: '[$-804]mm"月"dd"日"',
        81: '[$-804]mm"月"dd"日"',
    };

    static #builtInFormatsReverse: Record<string, number> | null = null;

    /**
     * Format Code.
     */
    #formatCode: string | null = NumberFormat.FORMAT_GENERAL;

    /**
     * Built-in format Code.
     */
    #builtInFormatCode: number | false = 0;

    constructor(isSupervisor: boolean = false, isConditional: boolean = false) {
        super(isSupervisor);
        if (isConditional) {
            this.#formatCode = null;
            this.#builtInFormatCode = false;
        }
    }

    /**
     * Get shared component.
     */
    public getSharedComponent(): NumberFormat {
        if (!this.parent) {
            throw new Error('No parent found.');
        }
        return (this.parent as any).getSharedComponent().getNumberFormat();
    }

    /**
     * Build style array from subcomponents.
     */
    public getStyleArray(array: any): any {
        return { numberFormat: array };
    }

    /**
     * Get format code.
     */
    public getFormatCode(extended: boolean = false): string | null {
        if (this.isSupervisor) {
            return this.getSharedComponent().getFormatCode(extended);
        }

        if (this.#builtInFormatCode !== false) {
            const builtIn = NumberFormat.builtInFormatCode(this.#builtInFormatCode);
            if (this.#builtInFormatCode === NumberFormat.SHORT_DATE_INDEX) {
                return extended ? NumberFormat.#shortDateFormat : builtIn;
            }
            if (this.#builtInFormatCode === NumberFormat.DATE_TIME_INDEX) {
                return extended ? NumberFormat.#dateTimeFormat : builtIn;
            }
            return builtIn;
        }

        if (this.#formatCode === null) {
            return null;
        }

        return extended ? NumberFormat.convertSystemFormats(this.#formatCode) : this.#formatCode;
    }

    /**
     * Set format code.
     */
    public setFormatCode(formatCode: string | null): this {
        if (this.isSupervisor) {
            const styleArray = this.getStyleArray({ formatCode });
            (this.parent as any).applyFromArray(styleArray);
        } else {
            if (formatCode === '') {
                formatCode = NumberFormat.FORMAT_GENERAL;
            }
            this.#formatCode = formatCode;
            this.#builtInFormatCode = NumberFormat.builtInFormatCodeIndex(formatCode ?? '');
        }
        return this;
    }

    /**
     * Set built-in format code.
     */
    public setBuiltInFormatCode(index: number): this {
        if (this.isSupervisor) {
            const styleArray = this.getStyleArray({
                builtInFormatCode: index,
                formatCode: NumberFormat.builtInFormatCode(index),
            });
            (this.parent as any).applyFromArray(styleArray);
        } else {
            this.#builtInFormatCode = index;
            this.#formatCode = NumberFormat.builtInFormatCode(index);
        }
        return this;
    }

    /**
     * Apply styles from array.
     *
     * @param styleArray Array containing style information
     */
    public applyFromArray(styleArray: Record<string, unknown>): this {
        if (this.isSupervisor) {
            const styleArrayLocal = this.getStyleArray(styleArray);
            (this.parent as any).applyFromArray(styleArrayLocal);
            return this;
        }

        if (styleArray.formatCode !== undefined) {
            this.setFormatCode(styleArray.formatCode === null ? null : String(styleArray.formatCode));
        }
        if (styleArray.builtInFormatCode !== undefined) {
            const index = Number(styleArray.builtInFormatCode);
            if (Number.isFinite(index)) {
                this.setBuiltInFormatCode(index);
            }
        }
        return this;
    }

    /**
     * Get hash code.
     */
    public getHashCode(): string {
        if (this.isSupervisor) {
            return this.getSharedComponent().getHashCode();
        }
        const content = `${this.#formatCode ?? ''}${this.#builtInFormatCode === false ? '' : this.#builtInFormatCode}NumberFormat`;
        return createHash('md5').update(content).digest('hex');
    }

    /**
     * Get built-in format code.
     *
     * @returns Built-in format code
     */
    public getBuiltInFormatCode(): number | false {
        if (this.isSupervisor) {
            return this.getSharedComponent().getBuiltInFormatCode();
        }
        return this.#builtInFormatCode;
    }

    /**
     * Format a value according to this number format.
     *
     * @param value The value to format
     * @returns The formatted string
     */
    public toFormattedString(value: number | string | null | undefined): string {
        // If this NumberFormat is a supervisor, read the current format from the
        // shared component (i.e., the cell's current xf style). Using #formatCode
        // here would ignore mutations done through xfIndex/style changes.
        return NumberFormatter.toFormattedString(value, this.getFormatCode() ?? NumberFormat.FORMAT_GENERAL);
    }

    public static toFormattedString(
        value: number | string | boolean | null | undefined,
        format: string,
        callBack?: ((formattedValue: string, color: string) => string) | null,
        lessFloatPrecision: boolean = false,
    ): string {
        return NumberFormatter.toFormattedString(value, format, callBack, lessFloatPrecision);
    }

    public static convertSystemFormats(formatCode: string | null): string | null {
        if (formatCode === null) {
            return null;
        }
        const lowerFormatCode = formatCode.toLowerCase();
        if (
            lowerFormatCode.includes(NumberFormat.FORMAT_SYSDATE_F800.toLowerCase()) ||
            lowerFormatCode.includes(NumberFormat.FORMAT_SYSDATE_X.toLowerCase())
        ) {
            return NumberFormat.#longDateFormat;
        }
        if (
            lowerFormatCode.includes(NumberFormat.FORMAT_SYSTIME_F400.toLowerCase()) ||
            lowerFormatCode.includes(NumberFormat.FORMAT_SYSTIME_X.toLowerCase())
        ) {
            return NumberFormat.#timeFormat;
        }

        return formatCode;
    }

    public static builtInFormatCode(index: number): string {
        return NumberFormat.#builtInFormats[index] ?? '';
    }

    public static builtInFormatCodeIndex(formatCode: string): number | false {
        if (!NumberFormat.#builtInFormatsReverse) {
            NumberFormat.#builtInFormatsReverse = {};
            for (const [index, format] of Object.entries(NumberFormat.#builtInFormats)) {
                NumberFormat.#builtInFormatsReverse[format] = Number(index);
            }
        }
        const mapped = NumberFormat.#builtInFormatsReverse[formatCode];
        return mapped === undefined ? false : mapped;
    }

    public static getShortDateFormat(): string {
        return NumberFormat.#shortDateFormat;
    }

    public static setShortDateFormat(value: string): void {
        NumberFormat.#shortDateFormat = value;
    }

    public static getLongDateFormat(): string {
        return NumberFormat.#longDateFormat;
    }

    public static setLongDateFormat(value: string): void {
        NumberFormat.#longDateFormat = value;
    }

    public static getDateTimeFormat(): string {
        return NumberFormat.#dateTimeFormat;
    }

    public static setDateTimeFormat(value: string): void {
        NumberFormat.#dateTimeFormat = value;
    }

    public static getTimeFormat(): string {
        return NumberFormat.#timeFormat;
    }

    public static setTimeFormat(value: string): void {
        NumberFormat.#timeFormat = value;
    }
}
