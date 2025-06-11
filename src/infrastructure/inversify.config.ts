import { Container } from 'inversify';
import { TYPES } from './types.js';
import { BitbucketConfig } from './config/BitbucketConfig.js';
import logger from './logging/logger.js';
import winston from 'winston';

// Clients
import { IBitbucketClientFacade } from '../application/facade/IBitbucketClientFacade.js';
import { BitbucketClientFacade } from './facade/BitbucketClientFacade.js';
import { IPullRequestClient } from '../application/ports/IPullRequestClient.js';
import { PullRequestClient } from './clients/PullRequestClient.js';
import { IRepositoryClient } from '../application/ports/IRepositoryClient.js';
import { RepositoryClient } from './clients/RepositoryClient.js';
import { IWorkspaceClient } from '../application/ports/IWorkspaceClient.js';
import { WorkspaceClient } from './clients/WorkspaceClient.js';
import { ISearchClient } from '../application/ports/ISearchClient.js';
import { SearchClient } from './clients/SearchClient.js';
import { IUserClient } from '../application/ports/IUserClient.js';
import { UserClient } from './clients/UserClient.js';

// Use Cases
import { IBitbucketUseCase } from '../application/use-cases/IBitbucketUseCase.js';
import { BitbucketUseCase } from '../application/use-cases/impl/BitbucketUseCase.js';

// MCP Server Setup
import { McpServerSetup } from './setup/McpServerSetup.js';
import { SseService } from './sse/SseService.js';

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
container.bind<IUserClient>(TYPES.IUserClient).to(UserClient).inSingletonScope();
container.bind<IBitbucketClientFacade>(TYPES.IBitbucketClient).to(BitbucketClientFacade).inSingletonScope();

// Use Cases
container.bind<IBitbucketUseCase>(TYPES.IBitbucketUseCase).to(BitbucketUseCase).inSingletonScope();

// MCP Server Setup
container.bind<McpServerSetup>(TYPES.McpServerSetup).to(McpServerSetup).inSingletonScope();

// SSE Service
container.bind<SseService>(TYPES.SseService).to(SseService).inSingletonScope();

export { container };
