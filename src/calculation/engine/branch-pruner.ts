/**
 * Simple Branch Pruner for formula evaluation.
 */
export class BranchPruner {
    #branchPruningEnabled: boolean;

    constructor(enabled: boolean = true) {
        this.#branchPruningEnabled = enabled;
    }

    public currentCondition(): string | undefined {
        return undefined;
    }

    public currentOnlyIf(): string | undefined {
        return undefined;
    }

    public currentOnlyIfNot(): string | undefined {
        return undefined;
    }
}
