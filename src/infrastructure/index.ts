import 'reflect-metadata';
import {StdioServerTransport} from '@modelcontextprotocol/sdk/server/stdio.js';
import winston from 'winston';
import {container} from './inversify.config.js';
import {McpServerSetup} from './setup/McpServerSetup.js';
import {McpHttpServer} from './http/McpHttpServer.js';
import {TYPES} from './types.js';

function shouldEnableHTTP(): boolean {
    const enableHttp = process.env.ENABLE_HTTP_TRANSPORT;
    return enableHttp === '1' || enableHttp === 'true' || enableHttp === 'yes';
}

async function startStdioServer(logger: winston.Logger, mcpServerSetup: McpServerSetup): Promise<void> {
    try {
        logger.info('Starting MCP server with stdio transport');
        const transport = new StdioServerTransport();
        await mcpServerSetup.server.connect(transport);
        logger.info('Bitbucket MCP server running on stdio');
    } catch (error) {
        logger.error('Failed to start stdio server', {message: (error as Error).message, stack: (error as Error).stack});
        throw error;
    }
}

async function startHttpServer(logger: winston.Logger, mcpHttpServer: McpHttpServer): Promise<void> {
    try {
        logger.info('Starting MCP server with HTTP streaming transport');
        const portFromEnv = process.env.MCP_HTTP_PORT ? parseInt(process.env.MCP_HTTP_PORT, 10) : 3001;
        const port = isNaN(portFromEnv) ? 3001 : portFromEnv;
        let endpoint = process.env.MCP_HTTP_ENDPOINT ?? '/mcp';
        if (!endpoint.startsWith('/')) {
            endpoint = `/${endpoint}`;
        }

        mcpHttpServer.setPort(port);
        mcpHttpServer.setEndpoint(endpoint);

        await mcpHttpServer.start();
        logger.info(`Bitbucket MCP server running on HTTP streaming transport (port ${port}, endpoint ${endpoint})`);
    } catch (error) {
        logger.error('Failed to start HTTP streaming server', {message: (error as Error).message, stack: (error as Error).stack});
        throw error;
    }
}

async function main() {
    const logger = container.get<winston.Logger>(TYPES.Logger);
    try {
        const mcpServerSetup = container.get<McpServerSetup>(TYPES.McpServerSetup);

        if (shouldEnableHTTP()) {
            const mcpHttpServer = container.get<McpHttpServer>(TYPES.McpHttpServer);
            await startHttpServer(logger, mcpHttpServer);
            logger.info('HTTP streaming transport enabled');
        } else {
            await startStdioServer(logger, mcpServerSetup);
            logger.info('Stdio transport enabled');
        }

        setupProcessHandlers(logger);

        logger.info('MCP server started successfully');
    } catch (error) {
        logger.error('Application startup error', {message: (error as Error).message, stack: (error as Error).stack});
        process.exit(1);
    }
}

function setupProcessHandlers(logger: winston.Logger): void {
    const handleExit = async () => {
        logger.info('Received termination signal. Shutting down...');
        let exitCode = 0;
        try {
            if (shouldEnableHTTP()) {
                const mcpHttpServer = container.get<McpHttpServer>(TYPES.McpHttpServer);
                logger.info('Shutting down HTTP server...');
                await mcpHttpServer.stop();
            }

            logger.info('Shutdown complete');
        } catch (error) {
            logger.error('Error during shutdown', {
                message: (error as Error).message,
                stack: (error as Error).stack
            });
            exitCode = 1;
        } finally {
            logger.info(`Exiting with code ${exitCode}`);
            process.exit(exitCode);
        }
    };

    process.on('SIGINT', handleExit);
    process.on('SIGTERM', handleExit);
    process.on('uncaughtException', (err) => {
        logger.error('Uncaught exception', {error: err.message, stack: err.stack});
        process.exit(1);
    });
}

main().catch((error) => {
    console.error('Fatal error during application startup:', error);
    process.exit(1);
});