import 'reflect-metadata';
import axios from 'axios';
import { RepositoryClient } from '../../../src/infrastructure/clients/RepositoryClient.js';
import { BitbucketConfig } from '../../../src/infrastructure/config/BitbucketConfig.js';

jest.mock('axios');

describe('RepositoryClient Security Tests', () => {
    const mockLogger: any = {
        info: jest.fn(),
        error: jest.fn(),
        warn: jest.fn(),
        debug: jest.fn(),
    };

    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('Path Traversal Protection', () => {
        it('should encode projectKey to prevent path traversal in listBitbucketRepositories', async () => {
            const mockGet = jest.fn().mockResolvedValue({ data: { size: 0 } });
            (axios.create as jest.Mock).mockReturnValue({ get: mockGet });

            const config: BitbucketConfig = {
                baseUrl: 'https://bitbucket.example.com',
                defaultProject: 'SAFE_PROJECT',
            } as any;

            const client = new RepositoryClient(config, mockLogger);

            // Attempt path traversal (should be URL encoded)
            await client.listBitbucketRepositories({ workspaceSlug: '../../../admin' });

            // Verify URL encoding prevents path traversal
            expect(mockGet).toHaveBeenCalledWith(
                '/projects/..%2F..%2F..%2Fadmin/repos',
                { params: {} }
            );
        });

        it('should encode repoSlug to prevent path traversal in listBitbucketRepositoryBranches', async () => {
            const mockGet = jest.fn().mockResolvedValue({ data: { size: 0 } });
            (axios.create as jest.Mock).mockReturnValue({ get: mockGet });

            const config: BitbucketConfig = {
                baseUrl: 'https://bitbucket.example.com',
            } as any;

            const client = new RepositoryClient(config, mockLogger);

            await client.listBitbucketRepositoryBranches({
                workspaceSlug: 'PROJ',
                repoSlug: '../secrets',
            });

            expect(mockGet).toHaveBeenCalledWith(
                '/projects/PROJ/repos/..%2Fsecrets/branches',
                { params: {} }
            );
        });

        it('should encode file paths to prevent path traversal in getBitbucketFileContent', async () => {
            const mockGet = jest.fn().mockResolvedValue({ data: 'file content' });
            (axios.create as jest.Mock).mockReturnValue({ get: mockGet });

            const config: BitbucketConfig = {
                baseUrl: 'https://bitbucket.example.com',
            } as any;

            const client = new RepositoryClient(config, mockLogger);

            await client.getBitbucketFileContent({
                workspaceSlug: 'PROJ',
                repoSlug: 'repo',
                filePath: '../../../etc/passwd',
            });

            expect(mockGet).toHaveBeenCalledWith(
                '/projects/PROJ/repos/repo/raw/..%2F..%2F..%2Fetc%2Fpasswd',
                { params: {}, responseType: 'text' }
            );
        });
    });

    describe('Default Project Security', () => {
        it('should use validated defaultProject when workspaceSlug is not provided', async () => {
            const mockGet = jest.fn().mockResolvedValue({ data: { size: 0 } });
            (axios.create as jest.Mock).mockReturnValue({ get: mockGet });

            const config: BitbucketConfig = {
                baseUrl: 'https://bitbucket.example.com',
                defaultProject: 'VALIDATED_PROJECT',
            } as any;

            const client = new RepositoryClient(config, mockLogger);

            await client.listBitbucketRepositories({});

            expect(mockGet).toHaveBeenCalledWith('/projects/VALIDATED_PROJECT/repos', { params: {} });
        });

        it('should throw error when neither workspaceSlug nor defaultProject is provided', async () => {
            const mockGet = jest.fn();
            (axios.create as jest.Mock).mockReturnValue({ get: mockGet });

            const config: BitbucketConfig = {
                baseUrl: 'https://bitbucket.example.com',
            } as any;

            const client = new RepositoryClient(config, mockLogger);

            await expect(client.listBitbucketRepositories({})).rejects.toThrow(
                'Either workspaceSlug or a default project must be provided.'
            );
        });
    });

    describe('Special Characters Handling', () => {
        it('should properly encode special characters in projectKey', async () => {
            const mockGet = jest.fn().mockResolvedValue({ data: { size: 0 } });
            (axios.create as jest.Mock).mockReturnValue({ get: mockGet });

            const config: BitbucketConfig = {
                baseUrl: 'https://bitbucket.example.com',
            } as any;

            const client = new RepositoryClient(config, mockLogger);

            await client.listBitbucketRepositories({ workspaceSlug: 'PROJ@#$%' });

            // Special characters should be URL encoded
            expect(mockGet).toHaveBeenCalledWith(
                '/projects/PROJ%40%23%24%25/repos',
                { params: {} }
            );
        });

        it('should handle spaces in project keys', async () => {
            const mockGet = jest.fn().mockResolvedValue({ data: { size: 0 } });
            (axios.create as jest.Mock).mockReturnValue({ get: mockGet });

            const config: BitbucketConfig = {
                baseUrl: 'https://bitbucket.example.com',
            } as any;

            const client = new RepositoryClient(config, mockLogger);

            await client.listBitbucketRepositories({ workspaceSlug: 'MY PROJECT' });

            expect(mockGet).toHaveBeenCalledWith(
                '/projects/MY%20PROJECT/repos',
                { params: {} }
            );
        });
    });

    describe('URL Encoding in All Methods', () => {
        it('should encode parameters in createBitbucketBranch', async () => {
            const mockPost = jest.fn().mockResolvedValue({ data: {} });
            (axios.create as jest.Mock).mockReturnValue({ post: mockPost });

            const config: BitbucketConfig = {
                baseUrl: 'https://bitbucket.example.com',
            } as any;

            const client = new RepositoryClient(config, mockLogger);

            await client.createBitbucketBranch({
                workspaceSlug: 'PROJ/test',
                repoSlug: 'repo/../admin',
                newBranchName: 'feature',
            });

            expect(mockPost).toHaveBeenCalledWith(
                '/projects/PROJ%2Ftest/repos/repo%2F..%2Fadmin/branches',
                expect.any(Object)
            );
        });

        it('should encode parameters in getBitbucketRepositoryDetails', async () => {
            const mockGet = jest.fn().mockResolvedValue({ data: {} });
            (axios.create as jest.Mock).mockReturnValue({ get: mockGet });

            const config: BitbucketConfig = {
                baseUrl: 'https://bitbucket.example.com',
            } as any;

            const client = new RepositoryClient(config, mockLogger);

            await client.getBitbucketRepositoryDetails({
                workspaceSlug: 'PROJ/../secrets',
                repoSlug: 'repo',
            });

            expect(mockGet).toHaveBeenCalledWith(
                '/projects/PROJ%2F..%2Fsecrets/repos/repo'
            );
        });
    });
});
