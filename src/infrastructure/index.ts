import 'reflect-metadata';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import winston from 'winston';
import { container } from './inversify.config.js';
import { McpServerSetup } from './setup/McpServerSetup.js';
import { McpHttpServer } from './http/McpHttpServer.js';
import { TYPES } from './types.js';

/**
 * Determines if HTTP streaming transport should be enabled based on environment variables
 */
function shouldEnableHTTP(): boolean {
    const enableHttp = process.env.ENABLE_HTTP_TRANSPORT;
    return enableHttp === '1' || enableHttp === 'true' || enableHttp === 'yes';
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
 * Starts the MCP server with HTTP streaming transport
 */
async function startHttpServer(logger: winston.Logger, mcpHttpServer: McpHttpServer): Promise<void> {
    try {
        logger.info('Starting MCP server with HTTP streaming transport');
        // Get port from environment variable or use default
        const port = process.env.MCP_HTTP_PORT ? parseInt(process.env.MCP_HTTP_PORT, 10) : 3001;
        const endpoint = process.env.MCP_HTTP_ENDPOINT || '/stream';
        
        mcpHttpServer.setPort(port);
        mcpHttpServer.setEndpoint(endpoint);
        
        // Start the HTTP server
        await mcpHttpServer.start();
        logger.info(`Bitbucket MCP server running on HTTP streaming transport (port ${port}, endpoint ${endpoint})`);
    } catch (error: any) {
        logger.error('Failed to start HTTP streaming server', { message: error.message, stack: error.stack });
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
        
        // Determine which transport to use based on environment variables
        if (shouldEnableHTTP()) {
            // Start HTTP streaming transport
            const mcpHttpServer = container.get<McpHttpServer>(TYPES.McpHttpServer);
            await startHttpServer(logger, mcpHttpServer);
            logger.info('HTTP streaming transport enabled');
        } else {
            // Default to stdio transport
            await startStdioServer(logger, mcpServerSetup);
            logger.info('Stdio transport enabled');
        }
        
        setupProcessHandlers(logger);
        
        return 'MCP server started successfully';
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
        
        try {
            // Attempt to gracefully shutdown servers if they are running
            if (shouldEnableHTTP()) {
                const mcpHttpServer = container.get<McpHttpServer>(TYPES.McpHttpServer);
                logger.info('Shutting down HTTP server...');
                await mcpHttpServer.stop();
            }
            
            logger.info('Shutdown complete');
        } catch (error: any) {
            logger.error('Error during shutdown', { 
                message: error.message,
                stack: error.stack 
            });
        } finally {
            setTimeout(() => process.exit(0), 1000);
        }
    };
    
    process.on('SIGINT', handleExit);
    process.on('SIGTERM', handleExit);
    process.on('uncaughtException', (err) => {
        logger.error('Uncaught exception', { error: err.message, stack: err.stack });
        process.exit(1);
    });
}

main().then(r => console.log(r)).catch(e => console.error(e));