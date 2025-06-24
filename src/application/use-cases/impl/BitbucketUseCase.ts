import { IBitbucketUseCase } from '../IBitbucketUseCase.js';
import { IBitbucketClientFacade } from '../../facade/IBitbucketClientFacade.js';
import { injectable, inject } from 'inversify';
import { TYPES } from '../../../infrastructure/types.js';
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
} from '../../../domain/contracts/input/index.js';

@injectable()
export class BitbucketUseCase implements IBitbucketUseCase {
    private readonly bitbucketClient: IBitbucketClientFacade;

    constructor(@inject(TYPES.IBitbucketClient) bitbucketClient: IBitbucketClientFacade) {
        this.bitbucketClient = bitbucketClient;
    }

    private resolveProjectKey(providedProjectKey?: string): string {
        const projectKey = providedProjectKey ?? this.bitbucketClient.getDefaultProjectKey();
        if (!projectKey) {
            throw new McpError(ErrorCode.InvalidParams, 'Project key must be provided or configured as default.');
        }
        return projectKey;
    }

    async bitbucketCreatePullRequest(input: CreatePullRequestInput): Promise<any> {
        const projectKey = input.project || this.bitbucketClient.getDefaultProjectKey();
        if (!projectKey) {
            throw new Error('Bitbucket project key is required and no default is set.');
        }
        const processedInput = {
            ...input,
            project: projectKey
        };
        return this.bitbucketClient.createBitbucketPullRequest(processedInput);
    }

    async bitbucketGetPullRequestDetails(input: GetPullRequestInput): Promise<any> {
        const project = this.resolveProjectKey(input.project);
        return this.bitbucketClient.getBitbucketPullRequestDetails({ ...input, project });
    }

    async bitbucketMergePullRequest(input: MergePullRequestInput): Promise<any> {
        const project = this.resolveProjectKey(input.project);
        const prParams = {
            project,
            repository: input.repository,
            prId: input.prId,
        };
        const mergeOptions = {
            message: input.message,
            strategy: input.strategy,
        };
        return this.bitbucketClient.mergeBitbucketPullRequest(prParams, mergeOptions);
    }

    async bitbucketDeclinePullRequest(input: DeclinePullRequestInput): Promise<any> {
        const project = this.resolveProjectKey(input.project);
        const prParams = {
            project,
            repository: input.repository,
            prId: input.prId,
        };
        return this.bitbucketClient.declineBitbucketPullRequest(prParams, input.message);
    }

    async bitbucketAddGeneralPullRequestComment(input: AddCommentInput): Promise<any> {
        const project = this.resolveProjectKey(input.project);
        const prParams = {
            project,
            repository: input.repository,
            prId: input.prId,
        };
        const commentOptions = {
            text: input.text,
            parentId: input.parentId,
        };
        return this.bitbucketClient.addBitbucketGeneralPullRequestComment(prParams, commentOptions);
    }

    async bitbucketGetPullRequestDiff(input: GetDiffInput): Promise<any> {
        const project = this.resolveProjectKey(input.project);
        const prParams = {
            project,
            repository: input.repository,
            prId: input.prId,
        };
        return this.bitbucketClient.getBitbucketPullRequestDiff(prParams, input.contextLines);
    }

    async bitbucketGetPullRequestReviews(input: GetPullRequestInput): Promise<any> {
        const project = this.resolveProjectKey(input.project);
        const prParams = {
            project,
            repository: input.repository,
            prId: input.prId,
        };
        return this.bitbucketClient.getBitbucketPullRequestReviews(prParams);
    }

    async bitbucketListWorkspaces(input: ListWorkspacesInput): Promise<any> {
        return this.bitbucketClient.listBitbucketWorkspaces(input);
    }

    async bitbucketListRepositories(input: ListRepositoriesInput): Promise<any> {
        return this.bitbucketClient.listBitbucketRepositories(input);
    }

    async bitbucketSearchContent(input: SearchContentInput): Promise<any> {
        return this.bitbucketClient.searchBitbucketContent(input);
    }

    async bitbucketGetRepositoryDetails(input: GetRepoInput): Promise<any> {
        return this.bitbucketClient.getBitbucketRepositoryDetails(input);
    }

    async bitbucketGetFileContent(input: GetFileInput): Promise<any> {
        return this.bitbucketClient.getBitbucketFileContent(input);
    }

    async bitbucketCreateBranch(input: AddBranchInput): Promise<any> {
        return this.bitbucketClient.createBitbucketBranch(input);
    }

    async bitbucketAddPullRequestFileLineComment(input: AddPrCommentInput): Promise<any> {
        return this.bitbucketClient.addBitbucketPullRequestFileLineComment(input);
    }

    async bitbucketListRepositoryBranches(input: ListBranchesInput): Promise<any> {
        return this.bitbucketClient.listBitbucketRepositoryBranches(input);
    }

    async bitbucketGetUserDetails(input: GetUserInput): Promise<any> {
        return this.bitbucketClient.getBitbucketUserDetails(input);
    }
}
