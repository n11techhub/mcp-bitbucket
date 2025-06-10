import "reflect-metadata";
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import logger from './logging/logger.js';
import { McpServerSetup } from "./setup/McpServerSetup.js";
import { container } from './inversify.config.js';
import { TYPES } from './types.js';

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


const mcpServerInstance = container.get<McpServerSetup>(TYPES.McpServerSetup);
const server = new BitbucketServer(mcpServerInstance);
server.run().catch((error) => {
    logger.error('Server error', error);
    process.exit(1);
});