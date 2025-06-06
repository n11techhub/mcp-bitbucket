import {PullRequestParams} from "../input/PullRequestParams.js";
import {GetRepoInputSchema} from "../../application/dtos/GetRepoInputSchema.js";
import {GetFileInputSchema} from "../../application/dtos/GetFileInputSchema.js";
import {AddBranchInputSchema} from "../../application/dtos/AddBranchInputSchema.js";
import {AddPrCommentInputSchema} from "../../application/dtos/AddPrCommentInputSchema.js";
import {ListBranchesInputSchema} from "../../application/dtos/ListBranchesInputSchema.js";
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
                    inputSchema: {
                        type: 'object',
                        properties: {
                            project: {type: 'string', description: 'Bitbucket project key'},
                            repository: {type: 'string', description: 'Repository slug'},
                            title: {type: 'string', description: 'PR title'},
                            description: {type: 'string', description: 'PR description'},
                            sourceBranch: {type: 'string', description: 'Source branch name'},
                            targetBranch: {type: 'string', description: 'Target branch name'},
                            reviewers: {
                                type: 'array',
                                items: {type: 'string'},
                                description: 'List of reviewer usernames'
                            }
                        },
                        required: ['repository', 'title', 'sourceBranch', 'targetBranch']
                    }
                },
                {
                    name: 'get_pull_request',
                    description: 'Get pull request details',
                    inputSchema: {
                        type: 'object',
                        properties: {
                            project: {type: 'string', description: 'Bitbucket project key'},
                            repository: {type: 'string', description: 'Repository slug'},
                            prId: {type: 'number', description: 'Pull request ID'}
                        },
                        required: ['repository', 'prId']
                    }
                },
                {
                    name: 'merge_pull_request',
                    description: 'Merge a pull request',
                    inputSchema: {
                        type: 'object',
                        properties: {
                            project: {type: 'string', description: 'Bitbucket project key'},
                            repository: {type: 'string', description: 'Repository slug'},
                            prId: {type: 'number', description: 'Pull request ID'},
                            message: {type: 'string', description: 'Merge commit message'},
                            strategy: {
                                type: 'string',
                                enum: ['merge-commit', 'squash', 'fast-forward'],
                                description: 'Merge strategy to use'
                            }
                        },
                        required: ['repository', 'prId']
                    }
                },
                {
                    name: 'decline_pull_request',
                    description: 'Decline a pull request',
                    inputSchema: {
                        type: 'object',
                        properties: {
                            project: {type: 'string', description: 'Bitbucket project key'},
                            repository: {type: 'string', description: 'Repository slug'},
                            prId: {type: 'number', description: 'Pull request ID'},
                            message: {type: 'string', description: 'Reason for declining'}
                        },
                        required: ['repository', 'prId']
                    }
                },
                {
                    name: 'add_comment',
                    description: 'Add a comment to a pull request',
                    inputSchema: {
                        type: 'object',
                        properties: {
                            project: {type: 'string', description: 'Bitbucket project key'},
                            repository: {type: 'string', description: 'Repository slug'},
                            prId: {type: 'number', description: 'Pull request ID'},
                            text: {type: 'string', description: 'Comment text'},
                            parentId: {type: 'number', description: 'Parent comment ID for replies'}
                        },
                        required: ['repository', 'prId', 'text']
                    }
                },
                {
                    name: 'get_diff',
                    description: 'Get pull request diff',
                    inputSchema: {
                        type: 'object',
                        properties: {
                            project: {type: 'string', description: 'Bitbucket project key'},
                            repository: {type: 'string', description: 'Repository slug'},
                            prId: {type: 'number', description: 'Pull request ID'},
                            contextLines: {type: 'number', description: 'Number of context lines'}
                        },
                        required: ['repository', 'prId']
                    }
                },
                {
                    name: 'get_reviews',
                    description: 'Get pull request reviews',
                    inputSchema: {
                        type: 'object',
                        properties: {
                            project: {type: 'string', description: 'Bitbucket project key'},
                            repository: {type: 'string', description: 'Repository slug'},
                            prId: {type: 'number', description: 'Pull request ID'}
                        },
                        required: ['repository', 'prId']
                    }
                },
                {
                    name: 'bb_ls_workspaces',
                    description: 'Lists available workspaces (query: str opt). Use: View accessible workspaces.',
                    inputSchema: {
                        type: 'object',
                        properties: {
                            query: {
                                type: 'string',
                                description: 'Optional query string to filter workspaces by name',
                                nullable: true
                            },
                        },
                        required: [],
                    },
                },
                {
                    name: 'bb_ls_repos',
                    description: 'Lists repositories (workspaceSlug: str opt, projectKey: str opt, query: str opt, role: str opt). Use: Find repositories.',
                    inputSchema: {
                        type: 'object',
                        properties: {
                            workspaceSlug: {type: 'string', description: 'Slug of the workspace/project.'},
                            projectKey: {type: 'string', description: 'Key of the project.'},
                            query: {type: 'string', description: 'Filter repositories by name.'},
                            role: {
                                type: 'string',
                                description: 'Filter repositories by user role (e.g., REPO_READ, REPO_WRITE, REPO_ADMIN).'
                            }
                        },
                        required: []
                    }
                },
                {
                    name: 'bb_search',
                    description: 'Searches Bitbucket content (workspaceSlug: str req, query: str req, scope: str opt, language: str opt, extension: str opt). Use: Find code or PRs.',
                    inputSchema: {
                        type: 'object',
                        properties: {
                            workspaceSlug: {
                                type: 'string',
                                description: 'Slug of the workspace/project to search within.'
                            },
                            query: {type: 'string', description: 'The search query string.'},
                            scope: {
                                type: 'string',
                                description: 'Scope of the search (e.g., specific repository slug within the workspace).'
                            },
                            language: {
                                type: 'string',
                                description: 'Filter by programming language (e.g., java, python).'
                            },
                            extension: {type: 'string', description: 'Filter by file extension (e.g., xml, ts).'}
                        },
                        required: ['workspaceSlug', 'query']
                    }
                },
                {
                    name: 'bb_get_repo',
                    description: 'Gets repository details (workspaceSlug: str req, repoSlug: str req). Use: Access repo information.',
                    inputSchema: {
                        type: 'object',
                        properties: {
                            workspaceSlug: {type: 'string', description: 'Slug of the workspace/project.'},
                            repoSlug: {type: 'string', description: 'Slug of the repository.'}
                        },
                        required: ['workspaceSlug', 'repoSlug']
                    }
                },
                {
                    name: 'bb_get_file',
                    description: 'Gets file content (workspaceSlug: str req, repoSlug: str req, filePath: str req, revision: str opt). Use: View specific file.',
                    inputSchema: {
                        type: 'object',
                        properties: {
                            workspaceSlug: {type: 'string', description: 'Slug of the workspace/project.'},
                            repoSlug: {type: 'string', description: 'Slug of the repository.'},
                            filePath: {type: 'string', description: 'Full path to the file within the repository.'},
                            revision: {type: 'string', description: 'Optional revision (branch, tag, or commit hash).'}
                        },
                        required: ['workspaceSlug', 'repoSlug', 'filePath']
                    }
                },
                {
                    name: 'bb_add_branch',
                    description: 'Creates a branch (workspaceSlug: str req, repoSlug: str req, newBranchName: str req, sourceBranchOrCommit: str opt). Use: Create a feature branch.',
                    inputSchema: {
                        type: 'object',
                        properties: {
                            workspaceSlug: {type: 'string', description: 'Slug of the workspace/project.'},
                            repoSlug: {type: 'string', description: 'Slug of the repository.'},
                            newBranchName: {type: 'string', description: 'Name for the new branch.'},
                            sourceBranchOrCommit: {type: 'string', description: 'Optional source branch or commit ID.'}
                        },
                        required: ['workspaceSlug', 'repoSlug', 'newBranchName']
                    }
                },
                {
                    name: 'bb_add_pr_comment',
                    description: 'Adds a comment to a Pull Request, optionally as an inline comment. (workspaceSlug: str req, repoSlug: str req, prId: num req, content: str req, parentId: num opt, inline: obj opt). Use: Add feedback to PRs.',
                    inputSchema: {
                        type: 'object',
                        properties: {
                            workspaceSlug: {type: 'string', description: 'Slug of the workspace/project.'},
                            repoSlug: {type: 'string', description: 'Slug of the repository.'},
                            prId: {type: 'number', description: 'Numeric ID of the pull request.'},
                            content: {type: 'string', description: 'The text content of the comment.'},
                            parentId: {
                                type: 'number',
                                description: 'Optional ID of the parent comment if this is a reply.'
                            },
                            inline: {
                                type: 'object',
                                properties: {
                                    path: {type: 'string', description: 'Path to the file being commented on.'},
                                    line: {type: 'number', description: 'Line number for the comment anchor.'},
                                    lineType: {
                                        type: 'string',
                                        enum: ['ADDED', 'REMOVED', 'CONTEXT'],
                                        description: 'The type of the line being commented on.'
                                    },
                                    fileType: {
                                        type: 'string',
                                        enum: ['FROM', 'TO'],
                                        description: 'The side of the diff the comment is on.'
                                    }
                                },
                                required: ['path', 'line'],
                                description: 'Optional details for an inline comment on a specific line in a file.'
                            }
                        },
                        required: ['workspaceSlug', 'repoSlug', 'prId', 'content']
                    }
                },
                {
                    name: 'bb_list_branches',
                    description: 'Lists branches (workspaceSlug: str req, repoSlug: str req, query: str opt, sort: str opt). Use: View all branches.',
                    inputSchema: {
                        type: 'object',
                        properties: {
                            workspaceSlug: {type: 'string', description: 'Slug of the workspace/project.'},
                            repoSlug: {type: 'string', description: 'Slug of the repository.'},
                            query: {type: 'string', description: 'Optional filter text for branch names.'},
                            sort: {type: 'string', description: 'Optional sort order (e.g., MODIFICATION, NAME).'}
                        },
                        required: ['workspaceSlug', 'repoSlug']
                    }
                }
            ]
        }));

        this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
            try {
                logger.info(`[CallToolRequestSchema] Received tool call. Name: '${request.params.name}'. Args: ${JSON.stringify(request.params.arguments ?? {})}. DefaultProject: '${this.api.config.defaultProject}'`);
                const args = request.params.arguments ?? {};

                switch (request.params.name) {
                    case 'create_pull_request': {
                        if (!this.isPullRequestInput(args)) {
                            throw new McpError(
                                ErrorCode.InvalidParams,
                                'Invalid pull request input parameters'
                            );
                        }
                        return await this.api.createPullRequest(args);
                    }
                    case 'get_pull_request': {
                        const pullRequestParams: PullRequestParams = {
                            project: (args.project as string) ?? this.api.config.defaultProject,
                            repository: args.repository as string,
                            prId: args.prId as number
                        };
                        if (!pullRequestParams.project) {
                            throw new McpError(ErrorCode.InvalidParams, 'Project must be provided for get_pull_request (as args.project or BITBUCKET_DEFAULT_PROJECT)');
                        }
                        return await this.api.getPullRequest(pullRequestParams);
                    }
                    case 'merge_pull_request': {
                        const pullRequestParams: PullRequestParams = {
                            project: (args.project as string) ?? this.api.config.defaultProject,
                            repository: args.repository as string,
                            prId: args.prId as number
                        };
                        if (!pullRequestParams.project) {
                            throw new McpError(ErrorCode.InvalidParams, 'Project must be provided for merge_pull_request (as args.project or BITBUCKET_DEFAULT_PROJECT)');
                        }
                        return await this.api.mergePullRequest(pullRequestParams, {
                            message: args.message as string,
                            strategy: args.strategy as 'merge-commit' | 'squash' | 'fast-forward'
                        });
                    }
                    case 'decline_pull_request': {
                        const pullRequestParams: PullRequestParams = {
                            project: (args.project as string) ?? this.api.config.defaultProject,
                            repository: args.repository as string,
                            prId: args.prId as number
                        };
                        if (!pullRequestParams.project) {
                            throw new McpError(ErrorCode.InvalidParams, 'Project must be provided for decline_pull_request (as args.project or BITBUCKET_DEFAULT_PROJECT)');
                        }
                        return await this.api.declinePullRequest(pullRequestParams, args.message as string);
                    }
                    case 'add_comment': {
                        const pullRequestParams: PullRequestParams = {
                            project: (args.project as string) ?? this.api.config.defaultProject,
                            repository: args.repository as string,
                            prId: args.prId as number
                        };
                        if (!pullRequestParams.project) {
                            throw new McpError(ErrorCode.InvalidParams, 'Project must be provided for add_comment (as args.project or BITBUCKET_DEFAULT_PROJECT)');
                        }
                        return await this.api.addComment(pullRequestParams, {
                            text: args.text as string,
                            parentId: args.parentId as number
                        });
                    }
                    case 'get_diff': {
                        const pullRequestParams: PullRequestParams = {
                            project: (args.project as string) ?? this.api.config.defaultProject,
                            repository: args.repository as string,
                            prId: args.prId as number
                        };
                        if (!pullRequestParams.project) {
                            throw new McpError(ErrorCode.InvalidParams, 'Project must be provided for get_diff (as args.project or BITBUCKET_DEFAULT_PROJECT)');
                        }
                        return await this.api.getDiff(pullRequestParams, args.contextLines as number);
                    }
                    case 'get_reviews': {
                        const pullRequestParams: PullRequestParams = {
                            project: (args.project as string) ?? this.api.config.defaultProject,
                            repository: args.repository as string,
                            prId: args.prId as number
                        };
                        if (!pullRequestParams.project) {
                            throw new McpError(ErrorCode.InvalidParams, 'Project must be provided for get_reviews (as args.project or BITBUCKET_DEFAULT_PROJECT)');
                        }
                        return await this.api.getReviews(pullRequestParams);
                    }
                    case 'bb_ls_workspaces': {
                        // This tool doesn't need the project context from pullRequestParams
                        return await this.api.listWorkspaces({
                            query: args.query as string | undefined
                        });
                    }
                    case 'bb_ls_repos': {
                        // This tool doesn't need the project context from pullRequestParams for global search
                        // but uses projectKey or workspaceSlug if provided in args.
                        return await this.api.listRepositories({
                            workspaceSlug: args.workspaceSlug as string | undefined,
                            projectKey: args.projectKey as string | undefined,
                            query: args.query as string | undefined,
                            role: args.role as string | undefined,
                        });
                    }
                    case 'bb_search': {
                        return await this.api.searchContent({
                            workspaceSlug: args.workspaceSlug as string,
                            query: args.query as string,
                            scope: args.scope as string | undefined,
                            language: args.language as string | undefined,
                            extension: args.extension as string | undefined,
                        });
                    }
                    case 'bb_get_repo': {
                        const validatedArgs = GetRepoInputSchema.safeParse(args);
                        if (!validatedArgs.success) {
                            throw new McpError(ErrorCode.InvalidParams, `Invalid input for bb_get_repo: ${validatedArgs.error.message}`);
                        }
                        // The projectKey (workspaceSlug) is required by the schema and used in the method.
                        return await this.api.bb_get_repo(validatedArgs.data);
                    }
                    case 'bb_get_file': {
                        const validatedArgs = GetFileInputSchema.safeParse(args);
                        if (!validatedArgs.success) {
                            throw new McpError(ErrorCode.InvalidParams, `Invalid input for bb_get_file: ${validatedArgs.error.message}`);
                        }
                        return await this.api.bb_get_file(validatedArgs.data);
                    }
                    case 'bb_add_branch': {
                        const validatedArgs = AddBranchInputSchema.safeParse(args);
                        if (!validatedArgs.success) {
                            throw new McpError(ErrorCode.InvalidParams, `Invalid input for bb_add_branch: ${validatedArgs.error.message}`);
                        }
                        return await this.api.bb_add_branch(validatedArgs.data);
                    }
                    case 'bb_add_pr_comment': {
                        const validatedArgs = AddPrCommentInputSchema.safeParse(args);
                        if (!validatedArgs.success) {
                            throw new McpError(ErrorCode.InvalidParams, `Invalid input for bb_add_pr_comment: ${validatedArgs.error.message}`);
                        }
                        return await this.api.bb_add_pr_comment(validatedArgs.data);
                    }
                    case 'bb_list_branches': {
                        const validatedArgs = ListBranchesInputSchema.safeParse(args);
                        if (!validatedArgs.success) {
                            throw new McpError(ErrorCode.InvalidParams, `Invalid input for bb_list_branches: ${validatedArgs.error.message}`);
                        }
                        return await this.api.bb_list_branches(validatedArgs.data);
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