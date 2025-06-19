import express from 'express';
import cors from 'cors';
import winston from 'winston';
import { injectable, inject } from 'inversify';
import { TYPES } from '../types.js';
import { McpServerSetup } from '../setup/McpServerSetup.js';

// Define Transport interface directly instead of importing from SDK
interface Transport {
    request?: (request: any) => Promise<any>;
    start(): Promise<void>;
    send(data: any): Promise<void>;
    close(): Promise<void>;
}

/**
 * Custom transport for HTTP streaming
 */
export class McpHttpTransport implements Transport {
    private connections: Map<string, express.Response> = new Map();
    private logger: winston.Logger;
    private requestHandler: any = null;
    private port: number = 3001;
    private httpServer: any = null;
    private endpoint: string = '/stream';
    private app = express();

    constructor(logger: winston.Logger) {
        this.logger = logger;
    }

    /**
     * Set the port for the HTTP server
     */
    public setPort(port: number): void {
        this.port = port;
    }

    /**
     * Set the streaming endpoint path
     */
    public setEndpoint(endpoint: string): void {
        this.endpoint = endpoint;
    }

    /**
     * Start the transport
     */
    public async start(): Promise<void> {
        // Configure Express middleware
        this.app.use(cors());
        this.app.use(express.json());

        // Health check endpoint
        this.app.get('/health', (req, res) => {
            res.status(200).json({ status: 'ok' });
        });

        // Handle POST requests for JSON-RPC
        this.app.post(this.endpoint, async (req, res) => {
            try {
                if (!this.requestHandler) {
                    throw new Error('Request handler not initialized');
                }

                const body = req.body;
                this.logger.debug('Received POST request', { method: body.method });
                const response = await this.requestHandler(body);
                res.json(response);
            } catch (error: any) {
                this.logger.error('Error handling POST request', { error: error.message });
                res.status(500).json({
                    error: {
                        code: -32000,
                        message: error.message || 'Internal server error'
                    }
                });
            }
        });

        // Handle GET requests for SSE streaming
        this.app.get(this.endpoint, (req, res) => {
            try {
                const connectionId = `${Date.now()}-${Math.random().toString(36).substring(2, 15)}`;
                
                // Set headers for SSE
                res.setHeader('Content-Type', 'text/event-stream');
                res.setHeader('Cache-Control', 'no-cache');
                res.setHeader('Connection', 'keep-alive');
                res.flushHeaders();
                
                // Store connection
                this.connections.set(connectionId, res);
                this.logger.info(`Client connected: ${connectionId}`);
                
                // Handle client disconnect
                req.on('close', () => {
                    this.connections.delete(connectionId);
                    this.logger.info(`Client disconnected: ${connectionId}`);
                });
                
                // Keep-alive
                const keepAliveInterval = setInterval(() => {
                    if (this.connections.has(connectionId)) {
                        res.write(':\n\n'); // SSE comment for keep-alive
                    }
                }, 30000);
                
                req.on('close', () => {
                    clearInterval(keepAliveInterval);
                });
            } catch (error: any) {
                this.logger.error('Error setting up SSE connection', { error: error.message });
                res.status(500).end('Error setting up event stream');
            }
        });

        return new Promise<void>((resolve) => {
            this.httpServer = this.app.listen(this.port, () => {
                this.logger.info(`HTTP Streaming transport started on port ${this.port}`);
                resolve();
            });
        });
    }

    /**
     * Send data to all connected clients
     */
    public async send(data: any): Promise<void> {
        try {
            this.logger.debug('McpHttpTransport.send', { data });
            
            // Ensure the response conforms to JSON-RPC 2.0 spec
            const jsonRpcResponse = {
                jsonrpc: "2.0",
                id: data.id || null,  // Use null if id is not provided
                // Only include either result or error
                ...(data.error 
                    ? { error: typeof data.error === 'object' ? data.error : { code: -32000, message: data.error } }
                    : { result: data.result || data } // If result is present use it, otherwise assume data is the result
                )
            };
            
            const serialized = JSON.stringify(jsonRpcResponse);
            const timestamp = Date.now();
            
            this.connections.forEach((res, id) => {
                try {
                    res.write(`id: ${timestamp}\n`);
                    res.write(`event: message\n`);
                    res.write(`data: ${serialized}\n\n`);
                } catch (error: any) {
                    this.logger.error(`Error sending to client ${id}`, { error: error.message });
                    // Remove dead connections
                    this.connections.delete(id);
                }
            });
        } catch (error: any) {
            this.logger.error('Error in send method', { error: error.message });
        }
    }

    /**
     * Close the transport
     */
    public async close(): Promise<void> {
        // Close all connections
        this.connections.forEach((res) => {
            try {
                res.end();
            } catch (error: any) {
                this.logger.error('Error closing connection', { error: error.message });
            }
        });
        
        this.connections.clear();
        
        // Stop the server
        if (this.httpServer) {
            return new Promise<void>((resolve, reject) => {
                this.httpServer.close((err: any) => {
                    if (err) {
                        this.logger.error('Error closing HTTP server', { error: err.message });
                        reject(err);
                    } else {
                        this.logger.info('HTTP server closed');
                        resolve();
                    }
                });
            });
        }
        
        return Promise.resolve();
    }

    /**
     * Set the request handler
     */
    set request(handler: any) {
        this.requestHandler = handler;
    }
}

/**
 * HTTP Streaming server for MCP
 * This implements a bidirectional HTTP streaming server using Express
 */
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

    /**
     * Set the server port
     */
    public setPort(port: number): void {
        this.port = port;
        this.transport.setPort(port);
    }

    /**
     * Set the streaming endpoint path
     */
    public setEndpoint(endpoint: string): void {
        this.endpoint = endpoint;
        this.transport.setEndpoint(endpoint);
    }

    /**
     * Start the HTTP server
     */
    public async start(): Promise<void> {
        try {
            this.logger.info(`Starting HTTP Streaming server on port ${this.port}`);
            
            // Start the transport
            await this.transport.start();
            
            // Set up request handler
            this.transport.request = async (request: any) => {
                this.logger.info(`[HTTP Transport] Processing request: ${request.method}`);
                
                // Handle standard MCP protocol methods
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
                                }
                            }
                        }
                    };
                } else if (request.method === 'shutdown') {
                    this.logger.info('Handling shutdown request');
                    return {
                        jsonrpc: "2.0",
                        id: request.id,
                        result: null
                    };
                } else if (request.method === 'list_tools') {
                    this.logger.info('Handling list_tools request');
                    return {
                        jsonrpc: "2.0",
                        id: request.id,
                        result: {
                            tools: [
                                { name: 'bitbucket_create_pull_request', description: 'Creates a new Bitbucket pull request' },
                                { name: 'bitbucket_get_pull_request_details', description: 'Gets details for a Bitbucket pull request' },
                                { name: 'bitbucket_get_pull_request_diff', description: 'Gets the diff for a Bitbucket pull request' },
                                { name: 'bitbucket_get_pull_request_reviews', description: 'Gets reviews for a Bitbucket pull request' },
                                { name: 'bitbucket_merge_pull_request', description: 'Merges a Bitbucket pull request' },
                                { name: 'bitbucket_decline_pull_request', description: 'Declines a Bitbucket pull request' },
                                { name: 'bitbucket_add_pull_request_comment', description: 'Adds a general comment to a Bitbucket pull request' },
                                { name: 'bitbucket_add_pull_request_file_line_comment', description: 'Adds a comment to a Bitbucket pull request on a specific file line' },
                                { name: 'bitbucket_list_repositories', description: 'Lists Bitbucket repositories' },
                                { name: 'bitbucket_list_workspaces', description: 'Lists available Bitbucket workspaces' },
                                { name: 'bitbucket_list_repository_branches', description: 'Lists branches for a Bitbucket repository' },
                                { name: 'bitbucket_get_repository_details', description: 'Gets details for a specific Bitbucket repository' },
                                { name: 'bitbucket_search_content', description: 'Searches content within Bitbucket repositories' },
                                { name: 'bitbucket_get_file_content', description: 'Gets the content of a specific file from a Bitbucket repository' },
                                { name: 'bitbucket_create_branch', description: 'Creates a new branch in a Bitbucket repository' },
                                { name: 'bitbucket_get_user_profile', description: 'Gets Bitbucket user profile details by username' }
                            ]
                        }
                    };
                }
                
                try {
                    if (request.method.startsWith('bitbucket_')) {
                        this.logger.info(`Handling Bitbucket tool call: ${request.method}`);
                        const result = await this.mcpServerSetup.callTool(request.method, request.params);
                        return {
                            jsonrpc: "2.0",
                            id: request.id, // Pass through the request ID
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
            
            // Connect the MCP server to the transport
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
    
    /**
     * Stop the HTTP server
     */
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
