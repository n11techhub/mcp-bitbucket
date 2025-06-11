import { GetRepoInputSchema, GetRepoInputType } from "../../application/dtos/GetRepoInputSchema.js";
import { GetFileInputSchema, GetFileInputType } from "../../application/dtos/GetFileInputSchema.js";
import { AddBranchInputSchema, AddBranchInputType } from "../../application/dtos/AddBranchInputSchema.js";
import { AddPrCommentInputSchema, AddPrCommentInputType } from "../../application/dtos/AddPrCommentInputSchema.js";
import { ListBranchesInputSchema, ListBranchesInputType } from "../../application/dtos/ListBranchesInputSchema.js";
import { CreatePullRequestInputSchema, CreatePullRequestInput } from '../../application/dtos/CreatePullRequestInputSchema.js';
import { GetPullRequestInputSchema, GetPullRequestInput } from '../../application/dtos/GetPullRequestInputSchema.js';
import { MergePullRequestInputSchema, MergePullRequestInput } from '../../application/dtos/MergePullRequestInputSchema.js';
import { DeclinePullRequestInputSchema, DeclinePullRequestInput } from '../../application/dtos/DeclinePullRequestInputSchema.js';
import { AddCommentInputSchema, AddCommentInput } from '../../application/dtos/AddCommentInputSchema.js';
import { zodToJsonSchema } from 'zod-to-json-schema';
import { GetDiffInputSchema, GetDiffInput } from '../../application/dtos/GetDiffInputSchema.js';
import { ListWorkspacesInputSchema, ListWorkspacesInputType } from '../../application/dtos/ListWorkspacesInputSchema.js';
import { ListRepositoriesInputSchema, ListRepositoriesInputType } from '../../application/dtos/ListRepositoriesInputSchema.js';
import { SearchContentInputSchema, SearchContentInputType } from '../../application/dtos/SearchContentInputSchema.js';
import { GetUserInputSchema, GetUserInputType } from '../../application/dtos/GetUserInputSchema.js';
import {Server} from "@modelcontextprotocol/sdk/server/index.js";
import {CallToolRequestSchema, ErrorCode, ListToolsRequestSchema, McpError} from "@modelcontextprotocol/sdk/types.js";
import {IBitbucketClientFacade} from "../../application/facade/IBitbucketClientFacade.js";
import { IBitbucketUseCase } from '../../application/use-cases/IBitbucketUseCase.js';
import axios from "axios";
import winston from 'winston';
import { injectable, inject } from 'inversify';
import { TYPES } from '../types.js';

@injectable()
export class McpServerSetup {
    public readonly server: Server;
    private readonly api: IBitbucketClientFacade;
    private readonly bitbucketUseCase: IBitbucketUseCase;
    private readonly logger: winston.Logger;
    private readonly toolHandlers: Map<string, (args: any) => Promise<any>>;

    constructor(
        @inject(TYPES.IBitbucketClient) api: IBitbucketClientFacade,
        @inject(TYPES.IBitbucketUseCase) bitbucketUseCase: IBitbucketUseCase, 
        @inject(TYPES.Logger) logger: winston.Logger
    ) {
        this.api = api;
        this.bitbucketUseCase = bitbucketUseCase;
        this.logger = logger;
        this.server = new Server(
            {
                name: 'bitbucket-mcp-server',
                version: '1.0.0',
            },
            {
                capabilities: {
                    tools: {},
                },
            }
        );

        this.setupToolHandlers();
        this.server.onerror = (error: any) => this.logger.error('[MCP Error]', error instanceof Error ? error.message : String(error), error instanceof Error ? { stack: error.stack } : {});
        
        this.toolHandlers = new Map();
        this.toolHandlers.set('bitbucket_create_pull_request', async (args: any) => this.bitbucketUseCase.bitbucketCreatePullRequest(args as CreatePullRequestInput));
        this.toolHandlers.set('bitbucket_get_pull_request_details', async (args: any) => this.bitbucketUseCase.bitbucketGetPullRequestDetails(args as GetPullRequestInput));
        this.toolHandlers.set('bitbucket_merge_pull_request', async (args: any) => this.bitbucketUseCase.bitbucketMergePullRequest(args as MergePullRequestInput));
        this.toolHandlers.set('bitbucket_decline_pull_request', async (args: any) => this.bitbucketUseCase.bitbucketDeclinePullRequest(args as DeclinePullRequestInput));
        this.toolHandlers.set('bitbucket_add_pull_request_comment', async (args: any) => this.bitbucketUseCase.bitbucketAddGeneralPullRequestComment(args as AddCommentInput));
        this.toolHandlers.set('bitbucket_get_pull_request_diff', async (args: any) => this.bitbucketUseCase.bitbucketGetPullRequestDiff(args as GetDiffInput));
        this.toolHandlers.set('bitbucket_get_pull_request_reviews', async (args: any) => this.bitbucketUseCase.bitbucketGetPullRequestReviews(args as GetPullRequestInput)); // Note: GetPullRequestInput is correct based on original switch
        this.toolHandlers.set('bitbucket_list_workspaces', async (args: any) => this.bitbucketUseCase.bitbucketListWorkspaces(args as ListWorkspacesInputType));
        this.toolHandlers.set('bitbucket_list_repositories', async (args: any) => this.bitbucketUseCase.bitbucketListRepositories(args as ListRepositoriesInputType));
        this.toolHandlers.set('bitbucket_search_content', async (args: any) => this.bitbucketUseCase.bitbucketSearchContent(args as SearchContentInputType));
        this.toolHandlers.set('bitbucket_get_repository_details', async (args: any) => this.bitbucketUseCase.bitbucketGetRepositoryDetails(args as GetRepoInputType));
        this.toolHandlers.set('bitbucket_get_file_content', async (args: any) => this.bitbucketUseCase.bitbucketGetFileContent(args as GetFileInputType));
        this.toolHandlers.set('bitbucket_create_branch', async (args: any) => this.bitbucketUseCase.bitbucketCreateBranch(args as AddBranchInputType));
        this.toolHandlers.set('bitbucket_add_pull_request_file_line_comment', async (args: any) => this.bitbucketUseCase.bitbucketAddPullRequestFileLineComment(args as AddPrCommentInputType));
        this.toolHandlers.set('bitbucket_list_repository_branches', async (args: any) => this.bitbucketUseCase.bitbucketListRepositoryBranches(args as ListBranchesInputType));
        this.toolHandlers.set('bitbucket_get_user_profile', async (args: any) => this.bitbucketUseCase.bitbucketGetUserDetails(args as GetUserInputType));
    }

    private setupToolHandlers() {
        this.server.setRequestHandler(ListToolsRequestSchema, async () => ({
            tools: [
                {
                    name: 'bitbucket_create_pull_request',
                    description: 'Creates a new Bitbucket pull request',
                    inputSchema: zodToJsonSchema(CreatePullRequestInputSchema)
                },
                {
                    name: 'bitbucket_get_pull_request_details',
                    description: 'Gets detailed information for a Bitbucket pull request',
                    inputSchema: zodToJsonSchema(GetPullRequestInputSchema)
                },
                {
                    name: 'bitbucket_merge_pull_request',
                    description: 'Merges a Bitbucket pull request',
                    inputSchema: zodToJsonSchema(MergePullRequestInputSchema)
                },
                {
                    name: 'bitbucket_decline_pull_request',
                    description: 'Declines a Bitbucket pull request',
                    inputSchema: zodToJsonSchema(DeclinePullRequestInputSchema)
                },
                {
                    name: 'bitbucket_add_pull_request_comment',
                    description: 'Adds a general comment to a Bitbucket pull request.',
                    inputSchema: zodToJsonSchema(AddCommentInputSchema)
                },
                {
                    name: 'bitbucket_get_pull_request_diff',
                    description: 'Gets the diff for a Bitbucket pull request',
                    inputSchema: zodToJsonSchema(GetDiffInputSchema)
                },
                {
                    name: 'bitbucket_get_pull_request_reviews',
                    description: 'Gets reviews for a Bitbucket pull request',
                    inputSchema: zodToJsonSchema(GetPullRequestInputSchema)
                },
                {
                    name: 'bitbucket_list_workspaces',
                    description: 'Lists available Bitbucket workspaces.',
                    inputSchema: zodToJsonSchema(ListWorkspacesInputSchema),
                },
                {
                    name: 'bitbucket_list_repositories',
                    description: 'Lists Bitbucket repositories.',
                    inputSchema: zodToJsonSchema(ListRepositoriesInputSchema)
                },
                {
                    name: 'bitbucket_search_content',
                    description: 'Searches content within Bitbucket repositories.',
                    inputSchema: zodToJsonSchema(SearchContentInputSchema)
                },
                {
                    name: 'bitbucket_get_repository_details',
                    description: 'Gets details for a specific Bitbucket repository.',
                    inputSchema: zodToJsonSchema(GetRepoInputSchema)
                },
                {
                    name: 'bitbucket_get_file_content',
                    description: 'Gets the content of a specific file from a Bitbucket repository.',
                    inputSchema: zodToJsonSchema(GetFileInputSchema)
                },
                {
                    name: 'bitbucket_create_branch',
                    description: 'Creates a new branch in a Bitbucket repository.',
                    inputSchema: zodToJsonSchema(AddBranchInputSchema)
                },
                {
                    name: 'bitbucket_add_pull_request_file_line_comment',
                    description: 'Adds a comment to a Bitbucket pull request, optionally as an inline comment on a specific file and line.',
                    inputSchema: zodToJsonSchema(AddPrCommentInputSchema)
                },
                {
                    name: 'bitbucket_list_repository_branches',
                    description: 'Lists branches for a Bitbucket repository.',
                    inputSchema: zodToJsonSchema(ListBranchesInputSchema)
                },
                {
                    name: 'bitbucket_get_user_profile',
                    description: 'Gets Bitbucket user profile details by username.',
                    inputSchema: zodToJsonSchema(GetUserInputSchema)
                }
            ]
        }));

        this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
            try {
                this.logger.info(`[CallToolRequestSchema] Received tool call. Name: '${request.params.name}'. Args: ${JSON.stringify(request.params.arguments ?? {})}. DefaultProject: '${this.api.getDefaultProjectKey()}'`);
                const args = request.params.arguments ?? {};

                const handler = this.toolHandlers.get(request.params.name);
                if (handler) {
                    return await handler(args);
                } else {
                    throw new McpError(
                        ErrorCode.MethodNotFound,
                        `Unknown tool: ${request.params.name}`
                    );
                }
            } catch (error) {
                this.logger.error('Tool execution error', {error});
                if (axios.isAxiosError(error)) {
                    throw new McpError(
                        ErrorCode.InternalError,
                        `Bitbucket API error: ${error.response?.data.message ?? error.message}`
                    );
                }
                throw error;
            }
        });
    }
}