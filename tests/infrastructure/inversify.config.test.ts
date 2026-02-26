import 'reflect-metadata';

describe('inversify.config BitbucketConfig env mapping', () => {
    const originalEnv = process.env;

    const loadContainer = async () => {
        const fakeLogger = {
            info: jest.fn(),
            error: jest.fn(),
            warn: jest.fn(),
            debug: jest.fn(),
        };
        // Mock logger to avoid importing implementation that uses import.meta
        jest.doMock('../../src/infrastructure/logging/logger.js', () => ({
            __esModule: true,
            default: fakeLogger,
        }));
        const { container } = await import('../../src/infrastructure/inversify.config.js');
        const { TYPES } = await import('../../src/infrastructure/types.js');
        return { container, TYPES } as const;
    };

    beforeEach(() => {
        jest.resetModules();
        process.env = { ...originalEnv };
        delete process.env.BITBUCKET_URL;
        delete process.env.BITBUCKET_TOKEN;
        delete process.env.BITBUCKET_USERNAME;
        delete process.env.BITBUCKET_PASSWORD;
        delete process.env.BITBUCKET_DEFAULT_PROJECT;
    });

    afterEach(() => {
        process.env = originalEnv;
    });

    it('builds BitbucketConfig from env vars', async () => {
        process.env.BITBUCKET_URL = 'https://bitbucket.example.com';
        process.env.BITBUCKET_TOKEN = 'token-123';
        process.env.BITBUCKET_USERNAME = 'user';
        process.env.BITBUCKET_PASSWORD = 'pass';
        process.env.BITBUCKET_DEFAULT_PROJECT = 'PROJ';

        let container: any;
        let TYPES: any;
        try {
            ({ container, TYPES } = await loadContainer());
        } catch (e: any) {
            // Help diagnose import-time failures
            // eslint-disable-next-line no-console
            console.error('Import error:', e?.message || e);
            throw e;
        }

    const config = container.get(TYPES.BitbucketConfig);

        expect(config).toEqual({
            baseUrl: 'https://bitbucket.example.com',
            token: 'token-123',
            username: 'user',
            password: 'pass',
            defaultProject: 'PROJ',
        });
    });

    it('falls back to defaults when env vars are missing', async () => {
        // Only baseUrl is required and defaults to empty string
        let container: any;
        let TYPES: any;
        try {
            ({ container, TYPES } = await loadContainer());
        } catch (e: any) {
            // eslint-disable-next-line no-console
            console.error('Import error:', e?.message || e);
            throw e;
        }

    const config = container.get(TYPES.BitbucketConfig);

        expect(config.baseUrl).toBe('');
        expect(config.token).toBeUndefined();
        expect(config.username).toBeUndefined();
        expect(config.password).toBeUndefined();
        expect(config.defaultProject).toBeUndefined();
    });
});
