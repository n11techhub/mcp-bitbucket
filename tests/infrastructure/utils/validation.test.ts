import { sanitizeForLogging, validateProjectKey } from '../../../src/application/util/Validator.js';

describe('Validator utilities', () => {
    describe('validateProjectKey', () => {
        it('accepts valid project keys', () => {
            expect(validateProjectKey('N11')).toBe('N11');
            expect(validateProjectKey('ABC_123')).toBe('ABC_123');
        });

        it('rejects traversal-like keys', () => {
            expect(() => validateProjectKey('../etc/passwd')).toThrow('path traversal attempt detected');
            expect(() => validateProjectKey('my/project')).toThrow('path traversal attempt detected');
        });

        it('handles optional and empty-ish values', () => {
            expect(validateProjectKey(undefined)).toBeUndefined();
            expect(() => validateProjectKey('   ')).toThrow('Project key cannot be empty');
        });
    });

    describe('sanitizeForLogging', () => {
        it('removes control characters and line breaks', () => {
            expect(sanitizeForLogging('line1\nline2\t\r')).toBe('line1line2');
        });

        it('keeps regular content unchanged', () => {
            expect(sanitizeForLogging('safe text 123')).toBe('safe text 123');
        });
    });
});


