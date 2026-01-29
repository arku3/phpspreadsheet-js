export type FunctionImplementation = (args: any[]) => any;

/**
 * Registry for Excel functions.
 */
export class FunctionRegistry {
    #functions: Map<string, FunctionImplementation> = new Map();

    constructor() {
        this.#registerDefaultFunctions();
    }

    public register(name: string, implementation: FunctionImplementation): void {
        this.#functions.set(name.toUpperCase(), implementation);
    }

    public get(name: string): FunctionImplementation | undefined {
        return this.#functions.get(name.toUpperCase());
    }

    #registerDefaultFunctions(): void {
        // SUM
        this.register('SUM', (args) => {
            return args.flat(Infinity).reduce((acc, val) => {
                const num = Number(val);
                return acc + (isNaN(num) ? 0 : num);
            }, 0);
        });

        // AVERAGE
        this.register('AVERAGE', (args) => {
            const flatArgs = args.flat(Infinity).map(val => Number(val)).filter(val => !isNaN(val));
            return flatArgs.length > 0 ? flatArgs.reduce((acc, val) => acc + val, 0) / flatArgs.length : 0;
        });

        // IF
        this.register('IF', (args) => {
            const condition = args[0];
            const returnIfTrue = args[1] !== undefined ? args[1] : 0;
            const returnIfFalse = args[2] !== undefined ? args[2] : false;

            return condition ? returnIfTrue : returnIfFalse;
        });

        // COUNT
        this.register('COUNT', (args) => {
            return args.flat(Infinity).filter(val => typeof val === 'number' && !isNaN(val)).length;
        });

        // ABS
        this.register('ABS', (args) => {
            return Math.abs(Number(args[0]) || 0);
        });

        // MAX
        this.register('MAX', (args) => {
            const flatArgs = args.flat(Infinity).map(val => Number(val)).filter(val => !isNaN(val));
            return flatArgs.length > 0 ? Math.max(...flatArgs) : 0;
        });

        // MIN
        this.register('MIN', (args) => {
            const flatArgs = args.flat(Infinity).map(val => Number(val)).filter(val => !isNaN(val));
            return flatArgs.length > 0 ? Math.min(...flatArgs) : 0;
        });

        // ROUND
        this.register('ROUND', (args) => {
            const val = Number(args[0]) || 0;
            const digits = Number(args[1]) || 0;
            const factor = Math.pow(10, digits);
            return Math.round(val * factor) / factor;
        });

        // LEN
        this.register('LEN', (args) => {
            return String(args[0] ?? '').length;
        });

        // LEFT
        this.register('LEFT', (args) => {
            const str = String(args[0] ?? '');
            const len = Number(args[1] ?? 1);
            return str.substring(0, len);
        });

        // RIGHT
        this.register('RIGHT', (args) => {
            const str = String(args[0] ?? '');
            const len = Number(args[1] ?? 1);
            return str.substring(str.length - len);
        });

        // CONCATENATE
        this.register('CONCATENATE', (args) => {
            return args.flat(Infinity).join('');
        });

        // AND
        this.register('AND', (args) => {
            const flatArgs = args.flat(Infinity);
            if (flatArgs.length === 0) return '#VALUE!';
            return flatArgs.every(val => Boolean(val));
        });

        // OR
        this.register('OR', (args) => {
            const flatArgs = args.flat(Infinity);
            if (flatArgs.length === 0) return '#VALUE!';
            return flatArgs.some(val => Boolean(val));
        });

        // NOT
        this.register('NOT', (args) => {
            return !Boolean(args[0]);
        });
    }
}
