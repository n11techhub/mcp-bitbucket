/**
 * @fileoverview Unit tests for BitbucketClientFacade.
 * This file tests the BitbucketClientFacade class, ensuring that it correctly
 * delegates calls to its underlying clients and handles configuration.
 */

import 'reflect-metadata';
import { jest } from '@jest/globals';
import { BitbucketClientFacade } from '../../../src/application/facade/impl/BitbucketClientFacade.js';
import { BitbucketConfig } from '../../../src/infrastructure/config/BitbucketConfig.js';
import { IPullRequestClient } from '../../../src/domain/repository/IPullRequestClient.js';
import { IRepositoryClient } from '../../../src/domain/repository/IRepositoryClient.js';
import { IWorkspaceClient } from '../../../src/domain/repository/IWorkspaceClient.js';
import { ISearchClient } from '../../../src/domain/repository/ISearchClient.js';
import { IUserClient } from '../../../src/domain/repository/IUserClient.js';
import {
    PullRequestInput,
    PullRequestParams,
    ListRepositoriesInput,
    ListWorkspacesInput,
    SearchContentInput,
    ListBranchesInput,
    AddPrCommentInput,
    AddBranchInput,
    GetFileInput,
    GetRepoInput,
    GetUserInput
} from '../../../src/domain/contracts/input/index.js';
import { MergeOption } from '../../../src/domain/contracts/option/MergeOption.js';
import { CommentOption } from '../../../src/domain/contracts/option/CommentOption.js';

describe('BitbucketClientFacade', () => {
    let facade: BitbucketClientFacade;
    let mockConfig: jest.Mocked<BitbucketConfig>;
    let mockPullRequestClient: jest.Mocked<IPullRequestClient>;
    let mockRepositoryClient: jest.Mocked<IRepositoryClient>;
    let mockWorkspaceClient: jest.Mocked<IWorkspaceClient>;
    let mockSearchClient: jest.Mocked<ISearchClient>;
    let mockUserClient: jest.Mocked<IUserClient>;

    beforeEach(() => {
        mockConfig = {
            defaultProject: 'DEFAULT_PROJECT'
        } as jest.Mocked<BitbucketConfig>;

        mockPullRequestClient = {
            createBitbucketPullRequest: jest.fn(),
            getBitbucketPullRequestDetails: jest.fn(),
            mergeBitbucketPullRequest: jest.fn(),
            declineBitbucketPullRequest: jest.fn(),
            addBitbucketGeneralPullRequestComment: jest.fn(),
            getBitbucketPullRequestDiff: jest.fn(),
            getBitbucketPullRequestReviews: jest.fn(),
            addBitbucketPullRequestFileLineComment: jest.fn()
        };

        mockRepositoryClient = {
            listBitbucketRepositories: jest.fn(),
            listBitbucketRepositoryBranches: jest.fn(),
            createBitbucketBranch: jest.fn(),
            getBitbucketFileContent: jest.fn(),
            getBitbucketRepositoryDetails: jest.fn()
        };

        mockWorkspaceClient = {
            listBitbucketWorkspaces: jest.fn()
        };

        mockSearchClient = {
            searchBitbucketContent: jest.fn()
        };

        mockUserClient = {
            getBitbucketUserDetails: jest.fn()
        };

        facade = new BitbucketClientFacade(
            mockConfig,
            mockPullRequestClient,
            mockRepositoryClient,
            mockWorkspaceClient,
            mockSearchClient,
            mockUserClient
        );
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    it('should be created successfully', () => {
        expect(facade).toBeInstanceOf(BitbucketClientFacade);
    });

    it('should delegate createBitbucketPullRequest to the pull request client', async () => {
        const input: PullRequestInput = { project: 'proj', repository: 'repo', title: 'Test', sourceBranch: 'dev', targetBranch: 'main' };
        await facade.createBitbucketPullRequest(input);
        expect(mockPullRequestClient.createBitbucketPullRequest).toHaveBeenCalledWith(input);
    });

    it('should delegate getBitbucketPullRequestDetails to the pull request client', async () => {
        const params: PullRequestParams = { project: 'proj', repository: 'repo', prId: 1 };
        await facade.getBitbucketPullRequestDetails(params);
        expect(mockPullRequestClient.getBitbucketPullRequestDetails).toHaveBeenCalledWith(params);
    });

    it('should delegate mergeBitbucketPullRequest to the pull request client', async () => {
        const params: PullRequestParams = { project: 'proj', repository: 'repo', prId: 1 };
        const options: MergeOption = { message: 'Merging PR' };
        await facade.mergeBitbucketPullRequest(params, options);
        expect(mockPullRequestClient.mergeBitbucketPullRequest).toHaveBeenCalledWith(params, options);
    });

    it('should delegate declineBitbucketPullRequest to the pull request client', async () => {
        const params: PullRequestParams = { project: 'proj', repository: 'repo', prId: 1 };
        const message = 'Declining PR';
        await facade.declineBitbucketPullRequest(params, message);
        expect(mockPullRequestClient.declineBitbucketPullRequest).toHaveBeenCalledWith(params, message);
    });

    it('should delegate addBitbucketGeneralPullRequestComment to the pull request client', async () => {
        const params: PullRequestParams = { project: 'proj', repository: 'repo', prId: 1 };
        const options: CommentOption = { text: 'Test comment' };
        await facade.addBitbucketGeneralPullRequestComment(params, options);
        expect(mockPullRequestClient.addBitbucketGeneralPullRequestComment).toHaveBeenCalledWith(params, options);
    });

    it('should delegate getBitbucketPullRequestDiff to the pull request client', async () => {
        const params: PullRequestParams = { project: 'proj', repository: 'repo', prId: 1 };
        const contextLines = 5;
        await facade.getBitbucketPullRequestDiff(params, contextLines);
        expect(mockPullRequestClient.getBitbucketPullRequestDiff).toHaveBeenCalledWith(params, contextLines);
    });

    it('should delegate getBitbucketPullRequestReviews to the pull request client', async () => {
        const params: PullRequestParams = { project: 'proj', repository: 'repo', prId: 1 };
        await facade.getBitbucketPullRequestReviews(params);
        expect(mockPullRequestClient.getBitbucketPullRequestReviews).toHaveBeenCalledWith(params);
    });

    it('should delegate listBitbucketRepositories to the repository client', async () => {
        const input: ListRepositoriesInput = { workspaceSlug: 'workspace' };
        await facade.listBitbucketRepositories(input);
        expect(mockRepositoryClient.listBitbucketRepositories).toHaveBeenCalledWith(input);
    });

    it('should delegate listBitbucketWorkspaces to the workspace client', async () => {
        const input: ListWorkspacesInput = { query: 'test' };
        await facade.listBitbucketWorkspaces(input);
        expect(mockWorkspaceClient.listBitbucketWorkspaces).toHaveBeenCalledWith(input);
    });

    it('should delegate searchBitbucketContent to the search client', async () => {
        const input: SearchContentInput = { query: 'search term', workspaceSlug: 'workspace' };
        await facade.searchBitbucketContent(input);
        expect(mockSearchClient.searchBitbucketContent).toHaveBeenCalledWith(input);
    });

    it('should delegate listBitbucketRepositoryBranches to the repository client', async () => {
        const input: ListBranchesInput = { repoSlug: 'repo', workspaceSlug: 'workspace' };
        await facade.listBitbucketRepositoryBranches(input);
        expect(mockRepositoryClient.listBitbucketRepositoryBranches).toHaveBeenCalledWith(input);
    });

    it('should delegate addBitbucketPullRequestFileLineComment to the pull request client', async () => {
        const input: AddPrCommentInput = { content: 'comment', prId: 1, repoSlug: 'repo', workspaceSlug: 'workspace' };
        await facade.addBitbucketPullRequestFileLineComment(input);
        expect(mockPullRequestClient.addBitbucketPullRequestFileLineComment).toHaveBeenCalledWith(input);
    });

    it('should delegate createBitbucketBranch to the repository client', async () => {
        const input: AddBranchInput = { newBranchName: 'new-branch', repoSlug: 'repo', workspaceSlug: 'workspace', sourceBranchOrCommit: 'main' };
        await facade.createBitbucketBranch(input);
        expect(mockRepositoryClient.createBitbucketBranch).toHaveBeenCalledWith(input);
    });

    it('should delegate getBitbucketFileContent to the repository client', async () => {
        const input: GetFileInput = { filePath: 'file.ts', repoSlug: 'repo', workspaceSlug: 'workspace' };
        await facade.getBitbucketFileContent(input);
        expect(mockRepositoryClient.getBitbucketFileContent).toHaveBeenCalledWith(input);
    });

    it('should delegate getBitbucketRepositoryDetails to the repository client', async () => {
        const input: GetRepoInput = { repoSlug: 'repo', workspaceSlug: 'workspace' };
        await facade.getBitbucketRepositoryDetails(input);
        expect(mockRepositoryClient.getBitbucketRepositoryDetails).toHaveBeenCalledWith(input);
    });

    it('should delegate getBitbucketUserDetails to the user client', async () => {
        const input: GetUserInput = { username: 'test-user' };
        await facade.getBitbucketUserDetails(input);
        expect(mockUserClient.getBitbucketUserDetails).toHaveBeenCalledWith(input);
    });

    it('should return the default project key from the config', () => {
        expect(facade.getDefaultProjectKey()).toBe('DEFAULT_PROJECT');
    });

    it('should use default parameters where applicable', async () => {
        const prParams: PullRequestParams = { project: 'proj', repository: 'repo', prId: 1 };
        await facade.mergeBitbucketPullRequest(prParams);
        expect(mockPullRequestClient.mergeBitbucketPullRequest).toHaveBeenCalledWith(prParams, {});

        await facade.getBitbucketPullRequestDiff(prParams);
        expect(mockPullRequestClient.getBitbucketPullRequestDiff).toHaveBeenCalledWith(prParams, 10);
        
        await facade.listBitbucketRepositories();
        expect(mockRepositoryClient.listBitbucketRepositories).toHaveBeenCalledWith({});
        
        await facade.listBitbucketWorkspaces();
        expect(mockWorkspaceClient.listBitbucketWorkspaces).toHaveBeenCalledWith({});
    });
}); 