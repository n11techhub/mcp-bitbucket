import { IBitbucketUseCase } from '../IBitbucketUseCase.js';
import { IBitbucketClientFacade } from '../../facade/IBitbucketClientFacade.js';
import * as dtos from '../../dtos/index.js';
import { PullRequestParams } from '../../../infrastructure/input/PullRequestParams.js'; // Still referencing infra type
import { McpError, ErrorCode } from '@modelcontextprotocol/sdk/types.js'; // For error handling
import { injectable, inject } from 'inversify';
import { TYPES } from '../../../infrastructure/types.js';

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

    async bitbucketCreatePullRequest(input: dtos.CreatePullRequestInput): Promise<any> {
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

    async bitbucketGetPullRequestDetails(input: dtos.GetPullRequestInput): Promise<any> {
        const project = this.resolveProjectKey(input.project);
        return this.bitbucketClient.getBitbucketPullRequestDetails({ ...input, project });
    }

    async bitbucketMergePullRequest(input: dtos.MergePullRequestInput): Promise<any> {
        const project = this.resolveProjectKey(input.project);
        const prParams: PullRequestParams = {
            project,
            repository: input.repository,
            prId: input.prId,
        };
        const mergeOptions: dtos.MergeOptionType = {
            message: input.message,
            strategy: input.strategy,
        };
        return this.bitbucketClient.mergeBitbucketPullRequest(prParams, mergeOptions);
    }

    async bitbucketDeclinePullRequest(input: dtos.DeclinePullRequestInput): Promise<any> {
        const project = this.resolveProjectKey(input.project);
        const prParams: PullRequestParams = {
            project,
            repository: input.repository,
            prId: input.prId,
        };
        return this.bitbucketClient.declineBitbucketPullRequest(prParams, input.message);
    }

    async bitbucketAddGeneralPullRequestComment(input: dtos.AddCommentInput): Promise<any> {
        const project = this.resolveProjectKey(input.project);
         const prParams: PullRequestParams = {
            project,
            repository: input.repository,
            prId: input.prId,
        };
        const commentOptions: dtos.CommentOptionType = {
            text: input.text,
            parentId: input.parentId,
        };
        return this.bitbucketClient.addBitbucketGeneralPullRequestComment(prParams, commentOptions);
    }

    async bitbucketGetPullRequestDiff(input: dtos.GetDiffInput): Promise<any> {
        const project = this.resolveProjectKey(input.project);
        const prParams: PullRequestParams = {
            project,
            repository: input.repository,
            prId: input.prId,
        };
        return this.bitbucketClient.getBitbucketPullRequestDiff(prParams, input.contextLines);
    }

    async bitbucketGetPullRequestReviews(input: dtos.GetPullRequestInput): Promise<any> {
        const project = this.resolveProjectKey(input.project);
         const prParams: PullRequestParams = {
            project,
            repository: input.repository,
            prId: input.prId,
        };
        return this.bitbucketClient.getBitbucketPullRequestReviews(prParams);
    }

    async bitbucketListWorkspaces(input: dtos.ListWorkspacesInputType): Promise<any> {
        return this.bitbucketClient.listBitbucketWorkspaces(input);
    }

    async bitbucketListRepositories(input: dtos.ListRepositoriesInputType): Promise<any> {
        return this.bitbucketClient.listBitbucketRepositories(input);
    }

    async bitbucketSearchContent(input: dtos.SearchContentInputType): Promise<any> {
        return this.bitbucketClient.searchBitbucketContent(input);
    }

    async bitbucketGetRepositoryDetails(input: dtos.GetRepoInputType): Promise<any> {
        return this.bitbucketClient.getBitbucketRepositoryDetails(input);
    }

    async bitbucketGetFileContent(input: dtos.GetFileInputType): Promise<any> {
        return this.bitbucketClient.getBitbucketFileContent(input);
    }

    async bitbucketCreateBranch(input: dtos.AddBranchInputType): Promise<any> {
        return this.bitbucketClient.createBitbucketBranch(input);
    }

    async bitbucketAddPullRequestFileLineComment(input: dtos.AddPrCommentInputType): Promise<any> {
        return this.bitbucketClient.addBitbucketPullRequestFileLineComment(input);
    }

    async bitbucketListRepositoryBranches(input: dtos.ListBranchesInputType): Promise<any> {
        return this.bitbucketClient.listBitbucketRepositoryBranches(input);
    }
}
