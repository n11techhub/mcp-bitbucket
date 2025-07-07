# GitHub Container Registry (GHCR) Setup

This guide explains how the MCP Bitbucket project automatically publishes Docker images to GitHub Container Registry.

## 🚀 Quick Start

### Using the Published Image

```bash
# Pull the latest image
docker pull ghcr.io/n11tech/mcp-bitbucket:latest

# Run the container
docker run -i --rm \
  -e BITBUCKET_URL="https://your-bitbucket-server.com" \
  -e BITBUCKET_TOKEN="your_personal_access_token" \
  ghcr.io/n11tech/mcp-bitbucket:latest
```

## 📦 Available Images

The project automatically publishes images to:
- **Registry**: `ghcr.io/n11tech/mcp-bitbucket`
- **Package Page**: [github.com/n11tech/mcp-bitbucket/pkgs/container/mcp-bitbucket](https://github.com/n11tech/mcp-bitbucket/pkgs/container/mcp-bitbucket)

## 🏷️ Image Tags

### Automatic Tagging Strategy

| Event | Tags Created | Example |
|-------|-------------|---------|
| **Push to main** | `latest`, `main-<sha>` | `latest`, `main-abc1234` |
| **Version tag** | `<version>`, `<major>.<minor>`, `<major>` | `1.2.3`, `1.2`, `1` |
| **Pull Request** | `pr-<number>` | `pr-42` |

### Version Examples

```bash
# Latest stable release
docker pull ghcr.io/n11tech/mcp-bitbucket:latest

# Specific version
docker pull ghcr.io/n11tech/mcp-bitbucket:1.0.0

# Major version (automatically updated)
docker pull ghcr.io/n11tech/mcp-bitbucket:1
```

## 🔧 Multi-Platform Support

All images are built for multiple architectures:
- `linux/amd64` (Intel/AMD 64-bit)
- `linux/arm64` (ARM 64-bit, Apple Silicon)

Docker automatically pulls the correct architecture for your system.

## 🔐 Security Features

Images include security attestations:
- ✅ **SBOM** (Software Bill of Materials)
- ✅ **Provenance** attestations
- ✅ **Vulnerability scanning** ready
- ✅ **Layer caching** for fast builds

## 🔄 Automated Publishing

### GitHub Actions Workflow

The publishing is fully automated via [`.github/workflows/docker-publish.yml`](.github/workflows/docker-publish.yml):

1. **Triggers**: Push to `main`, version tags, pull requests
2. **Build**: Multi-platform Docker images
3. **Test**: Runs tests during build
4. **Publish**: Pushes to GHCR automatically
5. **Summary**: Provides build summary in GitHub Actions

### No Manual Setup Required

- ✅ **No secrets needed** - Uses built-in `GITHUB_TOKEN`
- ✅ **No additional configuration** - Works out of the box
- ✅ **Free for public repositories**
- ✅ **Integrated with GitHub** - Shows in repository packages

## 📋 Usage Examples

### MCP Client Configuration

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

### HTTP Transport

```bash
# Run with HTTP transport enabled
docker run -i --rm \
  -p 3001:3001 \
  -e BITBUCKET_URL="https://your-bitbucket-server.com" \
  -e BITBUCKET_TOKEN="your_personal_access_token" \
  -e ENABLE_HTTP_TRANSPORT="true" \
  ghcr.io/n11tech/mcp-bitbucket:latest
```

### Docker Compose

```yaml
version: '3.8'
services:
  mcp-bitbucket:
    image: ghcr.io/n11tech/mcp-bitbucket:latest
    environment:
      - BITBUCKET_URL=https://your-bitbucket-server.com
      - BITBUCKET_TOKEN=your_personal_access_token
      - ENABLE_HTTP_TRANSPORT=true
    ports:
      - "3001:3001"
    restart: unless-stopped
```

## 🔍 Verifying Images

### Check Image Details

```bash
# Inspect the image
docker inspect ghcr.io/n11tech/mcp-bitbucket:latest

# View image layers
docker history ghcr.io/n11tech/mcp-bitbucket:latest

# Check for vulnerabilities (if you have docker scout)
docker scout cves ghcr.io/n11tech/mcp-bitbucket:latest
```

### Verify Attestations

```bash
# View SBOM (if supported by your Docker version)
docker sbom ghcr.io/n11tech/mcp-bitbucket:latest

# View provenance (if supported)
docker provenance ghcr.io/n11tech/mcp-bitbucket:latest
```

## 🆕 Releasing New Versions

### Creating a Release

1. **Tag a version:**
   ```bash
   git tag v1.0.0
   git push origin v1.0.0
   ```

2. **GitHub Actions automatically:**
   - Builds the image
   - Tags it with version numbers
   - Publishes to GHCR
   - Creates release artifacts

3. **Available tags after release:**
   - `ghcr.io/n11tech/mcp-bitbucket:1.0.0`
   - `ghcr.io/n11tech/mcp-bitbucket:1.0`
   - `ghcr.io/n11tech/mcp-bitbucket:1`
   - `ghcr.io/n11tech/mcp-bitbucket:latest`