import axios from 'axios';
import { PullRequestClient } from '../../../src/infrastructure/client/PullRequestClient.js';

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

describe('PullRequestClient', () => {
    const logger = { info: jest.fn(), error: jest.fn() } as any;
    const api = { get: jest.fn(), post: jest.fn(), defaults: { baseURL: 'http://x' } };

    beforeEach(() => {
        jest.clearAllMocks();
        (axios as any).create.mockReturnValue(api);
    });

    it('uses merge-commit as default merge strategy', async () => {
        api.post.mockResolvedValue({ data: { merged: true } });
        const client = new PullRequestClient({ baseUrl: 'http://bb' } as any, logger);

        await client.mergeBitbucketPullRequest({ project: 'N11', repository: 'repo', prId: 11 } as any, {} as any);

        expect(api.post).toHaveBeenCalledWith(
            '/projects/N11/repos/repo/pull-requests/11/merge',
            expect.objectContaining({ strategy: 'merge-commit', version: -1 })
        );
    });

    it('adds file-line comment with default anchor values', async () => {
        api.post.mockResolvedValue({ data: { id: 1 } });
        const client = new PullRequestClient({ baseUrl: 'http://bb' } as any, logger);

        await client.addBitbucketPullRequestFileLineComment({
            workspaceSlug: 'N11',
            repoSlug: 'repo',
            prId: 4,
            content: 'LGTM',
            inline: { path: 'src/a.ts', line: 25 },
        } as any);

        expect(api.post).toHaveBeenCalledWith(
            '/projects/N11/repos/repo/pull-requests/4/comments',
            expect.objectContaining({
                text: 'LGTM',
                anchor: expect.objectContaining({
                    line: 25,
                    lineType: 'CONTEXT',
                    fileType: 'TO',
                    path: 'src/a.ts',
                }),
            })
        );
    });

    it('covers core pull request operations', async () => {
        api.post.mockResolvedValue({ data: { ok: true } });
        api.get.mockResolvedValue({ data: { ok: true } });
        const client = new PullRequestClient({ baseUrl: 'http://bb' } as any, logger);

        await client.createBitbucketPullRequest({
            project: 'N11',
            repository: 'repo',
            title: 'PR',
            sourceBranch: 'feature/x',
            targetBranch: 'main',
            reviewers: ['alice'],
        } as any);
        await client.getBitbucketPullRequestDetails({ project: 'N11', repository: 'repo', prId: 7 } as any);
        await client.declineBitbucketPullRequest({ project: 'N11', repository: 'repo', prId: 7 } as any, 'nope');
        await client.addBitbucketGeneralPullRequestComment({ project: 'N11', repository: 'repo', prId: 7 } as any, { text: 'hi' } as any);
        await client.getBitbucketPullRequestDiff({ project: 'N11', repository: 'repo', prId: 7 } as any, 4);
        await client.getBitbucketPullRequestReviews({ project: 'N11', repository: 'repo', prId: 7 } as any);

        expect(api.post).toHaveBeenCalledWith(
            '/projects/N11/repos/repo/pull-requests',
            expect.objectContaining({ title: 'PR' })
        );
        expect(api.get).toHaveBeenCalledWith('/projects/N11/repos/repo/pull-requests/7');
        expect(api.get).toHaveBeenCalledWith('/projects/N11/repos/repo/pull-requests/7/diff', {
            params: { withComments: false, contextLines: 4 },
        });
        expect(api.get).toHaveBeenCalledWith('/projects/N11/repos/repo/pull-requests/7/activities', {
            params: { activity: 'reviews' },
        });
    });

    it('maps axios errors in addBitbucketPullRequestFileLineComment', async () => {
        (axios as any).isAxiosError.mockReturnValue(true);
        api.post.mockRejectedValue({
            response: { data: { message: 'bad request' } },
            message: 'request failed',
        });
        const client = new PullRequestClient({ baseUrl: 'http://bb' } as any, logger);

        await expect(
            client.addBitbucketPullRequestFileLineComment({
                workspaceSlug: 'N11',
                repoSlug: 'repo',
                prId: 4,
                content: 'LGTM',
            } as any)
        ).rejects.toMatchObject({ message: expect.stringContaining('Bitbucket API error: bad request') });
    });

    it('supports threaded parent comment payload branch', async () => {
        api.post.mockResolvedValue({ data: { id: 2 } });
        const client = new PullRequestClient({ baseUrl: 'http://bb' } as any, logger);

        await client.addBitbucketPullRequestFileLineComment({
            workspaceSlug: 'N11',
            repoSlug: 'repo',
            prId: 4,
            content: 'reply',
            parentId: 99,
        } as any);

        expect(api.post).toHaveBeenCalledWith(
            '/projects/N11/repos/repo/pull-requests/4/comments',
            expect.objectContaining({ parent: { id: 99 } })
        );
    });

    it('maps non-axios errors in addBitbucketPullRequestFileLineComment', async () => {
        (axios as any).isAxiosError.mockReturnValue(false);
        api.post.mockRejectedValue(new Error('timeout'));
        const client = new PullRequestClient({ baseUrl: 'http://bb' } as any, logger);

        await expect(
            client.addBitbucketPullRequestFileLineComment({
                workspaceSlug: 'N11',
                repoSlug: 'repo',
                prId: 4,
                content: 'LGTM',
            } as any)
        ).rejects.toMatchObject({ message: expect.stringContaining('Failed to add PR comment: timeout') });
    });
});


