import * as dtos from '../dtos/index.js';

export interface IBitbucketUseCase {
    bitbucketCreatePullRequest(input: dtos.CreatePullRequestInput): Promise<any>;
    bitbucketGetPullRequestDetails(input: dtos.GetPullRequestInput): Promise<any>;
    bitbucketMergePullRequest(input: dtos.MergePullRequestInput): Promise<any>;
    bitbucketDeclinePullRequest(input: dtos.DeclinePullRequestInput): Promise<any>;
    bitbucketAddGeneralPullRequestComment(input: dtos.AddCommentInput): Promise<any>;
    bitbucketGetPullRequestDiff(input: dtos.GetDiffInput): Promise<any>;
    bitbucketGetPullRequestReviews(input: dtos.GetPullRequestInput): Promise<any>;

    bitbucketListWorkspaces(input: dtos.ListWorkspacesInputType): Promise<any>;
    bitbucketListRepositories(input: dtos.ListRepositoriesInputType): Promise<any>;
    bitbucketSearchContent(input: dtos.SearchContentInputType): Promise<any>;
    bitbucketGetRepositoryDetails(input: dtos.GetRepoInputType): Promise<any>;
    bitbucketGetFileContent(input: dtos.GetFileInputType): Promise<any>;
    bitbucketCreateBranch(input: dtos.AddBranchInputType): Promise<any>;
    bitbucketAddPullRequestFileLineComment(input: dtos.AddPrCommentInputType): Promise<any>;
    bitbucketListRepositoryBranches(input: dtos.ListBranchesInputType): Promise<any>;

    bitbucketGetUserDetails(input: dtos.GetUserInputType): Promise<any>;
}