// src/application/ports/IBitbucketClient.ts
import * as dtos from '../dtos/index.js';
import { PullRequestParams } from '../../infrastructure/input/PullRequestParams.js'; // This might need to be moved or redefined if it's purely an infra concern

export interface IBitbucketClient {
    createBitbucketPullRequest(input: dtos.CreatePullRequestInput): Promise<any>;
    getBitbucketPullRequestDetails(input: dtos.GetPullRequestInput): Promise<any>;
    mergeBitbucketPullRequest(prParams: PullRequestParams, mergeOptions: dtos.MergeOptionType): Promise<any>;
    declineBitbucketPullRequest(prParams: PullRequestParams, message?: string): Promise<any>;
    addBitbucketGeneralPullRequestComment(prParams: PullRequestParams, commentOptions: dtos.CommentOptionType): Promise<any>;
    getBitbucketPullRequestDiff(prParams: PullRequestParams, contextLines?: number): Promise<any>;
    getBitbucketPullRequestReviews(prParams: PullRequestParams): Promise<any>;

    listBitbucketWorkspaces(input: dtos.ListWorkspacesInputType): Promise<any>;
    listBitbucketRepositories(input: dtos.ListRepositoriesInputType): Promise<any>;
    searchBitbucketContent(input: dtos.SearchContentInputType): Promise<any>;
    getBitbucketRepositoryDetails(input: dtos.GetRepoInputType): Promise<any>;
    getBitbucketFileContent(input: dtos.GetFileInputType): Promise<any>;
    createBitbucketBranch(input: dtos.AddBranchInputType): Promise<any>;
    addBitbucketPullRequestFileLineComment(input: dtos.AddPrCommentInputType): Promise<any>;
    listBitbucketRepositoryBranches(input: dtos.ListBranchesInputType): Promise<any>;

    getDefaultProjectKey(): string | undefined;
}
