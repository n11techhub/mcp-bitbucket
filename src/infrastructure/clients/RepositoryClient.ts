import axios, { AxiosInstance } from "axios";
import { BitbucketConfig } from "../config/BitbucketConfig";
import { ListRepositoriesInput } from "../input/ListRepositoriesInput";
import { ListBranchesInput } from "../input/ListBranchesInput";
import { AddBranchInput } from "../input/AddBranchInput";
import { GetFileInput } from "../input/GetFileInput";
import { GetRepoInput } from "../input/GetRepoInput";
import { ErrorCode, McpError } from "@modelcontextprotocol/sdk/types.js";
import winston from 'winston';
import { IRepositoryClient } from '../../application/ports/IRepositoryClient';

export class RepositoryClient implements IRepositoryClient {
    private readonly api: AxiosInstance;
    private readonly logger: winston.Logger;

    constructor(config: BitbucketConfig, logger: winston.Logger) {
        this.logger = logger;
        this.api = axios.create({
            baseURL: `${config.baseUrl}/rest/api/1.0`,
            headers: config.token
                ? { Authorization: `Bearer ${config.token}` }
                : {},
            auth: config.username && config.password
                ? { username: config.username, password: config.password }
                : undefined,
        });
    }

    public async listBitbucketRepositories(input: ListRepositoriesInput = {}): Promise<any> {
        const { workspaceSlug, query, role } = input;
        const projectKey = workspaceSlug || this.getDefaultProjectKey();

        if (!projectKey) {
            throw new McpError(
                ErrorCode.InvalidParams,
                'Either workspaceSlug or a default project must be provided.'
            );
        }

        const params: any = {};
        if (query) {
            params.name = query;
        }
        if (role) {
            params.permission = role;
        }

        try {
            this.logger.info(`Listing repositories with projectKey: ${projectKey}, params: ${JSON.stringify(params)}`);
            const response = await this.api.get(`/projects/${projectKey}/repos`, { params });
            return {
                content: [{ type: 'text', text: JSON.stringify(response.data, null, 2) }]
            };
        } catch (error: any) {
            this.logger.error(`Error listing repositories (projectKey: ${projectKey}):`, error.response?.data || error.message);
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

    public async listBitbucketRepositoryBranches(input: ListBranchesInput): Promise<any> {
        const { workspaceSlug, repoSlug, query, sort } = input;
        const projectKey = workspaceSlug;

        const params: any = {};
        if (query) {
            params.filterText = query;
        }
        if (sort) {
            params.orderBy = sort;
        }

        try {
            this.logger.info(`Listing branches with projectKey: ${projectKey}, repoSlug: ${repoSlug}, params: ${JSON.stringify(params)}`);
            const response = await this.api.get(
                `/projects/${projectKey}/repos/${repoSlug}/branches`,
                { params }
            );
            return {
                content: [{ type: 'text', text: JSON.stringify(response.data, null, 2) }]
            };
        } catch (error: any) {
            this.logger.error(`Error listing branches (projectKey: ${projectKey}, repoSlug: ${repoSlug}):`, error.response?.data || error.message);
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

    public async createBitbucketBranch(input: AddBranchInput): Promise<any> {
        const { workspaceSlug, repoSlug, newBranchName, sourceBranchOrCommit } = input;
        const projectKey = workspaceSlug;

        try {
            this.logger.info(`Creating branch with projectKey: ${projectKey}, repoSlug: ${repoSlug}, newBranchName: ${newBranchName}, source: ${sourceBranchOrCommit}`);
            const response = await this.api.post(
                `/projects/${projectKey}/repos/${repoSlug}/branches`,
                {
                    name: newBranchName,
                    startPoint: sourceBranchOrCommit || 'main' // Default to main if not specified
                }
            );
            return {
                content: [{ type: 'text', text: JSON.stringify(response.data, null, 2) }]
            };
        } catch (error: any) {
            this.logger.error(`Error creating branch (projectKey: ${projectKey}, repoSlug: ${repoSlug}, newBranchName: ${newBranchName}, source: ${sourceBranchOrCommit}):`, error.response?.data || error.message);
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

    public async getBitbucketFileContent(input: GetFileInput): Promise<any> {
        const { workspaceSlug, repoSlug, filePath, revision } = input;
        const projectKey = workspaceSlug; // Assuming workspaceSlug maps to projectKey
        let apiUrl = `/projects/${projectKey}/repos/${repoSlug}/raw/${filePath.startsWith('/') ? filePath.substring(1) : filePath}`;

        const params: any = {};
        if (revision) {
            params.at = revision;
        }

        try {
            this.logger.info(`Getting file content with apiUrl: ${apiUrl}, params: ${JSON.stringify(params)}`);
            const response = await this.api.get(apiUrl, { params, responseType: 'text' });
            return {
                content: [{ type: 'text', text: response.data }] // response.data should be the raw file content as string
            };
        } catch (error: any) {
            this.logger.error(`Error getting file content (projectKey: ${projectKey}, repoSlug: ${repoSlug}, filePath: ${filePath}, revision: ${revision}):`, error.response?.data || error.message);
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

    public async getBitbucketRepositoryDetails(input: GetRepoInput): Promise<any> {
        const { workspaceSlug, repoSlug } = input;
        const projectKey = workspaceSlug;
        const apiUrl = `/projects/${projectKey}/repos/${repoSlug}`;

        try {
            this.logger.info(`Getting repository details with apiUrl: ${apiUrl}`);
            const response = await this.api.get(apiUrl);
            return {
                content: [{ type: 'text', text: JSON.stringify(response.data, null, 2) }]
            };
        } catch (error: any) {
            this.logger.error(`Error getting repository (projectKey: ${projectKey}, repoSlug: ${repoSlug}):`, error.response?.data || error.message);
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

    private getDefaultProjectKey(): string | undefined {
        // This method is a placeholder. In a real scenario, you would get this from the config.
        return undefined;
    }
}
