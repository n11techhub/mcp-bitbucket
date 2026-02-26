/**
 * Security validation utilities for input sanitization
 */

const PROJECT_KEY_PATTERN = /^[A-Z0-9_-]+$/i;
const MAX_PROJECT_KEY_LENGTH = 255;

/**
 * Validates and sanitizes a project key to prevent path traversal and injection attacks
 * @param projectKey - The project key to validate
 * @returns The validated project key
 * @throws Error if the project key is invalid
 */
export function validateProjectKey(projectKey: string | undefined): string | undefined {
    if (!projectKey) {
        return undefined;
    }

    // Trim whitespace
    const trimmed = projectKey.trim();

    // Check if empty after trimming
    if (trimmed.length === 0) {
        throw new Error('Project key cannot be empty');
    }

    // Check length
    if (trimmed.length > MAX_PROJECT_KEY_LENGTH) {
        throw new Error(`Project key too long (max ${MAX_PROJECT_KEY_LENGTH} characters)`);
    }

    // Check for path traversal attempts
    if (trimmed.includes('..') || trimmed.includes('/') || trimmed.includes('\\')) {
        throw new Error('Project key contains invalid characters (path traversal attempt detected)');
    }

    // Validate against allowed pattern
    if (!PROJECT_KEY_PATTERN.test(trimmed)) {
        throw new Error('Invalid project key format. Only alphanumeric characters, underscores, and hyphens are allowed.');
    }

    return trimmed;
}

/**
 * Sanitizes a string for safe logging to prevent log injection
 * @param value - The value to sanitize
 * @returns Sanitized string safe for logging
 */
export function sanitizeForLogging(value: string): string {
    // Remove newlines and control characters to prevent log injection
    // eslint-disable-next-line no-control-regex
    return value.replace(/[\n\r\t\x00-\x1F\x7F]/g, '');
}
