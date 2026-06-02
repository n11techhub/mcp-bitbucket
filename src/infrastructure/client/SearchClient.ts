import axios from "axios";
import { injectable, inject } from 'inversify';
import { ErrorCode, McpError } from "@modelcontextprotocol/sdk/types.js";
import winston from 'winston';
import { SearchContentInput } from '../../domain/contracts/input/index.js';
import { ISearchClient } from '../../domain/gateway/ISearchClient.js';
import {Types} from "../../application/Types.js";
import {Configuration} from "../configuration/Configuration.js";
import {BaseClient} from "./BaseClient.js";

@injectable()
export class SearchClient extends BaseClient implements ISearchClient {
    constructor(
        @inject(Types.Configuration) config: Configuration,
        @inject(Types.Logger) logger: winston.Logger
    ) {
        super(config, logger);
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
            this.logger.error(`Error searching content (projectKey: ${projectKey}, query: ${query}):`, error.response?.data ?? error.message);
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
