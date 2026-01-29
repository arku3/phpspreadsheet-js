import { createHash } from 'node:crypto';

/**
 * Protection style.
 */
export class Protection {
    public static readonly PROTECTION_INHERIT = 'inherit';
    public static readonly PROTECTION_PROTECTED = 'protected';
    public static readonly PROTECTION_UNPROTECTED = 'unprotected';

    /**
     * Locked.
     */
    #locked: string = Protection.PROTECTION_INHERIT;

    /**
     * Hidden.
     */
    #hidden: string = Protection.PROTECTION_INHERIT;

    /**
     * Get locked.
     */
    public getLocked(): string {
        return this.#locked;
    }

    /**
     * Set locked.
     */
    public setLocked(locked: string): this {
        this.#locked = locked;
        return this;
    }

    /**
     * Get hidden.
     */
    public getHidden(): string {
        return this.#hidden;
    }

    /**
     * Set hidden.
     */
    public setHidden(hidden: string): this {
        this.#hidden = hidden;
        return this;
    }

    /**
     * Apply styles from array.
     *
     * @param styleArray Array containing style information
     */
    public applyFromArray(styleArray: Record<string, unknown>): this {
        if (styleArray.locked !== undefined) {
            this.setLocked(String(styleArray.locked));
        }
        if (styleArray.hidden !== undefined) {
            this.setHidden(String(styleArray.hidden));
        }
        return this;
    }

    /**
     * Get hash code.
     */
    public getHashCode(): string {
        return createHash('md5')
            .update(this.#locked + this.#hidden + 'Protection')
            .digest('hex');
    }
}
