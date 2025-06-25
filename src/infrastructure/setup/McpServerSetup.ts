import {GetRepoInputSchema} from "../../domain/contracts/schemas/GetRepoInputSchema.js";
import {GetFileInputSchema} from "../../domain/contracts/schemas/GetFileInputSchema.js";
import {AddBranchInputSchema} from "../../domain/contracts/schemas/AddBranchInputSchema.js";
import {AddPrCommentInputSchema} from "../../domain/contracts/schemas/AddPrCommentInputSchema.js";
import {ListBranchesInputSchema} from "../../domain/contracts/schemas/ListBranchesInputSchema.js";
import {CreatePullRequestInputSchema} from '../../domain/contracts/schemas/CreatePullRequestInputSchema.js';
import {GetPullRequestInputSchema} from '../../domain/contracts/schemas/GetPullRequestInputSchema.js';
import {MergePullRequestInputSchema} from '../../domain/contracts/schemas/MergePullRequestInputSchema.js';
import {DeclinePullRequestInputSchema} from '../../domain/contracts/schemas/DeclinePullRequestInputSchema.js';
import {AddCommentInputSchema} from '../../domain/contracts/schemas/AddCommentInputSchema.js';
import {zodToJsonSchema} from 'zod-to-json-schema';
import {GetDiffInputSchema} from '../../domain/contracts/schemas/GetDiffInputSchema.js';
import {ListWorkspacesInputSchema} from '../../domain/contracts/schemas/ListWorkspacesInputSchema.js';
import {ListRepositoriesInputSchema} from '../../domain/contracts/schemas/ListRepositoriesInputSchema.js';
import {SearchContentInputSchema} from '../../domain/contracts/schemas/SearchContentInputSchema.js';
import {GetUserInputSchema} from '../../domain/contracts/schemas/GetUserInputSchema.js';
import {Server} from "@modelcontextprotocol/sdk/server/index.js";
import {CallToolRequestSchema, ErrorCode, ListToolsRequestSchema, McpError} from "@modelcontextprotocol/sdk/types.js";
import {IBitbucketClientFacade} from "../../application/facade/IBitbucketClientFacade.js";
import {IBitbucketUseCase} from '../../application/use-cases/IBitbucketUseCase.js';
import axios from "axios";
import winston from 'winston';
import {inject, injectable} from 'inversify';
import {TYPES} from '../types.js';
import {type ZodType} from 'zod';

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
    private readonly apiKey: string | undefined;

    private createValidatedHandler<T>(
        toolName: string,
        schema: ZodType<T>,
        useCaseMethod: (args: T) => Promise<any>
    ): (args: any) => Promise<any> {
        return async (args: any) => {
            try {
                const validatedArgs = schema.parse(args);
                return await useCaseMethod(validatedArgs);
            } catch (error: any) {
                this.logger.error(`Error in ${toolName} handler`, {
                    message: error.message,
                    stack: error.stack,
                    args: args
                });
                throw error;
            }
        };
    }

    constructor(
        @inject(TYPES.IBitbucketClient) api: IBitbucketClientFacade,
        @inject(TYPES.IBitbucketUseCase) bitbucketUseCase: IBitbucketUseCase,
        @inject(TYPES.Logger) logger: winston.Logger
    ) {
        this.api = api;
        this.bitbucketUseCase = bitbucketUseCase;
        this.logger = logger;
        this.apiKey = process.env.MCP_API_KEY;

        if (!this.apiKey) {
            this.logger.warn('MCP_API_KEY is not set. The server will not require authentication.');
        }

        this.definedTools = [
            {
                name: 'bitbucket_create_pull_request',
                description: 'Creates a new Bitbucket pull request',
                inputSchema: zodToJsonSchema(CreatePullRequestInputSchema),
                handler: this.createValidatedHandler('bitbucket_create_pull_request', CreatePullRequestInputSchema, this.bitbucketUseCase.bitbucketCreatePullRequest.bind(this.bitbucketUseCase))
            },
            {
                name: 'bitbucket_get_pull_request_details',
                description: 'Gets details for a Bitbucket pull request',
                inputSchema: zodToJsonSchema(GetPullRequestInputSchema),
                handler: this.createValidatedHandler('bitbucket_get_pull_request_details', GetPullRequestInputSchema, this.bitbucketUseCase.bitbucketGetPullRequestDetails.bind(this.bitbucketUseCase))
            },
            {
                name: 'bitbucket_get_pull_request_diff',
                description: 'Gets the diff for a Bitbucket pull request',
                inputSchema: zodToJsonSchema(GetDiffInputSchema),
                handler: this.createValidatedHandler('bitbucket_get_pull_request_diff', GetDiffInputSchema, this.bitbucketUseCase.bitbucketGetPullRequestDiff.bind(this.bitbucketUseCase))
            },
            {
                name: 'bitbucket_get_pull_request_reviews',
                description: 'Gets reviews for a Bitbucket pull request',
                inputSchema: zodToJsonSchema(GetPullRequestInputSchema),
                handler: this.createValidatedHandler('bitbucket_get_pull_request_reviews', GetPullRequestInputSchema, this.bitbucketUseCase.bitbucketGetPullRequestReviews.bind(this.bitbucketUseCase))
            },
            {
                name: 'bitbucket_list_workspaces',
                description: 'Lists available Bitbucket workspaces.',
                inputSchema: zodToJsonSchema(ListWorkspacesInputSchema),
                handler: this.createValidatedHandler('bitbucket_list_workspaces', ListWorkspacesInputSchema, this.bitbucketUseCase.bitbucketListWorkspaces.bind(this.bitbucketUseCase))
            },
            {
                name: 'bitbucket_list_repositories',
                description: 'Lists Bitbucket repositories.',
                inputSchema: zodToJsonSchema(ListRepositoriesInputSchema),
                handler: this.createValidatedHandler('bitbucket_list_repositories', ListRepositoriesInputSchema, this.bitbucketUseCase.bitbucketListRepositories.bind(this.bitbucketUseCase))
            },
            {
                name: 'bitbucket_search_content',
                description: 'Searches content within Bitbucket repositories.',
                inputSchema: zodToJsonSchema(SearchContentInputSchema),
                handler: this.createValidatedHandler('bitbucket_search_content', SearchContentInputSchema, this.bitbucketUseCase.bitbucketSearchContent.bind(this.bitbucketUseCase))
            },
            {
                name: 'bitbucket_get_repository_details',
                description: 'Gets details for a specific Bitbucket repository.',
                inputSchema: zodToJsonSchema(GetRepoInputSchema),
                handler: this.createValidatedHandler('bitbucket_get_repository_details', GetRepoInputSchema, this.bitbucketUseCase.bitbucketGetRepositoryDetails.bind(this.bitbucketUseCase))
            },
            {
                name: 'bitbucket_get_file_content',
                description: 'Gets the content of a specific file from a Bitbucket repository.',
                inputSchema: zodToJsonSchema(GetFileInputSchema),
                handler: this.createValidatedHandler('bitbucket_get_file_content', GetFileInputSchema, this.bitbucketUseCase.bitbucketGetFileContent.bind(this.bitbucketUseCase))
            },
            {
                name: 'bitbucket_create_branch',
                description: 'Creates a new branch in a Bitbucket repository.',
                inputSchema: zodToJsonSchema(AddBranchInputSchema),
                handler: this.createValidatedHandler('bitbucket_create_branch', AddBranchInputSchema, this.bitbucketUseCase.bitbucketCreateBranch.bind(this.bitbucketUseCase))
            },
            {
                name: 'bitbucket_add_pull_request_file_line_comment',
                description: 'Adds a comment to a Bitbucket pull request, optionally as an inline comment on a specific file and line.',
                inputSchema: zodToJsonSchema(AddPrCommentInputSchema),
                handler: this.createValidatedHandler('bitbucket_add_pull_request_file_line_comment', AddPrCommentInputSchema, this.bitbucketUseCase.bitbucketAddPullRequestFileLineComment.bind(this.bitbucketUseCase))
            },
            {
                name: 'bitbucket_list_repository_branches',
                description: 'Lists branches for a Bitbucket repository.',
                inputSchema: zodToJsonSchema(ListBranchesInputSchema),
                handler: this.createValidatedHandler('bitbucket_list_repository_branches', ListBranchesInputSchema, this.bitbucketUseCase.bitbucketListRepositoryBranches.bind(this.bitbucketUseCase))
            },
            {
                name: 'bitbucket_get_user_profile',
                description: 'Gets Bitbucket user profile details by username.',
                inputSchema: zodToJsonSchema(GetUserInputSchema),
                handler: this.createValidatedHandler('bitbucket_get_user_profile', GetUserInputSchema, this.bitbucketUseCase.bitbucketGetUserDetails.bind(this.bitbucketUseCase))
            },
            {
                name: 'bitbucket_merge_pull_request',
                description: 'Merges a Bitbucket pull request',
                inputSchema: zodToJsonSchema(MergePullRequestInputSchema),
                handler: this.createValidatedHandler('bitbucket_merge_pull_request', MergePullRequestInputSchema, this.bitbucketUseCase.bitbucketMergePullRequest.bind(this.bitbucketUseCase))
            },
            {
                name: 'bitbucket_decline_pull_request',
                description: 'Declines a Bitbucket pull request',
                inputSchema: zodToJsonSchema(DeclinePullRequestInputSchema),
                handler: this.createValidatedHandler('bitbucket_decline_pull_request', DeclinePullRequestInputSchema, this.bitbucketUseCase.bitbucketDeclinePullRequest.bind(this.bitbucketUseCase))
            },
            {
                name: 'bitbucket_add_pull_request_comment',
                description: 'Adds a general comment to a Bitbucket pull request',
                inputSchema: zodToJsonSchema(AddCommentInputSchema),
                handler: this.createValidatedHandler('bitbucket_add_pull_request_comment', AddCommentInputSchema, this.bitbucketUseCase.bitbucketAddGeneralPullRequestComment.bind(this.bitbucketUseCase))
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

    private authenticate(requestApiKey?: string): void {
        if (!this.apiKey) {
            return;
        }

        if (!requestApiKey || requestApiKey !== this.apiKey) {
            this.logger.error('Authentication failed: Invalid or missing API key.');
            throw new McpError(ErrorCode.InternalError, 'Authentication failed: Invalid or missing API key.');
        }

        this.logger.info('Authentication successful.');
    }

    public async callTool(toolName: string, toolParams: any, apiKey?: string): Promise<any> {
        try {
            this.authenticate(apiKey);
            this.logger.info(`[callTool] Calling tool ${toolName}`, {params: toolParams});
            const handler = this.toolHandlers.get(toolName);

            if (!handler) {
                this.logger.error(`[callTool] Unknown tool: ${toolName}`);
                throw new McpError(ErrorCode.MethodNotFound, `Unknown tool: ${toolName}`);
            }

            return await handler(toolParams);
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