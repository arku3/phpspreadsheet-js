import { isError, isNa } from '../calculation-errors.ts';
import { FunctionRegistry } from '../function-registry.ts';
import type { FunctionCategory } from './function-category.ts';

export class Logical implements FunctionCategory {
    public register(registry: FunctionRegistry): void {
        // IF
        registry.register(
            'IF',
            (args) => {
                const condition = args[0];
                const returnIfTrue = args[1] !== undefined ? args[1] : 0;
                const returnIfFalse = args[2] !== undefined ? args[2] : false;

                return condition ? returnIfTrue : returnIfFalse;
            },
            2,
            3,
        );

        // IFERROR
        registry.register(
            'IFERROR',
            (args) => {
                const testValue = args[0];
                const errorPart = args[1];

                return isError(testValue) ? errorPart : testValue;
            },
            2,
            2,
        );

        // IFNA
        registry.register(
            'IFNA',
            (args) => {
                const testValue = args[0];
                const naPart = args[1];

                return isNa(testValue) ? naPart : testValue;
            },
            2,
            2,
        );

        // AND
        registry.register(
            'AND',
            (args) => {
                const flatArgs = args.flat(Infinity);
                if (flatArgs.length === 0) return '#VALUE!';
                return flatArgs.every((val) => Boolean(val));
            },
            1,
            null,
        );

        // OR
        registry.register(
            'OR',
            (args) => {
                const flatArgs = args.flat(Infinity);
                if (flatArgs.length === 0) return '#VALUE!';
                return flatArgs.some((val) => Boolean(val));
            },
            1,
            null,
        );

        // NOT
        registry.register(
            'NOT',
            (args) => {
                return !Boolean(args[0]);
            },
            1,
            1,
        );
    }
}
