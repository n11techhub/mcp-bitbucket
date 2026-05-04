/**
 * @fileoverview Unit tests for src/infrastructure/http/schemaSanitizer.ts
 * Verifies Gemini-compatible JSON Schema transformation and hardening guards
 * (prototype pollution protection, recursion depth limit, input immutability).
 */

import {sanitizeSchema} from '../../../src/infrastructure/http/schemaSanitizer.js';

describe('sanitizeSchema', () => {
    describe('primitive and nullish values', () => {
        it('returns null unchanged', () => {
            expect(sanitizeSchema(null)).toBeNull();
        });

        it('returns undefined unchanged', () => {
            expect(sanitizeSchema(undefined)).toBeUndefined();
        });

        it('returns strings unchanged', () => {
            expect(sanitizeSchema('hello')).toBe('hello');
        });

        it('returns numbers unchanged', () => {
            expect(sanitizeSchema(42)).toBe(42);
        });

        it('returns booleans unchanged', () => {
            expect(sanitizeSchema(true)).toBe(true);
            expect(sanitizeSchema(false)).toBe(false);
        });
    });

    describe('Gemini compatibility: array type rewriting', () => {
        it('rewrites type array into anyOf at the root', () => {
            const input = {type: ['string', 'null']};
            const output: any = sanitizeSchema(input);

            expect(output.type).toBeUndefined();
            expect(output.anyOf).toEqual([{type: 'string'}, {type: 'null'}]);
        });

        it('rewrites type array inside nested properties', () => {
            const input = {
                type: 'object',
                properties: {
                    name: {type: ['string', 'null']},
                    age: {type: 'number'},
                },
            };
            const output: any = sanitizeSchema(input);

            expect(output.type).toBe('object');
            expect(output.properties.name.type).toBeUndefined();
            expect(output.properties.name.anyOf).toEqual([
                {type: 'string'},
                {type: 'null'},
            ]);
            expect(output.properties.age).toEqual({type: 'number'});
        });

        it('rewrites type array inside array items', () => {
            const input = {
                type: 'array',
                items: {type: ['string', 'integer']},
            };
            const output: any = sanitizeSchema(input);

            expect(output.items.type).toBeUndefined();
            expect(output.items.anyOf).toEqual([
                {type: 'string'},
                {type: 'integer'},
            ]);
        });

        it('preserves single-string type as-is', () => {
            const input = {type: 'string', minLength: 1};
            expect(sanitizeSchema(input)).toEqual({type: 'string', minLength: 1});
        });

        it('preserves existing anyOf without modification', () => {
            const input = {
                anyOf: [{type: 'string'}, {type: 'number'}],
            };
            expect(sanitizeSchema(input)).toEqual(input);
        });

        it('handles empty type array by producing empty anyOf', () => {
            const output: any = sanitizeSchema({type: []});
            expect(output.type).toBeUndefined();
            expect(output.anyOf).toEqual([]);
        });

        it('does not rewrite non-root arrays that are not property values of `type`', () => {
            const input = {enum: ['a', 'b', 'c']};
            expect(sanitizeSchema(input)).toEqual({enum: ['a', 'b', 'c']});
        });
    });

    describe('input immutability', () => {
        it('does not mutate the input object', () => {
            const input = {type: ['string', 'null'], description: 'x'};
            const snapshot = JSON.parse(JSON.stringify(input));

            sanitizeSchema(input);

            expect(input).toEqual(snapshot);
        });

        it('does not mutate nested input objects', () => {
            const input = {
                properties: {
                    name: {type: ['string', 'null']},
                },
            };
            const snapshot = JSON.parse(JSON.stringify(input));

            sanitizeSchema(input);

            expect(input).toEqual(snapshot);
        });

        it('returns a new top-level object reference', () => {
            const input = {type: 'string'};
            const output = sanitizeSchema(input);
            expect(output).not.toBe(input);
        });
    });

    describe('prototype pollution defense', () => {
        it('drops __proto__ keys from input', () => {
            const payload = JSON.parse(
                '{"type":"object","__proto__":{"polluted":true}}'
            );
            const output: any = sanitizeSchema(payload);

            expect(output.__proto__).toBe(Object.prototype);
            expect(output.polluted).toBeUndefined();
            expect(({} as any).polluted).toBeUndefined();
        });

        it('drops constructor keys from input', () => {
            const payload = JSON.parse(
                '{"type":"object","constructor":{"prototype":{"polluted":true}}}'
            );
            const output: any = sanitizeSchema(payload);

            expect(Object.prototype.hasOwnProperty.call(output, 'constructor')).toBe(false);
            expect(({} as any).polluted).toBeUndefined();
        });

        it('drops prototype keys from input', () => {
            const payload = JSON.parse(
                '{"type":"object","prototype":{"polluted":true}}'
            );
            const output: any = sanitizeSchema(payload);

            expect(Object.prototype.hasOwnProperty.call(output, 'prototype')).toBe(false);
            expect(({} as any).polluted).toBeUndefined();
        });

        it('does not pollute Object.prototype via deeply nested payload', () => {
            const payload = JSON.parse(
                '{"properties":{"x":{"__proto__":{"isAdmin":true}}}}'
            );
            sanitizeSchema(payload);
            expect(({} as any).isAdmin).toBeUndefined();
        });
    });

    describe('recursion depth limit', () => {
        it('terminates gracefully on extremely deep objects', () => {
            const depth = 500;
            let deep: any = {leaf: true};
            for (let i = 0; i < depth; i++) {
                deep = {nested: deep};
            }

            expect(() => sanitizeSchema(deep)).not.toThrow();
        });

        it('terminates gracefully on extremely deep arrays', () => {
            const depth = 500;
            let deep: any = ['leaf'];
            for (let i = 0; i < depth; i++) {
                deep = [deep];
            }

            expect(() => sanitizeSchema(deep)).not.toThrow();
        });
    });

    describe('real-world tool inputSchema shape', () => {
        it('sanitizes a representative MCP tool inputSchema', () => {
            const input = {
                type: 'object',
                required: ['repository'],
                properties: {
                    repository: {type: 'string'},
                    prId: {type: ['number', 'null']},
                    labels: {
                        type: 'array',
                        items: {type: ['string', 'null']},
                    },
                },
            };

            const output: any = sanitizeSchema(input);

            expect(output.type).toBe('object');
            expect(output.required).toEqual(['repository']);
            expect(output.properties.repository).toEqual({type: 'string'});
            expect(output.properties.prId.type).toBeUndefined();
            expect(output.properties.prId.anyOf).toEqual([
                {type: 'number'},
                {type: 'null'},
            ]);
            expect(output.properties.labels.items.anyOf).toEqual([
                {type: 'string'},
                {type: 'null'},
            ]);
        });
    });
});
