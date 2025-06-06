import {StdioServerTransport} from '@modelcontextprotocol/sdk/server/stdio.js';
import logger from './logging/logger.js';
import {McpServerSetup} from "./setup/McpServerSetup.js";
import {BitbucketClientApi} from "./clients/BitbucketClientApi.js";


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

const server = new BitbucketServer(new McpServerSetup(new BitbucketClientApi()));
server.run().catch((error) => {
    logger.error('Server error', error);
    process.exit(1);
});