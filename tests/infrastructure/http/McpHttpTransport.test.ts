/**
 * @fileoverview Unit tests for src/infrastructure/http/McpHttpTransport.ts
 * Tests the HTTP transport implementation including Express server setup, SSE connections, and request handling
 */

import {jest} from '@jest/globals';
import {McpHttpTransport} from '../../../src/infrastructure/http/McpHttpTransport.js';

const mockApp = {
    use: jest.fn(),
    get: jest.fn(),
    post: jest.fn(),
    listen: jest.fn(),
};

const mockServer = {
    close: jest.fn(),
};

const mockLogger = {
    info: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
    warn: jest.fn(),
};

const mockResponse = {
    setHeader: jest.fn(),
    flushHeaders: jest.fn(),
    write: jest.fn(),
    end: jest.fn(),
    status: jest.fn().mockReturnThis(),
    json: jest.fn(),
};

const mockRequest = {
    on: jest.fn(),
    body: {},
    headers: {},
};

jest.mock('express', () => {
    const expressMock = jest.fn(() => mockApp);
    (expressMock as any).json = jest.fn();
    return expressMock;
});

jest.mock('cors', () => jest.fn());
jest.mock('helmet', () => jest.fn());

describe('McpHttpTransport', () => {
    let transport: McpHttpTransport;

    beforeEach(() => {
        jest.clearAllMocks();
        
        mockResponse.setHeader.mockImplementation(() => {});
        mockResponse.flushHeaders.mockImplementation(() => {});
        mockResponse.write.mockImplementation(() => {});
        mockResponse.end.mockImplementation(() => {});
        mockResponse.status.mockReturnValue(mockResponse);
        mockResponse.json.mockImplementation(() => {});
        
        mockRequest.on.mockImplementation(function (...args: any[]) {
            return mockRequest;
        });
        
        mockApp.listen.mockImplementation((...args: any[]) => {
            const callback = args[1];
            if (typeof callback === 'function') {
                callback();
            }
            return mockServer;
        });
        
        mockServer.close.mockImplementation((...args: any[]) => {
            const callback = args[0];
            if (typeof callback === 'function') {
                callback();
            }
        });

        transport = new McpHttpTransport(mockLogger as any);
    });

    describe('Constructor', () => {
        it('should initialize with default values', () => {
            expect(transport).toBeInstanceOf(McpHttpTransport);
            expect(mockLogger).toBeDefined();
        });
    });

    describe('Configuration Methods', () => {
        it('should set port correctly', () => {
            transport.setPort(8080);
            expect(transport).toBeInstanceOf(McpHttpTransport);
        });

        it('should set endpoint correctly', () => {
            transport.setEndpoint('/api/mcp');
            expect(transport).toBeInstanceOf(McpHttpTransport);
        });
    });

    describe('start()', () => {
        it('should set up Express app with middleware and endpoints', async () => {
            await transport.start();

            expect(mockApp.use).toHaveBeenCalledTimes(3);
            expect(mockApp.get).toHaveBeenCalledWith('/health', expect.any(Function));
            expect(mockApp.get).toHaveBeenCalledWith('/mcp', expect.any(Function));
            expect(mockApp.post).toHaveBeenCalledWith('/mcp', expect.any(Function));
            expect(mockApp.listen).toHaveBeenCalledWith(3001, expect.any(Function));
            expect(mockLogger.info).toHaveBeenCalledWith('HTTP Streaming transport started on port 3001');
        });

        it('should use custom port when set', async () => {
            transport.setPort(8080);
            await transport.start();

            expect(mockApp.listen).toHaveBeenCalledWith(8080, expect.any(Function));
            expect(mockLogger.info).toHaveBeenCalledWith('HTTP Streaming transport started on port 8080');
        });

        it('should use custom endpoint when set', async () => {
            transport.setEndpoint('/api/mcp');
            await transport.start();

            expect(mockApp.post).toHaveBeenCalledWith('/api/mcp', expect.any(Function));
            expect(mockApp.get).toHaveBeenCalledWith('/api/mcp', expect.any(Function));
        });
    });

    describe('Health Endpoint', () => {
        it('should respond with health status', async () => {
            await transport.start();

            const healthCall = mockApp.get.mock.calls.find((call: any) => call[0] === '/health');
            expect(healthCall).toBeDefined();
            
            const healthHandler = healthCall![1] as any;
            healthHandler(mockRequest, mockResponse);

            expect(mockResponse.status).toHaveBeenCalledWith(200);
            expect(mockResponse.json).toHaveBeenCalledWith({ status: 'ok' });
        });
    });

    describe('POST Endpoint', () => {
        let postHandler: any;

        beforeEach(async () => {
            await transport.start();
            const postCall = mockApp.post.mock.calls.find((call: any) => call[0] === '/mcp');
            postHandler = postCall![1] as any;
        });

        it('should handle successful requests', async () => {
            const mockRequestHandler = jest.fn().mockImplementation(() => Promise.resolve({ result: 'success' }));
            transport.request = mockRequestHandler;

            mockRequest.body = { method: 'test', params: {} };
            mockRequest.headers = { 'content-type': 'application/json' };

            await postHandler(mockRequest, mockResponse);

            expect(mockRequestHandler).toHaveBeenCalledWith(mockRequest.body, mockRequest.headers);
            expect(mockResponse.json).toHaveBeenCalledWith({ result: 'success' });
            expect(mockLogger.debug).toHaveBeenCalledWith('Received POST request', { method: 'test' });
        });

        it('should handle null responses with 204 status', async () => {
            transport.request = jest.fn().mockImplementation(() => Promise.resolve(null));

            mockRequest.body = { method: 'notification' };

            await postHandler(mockRequest, mockResponse);

            expect(mockResponse.status).toHaveBeenCalledWith(204);
            expect(mockResponse.end).toHaveBeenCalled();
        });

        it('should handle errors with 500 status', async () => {
            transport.request = jest.fn().mockImplementation(() => Promise.reject(new Error('Request failed')));

            mockRequest.body = { method: 'test' };

            await postHandler(mockRequest, mockResponse);

            expect(mockResponse.status).toHaveBeenCalledWith(500);
            expect(mockResponse.json).toHaveBeenCalledWith({
                error: {
                    code: -32000,
                    message: 'Request failed'
                }
            });
            expect(mockLogger.error).toHaveBeenCalledWith('Error handling POST request', { error: 'Request failed' });
        });

        it('should handle missing request handler', async () => {
            mockRequest.body = { method: 'test' };

            await postHandler(mockRequest, mockResponse);

            expect(mockResponse.status).toHaveBeenCalledWith(500);
            expect(mockResponse.json).toHaveBeenCalledWith({
                error: {
                    code: -32000,
                    message: 'Request handler not initialized'
                }
            });
        });
    });

    describe('GET Endpoint (SSE)', () => {
        let getHandler: any;

        beforeEach(async () => {
            await transport.start();
            const getCall = mockApp.get.mock.calls.find((call: any) => call[0] === '/mcp');
            getHandler = getCall![1] as any;
        });

        it('should set up SSE connection correctly', () => {
            getHandler(mockRequest, mockResponse);

            expect(mockResponse.setHeader).toHaveBeenCalledWith('Content-Type', 'text/event-stream');
            expect(mockResponse.setHeader).toHaveBeenCalledWith('Cache-Control', 'no-cache');
            expect(mockResponse.setHeader).toHaveBeenCalledWith('Connection', 'keep-alive');
            expect(mockResponse.flushHeaders).toHaveBeenCalled();
            expect(mockRequest.on).toHaveBeenCalledWith('close', expect.any(Function));
            expect(mockLogger.info).toHaveBeenCalledWith(expect.stringMatching(/Client connected:/));
        });

        it('should handle client disconnection', () => {
            getHandler(mockRequest, mockResponse);

            const closeCall = mockRequest.on.mock.calls.find((call: any) => call[0] === 'close');
            const closeHandler = closeCall![1] as Function;
            closeHandler();

            expect(mockLogger.info).toHaveBeenCalledWith(expect.stringMatching(/Client disconnected:/));
        });

        it('should handle SSE setup errors', () => {
            const errorResponse = {
                ...mockResponse,
                setHeader: jest.fn().mockImplementation(() => {
                    throw new Error('Header error');
                }),
                status: jest.fn().mockReturnThis(),
                end: jest.fn()
            };

            const getCall = mockApp.get.mock.calls.find((call: any) => call[0] === '/mcp');
            const getHandler = getCall![1] as Function;
            getHandler(mockRequest, errorResponse);

            expect(mockLogger.error).toHaveBeenCalledWith('Error setting up SSE connection', { error: 'Header error' });
            expect(errorResponse.status).toHaveBeenCalledWith(500);
            expect(errorResponse.end).toHaveBeenCalledWith('Error setting up event stream');
        });
    });

    describe('send()', () => {
        beforeEach(async () => {
            await transport.start();
        });

        it('should send data to connected clients', async () => {
            const getCall = mockApp.get.mock.calls.find((call: any) => call[0] === '/mcp');
            const getHandler = getCall![1] as Function;
            getHandler(mockRequest, mockResponse);

            const testData = { id: 1, result: 'test result' };
            await transport.send(testData);

            expect(mockResponse.write).toHaveBeenCalledWith(expect.stringMatching(/id: \d+/));
            expect(mockResponse.write).toHaveBeenCalledWith('event: message\n');
            expect(mockResponse.write).toHaveBeenCalledWith(expect.stringMatching(/data: \{.*"result":"test result".*}/));
            expect(mockLogger.debug).toHaveBeenCalledWith('McpHttpTransport.send', { data: testData });
        });

        it('should handle data with error property', async () => {
            const getCall = mockApp.get.mock.calls.find((call: any) => call[0] === '/mcp');
            const getHandler = getCall![1] as Function;
            getHandler(mockRequest, mockResponse);

            const testData = { id: 1, error: { code: -32001, message: 'Test error' } };
            await transport.send(testData);

            expect(mockResponse.write).toHaveBeenCalledWith(expect.stringMatching(/data: \{.*"error":\{"code":-32001,"message":"Test error"}.*}/));
        });

        it('should handle client write errors and remove connection', async () => {
            const getCall = mockApp.get.mock.calls.find((call: any) => call[0] === '/mcp');
            const getHandler = getCall![1] as Function;
            
            getHandler(mockRequest, mockResponse);

            mockResponse.write.mockImplementation(() => {
                throw new Error('Write error');
            });

            const testData = { result: 'test' };
            await transport.send(testData);

            expect(mockLogger.error).toHaveBeenCalledWith(expect.stringMatching(/Error sending to client/), { error: 'Write error' });
        });

        it('should handle send method errors', async () => {
            const originalStringify = JSON.stringify;
            (global as any).JSON = {
                ...JSON,
                stringify: jest.fn().mockImplementation(() => {
                    throw new Error('Stringify error');
                })
            };

            const testData = { result: 'test' };
            await transport.send(testData);

            expect(mockLogger.error).toHaveBeenCalledWith('Error in send method', { error: 'Stringify error' });

            (global as any).JSON.stringify = originalStringify;
        });
    });

    describe('close()', () => {
        beforeEach(async () => {
            await transport.start();
        });

        it('should close all connections and server', async () => {
            const getCall = mockApp.get.mock.calls.find((call: any) => call[0] === '/mcp');
            const getHandler = getCall![1] as Function;
            getHandler(mockRequest, mockResponse);

            await transport.close();

            expect(mockResponse.end).toHaveBeenCalled();
            expect(mockServer.close).toHaveBeenCalled();
            expect(mockLogger.info).toHaveBeenCalledWith('HTTP server closed');
        });

        it('should handle connection close errors', async () => {
            const getCall = mockApp.get.mock.calls.find((call: any) => call[0] === '/mcp');
            const getHandler = getCall![1] as Function;
            
            getHandler(mockRequest, mockResponse);

            mockResponse.end.mockImplementation(() => {
                throw new Error('End error');
            });

            await transport.close();

            expect(mockLogger.error).toHaveBeenCalledWith('Error closing connection', { error: 'End error' });
        });

        it('should handle server close errors', async () => {
            mockServer.close.mockImplementation((...args: any[]) => {
                const callback = args[0];
                if (typeof callback === 'function') {
                    callback(new Error('Server close error'));
                }
            });

            await expect(transport.close()).rejects.toThrow('Server close error');
            expect(mockLogger.error).toHaveBeenCalledWith('Error closing HTTP server', { error: 'Server close error' });
        });

        it('should resolve when no server to close', async () => {
            const newTransport = new McpHttpTransport(mockLogger as any);
            await expect(newTransport.close()).resolves.toBeUndefined();
        });
    });

    describe('request setter', () => {
        it('should set request handler', () => {
            transport.request = jest.fn();
            expect(transport).toBeInstanceOf(McpHttpTransport);
        });
    });

    describe('Integration Scenarios', () => {
        it('should handle complete lifecycle with multiple clients', async () => {
            await transport.start();

            transport.request = jest.fn().mockImplementation(() => Promise.resolve({result: 'success'}));

            const getCall = mockApp.get.mock.calls.find((call: any) => call[0] === '/mcp');
            const getHandler = getCall![1] as Function;
            
            const mockResponse1 = { ...mockResponse, write: jest.fn(), end: jest.fn() };
            const mockResponse2 = { ...mockResponse, write: jest.fn(), end: jest.fn() };
            const mockRequest1 = { ...mockRequest, on: jest.fn() };
            const mockRequest2 = { ...mockRequest, on: jest.fn() };

            getHandler(mockRequest1, mockResponse1);
            getHandler(mockRequest2, mockResponse2);

            await transport.send({ result: 'broadcast message' });

            expect(mockResponse1.write).toHaveBeenCalledWith(expect.stringContaining('broadcast message'));
            expect(mockResponse2.write).toHaveBeenCalledWith(expect.stringContaining('broadcast message'));

            await transport.close();

            expect(mockResponse1.end).toHaveBeenCalled();
            expect(mockResponse2.end).toHaveBeenCalled();
        });

        it('should handle mixed POST and SSE operations', async () => {
            await transport.start();

            const mockRequestHandler = jest.fn().mockImplementation(() => Promise.resolve({ result: 'post response' }));
            transport.request = mockRequestHandler;

            const freshMockResponse = {
                setHeader: jest.fn(),
                flushHeaders: jest.fn(),
                write: jest.fn(),
                end: jest.fn(),
                status: jest.fn().mockReturnThis(),
                json: jest.fn(),
            };
            
            const freshMockRequest = {
                on: jest.fn().mockImplementation((...args: any[]) => mockRequest),
                body: { method: 'test' },
                headers: {},
            };

            const getCall = mockApp.get.mock.calls.find((call: any) => call[0] === '/mcp');
            const getHandler = getCall![1] as Function;
            getHandler(freshMockRequest, freshMockResponse);

            const postCall = mockApp.post.mock.calls.find((call: any) => call[0] === '/mcp');
            const postHandler = postCall![1] as Function;
            
            await postHandler(freshMockRequest, freshMockResponse);
            await transport.send({ result: 'sse message' });

            expect(mockRequestHandler).toHaveBeenCalled();
            expect(freshMockResponse.write).toHaveBeenCalledWith(expect.stringContaining('sse message'));
        });
    });
}); 