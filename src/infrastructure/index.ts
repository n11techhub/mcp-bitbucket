import {StdioServerTransport} from '@modelcontextprotocol/sdk/server/stdio.js';
import logger from './logging/logger.js';
import {McpServerSetup} from "./setup/McpServerSetup.js";
import {BitbucketClientApi} from "./clients/BitbucketClientApi.js";
import {BitbucketConfig} from "./config/BitbucketConfig.js";
import { IBitbucketUseCase } from '../application/use-cases/IBitbucketUseCase.js';
import { BitbucketUseCase } from '../application/use-cases/impl/BitbucketUseCase.js';
import { PullRequestClient } from "./clients/PullRequestClient.js";
import { RepositoryClient } from "./clients/RepositoryClient.js";
import { WorkspaceClient } from "./clients/WorkspaceClient.js";
import { SearchClient } from "./clients/SearchClient.js";


class BitbucketServer {
    private readonly mcpServer : McpServerSetup;

    constructor(mcpServer: McpServerSetup) {
        this.mcpServer = mcpServer;
    }


    async run() {
        const transport = new StdioServerTransport();
        await this.mcpServer.server.connect(transport);
        logger.info('Bitbucket MCP server running on stdio');
    }
}

const bitbucketConfig: BitbucketConfig = {
    baseUrl: process.env.BITBUCKET_URL ?? '',
    token: process.env.BITBUCKET_TOKEN,
    username: process.env.BITBUCKET_USERNAME,
    password: process.env.BITBUCKET_PASSWORD,
    defaultProject: process.env.BITBUCKET_DEFAULT_PROJECT
};

const pullRequestClient = new PullRequestClient(bitbucketConfig, logger);
const repositoryClient = new RepositoryClient(bitbucketConfig, logger);
const workspaceClient = new WorkspaceClient(bitbucketConfig, logger);
const searchClient = new SearchClient(bitbucketConfig, logger);

const bitbucketClientApi = new BitbucketClientApi(
    bitbucketConfig, 
    pullRequestClient, 
    repositoryClient, 
    workspaceClient, 
    searchClient
);
const bitbucketUseCase: IBitbucketUseCase = new BitbucketUseCase(bitbucketClientApi);

const server = new BitbucketServer(new McpServerSetup(bitbucketClientApi, bitbucketUseCase, logger));
server.run().catch((error) => {
    logger.error('Server error', error);
    process.exit(1);
});