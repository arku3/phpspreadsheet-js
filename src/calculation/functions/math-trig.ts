import { FunctionRegistry } from '../function-registry.ts';
import { Helpers } from '../helpers.ts';
import type { FunctionCategory } from './function-category.ts';

export class MathTrig implements FunctionCategory {
    public register(registry: FunctionRegistry): void {
        // SUM
        registry.register(
            'SUM',
            (args) => {
                return Helpers.flattenNumeric(args).reduce((acc, val) => acc + val, 0);
            },
            1,
            null,
        );

        // ABS
        registry.register(
            'ABS',
            (args) => {
                return Math.abs(Number(Helpers.asScalar(args[0])) || 0);
            },
            1,
            1,
        );

        // MAX
        registry.register(
            'MAX',
            (args) => {
                const flatArgs = Helpers.flattenNumeric(args);
                return flatArgs.length > 0 ? Math.max(...flatArgs) : 0;
            },
            1,
            null,
        );

        // MIN
        registry.register(
            'MIN',
            (args) => {
                const flatArgs = Helpers.flattenNumeric(args);
                return flatArgs.length > 0 ? Math.min(...flatArgs) : 0;
            },
            1,
            null,
        );

        // ROUND
        registry.register(
            'ROUND',
            (args) => {
                const val = Number(Helpers.asScalar(args[0])) || 0;
                const digits = Number(Helpers.asScalar(args[1])) || 0;
                const factor = Math.pow(10, digits);
                return Math.round(val * factor) / factor;
            },
            2,
            2,
        );
    }
}
