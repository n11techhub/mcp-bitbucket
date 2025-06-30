/**
 * @fileoverview Unit tests for src/infrastructure/index.ts
 * Tests the main entry point including transport modes, server startup, and process handling
 */

import 'reflect-metadata';
import { jest } from '@jest/globals';

// Store original values
const originalEnv = process.env;
const originalProcessExit = process.exit;
const originalProcessOn = process.on;

// Mock objects with proper typing
const mockLogger = {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
};

const mockMcpServerSetup = {
    server: {
        connect: jest.fn(),
    },
};

const mockMcpHttpServer = {
    setPort: jest.fn(),
    setEndpoint: jest.fn(),
    start: jest.fn(),
    stop: jest.fn(),
};

const mockStdioServerTransport = {};

const mockContainer = {
    get: jest.fn(),
};

// Mock process functions
const mockProcessExit = jest.fn();
const mockProcessOn = jest.fn();

describe('Infrastructure Index Module', () => {
    let signalHandlers: { [key: string]: Function } = {};

    beforeEach(() => {
        jest.clearAllMocks();
        jest.resetModules();
        
        // Reset environment variables
        process.env = { ...originalEnv };
        delete process.env.ENABLE_HTTP_TRANSPORT;
        delete process.env.MCP_HTTP_PORT;
        delete process.env.MCP_HTTP_ENDPOINT;
        
        // Reset signal handlers
        signalHandlers = {};
        
        // Reset mock implementations
        mockMcpServerSetup.server.connect.mockImplementation(() => Promise.resolve());
        mockMcpHttpServer.start.mockImplementation(() => Promise.resolve());
        mockMcpHttpServer.stop.mockImplementation(() => Promise.resolve());
        
        // Mock process methods
        process.exit = mockProcessExit as any;
        process.on = mockProcessOn.mockImplementation((...args: any[]) => {
            const [signal, handler] = args;
            signalHandlers[signal as string] = handler as Function;
            return process;
        }) as any;
        
        // Setup default container behavior
        mockContainer.get.mockImplementation((type: any) => {
            const typeString = type.toString();
            if (typeString.includes('Logger')) return mockLogger;
            if (typeString.includes('McpServerSetup')) return mockMcpServerSetup;
            if (typeString.includes('McpHttpServer')) return mockMcpHttpServer;
            return null;
        });

        // Mock external dependencies
        jest.doMock('@modelcontextprotocol/sdk/server/stdio.js', () => ({
            StdioServerTransport: jest.fn(() => mockStdioServerTransport),
        }));
        
        jest.doMock('winston', () => mockLogger);
        
        jest.doMock('../../src/infrastructure/inversify.config.js', () => ({
            container: mockContainer,
        }));
        
        jest.doMock('../../src/infrastructure/setup/McpServerSetup.js', () => ({
            McpServerSetup: jest.fn(() => mockMcpServerSetup),
        }));
        
        jest.doMock('../../src/infrastructure/http/McpHttpServer.js', () => ({
            McpHttpServer: jest.fn(() => mockMcpHttpServer),
        }));
        
        jest.doMock('../../src/infrastructure/types.js', () => ({
            TYPES: {
                Logger: Symbol.for("Logger"),
                McpServerSetup: Symbol.for("McpServerSetup"),
                McpHttpServer: Symbol.for("McpHttpServer"),
            },
        }));
    });

    afterEach(() => {
        process.env = originalEnv;
        process.exit = originalProcessExit;
        process.on = originalProcessOn;
    });

    describe('HTTP Transport Detection', () => {
        it('should enable HTTP transport when ENABLE_HTTP_TRANSPORT is "1"', async () => {
            process.env.ENABLE_HTTP_TRANSPORT = '1';

            await import('../../src/infrastructure/index.js');
            await new Promise(setImmediate);

            expect(mockMcpHttpServer.start).toHaveBeenCalled();
            expect(mockLogger.info).toHaveBeenCalledWith('HTTP streaming transport enabled');
        });

        it('should enable HTTP transport when ENABLE_HTTP_TRANSPORT is "true"', async () => {
            process.env.ENABLE_HTTP_TRANSPORT = 'true';

            await import('../../src/infrastructure/index.js');
            await new Promise(setImmediate);

            expect(mockMcpHttpServer.start).toHaveBeenCalled();
            expect(mockLogger.info).toHaveBeenCalledWith('HTTP streaming transport enabled');
        });

        it('should enable HTTP transport when ENABLE_HTTP_TRANSPORT is "yes"', async () => {
            process.env.ENABLE_HTTP_TRANSPORT = 'yes';

            await import('../../src/infrastructure/index.js');
            await new Promise(setImmediate);

            expect(mockMcpHttpServer.start).toHaveBeenCalled();
            expect(mockLogger.info).toHaveBeenCalledWith('HTTP streaming transport enabled');
        });

        it('should use stdio transport when ENABLE_HTTP_TRANSPORT is not set', async () => {
            delete process.env.ENABLE_HTTP_TRANSPORT;

            await import('../../src/infrastructure/index.js');
            await new Promise(setImmediate);

            expect(mockMcpServerSetup.server.connect).toHaveBeenCalled();
            expect(mockLogger.info).toHaveBeenCalledWith('Stdio transport enabled');
        });

        it('should use stdio transport when ENABLE_HTTP_TRANSPORT is "false"', async () => {
            process.env.ENABLE_HTTP_TRANSPORT = 'false';

            await import('../../src/infrastructure/index.js');
            await new Promise(setImmediate);

            expect(mockMcpServerSetup.server.connect).toHaveBeenCalled();
            expect(mockLogger.info).toHaveBeenCalledWith('Stdio transport enabled');
        });
    });

    describe('HTTP Server Configuration', () => {
        beforeEach(() => {
            process.env.ENABLE_HTTP_TRANSPORT = '1';
        });

        it('should use default port and endpoint when not specified', async () => {
            await import('../../src/infrastructure/index.js');
            await new Promise(setImmediate);

            expect(mockMcpHttpServer.setPort).toHaveBeenCalledWith(3001);
            expect(mockMcpHttpServer.setEndpoint).toHaveBeenCalledWith('/stream');
            expect(mockLogger.info).toHaveBeenCalledWith(
                'Bitbucket MCP server running on HTTP streaming transport (port 3001, endpoint /stream)'
            );
        });

        it('should use custom port when MCP_HTTP_PORT is set', async () => {
            process.env.MCP_HTTP_PORT = '8080';

            await import('../../src/infrastructure/index.js');
            await new Promise(setImmediate);

            expect(mockMcpHttpServer.setPort).toHaveBeenCalledWith(8080);
            expect(mockLogger.info).toHaveBeenCalledWith(
                'Bitbucket MCP server running on HTTP streaming transport (port 8080, endpoint /stream)'
            );
        });

        it('should use custom endpoint when MCP_HTTP_ENDPOINT is set', async () => {
            process.env.MCP_HTTP_ENDPOINT = 'api/stream';

            await import('../../src/infrastructure/index.js');
            await new Promise(setImmediate);

            expect(mockMcpHttpServer.setEndpoint).toHaveBeenCalledWith('/api/stream');
            expect(mockLogger.info).toHaveBeenCalledWith(
                'Bitbucket MCP server running on HTTP streaming transport (port 3001, endpoint /api/stream)'
            );
        });

        it('should handle endpoint that already starts with slash', async () => {
            process.env.MCP_HTTP_ENDPOINT = '/api/stream';

            await import('../../src/infrastructure/index.js');
            await new Promise(setImmediate);

            expect(mockMcpHttpServer.setEndpoint).toHaveBeenCalledWith('/api/stream');
        });

        it('should handle invalid port number gracefully', async () => {
            process.env.MCP_HTTP_PORT = 'invalid';

            await import('../../src/infrastructure/index.js');
            await new Promise(setImmediate);

            // Should fallback to default port when parseInt returns NaN
            expect(mockMcpHttpServer.setPort).toHaveBeenCalledWith(3001);
        });
    });

    describe('Server Startup', () => {
        it('should successfully start stdio server', async () => {
            delete process.env.ENABLE_HTTP_TRANSPORT;

            await import('../../src/infrastructure/index.js');
            await new Promise(setImmediate);

            expect(mockLogger.info).toHaveBeenCalledWith('Starting MCP server with stdio transport');
            expect(mockMcpServerSetup.server.connect).toHaveBeenCalledWith(mockStdioServerTransport);
            expect(mockLogger.info).toHaveBeenCalledWith('Bitbucket MCP server running on stdio');
            expect(mockLogger.info).toHaveBeenCalledWith('MCP server started successfully');
        });

        it('should successfully start HTTP server', async () => {
            process.env.ENABLE_HTTP_TRANSPORT = '1';

            await import('../../src/infrastructure/index.js');
            await new Promise(setImmediate);

            expect(mockLogger.info).toHaveBeenCalledWith('Starting MCP server with HTTP streaming transport');
            expect(mockMcpHttpServer.start).toHaveBeenCalled();
            expect(mockLogger.info).toHaveBeenCalledWith('MCP server started successfully');
        });

        it('should handle stdio server startup errors', async () => {
            delete process.env.ENABLE_HTTP_TRANSPORT;
            const error = new Error('Connection failed');
            mockMcpServerSetup.server.connect.mockImplementation(() => Promise.reject(error));

            await import('../../src/infrastructure/index.js');
            await new Promise(setImmediate);

            expect(mockLogger.error).toHaveBeenCalledWith('Failed to start stdio server', {
                message: error.message,
                stack: error.stack,
            });
            expect(mockProcessExit).toHaveBeenCalledWith(1);
        });

        it('should handle HTTP server startup errors', async () => {
            process.env.ENABLE_HTTP_TRANSPORT = '1';
            const error = new Error('HTTP server failed to start');
            mockMcpHttpServer.start.mockImplementation(() => Promise.reject(error));

            await import('../../src/infrastructure/index.js');
            await new Promise(setImmediate);

            expect(mockLogger.error).toHaveBeenCalledWith('Failed to start HTTP streaming server', {
                message: error.message,
                stack: error.stack,
            });
            expect(mockProcessExit).toHaveBeenCalledWith(1);
        });

        it('should handle container dependency injection errors', async () => {
            const error = new Error('Container error');
            mockContainer.get.mockImplementation((type: any) => {
                const typeString = type.toString();
                if (typeString.includes('Logger')) return mockLogger;
                if (typeString.includes('McpServerSetup')) throw error;
                if (typeString.includes('McpHttpServer')) return mockMcpHttpServer;
                return null;
            });

            await import('../../src/infrastructure/index.js');
            await new Promise(setImmediate);

            expect(mockLogger.error).toHaveBeenCalledWith('Application startup error', {
                message: error.message,
                stack: error.stack,
            });
            expect(mockProcessExit).toHaveBeenCalledWith(1);
        });
    });

    describe('Process Signal Handling', () => {
        beforeEach(async () => {
            delete process.env.ENABLE_HTTP_TRANSPORT;

            await import('../../src/infrastructure/index.js');
            await new Promise(setImmediate);
        });

        it('should register signal handlers', () => {
            expect(mockProcessOn).toHaveBeenCalledWith('SIGINT', expect.any(Function));
            expect(mockProcessOn).toHaveBeenCalledWith('SIGTERM', expect.any(Function));
            expect(mockProcessOn).toHaveBeenCalledWith('uncaughtException', expect.any(Function));
        });

        it('should handle SIGINT gracefully with stdio transport', async () => {
            const sigintHandler = signalHandlers['SIGINT'];
            await sigintHandler();

            expect(mockLogger.info).toHaveBeenCalledWith('Received termination signal. Shutting down...');
            expect(mockLogger.info).toHaveBeenCalledWith('Shutdown complete');
            expect(mockLogger.info).toHaveBeenCalledWith('Exiting with code 0');
            expect(mockProcessExit).toHaveBeenCalledWith(0);
        });

        it('should handle SIGTERM gracefully with HTTP transport', async () => {
            // Reset and setup for HTTP transport
            jest.resetModules();
            process.env.ENABLE_HTTP_TRANSPORT = '1';

            await import('../../src/infrastructure/index.js');
            await new Promise(setImmediate);

            const sigtermHandler = signalHandlers['SIGTERM'];
            await sigtermHandler();

            expect(mockLogger.info).toHaveBeenCalledWith('Received termination signal. Shutting down...');
            expect(mockLogger.info).toHaveBeenCalledWith('Shutting down HTTP server...');
            expect(mockMcpHttpServer.stop).toHaveBeenCalled();
            expect(mockLogger.info).toHaveBeenCalledWith('Shutdown complete');
            expect(mockProcessExit).toHaveBeenCalledWith(0);
        });

        it('should handle shutdown errors gracefully', async () => {
            // Reset and setup for HTTP transport with error
            jest.resetModules();
            process.env.ENABLE_HTTP_TRANSPORT = '1';
            const shutdownError = new Error('Shutdown failed');
            mockMcpHttpServer.stop.mockImplementation(() => Promise.reject(shutdownError));

            await import('../../src/infrastructure/index.js');
            await new Promise(setImmediate);

            const sigintHandler = signalHandlers['SIGINT'];
            await sigintHandler();

            expect(mockLogger.error).toHaveBeenCalledWith('Error during shutdown', {
                message: shutdownError.message,
                stack: shutdownError.stack,
            });
            expect(mockLogger.info).toHaveBeenCalledWith('Exiting with code 1');
            expect(mockProcessExit).toHaveBeenCalledWith(1);
        });

        it('should handle uncaught exceptions', async () => {
            const error = new Error('Uncaught exception');
            
            const uncaughtExceptionHandler = signalHandlers['uncaughtException'];
            await uncaughtExceptionHandler(error);

            expect(mockLogger.error).toHaveBeenCalledWith('Uncaught exception', {
                error: error.message,
                stack: error.stack,
            });
            expect(mockProcessExit).toHaveBeenCalledWith(1);
        });
    });

    describe('Integration Scenarios', () => {
        it('should complete full HTTP server lifecycle', async () => {
            process.env.ENABLE_HTTP_TRANSPORT = '1';
            process.env.MCP_HTTP_PORT = '9000';
            process.env.MCP_HTTP_ENDPOINT = '/api/stream';

            await import('../../src/infrastructure/index.js');
            await new Promise(setImmediate);

            // Verify startup
            expect(mockMcpHttpServer.setPort).toHaveBeenCalledWith(9000);
            expect(mockMcpHttpServer.setEndpoint).toHaveBeenCalledWith('/api/stream');
            expect(mockMcpHttpServer.start).toHaveBeenCalled();
            expect(mockLogger.info).toHaveBeenCalledWith('HTTP streaming transport enabled');

            // Simulate shutdown
            const signalHandler = signalHandlers['SIGINT'];
            await signalHandler();
            
            expect(mockMcpHttpServer.stop).toHaveBeenCalled();
            expect(mockProcessExit).toHaveBeenCalledWith(0);
        });

        it('should complete full stdio server lifecycle', async () => {
            delete process.env.ENABLE_HTTP_TRANSPORT;

            await import('../../src/infrastructure/index.js');
            await new Promise(setImmediate);

            // Verify startup
            expect(mockMcpServerSetup.server.connect).toHaveBeenCalledWith(mockStdioServerTransport);
            expect(mockLogger.info).toHaveBeenCalledWith('Stdio transport enabled');

            // Simulate shutdown
            const signalHandler = signalHandlers['SIGTERM'];
            await signalHandler();
            
            expect(mockLogger.info).toHaveBeenCalledWith('Shutdown complete');
            expect(mockProcessExit).toHaveBeenCalledWith(0);
        });

        it('should prioritize HTTP over stdio when both could be active', async () => {
            process.env.ENABLE_HTTP_TRANSPORT = 'true';

            await import('../../src/infrastructure/index.js');
            await new Promise(setImmediate);

            expect(mockMcpHttpServer.start).toHaveBeenCalled();
            expect(mockMcpServerSetup.server.connect).not.toHaveBeenCalled();
            expect(mockLogger.info).toHaveBeenCalledWith('HTTP streaming transport enabled');
        });
    });
});