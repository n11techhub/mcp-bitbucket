import axios from 'axios';
import { BaseClient } from '../../../src/infrastructure/client/BaseClient.js';

jest.mock('axios', () => {
    const create = jest.fn();
    const isAxiosError = jest.fn((error: any) => Boolean(error?.isAxiosError));
    return {
        __esModule: true,
        default: { create, isAxiosError },
        create,
        isAxiosError,
    };
});

describe('BaseClient', () => {
    const logger = { info: jest.fn(), error: jest.fn() } as any;

    beforeEach(() => {
        jest.clearAllMocks();
        (axios as any).create.mockReturnValue({});
    });

    it('configures axios with bearer token when token is provided', () => {
        const config = {
            baseUrl: 'https://bitbucket.local',
            token: 'abc-token',
        } as any;

        new BaseClient(config, logger);

        expect((axios as any).create).toHaveBeenCalledWith({
            baseURL: 'https://bitbucket.local/rest/api/1.0',
            headers: { Authorization: 'Bearer abc-token' },
            auth: undefined,
        });
    });

    it('configures axios with basic auth when username/password are provided', () => {
        const config = {
            baseUrl: 'https://bitbucket.local',
            username: 'user',
            password: 'pass',
        } as any;

        new BaseClient(config, logger);

        expect((axios as any).create).toHaveBeenCalledWith({
            baseURL: 'https://bitbucket.local/rest/api/1.0',
            headers: {},
            auth: { username: 'user', password: 'pass' },
        });
    });
});

