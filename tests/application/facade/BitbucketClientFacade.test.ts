import { BitbucketClientFacade } from '../../../src/application/facade/impl/BitbucketClientFacade.js';

describe('BitbucketClientFacade', () => {
    const config = { defaultProject: 'PRJ' } as any;

    const pullRequestClient = {
        mergeBitbucketPullRequest: jest.fn(),
        createBitbucketPullRequest: jest.fn(),
        getBitbucketPullRequestDetails: jest.fn(),
        approveBitbucketPullRequest: jest.fn(),
        declineBitbucketPullRequest: jest.fn(),
        addBitbucketGeneralPullRequestComment: jest.fn(),
        getBitbucketPullRequestDiff: jest.fn(),
        getBitbucketPullRequestReviews: jest.fn(),
        addBitbucketPullRequestFileLineComment: jest.fn(),
    } as any;

    const repositoryClient = {
        listBitbucketRepositories: jest.fn(),
        listBitbucketRepositoryBranches: jest.fn(),
        createBitbucketBranch: jest.fn(),
        getBitbucketFileContent: jest.fn(),
        browseBitbucketDirectory: jest.fn(),
        getBitbucketRepositoryDetails: jest.fn(),
    } as any;

    const workspaceClient = { listBitbucketWorkspaces: jest.fn() } as any;
    const searchClient = { searchBitbucketContent: jest.fn() } as any;
    const userClient = { getBitbucketUserDetails: jest.fn() } as any;

    const facade = new BitbucketClientFacade(
        config,
        pullRequestClient,
        repositoryClient,
        workspaceClient,
        searchClient,
        userClient
    );

    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('returns configured default project key', () => {
        expect(facade.getDefaultProjectKey()).toBe('PRJ');
    });

    it('delegates workspace listing to workspace client', async () => {
        workspaceClient.listBitbucketWorkspaces.mockResolvedValue({ content: [] });
        const input = { query: 'n11' };

        const result = await facade.listBitbucketWorkspaces(input);

        expect(workspaceClient.listBitbucketWorkspaces).toHaveBeenCalledWith(input);
        expect(result).toEqual({ content: [] });
    });

    it('delegates pull request merge to pull request client', async () => {
        pullRequestClient.mergeBitbucketPullRequest.mockResolvedValue({ ok: true });
        const params = { project: 'PRJ', repository: 'repo', prId: 7 };
        const options = { strategy: 'squash' as const };

        const result = await facade.mergeBitbucketPullRequest(params, options);

        expect(pullRequestClient.mergeBitbucketPullRequest).toHaveBeenCalledWith(params, options);
        expect(result).toEqual({ ok: true });
    });

    it('delegates remaining methods to underlying clients', async () => {
        pullRequestClient.createBitbucketPullRequest.mockResolvedValue({ ok: 1 });
        pullRequestClient.getBitbucketPullRequestDetails.mockResolvedValue({ ok: 2 });
        pullRequestClient.approveBitbucketPullRequest.mockResolvedValue({ ok: 3 });
        pullRequestClient.declineBitbucketPullRequest.mockResolvedValue({ ok: 4 });
        pullRequestClient.addBitbucketGeneralPullRequestComment.mockResolvedValue({ ok: 5 });
        pullRequestClient.getBitbucketPullRequestDiff.mockResolvedValue({ ok: 6 });
        pullRequestClient.getBitbucketPullRequestReviews.mockResolvedValue({ ok: 7 });
        pullRequestClient.addBitbucketPullRequestFileLineComment.mockResolvedValue({ ok: 8 });
        repositoryClient.listBitbucketRepositories.mockResolvedValue({ ok: 9 });
        repositoryClient.listBitbucketRepositoryBranches.mockResolvedValue({ ok: 10 });
        repositoryClient.createBitbucketBranch.mockResolvedValue({ ok: 11 });
        repositoryClient.getBitbucketFileContent.mockResolvedValue({ ok: 12 });
        repositoryClient.browseBitbucketDirectory.mockResolvedValue({ ok: 13 });
        repositoryClient.getBitbucketRepositoryDetails.mockResolvedValue({ ok: 14 });
        searchClient.searchBitbucketContent.mockResolvedValue({ ok: 15 });
        userClient.getBitbucketUserDetails.mockResolvedValue({ ok: 16 });

        const prInput = { project: 'PRJ', repository: 'repo', title: 'x', sourceBranch: 'a', targetBranch: 'b' };
        const prParams = { project: 'PRJ', repository: 'repo', prId: 1 };

        await expect(facade.createBitbucketPullRequest(prInput as any)).resolves.toEqual({ ok: 1 });
        await expect(facade.getBitbucketPullRequestDetails(prParams as any)).resolves.toEqual({ ok: 2 });
        await expect(facade.approveBitbucketPullRequest({ repository: 'repo', prId: 1, version: 2 } as any)).resolves.toEqual({ ok: 3 });
        await expect(facade.declineBitbucketPullRequest(prParams as any, 'decline')).resolves.toEqual({ ok: 4 });
        await expect(facade.addBitbucketGeneralPullRequestComment(prParams as any, { text: 'hi' } as any)).resolves.toEqual({ ok: 5 });
        await expect(facade.getBitbucketPullRequestDiff(prParams as any, 20)).resolves.toEqual({ ok: 6 });
        await expect(facade.getBitbucketPullRequestReviews(prParams as any)).resolves.toEqual({ ok: 7 });
        await expect(facade.addBitbucketPullRequestFileLineComment({ workspaceSlug: 'N11', repoSlug: 'repo', prId: 1, content: 'ok' } as any)).resolves.toEqual({ ok: 8 });
        await expect(facade.listBitbucketRepositories({ query: 'repo' } as any)).resolves.toEqual({ ok: 9 });
        await expect(facade.listBitbucketRepositoryBranches({ workspaceSlug: 'N11', repoSlug: 'repo' } as any)).resolves.toEqual({ ok: 10 });
        await expect(facade.createBitbucketBranch({ workspaceSlug: 'N11', repoSlug: 'repo', newBranchName: 'feat/x' } as any)).resolves.toEqual({ ok: 11 });
        await expect(facade.getBitbucketFileContent({ workspaceSlug: 'N11', repoSlug: 'repo', filePath: 'a.ts' } as any)).resolves.toEqual({ ok: 12 });
        await expect(facade.browseBitbucketDirectory({ workspaceSlug: 'N11', repoSlug: 'repo' } as any)).resolves.toEqual({ ok: 13 });
        await expect(facade.getBitbucketRepositoryDetails({ workspaceSlug: 'N11', repoSlug: 'repo' } as any)).resolves.toEqual({ ok: 14 });
        await expect(facade.searchBitbucketContent({ workspaceSlug: 'N11', query: 'x' } as any)).resolves.toEqual({ ok: 15 });
        await expect(facade.getBitbucketUserDetails({ username: 'john' } as any)).resolves.toEqual({ ok: 16 });
    });

    it('uses default optional arguments where applicable', async () => {
        pullRequestClient.mergeBitbucketPullRequest.mockResolvedValue({ ok: true });
        pullRequestClient.getBitbucketPullRequestDiff.mockResolvedValue({ ok: true });
        repositoryClient.listBitbucketRepositories.mockResolvedValue({ ok: true });
        workspaceClient.listBitbucketWorkspaces.mockResolvedValue({ ok: true });

        await facade.mergeBitbucketPullRequest({ project: 'PRJ', repository: 'repo', prId: 1 } as any);
        await facade.getBitbucketPullRequestDiff({ project: 'PRJ', repository: 'repo', prId: 1 } as any);
        await facade.listBitbucketRepositories();
        await facade.listBitbucketWorkspaces();

        expect(pullRequestClient.mergeBitbucketPullRequest).toHaveBeenCalledWith(
            { project: 'PRJ', repository: 'repo', prId: 1 },
            {}
        );
        expect(pullRequestClient.getBitbucketPullRequestDiff).toHaveBeenCalledWith(
            { project: 'PRJ', repository: 'repo', prId: 1 },
            10
        );
        expect(repositoryClient.listBitbucketRepositories).toHaveBeenCalledWith({});
        expect(workspaceClient.listBitbucketWorkspaces).toHaveBeenCalledWith({});
    });
});


