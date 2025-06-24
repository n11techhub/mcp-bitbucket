import { injectable, inject } from 'inversify';
import { BitbucketConfig } from "../../../infrastructure/config/BitbucketConfig.js";
import { PullRequestInput } from "../../../domain/contracts/input/PullRequestInput.js";
import { PullRequestParams } from "../../../domain/contracts/input/PullRequestParams.js";
import { MergeOption } from "../../../domain/contracts/option/MergeOption.js";
import { CommentOption } from "../../../domain/contracts/option/CommentOption.js";
import { ListRepositoriesInput } from "../../../domain/contracts/input/ListRepositoriesInput.js";
import { ListWorkspacesInput } from "../../../domain/contracts/input/ListWorkspacesInput.js";
import { SearchContentInput } from "../../../domain/contracts/input/SearchContentInput.js";
import { ListBranchesInput } from "../../../domain/contracts/input/ListBranchesInput.js";
import { AddPrCommentInput } from "../../../domain/contracts/input/AddPrCommentInput.js";
import { AddBranchInput } from "../../../domain/contracts/input/AddBranchInput.js";
import { GetFileInput } from "../../../domain/contracts/input/GetFileInput.js";
import { GetRepoInput } from "../../../domain/contracts/input/GetRepoInput.js";
import { GetUserInputType } from "../../../domain/contracts/schemas/index.js";
import { IBitbucketClientFacade } from '../IBitbucketClientFacade.js';
import { IPullRequestClient } from '../../../domain/repository/IPullRequestClient.js';
import { IRepositoryClient } from '../../../domain/repository/IRepositoryClient.js';
import { IWorkspaceClient } from '../../../domain/repository/IWorkspaceClient.js';
import { ISearchClient } from '../../../domain/repository/ISearchClient.js';
import { IUserClient } from '../../../domain/repository/IUserClient.js';
import { TYPES } from '../../../infrastructure/types.js';

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
