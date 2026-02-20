import { PasswordHasher } from '../shared/password-hasher.ts';

export class ProtectedRange {
    #range: string;
    #password: string;
    #name: string;
    #securityDescriptor: string;

    constructor(range: string, password: string, name: string, securityDescriptor: string) {
        this.#range = range;
        this.#password = password;
        this.#name = name;
        this.#securityDescriptor = securityDescriptor;
    }

    public getRange(): string {
        return this.#range;
    }

    public getPassword(): string {
        return this.#password;
    }

    public getName(): string {
        return this.#name;
    }

    public getSecurityDescriptor(): string {
        return this.#securityDescriptor;
    }

    public static create(
        range: string,
        password: string,
        alreadyHashed: boolean,
        name: string,
        securityDescriptor: string,
    ): ProtectedRange {
        let hashedPassword = password;
        if (!alreadyHashed && password !== '') {
            hashedPassword = PasswordHasher.hashPassword(password);
        }
        return new ProtectedRange(range, hashedPassword, name, securityDescriptor);
    }
}
