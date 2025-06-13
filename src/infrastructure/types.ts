const TYPES = {
    // Configuration
    BitbucketConfig: Symbol.for("BitbucketConfig"),

    // Logger
    Logger: Symbol.for("Logger"),

    // Bitbucket Clients
    IBitbucketClient: Symbol.for("IBitbucketClientFacade"),
    IPullRequestClient: Symbol.for("IPullRequestClient"),
    IRepositoryClient: Symbol.for("IRepositoryClient"),
    IWorkspaceClient: Symbol.for("IWorkspaceClient"),
    ISearchClient: Symbol.for("ISearchClient"),
    IUserClient: Symbol.for("IUserClient"),

    // Use Cases
    IBitbucketUseCase: Symbol.for("IBitbucketUseCase"),

    // MCP Server Setup
    McpServerSetup: Symbol.for("McpServerSetup"),
    
    // SSE Transport and Server
    McpSseTransport: Symbol.for("McpSseTransport"),
    McpSseServer: Symbol.for("McpSseServer"),
};

export { TYPES };
