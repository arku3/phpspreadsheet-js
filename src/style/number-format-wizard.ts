import { NumberFormat } from './number-format.ts';

export interface Wizard {
    format(): string;
}

export class SpreadsheetException extends Error {}

export class CurrencyNegative {
    public static readonly minus = new CurrencyNegative('-', '', '');
    public static readonly redMinus = new CurrencyNegative('-', '', '[Red]');
    public static readonly parentheses = new CurrencyNegative('\\(', '\\)', '');
    public static readonly redParentheses = new CurrencyNegative('\\(', '\\)', '[Red]');

    #start: string;
    #end: string;
    #color: string;

    private constructor(start: string, end: string, color: string) {
        this.#start = start;
        this.#end = end;
        this.#color = color;
    }

    public start(): string {
        return this.#start;
    }

    public end(): string {
        return this.#end;
    }

    public color(): string {
        return this.#color;
    }
}

export class Locale {
    public static readonly STRUCTURE = /^(?<language>[a-z]{2})([-_](?<script>[a-z]{4}))?([-_](?<country>[a-z]{2}))?$/i;

    #locale: string | null;
    #style: number;

    public constructor(locale: string | null, style: number) {
        this.#locale = locale;
        this.#style = style;
        if (locale && !Locale.STRUCTURE.test(locale)) {
            throw new SpreadsheetException(`Invalid locale code ${locale}`);
        }
    }

    public format(_stripRlm: boolean = true): string {
        return this.#locale ?? '';
    }

    public getStyle(): number {
        return this.#style;
    }
}

export abstract class NumberBase implements Wizard {
    #decimals: number = 2;
    #locale: string | null = null;

    protected constructor(decimals: number = 2, locale: string | null = null) {
        this.setDecimals(decimals);
        this.setLocale(locale);
    }

    public setDecimals(decimals: number = 2): void {
        this.#decimals = Math.max(0, Math.min(30, decimals));
    }

    public getDecimals(): number {
        return this.#decimals;
    }

    public setLocale(locale: string | null = null): void {
        if (locale && !Locale.STRUCTURE.test(locale)) {
            throw new SpreadsheetException(`Invalid locale code ${locale}`);
        }
        this.#locale = locale;
    }

    public getLocale(): string | null {
        return this.#locale;
    }

    public format(): string {
        return NumberFormat.FORMAT_GENERAL;
    }

    public toString(): string {
        return this.format();
    }

    protected decimalMask(): string {
        return this.#decimals > 0 ? `.${'0'.repeat(this.#decimals)}` : '';
    }
}

export class Number extends NumberBase {
    public static readonly WITH_THOUSANDS_SEPARATOR = true;
    public static readonly WITHOUT_THOUSANDS_SEPARATOR = false;

    #thousandsSeparator: boolean;

    public constructor(
        decimals: number = 2,
        thousandsSeparator: boolean = Number.WITH_THOUSANDS_SEPARATOR,
        locale: string | null = null,
    ) {
        super(decimals, locale);
        this.#thousandsSeparator = thousandsSeparator;
    }

    public setThousandsSeparator(thousandsSeparator: boolean = Number.WITH_THOUSANDS_SEPARATOR): void {
        this.#thousandsSeparator = thousandsSeparator;
    }

    public override format(): string {
        const base = this.#thousandsSeparator ? '#,##0' : '0';
        return `${base}${this.decimalMask()}`;
    }
}

export class Percentage extends NumberBase {
    public constructor(decimals: number = 2, locale: string | null = null) {
        super(decimals, locale);
    }

    public override format(): string {
        return `0${this.decimalMask()}%`;
    }
}

export class Scientific extends NumberBase {
    public constructor(decimals: number = 2, locale: string | null = null) {
        super(decimals, locale);
    }

    public override format(): string {
        return `0${this.decimalMask()}E+00`;
    }
}

export class CurrencyBase extends Number {
    public static readonly LEADING_SYMBOL = true;
    public static readonly TRAILING_SYMBOL = false;
    public static readonly SYMBOL_WITH_SPACING = true;
    public static readonly SYMBOL_WITHOUT_SPACING = false;
    public static readonly DEFAULT_NEGATIVE = CurrencyNegative.minus;
    public static readonly DEFAULT_STRIP_LEADING_RLM = true;

    #currencyCode: string;
    #currencySymbolPosition: boolean;
    #currencySymbolSpacing: boolean;
    #stripLeadingRLM: boolean;
    #negative: CurrencyNegative;

    public constructor(
        currencyCode: string = '$',
        decimals: number = 2,
        thousandsSeparator: boolean = true,
        currencySymbolPosition: boolean = CurrencyBase.LEADING_SYMBOL,
        currencySymbolSpacing: boolean = CurrencyBase.SYMBOL_WITHOUT_SPACING,
        locale: string | null = null,
        stripLeadingRLM: boolean = CurrencyBase.DEFAULT_STRIP_LEADING_RLM,
        negative: CurrencyNegative = CurrencyNegative.minus,
    ) {
        super(decimals, thousandsSeparator, locale);
        this.#currencyCode = currencyCode;
        this.#currencySymbolPosition = currencySymbolPosition;
        this.#currencySymbolSpacing = currencySymbolSpacing;
        this.#stripLeadingRLM = stripLeadingRLM;
        this.#negative = negative;
    }

    public setCurrencyCode(currencyCode: string): void {
        this.#currencyCode = currencyCode;
    }

    public setCurrencySymbolPosition(currencySymbolPosition: boolean = CurrencyBase.LEADING_SYMBOL): void {
        this.#currencySymbolPosition = currencySymbolPosition;
    }

    public setCurrencySymbolSpacing(currencySymbolSpacing: boolean = CurrencyBase.SYMBOL_WITHOUT_SPACING): void {
        this.#currencySymbolSpacing = currencySymbolSpacing;
    }

    public setStripLeadingRLM(stripLeadingRLM: boolean): void {
        this.#stripLeadingRLM = stripLeadingRLM;
    }

    public setNegative(negative: CurrencyNegative): void {
        this.#negative = negative;
    }

    public override format(): string {
        const space = this.#currencySymbolSpacing ? ' ' : '';
        const symbol = this.#currencyCode;
        const amount = super.format();
        const positive = this.#currencySymbolPosition ? `${symbol}${space}${amount}` : `${amount}${space}${symbol}`;
        const negative = `${this.#negative.color()}${this.#negative.start()}${positive}${this.#negative.end()}`;
        const zero = positive;
        const text = '@';
        if (this.#stripLeadingRLM) {
            return `${positive};${negative};${zero};${text}`;
        }
        return `${positive};${negative};${zero};${text}`;
    }
}

export class Currency extends CurrencyBase {}

export class Accounting extends CurrencyBase {
    public static icuVersion(): number {
        return 999;
    }
}

export abstract class DateTimeWizard implements Wizard {
    public abstract format(): string;

    public toString(): string {
        return this.format();
    }

    protected static padSeparatorArray(
        separators: string | string[] | null,
        size: number,
        defaultSeparator: string,
    ): string[] {
        if (separators === null) {
            return Array(size).fill(defaultSeparator);
        }
        if (typeof separators === 'string') {
            return Array(size).fill(separators);
        }
        const result = [...separators];
        while (result.length < size) {
            result.push(defaultSeparator);
        }
        return result.slice(0, size);
    }

    protected static wrapLiteral(token: string): string {
        return `"${token.replace(/"/g, '""')}"`;
    }

    protected static intersperse(tokens: string[], separators: string[]): string {
        let out = '';
        for (let i = 0; i < tokens.length; i++) {
            out += tokens[i] ?? '';
            if (i < separators.length) {
                out += separators[i] ?? '';
            }
        }
        return out;
    }
}

export class Date extends DateTimeWizard {
    public static readonly YEAR_FULL = 'yyyy';
    public static readonly YEAR_SHORT = 'yy';
    public static readonly MONTH_FIRST_LETTER = 'mmmmm';
    public static readonly MONTH_NAME_FULL = 'mmmm';
    public static readonly MONTH_NAME_SHORT = 'mmm';
    public static readonly MONTH_NUMBER_LONG = 'mm';
    public static readonly MONTH_NUMBER_SHORT = 'm';
    public static readonly WEEKDAY_NAME_LONG = 'dddd';
    public static readonly WEEKDAY_NAME_SHORT = 'ddd';
    public static readonly DAY_NUMBER_LONG = 'dd';
    public static readonly DAY_NUMBER_SHORT = 'd';

    public static readonly SEPARATOR_DASH = '-';
    public static readonly SEPARATOR_DOT = '.';
    public static readonly SEPARATOR_SLASH = '/';
    public static readonly SEPARATOR_SPACE_NONBREAKING = '\u00A0';
    public static readonly SEPARATOR_SPACE = ' ';

    #separators: string[];
    #tokens: string[];

    public constructor(separators: string | string[] | null = Date.SEPARATOR_DASH, ...formatBlocks: (string | null)[]) {
        super();
        this.#tokens = formatBlocks.filter((v): v is string => v !== null && v !== '');
        if (this.#tokens.length === 0) {
            this.#tokens = [Date.YEAR_FULL, Date.MONTH_NUMBER_LONG, Date.DAY_NUMBER_LONG];
        }
        this.#separators = DateTimeWizard.padSeparatorArray(
            separators,
            Math.max(0, this.#tokens.length - 1),
            Date.SEPARATOR_DASH,
        );
    }

    public format(): string {
        const valid = new Set([
            Date.YEAR_FULL,
            Date.YEAR_SHORT,
            Date.MONTH_FIRST_LETTER,
            Date.MONTH_NAME_FULL,
            Date.MONTH_NAME_SHORT,
            Date.MONTH_NUMBER_LONG,
            Date.MONTH_NUMBER_SHORT,
            Date.WEEKDAY_NAME_LONG,
            Date.WEEKDAY_NAME_SHORT,
            Date.DAY_NUMBER_LONG,
            Date.DAY_NUMBER_SHORT,
        ]);
        const tokens = this.#tokens.map((token) =>
            valid.has(token.toLowerCase()) ? token.toLowerCase() : DateTimeWizard.wrapLiteral(token),
        );
        return DateTimeWizard.intersperse(tokens, this.#separators);
    }
}

export class Time extends DateTimeWizard {
    public static readonly HOURS_SHORT = 'h';
    public static readonly HOURS_LONG = 'hh';
    public static readonly MINUTES_SHORT = 'm';
    public static readonly MINUTES_LONG = 'mm';
    public static readonly SECONDS_SHORT = 's';
    public static readonly SECONDS_LONG = 'ss';
    public static readonly MORNING_AFTERNOON = 'AM/PM';

    public static readonly SEPARATOR_COLON = ':';
    public static readonly SEPARATOR_SPACE_NONBREAKING = '\u00A0';
    public static readonly SEPARATOR_SPACE = ' ';

    #separators: string[];
    #tokens: string[];

    public constructor(separators: string | string[] | null = Time.SEPARATOR_COLON, ...formatBlocks: string[]) {
        super();
        this.#tokens = formatBlocks.length > 0 ? formatBlocks : [Time.HOURS_LONG, Time.MINUTES_LONG, Time.SECONDS_LONG];
        this.#separators = DateTimeWizard.padSeparatorArray(
            separators,
            Math.max(0, this.#tokens.length - 1),
            Time.SEPARATOR_COLON,
        );
    }

    public format(): string {
        const valid = new Set([
            Time.HOURS_SHORT,
            Time.HOURS_LONG,
            Time.MINUTES_SHORT,
            Time.MINUTES_LONG,
            Time.SECONDS_SHORT,
            Time.SECONDS_LONG,
            Time.MORNING_AFTERNOON,
        ]);
        const tokens = this.#tokens.map((token) => {
            if (token.toUpperCase() === Time.MORNING_AFTERNOON) {
                return Time.MORNING_AFTERNOON;
            }
            return valid.has(token.toLowerCase()) ? token.toLowerCase() : DateTimeWizard.wrapLiteral(token);
        });
        return DateTimeWizard.intersperse(tokens, this.#separators);
    }
}

export class Duration extends DateTimeWizard {
    public static readonly DAYS_DURATION = '[d]';
    public static readonly HOURS_DURATION = '[h]';
    public static readonly HOURS_SHORT = 'h';
    public static readonly HOURS_LONG = 'hh';
    public static readonly MINUTES_DURATION = '[m]';
    public static readonly MINUTES_SHORT = 'm';
    public static readonly MINUTES_LONG = 'mm';
    public static readonly SECONDS_DURATION = '[s]';
    public static readonly SECONDS_SHORT = 's';
    public static readonly SECONDS_LONG = 'ss';

    public static readonly SEPARATOR_COLON = ':';
    public static readonly SEPARATOR_SPACE_NONBREAKING = '\u00A0';
    public static readonly SEPARATOR_SPACE = ' ';

    public static readonly DURATION_DEFAULT = [
        Duration.HOURS_DURATION,
        Duration.MINUTES_LONG,
        Duration.SECONDS_LONG,
    ] as const;

    #separators: string[];
    #tokens: string[];

    public constructor(separators: string | string[] | null = Duration.SEPARATOR_COLON, ...formatBlocks: string[]) {
        super();
        this.#tokens = formatBlocks.length > 0 ? formatBlocks : [...Duration.DURATION_DEFAULT];
        this.#tokens = Duration.#normalizeDurationTokens(this.#tokens);
        this.#separators = DateTimeWizard.padSeparatorArray(
            separators,
            Math.max(0, this.#tokens.length - 1),
            Duration.SEPARATOR_COLON,
        );
    }

    public format(): string {
        const valid = new Set([
            Duration.DAYS_DURATION,
            Duration.HOURS_DURATION,
            Duration.HOURS_SHORT,
            Duration.HOURS_LONG,
            Duration.MINUTES_DURATION,
            Duration.MINUTES_SHORT,
            Duration.MINUTES_LONG,
            Duration.SECONDS_DURATION,
            Duration.SECONDS_SHORT,
            Duration.SECONDS_LONG,
        ]);
        const tokens = this.#tokens.map((token) =>
            valid.has(token.toLowerCase()) ? token.toLowerCase() : DateTimeWizard.wrapLiteral(token),
        );
        return DateTimeWizard.intersperse(tokens, this.#separators);
    }

    static #normalizeDurationTokens(tokens: string[]): string[] {
        let durationTokenFound = false;
        const normalized = tokens.map((token) => {
            const lower = token.toLowerCase();
            const isDuration = lower === '[d]' || lower === '[h]' || lower === '[m]' || lower === '[s]';
            if (isDuration) {
                if (durationTokenFound) {
                    if (lower === '[h]') return 'hh';
                    if (lower === '[m]') return 'mm';
                    if (lower === '[s]') return 'ss';
                    return 'dd';
                }
                durationTokenFound = true;
            }
            return token;
        });

        if (!durationTokenFound && normalized.length > 0) {
            const first = normalized[0] ?? Duration.HOURS_LONG;
            const lower = first.toLowerCase();
            if (lower.startsWith('h')) normalized[0] = Duration.HOURS_DURATION;
            else if (lower.startsWith('m')) normalized[0] = Duration.MINUTES_DURATION;
            else if (lower.startsWith('s')) normalized[0] = Duration.SECONDS_DURATION;
            else normalized[0] = Duration.HOURS_DURATION;
        }
        return normalized;
    }
}

export class DateTime extends DateTimeWizard {
    #separators: string[];
    #blocks: (DateTimeWizard | string)[];

    public constructor(separators: string | string[] | null, ...formatBlocks: (DateTimeWizard | string)[]) {
        super();
        this.#blocks = formatBlocks;
        this.#separators = DateTimeWizard.padSeparatorArray(separators, Math.max(0, formatBlocks.length - 1), ' ');
    }

    public format(): string {
        const parts = this.#blocks.map((block) =>
            typeof block === 'string' ? DateTimeWizard.wrapLiteral(block) : block.format(),
        );
        return DateTimeWizard.intersperse(parts, this.#separators);
    }
}
