import { FunctionRegistry } from '../function-registry.ts';
import type { FunctionCategory } from './function-category.ts';

export class TextData implements FunctionCategory {
    public register(registry: FunctionRegistry): void {
        // LEN
        registry.register('LEN', (args) => {
            return String(args[0] ?? '').length;
        }, 1, 1);

        // LEFT
        registry.register('LEFT', (args) => {
            const str = String(args[0] ?? '');
            const len = Number(args[1] ?? 1);
            return str.substring(0, len);
        }, 1, 2);

        // RIGHT
        registry.register('RIGHT', (args) => {
            const str = String(args[0] ?? '');
            const len = Number(args[1] ?? 1);
            return str.substring(str.length - len);
        }, 1, 2);

        // CONCATENATE
        registry.register('CONCATENATE', (args) => {
            return args.flat(Infinity).join('');
        }, 1, null);
    }
}
