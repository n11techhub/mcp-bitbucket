import { Types } from '../../src/application/Types.js';

describe('Types tokens', () => {
    it('contains key DI tokens used by app bootstrap', () => {
        expect(Types.Configuration).toBeDefined();
        expect(Types.Logger).toBeDefined();
        expect(Types.McpServerSetup).toBeDefined();
        expect(Types.McpHttpServer).toBeDefined();
        expect(Types.McpServerFactory).toBeDefined();
    });

    it('uses symbols to avoid token collisions', () => {
        expect(typeof Types.Logger).toBe('symbol');
        expect(Types.Logger).not.toBe(Types.Configuration);
    });
});

