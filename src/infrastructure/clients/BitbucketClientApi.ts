import axios, {AxiosInstance} from "axios";
import {BitbucketConfig} from "../config/BitbucketConfig";
import {PullRequestInput} from "../input/PullRequestInput";
import {PullRequestParams} from "../input/PullRequestParams";
import {MergeOption} from "../option/MergeOption";
import {CommentOption} from "../option/CommentOption";
import {BitbucketActivity} from "../filter/BitbucketActivity";
import {ListRepositoriesInput} from "../input/ListRepositoriesInput";
import {ListWorkspacesInput} from "../input/ListWorkspacesInput";
import {SearchContentInput} from "../input/SearchContentInput";
import {ListBranchesInput} from "../input/ListBranchesInput";
import {AddPrCommentInput} from "../input/AddPrCommentInput";
import {AddBranchInput} from "../input/AddBranchInput";
import {GetFileInput} from "../input/GetFileInput";
import {GetRepoInput} from "../input/GetRepoInput";
import winston from "winston";
import {ErrorCode, McpError} from "@modelcontextprotocol/sdk/types.js";
import { IBitbucketClient } from '../../application/ports/IBitbucketClient.js';

const logger = winston.createLogger({
    level: 'info',
    format: winston.format.json(),
    transports: [
        new winston.transports.File({filename: 'bitbucket.log'})
    ]
});

export class BitbucketClientApi implements IBitbucketClient {
    private readonly api: AxiosInstance;
    readonly config: BitbucketConfig;

    constructor() {
        this.config = {
            baseUrl: process.env.BITBUCKET_URL ?? '',
            token: process.env.BITBUCKET_TOKEN,
            username: process.env.BITBUCKET_USERNAME,
            password: process.env.BITBUCKET_PASSWORD,
            defaultProject: process.env.BITBUCKET_DEFAULT_PROJECT
        };

        if (!this.config.baseUrl) {
            throw new Error('BITBUCKET_URL is required');
        }

        if (!this.config.token && !(this.config.username && this.config.password)) {
            throw new Error('Either BITBUCKET_TOKEN or BITBUCKET_USERNAME/PASSWORD is required');
        }

        this.api = axios.create({
            baseURL: `${this.config.baseUrl}/rest/api/1.0`,
            headers: this.config.token
                ? {Authorization: `Bearer ${this.config.token}`}
                : {},
            auth: this.config.username && this.config.password
                ? {username: this.config.username, password: this.config.password}
                : undefined,
        });
    }

    public async createPullRequest(input: PullRequestInput) {
        const response = await this.api.post(
            `/projects/${input.project}/repos/${input.repository}/pull-requests`,
            {
                title: input.title,
                description: input.description,
                fromRef: {
                    id: `refs/heads/${input.sourceBranch}`,
                    repository: {
                        slug: input.repository,
                        project: {key: input.project}
                    }
                },
                toRef: {
                    id: `refs/heads/${input.targetBranch}`,
                    repository: {
                        slug: input.repository,
                        project: {key: input.project}
                    }
                },
                reviewers: input.reviewers?.map(username => ({user: {name: username}}))
            }
        );

        return {
            content: [{type: 'text', text: JSON.stringify(response.data, null, 2)}]
        };
    }

    public async getPullRequest(params: PullRequestParams) {
        const {project, repository, prId} = params;
        const response = await this.api.get(
            `/projects/${project}/repos/${repository}/pull-requests/${prId}`
        );

        return {
            content: [{type: 'text', text: JSON.stringify(response.data, null, 2)}]
        };
    }

    public async mergePullRequest(params: PullRequestParams, options: MergeOption = {}) {
        const {project, repository, prId} = params;
        const {message, strategy = 'merge-commit'} = options;

        const response = await this.api.post(
            `/projects/${project}/repos/${repository}/pull-requests/${prId}/merge`,
            {
                version: -1,
                message,
                strategy
            }
        );

        return {
            content: [{type: 'text', text: JSON.stringify(response.data, null, 2)}]
        };
    }

    public async declinePullRequest(params: PullRequestParams, message?: string) {
        const {project, repository, prId} = params;
        const response = await this.api.post(
            `/projects/${project}/repos/${repository}/pull-requests/${prId}/decline`,
            {
                version: -1,
                message
            }
        );

        return {
            content: [{type: 'text', text: JSON.stringify(response.data, null, 2)}]
        };
    }

    public async addComment(params: PullRequestParams, options: CommentOption) {
        const {project, repository, prId} = params;
        const {text, parentId} = options;

        const response = await this.api.post(
            `/projects/${project}/repos/${repository}/pull-requests/${prId}/comments`,
            {
                text,
                parent: parentId ? {id: parentId} : undefined
            }
        );

        return {
            content: [{type: 'text', text: JSON.stringify(response.data, null, 2)}]
        };
    }

    public async getDiff(params: PullRequestParams, contextLines: number = 10) {
        const {project, repository, prId} = params;
        const response = await this.api.get(
            `/projects/${project}/repos/${repository}/pull-requests/${prId}/diff`,
            {
                params: {contextLines},
                headers: {Accept: 'text/plain'}
            }
        );

        return {
            content: [{type: 'text', text: response.data}]
        };
    }

    public async getReviews(params: PullRequestParams) {
        const {project, repository, prId} = params;
        const response = await this.api.get(
            `/projects/${project}/repos/${repository}/pull-requests/${prId}/activities`
        );

        const reviews = response.data.values.filter(
            (activity: BitbucketActivity) => activity.action === 'APPROVED' || activity.action === 'REVIEWED'
        );

        return {
            content: [{type: 'text', text: JSON.stringify(reviews, null, 2)}]
        };
    }

    public async getRepo(input: GetRepoInput) {
        const { workspaceSlug, repoSlug } = input;
        const projectKey = workspaceSlug; // Assuming workspaceSlug maps to projectKey for Bitbucket Server
        const apiUrl = `/projects/${projectKey}/repos/${repoSlug}`;

        try {
            logger.info(`Getting repository details for projectKey: ${projectKey}, repoSlug: ${repoSlug}`);
            const response = await this.api.get(apiUrl);
            return {
                content: [{ type: 'text', text: JSON.stringify(response.data, null, 2) }]
            };
        } catch (error: any) {
            logger.error(`Error getting repository (projectKey: ${projectKey}, repoSlug: ${repoSlug}):`, error.response?.data || error.message);
            if (axios.isAxiosError(error) && error.response) {
                const errorMessage = error.response.data.errors?.[0]?.message ?? error.response.data.message ?? error.message;
                throw new McpError(
                    ErrorCode.InternalError,
                    `Bitbucket API error while getting repository: ${errorMessage}`
                );
            }
            throw new McpError(ErrorCode.InternalError, `Failed to get repository: ${error.message}`);
        }
    }

    public async listRepositories(input: ListRepositoriesInput = {}) {
        const {workspaceSlug, projectKey, query, role} = input;
        let apiUrl = '';
        const params: { name?: string; permission?: string; limit?: number } = {limit: 100}; // Default limit

        const effectiveProjectKey = projectKey || workspaceSlug;

        if (effectiveProjectKey) {
            apiUrl = `/projects/${effectiveProjectKey}/repos`;
        } else {
            apiUrl = '/repos'; // List repositories across all projects user has access to
        }

        if (query) {
            params.name = query;
        }
        if (role) {
            params.permission = role;
        }

        try {
            logger.info(`Listing repositories with apiUrl: ${apiUrl}, params: ${JSON.stringify(params)}`);
            const response = await this.api.get(apiUrl, {params});
            return {
                content: [{type: 'text', text: JSON.stringify(response.data, null, 2)}]
            };
        } catch (error: any) {
            logger.error(`Error listing repositories (projectKey: ${effectiveProjectKey}, query: ${query}, role: ${role}):`, error.response?.data || error.message);
            if (axios.isAxiosError(error) && error.response) {
                const errorMessage = error.response.data.errors?.[0]?.message ?? error.response.data.message ?? error.message;
                throw new McpError(
                    ErrorCode.InternalError,
                    `Bitbucket API error: ${errorMessage}`
                );
            }
            throw new McpError(ErrorCode.InternalError, `Failed to list repositories: ${error.message}`);
        }
    }

    public async listWorkspaces(input: ListWorkspacesInput = {}) {
        const {query} = input;
        let apiUrl = '/projects';
        const params: { name?: string, limit?: number } = {limit: 1000}; // Default limit, adjust as needed

        if (query) {
            params.name = query;
        }

        try {
            const response = await this.api.get(apiUrl, {params});
            return {
                content: [{type: 'text', text: JSON.stringify(response.data, null, 2)}]
            };
        } catch (error: any) {
            logger.error(`Error listing workspaces (query: ${query}):`, error.response?.data || error.message);
            if (axios.isAxiosError(error) && error.response) {
                const errorMessage = error.response.data.errors?.[0]?.message ?? error.response.data.message ?? error.message;
                throw new McpError(
                    ErrorCode.InternalError,
                    `Bitbucket API error: ${errorMessage}`
                );
            }
            throw new McpError(ErrorCode.InternalError, `Failed to list workspaces: ${error.message}`);
        }
    }

    public async searchContent(input: SearchContentInput) {
        const {workspaceSlug, query, scope, language, extension} = input;
        const apiUrl = '/rest/search/latest/search';
        const params: any = {
            type: ['CODE', 'PULLREQUEST'], // Default search types
            projectKey: workspaceSlug,
            limit: 25, // Default limit for search results
        };

        let searchQuery = query;
        if (language) {
            searchQuery += ` lang:${language}`;
        }
        if (extension) {
            searchQuery += ` ext:${extension}`;
        }
        params.q = searchQuery;

        if (scope) {
            params.repositoryKey = scope;
        }

        try {
            logger.info(`Searching content with apiUrl: ${apiUrl}, params: ${JSON.stringify(params)}`);
            const response = await this.api.get(apiUrl, {params});
            return {
                content: [{type: 'text', text: JSON.stringify(response.data, null, 2)}]
            };
        } catch (error: any) {
            logger.error(`Error searching content (workspaceSlug: ${workspaceSlug}, query: ${params.q}, scope: ${scope}):`, error.response?.data || error.message);
            if (axios.isAxiosError(error) && error.response) {
                const errorMessage = error.response.data.errors?.[0]?.message ?? error.response.data.message ?? error.message;
                throw new McpError(
                    ErrorCode.InternalError,
                    `Bitbucket API error during search: ${errorMessage}`
                );
            }
            throw new McpError(ErrorCode.InternalError, `Failed to search content: ${error.message}`);
        }
    }

    public async bb_list_branches(input: ListBranchesInput) {
        const {workspaceSlug, repoSlug, query, sort} = input;
        const projectKey = workspaceSlug; // Assuming workspaceSlug maps to projectKey
        const apiUrl = `/projects/${projectKey}/repos/${repoSlug}/branches`;

        const params: any = {limit: 100}; // Default limit, Bitbucket API is paginated

        if (query) {
            params.filterText = query;
        }
        if (sort) {
            params.orderBy = sort;
        }

        try {
            logger.info(`Listing branches with apiUrl: ${apiUrl}, params: ${JSON.stringify(params)}`);
            const response = await this.api.get(apiUrl, {params});
            return {
                content: [{type: 'text', text: JSON.stringify(response.data, null, 2)}]
            };
        } catch (error: any) {
            logger.error(`Error listing branches (projectKey: ${projectKey}, repoSlug: ${repoSlug}, query: ${query}, sort: ${sort}):`, error.response?.data || error.message);
            if (axios.isAxiosError(error) && error.response) {
                const errorMessage = error.response.data.errors?.[0]?.message ?? error.response.data.message ?? error.message;
                throw new McpError(
                    ErrorCode.InternalError,
                    `Bitbucket API error: ${errorMessage}`
                );
            }
            throw new McpError(ErrorCode.InternalError, `Failed to list branches: ${error.message}`);
        }
    }

    public async bb_add_pr_comment(input: AddPrCommentInput) {
        const {workspaceSlug, repoSlug, prId, content, parentId, inline} = input;
        const projectKey = workspaceSlug; // Assuming workspaceSlug maps to projectKey
        const apiUrl = `/projects/${projectKey}/repos/${repoSlug}/pull-requests/${prId}/comments`;

        const requestBody: any = {text: content};

        if (parentId) {
            requestBody.parent = {id: parentId};
        }

        if (inline) {
            requestBody.anchor = {
                path: inline.path,
                line: inline.line,
            };
            if (inline.lineType) {
                requestBody.anchor.lineType = inline.lineType;
            }
            if (inline.fileType) {
                requestBody.anchor.fileType = inline.fileType;
            }
        }

        try {
            logger.info(`Adding PR comment with apiUrl: ${apiUrl}, body: ${JSON.stringify(requestBody)}`);
            const response = await this.api.post(apiUrl, requestBody);
            return {
                content: [{type: 'text', text: JSON.stringify(response.data, null, 2)}]
            };
        } catch (error: any) {
            logger.error(`Error adding PR comment (projectKey: ${projectKey}, repoSlug: ${repoSlug}, prId: ${prId}):`, error.response?.data || error.message);
            if (axios.isAxiosError(error) && error.response) {
                const errorMessage = error.response.data.errors?.[0]?.message ?? error.response.data.message ?? error.message;
                throw new McpError(
                    ErrorCode.InternalError,
                    `Bitbucket API error: ${errorMessage}`
                );
            }
            throw new McpError(ErrorCode.InternalError, `Failed to add PR comment: ${error.message}`);
        }
    }

    public async bb_add_branch(input: AddBranchInput) {
        const {workspaceSlug, repoSlug, newBranchName, sourceBranchOrCommit} = input;
        const projectKey = workspaceSlug; // Assuming workspaceSlug maps to projectKey
        const apiUrl = `/projects/${projectKey}/repos/${repoSlug}/branches`;

        const requestBody: { name: string; startPoint?: string } = {
            name: newBranchName,
        };

        if (sourceBranchOrCommit) {
            requestBody.startPoint = sourceBranchOrCommit;
        }

        try {
            logger.info(`Creating branch with apiUrl: ${apiUrl}, body: ${JSON.stringify(requestBody)}`);
            const response = await this.api.post(apiUrl, requestBody);
            return {
                content: [{type: 'text', text: JSON.stringify(response.data, null, 2)}]
            };
        } catch (error: any) {
            logger.error(`Error creating branch (projectKey: ${projectKey}, repoSlug: ${repoSlug}, newBranchName: ${newBranchName}, source: ${sourceBranchOrCommit}):`, error.response?.data || error.message);
            if (axios.isAxiosError(error) && error.response) {
                const errorMessage = error.response.data.errors?.[0]?.message ?? error.response.data.message ?? error.message;
                throw new McpError(
                    ErrorCode.InternalError,
                    `Bitbucket API error: ${errorMessage}`
                );
            }
            throw new McpError(ErrorCode.InternalError, `Failed to create branch: ${error.message}`);
        }
    }

    public async bb_get_file(input: GetFileInput) {
        const {workspaceSlug, repoSlug, filePath, revision} = input;
        const projectKey = workspaceSlug; // Assuming workspaceSlug maps to projectKey
        let apiUrl = `/projects/${projectKey}/repos/${repoSlug}/raw/${filePath.startsWith('/') ? filePath.substring(1) : filePath}`;

        const params: any = {};
        if (revision) {
            params.at = revision;
        }

        try {
            logger.info(`Getting file content with apiUrl: ${apiUrl}, params: ${JSON.stringify(params)}`);
            const response = await this.api.get(apiUrl, {params, responseType: 'text'});
            return {
                content: [{type: 'text', text: response.data}] // response.data should be the raw file content as string
            };
        } catch (error: any) {
            logger.error(`Error getting file content (projectKey: ${projectKey}, repoSlug: ${repoSlug}, filePath: ${filePath}, revision: ${revision}):`, error.response?.data || error.message);
            if (axios.isAxiosError(error) && error.response) {
                let errorMessage = error.message;
                if (typeof error.response.data === 'string') {
                    errorMessage = error.response.data;
                } else if (error.response.data?.errors?.[0]?.message) {
                    errorMessage = error.response.data.errors[0].message;
                } else if (error.response.data?.message) {
                    errorMessage = error.response.data.message;
                }
                throw new McpError(
                    ErrorCode.InternalError,
                    `Bitbucket API error: ${errorMessage}`
                );
            }
            throw new McpError(ErrorCode.InternalError, `Failed to get file content: ${error.message}`);
        }
    }

    public async bb_get_repo(input: GetRepoInput) {
        const {workspaceSlug, repoSlug} = input;
        const projectKey = workspaceSlug;
        const apiUrl = `/projects/${projectKey}/repos/${repoSlug}`;

        try {
            logger.info(`Getting repository details with apiUrl: ${apiUrl}`);
            const response = await this.api.get(apiUrl);
            return {
                content: [{type: 'text', text: JSON.stringify(response.data, null, 2)}]
            };
        } catch (error: any) {
            logger.error(`Error getting repository (projectKey: ${projectKey}, repoSlug: ${repoSlug}):`, error.response?.data || error.message);
            if (axios.isAxiosError(error) && error.response) {
                const errorMessage = error.response.data.errors?.[0]?.message ?? error.response.data.message ?? error.message;
                throw new McpError(
                    ErrorCode.InternalError,
                    `Bitbucket API error: ${errorMessage}`
                );
            }
            throw new McpError(ErrorCode.InternalError, `Failed to get repository: ${error.message}`);
        }
    }

    public getDefaultProjectKey(): string | undefined {
        return this.config.defaultProject;
    }
}