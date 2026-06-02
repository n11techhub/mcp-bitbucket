import axios from 'axios';
import { ErrorCode } from '@modelcontextprotocol/sdk/types.js';
import { UserClient } from '../../../src/infrastructure/client/UserClient.js';

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

describe('UserClient', () => {
    const logger = { info: jest.fn(), error: jest.fn() } as any;
    const api = { get: jest.fn(), post: jest.fn(), defaults: { baseURL: 'http://x' } };

    beforeEach(() => {
        jest.clearAllMocks();
        (axios as any).create.mockReturnValue(api);
    });

    it('throws InvalidParams when username is missing', async () => {
        const client = new UserClient({ baseUrl: 'http://bb' } as any, logger);

        await expect(client.getBitbucketUserDetails({ username: '' } as any)).rejects.toMatchObject({
            code: ErrorCode.InvalidParams,
        });
    });

    it('fetches user details by username', async () => {
        api.get.mockResolvedValue({ data: { name: 'john' } });
        const client = new UserClient({ baseUrl: 'http://bb' } as any, logger);

        const result = await client.getBitbucketUserDetails({ username: 'john' } as any);

        expect(api.get).toHaveBeenCalledWith('/users/john');
        expect(result.content[0].type).toBe('text');
    });

    it('maps axios error response while fetching user details', async () => {
        (axios as any).isAxiosError.mockReturnValue(true);
        api.get.mockRejectedValue({
            response: { data: { message: 'not found' }, status: 404 },
            message: 'request failed',
        });
        const client = new UserClient({ baseUrl: 'http://bb' } as any, logger);

        await expect(client.getBitbucketUserDetails({ username: 'ghost' } as any)).rejects.toMatchObject({
            code: ErrorCode.InternalError,
            message: expect.stringContaining('Bitbucket API error while fetching user details for ghost: not found'),
        });
    });

    it('maps non-axios errors while fetching user details', async () => {
        (axios as any).isAxiosError.mockReturnValue(false);
        api.get.mockRejectedValue(new Error('connection reset'));
        const client = new UserClient({ baseUrl: 'http://bb' } as any, logger);

        await expect(client.getBitbucketUserDetails({ username: 'ghost' } as any)).rejects.toMatchObject({
            code: ErrorCode.InternalError,
            message: expect.stringContaining('Failed to fetch Bitbucket user details for ghost: connection reset'),
        });
    });
});


