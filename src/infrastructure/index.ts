import 'reflect-metadata';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import winston from 'winston';
import { container } from './inversify.config.js';
import { McpServerSetup } from './setup/McpServerSetup.js';
import { TYPES } from './types.js';

async function main() {
    const logger = container.get<winston.Logger>(TYPES.Logger);
    try {
        const mcpServerSetup = container.get<McpServerSetup>(TYPES.McpServerSetup);

        // Start the MCP server for stdio communication
        const transport = new StdioServerTransport();
        await mcpServerSetup.server.connect(transport);
        logger.info('Bitbucket MCP server running on stdio');

    } catch (error: any) {
        logger.error('Application startup error', { message: error.message, stack: error.stack });
        process.exit(1);
    }
}

main();