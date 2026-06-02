import axios from "axios";
import { injectable, inject } from 'inversify';
import { ErrorCode, McpError } from "@modelcontextprotocol/sdk/types.js";
import winston from 'winston';
import { ListWorkspacesInput } from '../../domain/contracts/input/index.js';
import { IWorkspaceClient } from '../../domain/gateway/IWorkspaceClient.js';
import {Types} from "../../application/Types.js";
import {Configuration} from "../configuration/Configuration.js";
import {BaseClient} from "./BaseClient.js";

@injectable()
export class WorkspaceClient extends BaseClient implements IWorkspaceClient {
    constructor(
        @inject(Types.Configuration) config: Configuration,
        @inject(Types.Logger) logger: winston.Logger
    ) {
        super(config, logger);
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
            this.logger.error(`Error listing workspaces (projects):`, error.response?.data ?? error.message);
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
