// src/application/use-cases/IBitbucketUseCase.ts
import * as dtos from '../dtos/index.js';

export interface IBitbucketUseCase {
    createPullRequest(input: dtos.CreatePullRequestInput): Promise<any>;
    getPullRequest(input: dtos.GetPullRequestInput): Promise<any>;
    mergePullRequest(input: dtos.MergePullRequestInput): Promise<any>;
    declinePullRequest(input: dtos.DeclinePullRequestInput): Promise<any>;
    addComment(input: dtos.AddCommentInput): Promise<any>;
    getDiff(input: dtos.GetDiffInput): Promise<any>;
    getReviews(input: dtos.GetPullRequestInput): Promise<any>;

    listWorkspaces(input: dtos.ListWorkspacesInputType): Promise<any>;
    listRepositories(input: dtos.ListRepositoriesInputType): Promise<any>;
    searchContent(input: dtos.SearchContentInputType): Promise<any>;
    getRepo(input: dtos.GetRepoInputType): Promise<any>;
    getFile(input: dtos.GetFileInputType): Promise<any>;
    addBranch(input: dtos.AddBranchInputType): Promise<any>;
    addPullRequestComment(input: dtos.AddPrCommentInputType): Promise<any>;
    listBranches(input: dtos.ListBranchesInputType): Promise<any>;
}