/**
 * Sanitizes JSON Schema objects to be compatible with Google Gemini's
 * function-calling schema validator.
 *
 * Known Gemini incompatibilities handled here:
 *  - `type` declared as an array (e.g. ["string", "null"]). Gemini only
 *    accepts a single string for `type`, so we rewrite it as `anyOf`.
 *
 * The function is pure: it returns a new value and never mutates input.
 *
 * Safety:
 *  - Skips dangerous keys (`__proto__`, `prototype`, `constructor`) to
 *    avoid prototype pollution from attacker-controlled schemas.
 *  - Bounds recursion depth to prevent stack overflow on hostile input.
 */
const MAX_DEPTH = 64;
const FORBIDDEN_KEYS = new Set(['__proto__', 'prototype', 'constructor']);

export function sanitizeSchema<T>(value: T, depth = 0): T {
    if (value === null || value === undefined) {
        return value;
    }

    if (depth > MAX_DEPTH) {
        return value;
    }

    if (Array.isArray(value)) {
        return value.map((item) => sanitizeSchema(item, depth + 1)) as unknown as T;
    }

    if (typeof value !== 'object') {
        return value;
    }

    const source = value as Record<string, unknown>;
    const result: Record<string, unknown> = Object.create(null);

    for (const [key, val] of Object.entries(source)) {
        if (FORBIDDEN_KEYS.has(key)) {
            continue;
        }
        result[key] = sanitizeSchema(val, depth + 1);
    }

    if (Array.isArray(result.type)) {
        const types = result.type as unknown[];
        delete result.type;
        result.anyOf = types.map((t) => ({type: t}));
    }

    return Object.assign({}, result) as unknown as T;
}
