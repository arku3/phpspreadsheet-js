import { BranchPruner } from '../engine/branch-pruner.ts';

export interface StackItem {
    type: string;
    value: any;
    reference: string | null;
    storeKey?: string;
    onlyIf?: string;
    onlyIfNot?: string;
}

/**
 * Parser stack for formula evaluation.
 */
export class Stack {
    #branchPruner: BranchPruner;
    #stack: StackItem[] = [];

    constructor(branchPruner: BranchPruner) {
        this.#branchPruner = branchPruner;
    }

    public count(): number {
        return this.#stack.length;
    }

    public push(type: string, value: any, reference: string | null = null): void {
        const stackItem: StackItem = {
            type,
            value,
            reference,
        };

        const storeKey = this.#branchPruner.currentCondition();
        if (storeKey !== undefined || reference === 'NULL') {
            stackItem.storeKey = storeKey;
        }

        const onlyIf = this.#branchPruner.currentOnlyIf();
        if (onlyIf !== undefined || reference === 'NULL') {
            stackItem.onlyIf = onlyIf;
        }

        const onlyIfNot = this.#branchPruner.currentOnlyIfNot();
        if (onlyIfNot !== undefined || reference === 'NULL') {
            stackItem.onlyIfNot = onlyIfNot;
        }

        this.#stack.push(stackItem);
    }

    public pop(): StackItem | undefined {
        return this.#stack.pop();
    }

    public last(n: number = 1): StackItem | undefined {
        if (this.#stack.length - n < 0) {
            return undefined;
        }
        return this.#stack[this.#stack.length - n];
    }

    public clear(): void {
        this.#stack = [];
    }
}
