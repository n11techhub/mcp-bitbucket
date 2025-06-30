/**
 * @fileoverview Unit tests for BitbucketUseCase
 * Tests all methods of the IBitbucketUseCase implementation including error handling and dependency injection
 */

import 'reflect-metadata';
import { jest } from '@jest/globals';
import { BitbucketUseCase } from '../../../src/application/use-cases/impl/BitbucketUseCase.js';
import { IBitbucketClientFacade } from '../../../src/application/facade/IBitbucketClientFacade.js';
import { McpError, ErrorCode } from '@modelcontextprotocol/sdk/types.js';
import {
    CreatePullRequestInput,
    GetPullRequestInput,
    MergePullRequestInput,
    DeclinePullRequestInput,
    AddCommentInput,
    GetDiffInput,
    ListWorkspacesInput,
    ListRepositoriesInput,
    SearchContentInput,
    GetRepoInput,
    GetFileInput,
    AddBranchInput,
    AddPrCommentInput,
    ListBranchesInput,
    GetUserInput
} from '../../../src/domain/contracts/input/index.js';

describe('BitbucketUseCase', () => {
    let bitbucketUseCase: BitbucketUseCase;
    let mockBitbucketClient: jest.Mocked<IBitbucketClientFacade>;

    // Sample data for testing
    const sampleProjectKey = 'TEST_PROJECT';
    const sampleRepository = 'test-repo';
    const samplePrId = 123;
    const sampleUserId = 'test-user';

    beforeEach(() => {
        // Create mock client facade
        mockBitbucketClient = {
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
            createBitbucketBranch: jest.fn(),
            addBitbucketPullRequestFileLineComment: jest.fn(),
            listBitbucketRepositoryBranches: jest.fn(),
            getBitbucketUserDetails: jest.fn(),
            getDefaultProjectKey: jest.fn()
        };

        // Create use case instance with mocked dependency
        bitbucketUseCase = new BitbucketUseCase(mockBitbucketClient);
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    describe('Constructor', () => {
        it('should create instance with injected dependencies', () => {
            expect(bitbucketUseCase).toBeInstanceOf(BitbucketUseCase);
            expect(bitbucketUseCase['bitbucketClient']).toBe(mockBitbucketClient);
        });
    });

    describe('resolveProjectKey', () => {
        it('should return provided project key when given', () => {
            const resolveProjectKey = bitbucketUseCase['resolveProjectKey'].bind(bitbucketUseCase);
            const result = resolveProjectKey('PROVIDED_PROJECT');
            expect(result).toBe('PROVIDED_PROJECT');
        });

        it('should return default project key when not provided', () => {
            mockBitbucketClient.getDefaultProjectKey.mockReturnValue('DEFAULT_PROJECT');
            
            const resolveProjectKey = bitbucketUseCase['resolveProjectKey'].bind(bitbucketUseCase);
            const result = resolveProjectKey();
            
            expect(result).toBe('DEFAULT_PROJECT');
            expect(mockBitbucketClient.getDefaultProjectKey).toHaveBeenCalled();
        });

        it('should throw McpError when no project key is available', () => {
            mockBitbucketClient.getDefaultProjectKey.mockReturnValue(undefined);
            
            const resolveProjectKey = bitbucketUseCase['resolveProjectKey'].bind(bitbucketUseCase);
            
            expect(() => resolveProjectKey()).toThrow(McpError);
            expect(() => resolveProjectKey()).toThrow('Project key must be provided or configured as default.');
        });
    });

    describe('bitbucketCreatePullRequest', () => {
        const input: CreatePullRequestInput = {
            repository: sampleRepository,
            title: 'Test PR',
            sourceBranch: 'feature-branch',
            targetBranch: 'main'
        };

        it('should create pull request with provided project key', async () => {
            const inputWithProject = { ...input, project: sampleProjectKey };
            const expectedResult = { id: 1, title: 'Test PR' };
            mockBitbucketClient.createBitbucketPullRequest.mockResolvedValue(expectedResult);

            const result = await bitbucketUseCase.bitbucketCreatePullRequest(inputWithProject);

            expect(mockBitbucketClient.createBitbucketPullRequest).toHaveBeenCalledWith(inputWithProject);
            expect(result).toBe(expectedResult);
        });

        it('should create pull request with default project key when not provided', async () => {
            mockBitbucketClient.getDefaultProjectKey.mockReturnValue(sampleProjectKey);
            const expectedResult = { id: 1, title: 'Test PR' };
            mockBitbucketClient.createBitbucketPullRequest.mockResolvedValue(expectedResult);

            const result = await bitbucketUseCase.bitbucketCreatePullRequest(input);

            const expectedInput = { ...input, project: sampleProjectKey };
            expect(mockBitbucketClient.createBitbucketPullRequest).toHaveBeenCalledWith(expectedInput);
            expect(result).toBe(expectedResult);
        });

        it('should throw error when no project key is available', async () => {
            mockBitbucketClient.getDefaultProjectKey.mockReturnValue(undefined);

            await expect(bitbucketUseCase.bitbucketCreatePullRequest(input))
                .rejects.toThrow('Bitbucket project key is required and no default is set.');
        });
    });

    describe('bitbucketGetPullRequestDetails', () => {
        const input: GetPullRequestInput = {
            repository: sampleRepository,
            prId: samplePrId
        };

        it('should get pull request details with provided project key', async () => {
            const inputWithProject = { ...input, project: sampleProjectKey };
            const expectedResult = { id: samplePrId, title: 'Test PR' };
            mockBitbucketClient.getBitbucketPullRequestDetails.mockResolvedValue(expectedResult);

            const result = await bitbucketUseCase.bitbucketGetPullRequestDetails(inputWithProject);

            expect(mockBitbucketClient.getBitbucketPullRequestDetails).toHaveBeenCalledWith(inputWithProject);
            expect(result).toBe(expectedResult);
        });

        it('should get pull request details with default project key', async () => {
            mockBitbucketClient.getDefaultProjectKey.mockReturnValue(sampleProjectKey);
            const expectedResult = { id: samplePrId, title: 'Test PR' };
            mockBitbucketClient.getBitbucketPullRequestDetails.mockResolvedValue(expectedResult);

            const result = await bitbucketUseCase.bitbucketGetPullRequestDetails(input);

            const expectedInput = { ...input, project: sampleProjectKey };
            expect(mockBitbucketClient.getBitbucketPullRequestDetails).toHaveBeenCalledWith(expectedInput);
            expect(result).toBe(expectedResult);
        });
    });

    describe('bitbucketMergePullRequest', () => {
        const input: MergePullRequestInput = {
            repository: sampleRepository,
            prId: samplePrId,
            message: 'Merge message',
            strategy: 'merge-commit'
        };

        it('should merge pull request with provided project key', async () => {
            const inputWithProject = { ...input, project: sampleProjectKey };
            const expectedResult = { success: true };
            mockBitbucketClient.mergeBitbucketPullRequest.mockResolvedValue(expectedResult);

            const result = await bitbucketUseCase.bitbucketMergePullRequest(inputWithProject);

            const expectedPrParams = {
                project: sampleProjectKey,
                repository: sampleRepository,
                prId: samplePrId
            };
            const expectedMergeOptions = {
                message: 'Merge message',
                strategy: 'merge-commit'
            };
            expect(mockBitbucketClient.mergeBitbucketPullRequest).toHaveBeenCalledWith(expectedPrParams, expectedMergeOptions);
            expect(result).toBe(expectedResult);
        });

        it('should merge pull request with default project key', async () => {
            mockBitbucketClient.getDefaultProjectKey.mockReturnValue(sampleProjectKey);
            const expectedResult = { success: true };
            mockBitbucketClient.mergeBitbucketPullRequest.mockResolvedValue(expectedResult);

            const result = await bitbucketUseCase.bitbucketMergePullRequest(input);

            const expectedPrParams = {
                project: sampleProjectKey,
                repository: sampleRepository,
                prId: samplePrId
            };
            const expectedMergeOptions = {
                message: 'Merge message',
                strategy: 'merge-commit'
            };
            expect(mockBitbucketClient.mergeBitbucketPullRequest).toHaveBeenCalledWith(expectedPrParams, expectedMergeOptions);
            expect(result).toBe(expectedResult);
        });
    });

    describe('bitbucketDeclinePullRequest', () => {
        const input: DeclinePullRequestInput = {
            repository: sampleRepository,
            prId: samplePrId,
            message: 'Decline message'
        };

        it('should decline pull request with provided project key', async () => {
            const inputWithProject = { ...input, project: sampleProjectKey };
            const expectedResult = { success: true };
            mockBitbucketClient.declineBitbucketPullRequest.mockResolvedValue(expectedResult);

            const result = await bitbucketUseCase.bitbucketDeclinePullRequest(inputWithProject);

            const expectedPrParams = {
                project: sampleProjectKey,
                repository: sampleRepository,
                prId: samplePrId
            };
            expect(mockBitbucketClient.declineBitbucketPullRequest).toHaveBeenCalledWith(expectedPrParams, 'Decline message');
            expect(result).toBe(expectedResult);
        });

        it('should decline pull request with default project key', async () => {
            mockBitbucketClient.getDefaultProjectKey.mockReturnValue(sampleProjectKey);
            const expectedResult = { success: true };
            mockBitbucketClient.declineBitbucketPullRequest.mockResolvedValue(expectedResult);

            const result = await bitbucketUseCase.bitbucketDeclinePullRequest(input);

            const expectedPrParams = {
                project: sampleProjectKey,
                repository: sampleRepository,
                prId: samplePrId
            };
            expect(mockBitbucketClient.declineBitbucketPullRequest).toHaveBeenCalledWith(expectedPrParams, 'Decline message');
            expect(result).toBe(expectedResult);
        });
    });

    describe('bitbucketAddGeneralPullRequestComment', () => {
        const input: AddCommentInput = {
            repository: sampleRepository,
            prId: samplePrId,
            text: 'Test comment',
            parentId: 456
        };

        it('should add general comment with provided project key', async () => {
            const inputWithProject = { ...input, project: sampleProjectKey };
            const expectedResult = { id: 789, text: 'Test comment' };
            mockBitbucketClient.addBitbucketGeneralPullRequestComment.mockResolvedValue(expectedResult);

            const result = await bitbucketUseCase.bitbucketAddGeneralPullRequestComment(inputWithProject);

            const expectedPrParams = {
                project: sampleProjectKey,
                repository: sampleRepository,
                prId: samplePrId
            };
            const expectedCommentOptions = {
                text: 'Test comment',
                parentId: 456
            };
            expect(mockBitbucketClient.addBitbucketGeneralPullRequestComment).toHaveBeenCalledWith(expectedPrParams, expectedCommentOptions);
            expect(result).toBe(expectedResult);
        });
    });

    describe('bitbucketGetPullRequestDiff', () => {
        const input: GetDiffInput = {
            repository: sampleRepository,
            prId: samplePrId,
            contextLines: 3
        };

        it('should get pull request diff with provided project key', async () => {
            const inputWithProject = { ...input, project: sampleProjectKey };
            const expectedResult = { diff: 'diff content' };
            mockBitbucketClient.getBitbucketPullRequestDiff.mockResolvedValue(expectedResult);

            const result = await bitbucketUseCase.bitbucketGetPullRequestDiff(inputWithProject);

            const expectedPrParams = {
                project: sampleProjectKey,
                repository: sampleRepository,
                prId: samplePrId
            };
            expect(mockBitbucketClient.getBitbucketPullRequestDiff).toHaveBeenCalledWith(expectedPrParams, 3);
            expect(result).toBe(expectedResult);
        });
    });

    describe('bitbucketGetPullRequestReviews', () => {
        const input: GetPullRequestInput = {
            repository: sampleRepository,
            prId: samplePrId
        };

        it('should get pull request reviews with provided project key', async () => {
            const inputWithProject = { ...input, project: sampleProjectKey };
            const expectedResult = { reviews: [] };
            mockBitbucketClient.getBitbucketPullRequestReviews.mockResolvedValue(expectedResult);

            const result = await bitbucketUseCase.bitbucketGetPullRequestReviews(inputWithProject);

            const expectedPrParams = {
                project: sampleProjectKey,
                repository: sampleRepository,
                prId: samplePrId
            };
            expect(mockBitbucketClient.getBitbucketPullRequestReviews).toHaveBeenCalledWith(expectedPrParams);
            expect(result).toBe(expectedResult);
        });
    });

    describe('bitbucketListWorkspaces', () => {
        it('should list workspaces', async () => {
            const input: ListWorkspacesInput = { query: 'test' };
            const expectedResult = { workspaces: [] };
            mockBitbucketClient.listBitbucketWorkspaces.mockResolvedValue(expectedResult);

            const result = await bitbucketUseCase.bitbucketListWorkspaces(input);

            expect(mockBitbucketClient.listBitbucketWorkspaces).toHaveBeenCalledWith(input);
            expect(result).toBe(expectedResult);
        });
    });

    describe('bitbucketListRepositories', () => {
        it('should list repositories', async () => {
            const input: ListRepositoriesInput = { workspaceSlug: 'test-workspace' };
            const expectedResult = { repositories: [] };
            mockBitbucketClient.listBitbucketRepositories.mockResolvedValue(expectedResult);

            const result = await bitbucketUseCase.bitbucketListRepositories(input);

            expect(mockBitbucketClient.listBitbucketRepositories).toHaveBeenCalledWith(input);
            expect(result).toBe(expectedResult);
        });
    });

    describe('bitbucketSearchContent', () => {
        it('should search content', async () => {
            const input: SearchContentInput = { 
                query: 'test search',
                workspaceSlug: 'test-workspace'
            };
            const expectedResult = { results: [] };
            mockBitbucketClient.searchBitbucketContent.mockResolvedValue(expectedResult);

            const result = await bitbucketUseCase.bitbucketSearchContent(input);

            expect(mockBitbucketClient.searchBitbucketContent).toHaveBeenCalledWith(input);
            expect(result).toBe(expectedResult);
        });
    });

    describe('bitbucketGetRepositoryDetails', () => {
        it('should get repository details', async () => {
            const input: GetRepoInput = { 
                workspaceSlug: 'test-workspace',
                repoSlug: sampleRepository
            };
            const expectedResult = { name: sampleRepository };
            mockBitbucketClient.getBitbucketRepositoryDetails.mockResolvedValue(expectedResult);

            const result = await bitbucketUseCase.bitbucketGetRepositoryDetails(input);

            expect(mockBitbucketClient.getBitbucketRepositoryDetails).toHaveBeenCalledWith(input);
            expect(result).toBe(expectedResult);
        });
    });

    describe('bitbucketGetFileContent', () => {
        it('should get file content', async () => {
            const input: GetFileInput = { 
                workspaceSlug: 'test-workspace',
                repoSlug: sampleRepository,
                filePath: 'src/test.js',
                revision: 'main'
            };
            const expectedResult = { content: 'file content' };
            mockBitbucketClient.getBitbucketFileContent.mockResolvedValue(expectedResult);

            const result = await bitbucketUseCase.bitbucketGetFileContent(input);

            expect(mockBitbucketClient.getBitbucketFileContent).toHaveBeenCalledWith(input);
            expect(result).toBe(expectedResult);
        });
    });

    describe('bitbucketCreateBranch', () => {
        it('should create branch', async () => {
            const input: AddBranchInput = { 
                workspaceSlug: 'test-workspace',
                repoSlug: sampleRepository,
                newBranchName: 'feature-branch',
                sourceBranchOrCommit: 'main'
            };
            const expectedResult = { name: 'feature-branch' };
            mockBitbucketClient.createBitbucketBranch.mockResolvedValue(expectedResult);

            const result = await bitbucketUseCase.bitbucketCreateBranch(input);

            expect(mockBitbucketClient.createBitbucketBranch).toHaveBeenCalledWith(input);
            expect(result).toBe(expectedResult);
        });
    });

    describe('bitbucketAddPullRequestFileLineComment', () => {
        it('should add pull request file line comment', async () => {
            const input: AddPrCommentInput = { 
                workspaceSlug: 'test-workspace',
                repoSlug: sampleRepository,
                prId: samplePrId,
                content: 'Line comment',
                inline: {
                    path: 'src/test.js',
                    line: 10
                }
            };
            const expectedResult = { id: 999, content: 'Line comment' };
            mockBitbucketClient.addBitbucketPullRequestFileLineComment.mockResolvedValue(expectedResult);

            const result = await bitbucketUseCase.bitbucketAddPullRequestFileLineComment(input);

            expect(mockBitbucketClient.addBitbucketPullRequestFileLineComment).toHaveBeenCalledWith(input);
            expect(result).toBe(expectedResult);
        });
    });

    describe('bitbucketListRepositoryBranches', () => {
        it('should list repository branches', async () => {
            const input: ListBranchesInput = { 
                workspaceSlug: 'test-workspace',
                repoSlug: sampleRepository
            };
            const expectedResult = { branches: [] };
            mockBitbucketClient.listBitbucketRepositoryBranches.mockResolvedValue(expectedResult);

            const result = await bitbucketUseCase.bitbucketListRepositoryBranches(input);

            expect(mockBitbucketClient.listBitbucketRepositoryBranches).toHaveBeenCalledWith(input);
            expect(result).toBe(expectedResult);
        });
    });

    describe('bitbucketGetUserDetails', () => {
        it('should get user details', async () => {
            const input: GetUserInput = { 
                username: sampleUserId
            };
            const expectedResult = { username: sampleUserId };
            mockBitbucketClient.getBitbucketUserDetails.mockResolvedValue(expectedResult);

            const result = await bitbucketUseCase.bitbucketGetUserDetails(input);

            expect(mockBitbucketClient.getBitbucketUserDetails).toHaveBeenCalledWith(input);
            expect(result).toBe(expectedResult);
        });
    });

    describe('Error Handling', () => {
        it('should propagate errors from facade methods', async () => {
            const error = new Error('Facade error');
            mockBitbucketClient.listBitbucketWorkspaces.mockRejectedValue(error);

            await expect(bitbucketUseCase.bitbucketListWorkspaces({ query: 'test' }))
                .rejects.toThrow('Facade error');
        });

        it('should handle McpError from project key resolution', async () => {
            mockBitbucketClient.getDefaultProjectKey.mockReturnValue(undefined);
            
            const input: GetPullRequestInput = {
                repository: sampleRepository,
                prId: samplePrId
            };

            await expect(bitbucketUseCase.bitbucketGetPullRequestDetails(input))
                .rejects.toThrow(McpError);
        });
    });
}); 