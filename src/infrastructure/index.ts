import 'reflect-metadata';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import winston from 'winston';
import { container } from './inversify.config.js';
import { McpServerSetup } from './setup/McpServerSetup.js';
import { McpSseServer } from './sse/McpSseServer.js';
import { TYPES } from './types.js';

/**
 * Determines if SSE transport should be enabled based on environment variables
 */
function shouldEnableSSE(): boolean {
    const enableSse = process.env.ENABLE_SSE_TRANSPORT;
    return enableSse === '1' || enableSse === 'true' || enableSse === 'yes';
}

/**
 * Starts the MCP server with stdio transport
 */
async function startStdioServer(logger: winston.Logger, mcpServerSetup: McpServerSetup): Promise<void> {
    try {
        logger.info('Starting MCP server with stdio transport');
        // Start the MCP server for stdio communication
        const transport = new StdioServerTransport();
        await mcpServerSetup.server.connect(transport);
        logger.info('Bitbucket MCP server running on stdio');
    } catch (error: any) {
        logger.error('Failed to start stdio server', { message: error.message, stack: error.stack });
        throw error; // Re-throw to be handled by the main function
    }
}

/**
 * Starts the MCP server with SSE transport
 */
async function startSseServer(logger: winston.Logger, mcpSseServer: McpSseServer): Promise<void> {
    try {
        logger.info('Starting MCP server with SSE transport');
        // Get port from environment variable or use default
        const port = process.env.MCP_SSE_PORT ? parseInt(process.env.MCP_SSE_PORT, 10) : 9000;
        mcpSseServer.setPort(port);
        
        // Start the SSE server
        await mcpSseServer.start();
        logger.info(`Bitbucket MCP server running on SSE transport (port ${port})`);
    } catch (error: any) {
        logger.error('Failed to start SSE server', { message: error.message, stack: error.stack });
        throw error; // Re-throw to be handled by the main function
    }
}

/**
 * Main entry point 
 */
async function main() {
    const logger = container.get<winston.Logger>(TYPES.Logger);
    try {
        const mcpServerSetup = container.get<McpServerSetup>(TYPES.McpServerSetup);
        
        if (shouldEnableSSE()) {
            const mcpSseServer = container.get<McpSseServer>(TYPES.McpSseServer);
            await startSseServer(logger, mcpSseServer);
        } else {
            await startStdioServer(logger, mcpServerSetup);
        }
        
        setupProcessHandlers(logger);
        
    } catch (error: any) {
        logger.error('Application startup error', { message: error.message, stack: error.stack });
        process.exit(1);
    }
}

/**
 * Set up process event handlers for graceful shutdown
 */
function setupProcessHandlers(logger: winston.Logger): void {
    const handleExit = async () => {
        logger.info('Received termination signal. Shutting down...');
        setTimeout(() => process.exit(0), 3000);
    };
    
    process.on('SIGINT', handleExit);
    process.on('SIGTERM', handleExit);
    process.on('uncaughtException', (err) => {
        logger.error('Uncaught exception', { error: err.message, stack: err.stack });
        process.exit(1);
    });
}

main().then(r => console.log(r)).catch(e => console.error(e));