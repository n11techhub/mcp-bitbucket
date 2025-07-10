import winston from 'winston';
import {injectable, inject} from 'inversify';
import {z} from 'zod';
import {TYPES} from '../types.js';
import {McpServerSetup} from '../setup/McpServerSetup.js';
import {McpHttpTransport} from './McpHttpTransport.js';

const McpRequestSchema = z.object({
    jsonrpc: z.literal('2.0'),
    method: z.string(),
    params: z.unknown().optional(),
    id: z.union([z.string(), z.number(), z.null()]).optional(),
});

type McpRequest = z.infer<typeof McpRequestSchema>;

interface ToolCallParams {
    name: string;
    arguments?: object;
}

function isToolCallParams(params: unknown): params is ToolCallParams {
    if (typeof params !== 'object' || params === null) {
        return false;
    }
    const p = params as any;
    return 'name' in p && typeof p.name === 'string';
}

@injectable()
export class McpHttpServer {
    private readonly transport: McpHttpTransport;
    private readonly mcpServerSetup: McpServerSetup;
    private readonly logger: winston.Logger;
    private port: number = 3001;
    private endpoint: string = '/mcp';

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

    private async _handleMcpRequest(request: any, headers: Record<string, string | string[] | undefined>) {
        const parseResult = McpRequestSchema.safeParse(request);

        if (!parseResult.success) {
            this.logger.error('Received an invalid request object.', {
                request,
                errors: parseResult.error.flatten(),
            });
            
            // Check if this is a notification (no id field) - if so, ignore silently
            const hasIdField = request && typeof request === 'object' && 'id' in request;
            if (!hasIdField) {
                this.logger.warn('Invalid notification received, ignoring silently');
                return null;
            }
            
            const id = request.id;
            return {
                jsonrpc: '2.0',
                id: (typeof id === 'string' || typeof id === 'number' || id === null) ? id : null,
                error: {
                    code: -32600,
                    message: 'Invalid JSON-RPC request.',
                },
            };
        }

        const mcpRequest = parseResult.data;

        try {
            this.logger.info(`[HTTP Transport] Processing request: ${mcpRequest.method}`);

            switch (mcpRequest.method) {
                case 'initialize':
                    return this._handleInitialize(mcpRequest);
                case 'ping':
                    return this._handlePing(mcpRequest);
                case 'notifications/initialized':
                    return this._handleNotificationsInitialized(mcpRequest);
                case 'shutdown':
                    return this._handleShutdown(mcpRequest);
                case 'tools/list':
                    return this._handleToolsList(mcpRequest);
                case 'tools/call':
                    return await this._handleToolsCall(mcpRequest, headers);
                default:
                    return this._handleUnknownMethod(mcpRequest);
            }
        } catch (error: any) {
            this.logger.error('Error handling request', error);
            return {
                jsonrpc: "2.0",
                id: mcpRequest.id,
                error: {
                    code: -32000,
                    message: error instanceof Error ? error.message : String(error)
                }
            };
        }
    }

    private _handleInitialize(request: McpRequest) {
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
    }

    private _handlePing(request: McpRequest) {
        this.logger.info('Handling ping request');
        return {
            jsonrpc: "2.0",
            id: request.id,
            result: {status: 'ok', timestamp: new Date().toISOString()}
        };
    }

    private _handleNotificationsInitialized(request: McpRequest) {
        this.logger.info('Handling notifications/initialized notification');
        return {
            jsonrpc: "2.0",
            id: request.id,
            result: {}
        };
    }

    private _handleShutdown(request: McpRequest) {
        this.logger.info('Handling shutdown request');
        return {
            jsonrpc: "2.0",
            id: request.id,
            result: {status: 'ok', timestamp: new Date().toISOString()}
        };
    }

    private _handleToolsList(request: McpRequest) {
        this.logger.info('Handling tools/list request');
        const tools = this.mcpServerSetup.getAvailableTools();
        return {
            jsonrpc: "2.0",
            id: request.id,
            result: {tools}
        };
    }

    private async _handleToolsCall(request: McpRequest, headers: Record<string, string | string[] | undefined>) {
        this.logger.info(`Handling tools/call request for tool: ${request.params}`);

        if (!isToolCallParams(request.params)) {
            return {
                jsonrpc: '2.0',
                id: request.id,
                error: {
                    code: -32602,
                    message: "Invalid params: missing required field 'name' of type string.",
                },
            };
        }

        const toolName = request.params.name;

        if (!toolName.startsWith('bitbucket_')) {
            return {
                jsonrpc: "2.0",
                id: request.id,
                error: {
                    code: -32601,
                    message: `Unknown tool: ${toolName}`
                }
            };
        }

        try {
            const toolArgs = request.params.arguments ?? {};
            const apiKey = headers['x-api-key'] as string | undefined;
            const result = await this.mcpServerSetup.callTool(toolName, toolArgs, apiKey);
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
    }

    private _handleUnknownMethod(request: McpRequest) {
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

    public async start(): Promise<void> {
        try {
            this.logger.info(`Starting HTTP Streaming server on port ${this.port}`);
            await this.transport.start();
            this.transport.request = (request: any, headers: any) => this._handleMcpRequest(request, headers);

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
