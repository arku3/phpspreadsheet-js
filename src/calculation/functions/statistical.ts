import { FunctionRegistry } from '../function-registry.ts';
import type { FunctionCategory } from './function-category.ts';
import { Helpers } from '../helpers.ts';

export class Statistical implements FunctionCategory {
    public register(registry: FunctionRegistry): void {
        // AVERAGE
        registry.register('AVERAGE', (args) => {
            const flatArgs = Helpers.flattenNumeric(args);
            return flatArgs.length > 0 ? flatArgs.reduce((acc, val) => acc + val, 0) / flatArgs.length : 0;
        }, 1, null);

        // COUNT
        registry.register('COUNT', (args) => {
            return Helpers.flattenNumeric(args).length;
        }, 1, null);
    }
}
