import { NumberFormat } from './number-format.ts';

/**
 * Formats numeric values according to Excel number format codes.
 * Basic implementation - supports common format codes.
 */
export class NumberFormatter {
    /**
     * Format a value according to the given format code.
     *
     * @param value The value to format
     * @param format The format code (e.g., '0.00', '#,##0', 'yyyy-mm-dd')
     * @returns The formatted string
     */
    public static toFormattedString(
        value: number | string | null | undefined,
        format: string,
    ): string {
        if (value === null || value === undefined) {
            return '';
        }

        const numValue = typeof value === 'string' ? parseFloat(value) : value;

        if (isNaN(numValue)) {
            return String(value);
        }

        // Handle built-in formats by code
        const builtInFormat = this.getBuiltInFormat(format);
        if (builtInFormat) {
            return this.formatWithBuiltin(numValue, builtInFormat);
        }

        // Handle custom formats
        return this.formatCustom(numValue, format);
    }

    /**
     * Get built-in format info by format code.
     */
    private static getBuiltInFormat(
        format: string,
    ): { type: string; decimals: number; thousands: boolean } | null {
        // Common built-in format codes
        const formatMap: Record<string, { type: string; decimals: number; thousands: boolean }> = {
            General: { type: 'general', decimals: 0, thousands: false },
            '0': { type: 'number', decimals: 0, thousands: false },
            '0.00': { type: 'number', decimals: 2, thousands: false },
            '#,##0': { type: 'number', decimals: 0, thousands: true },
            '#,##0.00': { type: 'number', decimals: 2, thousands: true },
            '0%': { type: 'percentage', decimals: 0, thousands: false },
            '0.00%': { type: 'percentage', decimals: 2, thousands: false },
            '$#,##0': { type: 'currency', decimals: 0, thousands: false },
            '$#,##0.00': { type: 'currency', decimals: 2, thousands: false },
            'yyyy-mm-dd': { type: 'date', decimals: 0, thousands: false },
            'm/d/yyyy': { type: 'date', decimals: 0, thousands: false },
            'h:mm:ss': { type: 'time', decimals: 0, thousands: false },
            'h:mm': { type: 'time', decimals: 0, thousands: false },
        };

        return formatMap[format] || null;
    }

    /**
     * Format using built-in format type.
     */
    private static formatWithBuiltin(
        value: number,
        format: { type: string; decimals: number; thousands: boolean },
    ): string {
        switch (format.type) {
            case 'general':
                return this.formatGeneral(value);
            case 'number':
                return this.formatNumber(value, format.decimals, format.thousands);
            case 'percentage':
                return this.formatPercentage(value, format.decimals);
            case 'currency':
                return this.formatCurrency(value, format.decimals);
            case 'date':
                return this.formatDate(value);
            case 'time':
                return this.formatTime(value);
            default:
                return String(value);
        }
    }

    /**
     * Format in general style (auto-detect appropriate format).
     */
    private static formatGeneral(value: number): string {
        // For integers, show as-is
        if (Number.isInteger(value)) {
            return String(value);
        }

        // For small numbers, show up to 10 significant digits
        if (Math.abs(value) < 1e10 && Math.abs(value) > 1e-10) {
            return value.toPrecision(10).replace(/\.?0+$/, '');
        }

        // For very large or small numbers, use scientific notation
        return value.toExponential(6);
    }

    /**
     * Format as number with decimal places.
     */
    private static formatNumber(value: number, decimals: number, thousands: boolean): string {
        let formatted = value.toFixed(decimals);

        if (thousands) {
            const parts = formatted.split('.');
            parts[0] = parts[0]!.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
            formatted = parts.join('.');
        }

        return formatted;
    }

    /**
     * Format as percentage.
     */
    private static formatPercentage(value: number, decimals: number): string {
        return (value * 100).toFixed(decimals) + '%';
    }

    /**
     * Format as currency.
     */
    private static formatCurrency(value: number, decimals: number): string {
        const formatted = this.formatNumber(Math.abs(value), decimals, true);
        const sign = value < 0 ? '-' : '';
        return sign + '$' + formatted;
    }

    /**
     * Format Excel date serial number as date string.
     */
    private static formatDate(value: number): string {
        // Excel date serial number to JavaScript Date
        // Excel epoch is 1900-01-01, but has a leap year bug
        const excelEpoch = new Date(1899, 11, 30); // Dec 30, 1899
        const milliseconds = value * 24 * 60 * 60 * 1000;
        const date = new Date(excelEpoch.getTime() + milliseconds);

        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');

        return `${year}-${month}-${day}`;
    }

    /**
     * Format Excel time fraction as time string.
     */
    private static formatTime(value: number): string {
        // Time is stored as fraction of a day
        const totalSeconds = Math.round(value * 24 * 60 * 60);
        const hours = Math.floor(totalSeconds / 3600) % 24;
        const minutes = Math.floor((totalSeconds % 3600) / 60);
        const seconds = totalSeconds % 60;

        const h = String(hours).padStart(2, '0');
        const m = String(minutes).padStart(2, '0');
        const s = String(seconds).padStart(2, '0');

        return `${h}:${m}:${s}`;
    }

    /**
     * Format with custom format string.
     */
    private static formatCustom(value: number, format: string): string {
        // Basic custom format parsing

        // Handle date formats
        if (
            format.includes('yyyy') ||
            format.includes('mm') ||
            format.includes('dd') ||
            format.includes('m/d') ||
            format.includes('d-mmm')
        ) {
            return this.formatDate(value);
        }

        // Handle time formats
        if (
            format.includes('h:') ||
            format.includes('hh:') ||
            format.includes(':mm') ||
            format.includes(':ss')
        ) {
            return this.formatTime(value);
        }

        // Handle percentage
        if (format.includes('%')) {
            const decimals = this.countDecimalPlaces(format);
            return this.formatPercentage(value, decimals);
        }

        // Handle currency with $ symbol
        if (format.includes('$')) {
            const decimals = this.countDecimalPlaces(format);
            return this.formatCurrency(value, decimals);
        }

        // Handle thousands separator
        if (format.includes('#,##0') || format.includes('#,##0.00')) {
            const decimals = this.countDecimalPlaces(format);
            return this.formatNumber(value, decimals, true);
        }

        // Handle decimal places
        if (format.includes('0.')) {
            const decimals = this.countDecimalPlaces(format);
            return this.formatNumber(value, decimals, format.includes(','));
        }

        // Default to general format
        return this.formatGeneral(value);
    }

    /**
     * Count decimal places in format string.
     */
    private static countDecimalPlaces(format: string): number {
        const match = format.match(/\.(0+)/);
        return match ? match[1]!.length : 0;
    }
}
