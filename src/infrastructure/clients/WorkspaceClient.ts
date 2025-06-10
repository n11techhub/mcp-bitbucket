import axios, { AxiosInstance } from "axios";
import { BitbucketConfig } from "../config/BitbucketConfig.js";
import { ListWorkspacesInput } from "../input/ListWorkspacesInput.js";
import { injectable, inject } from 'inversify';
import { ErrorCode, McpError } from "@modelcontextprotocol/sdk/types.js";
import winston from 'winston';
import { IWorkspaceClient } from '../../application/ports/IWorkspaceClient.js';
// BitbucketConfig is already imported at the top of the file
import { TYPES } from '../types.js';

@injectable()
export class WorkspaceClient implements IWorkspaceClient {
    private readonly api: AxiosInstance;
    private readonly logger: winston.Logger;

    constructor(
        @inject(TYPES.BitbucketConfig) config: BitbucketConfig, 
        @inject(TYPES.Logger) logger: winston.Logger
    ) {
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

    public async listBitbucketWorkspaces(input: ListWorkspacesInput = {}): Promise<any> {
        const { query } = input;
        const params: any = {};
        if (query) {
            params.name = query;
        }

        try {
            this.logger.info(`Listing workspaces (projects) with params: ${JSON.stringify(params)}`);
            const response = await this.api.get('/projects', { params });
            return {
                content: [{ type: 'text', text: JSON.stringify(response.data, null, 2) }]
            };
        } catch (error: any) {
            this.logger.error(`Error listing workspaces (projects):`, error.response?.data || error.message);
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
}
