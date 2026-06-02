import { Container } from 'inversify';
import loggerConfiguration from '../logger/LoggerConfiguration.js';
import winston from 'winston';

// Clients
import { IBitbucketClientFacade } from '../../../application/facade/IBitbucketClientFacade.js';
import { BitbucketClientFacade } from '../../../application/facade/impl/BitbucketClientFacade.js';
import { IPullRequestClient } from '../../../domain/gateway/IPullRequestClient.js';
import { PullRequestClient } from '../../client/PullRequestClient.js';
import { IRepositoryClient } from '../../../domain/gateway/IRepositoryClient.js';
import { RepositoryClient } from '../../client/RepositoryClient.js';
import { IWorkspaceClient } from '../../../domain/gateway/IWorkspaceClient.js';
import { WorkspaceClient } from '../../client/WorkspaceClient.js';
import { ISearchClient } from '../../../domain/gateway/ISearchClient.js';
import { SearchClient } from '../../client/SearchClient.js';
import { IUserClient } from '../../../domain/gateway/IUserClient.js';
import { UserClient } from '../../client/UserClient.js';

// Use Cases
import { IBitbucketUseCase } from '../../../application/use-case/IBitbucketUseCase.js';
import { BitbucketUseCase } from '../../../application/use-case/impl/BitbucketUseCase.js';

// MCP Server Setup
import { McpHttpServer } from '../../http-streaming/McpHttpServer.js';
import { McpServerFactory } from '../../factory/McpServerFactory.js';
import type { IMcpServerFactory } from '../../../application/factory/IMcpServerFactory.js';
import {validateProjectKey} from "../../../application/util/Validator.js";
import {Configuration} from "../Configuration.js";
import {Types} from "../../../application/Types.js";
import {McpServerSetup} from "../../McpServerSetup.js";

const container = new Container();

// Configuration
// Validate and sanitize defaultProject to prevent security vulnerabilities
let validatedDefaultProject: string | undefined;
try {
    validatedDefaultProject = validateProjectKey(process.env.BITBUCKET_DEFAULT_PROJECT);
} catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    loggerConfiguration.error(`Invalid BITBUCKET_DEFAULT_PROJECT environment variable: ${message}`);
    validatedDefaultProject = undefined;
}

if (!process.env.BITBUCKET_URL) {
    loggerConfiguration.error('BITBUCKET_URL environment variable is required but not set.');
    process.exit(1);
}

const configuration: Configuration = {
    baseUrl: process.env.BITBUCKET_URL,
    token: process.env.BITBUCKET_TOKEN,
    username: process.env.BITBUCKET_USERNAME,
    password: process.env.BITBUCKET_PASSWORD,
    defaultProject: validatedDefaultProject
};
container.bind<Configuration>(Types.Configuration).toConstantValue(configuration);

// Logger
container.bind<winston.Logger>(Types.Logger).toConstantValue(loggerConfiguration);

// Bitbucket Clients
container.bind<IPullRequestClient>(Types.IPullRequestClient).to(PullRequestClient).inSingletonScope();
container.bind<IRepositoryClient>(Types.IRepositoryClient).to(RepositoryClient).inSingletonScope();
container.bind<IWorkspaceClient>(Types.IWorkspaceClient).to(WorkspaceClient).inSingletonScope();
container.bind<ISearchClient>(Types.ISearchClient).to(SearchClient).inSingletonScope();
container.bind<IUserClient>(Types.IUserClient).to(UserClient).inSingletonScope();
container.bind<IBitbucketClientFacade>(Types.IBitbucketClient).to(BitbucketClientFacade).inSingletonScope();

// Use Cases
container.bind<IBitbucketUseCase>(Types.IBitbucketUseCase).to(BitbucketUseCase).inSingletonScope();

// MCP Server Setup
container.bind<McpServerSetup>(Types.McpServerSetup).to(McpServerSetup).inSingletonScope();
container.bind<IMcpServerFactory>(Types.McpServerFactory).to(McpServerFactory).inSingletonScope();

// HTTP Streaming Components
container.bind<McpHttpServer>(Types.McpHttpServer).to(McpHttpServer).inSingletonScope();

export { container };
