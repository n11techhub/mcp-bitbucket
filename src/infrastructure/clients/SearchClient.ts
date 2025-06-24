import axios, { AxiosInstance } from "axios";
import { BitbucketConfig } from "../config/BitbucketConfig.js";
import { injectable, inject } from 'inversify';
import { ErrorCode, McpError } from "@modelcontextprotocol/sdk/types.js";
import winston from 'winston';
import { SearchContentInput } from '../../domain/contracts/input/SearchContentInput.js';
import { ISearchClient } from '../../domain/repository/ISearchClient.js';
import { TYPES } from '../types.js';

@injectable()
export class SearchClient implements ISearchClient {
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

    public async searchBitbucketContent(input: SearchContentInput): Promise<any> {
        const { workspaceSlug, query, scope, extension, language } = input;
        const projectKey = workspaceSlug;

        const searchUrl = `${this.api.defaults.baseURL}/search/codes`;

        const payload: any = {
            query,
            limits: {
                primary: 10,
                secondary: 5
            }
        };

        if (scope) {
            payload.scope = { 
                type: 'REPOSITORY',
                resource: { project: { key: projectKey }, slug: scope } 
            };
        }

        const advancedQuery: string[] = [];
        if (extension) {
            advancedQuery.push(`ext:${extension}`);
        }
        if (language) {
            advancedQuery.push(`lang:${language}`);
        }

        if (advancedQuery.length > 0) {
            payload.advancedQuery = advancedQuery.join(' ');
        }

        try {
            this.logger.info(`Searching content with payload: ${JSON.stringify(payload)}`);
            const response = await this.api.post(searchUrl, payload);
            return {
                content: [{ type: 'text', text: JSON.stringify(response.data, null, 2) }]
            };
        } catch (error: any) {
            this.logger.error(`Error searching content (projectKey: ${projectKey}, query: ${query}):`, error.response?.data || error.message);
            if (axios.isAxiosError(error) && error.response) {
                const errorMessage = error.response.data.errors?.[0]?.message ?? error.response.data.message ?? error.message;
                throw new McpError(
                    ErrorCode.InternalError,
                    `Bitbucket API error: ${errorMessage}`
                );
            }
            throw new McpError(ErrorCode.InternalError, `Failed to search content: ${error.message}`);
        }
    }
}
