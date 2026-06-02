import { BitbucketUseCase } from '../../../src/application/use-case/impl/BitbucketUseCase.js';
import { McpError, ErrorCode } from '@modelcontextprotocol/sdk/types.js';

describe('BitbucketUseCase', () => {
    const facade = {
        getDefaultProjectKey: jest.fn(),
        createBitbucketPullRequest: jest.fn(),
        getBitbucketPullRequestDetails: jest.fn(),
        mergeBitbucketPullRequest: jest.fn(),
        declineBitbucketPullRequest: jest.fn(),
        addBitbucketGeneralPullRequestComment: jest.fn(),
        getBitbucketPullRequestDiff: jest.fn(),
        getBitbucketPullRequestReviews: jest.fn(),
        listBitbucketWorkspaces: jest.fn(),
        listBitbucketRepositories: jest.fn(),
        searchBitbucketContent: jest.fn(),
        getBitbucketRepositoryDetails: jest.fn(),
        getBitbucketFileContent: jest.fn(),
        browseBitbucketDirectory: jest.fn(),
        createBitbucketBranch: jest.fn(),
        addBitbucketPullRequestFileLineComment: jest.fn(),
        listBitbucketRepositoryBranches: jest.fn(),
        getBitbucketUserDetails: jest.fn(),
    } as any;

    const useCase = new BitbucketUseCase(facade);

    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('uses default project when creating pull request', async () => {
        facade.getDefaultProjectKey.mockReturnValue('PRJ');
        facade.createBitbucketPullRequest.mockResolvedValue({ id: 10 });

        const input = {
            repository: 'repo',
            title: 'title',
            sourceBranch: 'feature/x',
            targetBranch: 'main',
        } as any;

        const result = await useCase.bitbucketCreatePullRequest(input);

        expect(facade.createBitbucketPullRequest).toHaveBeenCalledWith({ ...input, project: 'PRJ' });
        expect(result).toEqual({ id: 10 });
    });

    it('throws InvalidParams when project is missing for pull request details', async () => {
        facade.getDefaultProjectKey.mockReturnValue(undefined);

        await expect(
            useCase.bitbucketGetPullRequestDetails({ repository: 'repo', prId: 1 } as any)
        ).rejects.toMatchObject({
            code: ErrorCode.InvalidParams,
        } satisfies Partial<McpError>);
    });

    it('maps merge input to params and options', async () => {
        facade.getDefaultProjectKey.mockReturnValue('PRJ');
        facade.mergeBitbucketPullRequest.mockResolvedValue({ merged: true });

        const result = await useCase.bitbucketMergePullRequest({
            repository: 'repo',
            prId: 9,
            strategy: 'squash',
            message: 'done',
        } as any);

        expect(facade.mergeBitbucketPullRequest).toHaveBeenCalledWith(
            { project: 'PRJ', repository: 'repo', prId: 9 },
            { message: 'done', strategy: 'squash' }
        );
        expect(result).toEqual({ merged: true });
    });

    it('throws explicit error when create pull request has no provided/default project', async () => {
        facade.getDefaultProjectKey.mockReturnValue(undefined);

        await expect(
            useCase.bitbucketCreatePullRequest({ repository: 'repo', title: 'x', sourceBranch: 'a', targetBranch: 'b' } as any)
        ).rejects.toThrow('Bitbucket project key is required and no default is set.');
    });

    it('delegates remaining use-case methods to facade', async () => {
        facade.getDefaultProjectKey.mockReturnValue('PRJ');
        facade.declineBitbucketPullRequest.mockResolvedValue({ ok: 1 });
        facade.addBitbucketGeneralPullRequestComment.mockResolvedValue({ ok: 2 });
        facade.getBitbucketPullRequestDiff.mockResolvedValue({ ok: 3 });
        facade.getBitbucketPullRequestReviews.mockResolvedValue({ ok: 4 });
        facade.listBitbucketWorkspaces.mockResolvedValue({ ok: 5 });
        facade.listBitbucketRepositories.mockResolvedValue({ ok: 6 });
        facade.searchBitbucketContent.mockResolvedValue({ ok: 7 });
        facade.getBitbucketRepositoryDetails.mockResolvedValue({ ok: 8 });
        facade.getBitbucketFileContent.mockResolvedValue({ ok: 9 });
        facade.browseBitbucketDirectory.mockResolvedValue({ ok: 10 });
        facade.createBitbucketBranch.mockResolvedValue({ ok: 11 });
        facade.addBitbucketPullRequestFileLineComment.mockResolvedValue({ ok: 12 });
        facade.listBitbucketRepositoryBranches.mockResolvedValue({ ok: 13 });
        facade.getBitbucketUserDetails.mockResolvedValue({ ok: 14 });

        await expect(useCase.bitbucketDeclinePullRequest({ repository: 'repo', prId: 1 } as any)).resolves.toEqual({ ok: 1 });
        await expect(useCase.bitbucketAddGeneralPullRequestComment({ repository: 'repo', prId: 1, text: 'x' } as any)).resolves.toEqual({ ok: 2 });
        await expect(useCase.bitbucketGetPullRequestDiff({ repository: 'repo', prId: 1, contextLines: 5 } as any)).resolves.toEqual({ ok: 3 });
        await expect(useCase.bitbucketGetPullRequestReviews({ repository: 'repo', prId: 1 } as any)).resolves.toEqual({ ok: 4 });
        await expect(useCase.bitbucketListWorkspaces({ query: 'n11' } as any)).resolves.toEqual({ ok: 5 });
        await expect(useCase.bitbucketListRepositories({ query: 'repo' } as any)).resolves.toEqual({ ok: 6 });
        await expect(useCase.bitbucketSearchContent({ workspaceSlug: 'N11', query: 'x' } as any)).resolves.toEqual({ ok: 7 });
        await expect(useCase.bitbucketGetRepositoryDetails({ workspaceSlug: 'N11', repoSlug: 'repo' } as any)).resolves.toEqual({ ok: 8 });
        await expect(useCase.bitbucketGetFileContent({ workspaceSlug: 'N11', repoSlug: 'repo', filePath: 'a.ts' } as any)).resolves.toEqual({ ok: 9 });
        await expect(useCase.bitbucketBrowseDirectory({ workspaceSlug: 'N11', repoSlug: 'repo' } as any)).resolves.toEqual({ ok: 10 });
        await expect(useCase.bitbucketCreateBranch({ workspaceSlug: 'N11', repoSlug: 'repo', newBranchName: 'feat/x' } as any)).resolves.toEqual({ ok: 11 });
        await expect(useCase.bitbucketAddPullRequestFileLineComment({ workspaceSlug: 'N11', repoSlug: 'repo', prId: 1, content: 'ok' } as any)).resolves.toEqual({ ok: 12 });
        await expect(useCase.bitbucketListRepositoryBranches({ workspaceSlug: 'N11', repoSlug: 'repo' } as any)).resolves.toEqual({ ok: 13 });
        await expect(useCase.bitbucketGetUserDetails({ username: 'john' } as any)).resolves.toEqual({ ok: 14 });
    });
});


