const transportInstances: any[] = [];

jest.mock('@modelcontextprotocol/sdk/server/streamableHttp.js', () => {
    class MockStreamableHTTPServerTransport {
        public readonly options: any;
        public sessionId?: string;
        public onclose?: () => void;
        public handleRequest = jest.fn(async () => {
            if (!this.sessionId && this.options?.sessionIdGenerator && this.options?.onsessioninitialized) {
                this.sessionId = this.options.sessionIdGenerator();
                this.options.onsessioninitialized(this.sessionId);
            }
        });
        public close = jest.fn(async () => {
            if (this.onclose) {
                this.onclose();
            }
        });

        constructor(options: any) {
            this.options = options;
            transportInstances.push(this);
        }
    }

    return {
        StreamableHTTPServerTransport: MockStreamableHTTPServerTransport,
    };
});

let lastApp: any;

jest.mock('express', () => {
    const expressFn: any = jest.fn(() => {
        lastApp = {
            use: jest.fn(),
            get: jest.fn(),
            post: jest.fn(),
            delete: jest.fn(),
            listen: jest.fn((_port: number, cb?: () => void) => {
                if (cb) {
                    cb();
                }
                return {
                    close: jest.fn((done?: (err?: unknown) => void) => {
                        if (done) {
                            done();
                        }
                    }),
                };
            }),
        };
        return lastApp;
    });

    expressFn.json = jest.fn(() => 'json-middleware');
    expressFn.__getLastApp = () => lastApp;

    return {
        __esModule: true,
        default: expressFn,
    };
});

import express from 'express';
import { McpHttpServer } from '../../../src/infrastructure/http-streaming/McpHttpServer.js';

describe('McpHttpServer', () => {
    const logger = {
        info: jest.fn(),
        error: jest.fn(),
    } as any;

    const fakeMcpServer = {
        server: {
            connect: jest.fn(async () => undefined),
        },
        close: jest.fn(async () => undefined),
    } as any;

    const mcpServerFactory = {
        create: jest.fn(() => fakeMcpServer),
    } as any;

    const mcpServerSetup = {
        configureServer: jest.fn(),
    } as any;

    beforeEach(() => {
        jest.clearAllMocks();
        transportInstances.length = 0;
    });

    function getRouteHandler(method: 'post' | 'get' | 'delete', path: string): any {
        const app = (express as any).__getLastApp();
        const calls = app[method].mock.calls as any[];
        const call = calls.find((c: any[]) => c[0] === path);
        return call?.[1];
    }

    function createResponseMock(): any {
        return {
            headersSent: false,
            status: jest.fn().mockReturnThis(),
            json: jest.fn(),
            send: jest.fn(),
        };
    }

    it('starts server and registers middleware/routes', async () => {
        const server = new McpHttpServer(mcpServerSetup, mcpServerFactory, logger);
        server.setPort(3100);
        server.setEndpoint('/mcp');

        await server.start();

        const app = (express as any).__getLastApp();
        expect(app.use).toHaveBeenCalledTimes(3);
        expect(app.get).toHaveBeenCalledWith('/health', expect.any(Function));
        expect(app.post).toHaveBeenCalledWith('/mcp', expect.any(Function));
        expect(app.get).toHaveBeenCalledWith('/mcp', expect.any(Function));
        expect(app.delete).toHaveBeenCalledWith('/mcp', expect.any(Function));
        expect(app.listen).toHaveBeenCalledWith(3100, expect.any(Function));
    });

    it('serves health endpoint with 200 status', async () => {
        const server = new McpHttpServer(mcpServerSetup, mcpServerFactory, logger);
        await server.start();

        const healthHandler = getRouteHandler('get', '/health');
        const res = createResponseMock();

        await healthHandler({} as any, res);

        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith({ status: 'ok' });
    });

    it('creates session on initialize request and connects MCP server', async () => {
        const server = new McpHttpServer(mcpServerSetup, mcpServerFactory, logger);
        await server.start();

        const postHandler = getRouteHandler('post', '/stream');
        const req = {
            headers: { 'x-api-key': 'secret' },
            body: { method: 'initialize', jsonrpc: '2.0' },
        } as any;
        const res = createResponseMock();

        await postHandler(req, res);

        expect(mcpServerFactory.create).toHaveBeenCalledTimes(1);
        expect(mcpServerSetup.configureServer).toHaveBeenCalledWith(fakeMcpServer, 'secret');
        expect(fakeMcpServer.server.connect).toHaveBeenCalledTimes(1);
        expect((server as any).sessions.size).toBe(1);
        expect(transportInstances.length).toBe(1);
        expect(transportInstances[0].handleRequest).toHaveBeenCalledWith(req, res, req.body);

        // Trigger onclose cleanup branch
        const sid = transportInstances[0].sessionId;
        transportInstances[0].onclose?.();
        expect((server as any).sessions.has(sid)).toBe(false);
        expect(fakeMcpServer.close).toHaveBeenCalled();

        // onclose should be idempotent once unset
        transportInstances[0].onclose?.();
    });

    it('routes request to existing session transport', async () => {
        const server = new McpHttpServer(mcpServerSetup, mcpServerFactory, logger);
        await server.start();

        const existingTransport = { handleRequest: jest.fn(async () => undefined), close: jest.fn(async () => undefined) };
        const existingServer = { close: jest.fn(async () => undefined) };
        (server as any).sessions.set('sid-1', { transport: existingTransport, server: existingServer });

        const postHandler = getRouteHandler('post', '/stream');
        const req = { headers: { 'mcp-session-id': 'sid-1' }, body: { method: 'tools/list' } } as any;
        const res = createResponseMock();

        await postHandler(req, res);

        expect(existingTransport.handleRequest).toHaveBeenCalledWith(req, res, req.body);
    });

    it('returns 400 for invalid POST without session id and without initialize', async () => {
        const server = new McpHttpServer(mcpServerSetup, mcpServerFactory, logger);
        await server.start();

        const postHandler = getRouteHandler('post', '/stream');
        const req = { headers: {}, body: { method: 'tools/list' } } as any;
        const res = createResponseMock();

        await postHandler(req, res);

        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
            jsonrpc: '2.0',
            id: null,
        }));
    });

    it('sanitizes JSON responses for MCP routes', async () => {
        const server = new McpHttpServer(mcpServerSetup, mcpServerFactory, logger);
        await server.start();

        const postHandler = getRouteHandler('post', '/stream');
        const req = { headers: {}, body: { method: 'tools/list' } } as any;

        const res = {
            headersSent: false,
            status: jest.fn().mockReturnThis(),
            json: jest.fn().mockReturnThis(),
            send: jest.fn(),
        };

        await postHandler(req, res as any);

        expect(res.status).toHaveBeenCalledWith(400);
        const payload = (res.json as jest.Mock).mock.calls[0][0];
        expect(payload).toEqual(expect.objectContaining({
            jsonrpc: '2.0',
            error: { code: -32000, message: 'Bad Request: No valid session ID provided' },
            id: null,
        }));
    });

    it('stops server and closes sessions', async () => {
        const server = new McpHttpServer(mcpServerSetup, mcpServerFactory, logger);
        await server.start();

        const sessionTransport = { close: jest.fn(async () => undefined) };
        const sessionServer = { close: jest.fn(async () => undefined) };
        (server as any).sessions.set('sid-1', { transport: sessionTransport, server: sessionServer });

        await server.stop();

        expect(sessionTransport.close).toHaveBeenCalledTimes(1);
        expect(sessionServer.close).toHaveBeenCalledTimes(1);
        expect((server as any).sessions.size).toBe(0);
    });

    it('returns 400 for GET and DELETE when session id is missing', async () => {
        const server = new McpHttpServer(mcpServerSetup, mcpServerFactory, logger);
        await server.start();

        const getHandler = getRouteHandler('get', '/stream');
        const delHandler = getRouteHandler('delete', '/stream');
        const getRes = createResponseMock();
        const delRes = createResponseMock();

        await getHandler({ headers: {} } as any, getRes);
        await delHandler({ headers: {} } as any, delRes);

        expect(getRes.status).toHaveBeenCalledWith(400);
        expect(getRes.send).toHaveBeenCalledWith('Invalid or missing session ID');
        expect(delRes.status).toHaveBeenCalledWith(400);
        expect(delRes.send).toHaveBeenCalledWith('Invalid or missing session ID');
    });

    it('handles GET/DELETE transport errors with 500 response', async () => {
        const server = new McpHttpServer(mcpServerSetup, mcpServerFactory, logger);
        await server.start();

        const failingTransport = { handleRequest: jest.fn(async () => { throw new Error('boom'); }), close: jest.fn(async () => undefined) };
        const failingServer = { close: jest.fn(async () => undefined) };
        (server as any).sessions.set('sid-fail', { transport: failingTransport, server: failingServer });

        const getHandler = getRouteHandler('get', '/stream');
        const delHandler = getRouteHandler('delete', '/stream');
        const getRes = createResponseMock();
        const delRes = createResponseMock();

        await getHandler({ headers: { 'mcp-session-id': 'sid-fail' } } as any, getRes);
        await delHandler({ headers: { 'mcp-session-id': 'sid-fail' } } as any, delRes);

        expect(getRes.status).toHaveBeenCalledWith(500);
        expect(getRes.send).toHaveBeenCalledWith('Internal server error');
        expect(delRes.status).toHaveBeenCalledWith(500);
        expect(delRes.send).toHaveBeenCalledWith('Internal server error');
    });

    it('handles POST errors and returns 500 when response not sent yet', async () => {
        const server = new McpHttpServer(mcpServerSetup, mcpServerFactory, logger);
        await server.start();

        mcpServerFactory.create.mockImplementation(() => {
            throw new Error('factory failed');
        });

        const postHandler = getRouteHandler('post', '/stream');
        const req = { headers: {}, body: { method: 'initialize', jsonrpc: '2.0' } } as any;
        const res = createResponseMock();

        await postHandler(req, res);

        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
            error: expect.objectContaining({ code: -32603 }),
        }));
    });

    it('does not write 500 response when POST error happens after headers sent', async () => {
        const server = new McpHttpServer(mcpServerSetup, mcpServerFactory, logger);
        await server.start();

        mcpServerFactory.create.mockImplementation(() => {
            throw new Error('factory failed');
        });

        const postHandler = getRouteHandler('post', '/stream');
        const req = { headers: {}, body: { method: 'initialize', jsonrpc: '2.0' } } as any;
        const res = createResponseMock();
        res.headersSent = true;

        await postHandler(req, res);

        expect(res.status).not.toHaveBeenCalledWith(500);
    });

    it('continues shutdown when a session close fails', async () => {
        const server = new McpHttpServer(mcpServerSetup, mcpServerFactory, logger);
        await server.start();

        const badSession = {
            transport: { close: jest.fn(async () => { throw new Error('close failed'); }) },
            server: { close: jest.fn(async () => undefined) },
        };
        (server as any).sessions.set('sid-bad', badSession);

        await expect(server.stop()).resolves.toBeUndefined();
        expect(logger.error).toHaveBeenCalledWith(expect.stringContaining('Error closing session sid-bad'), expect.any(Object));
    });

    it('throws when http server close callback returns an error', async () => {
        const server = new McpHttpServer(mcpServerSetup, mcpServerFactory, logger);
        await server.start();

        (server as any).httpServer = {
            close: (done: (err?: unknown) => void) => done(new Error('close failed')),
        };

        await expect(server.stop()).rejects.toThrow('close failed');
        expect(logger.error).toHaveBeenCalledWith('Error stopping HTTP streaming server', expect.any(Object));
    });

    it('throws from start when app.listen fails', async () => {
        const server = new McpHttpServer(mcpServerSetup, mcpServerFactory, logger);
        const app = (server as any).app;
        app.listen.mockImplementation(() => {
            throw new Error('listen failed');
        });

        await expect(server.start()).rejects.toThrow('listen failed');
        expect(logger.error).toHaveBeenCalledWith('Failed to start HTTP streaming server', expect.any(Object));
    });
});

