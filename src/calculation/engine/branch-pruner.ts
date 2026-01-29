/**
 * Branch Pruner for lazy IF evaluation.
 */
export class BranchPruner {
    #branchPruningEnabled: boolean;
    #ifStack: string[] = [];
    #conditionMap: Map<string, boolean> = new Map();
    #onlyIfStack: (string | undefined)[] = [];
    #onlyIfNotStack: (string | undefined)[] = [];

    constructor(enabled: boolean = true) {
        this.#branchPruningEnabled = enabled;
    }

    public clear(): void {
        this.#ifStack = [];
        this.#conditionMap.clear();
        this.#onlyIfStack = [];
        this.#onlyIfNotStack = [];
    }

    public currentCondition(): string | undefined {
        return this.#ifStack[this.#ifStack.length - 1];
    }

    public currentOnlyIf(): string | undefined {
        return this.#onlyIfStack[this.#onlyIfStack.length - 1];
    }

    public currentOnlyIfNot(): string | undefined {
        return this.#onlyIfNotStack[this.#onlyIfNotStack.length - 1];
    }

    public pushIf(key: string): void {
        this.#ifStack.push(key);
        // Initially we are in the condition part, so no pruning based on this IF yet
        this.#onlyIfStack.push(undefined);
        this.#onlyIfNotStack.push(undefined);
    }

    public popIf(): void {
        this.#ifStack.pop();
        this.#onlyIfStack.pop();
        this.#onlyIfNotStack.pop();
    }

    public setConditionResult(result: boolean): void {
        const key = this.currentCondition();
        if (key) {
            this.#conditionMap.set(key, result);
        }
    }

    public enterThen(): void {
        const key = this.currentCondition();
        if (key) {
            this.#onlyIfStack[this.#onlyIfStack.length - 1] = key;
            this.#onlyIfNotStack[this.#onlyIfNotStack.length - 1] = undefined;
        }
    }

    public enterElse(): void {
        const key = this.currentCondition();
        if (key) {
            this.#onlyIfStack[this.#onlyIfStack.length - 1] = undefined;
            this.#onlyIfNotStack[this.#onlyIfNotStack.length - 1] = key;
        }
    }

    public isPruned(): boolean {
        if (!this.#branchPruningEnabled) return false;

        for (let i = 0; i < this.#ifStack.length; i++) {
            const onlyIf = this.#onlyIfStack[i];
            const onlyIfNot = this.#onlyIfNotStack[i];

            if (onlyIf && this.#conditionMap.get(onlyIf) === false) {
                return true;
            }
            if (onlyIfNot && this.#conditionMap.get(onlyIfNot) === true) {
                return true;
            }
        }

        return false;
    }
}
