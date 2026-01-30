import { FunctionRegistry } from '../function-registry.ts';
import { Helpers } from '../helpers.ts';
import type { FunctionCategory } from './function-category.ts';

/**
 * Excel Financial functions for cash flow calculations.
 * Implements annuity and loan payment calculations.
 */
export class Financial implements FunctionCategory {
    // Payment timing constants
    private static readonly PAYMENT_END = 0;
    private static readonly PAYMENT_BEGINNING = 1;

    public register(registry: FunctionRegistry): void {
        // FV - Future Value of an annuity
        registry.register(
            'FV',
            (args) => {
                const rate = Number(Helpers.asScalar(args[0])) || 0;
                const nper = Number(Helpers.asScalar(args[1])) || 0;
                const pmt = Number(Helpers.asScalar(args[2])) || 0;
                const pv = args[3] !== undefined ? Number(Helpers.asScalar(args[3])) : 0;
                const type = args[4] !== undefined ? Number(Helpers.asScalar(args[4])) : Financial.PAYMENT_END;

                if (isNaN(rate) || isNaN(nper) || isNaN(pmt) || isNaN(pv) || isNaN(type)) {
                    return '#VALUE!';
                }

                return this.futureValue(rate, Math.floor(nper), pmt, pv, type);
            },
            3,
            5,
        );

        // PV - Present Value of an annuity
        registry.register(
            'PV',
            (args) => {
                const rate = Number(Helpers.asScalar(args[0])) || 0;
                const nper = Number(Helpers.asScalar(args[1])) || 0;
                const pmt = Number(Helpers.asScalar(args[2])) || 0;
                const fv = args[3] !== undefined ? Number(Helpers.asScalar(args[3])) : 0;
                const type = args[4] !== undefined ? Number(Helpers.asScalar(args[4])) : Financial.PAYMENT_END;

                if (isNaN(rate) || isNaN(nper) || isNaN(pmt) || isNaN(fv) || isNaN(type)) {
                    return '#VALUE!';
                }

                if (nper < 0) return '#NUM!';

                return this.presentValue(rate, Math.floor(nper), pmt, fv, type);
            },
            3,
            5,
        );

        // PMT - Payment for an annuity
        registry.register(
            'PMT',
            (args) => {
                const rate = Number(Helpers.asScalar(args[0])) || 0;
                const nper = Number(Helpers.asScalar(args[1])) || 0;
                const pv = Number(Helpers.asScalar(args[2])) || 0;
                const fv = args[3] !== undefined ? Number(Helpers.asScalar(args[3])) : 0;
                const type = args[4] !== undefined ? Number(Helpers.asScalar(args[4])) : Financial.PAYMENT_END;

                if (isNaN(rate) || isNaN(nper) || isNaN(pv) || isNaN(fv) || isNaN(type)) {
                    return '#VALUE!';
                }

                return this.payment(rate, Math.floor(nper), pv, fv, type);
            },
            3,
            5,
        );

        // NPER - Number of periods for an annuity
        registry.register(
            'NPER',
            (args) => {
                const rate = Number(Helpers.asScalar(args[0])) || 0;
                const pmt = Number(Helpers.asScalar(args[1])) || 0;
                const pv = Number(Helpers.asScalar(args[2])) || 0;
                const fv = args[3] !== undefined ? Number(Helpers.asScalar(args[3])) : 0;
                const type = args[4] !== undefined ? Number(Helpers.asScalar(args[4])) : Financial.PAYMENT_END;

                if (isNaN(rate) || isNaN(pmt) || isNaN(pv) || isNaN(fv) || isNaN(type)) {
                    return '#VALUE!';
                }

                if (pmt === 0) return '#NUM!';

                return this.periods(rate, pmt, pv, fv, type);
            },
            3,
            5,
        );

        // RATE - Interest rate per period (using Newton-Raphson approximation)
        registry.register(
            'RATE',
            (args) => {
                const nper = Number(Helpers.asScalar(args[0])) || 0;
                const pmt = Number(Helpers.asScalar(args[1])) || 0;
                const pv = Number(Helpers.asScalar(args[2])) || 0;
                const fv = args[3] !== undefined ? Number(Helpers.asScalar(args[3])) : 0;
                const type = args[4] !== undefined ? Number(Helpers.asScalar(args[4])) : Financial.PAYMENT_END;
                const guess = args[5] !== undefined ? Number(Helpers.asScalar(args[5])) : 0.1;

                if (isNaN(nper) || isNaN(pmt) || isNaN(pv) || isNaN(fv) || isNaN(type) || isNaN(guess)) {
                    return '#VALUE!';
                }

                return this.rate(Math.floor(nper), pmt, pv, fv, type, guess);
            },
            3,
            6,
        );

        // NPV - Net Present Value
        registry.register(
            'NPV',
            (args) => {
                if (args.length < 2) return '#VALUE!';

                const rate = Number(Helpers.asScalar(args[0])) || 0;
                const values = args.slice(1).map((arg) => Number(Helpers.asScalar(arg)) || 0);

                if (isNaN(rate)) return '#VALUE!';

                return this.npv(rate, values);
            },
            2,
            -1,
        ); // Variable arguments

        // IRR - Internal Rate of Return
        registry.register(
            'IRR',
            (args) => {
                if (args.length < 1) return '#VALUE!';

                const values =
                    args[0] !== undefined
                        ? Array.isArray(args[0])
                            ? args[0].map((v: any) => Number(v) || 0)
                            : [Number(Helpers.asScalar(args[0])) || 0]
                        : [];
                const guess = args[1] !== undefined ? Number(Helpers.asScalar(args[1])) : 0.1;

                if (values.length < 2) return '#NUM!';

                return this.irr(values, guess);
            },
            1,
            2,
        );
    }

    private futureValue(rate: number, nper: number, pmt: number, pv: number, type: number): number {
        if (rate !== 0) {
            return -pv * Math.pow(1 + rate, nper) - (pmt * (1 + rate * type) * (Math.pow(1 + rate, nper) - 1)) / rate;
        }
        return -pv - pmt * nper;
    }

    private presentValue(rate: number, nper: number, pmt: number, fv: number, type: number): number {
        if (rate !== 0) {
            return (-pmt * (1 + rate * type) * ((Math.pow(1 + rate, nper) - 1) / rate) - fv) / Math.pow(1 + rate, nper);
        }
        return -fv - pmt * nper;
    }

    private payment(rate: number, nper: number, pv: number, fv: number, type: number): number {
        if (rate !== 0) {
            return (
                (-fv * rate - pv * rate * Math.pow(1 + rate, nper)) /
                ((1 + rate * type) * (Math.pow(1 + rate, nper) - 1))
            );
        }
        return (-pv - fv) / nper;
    }

    private periods(rate: number, pmt: number, pv: number, fv: number, type: number): number | string {
        if (rate !== 0) {
            if (pv === 0) return '#NUM!';

            const numerator = (pmt * (1 + rate * type)) / rate - fv;
            const denominator = pv + (pmt * (1 + rate * type)) / rate;

            if (numerator <= 0 || denominator <= 0) return '#NUM!';

            return Math.log(numerator / denominator) / Math.log(1 + rate);
        }
        return (-pv - fv) / pmt;
    }

    private rate(nper: number, pmt: number, pv: number, fv: number, type: number, guess: number): number | string {
        // Newton-Raphson method to find the interest rate
        const maxIterations = 100;
        const tolerance = 1e-10;

        let rate = guess;

        for (let i = 0; i < maxIterations; i++) {
            // Calculate f(rate) = FV - target_FV
            const fv_calc = this.futureValue(rate, nper, pmt, pv, type);
            const f = fv_calc + fv; // We want FV = -fv, so f = FV + fv

            // Calculate f'(rate) using numerical derivative
            const delta = 0.0001;
            const fv_delta = this.futureValue(rate + delta, nper, pmt, pv, type);
            const f_prime = (fv_delta + fv - f) / delta;

            if (Math.abs(f_prime) < tolerance) {
                return '#NUM!';
            }

            const newRate = rate - f / f_prime;

            if (Math.abs(newRate - rate) < tolerance) {
                return newRate;
            }

            rate = newRate;
        }

        return '#NUM!';
    }

    private npv(rate: number, values: number[]): number | string {
        if (rate === -1) return '#DIV/0!';

        let result = 0;
        for (let i = 0; i < values.length; i++) {
            result += values[i]! / Math.pow(1 + rate, i + 1);
        }

        return result;
    }

    private irr(values: number[], guess: number): number | string {
        // Newton-Raphson method to find IRR
        const maxIterations = 100;
        const tolerance = 1e-10;

        let rate = guess;

        for (let i = 0; i < maxIterations; i++) {
            // Calculate NPV at current rate
            let npv = 0;
            let dNpv = 0; // derivative of NPV

            for (let j = 0; j < values.length; j++) {
                const factor = Math.pow(1 + rate, j);
                npv += values[j]! / factor;
                dNpv -= (j * values[j]!) / (factor * (1 + rate));
            }

            if (Math.abs(dNpv) < tolerance) {
                return '#NUM!';
            }

            const newRate = rate - npv / dNpv;

            if (Math.abs(newRate - rate) < tolerance) {
                return newRate;
            }

            rate = newRate;
        }

        return '#NUM!';
    }
}
