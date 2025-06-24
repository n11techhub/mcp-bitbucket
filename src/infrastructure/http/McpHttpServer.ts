import winston from 'winston';
import {injectable, inject} from 'inversify';
import {TYPES} from '../types.js';
import {McpServerSetup} from '../setup/McpServerSetup.js';
import {McpHttpTransport} from './McpHttpTransport.js';

@injectable()
export class McpHttpServer {
    private readonly transport: McpHttpTransport;
    private readonly mcpServerSetup: McpServerSetup;
    private readonly logger: winston.Logger;
    private port: number = 3001;
    private endpoint: string = '/stream';

    constructor(
        @inject(TYPES.McpServerSetup) mcpServerSetup: McpServerSetup,
        @inject(TYPES.Logger) logger: winston.Logger
    ) {
        this.mcpServerSetup = mcpServerSetup;
        this.logger = logger;
        this.transport = new McpHttpTransport(logger);
    }

    public setPort(port: number): void {
        this.port = port;
        this.transport.setPort(port);
    }

    public setEndpoint(endpoint: string): void {
        this.endpoint = endpoint;
        this.transport.setEndpoint(endpoint);
    }

    public async start(): Promise<void> {
        try {
            this.logger.info(`Starting HTTP Streaming server on port ${this.port}`);
            await this.transport.start();

            this.transport.request = async (request: any) => {
                this.logger.info(`[HTTP Transport] Processing request: ${request.method}`);

                if (request.method === 'initialize') {
                    this.logger.info('Handling initialize request');
                    return {
                        jsonrpc: "2.0",
                        id: request.id,
                        result: {
                            protocolVersion: "2024-11-05",
                            serverInfo: {
                                name: "Bitbucket MCP Server",
                                version: "1.0.0"
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
                    };
                } else if (request.method === 'ping') {
                    this.logger.info('Handling ping request');
                    return {
                        jsonrpc: "2.0",
                        id: request.id,
                        result: {}
                    };
                } else if (request.method === 'notifications/initialized') {
                    this.logger.info('Handling notifications/initialized notification');
                    return {
                        jsonrpc: "2.0",
                        id: request.id,
                        result: {}
                    };
                } else if (request.method === 'shutdown') {
                    this.logger.info('Handling shutdown request');
                    return {
                        jsonrpc: "2.0",
                        id: request.id,
                        result: {}
                    };
                } else if (request.method === 'tools/list') {
                    this.logger.info('Handling tools/list request');

                    const tools = this.mcpServerSetup.getAvailableTools();

                    return {
                        jsonrpc: "2.0",
                        id: request.id,
                        result: {tools}
                    };
                }

                try {
                    if (request.method === 'tools/call') {
                        this.logger.info(`Handling tools/call request for tool: ${request.params?.name}`);

                        if (!request.params?.name) {
                            return {
                                jsonrpc: "2.0",
                                id: request.id,
                                error: {
                                    code: -32602,
                                    message: "Invalid params: missing required field 'name'"
                                }
                            };
                        }

                        const toolName = request.params.name;
                        const toolArgs = request.params.arguments || {};

                        if (toolName.startsWith('bitbucket_')) {
                            try {
                                const result = await this.mcpServerSetup.callTool(toolName, toolArgs);
                                return {
                                    jsonrpc: "2.0",
                                    id: request.id,
                                    result: result
                                };
                            } catch (toolError: any) {
                                this.logger.error(`Error executing tool ${toolName}`, toolError);
                                return {
                                    jsonrpc: "2.0",
                                    id: request.id,
                                    error: {
                                        code: -32603,
                                        message: `Tool execution error: ${toolError.message}`
                                    }
                                };
                            }
                        } else {
                            return {
                                jsonrpc: "2.0",
                                id: request.id,
                                error: {
                                    code: -32601,
                                    message: `Unknown tool: ${toolName}`
                                }
                            };
                        }
                    } else {
                        this.logger.error(`Unsupported request method: ${request.method}`);
                        return {
                            jsonrpc: "2.0",
                            id: request.id,
                            error: {
                                code: -32601,
                                message: `Method not found: ${request.method}`
                            }
                        };
                    }
                } catch (error: any) {
                    this.logger.error('Error handling request', error);
                    return {
                        jsonrpc: "2.0",
                        id: request.id || null,
                        error: {
                            code: -32000,
                            message: error instanceof Error ? error.message : String(error)
                        }
                    };
                }
            };

            this.logger.info('Connecting MCP server to HTTP streaming transport');
            await this.mcpServerSetup.server.connect(this.transport);

            this.logger.info(`Bitbucket MCP HTTP streaming server running on port ${this.port} at endpoint ${this.endpoint}`);
        } catch (error: any) {
            this.logger.error('Failed to start HTTP streaming server', {
                error: error instanceof Error ? error.message : String(error),
                stack: error instanceof Error ? error.stack : undefined
            });
            throw error;
        }
    }

    public async stop(): Promise<void> {
        try {
            this.logger.info('Stopping HTTP streaming server');
            await this.transport.close();
            this.logger.info('HTTP streaming server stopped');
        } catch (error: any) {
            this.logger.error('Error stopping HTTP streaming server', {
                error: error instanceof Error ? error.message : String(error),
                stack: error instanceof Error ? error.stack : undefined
            });
            throw error;
        }
    }
}
