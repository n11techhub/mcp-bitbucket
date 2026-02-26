import 'reflect-metadata';
import axios from 'axios';
import { RepositoryClient } from '../../../src/infrastructure/clients/RepositoryClient.js';
import { BitbucketConfig } from '../../../src/infrastructure/config/BitbucketConfig.js';
import winston from 'winston';

jest.mock('axios');

describe('RepositoryClient (defaultProject)', () => {
    const mockLogger: any = {
        info: jest.fn(),
        error: jest.fn(),
        warn: jest.fn(),
        debug: jest.fn(),
    };

    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('uses defaultProject when workspaceSlug is not provided', async () => {
        const mockGet = jest.fn().mockResolvedValue({ data: { size: 0 } });
        (axios.create as jest.Mock).mockReturnValue({ get: mockGet });

        const config: BitbucketConfig = {
            baseUrl: 'https://bitbucket.example.com',
            defaultProject: 'TP',
        } as any;

        const client = new RepositoryClient(config, mockLogger);

        const result = await client.listBitbucketRepositories({});

        expect(mockGet).toHaveBeenCalledWith('/projects/TP/repos', { params: {} });
        expect(result).toBeDefined();
    });

    it('throws when neither workspaceSlug nor defaultProject is provided', async () => {
        const mockGet = jest.fn();
        (axios.create as jest.Mock).mockReturnValue({ get: mockGet });

        const config: BitbucketConfig = {
            baseUrl: 'https://bitbucket.example.com',
        } as any;

        const client = new RepositoryClient(config, mockLogger);

        await expect(client.listBitbucketRepositories({})).rejects.toThrow();
    });
});
