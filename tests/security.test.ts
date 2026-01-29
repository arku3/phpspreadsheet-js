import { describe, expect, it } from 'bun:test';
import { Security } from '../src/document/security.ts';

describe('Security', () => {
    it('should have default values', () => {
        const security = new Security();
        expect(security.getLockRevision()).toBe(false);
        expect(security.getLockStructure()).toBe(false);
        expect(security.getLockWindows()).toBe(false);
        expect(security.isSecurityEnabled()).toBe(false);
    });

    it('should enable security when locked', () => {
        const security = new Security();
        security.setLockStructure(true);
        expect(security.isSecurityEnabled()).toBe(true);
    });

    it('should hash workbook password', () => {
        const security = new Security();
        security.setWorkbookPassword('password');
        // 'password' legacy hash is 83AF
        expect(security.getWorkbookPassword()).toBe('83AF');
    });

    it('should use advanced hashing if configured', () => {
        const security = new Security();
        security.setWorkbookAlgorithmName('SHA-256');
        security.setWorkbookSaltValue('salt', true);
        security.setWorkbookSpinCount(1000);
        
        security.setWorkbookPassword('password');
        
        expect(security.getWorkbookPassword()).toBe('');
        expect(security.getWorkbookHashValue()).toBeDefined();
        expect(security.getWorkbookHashValue().length).toBeGreaterThan(10);
    });
});
