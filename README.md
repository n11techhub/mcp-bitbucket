# mcp-bitbucket

![License: Apache 2.0](https://img.shields.io/badge/License-Apache%202.0-blue.svg)
![Version](https://img.shields.io/badge/version-1.0.0-blue)
[![GitHub Container Registry](https://img.shields.io/badge/ghcr.io-n11tech%2Fmcp--bitbucket-blue?logo=github&logoColor=white)](https://github.com/n11tech/mcp-bitbucket/pkgs/container/mcp-bitbucket)
[![Docker Build](https://img.shields.io/github/actions/workflow/status/n11tech/mcp-bitbucket/docker-publish.yml?branch=main&label=Docker%20Build&logo=docker&logoColor=white)](https://github.com/n11tech/mcp-bitbucket/actions/workflows/docker-publish.yml)

**A Node.js/TypeScript Model Context Protocol (MCP) server for Atlassian Bitbucket Server/Data Center.**

This server enables AI systems (e.g., LLMs, AI coding assistants) to securely interact with your self-hosted Bitbucket repositories, pull requests, projects, and code in real time through both standard stdio and HTTP streaming transports.

## Table of Contents

- [Features](#features)
- [What is MCP?](#what-is-mcp)
- [Prerequisites](#prerequisites)
- [Installation](#installation)
  - [Docker (Recommended)](#docker-recommended)
  - [Local Development](#local-development)
- [Configuration](#configuration)
  - [Environment Variables](#environment-variables)
  - [MCP Client Setup](#mcp-client-setup)
- [Transport Options](#transport-options)
  - [Standard I/O Transport (Default)](#standard-io-transport-default)
  - [HTTP Streaming Transport](#http-streaming-transport)
- [Security](#security)
  - [API Key Authentication](#api-key-authentication)
- [Usage Examples](#usage-examples)
- [Available Tools](#available-tools)
- [Development](#development)
- [License](#license)

## Features

- **Dual Transport Support**: Choose between stdio and HTTP streaming transports
- **Secure Authentication**: Optional API key authentication for HTTP transport
- **Comprehensive Bitbucket Integration**: Full access to Bitbucket Server/Data Center APIs
- **Developer Focused**: Designed to help AI assistants understand and interact with your codebase
- **Production Ready**: Built with TypeScript, proper error handling, and security best practices
- **Container Support**: Docker support for easy deployment and scaling

## What is MCP?

Model Context Protocol (MCP) is an open standard for securely connecting AI systems to external tools and data sources. This server implements MCP for Bitbucket Server/Data Center, enabling AI assistants to interact with your Bitbucket data programmatically through standardized interfaces.

## Prerequisites

- **Node.js**: Version 18.x or higher
- **Bitbucket Server/Data Center**: Access with a Personal Access Token (PAT)
- **Docker**: (Recommended) For containerized deployment
- **Git**: For cloning the repository

## Installation

### Docker (Recommended)

#### Using Pre-built Image from GHCR

**Pull and run the latest image:**
```bash
# Pull the latest image from GitHub Container Registry
docker pull ghcr.io/n11tech/mcp-bitbucket:latest

# Run with environment variables
docker run -i --rm \
  -e BITBUCKET_URL="https://your-bitbucket-server.com" \
  -e BITBUCKET_TOKEN="your_personal_access_token" \
  ghcr.io/n11tech/mcp-bitbucket:latest
```

#### Building from Source

1. **Clone the Repository:**
   ```bash
   git clone https://github.com/n11tech/mcp-bitbucket.git
   cd mcp-bitbucket
   ```

2. **Build the Docker Image:**
   ```bash
   docker build -t mcp-bitbucket:latest .
   ```

3. **Run with Docker:**
   ```bash
   docker run -i --rm \
     -e BITBUCKET_URL="https://your-bitbucket-server.com" \
     -e BITBUCKET_TOKEN="your_personal_access_token" \
     mcp-bitbucket:latest
   ```

### Local Development

1. **Clone and Install:**
   ```bash
   git clone https://github.com/n11tech/mcp-bitbucket.git
   cd mcp-bitbucket
   npm install
   ```

2. **Build:**
   ```bash
   npm run build
   ```

3. **Start:**
   ```bash
   npm start
   ```

## Using This MCP Server with Smithery CLI

You can use this Bitbucket MCP server locally with the [Smithery CLI](https://smithery.ai/docs). This allows you to connect your AI tools or agents to your self-hosted Bitbucket Server/Data Center. **This server is not hosted on Smithery AI cloud; you must run it yourself (locally or on your own server).**

### Prerequisites
- Node.js 18 or higher
- [Smithery CLI](https://smithery.ai/docs/build/getting-started)

### 1. Install Smithery CLI
```bash
npm install -g @smithery/cli
```

### 2. Start the Bitbucket MCP Server Locally
You must run your own instance of the server (Docker recommended):
```bash
docker run -it --rm \
  -e BITBUCKET_URL="https://your-bitbucket-server.com" \
  -e BITBUCKET_TOKEN="your_personal_access_token" \
  -e ENABLE_HTTP_TRANSPORT="true" \
  -e MCP_HTTP_PORT="3001" \
  -e MCP_HTTP_ENDPOINT="/mcp" \
  -p 3001:3001 \
  ghcr.io/n11tech/mcp-bitbucket:latest
```

Or, using npm:
```bash
npm run start:http
```

### 3. Connect to Your Local MCP Server with Smithery CLI
Once your server is running locally, connect to it using the local address:
```bash
npx @smithery/cli connect http://localhost:3001/mcp
```

### 4. Example: Using with Smithery CLI
Once connected, you can call tools (e.g., list repositories):
```bash
npx @smithery/cli call http://localhost:3001/mcp bitbucket_list_repositories --params '{"workspaceSlug": "your-workspace"}'
```

For more details, see the [Smithery CLI documentation](https://smithery.ai/docs/build/getting-started).

> **Note for Smithery Users:**
>
> When connecting to this MCP server via Smithery, you only need to provide:
> - **Bitbucket Server URL** (e.g., `<your-bitbucket-url>`)
> - **Bitbucket Personal Access Token**
>
> All other environment variables (such as port, endpoint, API key) are managed by the server administrator or deployment and do not need to be set by end users.
>
> If the server administrator has enabled API key authentication, you may be asked to provide an API key as well. In that case, enter the value provided by your admin.

**Example:**

When prompted by Smithery, enter:
```
bitbucketUrl: <your-bitbucket-url>
bitbucketToken: <your-bitbucket-token>
```

## Advanced: Using STDIO Transport

By default, this MCP server is configured for HTTP transport, which is recommended for most users and for Smithery CLI/web integrations.

**Advanced users** who want to run the MCP server as a local subprocess (STDIO transport) can use the following Smithery configuration:

```yaml
startCommand:
  type: "stdio"
  configSchema:
    type: "object"
    required: ["bitbucketUrl", "bitbucketToken"]
    properties:
      bitbucketUrl:
        type: "string"
        description: "The base URL of your self-hosted Bitbucket instance (e.g., https://<your-bitbucket-url>)"
      bitbucketToken:
        type: "string"
        description: "Personal Access Token for Bitbucket Server/Data Center"
  commandFunction: |-
    (config) => ({
      command: 'node',
      args: ['build/infrastructure/index.js'],
      env: {
        BITBUCKET_URL: config.bitbucketUrl,
        BITBUCKET_TOKEN: config.bitbucketToken
      }
    })
  exampleConfig:
    bitbucketUrl: "https://<your-bitbucket-url>"
    bitbucketToken: "<your-bitbucket-token>"
```

This allows you to launch the MCP server as a subprocess and communicate via standard input/output, which may be useful for certain local agent or automation scenarios.

## Configuration

### Environment Variables

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `BITBUCKET_URL` | Your Bitbucket Server/Data Center URL | - | ✅ |
| `BITBUCKET_TOKEN` | Personal Access Token | - | ✅ |
| `ENABLE_HTTP_TRANSPORT` | Enable HTTP streaming transport | `false` | ❌ |
| `MCP_HTTP_PORT` | HTTP server port | `3001` | ❌ |
| `MCP_HTTP_ENDPOINT` | HTTP endpoint path | `/stream` | ❌ |
| `MCP_API_KEY` | API key for authentication | - | ❌ |

### MCP Client Setup

Configure your MCP-compatible client to connect to this server. The configuration depends on your chosen transport method.

## Transport Options

### Standard I/O Transport (Default)

The default transport method uses standard input/output for communication. This is suitable for direct integration with AI systems that launch the server as a child process.

**Example MCP Configuration:**

```json
{
  "mcpServers": {
    "mcp-bitbucket": {
      "command": "docker",
      "args": [
        "run", "-i", "--rm", "--network=host",
        "-e", "BITBUCKET_URL",
        "-e", "BITBUCKET_TOKEN",
        "ghcr.io/n11tech/mcp-bitbucket:latest"
      ],
      "env": {
        "BITBUCKET_URL": "https://your-bitbucket-server.com",
        "BITBUCKET_TOKEN": "your_personal_access_token"
      }
    }
  }
}
```

### HTTP Streaming Transport

For scenarios requiring remote connections or web-based integrations, the server supports HTTP streaming transport with Server-Sent Events (SSE).

**Enable HTTP Transport:**

```bash
# Using GHCR image
docker run -i --rm \
  -p 3001:3001 \
  -e BITBUCKET_URL="https://your-bitbucket-server.com" \
  -e BITBUCKET_TOKEN="your_personal_access_token" \
  -e ENABLE_HTTP_TRANSPORT="true" \
  -e MCP_HTTP_PORT="3001" \
  -e MCP_HTTP_ENDPOINT="mcp" \
  ghcr.io/n11tech/mcp-bitbucket:latest

# Using npm script
npm run start:http
```

**Example MCP Configuration for HTTP Transport:**

```json
{
  "mcpServers": {
    "mcp-bitbucket": {
      "command": "docker",
      "args": [
        "run", "-i", "--rm",
        "-p", "3001:3001",
        "-e", "BITBUCKET_URL",
        "-e", "BITBUCKET_TOKEN", 
        "-e", "ENABLE_HTTP_TRANSPORT",
        "-e", "MCP_HTTP_PORT",
        "-e", "MCP_HTTP_ENDPOINT",
        "ghcr.io/n11tech/mcp-bitbucket:latest"
      ],
      "env": {
        "BITBUCKET_URL": "https://your-bitbucket-server.com",
        "BITBUCKET_TOKEN": "your_personal_access_token",
        "ENABLE_HTTP_TRANSPORT": "true",
        "MCP_HTTP_PORT": "3001",
        "MCP_HTTP_ENDPOINT": "mcp"
      }
    }
  }
}
```

**HTTP Endpoints:**

- **POST** `http://localhost:3001/mcp` - Send MCP requests
- **GET** `http://localhost:3001/mcp` - Server-Sent Events stream
- **GET** `http://localhost:3001/health` - Health check endpoint

## Security

### API Key Authentication

For HTTP transport, you can enable API key authentication to secure your server:

**Setup API Key Authentication:**

```bash
# Generate a secure API key (recommended: 32+ characters)
export MCP_API_KEY="your-secure-api-key-here"

# Run with authentication enabled
docker run -i --rm \
  -p 3001:3001 \
  -e BITBUCKET_URL="https://your-bitbucket-server.com" \
  -e BITBUCKET_TOKEN="your_personal_access_token" \
  -e ENABLE_HTTP_TRANSPORT="true" \
  -e MCP_API_KEY="your-secure-api-key-here" \
  mcp-bitbucket:latest
```

**Configuration with API Key:**

```json
{
  "mcpServers": {
    "mcp-bitbucket": {
      "command": "docker",
      "args": [
        "run", "-i", "--rm",
        "-p", "3001:3001",
        "-e", "BITBUCKET_URL",
        "-e", "BITBUCKET_TOKEN",
        "-e", "ENABLE_HTTP_TRANSPORT",
        "-e", "MCP_API_KEY",
        "mcp-bitbucket:latest"
      ],
      "env": {
        "BITBUCKET_URL": "https://your-bitbucket-server.com",
        "BITBUCKET_TOKEN": "your_personal_access_token",
        "ENABLE_HTTP_TRANSPORT": "true",
        "MCP_API_KEY": "your-secure-api-key-here"
      }
    }
  }
}
```

When API key authentication is enabled, all HTTP requests must include the API key in the request headers or parameters.

## Usage Examples

### Pull Request Management

```javascript
// Create a pull request
await callTool('bitbucket_create_pull_request', {
  repository: 'my-repo',
  title: 'Feature: Add new API endpoint',
  sourceBranch: 'feature/api-endpoint',
  targetBranch: 'main',
  description: 'This PR adds a new REST API endpoint for user management.'
});

// Get pull request details
await callTool('bitbucket_get_pull_request_details', {
  repository: 'my-repo',
  prId: 123
});
```

### Repository Operations

```javascript
// Search repository content
await callTool('bitbucket_search_content', {
  workspaceSlug: 'my-workspace',
  query: 'authentication',
  extension: 'js'
});

// Get file content
await callTool('bitbucket_get_file_content', {
  workspaceSlug: 'my-workspace',
  repoSlug: 'my-repo',
  filePath: 'src/auth/login.js'
});
```

## Available Tools

This server provides a comprehensive suite of tools for interacting with Bitbucket Server/Data Center:

### Pull Request Management
- `bitbucket_create_pull_request` - Create new pull requests
- `bitbucket_get_pull_request_details` - Get PR details and metadata  
- `bitbucket_get_pull_request_diff` - Retrieve PR diffs
- `bitbucket_get_pull_request_reviews` - Get PR review status
- `bitbucket_merge_pull_request` - Merge pull requests
- `bitbucket_decline_pull_request` - Decline pull requests
- `bitbucket_add_pull_request_comment` - Add general PR comments

### Repository Operations
- `bitbucket_list_workspaces` - List available workspaces
- `bitbucket_list_repositories` - Browse repositories
- `bitbucket_get_repository_details` - Get repository information
- `bitbucket_search_content` - Search within repositories
- `bitbucket_get_file_content` - Read file contents

### Branch Management
- `bitbucket_create_branch` - Create new branches
- `bitbucket_list_repository_branches` - List repository branches

### User Management
- `bitbucket_get_user_profile` - Get user profile details

For detailed parameter information and usage examples, refer to the individual tool schemas in `src/domain/contracts/schemas/`.

## Development

### Available Scripts

- **Build**: `npm run build` - Compile TypeScript to JavaScript
- **Start**: `npm start` - Run the server with stdio transport
- **HTTP**: `npm run start:http` - Run with HTTP streaming transport
- **Development**: `npm run dev` - Watch mode for development
- **Lint**: `npm run lint` - Code quality checks
- **Test**: `npm run test` - Run test suite
- **Inspector**: `npm run inspector` - Debug MCP server interactions

### Development Setup

```bash
# Clone and setup
git clone <repository_url>
cd mcp-bitbucket
npm install

# Create environment file
cp .env.example .env
# Edit .env with your Bitbucket credentials

# Development with watch mode
npm run dev
```

### Architecture

The codebase follows clean architecture principles:

```
src/
├── application/          # Application layer
│   ├── facade/          # Client facades  
│   └── use-cases/       # Business logic
├── domain/              # Domain layer
│   ├── contracts/       # Interfaces and schemas
│   ├── entity/          # Domain entities
│   └── repository/      # Repository interfaces
├── infrastructure/      # Infrastructure layer
│   ├── clients/         # External API clients
│   ├── config/          # Configuration management
│   ├── http/            # HTTP transport implementation
│   └── setup/           # Server setup and initialization
```

## License

This project is licensed under the Apache License, Version 2.0.

See the `LICENSE` file for more details.

---

Built with the [Model Context Protocol](https://modelcontextprotocol.io)
