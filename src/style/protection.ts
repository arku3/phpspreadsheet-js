import { createHash } from 'node:crypto';
import { Supervisor } from './supervisor.ts';

/**
 * Protection style.
 */
export class Protection extends Supervisor {
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

    constructor(isSupervisor: boolean = false) {
        super(isSupervisor);
    }

    /**
     * Get the shared style component for the currently active cell in currently active sheet.
     */
    public getSharedComponent(): Protection {
        if (!this.parent) {
            throw new Error('No parent found.');
        }
        return this.parent.getSharedComponent().getProtection();
    }

    /**
     * Build style array from subcomponents.
     */
    public getStyleArray(array: any): any {
        return { protection: array };
    }

    /**
     * Get locked.
     */
    public getLocked(): string {
        if (this.isSupervisor) {
            return this.getSharedComponent().getLocked();
        }
        return this.#locked;
    }

    /**
     * Set locked.
     */
    public setLocked(locked: string): this {
        if (this.isSupervisor) {
            this.applyFromArray({ locked });
        } else {
            this.#locked = locked;
        }
        return this;
    }

    /**
     * Get hidden.
     */
    public getHidden(): string {
        if (this.isSupervisor) {
            return this.getSharedComponent().getHidden();
        }
        return this.#hidden;
    }

    /**
     * Set hidden.
     */
    public setHidden(hidden: string): this {
        if (this.isSupervisor) {
            this.applyFromArray({ hidden });
        } else {
            this.#hidden = hidden;
        }
        return this;
    }

    /**
     * Apply styles from array.
     *
     * @param styleArray Array containing style information
     */
    public applyFromArray(styleArray: Record<string, unknown>): this {
        if (this.isSupervisor) {
            this.parent.applyFromArray({ protection: styleArray });
        } else {
            if (styleArray.locked !== undefined) {
                this.setLocked(String(styleArray.locked));
            }
            if (styleArray.hidden !== undefined) {
                this.setHidden(String(styleArray.hidden));
            }
        }
        return this;
    }

    /**
     * Get hash code.
     */
    public getHashCode(): string {
        if (this.isSupervisor) {
            return this.getSharedComponent().getHashCode();
        }
        return createHash('md5')
            .update(this.#locked + this.#hidden + 'Protection')
            .digest('hex');
    }
}
