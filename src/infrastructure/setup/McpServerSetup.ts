import {GetRepoInputSchema, GetRepoInputType} from "../../domain/contracts/schemas/GetRepoInputSchema.js";
import {GetFileInputSchema, GetFileInputType} from "../../domain/contracts/schemas/GetFileInputSchema.js";
import {AddBranchInputSchema, AddBranchInputType} from "../../domain/contracts/schemas/AddBranchInputSchema.js";
import {AddPrCommentInputSchema, AddPrCommentInputType} from "../../domain/contracts/schemas/AddPrCommentInputSchema.js";
import {ListBranchesInputSchema, ListBranchesInputType} from "../../domain/contracts/schemas/ListBranchesInputSchema.js";
import {
    CreatePullRequestInputSchema,
    CreatePullRequestInput
} from '../../domain/contracts/schemas/CreatePullRequestInputSchema.js';
import {GetPullRequestInputSchema, GetPullRequestInput} from '../../domain/contracts/schemas/GetPullRequestInputSchema.js';
import {
    MergePullRequestInputSchema,
    MergePullRequestInput
} from '../../domain/contracts/schemas/MergePullRequestInputSchema.js';
import {
    DeclinePullRequestInputSchema,
    DeclinePullRequestInput
} from '../../domain/contracts/schemas/DeclinePullRequestInputSchema.js';
import {AddCommentInputSchema, AddCommentInput} from '../../domain/contracts/schemas/AddCommentInputSchema.js';
import {zodToJsonSchema} from 'zod-to-json-schema';
import {GetDiffInputSchema, GetDiffInput} from '../../domain/contracts/schemas/GetDiffInputSchema.js';
import {ListWorkspacesInputSchema, ListWorkspacesInputType} from '../../domain/contracts/schemas/ListWorkspacesInputSchema.js';
import {
    ListRepositoriesInputSchema,
    ListRepositoriesInputType
} from '../../domain/contracts/schemas/ListRepositoriesInputSchema.js';
import {SearchContentInputSchema, SearchContentInputType} from '../../domain/contracts/schemas/SearchContentInputSchema.js';
import {GetUserInputSchema, GetUserInputType} from '../../domain/contracts/schemas/GetUserInputSchema.js';
import {Server} from "@modelcontextprotocol/sdk/server/index.js";
import {CallToolRequestSchema, ErrorCode, ListToolsRequestSchema, McpError} from "@modelcontextprotocol/sdk/types.js";
import {IBitbucketClientFacade} from "../../application/facade/IBitbucketClientFacade.js";
import {IBitbucketUseCase} from '../../application/use-cases/IBitbucketUseCase.js';
import axios from "axios";
import winston from 'winston';
import {injectable, inject} from 'inversify';
import {TYPES} from '../types.js';

interface ToolDefinitionExtended {
    name: string;
    description: string;
    inputSchema: any;
    handler: (params: any) => Promise<any>;
}

@injectable()
export class McpServerSetup {
    public readonly server: Server;
    private readonly api: IBitbucketClientFacade;
    private readonly bitbucketUseCase: IBitbucketUseCase;
    private readonly logger: winston.Logger;
    private readonly toolHandlers: Map<string, (args: any) => Promise<any>>;
    private readonly definedTools: ToolDefinitionExtended[];

    constructor(
        @inject(TYPES.IBitbucketClient) api: IBitbucketClientFacade,
        @inject(TYPES.IBitbucketUseCase) bitbucketUseCase: IBitbucketUseCase,
        @inject(TYPES.Logger) logger: winston.Logger
    ) {
        this.api = api;
        this.bitbucketUseCase = bitbucketUseCase;
        this.logger = logger;

        this.definedTools = [
            {
                name: 'bitbucket_create_pull_request',
                description: 'Creates a new Bitbucket pull request',
                inputSchema: zodToJsonSchema(CreatePullRequestInputSchema),
                handler: async (args: any) => this.bitbucketUseCase.bitbucketCreatePullRequest(args as CreatePullRequestInput)
            },
            {
                name: 'bitbucket_get_pull_request_details',
                description: 'Gets details for a Bitbucket pull request',
                inputSchema: zodToJsonSchema(GetPullRequestInputSchema),
                handler: async (args: any) => this.bitbucketUseCase.bitbucketGetPullRequestDetails(args as GetPullRequestInput)
            },
            {
                name: 'bitbucket_get_pull_request_diff',
                description: 'Gets the diff for a Bitbucket pull request',
                inputSchema: zodToJsonSchema(GetDiffInputSchema),
                handler: async (args: any) => this.bitbucketUseCase.bitbucketGetPullRequestDiff(args as GetDiffInput)
            },
            {
                name: 'bitbucket_get_pull_request_reviews',
                description: 'Gets reviews for a Bitbucket pull request',
                inputSchema: zodToJsonSchema(GetPullRequestInputSchema),
                handler: async (args: any) => this.bitbucketUseCase.bitbucketGetPullRequestReviews(args as GetPullRequestInput)
            },
            {
                name: 'bitbucket_list_workspaces',
                description: 'Lists available Bitbucket workspaces.',
                inputSchema: zodToJsonSchema(ListWorkspacesInputSchema),
                handler: async (args: any) => this.bitbucketUseCase.bitbucketListWorkspaces(args as ListWorkspacesInputType)
            },
            {
                name: 'bitbucket_list_repositories',
                description: 'Lists Bitbucket repositories.',
                inputSchema: zodToJsonSchema(ListRepositoriesInputSchema),
                handler: async (args: any) => this.bitbucketUseCase.bitbucketListRepositories(args as ListRepositoriesInputType)
            },
            {
                name: 'bitbucket_search_content',
                description: 'Searches content within Bitbucket repositories.',
                inputSchema: zodToJsonSchema(SearchContentInputSchema),
                handler: async (args: any) => this.bitbucketUseCase.bitbucketSearchContent(args as SearchContentInputType)
            },
            {
                name: 'bitbucket_get_repository_details',
                description: 'Gets details for a specific Bitbucket repository.',
                inputSchema: zodToJsonSchema(GetRepoInputSchema),
                handler: async (args: any) => this.bitbucketUseCase.bitbucketGetRepositoryDetails(args as GetRepoInputType)
            },
            {
                name: 'bitbucket_get_file_content',
                description: 'Gets the content of a specific file from a Bitbucket repository.',
                inputSchema: zodToJsonSchema(GetFileInputSchema),
                handler: async (args: any) => this.bitbucketUseCase.bitbucketGetFileContent(args as GetFileInputType)
            },
            {
                name: 'bitbucket_create_branch',
                description: 'Creates a new branch in a Bitbucket repository.',
                inputSchema: zodToJsonSchema(AddBranchInputSchema),
                handler: async (args: any) => this.bitbucketUseCase.bitbucketCreateBranch(args as AddBranchInputType)
            },
            {
                name: 'bitbucket_add_pull_request_file_line_comment',
                description: 'Adds a comment to a Bitbucket pull request, optionally as an inline comment on a specific file and line.',
                inputSchema: zodToJsonSchema(AddPrCommentInputSchema),
                handler: async (args: any) => this.bitbucketUseCase.bitbucketAddPullRequestFileLineComment(args as AddPrCommentInputType)
            },
            {
                name: 'bitbucket_list_repository_branches',
                description: 'Lists branches for a Bitbucket repository.',
                inputSchema: zodToJsonSchema(ListBranchesInputSchema),
                handler: async (args: any) => this.bitbucketUseCase.bitbucketListRepositoryBranches(args as ListBranchesInputType)
            },
            {
                name: 'bitbucket_get_user_profile',
                description: 'Gets Bitbucket user profile details by username.',
                inputSchema: zodToJsonSchema(GetUserInputSchema),
                handler: async (args: any) => this.bitbucketUseCase.bitbucketGetUserDetails(args as GetUserInputType)
            },
            {
                name: 'bitbucket_merge_pull_request',
                description: 'Merges a Bitbucket pull request',
                inputSchema: zodToJsonSchema(MergePullRequestInputSchema),
                handler: async (args: any) => this.bitbucketUseCase.bitbucketMergePullRequest(args as MergePullRequestInput)
            },
            {
                name: 'bitbucket_decline_pull_request',
                description: 'Declines a Bitbucket pull request',
                inputSchema: zodToJsonSchema(DeclinePullRequestInputSchema),
                handler: async (args: any) => this.bitbucketUseCase.bitbucketDeclinePullRequest(args as DeclinePullRequestInput)
            },
            {
                name: 'bitbucket_add_pull_request_comment',
                description: 'Adds a general comment to a Bitbucket pull request',
                inputSchema: zodToJsonSchema(AddCommentInputSchema),
                handler: async (args: any) => this.bitbucketUseCase.bitbucketAddGeneralPullRequestComment(args as AddCommentInput)
            }
        ];

        this.toolHandlers = new Map();
        this.definedTools.forEach(tool => {
            this.toolHandlers.set(tool.name, tool.handler);
        });

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
        this.server.onerror = (error: any) => this.logger.error('[MCP Error]', error instanceof Error ? error.message : String(error), error instanceof Error ? {stack: error.stack} : {});
    }

    public async callTool(toolName: string, toolParams: any): Promise<any> {
        try {
            this.logger.info(`[callTool] Calling tool ${toolName}`, {params: toolParams});
            const handler = this.toolHandlers.get(toolName);

            if (!handler) {
                this.logger.error(`[callTool] Unknown tool: ${toolName}`);
                throw new McpError(ErrorCode.MethodNotFound, `Unknown tool: ${toolName}`);
            }

            const result = await handler(toolParams);
            return result;
        } catch (error) {
            this.logger.error('[callTool] Tool execution error', {error});
            if (error instanceof McpError) {
                throw error;
            }
            if (axios.isAxiosError(error)) {
                throw new McpError(
                    ErrorCode.InternalError,
                    `Bitbucket API error: ${error.response?.data?.message ?? error.message}`
                );
            }
            throw new McpError(ErrorCode.InternalError, error instanceof Error ? error.message : String(error));
        }
    }

    public getAvailableTools(): any[] {
        return this.definedTools.map(({name, description, inputSchema}) => ({
            name,
            description,
            inputSchema
        }));
    }

    private setupToolHandlers() {
        this.server.setRequestHandler(ListToolsRequestSchema, async () => ({
            tools: this.getAvailableTools()
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
                this.logger.error('[CallToolRequestSchema] Tool execution error', {error});
                if (axios.isAxiosError(error)) {
                    throw new McpError(
                        ErrorCode.InternalError,
                        `Bitbucket API error: ${error.response?.data.message ?? error.message}`
                    );
                }
                if (error instanceof McpError) {
                    throw error;
                }
                throw new McpError(ErrorCode.InternalError, error instanceof Error ? error.message : String(error));
            }
        });
    }
}