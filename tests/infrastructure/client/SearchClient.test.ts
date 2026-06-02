import axios from 'axios';
import { SearchClient } from '../../../src/infrastructure/client/SearchClient.js';

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

describe('SearchClient', () => {
    const logger = { info: jest.fn(), error: jest.fn() } as any;
    const api = { get: jest.fn(), post: jest.fn(), defaults: { baseURL: 'http://bb/rest/api/1.0' } };

    beforeEach(() => {
        jest.clearAllMocks();
        (axios as any).create.mockReturnValue(api);
    });

    it('builds payload with scope and advanced query', async () => {
        api.post.mockResolvedValue({ data: { values: [] } });
        const client = new SearchClient({ baseUrl: 'http://bb' } as any, logger);

        await client.searchBitbucketContent({
            workspaceSlug: 'N11',
            query: 'find me',
            scope: 'repo-1',
            extension: 'ts',
            language: 'typescript',
        } as any);

        expect(api.post).toHaveBeenCalledWith(
            'http://bb/rest/api/1.0/search/codes',
            expect.objectContaining({
                query: 'find me',
                advancedQuery: 'ext:ts lang:typescript',
                scope: {
                    type: 'REPOSITORY',
                    resource: { project: { key: 'N11' }, slug: 'repo-1' },
                },
            })
        );
    });

    it('maps axios errors to McpError', async () => {
        (axios as any).isAxiosError.mockReturnValue(true);
        api.post.mockRejectedValue({
            response: { data: { message: 'search blocked' } },
            message: 'request failed',
        });
        const client = new SearchClient({ baseUrl: 'http://bb' } as any, logger);

        await expect(
            client.searchBitbucketContent({ workspaceSlug: 'N11', query: 'x' } as any)
        ).rejects.toMatchObject({ message: expect.stringContaining('Bitbucket API error: search blocked') });
    });
});


