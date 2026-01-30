import { describe, expect, it } from 'bun:test';
import { PasswordHasher } from '../src/shared/password-hasher.ts';

describe('PasswordHasher', () => {
    it('should generate default hash (legacy Excel)', () => {
        // Test with known values verified with PHP
        const hash = PasswordHasher.hashPassword('password');
        expect(hash).toBe('83AF');
    });

    it('should generate ISO hash (SHA-256)', () => {
        const salt = 'abcdefg1234567';
        const hash = PasswordHasher.hashPassword('password', 'SHA-256', Buffer.from(salt).toString('base64'), 1000);
        expect(hash).toBeDefined();
        expect(typeof hash).toBe('string');
        expect(hash.length).toBeGreaterThan(0);
    });

    it('should throw error for long passwords', () => {
        const longPassword = 'a'.repeat(PasswordHasher.MAX_PASSWORD_LENGTH + 1);
        expect(() => PasswordHasher.hashPassword(longPassword)).toThrow(/exceeds/);
    });

    it('should throw error for unsupported algorithms', () => {
        expect(() => PasswordHasher.hashPassword('pw', 'INVALID')).toThrow(/Unsupported/);
    });
});
