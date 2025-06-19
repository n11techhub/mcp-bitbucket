import { inject, injectable } from 'inversify';
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import winston from 'winston';
import { TYPES } from '../types.js';
import { McpSseTransport } from './McpSseTransport.js';
import { McpServerSetup } from '../setup/McpServerSetup.js';

@injectable()
export class McpSseServer {
    private readonly transport: McpSseTransport;
    private readonly mcpServerSetup: McpServerSetup;
    private readonly logger: winston.Logger;
    private port: number = 9000;

    constructor(
        @inject(TYPES.McpSseTransport) transport: McpSseTransport,
        @inject(TYPES.McpServerSetup) mcpServerSetup: McpServerSetup,
        @inject(TYPES.Logger) logger: winston.Logger
    ) {
        this.transport = transport;
        this.mcpServerSetup = mcpServerSetup;
        this.logger = logger;
    }

    /**
     * Configure the server port
     * @param port Port number to run the SSE server on
     */
    public setPort(port: number): void {
        this.port = port;
    }

    /**
     * Start the SSE server
     */
    public async start(): Promise<void> {
        try {
            this.logger.info(`Starting SSE server on port ${this.port}`);
            
            this.transport.setPort(this.port);
            await this.transport.start();
            
            this.logger.info("Setting up SSE transport request handler");
            
            this.transport.request = async (request) => {
                try {
                    this.logger.debug(`[SSE Transport] Processing request: ${request.method}`, request);
                    
                    // Handle MCP protocol calls
                    if (request.method === 'mcp/0.2/call') {
                        const toolName = request.params.name;
                        this.logger.info(`Handling MCP tool call: ${toolName}`);
                        
                        // Get the list of available tools from the MCP server setup
                        const availableTools = this.mcpServerSetup.getAvailableTools();
                        
                        if (availableTools.some((tool: { name: string }) => tool.name === toolName)) {
                            try {
                                const result = await this.mcpServerSetup.callTool(toolName, request.params.parameters);
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
                    // For backward compatibility, still handle direct tool calls
                    } else if (request.method.startsWith('bitbucket_')) {
                        this.logger.info(`Handling Bitbucket tool call directly: ${request.method}`);
                        const result = await this.mcpServerSetup.callTool(request.method, request.params);
                        return {
                            jsonrpc: "2.0",
                            id: request.id,
                            result: result
                        };
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
            
            this.logger.info("Connecting MCP server to SSE transport");
            await this.mcpServerSetup.server.connect(this.transport);
            
            this.logger.info(`Bitbucket MCP SSE server running on port ${this.port}`);
        } catch (error) {
            this.logger.error('Failed to start SSE server', { 
                error: error instanceof Error ? error.message : String(error),
                stack: error instanceof Error ? error.stack : undefined
            });
            throw error;
        }
    }

    /**
     * Stop the SSE server
     */
    public async stop(): Promise<void> {
        try {
            this.logger.info('Stopping SSE server');
            await this.transport.close();
            this.logger.info('SSE server stopped');
        } catch (error) {
            this.logger.error('Error stopping SSE server', { 
                error: error instanceof Error ? error.message : String(error),
                stack: error instanceof Error ? error.stack : undefined
            });
            throw error;
        }
    }
}
