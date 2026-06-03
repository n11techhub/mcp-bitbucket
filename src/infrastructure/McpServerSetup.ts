import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { CallToolRequestSchema, ErrorCode, ListToolsRequestSchema, McpError } from '@modelcontextprotocol/sdk/types.js';
import { inject, injectable } from 'inversify';
import { z } from 'zod/v3';
import axios from 'axios';
import winston from 'winston';
import { Types } from '../application/Types.js';
import type { IBitbucketClientFacade } from '../application/facade/IBitbucketClientFacade.js';
import type { IBitbucketUseCase } from '../application/use-case/IBitbucketUseCase.js';
import type { Configuration } from './configuration/Configuration.js';
import {
    AddBranchInputSchema,
    AddCommentInputSchema,
    AddPrCommentInputSchema,
    ApprovePullRequestInputSchema,
    BrowseDirectoryInputSchema,
    CreatePullRequestInputSchema,
    DeclinePullRequestInputSchema,
    GetDiffInputSchema,
    GetFileInputSchema,
    GetPullRequestInputSchema,
    GetRepoInputSchema,
    GetUserInputSchema,
    ListBranchesInputSchema,
    ListRepositoriesInputSchema,
    ListWorkspacesInputSchema,
    MergePullRequestInputSchema,
    SearchContentInputSchema,
} from '../domain/contracts/schemas/index.js';
import { zodToJsonSchema } from 'zod-to-json-schema';
import {sanitizeSchema} from "../application/util/SchemaSanitizer.js";

interface ToolDefinitionExtended {
    name: string;
    description: string;
    inputSchema: any;
    handler: (params: any) => Promise<any>;
}

@injectable()
export class McpServerSetup {
    private readonly logger: winston.Logger;
    private readonly toolHandlers: Map<string, (args: any) => Promise<any>>;
    private readonly definedTools: ToolDefinitionExtended[];
    private readonly apiKey: string | undefined;
    private readonly configuration: Configuration;
    private readonly api: IBitbucketClientFacade;
    private readonly bitbucketUseCase: IBitbucketUseCase;
    private readonly isProduction: boolean;

    constructor(
        @inject(Types.IBitbucketClient) api: IBitbucketClientFacade,
        @inject(Types.IBitbucketUseCase) bitbucketUseCase: IBitbucketUseCase,
        @inject(Types.Logger) logger: winston.Logger,
        @inject(Types.Configuration) configuration: Configuration
    ) {
        this.api = api;
        this.bitbucketUseCase = bitbucketUseCase;
        this.logger = logger;
        this.configuration = configuration;
        this.isProduction = process.env.NODE_ENV === 'production';
        this.apiKey = process.env.MCP_API_KEY;

        if (!this.apiKey && this.isProduction) {
            throw new Error('MCP_API_KEY must be set in production to secure MCP tool execution.');
        }

        if (!this.apiKey && !this.isProduction) {
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
                name: 'bitbucket_approve_pull_request',
                description: 'Approves a Bitbucket pull request',
                inputSchema: zodToJsonSchema(ApprovePullRequestInputSchema),
                handler: this.createValidatedHandler('bitbucket_approve_pull_request', ApprovePullRequestInputSchema, this.bitbucketUseCase.bitbucketApprovePullRequest.bind(this.bitbucketUseCase))
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
                name: 'bitbucket_browse_directory',
                description: 'Browses a directory in a Bitbucket repository.',
                inputSchema: zodToJsonSchema(BrowseDirectoryInputSchema),
                handler: this.createValidatedHandler('bitbucket_browse_directory', BrowseDirectoryInputSchema, this.bitbucketUseCase.bitbucketBrowseDirectory.bind(this.bitbucketUseCase))
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
    }

    public getAvailableTools(): any[] {
        return this.definedTools.map(({ name, description, inputSchema }) => ({
            name,
            description,
            inputSchema: sanitizeSchema(inputSchema)
        }));
    }

    public configureServer(server: McpServer, apiKey?: string): void {
        server.server.setRequestHandler(ListToolsRequestSchema, async () => ({
            tools: this.getAvailableTools()
        }));

        server.server.setRequestHandler(CallToolRequestSchema, async (request) => {
            const argsSummary = this.summarizeArgs(request.params.arguments);
            this.logger.info(`[CallToolRequestSchema] Received tool call. Name: '${request.params.name}'. ArgsSummary: ${JSON.stringify(argsSummary)}. DefaultProject: '${this.configuration.defaultProject}'`);

            this.authenticate(apiKey);

            const args = request.params.arguments ?? {};
            return await this.executeTool(request.params.name, args);
        });

        server.server.onerror = (error: any) =>
            this.logger.error('[MCP Error]', error instanceof Error ? error.message : String(error), error instanceof Error ? { stack: error.stack } : {});
    }

    private async executeTool(toolName: string, args: any): Promise<any> {
        const handler = this.toolHandlers.get(toolName);
        if (!handler) {
            throw new McpError(ErrorCode.MethodNotFound, `Unknown tool: ${toolName}`);
        }

        try {
            return await handler(args);
        } catch (error) {
            this.logger.error('[CallToolRequestSchema] Tool execution error', { error });
            if (error instanceof McpError) throw error;
            if (axios.isAxiosError(error)) {
                throw new McpError(
                    ErrorCode.InternalError,
                    `Bitbucket API error: ${error.response?.data?.message ?? error.message}`
                );
            }
            throw new McpError(ErrorCode.InternalError, error instanceof Error ? error.message : String(error));
        }
    }

    private authenticate(requestApiKey?: string): void {
        if (!this.apiKey) return;
        if (!requestApiKey || requestApiKey !== this.apiKey) {
            this.logger.error('Authentication failed: Invalid or missing API key.');
            throw new McpError(ErrorCode.InternalError, 'Authentication failed: Invalid or missing API key.');
        }
        this.logger.info('Authentication successful.');
    }

    private createValidatedHandler<T>(
        toolName: string,
        schema: z.ZodType<T>,
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
                    argsSummary: this.summarizeArgs(args)
                });
                throw error;
            }
        };
    }

    private summarizeArgs(args: unknown): Record<string, unknown> {
        if (!args || typeof args !== 'object' || Array.isArray(args)) {
            return { type: typeof args };
        }

        const raw = args as Record<string, unknown>;
        const summary: Record<string, unknown> = {
            keys: Object.keys(raw)
        };

        for (const key of ['project', 'workspaceSlug', 'repoSlug', 'repository', 'prId', 'username']) {
            if (key in raw) {
                summary[key] = raw[key];
            }
        }

        return summary;
    }
}