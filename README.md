# Bitbucket Server/Data Center MCP Server (mcp-bitbucket-n11)

A Node.js/TypeScript Model Context Protocol (MCP) server for Atlassian Bitbucket Server/Data Center. This server enables AI systems (e.g., LLMs, AI coding assistants) to securely interact with your self-hosted Bitbucket repositories, pull requests, projects, and code in real time.

Version: 1.0.0

## Why Use This Server?

- **Seamless Integration**: Connect AI tools directly to your Bitbucket Server/Data Center instance.
- **Secure Local Operation**: Runs within your infrastructure, using your Bitbucket Server credentials (e.g., Personal Access Tokens). Credentials are not stored on remote servers.
- **Developer Focused**: Designed to help AI assistants understand and interact with your codebase, pull requests, and repository structure.
- **Standardized Interaction**: Implements the Model Context Protocol (MCP) for consistent communication with AI systems.

## What is MCP?

Model Context Protocol (MCP) is an open standard for securely connecting AI systems to external tools and data sources. This server implements MCP for Bitbucket Server/Data Center, enabling AI assistants to interact with your Bitbucket data programmatically.

## Prerequisites

- **Node.js**: Version 18.x or higher (as specified in `package.json`). [Download](https://nodejs.org/)
- **Bitbucket Server/Data Center Account**: Access to a Bitbucket Server/Data Center instance with an account that can generate Personal Access Tokens (PATs).
- **Git**: For cloning the repository.
- **Docker** (Recommended for running, optional for local development).

## Setup

You can run this MCP server using Docker (recommended) or directly with Node.js.

### Option A: Running with Docker (Recommended)

1.  **Clone the Repository:**
    ```bash
    # Replace <repository_url> with the actual URL of this project
    git clone <repository_url>
    cd mcp-bitbucket-n11
    ```

2.  **Build the Docker Image:**
    ```bash
    docker build -t mcp-bitbucket-n11:latest .
    ```

3.  **Run the Docker Container:**
    The server requires your Bitbucket Server URL and a Personal Access Token (PAT) with appropriate permissions (usually read access to repositories, pull requests, etc.).
    ```bash
    docker run -i --rm --network=host \
      -e BITBUCKET_URL="https://your-bitbucket-server.com" \
      -e BITBUCKET_TOKEN="your_personal_access_token" \
      # Optional: Set a default project key if you frequently work with one project
      # -e BITBUCKET_DEFAULT_PROJECT="YOUR_PROJECT_KEY" \
      mcp-bitbucket-n11:latest
    ```
    Replace placeholders with your actual Bitbucket Server URL, PAT, and optional default project key.

### Option B: Running Locally with Node.js (for Development)

1.  **Clone the Repository:**
    ```bash
    # Replace <repository_url> with the actual URL of this project
    git clone <repository_url>
    cd mcp-bitbucket-n11
    ```

2.  **Install Dependencies:**
    ```bash
    npm install
    ```

3.  **Configure Credentials:**
    Set the following environment variables. You can create a `.env` file in the project root for this:
    ```env
    BITBUCKET_URL=https://your-bitbucket-server.com
    BITBUCKET_TOKEN=your_personal_access_token
    # Optional:
    # BITBUCKET_DEFAULT_PROJECT=YOUR_PROJECT_KEY
    ```
    Alternatively, export them in your shell session.

4.  **Build the Server:**
    ```bash
    npm run build
    ```

5.  **Run the Server:**
    ```bash
    npm start
    ```
    The server will start, and the MCP endpoint will be available (typically on `stdio` for MCP servers run as child processes).

## Connect to AI Assistant

Configure your MCP-compatible client (e.g., an AI coding assistant) to use this server. The configuration will depend on how you are running the server.

**If using Docker (as per your `mcp_config.json` example):**
```json
{
  "mcpServers": {
    "mcp-bitbucket-n11": {
      "command": "docker",
      "args": [
        "run", "-i", "--rm", "--network=host",
        "-e", "BITBUCKET_URL",
        "-e", "BITBUCKET_TOKEN",
        // "-e", "BITBUCKET_DEFAULT_PROJECT", // Optional
        "mcp-bitbucket-n11:latest"
      ],
      "env": {
        "BITBUCKET_URL": "https://your-bitbucket-server.com",
        "BITBUCKET_TOKEN": "your_personal_access_token"
        // "BITBUCKET_DEFAULT_PROJECT": "YOUR_PROJECT_KEY" // Optional
      }
    }
  }
}
```
Ensure the `BITBUCKET_URL` and `BITBUCKET_TOKEN` in the `env` block are correctly set for your Bitbucket Server instance.

**If running with Node.js directly:**
```json
{
  "mcpServers": {
    "mcp-bitbucket-n11": {
      "command": "npm",
      "args": ["start"],
      "cwd": "/path/to/your/mcp-bitbucket-n11" // IMPORTANT: Set this to the project's root directory
      // Ensure BITBUCKET_URL and BITBUCKET_TOKEN are available in the environment
      // where this command is executed, or via the .env file in the project.
    }
  }
}
```

## MCP Tools

This server provides the following tools for interacting with Bitbucket Server/Data Center. Tool names are `snake_case`, and parameters are `camelCase`, defined by Zod schemas. Responses are generally Markdown formatted.

-   **`bitbucket_create_pull_request`**: Creates a new Bitbucket pull request.
-   **`bitbucket_get_pull_request_details`**: Gets detailed information for a Bitbucket pull request.
-   **`bitbucket_merge_pull_request`**: Merges a Bitbucket pull request.
-   **`bitbucket_decline_pull_request`**: Declines a Bitbucket pull request.
-   **`bitbucket_add_pull_request_comment`**: Adds a general comment to a Bitbucket pull request.
-   **`bitbucket_get_pull_request_diff`**: Gets the diff for a Bitbucket pull request.
-   **`bitbucket_get_pull_request_reviews`**: Gets reviews for a Bitbucket pull request.
-   **`bitbucket_list_workspaces`**: Lists available Bitbucket workspaces. (Note: In Bitbucket Server/DC, "Projects" are the primary organizational unit in the UI. This tool may list entities that correspond to Bitbucket's concept of workspaces at the API level or could be related to projects.)
-   **`bitbucket_list_repositories`**: Lists Bitbucket repositories (typically within a project).
-   **`bitbucket_search_content`**: Searches content within Bitbucket repositories.
-   **`bitbucket_get_repository_details`**: Gets details for a specific Bitbucket repository.
-   **`bitbucket_get_file_content`**: Gets the content of a specific file from a Bitbucket repository.
-   **`bitbucket_create_branch`**: Creates a new branch in a Bitbucket repository.
-   **`bitbucket_add_pull_request_file_line_comment`**: Adds a comment to a Bitbucket pull request, optionally as an inline comment on a specific file and line.
-   **`bitbucket_list_repository_branches`**: Lists branches for a Bitbucket repository.

Parameter details for each tool are defined by their respective Zod input schemas in the codebase (see `src/application/dtos/`).

## Development

-   **Watch for changes and rebuild:**
    ```bash
    npm run dev
    ```
-   **Lint code:**
    ```bash
    npm run lint
    ```
-   **Run tests:**
    ```bash
    npm run test
    ```
-   **Inspect MCP server (using `@modelcontextprotocol/inspector`):**
    ```bash
    npm run inspector
    ```

## License

This project is licensed under the Creative Commons Attribution-NonCommercial-ShareAlike 4.0 International License (CC BY-NC-SA 4.0).

See the `LICENSE` file in the root directory for the full license text.

Copyright 2025 n11 Elektronik Ticaret ve Bilişim Hizmetleri A.Ş.
