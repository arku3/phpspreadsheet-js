import { FunctionRegistry } from '../function-registry.ts';

/**
 * Interface for a collection of related Excel functions.
 */
export interface FunctionCategory {
    register(registry: FunctionRegistry): void;
}
