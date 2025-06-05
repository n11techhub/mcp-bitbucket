import {StdioServerTransport} from '@modelcontextprotocol/sdk/server/stdio.js';
import winston from 'winston';
import {McpServerSetup} from "./setup/McpServerSetup.js";
import {BitbucketClientApi} from "./BitbucketClientApi.js";

const logger = winston.createLogger({
    level: 'info',
    format: winston.format.json(),
    transports: [
        new winston.transports.File({filename: 'bitbucket.log'})
    ]
});


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