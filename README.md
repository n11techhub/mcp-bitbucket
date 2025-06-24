# mcp-bitbucket-n11

![License: CC BY-NC-SA 4.0](https://img.shields.io/badge/License-CC%20BY--NC--SA%204.0-lightgrey.svg)
![Version](https://img.shields.io/badge/version-1.0.0-blue)

**A Node.js/TypeScript Model Context Protocol (MCP) server for Atlassian Bitbucket Server/Data Center.**

This server enables AI systems (e.g., LLMs, AI coding assistants) to securely interact with your self-hosted Bitbucket repositories, pull requests, projects, and code in real time.

## Table of Contents

- [Why Use This Server?](#why-use-this-server)
- [What is MCP?](#what-is-mcp)
- [Prerequisites](#prerequisites)
- [Setup](#setup)
  - [Running with Docker (Recommended)](#option-a-running-with-docker-recommended)
  - [Running Locally with Node.js](#option-b-running-locally-with-nodejs-for-development)
- [Usage](#usage)
  - [StdIO Transport (Default)](#stdio-transport-default)
  - [SSE Transport](#sse-transport)
- [Connecting to an AI Assistant](#connect-to-ai-assistant)
- [Available MCP Tools](#mcp-tools)
- [Development](#development)
- [License](#license)

## Why Use This Server?

- **Seamless Integration**: Connect AI tools directly to your Bitbucket Server/Data Center instance.
- **Secure Local Operation**: Runs within your infrastructure, using your Bitbucket Server credentials (e.g., Personal Access Tokens). Credentials are not stored on remote servers.
- **Developer Focused**: Designed to help AI assistants understand and interact with your codebase, pull requests, and repository structure.
- **Standardized Interaction**: Implements the Model Context Protocol (MCP) for consistent communication with AI systems.

## What is MCP?

Model Context Protocol (MCP) is an open standard for securely connecting AI systems to external tools and data sources. This server implements MCP for Bitbucket Server/Data Center, enabling AI assistants to interact with your Bitbucket data programmatically.

## Prerequisites

- **Node.js**: Version 18.x or higher.
- **Bitbucket Server/Data Center Account**: Access to a Bitbucket Server/Data Center instance with a Personal Access Token (PAT).
- **Git**: For cloning the repository.
- **Docker**: (Recommended) For running the server in a containerized environment.

## Setup

You can run this MCP server using Docker (recommended) or directly with Node.js.

### Option A: Running with Docker (Recommended)

1.  **Clone the Repository:**
    ```bash
    git clone <repository_url>
    cd mcp-bitbucket-n11
    ```

2.  **Build the Docker Image:**
    ```bash
    docker build -t mcp-bitbucket-n11:latest .
    ```

3.  **Run the Docker Container:**
    ```bash
    docker run -i --rm --network=host \
      -e BITBUCKET_URL="https://your-bitbucket-server.com" \
      -e BITBUCKET_TOKEN="your_personal_access_token" \
      mcp-bitbucket-n11:latest
    ```

### Option B: Running Locally with Node.js (for Development)

1.  **Clone the Repository:**
    ```bash
    git clone <repository_url>
    cd mcp-bitbucket-n11
    ```

2.  **Install Dependencies:**
    ```bash
    npm install
    ```

3.  **Configure Credentials:**
    Create a `.env` file in the project root:
    ```env
    BITBUCKET_URL=https://your-bitbucket-server.com
    BITBUCKET_TOKEN=your_personal_access_token
    ```

4.  **Build and Run the Server:**
    ```bash
    npm run build
    npm start
    ```

## Usage

This server supports two transport options:

### StdIO Transport (Default)

Communication happens through standard input/output, suitable for direct integration with AI systems that launch the server as a child process.

```bash
npm start
```

### SSE Transport

Runs a persistent HTTP server with Server-Sent Events (SSE), enabling remote connections.

```bash
npm run start:sse
```

By default, the SSE server runs on port `9000`. You can customize this with the `MCP_SSE_PORT` environment variable.

## Connect to AI Assistant

Configure your MCP-compatible client (e.g., an AI coding assistant) to use this server. Here is an example `mcp_config.json`:

```json
{
  "mcpServers": {
    "mcp-bitbucket-n11": {
      "command": "docker",
      "args": [
        "run", "-i", "--rm", "--network=host",
        "-e", "BITBUCKET_URL",
        "-e", "BITBUCKET_TOKEN",
        "mcp-bitbucket-n11:latest"
      ],
      "env": {
        "BITBUCKET_URL": "https://your-bitbucket-server.com",
        "BITBUCKET_TOKEN": "your_personal_access_token"
      }
    }
  }
}
```

## MCP Tools

This server provides a suite of tools for interacting with Bitbucket Server/Data Center. Below is a list of available tools:

- `bitbucket_create_pull_request`
- `bitbucket_get_pull_request_details`
- `bitbucket_merge_pull_request`
- `bitbucket_decline_pull_request`
- `bitbucket_add_pull_request_comment`
- `bitbucket_get_pull_request_diff`
- `bitbucket_get_pull_request_reviews`
- `bitbucket_list_workspaces`
- `bitbucket_list_repositories`
- `bitbucket_search_content`
- `bitbucket_get_repository_details`
- `bitbucket_get_file_content`
- `bitbucket_create_branch`
- `bitbucket_add_pull_request_file_line_comment`
- `bitbucket_list_repository_branches`

For detailed parameter information, refer to the Zod schemas in `src/application/dtos/`.

## Development

- **Watch for changes and rebuild:** `npm run dev`
- **Lint code:** `npm run lint`
- **Run tests:** `npm run test`
- **Inspect MCP server:** `npm run inspector`

## License

This project is licensed under the Creative Commons Attribution-NonCommercial-ShareAlike 4.0 International License (CC BY-NC-SA 4.0).

See the `LICENSE` file for more details.
