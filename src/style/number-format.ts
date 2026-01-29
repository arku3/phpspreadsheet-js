import { createHash } from 'node:crypto';
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

    public static readonly FORMAT_CURRENCY_USD_INTEGER = '$#,##0_-';
    public static readonly FORMAT_CURRENCY_USD = '$#,##0.00_-';
    public static readonly FORMAT_CURRENCY_EUR_INTEGER = '#,##0_-[$€]';
    public static readonly FORMAT_CURRENCY_EUR = '#,##0.00_-[$€]';
    public static readonly FORMAT_ACCOUNTING_USD = '_("$"* #,##0.00_);_("$"* \\(#,##0.00\\);_("$"* "-"??_);_(@_)';
    public static readonly FORMAT_ACCOUNTING_EUR = '_("€"* #,##0.00_);_("€"* \\(#,##0.00\\);_("€"* "-"??_);_(@_)';

    /**
     * Format Code.
     */
    #formatCode: string = NumberFormat.FORMAT_GENERAL;

    /**
     * Built-in format Code.
     */
    #builtInFormatCode: number | false = 0;

    constructor(isSupervisor: boolean = false) {
        super(isSupervisor);
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
    public getFormatCode(): string {
        if (this.isSupervisor) {
            return this.getSharedComponent().getFormatCode();
        }
        return this.#formatCode;
    }

    /**
     * Set format code.
     */
    public setFormatCode(formatCode: string): this {
        if (this.isSupervisor) {
            const styleArray = this.getStyleArray({ formatCode: formatCode });
            (this.parent as any).applyFromArray(styleArray);
        } else {
            if (formatCode === '') {
                formatCode = NumberFormat.FORMAT_GENERAL;
            }
            this.#formatCode = formatCode;
        }
        return this;
    }

    /**
     * Get built-in format code.
     */
    public getBuiltInFormatCode(): number | false {
        if (this.isSupervisor) {
            return this.getSharedComponent().getBuiltInFormatCode();
        }
        return this.#builtInFormatCode;
    }

    /**
     * Set built-in format code.
     */
    public setBuiltInFormatCode(index: number): this {
        if (this.isSupervisor) {
            const styleArray = this.getStyleArray({ builtInFormatCode: index });
            (this.parent as any).applyFromArray(styleArray);
        } else {
            this.#builtInFormatCode = index;
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
            this.setFormatCode(String(styleArray.formatCode));
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
        return createHash('md5')
            .update(
                this.#formatCode +
                (this.#builtInFormatCode === false ? 'f' : this.#builtInFormatCode) +
                'NumberFormat'
            )
            .digest('hex');
    }
}
