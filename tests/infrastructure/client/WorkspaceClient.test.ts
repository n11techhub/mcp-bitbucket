import axios from 'axios';
import { WorkspaceClient } from '../../../src/infrastructure/client/WorkspaceClient.js';

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

describe('WorkspaceClient', () => {
    const logger = { info: jest.fn(), error: jest.fn() } as any;
    const api = { get: jest.fn(), post: jest.fn(), defaults: { baseURL: 'http://x' } };

    beforeEach(() => {
        jest.clearAllMocks();
        (axios as any).create.mockReturnValue(api);
    });

    it('lists workspaces with query mapped to name param', async () => {
        api.get.mockResolvedValue({ data: { values: [{ key: 'N11' }] } });
        const client = new WorkspaceClient({ baseUrl: 'http://bb' } as any, logger);

        const result = await client.listBitbucketWorkspaces({ query: 'n11' } as any);

        expect(api.get).toHaveBeenCalledWith('/projects', { params: { name: 'n11' } });
        expect(result.content[0].type).toBe('text');
    });

    it('uses empty params when no query is provided', async () => {
        api.get.mockResolvedValue({ data: { values: [] } });
        const client = new WorkspaceClient({ baseUrl: 'http://bb' } as any, logger);

        await client.listBitbucketWorkspaces({} as any);

        expect(api.get).toHaveBeenCalledWith('/projects', { params: {} });
    });

    it('maps axios errors while listing workspaces', async () => {
        (axios as any).isAxiosError.mockReturnValue(true);
        api.get.mockRejectedValue({
            response: { data: { message: 'denied' } },
            message: 'request failed',
        });
        const client = new WorkspaceClient({ baseUrl: 'http://bb' } as any, logger);

        await expect(client.listBitbucketWorkspaces({} as any)).rejects.toMatchObject({
            message: expect.stringContaining('Bitbucket API error: denied'),
        });
    });

    it('maps non-axios errors while listing workspaces', async () => {
        (axios as any).isAxiosError.mockReturnValue(false);
        api.get.mockRejectedValue(new Error('socket closed'));
        const client = new WorkspaceClient({ baseUrl: 'http://bb' } as any, logger);

        await expect(client.listBitbucketWorkspaces({} as any)).rejects.toMatchObject({
            message: expect.stringContaining('Failed to list workspaces: socket closed'),
        });
    });
});


