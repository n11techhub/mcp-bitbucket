import {PullRequestParams} from "../input/PullRequestParams.js";
import { GetRepoInputSchema, GetRepoInputType } from "../../application/dtos/GetRepoInputSchema.js";
import { GetFileInputSchema, GetFileInputType } from "../../application/dtos/GetFileInputSchema.js";
import { AddBranchInputSchema, AddBranchInputType } from "../../application/dtos/AddBranchInputSchema.js";
import { AddPrCommentInputSchema, AddPrCommentInputType } from "../../application/dtos/AddPrCommentInputSchema.js";
import { ListBranchesInputSchema, ListBranchesInputType } from "../../application/dtos/ListBranchesInputSchema.js";
import { CreatePullRequestInputSchema, CreatePullRequestInput } from '../../application/dtos/CreatePullRequestInputSchema.js';
import { GetPullRequestInputSchema, GetPullRequestInput } from '../../application/dtos/GetPullRequestInputSchema.js';
import { MergePullRequestInputSchema, MergePullRequestInput } from '../../application/dtos/MergePullRequestInputSchema.js';
import { MergeOptionType } from '../../application/dtos/MergeOptionSchema.js';
import { DeclinePullRequestInputSchema, DeclinePullRequestInput } from '../../application/dtos/DeclinePullRequestInputSchema.js';
import { AddCommentInputSchema, AddCommentInput } from '../../application/dtos/AddCommentInputSchema.js';
import { CommentOptionType } from '../../application/dtos/CommentOptionSchema.js';
import { zodToJsonSchema } from 'zod-to-json-schema';
import { GetDiffInputSchema, GetDiffInput } from '../../application/dtos/GetDiffInputSchema.js';
import { ListWorkspacesInputSchema, ListWorkspacesInputType } from '../../application/dtos/ListWorkspacesInputSchema.js';
import { ListRepositoriesInputSchema, ListRepositoriesInputType } from '../../application/dtos/ListRepositoriesInputSchema.js';
import { SearchContentInputSchema, SearchContentInputType } from '../../application/dtos/SearchContentInputSchema.js';
import {Server} from "@modelcontextprotocol/sdk/server/index.js";
import {CallToolRequestSchema, ErrorCode, ListToolsRequestSchema, McpError} from "@modelcontextprotocol/sdk/types.js";
import {PullRequestInput} from "../input/PullRequestInput.js";
import winston from "winston";
import {BitbucketClientApi} from "../clients/BitbucketClientApi.js";
import axios from "axios";

const logger = winston.createLogger({
    level: 'info',
    format: winston.format.json(),
    transports: [
        new winston.transports.File({filename: 'bitbucket.log'})
    ]
});

export class McpServerSetup {
    public readonly server: Server;
    private readonly api: BitbucketClientApi;

    constructor(api: BitbucketClientApi) {
        this.api = api;
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
        this.server.onerror = (error) => logger.error('[MCP Error]', error);
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
                logger.info(`[CallToolRequestSchema] Received tool call. Name: '${request.params.name}'. Args: ${JSON.stringify(request.params.arguments ?? {})}. DefaultProject: '${this.api.config.defaultProject}'`);
                const args = request.params.arguments ?? {};

                switch (request.params.name) {
                    case 'create_pull_request': {
                        // args is already validated and typed by CreatePullRequestInputSchema by the MCP server
                        return await this.api.createPullRequest(args as CreatePullRequestInput);
                    }
                    case 'get_pull_request': {
                        // args is already validated and typed by GetPullRequestInputSchema by the MCP server
                        const typedArgs = args as GetPullRequestInput;
                        const project = typedArgs.project ?? this.api.config.defaultProject;

                        if (!project) {
                            throw new McpError(ErrorCode.InvalidParams, 'Project must be provided for get_pull_request (as args.project or BITBUCKET_DEFAULT_PROJECT)');
                        }
                        // Pass all args, but ensure project is resolved
                        return await this.api.getPullRequest({ ...typedArgs, project });
                    }
                    case 'merge_pull_request': {
                        // args is already validated and typed by MergePullRequestInputSchema by the MCP server
                        const typedArgs = args as MergePullRequestInput;
                        const project = typedArgs.project ?? this.api.config.defaultProject;

                        if (!project) {
                            throw new McpError(ErrorCode.InvalidParams, 'Project must be provided for merge_pull_request (as args.project or BITBUCKET_DEFAULT_PROJECT)');
                        }

                        const prParams: PullRequestParams = {
                            project,
                            repository: typedArgs.repository,
                            prId: typedArgs.prId
                        };

                        const mergeOptions: MergeOptionType = {
                            message: typedArgs.message,
                            strategy: typedArgs.strategy
                        };

                        return await this.api.mergePullRequest(prParams, mergeOptions);
                    }
                    case 'decline_pull_request': {
                        // args is already validated and typed by DeclinePullRequestInputSchema by the MCP server
                        const typedArgs = args as DeclinePullRequestInput;
                        const project = typedArgs.project ?? this.api.config.defaultProject;

                        if (!project) {
                            throw new McpError(ErrorCode.InvalidParams, 'Project must be provided for decline_pull_request (as args.project or BITBUCKET_DEFAULT_PROJECT)');
                        }

                        const prParams: PullRequestParams = {
                            project,
                            repository: typedArgs.repository,
                            prId: typedArgs.prId
                        };

                        return await this.api.declinePullRequest(prParams, typedArgs.message);
                    }
                    case 'add_comment': {
                        // args is already validated and typed by AddCommentInputSchema by the MCP server
                        const typedArgs = args as AddCommentInput;
                        const project = typedArgs.project ?? this.api.config.defaultProject;

                        if (!project) {
                            throw new McpError(ErrorCode.InvalidParams, 'Project must be provided for add_comment (as args.project or BITBUCKET_DEFAULT_PROJECT)');
                        }

                        const prParams: PullRequestParams = {
                            project,
                            repository: typedArgs.repository,
                            prId: typedArgs.prId
                        };

                        const commentOptions: CommentOptionType = {
                            text: typedArgs.text,
                            parentId: typedArgs.parentId
                        };

                        return await this.api.addComment(prParams, commentOptions);
                    }
                    case 'get_diff': {
                        // args is already validated and typed by GetDiffInputSchema by the MCP server
                        const typedArgs = args as GetDiffInput;
                        const project = typedArgs.project ?? this.api.config.defaultProject;

                        if (!project) {
                            throw new McpError(ErrorCode.InvalidParams, 'Project must be provided for get_diff (as args.project or BITBUCKET_DEFAULT_PROJECT)');
                        }

                        const prParams: PullRequestParams = {
                            project,
                            repository: typedArgs.repository,
                            prId: typedArgs.prId
                        };

                        return await this.api.getDiff(prParams, typedArgs.contextLines);
                    }
                    case 'get_reviews': {
                        // args is already validated and typed by GetPullRequestInputSchema by the MCP server
                        const typedArgs = args as GetPullRequestInput;
                        const project = typedArgs.project ?? this.api.config.defaultProject;

                        if (!project) {
                            throw new McpError(ErrorCode.InvalidParams, 'Project must be provided for get_reviews (as args.project or BITBUCKET_DEFAULT_PROJECT)');
                        }

                        const prParams: PullRequestParams = {
                            project,
                            repository: typedArgs.repository,
                            prId: typedArgs.prId
                        };

                        return await this.api.getReviews(prParams);
                    }
                    case 'bb_ls_workspaces': {
                        // args is already validated and typed by ListWorkspacesInputSchema by the MCP server
                        // This tool doesn't need the project context from pullRequestParams
                        return await this.api.listWorkspaces(args as ListWorkspacesInputType);
                    }
                    case 'bb_ls_repos': {
                        // args is already validated and typed by ListRepositoriesInputSchema by the MCP server
                        // This tool doesn't need the project context from pullRequestParams for global search
                        // but uses projectKey or workspaceSlug if provided in args.
                        return await this.api.listRepositories(args as ListRepositoriesInputType);
                    }
                    case 'bb_search': {
                        // args is already validated and typed by SearchContentInputSchema by the MCP server
                        return await this.api.searchContent(args as SearchContentInputType);
                    }
                    case 'bb_get_repo': {
                        // args is already validated and typed by GetRepoInputSchema by the MCP server
                        // Note: this.api.getRepo method is currently missing in BitbucketClientApi.ts
                        return await this.api.getRepo(args as GetRepoInputType);
                    }
                    case 'bb_get_file': {
                        // args is already validated and typed by GetFileInputSchema by the MCP server
                        return await this.api.bb_get_file(args as GetFileInputType);
                    }
                    case 'bb_add_branch': {
                        // args is already validated and typed by AddBranchInputSchema by the MCP server
                        return await this.api.bb_add_branch(args as AddBranchInputType);
                    }
                    case 'bb_add_pr_comment': {
                        // args is already validated and typed by AddPrCommentInputSchema by the MCP server
                        // The bb_add_pr_comment method in BitbucketClientApi handles mapping workspaceSlug to projectKey
                        return await this.api.bb_add_pr_comment(args as AddPrCommentInputType);
                    }
                    case 'bb_list_branches': {
                        // args is already validated and typed by ListBranchesInputSchema by the MCP server
                        // The bb_list_branches method in BitbucketClientApi handles mapping workspaceSlug to projectKey
                        return await this.api.bb_list_branches(args as ListBranchesInputType);
                    }
                    default: {
                        throw new McpError(
                            ErrorCode.MethodNotFound,
                            `Unknown tool: ${request.params.name}`
                        );
                    }
                }
            } catch (error) {
                logger.error('Tool execution error', {error});
                if (axios.isAxiosError(error)) {
                    throw new McpError(
                        ErrorCode.InternalError,
                        `Bitbucket API error: ${error.response?.data.message ?? error.message}`
                    );
                }
                throw error;
            }
        });

        // We've integrated the bb_ls_workspaces tool into the main switch statement above
        // No need for a separate handler
    }

    private isPullRequestInput(args: unknown): args is PullRequestInput {
        const input = args as Partial<PullRequestInput>;
        return typeof args === 'object' &&
            args !== null &&
            typeof input.project === 'string' &&
            typeof input.repository === 'string' &&
            typeof input.title === 'string' &&
            typeof input.sourceBranch === 'string' &&
            typeof input.targetBranch === 'string' &&
            (input.description === undefined || typeof input.description === 'string') &&
            (input.reviewers === undefined || Array.isArray(input.reviewers));
    }
}