import { sanitizeSchema } from '../../../src/application/util/SchemaSanitizer.js';

describe('SchemaSanitizer', () => {
    it('converts type arrays to anyOf', () => {
        const input = { type: ['string', 'null'] };

        const result = sanitizeSchema(input);

        expect(result).toEqual({ anyOf: [{ type: 'string' }, { type: 'null' }] });
    });

    it('recursively sanitizes nested schemas', () => {
        const input = {
            properties: {
                name: { type: ['string', 'null'] },
            },
        };

        const result = sanitizeSchema(input);

        expect(result).toEqual({
            properties: {
                name: { anyOf: [{ type: 'string' }, { type: 'null' }] },
            },
        });
    });

    it('skips dangerous keys to prevent prototype pollution', () => {
        const input = {
            type: 'object',
            __proto__: { polluted: true },
            constructor: { evil: true },
            prototype: { bad: true },
            safe: { type: ['number', 'null'] },
        } as any;

        const result = sanitizeSchema(input) as any;

        expect(result.__proto__).not.toEqual({ polluted: true });
        expect(Object.prototype.hasOwnProperty.call(result, 'constructor')).toBe(false);
        expect(Object.prototype.hasOwnProperty.call(result, 'prototype')).toBe(false);
        expect(result.safe).toEqual({ anyOf: [{ type: 'number' }, { type: 'null' }] });
    });

    it('returns input as-is for primitives/null/undefined', () => {
        expect(sanitizeSchema('x')).toBe('x');
        expect(sanitizeSchema(3)).toBe(3);
        expect(sanitizeSchema(null)).toBeNull();
        expect(sanitizeSchema(undefined)).toBeUndefined();
    });

    it('handles arrays by sanitizing each item', () => {
        const input = [{ type: ['string', 'null'] }, { type: 'number' }];

        const result = sanitizeSchema(input);

        expect(result).toEqual([{ anyOf: [{ type: 'string' }, { type: 'null' }] }, { type: 'number' }]);
    });
});

