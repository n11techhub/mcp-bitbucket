import { McpServerSetup } from '../../../src/infrastructure/McpServerSetup.js';
import { McpError, ErrorCode } from '@modelcontextprotocol/sdk/types.js';
import axios from 'axios';

describe('McpServerSetup', () => {
    const logger = {
        info: jest.fn(),
        warn: jest.fn(),
        error: jest.fn(),
    } as any;

    const api = {
        getDefaultProjectKey: jest.fn().mockReturnValue('PRJ'),
    } as any;

    const bitbucketUseCase = {
        bitbucketCreatePullRequest: jest.fn(),
        bitbucketGetPullRequestDetails: jest.fn(),
        bitbucketApprovePullRequest: jest.fn(),
        bitbucketGetPullRequestDiff: jest.fn(),
        bitbucketGetPullRequestReviews: jest.fn(),
        bitbucketListWorkspaces: jest.fn(),
        bitbucketListRepositories: jest.fn(),
        bitbucketSearchContent: jest.fn(),
        bitbucketGetRepositoryDetails: jest.fn(),
        bitbucketGetFileContent: jest.fn(),
        bitbucketBrowseDirectory: jest.fn(),
        bitbucketCreateBranch: jest.fn(),
        bitbucketAddPullRequestFileLineComment: jest.fn(),
        bitbucketListRepositoryBranches: jest.fn(),
        bitbucketGetUserDetails: jest.fn(),
        bitbucketMergePullRequest: jest.fn(),
        bitbucketDeclinePullRequest: jest.fn(),
        bitbucketAddGeneralPullRequestComment: jest.fn(),
    } as any;

    const configuration = { defaultProject: 'PRJ' } as any;

    beforeEach(() => {
        jest.clearAllMocks();
        process.env.MCP_API_KEY = 'secret-key';
    });

    afterAll(() => {
        delete process.env.MCP_API_KEY;
    });

    it('returns a fair tool list with expected bitbucket tools', () => {
        const setup = new McpServerSetup(api, bitbucketUseCase, logger, configuration);
        const tools = setup.getAvailableTools();

        expect(tools.length).toBeGreaterThanOrEqual(10);
        expect(tools.some((t: any) => t.name === 'bitbucket_list_workspaces')).toBe(true);
        expect(tools.some((t: any) => t.name === 'bitbucket_merge_pull_request')).toBe(true);
        expect(tools.some((t: any) => t.name === 'bitbucket_approve_pull_request')).toBe(true);
    });

    it('configures handlers and executes a known tool', async () => {
        bitbucketUseCase.bitbucketListWorkspaces.mockResolvedValue({ content: [] });
        const setup = new McpServerSetup(api, bitbucketUseCase, logger, configuration);

        const setRequestHandler = jest.fn();
        const fakeServer = { server: { setRequestHandler, onerror: undefined as any } } as any;

        setup.configureServer(fakeServer, 'secret-key');

        const listHandler = setRequestHandler.mock.calls[0][1];
        const callHandler = setRequestHandler.mock.calls[1][1];

        const listResult = await listHandler();
        const callResult = await callHandler({
            params: { name: 'bitbucket_list_workspaces', arguments: {} },
        });

        expect(listResult.tools.length).toBeGreaterThan(0);
        expect(bitbucketUseCase.bitbucketListWorkspaces).toHaveBeenCalledWith({});
        expect(callResult.content?.[0]?.type).toBe('text');
        expect(JSON.parse(callResult.content?.[0]?.text)).toEqual({ content: [] });
    });

    it('rejects tool execution when authentication fails', async () => {
        const setup = new McpServerSetup(api, bitbucketUseCase, logger, configuration);

        const setRequestHandler = jest.fn();
        const fakeServer = { server: { setRequestHandler, onerror: undefined as any } } as any;

        setup.configureServer(fakeServer, 'wrong-key');
        const callHandler = setRequestHandler.mock.calls[1][1];

        await expect(
            callHandler({ params: { name: 'bitbucket_list_workspaces', arguments: {} } })
        ).rejects.toMatchObject({
            code: ErrorCode.InternalError,
        } satisfies Partial<McpError>);
    });

    it('returns MethodNotFound for unknown tool names', async () => {
        const setup = new McpServerSetup(api, bitbucketUseCase, logger, configuration);

        const setRequestHandler = jest.fn();
        const fakeServer = { server: { setRequestHandler, onerror: undefined as any } } as any;

        setup.configureServer(fakeServer, 'secret-key');
        const callHandler = setRequestHandler.mock.calls[1][1];

        await expect(
            callHandler({ params: { name: 'bitbucket_unknown', arguments: {} } })
        ).rejects.toMatchObject({
            code: ErrorCode.MethodNotFound,
        } satisfies Partial<McpError>);
    });

    it('does not require auth when MCP_API_KEY is not set', async () => {
        delete process.env.MCP_API_KEY;
        bitbucketUseCase.bitbucketListWorkspaces.mockResolvedValue({ ok: true });
        const setup = new McpServerSetup(api, bitbucketUseCase, logger, configuration);

        const setRequestHandler = jest.fn();
        const fakeServer = { server: { setRequestHandler, onerror: undefined as any } } as any;
        setup.configureServer(fakeServer, undefined);

        const callHandler = setRequestHandler.mock.calls[1][1];
        const result = await callHandler({ params: { name: 'bitbucket_list_workspaces', arguments: {} } });
        expect(result.content?.[0]?.type).toBe('text');
        expect(JSON.parse(result.content?.[0]?.text)).toEqual({ ok: true });
        expect(logger.warn).toHaveBeenCalledWith('MCP_API_KEY is not set. The server will not require authentication.');
    });

    it('attaches onerror hook to server', () => {
        const setup = new McpServerSetup(api, bitbucketUseCase, logger, configuration);
        const setRequestHandler = jest.fn();
        const fakeServer = { server: { setRequestHandler, onerror: undefined as any } } as any;

        setup.configureServer(fakeServer, 'secret-key');
        fakeServer.server.onerror(new Error('boom'));

        expect(logger.error).toHaveBeenCalledWith('[MCP Error]', 'boom', expect.any(Object));
    });

    it('maps validation errors from handlers to internal errors', async () => {
        bitbucketUseCase.bitbucketListWorkspaces.mockRejectedValue(new Error('unexpected validation flow'));
        const setup = new McpServerSetup(api, bitbucketUseCase, logger, configuration);
        const setRequestHandler = jest.fn();
        const fakeServer = { server: { setRequestHandler, onerror: undefined as any } } as any;

        setup.configureServer(fakeServer, 'secret-key');
        const callHandler = setRequestHandler.mock.calls[1][1];

        await expect(
            callHandler({ params: { name: 'bitbucket_list_workspaces', arguments: { query: 123 } } })
        ).rejects.toMatchObject({ code: ErrorCode.InternalError });
    });

    it('maps axios-style tool execution errors to McpError', async () => {
        const axiosSpy = jest.spyOn(axios, 'isAxiosError').mockReturnValue(true);
        bitbucketUseCase.bitbucketListWorkspaces.mockRejectedValue({
            response: { data: { message: 'api denied' } },
            message: 'http failed',
        });

        const setup = new McpServerSetup(api, bitbucketUseCase, logger, configuration);
        const setRequestHandler = jest.fn();
        const fakeServer = { server: { setRequestHandler, onerror: undefined as any } } as any;

        setup.configureServer(fakeServer, 'secret-key');
        const callHandler = setRequestHandler.mock.calls[1][1];

        await expect(
            callHandler({ params: { name: 'bitbucket_list_workspaces', arguments: {} } })
        ).rejects.toMatchObject({ message: expect.stringContaining('Bitbucket API error: api denied') });

        axiosSpy.mockRestore();
    });

    it('keeps McpError as-is from handler execution', async () => {
        bitbucketUseCase.bitbucketListWorkspaces.mockRejectedValue(new McpError(ErrorCode.InvalidParams, 'bad args'));
        const setup = new McpServerSetup(api, bitbucketUseCase, logger, configuration);
        const setRequestHandler = jest.fn();
        const fakeServer = { server: { setRequestHandler, onerror: undefined as any } } as any;

        setup.configureServer(fakeServer, 'secret-key');
        const callHandler = setRequestHandler.mock.calls[1][1];

        await expect(
            callHandler({ params: { name: 'bitbucket_list_workspaces', arguments: {} } })
        ).rejects.toMatchObject({ code: ErrorCode.InvalidParams });
    });

    it('maps generic non-axios execution errors', async () => {
        const axiosSpy = jest.spyOn(axios, 'isAxiosError').mockReturnValue(false);
        bitbucketUseCase.bitbucketListWorkspaces.mockRejectedValue(new Error('unexpected failure'));
        const setup = new McpServerSetup(api, bitbucketUseCase, logger, configuration);
        const setRequestHandler = jest.fn();
        const fakeServer = { server: { setRequestHandler, onerror: undefined as any } } as any;

        setup.configureServer(fakeServer, 'secret-key');
        const callHandler = setRequestHandler.mock.calls[1][1];

        await expect(
            callHandler({ params: { name: 'bitbucket_list_workspaces', arguments: {} } })
        ).rejects.toMatchObject({
            code: ErrorCode.InternalError,
        });

        axiosSpy.mockRestore();
    });
});
