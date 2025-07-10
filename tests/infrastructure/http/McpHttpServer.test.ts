/**
 * @fileoverview Unit tests for src/infrastructure/http/McpHttpServer.ts
 * Tests the MCP HTTP server implementation including request handling, tool execution, and transport management
 */

import 'reflect-metadata';
import {jest} from '@jest/globals';
import {McpHttpServer} from '../../../src/infrastructure/http/McpHttpServer.js';

const mockMcpServerSetup = {
    server: {
        connect: jest.fn().mockImplementation(() => Promise.resolve()),
    },
    getAvailableTools: jest.fn(),
    callTool: jest.fn().mockImplementation(() => Promise.resolve({content: []})),
};

const mockLogger = {
    info: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
    warn: jest.fn(),
};

const mockTransport = {
    setPort: jest.fn(),
    setEndpoint: jest.fn(),
    start: jest.fn().mockImplementation(() => Promise.resolve()),
    close: jest.fn().mockImplementation(() => Promise.resolve()),
    request: null as any,
};

jest.mock('../../../src/infrastructure/http/McpHttpTransport.js', () => ({
    McpHttpTransport: jest.fn().mockImplementation(() => mockTransport)
}));

describe('McpHttpServer', () => {
    let server: McpHttpServer;

    beforeEach(() => {
        jest.clearAllMocks();

        mockTransport.start.mockImplementation(() => Promise.resolve());
        mockTransport.close.mockImplementation(() => Promise.resolve());
        mockMcpServerSetup.server.connect.mockImplementation(() => Promise.resolve());
        mockMcpServerSetup.getAvailableTools.mockReturnValue([
            {name: 'bitbucket_get_repo', description: 'Get repository info'},
            {name: 'bitbucket_list_repos', description: 'List repositories'}
        ]);

        server = new McpHttpServer(mockMcpServerSetup as any, mockLogger as any);
    });

    describe('Constructor', () => {
        it('should initialize with default values', () => {
            expect(server).toBeInstanceOf(McpHttpServer);
            expect(mockLogger).toBeDefined();
            expect(mockMcpServerSetup).toBeDefined();
        });
    });

    describe('Configuration Methods', () => {
        it('should set port correctly', () => {
            server.setPort(8080);
            expect(mockTransport.setPort).toHaveBeenCalledWith(8080);
        });

        it('should set endpoint correctly', () => {
            server.setEndpoint('/api/mcp');
            expect(mockTransport.setEndpoint).toHaveBeenCalledWith('/api/mcp');
        });
    });

    describe('start()', () => {
        it('should start server successfully', async () => {
            await server.start();

            expect(mockTransport.start).toHaveBeenCalled();
            expect(mockTransport.request).toBeDefined();
            expect(mockMcpServerSetup.server.connect).toHaveBeenCalledWith(mockTransport);
            expect(mockLogger.info).toHaveBeenCalledWith('Starting HTTP Streaming server on port 3001');
            expect(mockLogger.info).toHaveBeenCalledWith('Connecting MCP server to HTTP streaming transport');
            expect(mockLogger.info).toHaveBeenCalledWith('Bitbucket MCP HTTP streaming server running on port 3001 at endpoint /mcp');
        });

        it('should handle transport start errors', async () => {
            const error = new Error('Transport start failed');
            mockTransport.start.mockImplementation(() => Promise.reject(error));

            await expect(server.start()).rejects.toThrow('Transport start failed');
            expect(mockLogger.error).toHaveBeenCalledWith('Failed to start HTTP streaming server', {
                error: 'Transport start failed',
                stack: error.stack
            });
        });

        it('should handle MCP server connect errors', async () => {
            const error = new Error('MCP connect failed');
            mockMcpServerSetup.server.connect.mockImplementation(() => Promise.reject(error));

            await expect(server.start()).rejects.toThrow('MCP connect failed');
            expect(mockLogger.error).toHaveBeenCalledWith('Failed to start HTTP streaming server', {
                error: 'MCP connect failed',
                stack: error.stack
            });
        });
    });

    describe('stop()', () => {
        it('should stop server successfully', async () => {
            await server.stop();

            expect(mockTransport.close).toHaveBeenCalled();
            expect(mockLogger.info).toHaveBeenCalledWith('Stopping HTTP streaming server');
            expect(mockLogger.info).toHaveBeenCalledWith('HTTP streaming server stopped');
        });

        it('should handle transport close errors', async () => {
            const error = new Error('Transport close failed');
            mockTransport.close.mockImplementation(() => Promise.reject(error));

            await expect(server.stop()).rejects.toThrow('Transport close failed');
            expect(mockLogger.error).toHaveBeenCalledWith('Error stopping HTTP streaming server', {
                error: 'Transport close failed',
                stack: error.stack
            });
        });
    });

    describe('MCP Request Handling', () => {
        let requestHandler: any;

        beforeEach(async () => {
            await server.start();
            requestHandler = mockTransport.request;
        });

        describe('Invalid Requests', () => {
            it('should handle invalid JSON-RPC requests with id', async () => {
                const invalidRequest = {method: 'test', id: '123'};
                const result = await requestHandler(invalidRequest, {});

                expect(result).toEqual({
                    jsonrpc: '2.0',
                    id: '123',
                    error: {
                        code: -32600,
                        message: 'Invalid JSON-RPC request.',
                    }
                });
                expect(mockLogger.error).toHaveBeenCalledWith('Received an invalid request object.', expect.any(Object));
            });

            it('should handle invalid notifications (no id)', async () => {
                const invalidRequest = {method: 'test'};
                const result = await requestHandler(invalidRequest, {});

                expect(result).toBeNull();
                expect(mockLogger.warn).toHaveBeenCalledWith('Invalid notification received, ignoring silently');
            });

            it('should handle requests with invalid id types', async () => {
                const invalidRequest = {jsonrpc: '2.0', method: 'test', id: {}};
                const result = await requestHandler(invalidRequest, {});

                expect(result).toEqual({
                    jsonrpc: '2.0',
                    id: null,
                    error: {
                        code: -32600,
                        message: 'Invalid JSON-RPC request.',
                    }
                });
            });
        });

        describe('initialize', () => {
            it('should handle initialize request', async () => {
                const request = {jsonrpc: '2.0', method: 'initialize', id: '1'};
                const result = await requestHandler(request, {});

                expect(result).toEqual({
                    jsonrpc: '2.0',
                    id: '1',
                    result: {
                        protocolVersion: '2024-11-05',
                        serverInfo: {
                            name: 'Bitbucket MCP Server',
                            version: '1.0.0'
                        },
                        capabilities: {
                            roots: {
                                listChanged: true
                            },
                            tools: {
                                list: true,
                                execute: true
                            }
                        }
                    }
                });
                expect(mockLogger.info).toHaveBeenCalledWith('Handling initialize request');
            });
        });

        describe('ping', () => {
            it('should handle ping request', async () => {
                const request = {jsonrpc: '2.0', method: 'ping', id: '2'};
                const result = await requestHandler(request, {});

                expect(result).toEqual({
                    jsonrpc: '2.0',
                    id: '2',
                    result: {
                        status: 'ok',
                        timestamp: expect.any(String)
                    }
                });
                expect(mockLogger.info).toHaveBeenCalledWith('Handling ping request');
            });
        });

        describe('notifications/initialized', () => {
            it('should handle notifications/initialized', async () => {
                const request = {jsonrpc: '2.0', method: 'notifications/initialized', id: '3'};
                const result = await requestHandler(request, {});

                expect(result).toEqual({
                    jsonrpc: '2.0',
                    id: '3',
                    result: {}
                });
                expect(mockLogger.info).toHaveBeenCalledWith('Handling notifications/initialized notification');
            });
        });

        describe('shutdown', () => {
            it('should handle shutdown request', async () => {
                const request = {jsonrpc: '2.0', method: 'shutdown', id: '4'};
                const result = await requestHandler(request, {});

                expect(result).toEqual({
                    jsonrpc: '2.0',
                    id: '4',
                    result: {
                        status: 'ok',
                        timestamp: expect.any(String)
                    }
                });
                expect(mockLogger.info).toHaveBeenCalledWith('Handling shutdown request');
            });
        });

        describe('tools/list', () => {
            it('should handle tools/list request', async () => {
                const request = {jsonrpc: '2.0', method: 'tools/list', id: '5'};
                const result = await requestHandler(request, {});

                expect(result).toEqual({
                    jsonrpc: '2.0',
                    id: '5',
                    result: {
                        tools: [
                            {name: 'bitbucket_get_repo', description: 'Get repository info'},
                            {name: 'bitbucket_list_repos', description: 'List repositories'}
                        ]
                    }
                });
                expect(mockMcpServerSetup.getAvailableTools).toHaveBeenCalled();
                expect(mockLogger.info).toHaveBeenCalledWith('Handling tools/list request');
            });
        });

        describe('tools/call', () => {
            it('should handle valid tool call successfully', async () => {
                const mockResult = {content: [{type: 'text', text: 'Tool executed successfully'}]};
                mockMcpServerSetup.callTool.mockImplementation(() => Promise.resolve(mockResult));

                const request = {
                    jsonrpc: '2.0',
                    method: 'tools/call',
                    id: '6',
                    params: {
                        name: 'bitbucket_get_repo',
                        arguments: {workspace: 'test', repo: 'test-repo'}
                    }
                };
                const headers = {'x-api-key': 'test-api-key'};
                const result = await requestHandler(request, headers);

                expect(result).toEqual({
                    jsonrpc: '2.0',
                    id: '6',
                    result: mockResult
                });
                expect(mockMcpServerSetup.callTool).toHaveBeenCalledWith(
                    'bitbucket_get_repo',
                    {workspace: 'test', repo: 'test-repo'},
                    'test-api-key'
                );
            });

            it('should handle tool call without arguments', async () => {
                const mockResult = {content: [{type: 'text', text: 'Tool executed'}]};
                mockMcpServerSetup.callTool.mockImplementation(() => Promise.resolve(mockResult));

                const request = {
                    jsonrpc: '2.0',
                    method: 'tools/call',
                    id: '7',
                    params: {
                        name: 'bitbucket_list_repos'
                    }
                };
                const result = await requestHandler(request, {});

                expect(result).toEqual({
                    jsonrpc: '2.0',
                    id: '7',
                    result: mockResult
                });
                expect(mockMcpServerSetup.callTool).toHaveBeenCalledWith(
                    'bitbucket_list_repos',
                    {},
                    undefined
                );
            });

            it('should handle invalid tool call params (missing name)', async () => {
                const request = {
                    jsonrpc: '2.0',
                    method: 'tools/call',
                    id: '8',
                    params: {
                        arguments: {workspace: 'test'}
                    }
                };
                const result = await requestHandler(request, {});

                expect(result).toEqual({
                    jsonrpc: '2.0',
                    id: '8',
                    error: {
                        code: -32602,
                        message: "Invalid params: missing required field 'name' of type string."
                    }
                });
            });

            it('should handle invalid tool call params (name not string)', async () => {
                const request = {
                    jsonrpc: '2.0',
                    method: 'tools/call',
                    id: '9',
                    params: {
                        name: 123,
                        arguments: {workspace: 'test'}
                    }
                };
                const result = await requestHandler(request, {});

                expect(result).toEqual({
                    jsonrpc: '2.0',
                    id: '9',
                    error: {
                        code: -32602,
                        message: "Invalid params: missing required field 'name' of type string."
                    }
                });
            });

            it('should handle non-bitbucket tools', async () => {
                const request = {
                    jsonrpc: '2.0',
                    method: 'tools/call',
                    id: '10',
                    params: {
                        name: 'other_tool',
                        arguments: {}
                    }
                };
                const result = await requestHandler(request, {});

                expect(result).toEqual({
                    jsonrpc: '2.0',
                    id: '10',
                    error: {
                        code: -32601,
                        message: 'Unknown tool: other_tool'
                    }
                });
            });

            it('should handle tool execution errors', async () => {
                const toolError = new Error('Tool execution failed');
                mockMcpServerSetup.callTool.mockImplementation(() => Promise.reject(toolError));

                const request = {
                    jsonrpc: '2.0',
                    method: 'tools/call',
                    id: '11',
                    params: {
                        name: 'bitbucket_get_repo',
                        arguments: {workspace: 'test', repo: 'test-repo'}
                    }
                };
                const result = await requestHandler(request, {});

                expect(result).toEqual({
                    jsonrpc: '2.0',
                    id: '11',
                    error: {
                        code: -32603,
                        message: 'Tool execution error: Tool execution failed'
                    }
                });
                expect(mockLogger.error).toHaveBeenCalledWith('Error executing tool bitbucket_get_repo', toolError);
            });
        });

        describe('Unknown Methods', () => {
            it('should handle unknown methods', async () => {
                const request = {jsonrpc: '2.0', method: 'unknown_method', id: '12'};
                const result = await requestHandler(request, {});

                expect(result).toEqual({
                    jsonrpc: '2.0',
                    id: '12',
                    error: {
                        code: -32601,
                        message: 'Method not found: unknown_method'
                    }
                });
                expect(mockLogger.error).toHaveBeenCalledWith('Unsupported request method: unknown_method');
            });
        });

        describe('Request Processing Errors', () => {
            it('should handle unexpected errors during request processing', async () => {
                mockMcpServerSetup.getAvailableTools.mockImplementation(() => {
                    throw new Error('Unexpected error');
                });

                const request = {jsonrpc: '2.0', method: 'tools/list', id: '13'};
                const result = await requestHandler(request, {});

                expect(result).toEqual({
                    jsonrpc: '2.0',
                    id: '13',
                    error: {
                        code: -32000,
                        message: 'Unexpected error'
                    }
                });
                expect(mockLogger.error).toHaveBeenCalledWith('Error handling request', expect.any(Error));

                mockMcpServerSetup.getAvailableTools.mockReturnValue([]);
            });

            it('should handle non-Error exceptions', async () => {
                mockMcpServerSetup.getAvailableTools.mockImplementation(() => {
                    throw 'String error';
                });

                const request = {jsonrpc: '2.0', method: 'tools/list', id: '14'};
                const result = await requestHandler(request, {});

                expect(result).toEqual({
                    jsonrpc: '2.0',
                    id: '14',
                    error: {
                        code: -32000,
                        message: 'String error'
                    }
                });

                mockMcpServerSetup.getAvailableTools.mockReturnValue([]);
            });
        });
    });

    describe('Integration Scenarios', () => {
        it('should handle complete server lifecycle', async () => {
            await server.start();
            expect(mockTransport.start).toHaveBeenCalled();
            expect(mockMcpServerSetup.server.connect).toHaveBeenCalled();

            const requestHandler = mockTransport.request;
            const request = {jsonrpc: '2.0', method: 'ping', id: '1'};
            const result = await requestHandler(request, {});

            expect(result.result.status).toBe('ok');

            await server.stop();
            expect(mockTransport.close).toHaveBeenCalled();
        });

        it('should handle multiple consecutive requests', async () => {
            await server.start();
            const requestHandler = mockTransport.request;

            const initRequest = {jsonrpc: '2.0', method: 'initialize', id: '1'};
            const initResult = await requestHandler(initRequest, {});
            expect(initResult.result.serverInfo.name).toBe('Bitbucket MCP Server');

            const toolsRequest = {jsonrpc: '2.0', method: 'tools/list', id: '2'};
            const toolsResult = await requestHandler(toolsRequest, {});
            expect(toolsResult.result.tools).toHaveLength(2);

            mockMcpServerSetup.callTool.mockImplementation(() => Promise.resolve({
                content: [{
                    type: 'text',
                    text: 'Success'
                }]
            }));
            const callRequest = {
                jsonrpc: '2.0',
                method: 'tools/call',
                id: '3',
                params: {name: 'bitbucket_get_repo', arguments: {workspace: 'test'}}
            };
            const callResult = await requestHandler(callRequest, {});
            expect(callResult.result.content[0].text).toBe('Success');

            const shutdownRequest = {jsonrpc: '2.0', method: 'shutdown', id: '4'};
            const shutdownResult = await requestHandler(shutdownRequest, {});
            expect(shutdownResult.result.status).toBe('ok');
        });

        it('should handle requests with different ID types', async () => {
            await server.start();
            const requestHandler = mockTransport.request;

            const stringIdRequest = {jsonrpc: '2.0', method: 'ping', id: 'string-id'};
            const stringResult = await requestHandler(stringIdRequest, {});
            expect(stringResult.id).toBe('string-id');

            const numberIdRequest = {jsonrpc: '2.0', method: 'ping', id: 42};
            const numberResult = await requestHandler(numberIdRequest, {});
            expect(numberResult.id).toBe(42);

            const nullIdRequest = {jsonrpc: '2.0', method: 'ping', id: null};
            const nullResult = await requestHandler(nullIdRequest, {});
            expect(nullResult.id).toBeNull();

            const noIdRequest = {jsonrpc: '2.0', method: 'notifications/initialized'};
            const noIdResult = await requestHandler(noIdRequest, {});
            expect(noIdResult.id).toBeUndefined();
        });

        it('should handle custom port and endpoint configuration', async () => {
            server.setPort(9000);
            server.setEndpoint('/custom');

            await server.start();

            expect(mockTransport.setPort).toHaveBeenCalledWith(9000);
            expect(mockTransport.setEndpoint).toHaveBeenCalledWith('/custom');
            expect(mockLogger.info).toHaveBeenCalledWith('Starting HTTP Streaming server on port 9000');
            expect(mockLogger.info).toHaveBeenCalledWith('Bitbucket MCP HTTP streaming server running on port 9000 at endpoint /custom');
        });
    });
}); 