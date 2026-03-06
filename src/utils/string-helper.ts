/**
 * String helper utilities for sanitizing and formatting text.
 * Based on PhpSpreadsheet's StringHelper class.
 */

/**
 * Control characters that need to be escaped for OOXML.
 * Characters \x00 through \x1f (except \x09, \x0a, \x0d which are tab, newline, carriage return).
 */
const CONTROL_CHARACTERS_KEYS = [
    '\x00',
    '\x01',
    '\x02',
    '\x03',
    '\x04',
    '\x05',
    '\x06',
    '\x07',
    '\x08',
    '\x0b',
    '\x0c',
    '\x0e',
    '\x0f',
    '\x10',
    '\x11',
    '\x12',
    '\x13',
    '\x14',
    '\x15',
    '\x16',
    '\x17',
    '\x18',
    '\x19',
    '\x1a',
    '\x1b',
    '\x1c',
    '\x1d',
    '\x1e',
    '\x1f',
];

const CONTROL_CHARACTERS_VALUES = [
    '_x0000_',
    '_x0001_',
    '_x0002_',
    '_x0003_',
    '_x0004_',
    '_x0005_',
    '_x0006_',
    '_x0007_',
    '_x0008_',
    '_x000B_',
    '_x000C_',
    '_x000E_',
    '_x000F_',
    '_x0010_',
    '_x0011_',
    '_x0012_',
    '_x0013_',
    '_x0014_',
    '_x0015_',
    '_x0016_',
    '_x0017_',
    '_x0018_',
    '_x0019_',
    '_x001A_',
    '_x001B_',
    '_x001C_',
    '_x001D_',
    '_x001E_',
    '_x001F_',
];

/**
 * Map of control character replacements for quick lookup.
 */
const CONTROL_CHAR_MAP: Map<string, string> = new Map();
for (let i = 0; i < CONTROL_CHARACTERS_KEYS.length; i++) {
    CONTROL_CHAR_MAP.set(CONTROL_CHARACTERS_KEYS[i]!, CONTROL_CHARACTERS_VALUES[i]!);
}

let decimalSeparator = '.';
let thousandsSeparator = ',';

/**
 * Convert control characters from PHP/Excel to OOXML format.
 *
 * Excel stores control characters differently than standard XML. This method
 * converts standard control characters to the Excel-specific escape format
 * (e.g., \x00 becomes '_x0000_').
 *
 * It also escapes any existing '_xHHHH_' patterns that might be confused
 * with control character escapes by converting them to '_x005F_xHHHH_'.
 *
 * @param textValue Value to escape
 * @returns Escaped string safe for OOXML
 */
export function controlCharacterPHP2OOXML(textValue: string): string {
    // First, escape any existing '_xHHHH_' patterns that look like control character escapes
    // but aren't. We add _x005F_ (the escape for underscore) before them.
    let result = textValue.replace(/_(x[0-9A-F]{4}_)/g, '_x005F_$1');

    // Then replace actual control characters with their escape sequences
    // We use a more efficient approach than individual replacements
    const chars: string[] = [];
    for (const char of result) {
        const replacement = CONTROL_CHAR_MAP.get(char);
        if (replacement) {
            chars.push(replacement);
        } else {
            chars.push(char);
        }
    }

    return chars.join('');
}

/**
 * Check if a string contains control characters that need escaping.
 *
 * @param textValue Value to check
 * @returns True if the string contains control characters
 */
export function containsControlCharacters(textValue: string): boolean {
    for (const char of textValue) {
        if (CONTROL_CHAR_MAP.has(char)) {
            return true;
        }
    }
    return false;
}

export function countCharactersDbcs(textValue: string): number {
    let count = 0;
    for (const char of textValue) {
        const codePoint = char.codePointAt(0) ?? 0;
        count += codePoint > 0xff ? 2 : 1;
    }
    return count;
}

/**
 * Format a number as a string for XML output.
 * Forces decimal point (.) regardless of locale.
 *
 * @param numericValue Value to format
 * @returns Formatted string
 */
export function formatNumber(numericValue: number | string | null): string {
    if (numericValue === null || numericValue === undefined) {
        return '0';
    }

    const num = typeof numericValue === 'string' ? parseFloat(numericValue) : numericValue;

    if (isNaN(num)) {
        return '0';
    }

    // Convert to string and ensure decimal point is used
    return String(num);
}

export function getDecimalSeparator(): string {
    return decimalSeparator;
}

export function setDecimalSeparator(separator: string | null | undefined): void {
    decimalSeparator = separator && separator.length > 0 ? separator : '.';
}

export function getThousandsSeparator(): string {
    return thousandsSeparator;
}

export function setThousandsSeparator(separator: string | null | undefined): void {
    thousandsSeparator = separator && separator.length > 0 ? separator : ',';
}
