import { createHash } from 'node:crypto';

/**
 * PasswordHasher.
 */
export class PasswordHasher {
    public static readonly MAX_PASSWORD_LENGTH = 255;

    /**
     * Get algorithm name for Node.js crypto.
     */
    private static getAlgorithm(algorithmName: string): string {
        if (!algorithmName) {
            return '';
        }

        // Mapping between algorithm name in Excel and algorithm name in Node.js
        const mapping: Record<string, string> = {
            'MD2': 'md2',
            'MD4': 'md4',
            'MD5': 'md5',
            'SHA-1': 'sha1',
            'SHA-256': 'sha256',
            'SHA-384': 'sha384',
            'SHA-512': 'sha512',
            'RIPEMD-128': 'ripemd128',
            'RIPEMD-160': 'ripemd160',
            'WHIRLPOOL': 'whirlpool',
        };

        const nodeAlgorithm = mapping[algorithmName];
        if (nodeAlgorithm) {
            return nodeAlgorithm;
        }

        throw new Error('Unsupported password algorithm: ' + algorithmName);
    }

    /**
     * Create a password hash from a given string.
     *
     * This method is based on the spec at:
     * https://interoperability.blob.core.windows.net/files/MS-OFFCRYPTO/[MS-OFFCRYPTO].pdf
     * 2.3.7.1 Binary Document Password Verifier Derivation Method 1
     *
     * @param password Password to hash
     */
    private static defaultHashPassword(password: string): string {
        let verifier = 0;
        const pwlen = password.length;
        const passwordArray = Buffer.concat([Buffer.from([pwlen]), Buffer.from(password, 'ascii')]);
        
        for (let i = pwlen; i >= 0; --i) {
            const intermediate1 = ((verifier & 0x4000) === 0) ? 0 : 1;
            let intermediate2 = 2 * verifier;
            intermediate2 = intermediate2 & 0x7FFF;
            const intermediate3 = intermediate1 | intermediate2;
            const byte = passwordArray[i];
            if (byte !== undefined) {
                verifier = intermediate3 ^ byte;
            }
        }
        verifier ^= 0xCE4B;

        return (verifier & 0xFFFF).toString(16).toUpperCase();
    }

    /**
     * Create a password hash from a given string by a specific algorithm.
     *
     * 2.4.2.4 ISO Write Protection Method
     *
     * @see https://docs.microsoft.com/en-us/openspecs/office_file_formats/ms-offcrypto/1357ea58-646e-4483-92ef-95d718079d6f
     *
     * @param password Password to hash
     * @param algorithm Hash algorithm used to compute the password hash value
     * @param salt Pseudorandom base64-encoded string
     * @param spinCount Number of times to iterate on a hash of a password
     *
     * @return string Hashed password
     */
    public static hashPassword(password: string, algorithm: string = '', salt: string = '', spinCount: number = 10000): string {
        if (password.length > PasswordHasher.MAX_PASSWORD_LENGTH) {
            throw new Error('Password exceeds ' + PasswordHasher.MAX_PASSWORD_LENGTH + ' characters');
        }
        
        const nodeAlgorithm = PasswordHasher.getAlgorithm(algorithm);
        if (!nodeAlgorithm) {
            return PasswordHasher.defaultHashPassword(password);
        }

        const saltValue = Buffer.from(salt, 'base64');
        const encodedPassword = Buffer.from(password, 'utf16le');

        let hashValue = createHash(nodeAlgorithm)
            .update(saltValue)
            .update(encodedPassword)
            .digest();

        for (let i = 0; i < spinCount; ++i) {
            const buffer = Buffer.alloc(4);
            buffer.writeUInt32LE(i, 0);
            hashValue = createHash(nodeAlgorithm)
                .update(hashValue)
                .update(buffer)
                .digest();
        }

        return hashValue.toString('base64');
    }
}
