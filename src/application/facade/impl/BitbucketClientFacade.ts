import { injectable, inject } from 'inversify';
import { PullRequestInput } from "../../../domain/contracts/input/index.js";
import { PullRequestParams } from "../../../domain/contracts/input/index.js";
import { MergeOption } from "../../../domain/contracts/option/MergeOption.js";
import { CommentOption } from "../../../domain/contracts/option/CommentOption.js";
import { ListRepositoriesInput } from "../../../domain/contracts/input/index.js";
import { ListWorkspacesInput } from "../../../domain/contracts/input/index.js";
import { SearchContentInput } from "../../../domain/contracts/input/index.js";
import { ListBranchesInput } from "../../../domain/contracts/input/index.js";
import { AddPrCommentInput } from "../../../domain/contracts/input/index.js";
import { ApprovePullRequestInput } from "../../../domain/contracts/input/index.js";
import { AddBranchInput } from "../../../domain/contracts/input/index.js";
import { GetFileInput } from "../../../domain/contracts/input/index.js";
import { GetRepoInput } from "../../../domain/contracts/input/index.js";
import { BrowseDirectoryInput } from "../../../domain/contracts/input/index.js";
import { GetUserInputType } from "../../../domain/contracts/schemas/index.js";
import { IBitbucketClientFacade } from '../IBitbucketClientFacade.js';
import { IPullRequestClient } from '../../../domain/gateway/IPullRequestClient.js';
import { IRepositoryClient } from '../../../domain/gateway/IRepositoryClient.js';
import { IWorkspaceClient } from '../../../domain/gateway/IWorkspaceClient.js';
import { ISearchClient } from '../../../domain/gateway/ISearchClient.js';
import { IUserClient } from '../../../domain/gateway/IUserClient.js';
import {Configuration} from "../../../infrastructure/configuration/Configuration.js";
import {Types} from "../../Types.js";

@injectable()
export class BitbucketClientFacade implements IBitbucketClientFacade {
    private readonly pullRequestClient: IPullRequestClient;
    private readonly repositoryClient: IRepositoryClient;
    private readonly workspaceClient: IWorkspaceClient;
    private readonly searchClient: ISearchClient;
    private readonly userClient: IUserClient;
    readonly config: Configuration;

    constructor(
        @inject(Types.Configuration) configuration: Configuration,
        @inject(Types.IPullRequestClient) pullRequestClient: IPullRequestClient,
        @inject(Types.IRepositoryClient) repositoryClient: IRepositoryClient,
        @inject(Types.IWorkspaceClient) workspaceClient: IWorkspaceClient,
        @inject(Types.ISearchClient) searchClient: ISearchClient,
        @inject(Types.IUserClient) userClient: IUserClient
    ) {
        this.config = configuration;
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

    public async approveBitbucketPullRequest(input: ApprovePullRequestInput): Promise<any> {
        const { project, repository, prId, version } = input;
        return this.pullRequestClient.approveBitbucketPullRequest({ project, repository, prId }, version);
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

    public async browseBitbucketDirectory(input: BrowseDirectoryInput): Promise<any> {
        return this.repositoryClient.browseBitbucketDirectory(input);
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
