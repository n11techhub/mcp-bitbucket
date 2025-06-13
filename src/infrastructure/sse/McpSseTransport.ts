// Define the ServerTransport interface directly based on MCP SDK requirements
interface ServerTransport {
    onrequest?: (request: any) => Promise<any>;
    start(): Promise<void>;
    send(data: any): Promise<void>;
    close(): Promise<void>;
}
import express from 'express';
import cors from 'cors';
import http from 'http';
import { EventEmitter } from 'events';
import winston from 'winston';
import { TYPES } from '../types.js';
import { inject, injectable } from 'inversify';
import * as dotenv from 'dotenv';

@injectable()
export class McpSseTransport implements ServerTransport {
    private app: express.Express;
    private server: http.Server | undefined;
    private eventEmitters: Map<string, EventEmitter> = new Map();
    private logger: winston.Logger;

    constructor(@inject(TYPES.Logger) logger: winston.Logger) {
        dotenv.config(); // Load .env variables
        this.port = process.env.PORT ? parseInt(process.env.PORT, 10) : 9000; // Initialize port from .env or default
        this.logger = logger;
        this.app = express();
        this.app.use(cors());
        this.app.use(express.json());
    }

    private port: number;

    // Set port configuration
    setPort(port: number): void {
        this.port = port;
    }

    // Start method to satisfy the Transport interface with no arguments
    async start(): Promise<void> {
        return this.startWithPort(this.port);
    }
    
    // Our implementation that takes a port
    private async startWithPort(port: number): Promise<void> {
        const sseRoute = '/sse';
        
        // Endpoint for SSE connections
        this.app.get(sseRoute, (req, res) => {
            const clientId = req.query.clientId as string || `client-${Date.now()}`;
            this.logger.info(`SSE connection established for client: ${clientId}`);
            
            // Set headers for SSE
            res.setHeader('Content-Type', 'text/event-stream');
            res.setHeader('Cache-Control', 'no-cache');
            res.setHeader('Connection', 'keep-alive');
            res.flushHeaders();
            
            // Create a new event emitter for this client if it doesn't exist
            if (!this.eventEmitters.has(clientId)) {
                this.eventEmitters.set(clientId, new EventEmitter());
            }
            
            const emitter = this.eventEmitters.get(clientId)!;
            
            // Event handler for sending messages to the client
            const messageHandler = (message: string) => {
                res.write(`data: ${message}\n\n`);
            };
            
            emitter.on('message', messageHandler);
            
            // Handle client disconnection
            req.on('close', () => {
                this.logger.info(`SSE connection closed for client: ${clientId}`);
                emitter.off('message', messageHandler);
                // Remove the emitter if no more listeners
                if (emitter.listenerCount('message') === 0) {
                    this.eventEmitters.delete(clientId);
                }
            });
        });
        
        // Handle client requests through POST
        this.app.post(sseRoute, express.json(), async (req, res) => {
            const clientId = req.query.clientId as string || req.body.clientId;
            const requestData = req.body;
            
            if (!clientId) {
                res.status(400).json({ error: 'Client ID is required' });
                return;
            }
            
            // If this request has a method, it should be handled by the MCP server
            if (requestData && requestData.method) {
                if (!this.onrequest) {
                    console.error('Request handler not set');
                    res.status(500).json({ error: 'Request handler not set' });
                    return;
                }
                
                try {
                    // Log the incoming request
                    console.log(`Processing request: ${requestData.method}`, requestData.params);
                    
                    // Process the request using the MCP server's handler
                    const response = await this.onrequest(requestData);
                    
                    // Log the successful response
                    console.log(`Request ${requestData.id} processed successfully`);
                    
                    // Send the response back to the client
                    res.json(response);
                    
                    // Also emit the response to the client's event stream if connected
                    if (this.eventEmitters.has(clientId)) {
                        const client = this.eventEmitters.get(clientId)!;
                        client.emit('message', JSON.stringify({
                            id: requestData.id,
                            result: response
                        }));
                    }
                } catch (error) {
                    console.error('Error processing request:', error);
                    res.status(500).json({ 
                        error: error instanceof Error ? error.message : String(error)
                    });
                }
            } else {
                // Regular data for the event stream
                if (this.eventEmitters.has(clientId)) {
                    res.json({ success: true });
                } else {
                    res.status(404).json({ error: 'Client connection not found' });
                }
            }
        });
        
        // Health check endpoint
        this.app.get('/health', (req, res) => {
            res.status(200).json({ status: 'ok' });
        });
        
        // Start the server
        return new Promise((resolve) => {
            this.server = this.app.listen(port, () => {
                this.logger.info(`SSE server started on port ${port}`);
                resolve();
            });
        });
    }
    
    onrequest: ((request: any) => Promise<any>) | undefined;
    
    async send(data: any): Promise<void> {
        // In SSE, we don't directly send responses here
        // Responses are sent directly in the request handler above
    }
    
    async close(): Promise<void> {
        if (this.server) {
            return new Promise((resolve) => {
                this.server!.close(() => {
                    this.logger.info('SSE server closed');
                    resolve();
                });
            });
        }
    }
}
