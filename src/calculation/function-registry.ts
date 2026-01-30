import { Conditional } from './functions/conditional.ts';
import { Database } from './functions/database.ts';
import { DateTime } from './functions/datetime.ts';
import { Engineering } from './functions/engineering.ts';
import { Financial } from './functions/financial.ts';
import { Logical } from './functions/logical.ts';
import { LookupRef } from './functions/lookup-ref.ts';
import { MathTrig } from './functions/math-trig.ts';
import { Statistical } from './functions/statistical.ts';
import { TextData } from './functions/text-data.ts';

export type FunctionImplementation = (args: any[]) => any;

export interface FunctionMetadata {
    implementation: FunctionImplementation;
    minArgs: number;
    maxArgs: number | null; // null for infinite (e.g., SUM)
}

/**
 * Registry for Excel functions.
 */
export class FunctionRegistry {
    #functions: Map<string, FunctionMetadata> = new Map();

    constructor() {
        this.#registerDefaultFunctions();
    }

    public register(
        name: string,
        implementation: FunctionImplementation,
        minArgs: number = 0,
        maxArgs: number | null = null,
    ): void {
        // Some registrations use -1 to mean "no maximum" (infinite varargs).
        // Normalize to null so validation logic is consistent.
        if (maxArgs !== null && maxArgs < 0) {
            maxArgs = null;
        }
        this.#functions.set(name.toUpperCase(), {
            implementation,
            minArgs,
            maxArgs,
        });
    }

    public get(name: string): FunctionMetadata | undefined {
        return this.#functions.get(name.toUpperCase());
    }

    public validateArgumentCount(name: string, count: number): boolean | string {
        const metadata = this.get(name);
        if (!metadata) return false;

        if (count < metadata.minArgs) {
            return `#VALUE! (Too few arguments for ${name})`;
        }

        if (metadata.maxArgs !== null && count > metadata.maxArgs) {
            return `#VALUE! (Too many arguments for ${name})`;
        }

        return true;
    }

    #registerDefaultFunctions(): void {
        new MathTrig().register(this);
        new Logical().register(this);
        new Statistical().register(this);
        new TextData().register(this);
        new LookupRef().register(this);
        new DateTime().register(this);
        new Financial().register(this);
        new Engineering().register(this);
        new Conditional().register(this);
        new Database().register(this);
    }
}
