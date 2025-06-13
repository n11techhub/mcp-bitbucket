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
            
            // Configure and start the SSE transport
            this.transport.setPort(this.port);
            await this.transport.start();
            
            // Manually set the request handler on our transport directly
            this.logger.info("Setting up SSE transport request handler");
            
            // Define the tool call request handler
            this.transport.onrequest = async (request) => {
                this.logger.info(`[SSE Transport] Processing request: ${request.method}`);
                
                // Special handling for list_tools request
                if (request.method === 'list_tools') {
                    this.logger.info('Handling list_tools request');
                    return {
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
                    };
                }
                
                // Forward the request to our tool handler map
                try {
                    if (request.method.startsWith('bitbucket_')) {
                        // This is a tool call - call the appropriate Bitbucket usecase method
                        this.logger.info(`Handling Bitbucket tool call: ${request.method}`);
                        return await this.mcpServerSetup.callTool(request.method, request.params);
                    } else {
                        // Unknown request
                        this.logger.error(`Unsupported request method: ${request.method}`);
                        return { error: `Unsupported request method: ${request.method}` };
                    }
                } catch (error) {
                    this.logger.error('Error handling request', error);
                    return { error: error instanceof Error ? error.message : String(error) };
                }
            };
            
            // Connect the MCP server to the SSE transport
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
