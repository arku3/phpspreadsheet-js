import { getDecimalSeparator, getThousandsSeparator } from '../utils/string-helper.ts';
import { Color } from './color.ts';

/**
 * Formats values according to Excel number format codes.
 *
 * This is a focused PhpSpreadsheet-style implementation covering the
 * most common numeric, percentage, fraction, scientific, text, and
 * date/time behaviors used by the library today.
 */
export class NumberFormatter {
    public static toFormattedString(
        value: number | string | boolean | null | undefined,
        format: string,
        callback?: ((formattedValue: string, color: string) => string) | null,
        lessFloatPrecision: boolean = false,
    ): string {
        if (value === null || value === undefined) {
            return '';
        }

        if (typeof value === 'boolean') {
            const booleanValue = value ? 'TRUE' : 'FALSE';
            return callback ? callback(booleanValue, '') : booleanValue;
        }

        const normalizedFormat = format || 'General';
        const numericValue = this.toNumericValue(value);

        if (numericValue === null) {
            const formattedText = this.formatTextValue(String(value), normalizedFormat);
            return callback ? callback(formattedText, '') : formattedText;
        }

        const section = this.selectNumericSection(numericValue, normalizedFormat);
        const cleanedSection = this.cleanSection(section.section);

        let formattedValue: string;
        if (this.isDateTimeFormat(cleanedSection)) {
            formattedValue = this.formatDateTime(section.value, cleanedSection);
        } else if (this.isPercentFormat(cleanedSection)) {
            formattedValue = this.formatPercentage(section.value, cleanedSection);
        } else if (this.isFractionFormat(cleanedSection)) {
            formattedValue = this.formatFraction(section.value, cleanedSection);
        } else if (this.isScientificFormat(cleanedSection)) {
            formattedValue = this.formatScientific(section.value, cleanedSection);
        } else {
            formattedValue = this.formatNumeric(section.value, cleanedSection, lessFloatPrecision);
        }

        return callback ? callback(formattedValue, section.color) : formattedValue;
    }

    private static toNumericValue(value: number | string): number | null {
        if (typeof value === 'number') {
            return Number.isFinite(value) ? value : null;
        }

        const trimmed = value.trim();
        if (!trimmed) {
            return null;
        }

        return /^[+-]?(?:\d+\.?\d*|\.\d+)(?:e[+-]?\d+)?$/i.test(trimmed) ? Number(trimmed) : null;
    }

    private static formatTextValue(value: string, format: string): string {
        const sections = this.splitSections(format);
        if (sections.length === 1 && this.containsUnquotedToken(sections[0]!, '@')) {
            return this.applyTextSection(sections[0]!, value);
        }
        return value;
    }

    private static applyTextSection(section: string, value: string): string {
        const cleanedSection = this.cleanSection(section);
        let result = '';
        let inQuotes = false;

        for (let index = 0; index < cleanedSection.length; index++) {
            const char = cleanedSection[index]!;
            if (char === '"') {
                inQuotes = !inQuotes;
                continue;
            }

            if (char === '\\') {
                result += cleanedSection[index + 1] ?? '';
                index += 1;
                continue;
            }

            if (!inQuotes && char === '@') {
                result += value;
                continue;
            }

            result += char;
        }

        return result;
    }

    private static selectNumericSection(
        value: number,
        format: string,
    ): { section: string; value: number; color: string } {
        const sections = this.splitSections(format);
        const colors = sections.map((section) => this.extractColor(section));
        const conditions = sections.map((section) => this.extractCondition(section));

        if (sections.length <= 1) {
            const section = sections[0] ?? format;
            return { section, value, color: colors[0] ?? '' };
        }
        if (sections.length === 2) {
            const firstMatches = this.matchesCondition(value, conditions[0] ?? null, '>=', 0);
            const section = firstMatches ? sections[0]! : sections[1]!;
            const color = firstMatches ? (colors[0] ?? '') : (colors[1] ?? '');
            return { section, value: Math.abs(value), color };
        }

        const firstMatches = this.matchesCondition(value, conditions[0] ?? null, '>', 0);
        if (firstMatches) {
            return { section: sections[0]!, value: Math.abs(value), color: colors[0] ?? '' };
        }

        const secondMatches = this.matchesCondition(value, conditions[1] ?? null, '<', 0);
        if (secondMatches) {
            return { section: sections[1]!, value: Math.abs(value), color: colors[1] ?? '' };
        }

        return { section: sections[2]!, value: Math.abs(value), color: colors[2] ?? '' };
    }

    private static extractColor(section: string): string {
        const match = section.match(/\[((?:BLACK|BLUE|CYAN|GREEN|MAGENTA|RED|WHITE|YELLOW)|COLOR\s*\d+)\]/i);
        const color = match?.[1];
        if (!color) {
            return '';
        }

        const indexedMatch = color.match(/^COLOR\s*(\d+)$/i);
        if (!indexedMatch) {
            return color;
        }

        return `#${Color.indexedColor(Number(indexedMatch[1])).getRGB()}`;
    }

    private static extractCondition(section: string): { operator: string; operand: number } | null {
        const matches = section.match(/\[(<=|>=|<>|=|<|>)(-?\d+(?:\.\d+)?)\]/);
        if (!matches) {
            return null;
        }

        return {
            operator: matches[1]!,
            operand: Number(matches[2]),
        };
    }

    private static matchesCondition(
        value: number,
        condition: { operator: string; operand: number } | null,
        defaultOperator: string = '>=',
        defaultOperand: number = 0,
    ): boolean {
        const resolvedCondition = condition ?? { operator: defaultOperator, operand: defaultOperand };

        switch (resolvedCondition.operator) {
            case '<':
                return value < resolvedCondition.operand;
            case '<=':
                return value <= resolvedCondition.operand;
            case '>':
                return value > resolvedCondition.operand;
            case '>=':
                return value >= resolvedCondition.operand;
            case '=':
                return value === resolvedCondition.operand;
            case '<>':
                return value !== resolvedCondition.operand;
            default:
                return false;
        }
    }

    private static cleanSection(section: string): string {
        return section
            .replace(/\[(?:BLACK|BLUE|CYAN|GREEN|MAGENTA|RED|WHITE|YELLOW|COLOR\s*\d+)\]/gi, '')
            .replace(/\[(?:<=|>=|<>|=|<|>)-?\d+(?:\.\d+)?\]/g, '')
            .replace(/_.?/g, ' ')
            .replace(/\*(.)/g, '$1');
    }

    private static isDateTimeFormat(format: string): boolean {
        const loweredFormat = this.stripQuotedAndEscapedLiterals(this.stripLocaleTokens(format)).toLowerCase();
        if (/\[(?:h+|m+|s+)\]/.test(loweredFormat)) {
            return true;
        }

        const bare = this.stripQuotedAndEscapedLiterals(
            this.stripBracketExpressions(this.stripLocaleTokens(format)),
        ).toLowerCase();
        if (!/[dhyms]/.test(bare)) {
            return false;
        }
        return !/[#0?]\./.test(bare);
    }

    private static isPercentFormat(format: string): boolean {
        return this.containsUnquotedToken(format, '%');
    }

    private static isFractionFormat(format: string): boolean {
        const bare = this.stripFormattingLiterals(this.stripBracketExpressions(format));
        return /[#0?]+\s+[?#0]+\/(?:[?#0]+|\d+)/.test(bare) || /^[?#0]+\/(?:[?#0]+|\d+)$/.test(bare);
    }

    private static isScientificFormat(format: string): boolean {
        return /[0#?](?:\.[0#?]+)?E[+-]0+/i.test(this.stripFormattingLiterals(format));
    }

    private static formatPercentage(value: number, format: string): string {
        const bare = this.stripFormattingLiterals(this.stripBracketExpressions(this.stripLocaleTokens(format)));
        const analysisFormat = this.stripQuotedAndEscapedLiterals(bare).replace(/%/g, '');
        const decimals = this.countDecimalPlaces(analysisFormat);
        return this.applyNumberMask(value * 100, bare, analysisFormat, false, decimals);
    }

    private static formatScientific(value: number, format: string): string {
        const bare = this.stripFormattingLiterals(this.stripBracketExpressions(this.stripLocaleTokens(format)));
        const decimalMatch = bare.match(/\.(0+|#+|\?+)/);
        const decimals = decimalMatch ? decimalMatch[1]!.length : 0;
        return this.adjustSeparators(value.toExponential(decimals).replace('e', 'E'));
    }

    private static formatFraction(value: number, format: string): string {
        const bare = this.stripFormattingLiterals(this.stripBracketExpressions(this.stripLocaleTokens(format)));
        const match = bare.match(/([#0?]+\s+)?([#0?]+)\/(\?+|\d+)/);
        if (!match) {
            return String(value);
        }

        const sign = value < 0 ? '-' : '';
        const absolute = Math.abs(value);
        const integerPart = Math.floor(absolute);
        const fraction = absolute - integerPart;
        if (fraction === 0) {
            return `${sign}${integerPart}`;
        }

        const decimal = this.getFractionDecimalPortion(absolute);
        const decimalDigits = decimal.length;
        const decimalPart = Number(decimal);
        const decimalDivisor = Math.pow(10, decimalDigits);
        let divisor = 1;

        if (/^\d+$/.test(match[3]!)) {
            divisor = 100 / Number(match[3]!);
        } else {
            divisor = this.gcd(decimalPart, decimalDivisor);
        }

        let numerator = Math.round(decimalPart / divisor);
        let denominator = decimalDivisor / divisor;
        let adjustedInteger = integerPart;
        if (numerator >= denominator) {
            numerator -= denominator;
            adjustedInteger += 1;
        }

        if (!match[1]) {
            return `${sign}${numerator + adjustedInteger * denominator}/${denominator}`;
        }

        if (adjustedInteger === 0) {
            return `${sign}${numerator}/${denominator}`;
        }

        return `${sign}${adjustedInteger} ${numerator}/${denominator}`.trim();
    }

    private static formatNumeric(value: number, format: string, lessFloatPrecision: boolean): string {
        const bare = this.stripLocaleTokens(this.stripBracketExpressions(format));
        const literalOnly = this.stripFormattingLiterals(bare);
        const analysisFormat = this.stripQuotedAndEscapedLiterals(bare);
        if (literalOnly === 'General') {
            return this.formatGeneral(value, lessFloatPrecision);
        }
        if (literalOnly === '@') {
            return String(value);
        }

        const normalizedFormat = this.normalizeCurrencyTokens(format);
        const maskFormat = this.normalizeCurrencyTokens(bare);
        const { scaledValue, scaledFormat } = this.scaleValue(value, maskFormat);
        const analysisScaledFormat = this.stripQuotedAndEscapedLiterals(scaledFormat);
        const thousands = /[#0?],[#0?]/.test(analysisScaledFormat);
        const decimals = this.countDecimalPlaces(analysisScaledFormat);
        return this.applyNumberMask(scaledValue, normalizedFormat, analysisFormat, thousands, decimals);
    }

    private static applyNumberMask(
        value: number,
        format: string,
        analysisFormat: string,
        thousands: boolean,
        decimals: number,
    ): string {
        const sign = value < 0 ? '-' : '';
        const absolute = Math.abs(value);

        const literalFormat = this.stripLocaleTokens(format);
        const cleaned = this.stripFormattingLiterals(literalFormat);
        if (this.requiresComplexNumberMask(analysisFormat)) {
            const formattedComplex = this.applyComplexNumberMask(absolute, analysisFormat.replace(/[#?]/g, '0'));
            const result = this.replaceLastToken(cleaned, analysisFormat, formattedComplex);

            if (!sign) {
                return result;
            }

            if (/^[^0-9#?]+/.test(cleaned)) {
                return result.replace(/^([^0-9]+)/, `$1${sign}`);
            }

            return sign + result;
        }

        const numberToken = analysisFormat.match(/[#,0?]+(?:\.[#,0?]+)?/);
        if (!numberToken) {
            return sign + cleaned.replace(/\?/g, '');
        }

        const resultNumber = this.formatMaskedNumber(absolute, numberToken[0], thousands, decimals);
        let result = this.replaceLastToken(this.stripFormattingLiterals(literalFormat), numberToken[0], resultNumber);
        if (this.shouldStripLeadingZero(numberToken[0])) {
            result = result.replace(/(^|\D)0\./, '$1.');
        }

        const adjustedResult = this.adjustSeparators(result);
        if (!sign) {
            return adjustedResult;
        }

        if (/^[^0-9#?]+/.test(cleaned)) {
            return adjustedResult.replace(/^([^0-9]+)/, `$1${sign}`);
        }

        return sign + adjustedResult;
    }

    private static formatMaskedNumber(value: number, token: string, thousands: boolean, decimals: number): string {
        const roundedValue = this.roundHalfUp(value, decimals);
        let rendered = roundedValue.toFixed(decimals);
        const [integerMask = '', decimalMask = ''] = token.split('.');

        if (thousands) {
            const parts = rendered.split('.');
            parts[0] = parts[0]!.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
            rendered = parts.join('.');
        }

        const [integerPart = '', decimalPart = ''] = rendered.split('.');
        let formattedInteger = this.formatIntegerMask(integerPart, integerMask);
        if (
            integerMask.replace(/,/g, '') === '?' &&
            Number(integerPart.replace(/,/g, '') || '0') === 0 &&
            decimalMask
        ) {
            formattedInteger = '';
        }
        const formattedDecimal = this.formatDecimalMask(decimalPart, decimalMask);

        return formattedDecimal ? `${formattedInteger}.${formattedDecimal}` : formattedInteger;
    }

    private static formatIntegerMask(integerPart: string, integerMask: string): string {
        const normalizedMask = integerMask.replace(/,/g, '');
        if (/^0+$/.test(normalizedMask)) {
            return integerPart.replace(/,/g, '').padStart(normalizedMask.length, '0');
        }

        if (!integerMask.includes('?')) {
            return integerPart;
        }

        const digitSource = integerPart.replace(/,/g, '');
        const optionalOnlyMask = !/[0#]/.test(integerMask.replace(/,/g, ''));
        const normalizedDigitSource = optionalOnlyMask && Number(digitSource || '0') === 0 ? '' : digitSource;
        let digitIndex = normalizedDigitSource.length - 1;
        let result = '';

        for (let index = integerMask.length - 1; index >= 0; index--) {
            const placeholder = integerMask[index]!;
            if (placeholder === '?' || placeholder === '0' || placeholder === '#') {
                if (digitIndex >= 0) {
                    result = `${normalizedDigitSource[digitIndex]!}${result}`;
                    digitIndex -= 1;
                    continue;
                }

                if (placeholder === '?') {
                    result = ` ${result}`;
                } else if (placeholder === '0') {
                    result = `0${result}`;
                }

                continue;
            }

            if (placeholder === ',') {
                if (digitIndex >= 0 && /\d/.test(result)) {
                    result = `,${result}`;
                }

                continue;
            }

            result = `${placeholder}${result}`;
        }

        if (digitIndex >= 0) {
            result = `${normalizedDigitSource.slice(0, digitIndex + 1)}${result}`;
        }

        if (integerMask.includes(',') && !result.includes(',')) {
            result = result.trimStart();
        }

        return result || '0';
    }

    private static formatDecimalMask(decimalPart: string, decimalMask: string): string {
        if (!decimalMask) {
            return '';
        }

        const significantDecimals = decimalPart.replace(/0+$/u, '').length;
        const requiredDecimals = [...decimalMask].filter((char) => char === '0').length;
        const visibleDecimals = Math.min(decimalMask.length, Math.max(requiredDecimals, significantDecimals));
        let result = '';

        for (let index = 0; index < decimalMask.length; index++) {
            const placeholder = decimalMask[index]!;
            if (index < visibleDecimals) {
                result += decimalPart[index] ?? '0';
            } else if (placeholder === '?') {
                result += ' ';
            } else if (placeholder === '0') {
                result += '0';
            }
        }

        if (visibleDecimals === 0 && requiredDecimals === 0) {
            return result.trimEnd() ? result : '';
        }

        return result;
    }

    private static requiresComplexNumberMask(format: string): boolean {
        return /0([^\d.]+)0/.test(format) || (format.match(/\./g)?.length ?? 0) > 1;
    }

    private static applyComplexNumberMask(value: number, mask: string): string {
        if (Math.abs(value) >= 1e18) {
            return this.numberToPlainString(value);
        }

        let adjustedValue = value;
        if (Number.isInteger(value) && (mask.match(/\./g)?.length ?? 0) === 1) {
            adjustedValue *= Math.pow(10, mask.split('.')[1]?.length ?? 0);
        }

        return this.applyComplexNumberMaskInternal(adjustedValue, mask, true);
    }

    private static applyComplexNumberMaskInternal(value: number | string, mask: string, splitOnPoint: boolean): string {
        const numericValue = Number(value);
        const absoluteValue = Math.abs(numericValue);
        const roundedValue = splitOnPoint ? this.roundComplexValue(absoluteValue, mask) : absoluteValue;
        const sign = numericValue < 0 ? '-' : '';
        const number = this.numberToPlainString(roundedValue);

        if (splitOnPoint && mask.includes('.') && number.includes('.')) {
            const numbers = number.split('.');
            let masks = mask.split('.');

            if (masks.length > 2) {
                masks = this.mergeComplexNumberFormatMasks(numbers, masks);
            }

            const integerPart = this.applyComplexNumberMaskInternal(numbers[0] ?? '0', masks[0] ?? '', false);
            const decimalMask = masks[1] ?? '';
            const decimalSource = (numbers[1] ?? '').padEnd(decimalMask.length, '0');
            const decimalPart = this.reverseString(
                this.applyComplexNumberMaskInternal(
                    this.reverseString(decimalSource),
                    this.reverseString(decimalMask),
                    false,
                ),
            ).slice(0, decimalMask.length);

            return `${sign}${integerPart}.${decimalPart}`;
        }

        let digits = number;
        const placeholderCount = (mask.match(/0/g) ?? []).length;
        if (digits.length < placeholderCount) {
            digits = digits.padStart(placeholderCount, '0');
        }

        return `${sign}${this.processComplexNumberFormatMask(digits, mask)}`;
    }

    private static mergeComplexNumberFormatMasks(numbers: string[], masks: string[]): string[] {
        let decimalCount = (numbers[1] ?? '').length;
        const postDecimalMasks: string[] = [];

        do {
            const tempMask = masks.pop();
            if (tempMask !== undefined) {
                postDecimalMasks.push(tempMask);
                decimalCount -= tempMask.length;
            }
        } while (postDecimalMasks.at(-1) !== undefined && decimalCount > 0);

        return [masks.join('.'), postDecimalMasks.reverse().join('.')];
    }

    private static processComplexNumberFormatMask(number: string, mask: string): string {
        let result = mask;
        let remaining = number;
        const blocks = [...mask.matchAll(/0+/g)];

        if (blocks.length === 0) {
            return result;
        }

        let insertOffset = 0;
        for (let index = blocks.length - 1; index >= 0; index--) {
            const block = blocks[index]!;
            const size = block[0].length;
            const offset = block.index ?? 0;

            insertOffset = offset;
            const digits = remaining.slice(-size).padStart(size, '0');
            remaining = remaining.slice(0, Math.max(0, remaining.length - size));
            result = `${result.slice(0, offset)}${digits}${result.slice(offset + size)}`;
        }

        if (remaining.length > 0 && Number(remaining) > 0) {
            result = `${result.slice(0, insertOffset)}${remaining}${result.slice(insertOffset)}`;
        }

        return result;
    }

    private static roundComplexValue(value: number, mask: string): number {
        const masks = mask.split('.');
        if (masks.length <= 2) {
            const decimalMask = masks[1] ?? '';
            const decimalPlaces = (decimalMask.match(/0/g) ?? []).length;
            return this.roundHalfUp(value, decimalPlaces);
        }

        return value;
    }

    private static shouldStripLeadingZero(token: string): boolean {
        const integerMask = (token.split('.')[0] ?? '').replace(/,/g, '');
        return integerMask.includes('#') || integerMask.includes('?') ? !integerMask.includes('0') : false;
    }

    private static roundHalfUp(value: number, decimals: number): number {
        if (decimals <= 0) {
            return Math.sign(value) * Math.round(Math.abs(value) + Number.EPSILON);
        }

        const factor = Math.pow(10, decimals);
        return (Math.sign(value) * Math.round(Math.abs(value) * factor + Number.EPSILON)) / factor;
    }

    private static numberToPlainString(value: number): string {
        const valueString = String(value);
        if (!/[eE]/.test(valueString)) {
            return valueString;
        }

        const [coefficient = '0', exponentPart = '0'] = valueString.toLowerCase().split('e');
        const exponent = Number(exponentPart);
        const digits = coefficient.replace('.', '');
        const decimalIndex = coefficient.includes('.') ? coefficient.indexOf('.') : coefficient.length;
        const nextIndex = decimalIndex + exponent;

        if (nextIndex <= 0) {
            return `0.${'0'.repeat(-nextIndex)}${digits}`;
        }
        if (nextIndex >= digits.length) {
            return `${digits}${'0'.repeat(nextIndex - digits.length)}`;
        }

        return `${digits.slice(0, nextIndex)}.${digits.slice(nextIndex)}`;
    }

    private static reverseString(value: string): string {
        return [...value].reverse().join('');
    }

    private static adjustSeparators(value: string): string {
        const thousandsSeparator = getThousandsSeparator();
        const decimalSeparator = getDecimalSeparator();
        if (thousandsSeparator === ',' && decimalSeparator === '.') {
            return value;
        }

        const placeholder = '__DECIMAL_SEPARATOR__';

        return value
            .replace(/\./g, placeholder)
            .replace(/,/g, thousandsSeparator)
            .replaceAll(placeholder, decimalSeparator);
    }

    private static formatGeneral(value: number, lessFloatPrecision: boolean): string {
        if (Number.isInteger(value)) {
            return this.adjustSeparators(String(value));
        }
        if (lessFloatPrecision) {
            return this.adjustSeparators(String(Number(value.toPrecision(10))));
        }
        if (Math.abs(value) >= 1e-10 && Math.abs(value) < 1e10) {
            return this.adjustSeparators(value.toPrecision(10).replace(/(?:\.0+|(?:(\.[0-9]*?)0+))$/, '$1'));
        }

        const exponential = value.toExponential(6).replace('e', 'E');
        const trimmed = exponential
            .replace(/(\.\d*?[1-9])0+(E[+-]?\d+)$/u, '$1$2')
            .replace(/\.0+(E[+-]?\d+)$/u, '.0$1');
        return this.adjustSeparators(trimmed);
    }

    private static scaleValue(value: number, format: string): { scaledValue: number; scaledFormat: string } {
        let scaledFormat = format;
        let scaledValue = value;

        scaledFormat = scaledFormat.replace(/([#0?])((?:,+))(?![#,0?])/g, (_match, digit: string, commas: string) => {
            scaledValue /= Math.pow(1000, commas.length);
            return digit;
        });

        return { scaledValue, scaledFormat };
    }

    private static formatDateTime(value: number, format: string): string {
        const date = this.excelSerialToDate(value);
        if (date === null) {
            return String(value);
        }

        const absoluteValue = Math.abs(value);
        const hoursTotal = Math.floor(absoluteValue * 24);
        const minutesTotal = Math.floor(absoluteValue * 24 * 60);
        const secondsTotal = Math.floor(absoluteValue * 24 * 60 * 60);
        const secondPrecision = this.getSecondPrecision(format);
        const displayDate = new Date(Math.round(date.getTime() / (1000 / secondPrecision)) * (1000 / secondPrecision));

        let output = '';
        let inQuotes = false;
        for (let index = 0; index < format.length; index++) {
            const char = format[index]!;
            if (char === '"') {
                inQuotes = !inQuotes;
                continue;
            }
            if (inQuotes) {
                output += char;
                continue;
            }
            if (char === '\\') {
                output += format[index + 1] ?? '';
                index += 1;
                continue;
            }
            if (char === '[') {
                const end = format.indexOf(']', index);
                const token = end >= 0 ? format.slice(index, end + 1).toLowerCase() : '';
                if (token === '[h]' || token === '[hh]') {
                    output += token === '[hh]' ? String(hoursTotal).padStart(2, '0') : String(hoursTotal);
                    index = end;
                    continue;
                }
                if (token === '[m]' || token === '[mm]') {
                    output += token === '[mm]' ? String(minutesTotal).padStart(2, '0') : String(minutesTotal);
                    index = end;
                    continue;
                }
                if (token === '[s]' || token === '[ss]') {
                    output += token === '[ss]' ? String(secondsTotal).padStart(2, '0') : String(secondsTotal);
                    index = end;
                    continue;
                }
            }

            const remaining = format.slice(index);
            const lowerRemaining = remaining.toLowerCase();
            if (lowerRemaining.startsWith('am/pm')) {
                output += displayDate.getHours() >= 12 ? 'PM' : 'AM';
                index += 4;
                continue;
            }
            if (lowerRemaining.startsWith('a/p')) {
                output += displayDate.getHours() >= 12 ? 'P' : 'A';
                index += 2;
                continue;
            }
            if (lowerRemaining.startsWith('yyyy')) {
                output += String(displayDate.getFullYear()).padStart(4, '0');
                index += 3;
                continue;
            }
            if (lowerRemaining.startsWith('yy')) {
                output += String(displayDate.getFullYear() % 100).padStart(2, '0');
                index += 1;
                continue;
            }
            if (lowerRemaining.startsWith('dddd')) {
                output += this.WEEKDAYS[displayDate.getDay()]!;
                index += 3;
                continue;
            }
            if (lowerRemaining.startsWith('ddd')) {
                output += this.WEEKDAYS[displayDate.getDay()]!.slice(0, 3);
                index += 2;
                continue;
            }
            if (!this.isMinuteToken(format, index) && lowerRemaining.startsWith('mmmmm')) {
                output += this.MONTHS[displayDate.getMonth()]![0]!;
                index += 4;
                continue;
            }
            if (!this.isMinuteToken(format, index) && lowerRemaining.startsWith('mmmm')) {
                output += this.MONTHS[displayDate.getMonth()]!;
                index += 3;
                continue;
            }
            if (!this.isMinuteToken(format, index) && lowerRemaining.startsWith('mmm')) {
                output += this.MONTHS[displayDate.getMonth()]!.slice(0, 3);
                index += 2;
                continue;
            }
            if (lowerRemaining.startsWith('dd')) {
                output += String(displayDate.getDate()).padStart(2, '0');
                index += 1;
                continue;
            }
            if (lowerRemaining.startsWith('d')) {
                output += String(displayDate.getDate());
                continue;
            }
            if (lowerRemaining.startsWith('hh')) {
                output += this.formatHour(displayDate, format, index, true);
                index += 1;
                continue;
            }
            if (lowerRemaining.startsWith('h')) {
                output += this.formatHour(displayDate, format, index, false);
                continue;
            }
            if (lowerRemaining.startsWith('mm')) {
                output += this.isMinuteToken(format, index)
                    ? String(displayDate.getMinutes()).padStart(2, '0')
                    : String(displayDate.getMonth() + 1).padStart(2, '0');
                index += 1;
                continue;
            }
            if (lowerRemaining.startsWith('m')) {
                output += this.isMinuteToken(format, index)
                    ? String(displayDate.getMinutes())
                    : String(displayDate.getMonth() + 1);
                continue;
            }
            if (lowerRemaining.startsWith('ss.000')) {
                const rounded = this.roundSecondsFraction(displayDate, 1000);
                output += `${String(rounded.seconds).padStart(2, '0')}.${String(rounded.fraction).padStart(3, '0')}`;
                index += 5;
                continue;
            }
            if (lowerRemaining.startsWith('ss.00')) {
                const rounded = this.roundSecondsFraction(displayDate, 100);
                output += `${String(rounded.seconds).padStart(2, '0')}.${String(rounded.fraction).padStart(2, '0')}`;
                index += 4;
                continue;
            }
            if (lowerRemaining.startsWith('ss.0')) {
                const rounded = this.roundSecondsFraction(displayDate, 10);
                output += `${String(rounded.seconds).padStart(2, '0')}.${rounded.fraction}`;
                index += 3;
                continue;
            }
            if (lowerRemaining.startsWith('ss')) {
                output += String(displayDate.getSeconds()).padStart(2, '0');
                index += 1;
                continue;
            }
            if (lowerRemaining.startsWith('s')) {
                output += String(displayDate.getSeconds());
                continue;
            }

            output += char;
        }

        return output;
    }

    private static formatHour(date: Date, format: string, index: number, padded: boolean): string {
        const useTwelveHour = /am\/pm/i.test(format);
        let hour = date.getHours();
        if (useTwelveHour) {
            hour = hour % 12 || 12;
        }
        return padded ? String(hour).padStart(2, '0') : String(hour);
    }

    private static isMinuteToken(format: string, index: number): boolean {
        const previous = format[index - 1] ?? '';
        const next = format[index + 2] ?? format[index + 1] ?? '';
        const lookBehind = format.slice(Math.max(0, index - 3), index).toLowerCase();
        const lookAhead = format.slice(index + 1, index + 4).toLowerCase();
        return previous === ':' || next === ':' || lookBehind.includes('h') || lookAhead.includes('s');
    }

    private static roundSecondsFraction(date: Date, precision: number): { seconds: number; fraction: number } {
        return {
            seconds: date.getSeconds(),
            fraction:
                precision === 1000
                    ? date.getMilliseconds()
                    : precision === 100
                      ? Math.floor(date.getMilliseconds() / 10)
                      : Math.floor(date.getMilliseconds() / 100),
        };
    }

    private static getSecondPrecision(format: string): number {
        const loweredFormat = format.toLowerCase();
        if (loweredFormat.includes('ss.000')) {
            return 1000;
        }
        if (loweredFormat.includes('ss.00')) {
            return 100;
        }
        if (loweredFormat.includes('ss.0')) {
            return 10;
        }

        return 1;
    }

    private static excelSerialToDate(serial: number): Date | null {
        if (!Number.isFinite(serial)) {
            return null;
        }
        const wholeDays = Math.floor(serial);
        const fractionalDay = serial - wholeDays;
        const epoch = wholeDays < 60 ? new Date(1899, 11, 31) : new Date(1899, 11, 30);
        return new Date(epoch.getTime() + (wholeDays + fractionalDay) * 86400000);
    }

    private static stripFormattingLiterals(format: string): string {
        return format
            .replace(/"([^"]*)"/g, '$1')
            .replace(/\\(.)/g, '$1')
            .replace(/\*/g, '')
            .replace(/_/g, '');
    }

    private static stripBracketExpressions(format: string): string {
        return format.replace(/\[[^\]]+\]/g, '');
    }

    private static stripLocaleTokens(format: string): string {
        return format.replace(/\[\$-[^\]]+\]/gi, '');
    }

    private static stripQuotedAndEscapedLiterals(format: string): string {
        let result = '';
        let inQuotes = false;

        for (let index = 0; index < format.length; index++) {
            const char = format[index]!;
            if (char === '"') {
                inQuotes = !inQuotes;
                continue;
            }

            if (char === '\\') {
                index += 1;
                continue;
            }

            if (!inQuotes) {
                result += char;
            }
        }

        return result;
    }

    private static normalizeCurrencyTokens(format: string): string {
        return format.replace(/\[\$([^\]]*)\]/g, (_match, token: string) => {
            const symbol = token.split('-')[0] ?? '';
            return symbol.startsWith('-') ? '' : symbol;
        });
    }

    private static countDecimalPlaces(format: string): number {
        const match = format.match(/\.(?:[0#?]+)/);
        return match ? match[0].length - 1 : 0;
    }

    private static containsUnquotedToken(format: string, token: string): boolean {
        let inQuotes = false;
        for (let i = 0; i < format.length; i++) {
            const char = format[i]!;
            if (char === '\\') {
                i += 1;
                continue;
            }
            if (char === '"') {
                inQuotes = !inQuotes;
            } else if (!inQuotes && format.startsWith(token, i)) {
                return true;
            }
        }
        return false;
    }

    private static replaceOutsideQuotes(
        format: string,
        pattern: RegExp,
        replacement: string | ((substring: string) => string),
    ): string {
        const segments = this.splitQuotedSegments(format);
        return segments
            .map((segment) => {
                if (segment.quoted) {
                    return segment.value;
                }

                if (typeof replacement === 'string') {
                    return segment.value.replace(pattern, replacement);
                }

                return segment.value.replace(pattern, replacement);
            })
            .join('');
    }

    private static replaceLastToken(format: string, token: string, replacement: string): string {
        const index = format.lastIndexOf(token);
        if (index < 0) {
            return format;
        }

        return `${format.slice(0, index)}${replacement}${format.slice(index + token.length)}`;
    }

    private static getFractionDecimalPortion(value: number): string {
        const text = value.toString();
        const match = text.match(/^\d*\.(\d*[1-9])0*$/);
        return match?.[1] ?? '0';
    }

    private static splitQuotedSegments(format: string): { quoted: boolean; value: string }[] {
        const segments: { quoted: boolean; value: string }[] = [];
        let current = '';
        let quoted = false;

        for (let i = 0; i < format.length; i++) {
            const char = format[i]!;
            if (char === '"') {
                current += char;
                if (quoted) {
                    segments.push({ quoted: true, value: current });
                    current = '';
                } else if (current.length > 1) {
                    segments.push({ quoted: false, value: current.slice(0, -1) });
                    current = '"';
                }
                quoted = !quoted;
            } else {
                current += char;
            }
        }

        if (current) {
            segments.push({ quoted, value: current });
        }

        return segments;
    }

    private static splitSections(format: string): string[] {
        const sections: string[] = [];
        let current = '';
        let inQuotes = false;
        for (let index = 0; index < format.length; index++) {
            const char = format[index]!;
            if (char === '\\') {
                current += char;
                current += format[index + 1] ?? '';
                index += 1;
                continue;
            }
            if (char === '"') {
                inQuotes = !inQuotes;
                current += char;
                continue;
            }
            if (!inQuotes && char === ';') {
                sections.push(current);
                current = '';
                continue;
            }
            current += char;
        }
        sections.push(current);
        return sections;
    }

    private static gcd(a: number, b: number): number {
        let left = Math.abs(a);
        let right = Math.abs(b);
        while (right !== 0) {
            const remainder = left % right;
            left = right;
            right = remainder;
        }
        return left || 1;
    }

    private static readonly WEEKDAYS = [
        'Sunday',
        'Monday',
        'Tuesday',
        'Wednesday',
        'Thursday',
        'Friday',
        'Saturday',
    ] as const;

    private static readonly MONTHS = [
        'January',
        'February',
        'March',
        'April',
        'May',
        'June',
        'July',
        'August',
        'September',
        'October',
        'November',
        'December',
    ] as const;
}
