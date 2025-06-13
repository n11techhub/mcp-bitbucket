import { injectable, inject } from 'inversify';
import { BitbucketConfig } from "../config/BitbucketConfig.js";
import { PullRequestInput } from "../input/PullRequestInput.js";
import { PullRequestParams } from "../input/PullRequestParams.js";
import { MergeOption } from "../option/MergeOption.js";
import { CommentOption } from "../option/CommentOption.js";
import { ListRepositoriesInput } from "../input/ListRepositoriesInput.js";
import { ListWorkspacesInput } from "../input/ListWorkspacesInput.js";
import { SearchContentInput } from "../input/SearchContentInput.js";
import { ListBranchesInput } from "../input/ListBranchesInput.js";
import { AddPrCommentInput } from "../input/AddPrCommentInput.js";
import { AddBranchInput } from "../input/AddBranchInput.js";
import { GetFileInput } from "../input/GetFileInput.js";
import { GetRepoInput } from "../input/GetRepoInput.js";
import { GetUserInputType } from "../../application/dtos/index.js";
import { IBitbucketClientFacade } from '../../application/facade/IBitbucketClientFacade.js';
import { IPullRequestClient } from '../../application/ports/IPullRequestClient.js';
import { IRepositoryClient } from '../../application/ports/IRepositoryClient.js';
import { IWorkspaceClient } from '../../application/ports/IWorkspaceClient.js';
import { ISearchClient } from '../../application/ports/ISearchClient.js';
import { IUserClient } from '../../application/ports/IUserClient.js';
import { TYPES } from '../types.js';

@injectable()
export class BitbucketClientFacade implements IBitbucketClientFacade {
    private readonly pullRequestClient: IPullRequestClient;
    private readonly repositoryClient: IRepositoryClient;
    private readonly workspaceClient: IWorkspaceClient;
    private readonly searchClient: ISearchClient;
    private readonly userClient: IUserClient;
    readonly config: BitbucketConfig;

    constructor(
        @inject(TYPES.BitbucketConfig) config: BitbucketConfig,
        @inject(TYPES.IPullRequestClient) pullRequestClient: IPullRequestClient,
        @inject(TYPES.IRepositoryClient) repositoryClient: IRepositoryClient,
        @inject(TYPES.IWorkspaceClient) workspaceClient: IWorkspaceClient,
        @inject(TYPES.ISearchClient) searchClient: ISearchClient,
        @inject(TYPES.IUserClient) userClient: IUserClient
    ) {
        this.config = config;
        this.pullRequestClient = pullRequestClient;
        this.repositoryClient = repositoryClient;
        this.workspaceClient = workspaceClient;
        this.searchClient = searchClient;
        this.userClient = userClient;
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

    public async getBitbucketUserDetails(input: GetUserInputType): Promise<any> {
        return this.userClient.getBitbucketUserDetails(input);
    }
}