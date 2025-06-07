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
import {Server} from "@modelcontextprotocol/sdk/server/index.js";
import {CallToolRequestSchema, ErrorCode, ListToolsRequestSchema, McpError} from "@modelcontextprotocol/sdk/types.js";
import {IBitbucketClient} from "../../application/ports/IBitbucketClient.js";
import { IBitbucketUseCase } from '../../application/use-cases/IBitbucketUseCase.js';
import axios from "axios";
import winston from 'winston';



export class McpServerSetup {
    public readonly server: Server;
    private readonly api: IBitbucketClient;
    private readonly bitbucketUseCase: IBitbucketUseCase;
    private readonly logger: winston.Logger;
    private readonly toolHandlers: Map<string, (args: any) => Promise<any>>;

    constructor(api: IBitbucketClient, bitbucketUseCase: IBitbucketUseCase, logger: winston.Logger) {
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
        this.toolHandlers.set('create_pull_request', async (args: any) => this.bitbucketUseCase.createPullRequest(args as CreatePullRequestInput));
        this.toolHandlers.set('get_pull_request', async (args: any) => this.bitbucketUseCase.getPullRequest(args as GetPullRequestInput));
        this.toolHandlers.set('merge_pull_request', async (args: any) => this.bitbucketUseCase.mergePullRequest(args as MergePullRequestInput));
        this.toolHandlers.set('decline_pull_request', async (args: any) => this.bitbucketUseCase.declinePullRequest(args as DeclinePullRequestInput));
        this.toolHandlers.set('add_comment', async (args: any) => this.bitbucketUseCase.addComment(args as AddCommentInput));
        this.toolHandlers.set('get_diff', async (args: any) => this.bitbucketUseCase.getDiff(args as GetDiffInput));
        this.toolHandlers.set('get_reviews', async (args: any) => this.bitbucketUseCase.getReviews(args as GetPullRequestInput)); // Note: GetPullRequestInput is correct based on original switch
        this.toolHandlers.set('bb_ls_workspaces', async (args: any) => this.bitbucketUseCase.listWorkspaces(args as ListWorkspacesInputType));
        this.toolHandlers.set('bb_ls_repos', async (args: any) => this.bitbucketUseCase.listRepositories(args as ListRepositoriesInputType));
        this.toolHandlers.set('bb_search', async (args: any) => this.bitbucketUseCase.searchContent(args as SearchContentInputType));
        this.toolHandlers.set('bb_get_repo', async (args: any) => this.bitbucketUseCase.getRepo(args as GetRepoInputType));
        this.toolHandlers.set('bb_get_file', async (args: any) => this.bitbucketUseCase.getFile(args as GetFileInputType));
        this.toolHandlers.set('bb_add_branch', async (args: any) => this.bitbucketUseCase.addBranch(args as AddBranchInputType));
        this.toolHandlers.set('bb_add_pr_comment', async (args: any) => this.bitbucketUseCase.addPullRequestComment(args as AddPrCommentInputType));
        this.toolHandlers.set('bb_list_branches', async (args: any) => this.bitbucketUseCase.listBranches(args as ListBranchesInputType));
    }


    private setupToolHandlers() {
        this.server.setRequestHandler(ListToolsRequestSchema, async () => ({
            tools: [
                {
                    name: 'create_pull_request',
                    description: 'Create a new pull request',
                    inputSchema: zodToJsonSchema(CreatePullRequestInputSchema)
                },
                {
                    name: 'get_pull_request',
                    description: 'Get pull request details',
                    inputSchema: zodToJsonSchema(GetPullRequestInputSchema)
                },
                {
                    name: 'merge_pull_request',
                    description: 'Merge a pull request',
                    inputSchema: zodToJsonSchema(MergePullRequestInputSchema)
                },
                {
                    name: 'decline_pull_request',
                    description: 'Decline a pull request',
                    inputSchema: zodToJsonSchema(DeclinePullRequestInputSchema)
                },
                {
                    name: 'add_comment',
                    description: 'Add a comment to a pull request',
                    inputSchema: zodToJsonSchema(AddCommentInputSchema)
                },
                {
                    name: 'get_diff',
                    description: 'Get pull request diff',
                    inputSchema: zodToJsonSchema(GetDiffInputSchema)
                },
                {
                    name: 'get_reviews',
                    description: 'Get pull request reviews',
                    inputSchema: zodToJsonSchema(GetPullRequestInputSchema)
                },
                {
                    name: 'bb_ls_workspaces',
                    description: 'Lists available workspaces (query: str opt). Use: View accessible workspaces.',
                    inputSchema: zodToJsonSchema(ListWorkspacesInputSchema),
                },
                {
                    name: 'bb_ls_repos',
                    description: 'Lists repositories (workspaceSlug: str opt, projectKey: str opt, query: str opt, role: str opt). Use: Find repositories.',
                    inputSchema: zodToJsonSchema(ListRepositoriesInputSchema)
                },
                {
                    name: 'bb_search',
                    description: 'Searches Bitbucket content (workspaceSlug: str req, query: str req, scope: str opt, language: str opt, extension: str opt). Use: Find code or PRs.',
                    inputSchema: zodToJsonSchema(SearchContentInputSchema)
                },
                {
                    name: 'bb_get_repo',
                    description: 'Gets repository details (workspaceSlug: str req, repoSlug: str req). Use: Access repo information.',
                    inputSchema: zodToJsonSchema(GetRepoInputSchema)
                },
                {
                    name: 'bb_get_file',
                    description: 'Gets file content (workspaceSlug: str req, repoSlug: str req, filePath: str req, revision: str opt). Use: View specific file.',
                    inputSchema: zodToJsonSchema(GetFileInputSchema)
                },
                {
                    name: 'bb_add_branch',
                    description: 'Creates a branch (workspaceSlug: str req, repoSlug: str req, newBranchName: str req, sourceBranchOrCommit: str opt). Use: Create a feature branch.',
                    inputSchema: zodToJsonSchema(AddBranchInputSchema)
                },
                {
                    name: 'bb_add_pr_comment',
                    description: 'Adds a comment to a Pull Request, optionally as an inline comment. (workspaceSlug: str req, repoSlug: str req, prId: num req, content: str req, parentId: num opt, inline: obj opt). Use: Add feedback to PRs.',
                    inputSchema: zodToJsonSchema(AddPrCommentInputSchema)
                },
                {
                    name: 'bb_list_branches',
                    description: 'Lists branches (workspaceSlug: str req, repoSlug: str req, query: str opt, sort: str opt). Use: View all branches.',
                    inputSchema: zodToJsonSchema(ListBranchesInputSchema)
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