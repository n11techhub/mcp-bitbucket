import winston from 'winston';
import { injectable, inject } from 'inversify';
import { randomUUID } from 'node:crypto';
import type { Server as HttpServer } from 'node:http';
import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import {isInitializeRequest} from '@modelcontextprotocol/sdk/types.js';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { Types } from '../../application/Types.js';
import { McpServerSetup } from '../McpServerSetup.js';
import type { IMcpServerFactory } from '../../application/factory/IMcpServerFactory.js';

interface Session {
    transport: StreamableHTTPServerTransport;
    server: McpServer;
    expiresAt: number;
    ttlTimer?: NodeJS.Timeout;
}

@injectable()
export class McpHttpServer {
    private readonly mcpServerSetup: McpServerSetup;
    private readonly mcpServerFactory: IMcpServerFactory;
    private readonly logger: winston.Logger;
    private port: number = 3001;
    private endpoint: string = '/stream';
    private httpServer: HttpServer | null = null;
    private readonly app = express();
    private readonly sessions = new Map<string, Session>();
    private readonly isProduction = process.env.NODE_ENV === 'production';
    private readonly maxSessions = this.readPositiveInt(process.env.MCP_MAX_SESSIONS, 200);
    private readonly sessionTtlMs = this.readPositiveInt(process.env.MCP_SESSION_TTL_MS, 30 * 60 * 1000);
    private readonly corsOrigins = this.readCorsOrigins(process.env.MCP_CORS_ORIGIN);

    constructor(
        @inject(Types.McpServerSetup) mcpServerSetup: McpServerSetup,
        @inject(Types.McpServerFactory) mcpServerFactory: IMcpServerFactory,
        @inject(Types.Logger) logger: winston.Logger
    ) {
        this.mcpServerSetup = mcpServerSetup;
        this.mcpServerFactory = mcpServerFactory;
        this.logger = logger;
    }

    public setPort(port: number): void {
        this.port = port;
    }

    public setEndpoint(endpoint: string): void {
        this.endpoint = endpoint;
    }

    public async start(): Promise<void> {
        try {
            this.logger.info(`Starting HTTP Streaming server on port ${this.port}`);

            this.app.use(helmet());
            this.app.use(cors({
                origin: (origin, callback) => {
                    if (!origin && !this.isProduction) {
                        callback(null, true);
                        return;
                    }

                    if (!origin) {
                        callback(new Error('Origin header is required in production mode.'));
                        return;
                    }

                    if (this.corsOrigins.size === 0 && !this.isProduction) {
                        callback(null, true);
                        return;
                    }

                    if (this.corsOrigins.has(origin)) {
                        callback(null, true);
                        return;
                    }

                    callback(new Error('CORS origin is not allowed.'));
                },
                methods: ['GET', 'POST', 'DELETE'],
                allowedHeaders: ['content-type', 'mcp-session-id', 'x-api-key']
            }));
            this.app.use(express.json());

            this.app.get('/health', (req, res) => {
                res.status(200).json({status: 'ok'});
            });

            this.app.post(this.endpoint, async (req, res) => {
                try {
                    const sessionId = req.headers['mcp-session-id'] as string | undefined;
                    const apiKey = req.headers['x-api-key'] as string | undefined;

                    if (sessionId && this.sessions.has(sessionId)) {
                        const session = this.sessions.get(sessionId)!;
                        await session.transport.handleRequest(req, res, req.body);
                        return;
                    }

                    const isInitialize = isInitializeRequest(req.body) || req.body?.method === 'initialize';

                    if (!sessionId && isInitialize) {
                        if (this.sessions.size >= this.maxSessions) {
                            res.status(429).json({
                                jsonrpc: '2.0',
                                error: {
                                    code: -32001,
                                    message: 'Too many active MCP sessions'
                                },
                                id: req.body?.id ?? null
                            });
                            return;
                        }

                        const server = this.mcpServerFactory.create();
                        this.mcpServerSetup.configureServer(server, apiKey);

                        const transport = new StreamableHTTPServerTransport({
                            sessionIdGenerator: () => randomUUID(),
                            onsessioninitialized: (sid) => {
                                this.upsertSession(sid, transport, server);
                            }
                        });

                        let isClosing = false;
                        transport.onclose = () => {
                            if (isClosing) return;
                            isClosing = true;
                            if (transport.sessionId) {
                                this.clearSessionTimer(transport.sessionId);
                                this.sessions.delete(transport.sessionId);
                            }
                            transport.onclose = undefined;
                            server.close().catch(() => {});
                        };

                        await server.server.connect(transport as any);
                        await transport.handleRequest(req, res, req.body);
                        return;
                    }

                    res.status(400).json({
                        jsonrpc: '2.0',
                        error: {
                            code: -32000,
                            message: 'Bad Request: No valid session ID provided'
                        },
                        id: null
                    });
                } catch (error: unknown) {
                    const errorMessage = error instanceof Error ? error.message : String(error);
                    this.logger.error('Error handling MCP POST request', {error: errorMessage});
                    if (!res.headersSent) {
                        res.status(500).json({
                            jsonrpc: '2.0',
                            error: {
                                code: -32603,
                                message: 'Internal server error'
                            },
                            id: null
                        });
                    }
                }
            });

            this.app.get(this.endpoint, async (req, res) => {
                try {
                    const sessionId = req.headers['mcp-session-id'] as string | undefined;
                    if (!sessionId || !this.sessions.has(sessionId)) {
                        res.status(400).send('Invalid or missing session ID');
                        return;
                    }

                    const session = this.sessions.get(sessionId)!;
                    this.touchSession(sessionId);
                    await session.transport.handleRequest(req, res);
                } catch (error: unknown) {
                    const errorMessage = error instanceof Error ? error.message : String(error);
                    this.logger.error('Error handling MCP GET request', {error: errorMessage});
                    if (!res.headersSent) {
                        res.status(500).send('Internal server error');
                    }
                }
            });

            this.app.delete(this.endpoint, async (req, res) => {
                try {
                    const sessionId = req.headers['mcp-session-id'] as string | undefined;
                    if (!sessionId || !this.sessions.has(sessionId)) {
                        res.status(400).send('Invalid or missing session ID');
                        return;
                    }

                    const session = this.sessions.get(sessionId)!;
                    this.touchSession(sessionId);
                    await session.transport.handleRequest(req, res);
                } catch (error: unknown) {
                    const errorMessage = error instanceof Error ? error.message : String(error);
                    this.logger.error('Error handling MCP DELETE request', {error: errorMessage});
                    if (!res.headersSent) {
                        res.status(500).send('Internal server error');
                    }
                }
            });

            this.httpServer = this.app.listen(this.port, () => {
                this.logger.info(`Bitbucket MCP HTTP streaming server running on port ${this.port} at endpoint ${this.endpoint}`);
            });
        } catch (error: unknown) {
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

            for (const [sessionId, session] of this.sessions) {
                try {
                    this.clearSessionTimer(sessionId);
                    await session.transport.close();
                    await session.server.close();
                } catch (error: unknown) {
                    const errorMessage = error instanceof Error ? error.message : String(error);
                    this.logger.error(`Error closing session ${sessionId}`, {error: errorMessage});
                }
            }
            this.sessions.clear();

            if (this.httpServer) {
                await new Promise<void>((resolve, reject) => {
                    this.httpServer?.close((err?: Error) => {
                        if (err) {
                            reject(err);
                        } else {
                            resolve();
                        }
                    });
                });
            }
            this.logger.info('HTTP streaming server stopped');
        } catch (error: unknown) {
            this.logger.error('Error stopping HTTP streaming server', {
                error: error instanceof Error ? error.message : String(error),
                stack: error instanceof Error ? error.stack : undefined
            });
            throw error;
        }
    }

    private readPositiveInt(value: string | undefined, fallback: number): number {
        const parsed = value ? Number.parseInt(value, 10) : NaN;
        if (Number.isNaN(parsed) || parsed <= 0) {
            return fallback;
        }
        return parsed;
    }

    private readCorsOrigins(value: string | undefined): Set<string> {
        if (!value) {
            return new Set<string>();
        }
        return new Set(
            value
                .split(',')
                .map((entry) => entry.trim())
                .filter((entry) => entry.length > 0)
        );
    }

    private upsertSession(sessionId: string, transport: StreamableHTTPServerTransport, server: McpServer): void {
        this.clearSessionTimer(sessionId);
        const session: Session = {
            transport,
            server,
            expiresAt: Date.now() + this.sessionTtlMs
        };
        session.ttlTimer = setTimeout(() => {
            this.expireSession(sessionId);
        }, this.sessionTtlMs);
        session.ttlTimer.unref();
        this.sessions.set(sessionId, session);
    }

    private touchSession(sessionId: string): void {
        const existing = this.sessions.get(sessionId);
        if (!existing) {
            return;
        }
        this.upsertSession(sessionId, existing.transport, existing.server);
    }

    private clearSessionTimer(sessionId: string): void {
        const existing = this.sessions.get(sessionId);
        if (existing?.ttlTimer) {
            clearTimeout(existing.ttlTimer);
            existing.ttlTimer = undefined;
        }
    }

    private expireSession(sessionId: string): void {
        const session = this.sessions.get(sessionId);
        if (!session) {
            return;
        }

        this.logger.info(`Expiring MCP session ${sessionId}`);
        this.clearSessionTimer(sessionId);
        this.sessions.delete(sessionId);
        session.transport.close().catch(() => {});
        session.server.close().catch(() => {});
    }
}
