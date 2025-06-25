# mcp-bitbucket-n11

![License: CC BY-NC-SA 4.0](https://img.shields.io/badge/License-CC%20BY--NC--SA%204.0-lightgrey.svg)
![Version](https://img.shields.io/badge/version-1.0.0-blue)

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

1. **Clone the Repository:**
   ```bash
   git clone <repository_url>
   cd mcp-bitbucket-n11
   ```

2. **Build the Docker Image:**
   ```bash
   docker build -t mcp-bitbucket-n11:latest .
   ```

3. **Run with Docker:**
   ```bash
   docker run -i --rm \
     -e BITBUCKET_URL="https://your-bitbucket-server.com" \
     -e BITBUCKET_TOKEN="your_personal_access_token" \
     mcp-bitbucket-n11:latest
   ```

### Local Development

1. **Clone and Install:**
   ```bash
   git clone <repository_url>
   cd mcp-bitbucket-n11
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

### HTTP Streaming Transport

For scenarios requiring remote connections or web-based integrations, the server supports HTTP streaming transport with Server-Sent Events (SSE).

**Enable HTTP Transport:**

```bash
# Using Docker
docker run -i --rm \
  -p 3001:3001 \
  -e BITBUCKET_URL="https://your-bitbucket-server.com" \
  -e BITBUCKET_TOKEN="your_personal_access_token" \
  -e ENABLE_HTTP_TRANSPORT="true" \
  -e MCP_HTTP_PORT="3001" \
  -e MCP_HTTP_ENDPOINT="stream" \
  mcp-bitbucket-n11:latest

# Using npm script
npm run start:http
```

**Example MCP Configuration for HTTP Transport:**

```json
{
  "mcpServers": {
    "mcp-bitbucket-n11": {
      "command": "docker",
      "args": [
        "run", "-i", "--rm",
        "-p", "3001:3001",
        "-e", "BITBUCKET_URL",
        "-e", "BITBUCKET_TOKEN", 
        "-e", "ENABLE_HTTP_TRANSPORT",
        "-e", "MCP_HTTP_PORT",
        "-e", "MCP_HTTP_ENDPOINT",
        "mcp-bitbucket-n11:latest"
      ],
      "env": {
        "BITBUCKET_URL": "https://your-bitbucket-server.com",
        "BITBUCKET_TOKEN": "your_personal_access_token",
        "ENABLE_HTTP_TRANSPORT": "true",
        "MCP_HTTP_PORT": "3001",
        "MCP_HTTP_ENDPOINT": "stream"
      }
    }
  }
}
```

**HTTP Endpoints:**

- **POST** `http://localhost:3001/stream` - Send MCP requests
- **GET** `http://localhost:3001/stream` - Server-Sent Events stream
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
  mcp-bitbucket-n11:latest
```

**Configuration with API Key:**

```json
{
  "mcpServers": {
    "mcp-bitbucket-n11": {
      "command": "docker",
      "args": [
        "run", "-i", "--rm",
        "-p", "3001:3001",
        "-e", "BITBUCKET_URL",
        "-e", "BITBUCKET_TOKEN",
        "-e", "ENABLE_HTTP_TRANSPORT",
        "-e", "MCP_API_KEY",
        "mcp-bitbucket-n11:latest"
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
cd mcp-bitbucket-n11
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

This project is licensed under the Creative Commons Attribution-NonCommercial-ShareAlike 4.0 International License (CC BY-NC-SA 4.0).

See the `LICENSE` file for more details.

---

Built with the [Model Context Protocol](https://modelcontextprotocol.io)
