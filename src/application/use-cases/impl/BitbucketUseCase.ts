// src/application/use-cases/impl/BitbucketUseCase.ts
import { IBitbucketUseCase } from '../IBitbucketUseCase.js';
import { IBitbucketClient } from '../../ports/IBitbucketClient.js';
import * as dtos from '../../dtos/index.js';
import { PullRequestParams } from '../../../infrastructure/input/PullRequestParams.js'; // Still referencing infra type
import { McpError, ErrorCode } from '@modelcontextprotocol/sdk/types.js'; // For error handling

export class BitbucketUseCase implements IBitbucketUseCase {
    private readonly bitbucketClient: IBitbucketClient;

    constructor(bitbucketClient: IBitbucketClient) {
        this.bitbucketClient = bitbucketClient;
    }

    private resolveProjectKey(providedProjectKey?: string): string {
        const projectKey = providedProjectKey ?? this.bitbucketClient.getDefaultProjectKey();
        if (!projectKey) {
            throw new McpError(ErrorCode.InvalidParams, 'Project key must be provided or configured as default.');
        }
        return projectKey;
    }

    async createPullRequest(input: dtos.CreatePullRequestInput): Promise<any> {
        return this.bitbucketClient.createPullRequest(input);
    }

    async getPullRequest(input: dtos.GetPullRequestInput): Promise<any> {
        const project = this.resolveProjectKey(input.project);
        return this.bitbucketClient.getPullRequest({ ...input, project });
    }

    async mergePullRequest(input: dtos.MergePullRequestInput): Promise<any> {
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
        return this.bitbucketClient.mergePullRequest(prParams, mergeOptions);
    }

    async declinePullRequest(input: dtos.DeclinePullRequestInput): Promise<any> {
        const project = this.resolveProjectKey(input.project);
        const prParams: PullRequestParams = {
            project,
            repository: input.repository,
            prId: input.prId,
        };
        return this.bitbucketClient.declinePullRequest(prParams, input.message);
    }

    async addComment(input: dtos.AddCommentInput): Promise<any> {
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
        return this.bitbucketClient.addComment(prParams, commentOptions);
    }

    async getDiff(input: dtos.GetDiffInput): Promise<any> {
        const project = this.resolveProjectKey(input.project);
        const prParams: PullRequestParams = {
            project,
            repository: input.repository,
            prId: input.prId,
        };
        return this.bitbucketClient.getDiff(prParams, input.contextLines);
    }

    async getReviews(input: dtos.GetPullRequestInput): Promise<any> {
        const project = this.resolveProjectKey(input.project);
         const prParams: PullRequestParams = {
            project,
            repository: input.repository,
            prId: input.prId,
        };
        return this.bitbucketClient.getReviews(prParams);
    }

    async listWorkspaces(input: dtos.ListWorkspacesInputType): Promise<any> {
        return this.bitbucketClient.listWorkspaces(input);
    }

    async listRepositories(input: dtos.ListRepositoriesInputType): Promise<any> {
        return this.bitbucketClient.listRepositories(input);
    }

    async searchContent(input: dtos.SearchContentInputType): Promise<any> {
        return this.bitbucketClient.searchContent(input);
    }

    async getRepo(input: dtos.GetRepoInputType): Promise<any> {
        return this.bitbucketClient.bb_get_repo(input);
    }

    async getFile(input: dtos.GetFileInputType): Promise<any> {
        return this.bitbucketClient.bb_get_file(input);
    }

    async addBranch(input: dtos.AddBranchInputType): Promise<any> {
        return this.bitbucketClient.bb_add_branch(input);
    }

    async addPullRequestComment(input: dtos.AddPrCommentInputType): Promise<any> {
        return this.bitbucketClient.bb_add_pr_comment(input);
    }

    async listBranches(input: dtos.ListBranchesInputType): Promise<any> {
        return this.bitbucketClient.bb_list_branches(input);
    }
}
