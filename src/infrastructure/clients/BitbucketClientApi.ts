import { BitbucketConfig } from "../config/BitbucketConfig";
import { PullRequestInput } from "../input/PullRequestInput";
import { PullRequestParams } from "../input/PullRequestParams";
import { MergeOption } from "../option/MergeOption";
import { CommentOption } from "../option/CommentOption";
import { ListRepositoriesInput } from "../input/ListRepositoriesInput";
import { ListWorkspacesInput } from "../input/ListWorkspacesInput";
import { SearchContentInput } from "../input/SearchContentInput";
import { ListBranchesInput } from "../input/ListBranchesInput";
import { AddPrCommentInput } from "../input/AddPrCommentInput";
import { AddBranchInput } from "../input/AddBranchInput";
import { GetFileInput } from "../input/GetFileInput";
import { GetRepoInput } from "../input/GetRepoInput";
import { IBitbucketClient } from '../../application/ports/IBitbucketClient.js';
import { IPullRequestClient } from '../../application/ports/IPullRequestClient';
import { IRepositoryClient } from '../../application/ports/IRepositoryClient';
import { IWorkspaceClient } from '../../application/ports/IWorkspaceClient';
import { ISearchClient } from '../../application/ports/ISearchClient';

export class BitbucketClientApi implements IBitbucketClient {
    private readonly pullRequestClient: IPullRequestClient;
    private readonly repositoryClient: IRepositoryClient;
    private readonly workspaceClient: IWorkspaceClient;
    private readonly searchClient: ISearchClient;
    readonly config: BitbucketConfig;

    constructor(
        config: BitbucketConfig,
        pullRequestClient: IPullRequestClient,
        repositoryClient: IRepositoryClient,
        workspaceClient: IWorkspaceClient,
        searchClient: ISearchClient
    ) {
        this.config = config;
        this.pullRequestClient = pullRequestClient;
        this.repositoryClient = repositoryClient;
        this.workspaceClient = workspaceClient;
        this.searchClient = searchClient;
    }

    public async createBitbucketPullRequest(input: PullRequestInput): Promise<any> {
        return this.pullRequestClient.createBitbucketPullRequest(input);
    }

    public async getBitbucketPullRequestDetails(params: PullRequestParams): Promise<any> {
        return this.pullRequestClient.getBitbucketPullRequestDetails(params);
    }

    public async mergeBitbucketPullRequest(params: PullRequestParams, options: MergeOption = {}): Promise<any> {
        return this.pullRequestClient.mergeBitbucketPullRequest(params, options);
    }

    public async declineBitbucketPullRequest(params: PullRequestParams, message?: string): Promise<any> {
        return this.pullRequestClient.declineBitbucketPullRequest(params, message);
    }

    public async addBitbucketGeneralPullRequestComment(params: PullRequestParams, options: CommentOption): Promise<any> {
        return this.pullRequestClient.addBitbucketGeneralPullRequestComment(params, options);
    }

    public async getBitbucketPullRequestDiff(params: PullRequestParams, contextLines: number = 10): Promise<any> {
        return this.pullRequestClient.getBitbucketPullRequestDiff(params, contextLines);
    }

    public async getBitbucketPullRequestReviews(params: PullRequestParams): Promise<any> {
        return this.pullRequestClient.getBitbucketPullRequestReviews(params);
    }

    public async listBitbucketRepositories(input: ListRepositoriesInput = {}): Promise<any> {
        return this.repositoryClient.listBitbucketRepositories(input);
    }

    public async listBitbucketWorkspaces(input: ListWorkspacesInput = {}): Promise<any> {
        return this.workspaceClient.listBitbucketWorkspaces(input);
    }

    public async searchBitbucketContent(input: SearchContentInput): Promise<any> {
        return this.searchClient.searchBitbucketContent(input);
    }

    public async listBitbucketRepositoryBranches(input: ListBranchesInput): Promise<any> {
        return this.repositoryClient.listBitbucketRepositoryBranches(input);
    }

    public async addBitbucketPullRequestFileLineComment(input: AddPrCommentInput): Promise<any> {
        return this.pullRequestClient.addBitbucketPullRequestFileLineComment(input);
    }

    public async createBitbucketBranch(input: AddBranchInput): Promise<any> {
        return this.repositoryClient.createBitbucketBranch(input);
    }

    public async getBitbucketFileContent(input: GetFileInput): Promise<any> {
        return this.repositoryClient.getBitbucketFileContent(input);
    }

    public async getBitbucketRepositoryDetails(input: GetRepoInput): Promise<any> {
        return this.repositoryClient.getBitbucketRepositoryDetails(input);
    }

    public getDefaultProjectKey(): string | undefined {
        return this.config.defaultProject;
    }
}