import { Container } from 'inversify';
import { TYPES } from './types.js';
import { BitbucketConfig } from './config/BitbucketConfig.js';
import logger from './logging/logger.js';
import winston from 'winston';

// Clients
import { IBitbucketClient } from '../application/ports/IBitbucketClient.js';
import { BitbucketClientApi } from './clients/BitbucketClientApi.js';
import { IPullRequestClient } from '../application/ports/IPullRequestClient.js';
import { PullRequestClient } from './clients/PullRequestClient.js';
import { IRepositoryClient } from '../application/ports/IRepositoryClient.js';
import { RepositoryClient } from './clients/RepositoryClient.js';
import { IWorkspaceClient } from '../application/ports/IWorkspaceClient.js';
import { WorkspaceClient } from './clients/WorkspaceClient.js';
import { ISearchClient } from '../application/ports/ISearchClient.js';
import { SearchClient } from './clients/SearchClient.js';

// Use Cases
import { IBitbucketUseCase } from '../application/use-cases/IBitbucketUseCase.js';
import { BitbucketUseCase } from '../application/use-cases/impl/BitbucketUseCase.js';

// MCP Server Setup
import { McpServerSetup } from './setup/McpServerSetup.js';

const container = new Container();

// Configuration
const bitbucketConfig: BitbucketConfig = {
    baseUrl: process.env.BITBUCKET_URL ?? '',
    token: process.env.BITBUCKET_TOKEN,
    username: process.env.BITBUCKET_USERNAME,
    password: process.env.BITBUCKET_PASSWORD,
    defaultProject: process.env.BITBUCKET_DEFAULT_PROJECT
};
container.bind<BitbucketConfig>(TYPES.BitbucketConfig).toConstantValue(bitbucketConfig);

// Logger
container.bind<winston.Logger>(TYPES.Logger).toConstantValue(logger);

// Bitbucket Clients
container.bind<IPullRequestClient>(TYPES.IPullRequestClient).to(PullRequestClient).inSingletonScope();
container.bind<IRepositoryClient>(TYPES.IRepositoryClient).to(RepositoryClient).inSingletonScope();
container.bind<IWorkspaceClient>(TYPES.IWorkspaceClient).to(WorkspaceClient).inSingletonScope();
container.bind<ISearchClient>(TYPES.ISearchClient).to(SearchClient).inSingletonScope();
container.bind<IBitbucketClient>(TYPES.IBitbucketClient).to(BitbucketClientApi).inSingletonScope();

// Use Cases
container.bind<IBitbucketUseCase>(TYPES.IBitbucketUseCase).to(BitbucketUseCase).inSingletonScope();

// MCP Server Setup
container.bind<McpServerSetup>(TYPES.McpServerSetup).to(McpServerSetup).inSingletonScope();

export { container };
