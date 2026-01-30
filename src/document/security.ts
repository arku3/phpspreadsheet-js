import { PasswordHasher } from '../shared/password-hasher.ts';

/**
 * Document Security.
 */
export class Security {
    /**
     * LockRevision.
     */
    #lockRevision: boolean = false;

    /**
     * LockStructure.
     */
    #lockStructure: boolean = false;

    /**
     * LockWindows.
     */
    #lockWindows: boolean = false;

    /**
     * RevisionsPassword.
     */
    #revisionsPassword: string = '';

    /**
     * WorkbookPassword.
     */
    #workbookPassword: string = '';

    #workbookAlgorithmName: string = '';

    #workbookHashValue: string = '';

    #workbookSaltValue: string = '';

    #workbookSpinCount: number = 0;

    #revisionsAlgorithmName: string = '';

    #revisionsHashValue: string = '';

    #revisionsSaltValue: string = '';

    #revisionsSpinCount: number = 0;

    /**
     * Is some sort of document security enabled?
     */
    public isSecurityEnabled(): boolean {
        return this.#lockRevision || this.#lockStructure || this.#lockWindows;
    }

    public getLockRevision(): boolean {
        return this.#lockRevision;
    }

    public setLockRevision(locked: boolean | null): this {
        if (locked !== null) {
            this.#lockRevision = locked;
        }
        return this;
    }

    public getLockStructure(): boolean {
        return this.#lockStructure;
    }

    public setLockStructure(locked: boolean | null): this {
        if (locked !== null) {
            this.#lockStructure = locked;
        }
        return this;
    }

    public getLockWindows(): boolean {
        return this.#lockWindows;
    }

    public setLockWindows(locked: boolean | null): this {
        if (locked !== null) {
            this.#lockWindows = locked;
        }
        return this;
    }

    public getRevisionsPassword(): string {
        return this.#revisionsPassword;
    }

    /**
     * Set RevisionsPassword.
     *
     * @param password Password to set
     * @param alreadyHashed If the password has already been hashed, set this to true
     */
    public setRevisionsPassword(password: string | null, alreadyHashed: boolean = false): this {
        if (password !== null) {
            if (this.advancedRevisionsPassword()) {
                if (!alreadyHashed) {
                    password = PasswordHasher.hashPassword(
                        password,
                        this.#revisionsAlgorithmName,
                        this.#revisionsSaltValue,
                        this.#revisionsSpinCount,
                    );
                }
                this.#revisionsHashValue = password;
                this.#revisionsPassword = '';
            } else {
                if (!alreadyHashed) {
                    password = PasswordHasher.hashPassword(password);
                }
                this.#revisionsPassword = password;
            }
        }
        return this;
    }

    public getWorkbookPassword(): string {
        return this.#workbookPassword;
    }

    /**
     * Set WorkbookPassword.
     *
     * @param password Password to set
     * @param alreadyHashed If the password has already been hashed, set this to true
     */
    public setWorkbookPassword(password: string | null, alreadyHashed: boolean = false): this {
        if (password !== null) {
            if (this.advancedPassword()) {
                if (!alreadyHashed) {
                    password = PasswordHasher.hashPassword(
                        password,
                        this.#workbookAlgorithmName,
                        this.#workbookSaltValue,
                        this.#workbookSpinCount,
                    );
                }
                this.#workbookHashValue = password;
                this.#workbookPassword = '';
            } else {
                if (!alreadyHashed) {
                    password = PasswordHasher.hashPassword(password);
                }
                this.#workbookPassword = password;
            }
        }
        return this;
    }

    public getWorkbookHashValue(): string {
        return this.advancedPassword() ? this.#workbookHashValue : '';
    }

    public advancedPassword(): boolean {
        return this.#workbookAlgorithmName !== '' && this.#workbookSaltValue !== '' && this.#workbookSpinCount > 0;
    }

    public getWorkbookAlgorithmName(): string {
        return this.#workbookAlgorithmName;
    }

    public setWorkbookAlgorithmName(workbookAlgorithmName: string): this {
        this.#workbookAlgorithmName = workbookAlgorithmName;
        return this;
    }

    public getWorkbookSpinCount(): number {
        return this.#workbookSpinCount;
    }

    public setWorkbookSpinCount(workbookSpinCount: number): this {
        this.#workbookSpinCount = workbookSpinCount;
        return this;
    }

    public getWorkbookSaltValue(): string {
        return this.#workbookSaltValue;
    }

    public setWorkbookSaltValue(workbookSaltValue: string, base64Required: boolean): this {
        this.#workbookSaltValue = base64Required
            ? Buffer.from(workbookSaltValue).toString('base64')
            : workbookSaltValue;
        return this;
    }

    public getRevisionsHashValue(): string {
        return this.advancedRevisionsPassword() ? this.#revisionsHashValue : '';
    }

    public advancedRevisionsPassword(): boolean {
        return this.#revisionsAlgorithmName !== '' && this.#revisionsSaltValue !== '' && this.#revisionsSpinCount > 0;
    }

    public getRevisionsAlgorithmName(): string {
        return this.#revisionsAlgorithmName;
    }

    public setRevisionsAlgorithmName(revisionsAlgorithmName: string): this {
        this.#revisionsAlgorithmName = revisionsAlgorithmName;
        return this;
    }

    public getRevisionsSpinCount(): number {
        return this.#revisionsSpinCount;
    }

    public setRevisionsSpinCount(revisionsSpinCount: number): this {
        this.#revisionsSpinCount = revisionsSpinCount;
        return this;
    }

    public getRevisionsSaltValue(): string {
        return this.#revisionsSaltValue;
    }

    public setRevisionsSaltValue(revisionsSaltValue: string, base64Required: boolean): this {
        this.#revisionsSaltValue = base64Required
            ? Buffer.from(revisionsSaltValue).toString('base64')
            : revisionsSaltValue;
        return this;
    }
}
