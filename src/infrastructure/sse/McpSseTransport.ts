// Define the ServerTransport interface directly based on MCP SDK requirements
interface ServerTransport {
    request?: (request: any) => Promise<any>;
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
    private readonly app: express.Express;
    private server: http.Server | undefined;
    private readonly eventEmitters: Map<string, EventEmitter> = new Map();
    private readonly logger: winston.Logger;

    constructor(@inject(TYPES.Logger) logger: winston.Logger) {
        dotenv.config();
        this.port = process.env.PORT ? parseInt(process.env.PORT, 10) : 9000; // Initialize port from .env or default
        this.logger = logger;
        this.app = express();
        this.app.use(cors());
        this.app.use(express.json());
    }

    private port: number;

    setPort(port: number): void {
        this.port = port;
    }

    async start(): Promise<void> {
        return this.startWithPort(this.port);
    }
    
    private async startWithPort(port: number): Promise<void> {
        const sseRoute = '/sse';
        
        this.app.get(sseRoute, (req, res) => {
            const clientId = req.query.clientId as string || `client-${Date.now()}`;
            this.logger.info(`SSE connection established for client: ${clientId}`);
            
            res.setHeader('Content-Type', 'text/event-stream');
            res.setHeader('Cache-Control', 'no-cache');
            res.setHeader('Connection', 'keep-alive');
            res.flushHeaders();
            
            if (!this.eventEmitters.has(clientId)) {
                this.eventEmitters.set(clientId, new EventEmitter());
            }
            
            const emitter = this.eventEmitters.get(clientId)!;
            
            const messageHandler = (message: string) => {
                res.write(`data: ${message}\n\n`);
            };
            
            emitter.on('message', messageHandler);
            
            req.on('close', () => {
                this.logger.info(`SSE connection closed for client: ${clientId}`);
                emitter.off('message', messageHandler);
                if (emitter.listenerCount('message') === 0) {
                    this.eventEmitters.delete(clientId);
                }
            });
        });
        
        this.app.post(sseRoute, express.json(), async (req, res) => {
            const clientId = req.query.clientId as string || req.body.clientId;
            const requestData = req.body;
            
            if (!clientId) {
                res.status(400).json({ error: 'Client ID is required' });
                return;
            }
            
            if (requestData && requestData.method) {
                if (!this.request) {
                    console.error('Request handler not set');
                    res.status(500).json({ error: 'Request handler not set' });
                    return;
                }
                
                try {
                    console.log(`Processing request: ${requestData.method}`, requestData.params);
                    
                    const response = await this.request(requestData);
                    
                    console.log(`Request ${requestData.id} processed successfully`);
                    
                    res.json(response);
                    
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
                if (this.eventEmitters.has(clientId)) {
                    res.json({ success: true });
                } else {
                    res.status(404).json({ error: 'Client connection not found' });
                }
            }
        });
        
        this.app.get('/health', (req, res) => {
            res.status(200).json({ status: 'ok' });
        });
        
        return new Promise((resolve) => {
            this.server = this.app.listen(port, () => {
                this.logger.info(`SSE server started on port ${port}`);
                resolve();
            });
        });
    }
    
    request: ((request: any) => Promise<any>) | undefined;
    
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
