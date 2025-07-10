import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import winston from 'winston';

export interface Transport {
    request?: (request: any) => Promise<any>;

    start(): Promise<void>;

    send(data: any): Promise<void>;

    close(): Promise<void>;
}

export class McpHttpTransport implements Transport {
    private readonly connections: Map<string, express.Response> = new Map();
    private readonly logger: winston.Logger;
    private requestHandler: any = null;
    private port: number = 3001;
    private httpServer: any = null;
    private endpoint: string = '/mcp';
    private readonly app = express();

    constructor(logger: winston.Logger) {
        this.logger = logger;
    }

    public setPort(port: number): void {
        this.port = port;
    }

    public setEndpoint(endpoint: string): void {
        this.endpoint = endpoint;
    }

    public async start(): Promise<void> {
        this.app.use(helmet());
        this.app.use(cors());
        this.app.use(express.json());

        this.app.get('/health', (req, res) => {
            res.status(200).json({status: 'ok'});
        });

        this.app.post(this.endpoint, async (req, res) => {
            try {
                if (!this.requestHandler) {
                    throw new Error('Request handler not initialized');
                }

                const body = req.body;
                const headers = req.headers;
                this.logger.debug('Received POST request', {method: body.method});
                const response = await this.requestHandler(body, headers);
                
                // If response is null (e.g., for invalid notifications), send 204 No Content
                if (response === null) {
                    res.status(204).end();
                    return;
                }
                
                res.json(response);
            } catch (error: any) {
                this.logger.error('Error handling POST request', {error: error.message});
                res.status(500).json({
                    error: {
                        code: -32000,
                        message: error.message ?? 'Internal server error'
                    }
                });
            }
        });

        this.app.get(this.endpoint, (req, res) => {
            try {
                const connectionId = `${Date.now()}-${Math.random().toString(36).substring(2, 15)}`;

                res.setHeader('Content-Type', 'text/event-stream');
                res.setHeader('Cache-Control', 'no-cache');
                res.setHeader('Connection', 'keep-alive');
                res.flushHeaders();

                this.connections.set(connectionId, res);
                this.logger.info(`Client connected: ${connectionId}`);

                req.on('close', () => {
                    this.connections.delete(connectionId);
                    this.logger.info(`Client disconnected: ${connectionId}`);
                });

                const keepAliveInterval = setInterval(() => {
                    if (this.connections.has(connectionId)) {
                        res.write(':\n\n');
                    }
                }, 30000);

                req.on('close', () => {
                    clearInterval(keepAliveInterval);
                });
            } catch (error: any) {
                this.logger.error('Error setting up SSE connection', {error: error.message});
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

    public async send(data: any): Promise<void> {
        try {
            this.logger.debug('McpHttpTransport.send', {data});

            const jsonRpcResponse = {
                jsonrpc: "2.0",
                id: data.id ?? null,
                ...(data.error
                        ? {error: typeof data.error === 'object' ? data.error : {code: -32000, message: data.error}}
                        : {result: data.result ?? data}
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
                    this.logger.error(`Error sending to client ${id}`, {error: error.message});
                    this.connections.delete(id);
                }
            });
        } catch (error: any) {
            this.logger.error('Error in send method', {error: error.message});
        }
    }

    public async close(): Promise<void> {
        this.connections.forEach((res) => {
            try {
                res.end();
            } catch (error: any) {
                this.logger.error('Error closing connection', {error: error.message});
            }
        });

        this.connections.clear();

        if (this.httpServer) {
            return new Promise<void>((resolve, reject) => {
                this.httpServer.close((err: any) => {
                    if (err) {
                        this.logger.error('Error closing HTTP server', {error: err.message});
                        reject(err instanceof Error ? err : new Error(String(err)));
                    } else {
                        this.logger.info('HTTP server closed');
                        resolve();
                    }
                });
            });
        }

        return Promise.resolve();
    }

    set request(handler: any) {
        this.requestHandler = handler;
    }
}
