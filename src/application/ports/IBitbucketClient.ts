// src/application/ports/IBitbucketClient.ts
import * as dtos from '../dtos/index.js';
import { PullRequestParams } from '../../infrastructure/input/PullRequestParams.js'; // This might need to be moved or redefined if it's purely an infra concern

export interface IBitbucketClient {
    createPullRequest(input: dtos.CreatePullRequestInput): Promise<any>;
    getPullRequest(input: dtos.GetPullRequestInput): Promise<any>;
    mergePullRequest(prParams: PullRequestParams, mergeOptions: dtos.MergeOptionType): Promise<any>;
    declinePullRequest(prParams: PullRequestParams, message?: string): Promise<any>;
    addComment(prParams: PullRequestParams, commentOptions: dtos.CommentOptionType): Promise<any>;
    getDiff(prParams: PullRequestParams, contextLines?: number): Promise<any>;
    getReviews(prParams: PullRequestParams): Promise<any>;

    listWorkspaces(input: dtos.ListWorkspacesInputType): Promise<any>;
    listRepositories(input: dtos.ListRepositoriesInputType): Promise<any>;
    searchContent(input: dtos.SearchContentInputType): Promise<any>;
    bb_get_repo(input: dtos.GetRepoInputType): Promise<any>;
    bb_get_file(input: dtos.GetFileInputType): Promise<any>;
    bb_add_branch(input: dtos.AddBranchInputType): Promise<any>;
    bb_add_pr_comment(input: dtos.AddPrCommentInputType): Promise<any>;
    bb_list_branches(input: dtos.ListBranchesInputType): Promise<any>;

    getDefaultProjectKey(): string | undefined;
}
