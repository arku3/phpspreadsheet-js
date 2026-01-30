import { FunctionRegistry } from '../function-registry.ts';
import { Helpers } from '../helpers.ts';
import type { FunctionCategory } from './function-category.ts';

/**
 * Excel Date/Time functions.
 * Excel stores dates as serial numbers where day 1 = 1900-01-01.
 */
export class DateTime implements FunctionCategory {
    // Excel epoch starts at 1900-01-01
    private static readonly EXCEL_EPOCH_OFFSET = 25569;

    public register(registry: FunctionRegistry): void {
        // TODAY - Returns current date as Excel serial
        registry.register(
            'TODAY',
            () => {
                const today = new Date();
                today.setHours(0, 0, 0, 0);
                return this.dateToExcel(today);
            },
            0,
            0,
        );

        // NOW - Returns current date/time as Excel serial
        registry.register(
            'NOW',
            () => {
                return this.dateToExcel(new Date());
            },
            0,
            0,
        );

        // DATE - Returns Excel serial for year, month, day
        registry.register(
            'DATE',
            (args) => {
                const year = Number(Helpers.asScalar(args[0])) || 0;
                const month = Number(Helpers.asScalar(args[1])) || 0;
                const day = Number(Helpers.asScalar(args[2])) || 0;
                return this.DATE(year, month, day);
            },
            3,
            3,
        );

        // YEAR - Returns year from date
        registry.register(
            'YEAR',
            (args) => {
                const serial = Number(Helpers.asScalar(args[0])) || 0;
                const date = this.parseDate(serial);
                if (!date) return '#VALUE!';
                return date.getFullYear();
            },
            1,
            1,
        );

        // MONTH - Returns month from date (1-12)
        registry.register(
            'MONTH',
            (args) => {
                const serial = Number(Helpers.asScalar(args[0])) || 0;
                const date = this.parseDate(serial);
                if (!date) return '#VALUE!';
                return date.getMonth() + 1;
            },
            1,
            1,
        );

        // DAY - Returns day of month from date
        registry.register(
            'DAY',
            (args) => {
                const serial = Number(Helpers.asScalar(args[0])) || 0;
                const date = this.parseDate(serial);
                if (!date) return '#VALUE!';
                return date.getDate();
            },
            1,
            1,
        );

        // WEEKDAY - Returns day of week (1=Sunday by default)
        registry.register(
            'WEEKDAY',
            (args) => {
                const serial = Number(Helpers.asScalar(args[0])) || 0;
                const returnType = args[1] !== undefined ? Number(Helpers.asScalar(args[1])) : 1;
                const date = this.parseDate(serial);
                if (!date) return '#VALUE!';

                const dayOfWeek = date.getDay(); // 0=Sunday
                switch (returnType) {
                    case 1:
                        return dayOfWeek + 1; // 1=Sunday
                    case 2:
                        return dayOfWeek === 0 ? 7 : dayOfWeek; // 1=Monday
                    case 3:
                        return dayOfWeek === 0 ? 6 : dayOfWeek - 1; // 0=Monday
                    default:
                        return '#NUM!';
                }
            },
            1,
            2,
        );

        // HOUR - Returns hour (0-23)
        registry.register(
            'HOUR',
            (args) => {
                const serial = Number(Helpers.asScalar(args[0])) || 0;
                const date = this.parseDate(serial);
                if (!date) return '#VALUE!';
                return date.getHours();
            },
            1,
            1,
        );

        // MINUTE - Returns minute (0-59)
        registry.register(
            'MINUTE',
            (args) => {
                const serial = Number(Helpers.asScalar(args[0])) || 0;
                const date = this.parseDate(serial);
                if (!date) return '#VALUE!';
                return date.getMinutes();
            },
            1,
            1,
        );

        // SECOND - Returns second (0-59)
        registry.register(
            'SECOND',
            (args) => {
                const serial = Number(Helpers.asScalar(args[0])) || 0;
                const date = this.parseDate(serial);
                if (!date) return '#VALUE!';
                return date.getSeconds();
            },
            1,
            1,
        );

        // TIME - Returns time serial for hour, minute, second
        registry.register(
            'TIME',
            (args) => {
                const hour = Number(Helpers.asScalar(args[0])) || 0;
                const minute = Number(Helpers.asScalar(args[1])) || 0;
                const second = Number(Helpers.asScalar(args[2])) || 0;
                const totalSeconds = hour * 3600 + minute * 60 + second;
                return totalSeconds / 86400;
            },
            3,
            3,
        );

        // DATEDIF - Returns difference between dates in specified unit
        registry.register(
            'DATEDIF',
            (args) => {
                const startDate = Number(Helpers.asScalar(args[0])) || 0;
                const endDate = Number(Helpers.asScalar(args[1])) || 0;
                const unit = String(Helpers.asScalar(args[2]) || 'D').toUpperCase();
                return this.DATEDIF(startDate, endDate, unit);
            },
            3,
            3,
        );

        // EOMONTH - Returns last day of month, n months away
        registry.register(
            'EOMONTH',
            (args) => {
                const startDate = Number(Helpers.asScalar(args[0])) || 0;
                const months = Number(Helpers.asScalar(args[1])) || 0;
                const date = this.parseDate(startDate);
                if (!date) return '#VALUE!';
                const targetDate = new Date(date.getFullYear(), date.getMonth() + months + 1, 0);
                return this.dateToExcel(targetDate);
            },
            2,
            2,
        );

        // EDATE - Returns date n months from start date
        registry.register(
            'EDATE',
            (args) => {
                const startDate = Number(Helpers.asScalar(args[0])) || 0;
                const months = Number(Helpers.asScalar(args[1])) || 0;
                const date = this.parseDate(startDate);
                if (!date) return '#VALUE!';
                const targetDate = new Date(date.getFullYear(), date.getMonth() + months, date.getDate());
                return this.dateToExcel(targetDate);
            },
            2,
            2,
        );
    }

    private excelToDate(serial: number): Date {
        const milliseconds = (serial - DateTime.EXCEL_EPOCH_OFFSET) * 24 * 60 * 60 * 1000;
        return new Date(milliseconds);
    }

    private dateToExcel(date: Date): number {
        return date.getTime() / (24 * 60 * 60 * 1000) + DateTime.EXCEL_EPOCH_OFFSET;
    }

    private parseDate(value: number): Date | null {
        if (isNaN(value) || value < 0) return null;
        return this.excelToDate(value);
    }

    private DATE(year: number, month: number, day: number): number | string {
        if (year < 0) year = Math.abs(year);
        if (year < 100) year = year < 30 ? 2000 + year : 1900 + year;

        while (month > 12) {
            month -= 12;
            year++;
        }
        while (month < 1) {
            month += 12;
            year--;
        }

        const date = new Date(year, month - 1, 1);
        date.setDate(day);

        if (isNaN(date.getTime())) return '#NUM!';
        return this.dateToExcel(date);
    }

    private DATEDIF(startDate: number, endDate: number, unit: string): number | string {
        const start = this.parseDate(startDate);
        const end = this.parseDate(endDate);
        if (!start || !end) return '#VALUE!';

        switch (unit) {
            case 'D':
                return Math.floor((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
            case 'M':
                return (
                    (end.getFullYear() - start.getFullYear()) * 12 +
                    (end.getMonth() - start.getMonth()) -
                    (end.getDate() < start.getDate() ? 1 : 0)
                );
            case 'Y': {
                let years = end.getFullYear() - start.getFullYear();
                if (
                    end.getMonth() < start.getMonth() ||
                    (end.getMonth() === start.getMonth() && end.getDate() < start.getDate())
                ) {
                    years--;
                }
                return years;
            }
            case 'MD': {
                const dayDiff = end.getDate() - start.getDate();
                return dayDiff < 0 ? dayDiff + 30 : dayDiff;
            }
            case 'YM': {
                let months = end.getMonth() - start.getMonth();
                if (end.getDate() < start.getDate()) months--;
                return months < 0 ? months + 12 : months;
            }
            case 'YD': {
                const startCopy = new Date(start);
                startCopy.setFullYear(end.getFullYear());
                return Math.floor((end.getTime() - startCopy.getTime()) / (1000 * 60 * 60 * 24));
            }
            default:
                return '#NUM!';
        }
    }
}
