import { IBitbucketUseCase } from '../IBitbucketUseCase.js';
import { IBitbucketClientFacade } from '../../facade/IBitbucketClientFacade.js';
import { injectable, inject } from 'inversify';
import { McpError, ErrorCode } from '@modelcontextprotocol/sdk/types.js';
import {
    CreatePullRequestInput,
    GetPullRequestInput,
    MergePullRequestInput,
    DeclinePullRequestInput,
    AddCommentInput,
    GetDiffInput,
    ListWorkspacesInput,
    ListRepositoriesInput,
    SearchContentInput,
    GetRepoInput,
    GetFileInput,
    BrowseDirectoryInput,
    AddBranchInput,
    AddPrCommentInput,
    ListBranchesInput,
    GetUserInput
} from '../../../domain/contracts/input/index.js';
import {Types} from "../../Types.js";

@injectable()
export class BitbucketUseCase implements IBitbucketUseCase {
    private readonly bitbucketClientFacade: IBitbucketClientFacade;

    constructor(@inject(Types.IBitbucketClient) bitbucketClientFacade: IBitbucketClientFacade) {
        this.bitbucketClientFacade = bitbucketClientFacade;
    }

    private resolveProjectKey(providedProjectKey?: string): string {
        const projectKey = providedProjectKey ?? this.bitbucketClientFacade.getDefaultProjectKey();
        if (!projectKey) {
            throw new McpError(ErrorCode.InvalidParams, 'Project key must be provided or configured as default.');
        }
        return projectKey;
    }

    async bitbucketCreatePullRequest(input: CreatePullRequestInput): Promise<any> {
        const projectKey = input.project ?? this.bitbucketClientFacade.getDefaultProjectKey();
        if (!projectKey) {
            throw new Error('Bitbucket project key is required and no default is set.');
        }
        const processedInput = {
            ...input,
            project: projectKey
        };
        return this.bitbucketClientFacade.createBitbucketPullRequest(processedInput);
    }

    async bitbucketGetPullRequestDetails(input: GetPullRequestInput): Promise<any> {
        const project = this.resolveProjectKey(input.project);
        return this.bitbucketClientFacade.getBitbucketPullRequestDetails({ ...input, project });
    }

    async bitbucketMergePullRequest(input: MergePullRequestInput): Promise<any> {
        const project = this.resolveProjectKey(input.project);
        const prParams = {
            project,
            repository: input.repository,
            prId: input.prId,
        };
        const mergeOptions = {
            message: input.message,
            strategy: input.strategy,
        };
        return this.bitbucketClientFacade.mergeBitbucketPullRequest(prParams, mergeOptions);
    }

    async bitbucketDeclinePullRequest(input: DeclinePullRequestInput): Promise<any> {
        const project = this.resolveProjectKey(input.project);
        const prParams = {
            project,
            repository: input.repository,
            prId: input.prId,
        };
        return this.bitbucketClientFacade.declineBitbucketPullRequest(prParams, input.message);
    }

    async bitbucketAddGeneralPullRequestComment(input: AddCommentInput): Promise<any> {
        const project = this.resolveProjectKey(input.project);
        const prParams = {
            project,
            repository: input.repository,
            prId: input.prId,
        };
        const commentOptions = {
            text: input.text,
            parentId: input.parentId,
        };
        return this.bitbucketClientFacade.addBitbucketGeneralPullRequestComment(prParams, commentOptions);
    }

    async bitbucketGetPullRequestDiff(input: GetDiffInput): Promise<any> {
        const project = this.resolveProjectKey(input.project);
        const prParams = {
            project,
            repository: input.repository,
            prId: input.prId,
        };
        return this.bitbucketClientFacade.getBitbucketPullRequestDiff(prParams, input.contextLines);
    }

    async bitbucketGetPullRequestReviews(input: GetPullRequestInput): Promise<any> {
        const project = this.resolveProjectKey(input.project);
        const prParams = {
            project,
            repository: input.repository,
            prId: input.prId,
        };
        return this.bitbucketClientFacade.getBitbucketPullRequestReviews(prParams);
    }

    async bitbucketListWorkspaces(input: ListWorkspacesInput): Promise<any> {
        return this.bitbucketClientFacade.listBitbucketWorkspaces(input);
    }

    async bitbucketListRepositories(input: ListRepositoriesInput): Promise<any> {
        return this.bitbucketClientFacade.listBitbucketRepositories(input);
    }

    async bitbucketSearchContent(input: SearchContentInput): Promise<any> {
        return this.bitbucketClientFacade.searchBitbucketContent(input);
    }

    async bitbucketGetRepositoryDetails(input: GetRepoInput): Promise<any> {
        return this.bitbucketClientFacade.getBitbucketRepositoryDetails(input);
    }

    async bitbucketGetFileContent(input: GetFileInput): Promise<any> {
        return this.bitbucketClientFacade.getBitbucketFileContent(input);
    }

    async bitbucketBrowseDirectory(input: BrowseDirectoryInput): Promise<any> {
        return this.bitbucketClientFacade.browseBitbucketDirectory(input);
    }

    async bitbucketCreateBranch(input: AddBranchInput): Promise<any> {
        return this.bitbucketClientFacade.createBitbucketBranch(input);
    }

    async bitbucketAddPullRequestFileLineComment(input: AddPrCommentInput): Promise<any> {
        return this.bitbucketClientFacade.addBitbucketPullRequestFileLineComment(input);
    }

    async bitbucketListRepositoryBranches(input: ListBranchesInput): Promise<any> {
        return this.bitbucketClientFacade.listBitbucketRepositoryBranches(input);
    }

    async bitbucketGetUserDetails(input: GetUserInput): Promise<any> {
        return this.bitbucketClientFacade.getBitbucketUserDetails(input);
    }
}
