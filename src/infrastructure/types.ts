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

    // Use Cases
    IBitbucketUseCase: Symbol.for("IBitbucketUseCase"),

    // MCP Server Setup
    McpServerSetup: Symbol.for("McpServerSetup"),

    // SSE Service
    SseService: Symbol.for("SseService")
};

export { TYPES };
