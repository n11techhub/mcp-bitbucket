import axios from 'axios';
import { ErrorCode } from '@modelcontextprotocol/sdk/types.js';
import { RepositoryClient } from '../../../src/infrastructure/client/RepositoryClient.js';

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

describe('RepositoryClient', () => {
    const logger = { info: jest.fn(), error: jest.fn() } as any;
    const api = { get: jest.fn(), post: jest.fn(), defaults: { baseURL: 'http://x' } };

    beforeEach(() => {
        jest.clearAllMocks();
        (axios as any).create.mockReturnValue(api);
    });

    it('lists repositories with mapped query params', async () => {
        api.get.mockResolvedValue({ data: { values: [{ slug: 'repo' }] } });
        const client = new RepositoryClient({ baseUrl: 'http://bb', defaultProject: 'PRJ' } as any, logger);

        const result = await client.listBitbucketRepositories({
            workspaceSlug: 'N11',
            query: 'api',
            role: 'REPO_READ',
        } as any);

        expect(api.get).toHaveBeenCalledWith('/projects/N11/repos', {
            params: { name: 'api', permission: 'REPO_READ' },
        });
        expect(result.content[0].type).toBe('text');
    });

    it('throws InvalidParams when project key cannot be resolved', async () => {
        const client = new RepositoryClient({ baseUrl: 'http://bb' } as any, logger);

        await expect(client.listBitbucketRepositories({} as any)).rejects.toMatchObject({
            code: ErrorCode.InvalidParams,
        });
    });

    it('normalizes root browse path to /browse endpoint', async () => {
        api.get.mockResolvedValue({ data: { values: [] } });
        const client = new RepositoryClient({ baseUrl: 'http://bb', defaultProject: 'PRJ' } as any, logger);

        await client.browseBitbucketDirectory({ workspaceSlug: 'N11', repoSlug: 'repo', path: '/' } as any);

        expect(api.get).toHaveBeenCalledWith('/projects/N11/repos/repo/browse', { params: {} });
    });

    it('covers branch listing, branch creation, file fetch and repo details', async () => {
        api.get.mockResolvedValue({ data: { values: [] } });
        api.post.mockResolvedValue({ data: { ok: true } });
        const client = new RepositoryClient({ baseUrl: 'http://bb', defaultProject: 'PRJ' } as any, logger);

        await client.listBitbucketRepositoryBranches({ workspaceSlug: 'N11', repoSlug: 'repo', query: 'main', sort: 'MODIFICATION' } as any);
        await client.createBitbucketBranch({ workspaceSlug: 'N11', repoSlug: 'repo', newBranchName: 'feature/a' } as any);
        await client.getBitbucketFileContent({ workspaceSlug: 'N11', repoSlug: 'repo', filePath: '/src/a.ts', revision: 'refs/heads/main' } as any);
        await client.getBitbucketRepositoryDetails({ workspaceSlug: 'N11', repoSlug: 'repo' } as any);

        expect(api.get).toHaveBeenCalledWith('/projects/N11/repos/repo/branches', {
            params: { filterText: 'main', orderBy: 'MODIFICATION' },
        });
        expect(api.post).toHaveBeenCalledWith('/projects/N11/repos/repo/branches', {
            name: 'feature/a',
            startPoint: 'main',
        });
        expect(api.get).toHaveBeenCalledWith('/projects/N11/repos/repo/raw/src%2Fa.ts', {
            params: { at: 'refs/heads/main' },
            responseType: 'text',
        });
        expect(api.get).toHaveBeenCalledWith('/projects/N11/repos/repo');
    });

    it('maps axios errors while listing repositories', async () => {
        (axios as any).isAxiosError.mockReturnValue(true);
        api.get.mockRejectedValue({
            response: { data: { message: 'unauthorized' } },
            message: 'request failed',
        });
        const client = new RepositoryClient({ baseUrl: 'http://bb', defaultProject: 'PRJ' } as any, logger);

        await expect(client.listBitbucketRepositories({} as any)).rejects.toMatchObject({
            code: ErrorCode.InternalError,
            message: expect.stringContaining('Bitbucket API error: unauthorized'),
        });
    });

    it('uses default project and empty params when query/role are omitted', async () => {
        api.get.mockResolvedValue({ data: { values: [] } });
        const client = new RepositoryClient({ baseUrl: 'http://bb', defaultProject: 'PRJ' } as any, logger);

        await client.listBitbucketRepositories({} as any);

        expect(api.get).toHaveBeenCalledWith('/projects/PRJ/repos', { params: {} });
    });

    it('maps non-axios error while listing repositories', async () => {
        (axios as any).isAxiosError.mockReturnValue(false);
        api.get.mockRejectedValue(new Error('network down'));
        const client = new RepositoryClient({ baseUrl: 'http://bb', defaultProject: 'PRJ' } as any, logger);

        await expect(client.listBitbucketRepositories({} as any)).rejects.toMatchObject({
            code: ErrorCode.InternalError,
            message: expect.stringContaining('Failed to list repositories: network down'),
        });
    });

    it('covers branches list/create branch/repo details happy paths', async () => {
        api.get.mockResolvedValue({ data: { values: [] } });
        api.post.mockResolvedValue({ data: { ok: true } });
        const client = new RepositoryClient({ baseUrl: 'http://bb', defaultProject: 'PRJ' } as any, logger);

        await client.listBitbucketRepositoryBranches({ workspaceSlug: 'N11', repoSlug: 'repo' } as any);
        await client.createBitbucketBranch({
            workspaceSlug: 'N11',
            repoSlug: 'repo',
            newBranchName: 'feature/y',
            sourceBranchOrCommit: 'refs/heads/develop',
        } as any);
        await client.getBitbucketRepositoryDetails({ workspaceSlug: 'N11', repoSlug: 'repo' } as any);

        expect(api.get).toHaveBeenCalledWith('/projects/N11/repos/repo/branches', { params: {} });
        expect(api.post).toHaveBeenCalledWith('/projects/N11/repos/repo/branches', {
            name: 'feature/y',
            startPoint: 'refs/heads/develop',
        });
        expect(api.get).toHaveBeenCalledWith('/projects/N11/repos/repo');
    });

    it('maps axios errors for branches/create/repo-details', async () => {
        (axios as any).isAxiosError.mockReturnValue(true);
        const client = new RepositoryClient({ baseUrl: 'http://bb', defaultProject: 'PRJ' } as any, logger);

        api.get.mockRejectedValueOnce({ response: { data: { message: 'branches denied' } }, message: 'x' });
        await expect(client.listBitbucketRepositoryBranches({ workspaceSlug: 'N11', repoSlug: 'repo' } as any)).rejects.toMatchObject({
            message: expect.stringContaining('Bitbucket API error: branches denied'),
        });

        api.post.mockRejectedValueOnce({ response: { data: { message: 'create denied' } }, message: 'x' });
        await expect(client.createBitbucketBranch({ workspaceSlug: 'N11', repoSlug: 'repo', newBranchName: 'a' } as any)).rejects.toMatchObject({
            message: expect.stringContaining('Bitbucket API error: create denied'),
        });

        api.get.mockRejectedValueOnce({ response: { data: { message: 'repo denied' } }, message: 'x' });
        await expect(client.getBitbucketRepositoryDetails({ workspaceSlug: 'N11', repoSlug: 'repo' } as any)).rejects.toMatchObject({
            message: expect.stringContaining('Bitbucket API error: repo denied'),
        });
    });

    it('covers get file content branches for revision and axios response shapes', async () => {
        const client = new RepositoryClient({ baseUrl: 'http://bb', defaultProject: 'PRJ' } as any, logger);

        api.get.mockResolvedValueOnce({ data: 'raw-content' });
        await client.getBitbucketFileContent({ workspaceSlug: 'N11', repoSlug: 'repo', filePath: '/a.ts', revision: 'main' } as any);
        expect(api.get).toHaveBeenCalledWith('/projects/N11/repos/repo/raw/a.ts', {
            params: { at: 'main' },
            responseType: 'text',
        });

        (axios as any).isAxiosError.mockReturnValue(true);
        api.get.mockRejectedValueOnce({ response: { data: 'plain error' }, message: 'x' });
        await expect(client.getBitbucketFileContent({ workspaceSlug: 'N11', repoSlug: 'repo', filePath: 'a.ts' } as any)).rejects.toMatchObject({
            message: expect.stringContaining('Bitbucket API error: plain error'),
        });

        api.get.mockRejectedValueOnce({ response: { data: { errors: [{ message: 'zod err' }] } }, message: 'x' });
        await expect(client.getBitbucketFileContent({ workspaceSlug: 'N11', repoSlug: 'repo', filePath: 'a.ts' } as any)).rejects.toMatchObject({
            message: expect.stringContaining('Bitbucket API error: zod err'),
        });
    });

    it('covers browse directory non-root/revision and error paths', async () => {
        const client = new RepositoryClient({ baseUrl: 'http://bb', defaultProject: 'PRJ' } as any, logger);
        api.get.mockResolvedValueOnce({ data: { values: [] } });

        await client.browseBitbucketDirectory({ workspaceSlug: 'N11', repoSlug: 'repo', path: '/src', revision: 'main' } as any);
        expect(api.get).toHaveBeenCalledWith('/projects/N11/repos/repo/browse/src', {
            params: { at: 'main' },
        });

        (axios as any).isAxiosError.mockReturnValue(true);
        api.get.mockRejectedValueOnce({ response: { data: { message: 'browse denied' } }, message: 'x' });
        await expect(client.browseBitbucketDirectory({ workspaceSlug: 'N11', repoSlug: 'repo', path: 'src' } as any)).rejects.toMatchObject({
            message: expect.stringContaining('Bitbucket API error: browse denied'),
        });

        (axios as any).isAxiosError.mockReturnValue(false);
        api.get.mockRejectedValueOnce(new Error('browse network'));
        await expect(client.browseBitbucketDirectory({ workspaceSlug: 'N11', repoSlug: 'repo', path: 'src' } as any)).rejects.toMatchObject({
            message: expect.stringContaining('Failed to browse directory: browse network'),
        });
    });
});


