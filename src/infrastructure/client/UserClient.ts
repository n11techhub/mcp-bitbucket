import { inject, injectable } from "inversify";
import axios from "axios";
import winston from "winston";
import { IUserClient } from '../../domain/gateway/IUserClient.js';
import { GetUserInputType } from '../../domain/contracts/schemas/index.js';
import { ErrorCode, McpError } from "@modelcontextprotocol/sdk/types.js";
import {Types} from "../../application/Types.js";
import {Configuration} from "../configuration/Configuration.js";
import {BaseClient} from "./BaseClient.js";

@injectable()
export class UserClient extends BaseClient implements IUserClient {
    constructor(
        @inject(Types.Configuration) config: Configuration,
        @inject(Types.Logger) logger: winston.Logger
    ) {
        super(config, logger);
    }

    async getBitbucketUserDetails(input: GetUserInputType): Promise<any> {
        const { username: userSlug } = input;

        if (!userSlug) {
            const errorMessage = "User slug is required to fetch user details.";
            this.logger.error(errorMessage);
            throw new McpError(ErrorCode.InvalidParams, errorMessage);
        }

        try {
            this.logger.info(`Fetching Bitbucket user details for userSlug: ${userSlug}`);
            const response = await this.api.get(`/users/${userSlug}`);
            
            this.logger.info(`Successfully fetched user details for userSlug: ${userSlug}`);
            return {
                content: [{ type: 'text', text: JSON.stringify(response.data, null, 2) }]
            };
        } catch (error: any) {
            this.logger.error(`Error fetching Bitbucket user details for userSlug ${userSlug}: ${(error.response?.data?.errors?.[0]?.message ?? error.response?.data?.message) ?? error.message}`, error.stack);
            if (axios.isAxiosError(error) && error.response) {
                const apiErrorMessage = error.response.data?.errors?.[0]?.message ?? error.response.data?.message ?? `Status ${error.response.status}`;
                throw new McpError(
                    ErrorCode.InternalError, 
                    `Bitbucket API error while fetching user details for ${userSlug}: ${apiErrorMessage}`
                );
            }
            throw new McpError(ErrorCode.InternalError, `Failed to fetch Bitbucket user details for ${userSlug}: ${error.message}`);
        }
    }
}