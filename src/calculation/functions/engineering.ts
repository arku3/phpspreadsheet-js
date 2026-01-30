import { FunctionRegistry } from '../function-registry.ts';
import { Helpers } from '../helpers.ts';
import type { FunctionCategory } from './function-category.ts';

/**
 * Excel Engineering functions for complex numbers and conversions.
 */
export class Engineering implements FunctionCategory {
    public register(registry: FunctionRegistry): void {
        // COMPLEX - Convert real and imaginary parts to complex number
        registry.register(
            'COMPLEX',
            (args) => {
                const real = Number(Helpers.asScalar(args[0])) || 0;
                const imaginary = Number(Helpers.asScalar(args[1])) || 0;
                const suffix = args[2] !== undefined ? String(Helpers.asScalar(args[2])) : 'i';

                if (isNaN(real) || isNaN(imaginary)) return '#VALUE!';

                return this.complex(real, imaginary, suffix);
            },
            2,
            3,
        );

        // IMAGINARY - Extract imaginary coefficient
        registry.register(
            'IMAGINARY',
            (args) => {
                const complex = String(Helpers.asScalar(args[0]) || '');
                return this.imaginary(complex);
            },
            1,
            1,
        );

        // IMREAL - Extract real coefficient
        registry.register(
            'IMREAL',
            (args) => {
                const complex = String(Helpers.asScalar(args[0]) || '');
                return this.realPart(complex);
            },
            1,
            1,
        );

        // IMABS - Absolute value (modulus) of complex number
        registry.register(
            'IMABS',
            (args) => {
                const complex = String(Helpers.asScalar(args[0]) || '');
                return this.abs(complex);
            },
            1,
            1,
        );

        // IMARGUMENT - Argument (angle theta) of complex number
        registry.register(
            'IMARGUMENT',
            (args) => {
                const complex = String(Helpers.asScalar(args[0]) || '');
                return this.argument(complex);
            },
            1,
            1,
        );

        // IMCONJUGATE - Complex conjugate
        registry.register(
            'IMCONJUGATE',
            (args) => {
                const complex = String(Helpers.asScalar(args[0]) || '');
                return this.conjugate(complex);
            },
            1,
            1,
        );

        // IMSUM - Sum of complex numbers
        registry.register(
            'IMSUM',
            (args) => {
                if (args.length < 2) return '#VALUE!';
                const numbers = args.map((arg) => String(Helpers.asScalar(arg) || ''));
                return this.sum(numbers);
            },
            2,
            -1,
        );

        // IMPRODUCT - Product of complex numbers
        registry.register(
            'IMPRODUCT',
            (args) => {
                if (args.length < 2) return '#VALUE!';
                const numbers = args.map((arg) => String(Helpers.asScalar(arg) || ''));
                return this.product(numbers);
            },
            2,
            -1,
        );

        // CONVERT - Convert between units
        registry.register(
            'CONVERT',
            (args) => {
                const value = Number(Helpers.asScalar(args[0])) || 0;
                const fromUnit = String(Helpers.asScalar(args[1]) || '');
                const toUnit = String(Helpers.asScalar(args[2]) || '');

                return this.convert(value, fromUnit.toUpperCase(), toUnit.toUpperCase());
            },
            3,
            3,
        );

        // DEC2BIN - Convert decimal to binary
        registry.register(
            'DEC2BIN',
            (args) => {
                const number = Number(Helpers.asScalar(args[0])) || 0;
                const places = args[1] !== undefined ? Number(Helpers.asScalar(args[1])) : 0;
                return this.dec2bin(number, places);
            },
            1,
            2,
        );

        // BIN2DEC - Convert binary to decimal
        registry.register(
            'BIN2DEC',
            (args) => {
                const number = String(Helpers.asScalar(args[0]) || '');
                return this.bin2dec(number);
            },
            1,
            1,
        );

        // DEC2HEX - Convert decimal to hexadecimal
        registry.register(
            'DEC2HEX',
            (args) => {
                const number = Number(Helpers.asScalar(args[0])) || 0;
                const places = args[1] !== undefined ? Number(Helpers.asScalar(args[1])) : 0;
                return this.dec2hex(number, places);
            },
            1,
            2,
        );

        // HEX2DEC - Convert hexadecimal to decimal
        registry.register(
            'HEX2DEC',
            (args) => {
                const number = String(Helpers.asScalar(args[0]) || '');
                return this.hex2dec(number);
            },
            1,
            1,
        );
    }

    private complex(real: number, imaginary: number, suffix: string): string {
        if (!['i', 'j'].includes(suffix.toLowerCase())) return '#VALUE!';

        const suffixChar = suffix.toLowerCase();

        if (imaginary === 0) return String(real);
        if (real === 0) return `${imaginary}${suffixChar}`;

        const sign = imaginary > 0 ? '+' : '-';
        const imag = Math.abs(imaginary);

        if (imag === 1) {
            return `${real}${sign}${suffixChar}`;
        }
        return `${real}${sign}${imag}${suffixChar}`;
    }

    private parseComplex(complex: string): { real: number; imag: number } | null {
        if (!complex) return null;

        // Match patterns like "3+4i", "5-2j", "3", "4i", "-5j"
        const match = complex.match(/^([+-]?\d*\.?\d*)([+-]?)(\d*\.?\d*)([ij])$/i);
        if (!match) {
            // Try simple patterns
            const simpleImag = complex.match(/^([+-]?\d*\.?\d*)([ij])$/i);
            if (simpleImag) {
                const imag =
                    simpleImag[1] === '' || simpleImag[1] === '+'
                        ? 1
                        : simpleImag[1] === '-'
                          ? -1
                          : Number(simpleImag[1]);
                return { real: 0, imag };
            }
            const simpleReal = complex.match(/^([+-]?\d+\.?\d*)$/);
            if (simpleReal) {
                return { real: Number(simpleReal[1]), imag: 0 };
            }
            return null;
        }

        let real = match[1] ? Number(match[1]) : 0;
        let imag = match[3] ? Number(match[3]) : 1;

        if (match[2] === '-') imag = -imag;

        return { real, imag };
    }

    private imaginary(complex: string): number | string {
        const parsed = this.parseComplex(complex);
        if (!parsed) return '#NUM!';
        return parsed.imag;
    }

    private realPart(complex: string): number | string {
        const parsed = this.parseComplex(complex);
        if (!parsed) return '#NUM!';
        return parsed.real;
    }

    private abs(complex: string): number | string {
        const parsed = this.parseComplex(complex);
        if (!parsed) return '#NUM!';
        return Math.sqrt(parsed.real * parsed.real + parsed.imag * parsed.imag);
    }

    private argument(complex: string): number | string {
        const parsed = this.parseComplex(complex);
        if (!parsed) return '#NUM!';
        return Math.atan2(parsed.imag, parsed.real);
    }

    private conjugate(complex: string): string {
        const parsed = this.parseComplex(complex);
        if (!parsed) return '#NUM!';
        return this.complex(parsed.real, -parsed.imag, 'i');
    }

    private sum(numbers: string[]): string {
        let totalReal = 0;
        let totalImag = 0;

        for (const num of numbers) {
            const parsed = this.parseComplex(num);
            if (!parsed) return '#NUM!';
            totalReal += parsed.real;
            totalImag += parsed.imag;
        }

        return this.complex(totalReal, totalImag, 'i');
    }

    private product(numbers: string[]): string {
        let resultReal = 1;
        let resultImag = 0;

        for (const num of numbers) {
            const parsed = this.parseComplex(num);
            if (!parsed) return '#NUM!';

            const newReal = resultReal * parsed.real - resultImag * parsed.imag;
            const newImag = resultReal * parsed.imag + resultImag * parsed.real;
            resultReal = newReal;
            resultImag = newImag;
        }

        return this.complex(resultReal, resultImag, 'i');
    }

    private convert(value: number, fromUnit: string, toUnit: string): number | string {
        // Common unit conversions
        const conversions: Record<string, Record<string, number>> = {
            M: { KM: 0.001, CM: 100, MM: 1000, FT: 3.28084, IN: 39.3701 },
            KM: { M: 1000, CM: 100000, MM: 1000000, MI: 0.621371 },
            G: { KG: 0.001, MG: 1000, LB: 0.00220462, OZ: 0.035274 },
            KG: { G: 1000, MG: 1000000, LB: 2.20462, OZ: 35.274 },
            C: { F: 1.8, K: 1 }, // Special handling for temperature
            F: { C: 0.555556, K: 0.555556 },
            L: { ML: 1000, GAL: 0.264172, QT: 1.05669 },
            GAL: { L: 3.78541, ML: 3785.41 },
        };

        // Special handling for temperature
        if (fromUnit === 'C' && toUnit === 'F') return value * 1.8 + 32;
        if (fromUnit === 'F' && toUnit === 'C') return (value - 32) * 0.555556;
        if (fromUnit === 'C' && toUnit === 'K') return value + 273.15;
        if (fromUnit === 'K' && toUnit === 'C') return value - 273.15;

        const factor = conversions[fromUnit]?.[toUnit];
        if (factor === undefined) return '#N/A';

        return value * factor;
    }

    private dec2bin(number: number, places: number): string {
        if (number < -512 || number > 511) return '#NUM!';

        if (number < 0) {
            // Two's complement for negative numbers
            number = 512 + number;
        }

        let binary = Math.floor(number).toString(2);

        if (places > 0) {
            if (binary.length > places) return '#NUM!';
            binary = binary.padStart(places, '0');
        }

        return binary;
    }

    private bin2dec(number: string): number | string {
        if (!/^[01]+$/.test(number)) return '#NUM!';
        if (number.length > 10) return '#NUM!';

        const decimal = parseInt(number, 2);

        // Handle negative (two's complement for 10-bit)
        if (number.length === 10 && number[0] === '1') {
            return decimal - 1024;
        }

        return decimal;
    }

    private dec2hex(number: number, places: number): string {
        if (number < -549755813888 || number > 549755813887) return '#NUM!';

        if (number < 0) {
            // Two's complement for negative numbers
            number = 0x100000000 + number;
        }

        let hex = Math.floor(number).toString(16).toUpperCase();

        if (places > 0) {
            if (hex.length > places) return '#NUM!';
            hex = hex.padStart(places, '0');
        }

        return hex;
    }

    private hex2dec(number: string): number | string {
        if (!/^[0-9A-Fa-f]+$/.test(number)) return '#NUM!';
        if (number.length > 10) return '#NUM!';

        const decimal = parseInt(number, 16);

        // Handle negative (two's complement for 40-bit)
        if (number.length === 10 && /^[89A-Fa-f]/.test(number[0]!)) {
            return decimal - Math.pow(2, 40);
        }

        return decimal;
    }
}
