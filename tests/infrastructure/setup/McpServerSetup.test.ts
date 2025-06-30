/**
 * @fileoverview Unit tests for McpServerSetup
 * This file tests the McpServerSetup class, including tool registration,
 * request handling, authentication, and error management.
 */

import 'reflect-metadata';
import { jest } from '@jest/globals';
import { McpServerSetup } from '../../../src/infrastructure/setup/McpServerSetup.js';
import { IBitbucketClientFacade } from '../../../src/application/facade/IBitbucketClientFacade.js';
import { IBitbucketUseCase } from '../../../src/application/use-cases/IBitbucketUseCase.js';
import winston from 'winston';
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { CallToolRequestSchema, ErrorCode, ListToolsRequestSchema, McpError } from '@modelcontextprotocol/sdk/types.js';
import axios from 'axios';

jest.mock('@modelcontextprotocol/sdk/server/index.js');
jest.mock('axios');

const mockApi: jest.Mocked<IBitbucketClientFacade> = {
    createBitbucketPullRequest: jest.fn(),
    getBitbucketPullRequestDetails: jest.fn(),
    mergeBitbucketPullRequest: jest.fn(),
    declineBitbucketPullRequest: jest.fn(),
    addBitbucketGeneralPullRequestComment: jest.fn(),
    getBitbucketPullRequestDiff: jest.fn(),
    getBitbucketPullRequestReviews: jest.fn(),
    listBitbucketWorkspaces: jest.fn(),
    listBitbucketRepositories: jest.fn(),
    searchBitbucketContent: jest.fn(),
    getBitbucketRepositoryDetails: jest.fn(),
    getBitbucketFileContent: jest.fn(),
    createBitbucketBranch: jest.fn(),
    addBitbucketPullRequestFileLineComment: jest.fn(),
    listBitbucketRepositoryBranches: jest.fn(),
    getBitbucketUserDetails: jest.fn(),
    getDefaultProjectKey: jest.fn(),
};

const mockBitbucketUseCase: jest.Mocked<IBitbucketUseCase> = {
    bitbucketCreatePullRequest: jest.fn(),
    bitbucketGetPullRequestDetails: jest.fn(),
    bitbucketMergePullRequest: jest.fn(),
    bitbucketDeclinePullRequest: jest.fn(),
    bitbucketAddGeneralPullRequestComment: jest.fn(),
    bitbucketGetPullRequestDiff: jest.fn(),
    bitbucketGetPullRequestReviews: jest.fn(),
    bitbucketListWorkspaces: jest.fn(),
    bitbucketListRepositories: jest.fn(),
    bitbucketSearchContent: jest.fn(),
    bitbucketGetRepositoryDetails: jest.fn(),
    bitbucketGetFileContent: jest.fn(),
    bitbucketCreateBranch: jest.fn(),
    bitbucketAddPullRequestFileLineComment: jest.fn(),
    bitbucketListRepositoryBranches: jest.fn(),
    bitbucketGetUserDetails: jest.fn(),
};

const mockLogger: jest.Mocked<winston.Logger> = {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
} as any;

const MockedServer = Server as jest.MockedClass<typeof Server>;

describe('McpServerSetup', () => {
    let mcpServerSetup: McpServerSetup;
    const originalEnv = process.env;
    let serverInstance: jest.Mocked<Server>;

    beforeEach(() => {
        jest.clearAllMocks();
        process.env = { ...originalEnv };
        delete process.env.MCP_API_KEY;
        
        serverInstance = {
            setRequestHandler: jest.fn(),
            onerror: jest.fn(),
        } as any;
        MockedServer.mockImplementation(() => serverInstance);

        mcpServerSetup = new McpServerSetup(mockApi, mockBitbucketUseCase, mockLogger);
    });

    afterEach(() => {
        process.env = originalEnv;
    });

    describe('Constructor', () => {
        it('should initialize the server and register all tools', () => {
            expect(MockedServer).toHaveBeenCalledTimes(1);
            expect(mcpServerSetup.getAvailableTools().length).toBeGreaterThanOrEqual(16);
        });

        it('should warn if MCP_API_KEY is not set', () => {
            expect(mockLogger.warn).toHaveBeenCalledWith('MCP_API_KEY is not set. The server will not require authentication.');
        });

        it('should not warn if MCP_API_KEY is set', () => {
            process.env.MCP_API_KEY = 'test-key';
            mockLogger.warn.mockClear();
            new McpServerSetup(mockApi, mockBitbucketUseCase, mockLogger);
            expect(mockLogger.warn).not.toHaveBeenCalled();
        });

        it('should set up handlers for ListTools and CallTool requests', () => {
            expect(serverInstance.setRequestHandler).toHaveBeenCalledWith(ListToolsRequestSchema, expect.any(Function));
            expect(serverInstance.setRequestHandler).toHaveBeenCalledWith(CallToolRequestSchema, expect.any(Function));
        });
    });

    describe('Authentication', () => {
        beforeEach(() => {
            process.env.MCP_API_KEY = 'secret-key';
            mcpServerSetup = new McpServerSetup(mockApi, mockBitbucketUseCase, mockLogger);
        });

        it('should succeed with the correct API key', async () => {
            await expect(mcpServerSetup.callTool('bitbucket_list_workspaces', {}, 'secret-key')).resolves.not.toThrow();
            expect(mockLogger.info).toHaveBeenCalledWith('Authentication successful.');
        });

        it('should fail with an incorrect API key', async () => {
            await expect(mcpServerSetup.callTool('bitbucket_list_workspaces', {}, 'wrong-key'))
                .rejects.toThrow(new McpError(ErrorCode.InternalError, 'Authentication failed: Invalid or missing API key.'));
            expect(mockLogger.error).toHaveBeenCalledWith('Authentication failed: Invalid or missing API key.');
        });

        it('should fail with a missing API key', async () => {
            await expect(mcpServerSetup.callTool('bitbucket_list_workspaces', {}))
                .rejects.toThrow(new McpError(ErrorCode.InternalError, 'Authentication failed: Invalid or missing API key.'));
        });

        it('should not require authentication if MCP_API_KEY is not set', async () => {
            delete process.env.MCP_API_KEY;
            mcpServerSetup = new McpServerSetup(mockApi, mockBitbucketUseCase, mockLogger);
            await expect(mcpServerSetup.callTool('bitbucket_list_workspaces', {})).resolves.not.toThrow();
            expect(mockLogger.info).not.toHaveBeenCalledWith('Authentication successful.');
        });
    });

    describe('callTool', () => {
        it('should call the correct use case method with validated arguments', async () => {
            const input = { query: 'test' };
            const expectedResult = { success: true };
            mockBitbucketUseCase.bitbucketListWorkspaces.mockResolvedValue(expectedResult);

            const result = await mcpServerSetup.callTool('bitbucket_list_workspaces', input);

            expect(mockBitbucketUseCase.bitbucketListWorkspaces).toHaveBeenCalledWith(input);
            expect(result).toBe(expectedResult);
        });

        it('should throw MethodNotFound for an unknown tool', async () => {
            const toolName = 'unknown_tool';
            await expect(mcpServerSetup.callTool(toolName, {}))
                .rejects.toThrow(new McpError(ErrorCode.MethodNotFound, `Unknown tool: ${toolName}`));
        });

        it('should throw validation error for invalid arguments', async () => {
            const invalidInput = { wrong_param: 'test' };

            mockBitbucketUseCase.bitbucketListWorkspaces.mockResolvedValue({ success: true });

            await expect(mcpServerSetup.callTool('bitbucket_list_workspaces', invalidInput))
                .rejects.toThrow();
            expect(mockLogger.error).toHaveBeenCalledWith(
                expect.stringContaining('Error in bitbucket_list_workspaces handler'),
                expect.any(Object)
            );
        });

        it('should handle and re-throw McpError from handlers', async () => {
            const mcpError = new McpError(ErrorCode.InternalError, 'A specific MCP error');
            mockBitbucketUseCase.bitbucketListWorkspaces.mockRejectedValue(mcpError);
            
            await expect(mcpServerSetup.callTool('bitbucket_list_workspaces', {}))
                .rejects.toThrow(mcpError);
        });

        it('should handle and wrap AxiosError in McpError', async () => {
            const axiosError = {
                isAxiosError: true,
                response: { data: { message: 'Bitbucket is down' } },
                message: 'Request failed',
            };
            jest.spyOn(axios, 'isAxiosError').mockReturnValue(true);
            mockBitbucketUseCase.bitbucketListWorkspaces.mockRejectedValue(axiosError);

            await expect(mcpServerSetup.callTool('bitbucket_list_workspaces', {}))
                .rejects.toThrow(new McpError(ErrorCode.InternalError, 'Bitbucket API error: Bitbucket is down'));
        });

        it('should handle and wrap generic Error in McpError', async () => {
            const genericError = new Error('Something went wrong');
            jest.spyOn(axios, 'isAxiosError').mockReturnValue(false);
            mockBitbucketUseCase.bitbucketListWorkspaces.mockRejectedValue(genericError);

            await expect(mcpServerSetup.callTool('bitbucket_list_workspaces', {}))
                .rejects.toThrow(new McpError(ErrorCode.InternalError, 'Something went wrong'));
        });
    });

    describe('Request Handlers', () => {
        let listToolsHandler: () => Promise<any>;
        let callToolHandler: (request: any) => Promise<any>;

        beforeEach(() => {
            const listToolsCall = (serverInstance.setRequestHandler as jest.Mock).mock.calls.find(call => call[0] === ListToolsRequestSchema);
            const callToolCall = (serverInstance.setRequestHandler as jest.Mock).mock.calls.find(call => call[0] === CallToolRequestSchema);
            
            if (!listToolsCall || !callToolCall) {
                throw new Error('Request handlers not set up correctly');
            }

            listToolsHandler = listToolsCall[1] as () => Promise<any>;
            callToolHandler = callToolCall[1] as (request: any) => Promise<any>;
        });

        it('ListTools handler should return available tools', async () => {
            const result = await listToolsHandler();
            expect(result.tools).toBeInstanceOf(Array);
            expect(result.tools.length).toBe(16);
            expect(result.tools[0]).toHaveProperty('name');
            expect(result.tools[0]).toHaveProperty('description');
            expect(result.tools[0]).toHaveProperty('inputSchema');
        });

        it('CallTool handler should execute the correct tool', async () => {
            const request = {
                params: {
                    name: 'bitbucket_get_user_profile',
                    arguments: { username: 'test-user' }
                }
            };
            const expectedResult = { displayName: 'Test User' };
            mockBitbucketUseCase.bitbucketGetUserDetails.mockResolvedValue(expectedResult);

            const result = await callToolHandler(request);
            
            expect(mockBitbucketUseCase.bitbucketGetUserDetails).toHaveBeenCalledWith({ username: 'test-user' });
            expect(result).toBe(expectedResult);
        });

        it('CallTool handler should throw MethodNotFound for unknown tool', async () => {
            const request = { params: { name: 'non_existent_tool', arguments: {} } };
            
            await expect(callToolHandler(request))
                .rejects.toThrow(new McpError(ErrorCode.MethodNotFound, `Unknown tool: ${request.params.name}`));
        });
    });
}); 