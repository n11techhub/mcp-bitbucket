import { inject, injectable } from "inversify";
import axios, {AxiosInstance} from "axios";
import winston from "winston";
import {TYPES} from "../types.js";
import {BitbucketConfig} from "../config/BitbucketConfig.js";
import { IUserClient } from '../../domain/repository/IUserClient.js';
import { GetUserInputType } from '../../domain/contracts/schemas/index.js';
import { ErrorCode, McpError } from "@modelcontextprotocol/sdk/types.js";

@injectable()
export class UserClient implements IUserClient {
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
                ? {Authorization: `Bearer ${config.token}`}
                : {},
            auth: config.username && config.password
                ? {username: config.username, password: config.password}
                : undefined,
        });
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