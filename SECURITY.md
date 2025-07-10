# Security Policy

## Reporting Security Vulnerabilities

If you discover a security vulnerability in mcp-bitbucket, please report it responsibly:

- **Email**: Send details to [Itarchitectteam@n11.com](mailto:security@example.com)
- **Include**: Steps to reproduce, potential impact, and suggested fixes
- **Response**: We will acknowledge receipt within 72 hours and provide updates on our investigation

**Please do not**: Create public GitHub issues for security vulnerabilities until they have been addressed.

## Security Architecture

### Transport Security

#### Standard I/O Transport (Default)
- **Security Level**: High - Direct process communication
- **Exposure**: Local only, no network exposure
- **Authentication**: Not required (process-level isolation)
- **Recommendation**: Use for local development and trusted environments

#### HTTP Streaming Transport
- **Security Level**: Medium - Network accessible
- **Exposure**: Configurable network interface and port
- **Authentication**: Optional API key authentication
- **Recommendation**: Always use API key authentication in production

### Authentication & Authorization

#### Bitbucket Personal Access Tokens
- **Purpose**: Primary authentication with Bitbucket Server/Data Center
- **Scope**: Should have minimal required permissions
- **Storage**: Environment variables only, never in code
- **Rotation**: Rotate tokens every 90 days or when team members leave

#### MCP API Keys
- **Purpose**: Secure HTTP transport access
- **Requirements**: Minimum 32 characters, cryptographically secure
- **Format**: Base64 or hex-encoded random strings
- **Example Generation**:
  ```bash
  # Linux/macOS
  openssl rand -hex 32
  
  # Node.js
  node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
  ```

## Security Best Practices

### 1. Credential Management

#### Bitbucket Tokens
```bash
# ✅ GOOD: Use environment variables
export BITBUCKET_TOKEN="your_personal_access_token"

# ❌ BAD: Never hardcode in scripts or config files
BITBUCKET_TOKEN="BBDC-..."  # This will be exposed!
```

#### Token Permissions
- Grant only the minimum required permissions:
  - **Repository Access**: Only repositories the AI assistant needs
  - **Project Permissions**: Read/Write only if PR creation is needed
  - **API Scopes**: Limit to required operations (repos, pull-requests, etc.)

#### Token Security
- **Never commit tokens** to version control
- **Rotate tokens** every 90 days
- **Use different tokens** for development/staging/production
- **Revoke unused tokens** immediately
- **Monitor token usage** in Bitbucket audit logs

### 2. Environment Security

#### Docker Environment
```bash
# ✅ GOOD: Pass credentials as environment variables
docker run -e BITBUCKET_TOKEN="$BITBUCKET_TOKEN" mcp-bitbucket

# ❌ BAD: Hardcoded credentials in Dockerfile or commands
docker run -e BITBUCKET_TOKEN="BBDC-123..." mcp-bitbucket
```

#### Environment Files
```bash
# ✅ GOOD: Secure .env file permissions
chmod 600 .env

# ✅ GOOD: Add .env to .gitignore
echo ".env" >> .gitignore

# ✅ GOOD: Use .env.example for templates
cp .env.example .env
# Then edit .env with real values
```

### 3. HTTP Transport Security

#### Network Configuration
```bash
# ✅ GOOD: Bind to localhost for local access only
MCP_HTTP_HOST=127.0.0.1

# ⚠️ CAUTION: Only bind to 0.0.0.0 if you need remote access
MCP_HTTP_HOST=0.0.0.0  # Requires proper firewall rules

# ✅ GOOD: Use non-standard ports
MCP_HTTP_PORT=3001  # Instead of common ports like 80/443
```

#### API Key Authentication
```bash
# ✅ REQUIRED: Always use API keys for HTTP transport
MCP_API_KEY="$(openssl rand -hex 32)"

# ✅ GOOD: Use strong, unique API keys
MCP_API_KEY="f47ac10b58cc4372a5670e02b2c3d479c6b4b6ac570e6370d9d9e7b2e4c8a7b3"

# ❌ BAD: Weak or predictable keys
MCP_API_KEY="password123"  # Too weak!
```

#### HTTP Request Security
- All requests to HTTP transport endpoints should include authentication
- Consider implementing rate limiting for production deployments
- Use HTTPS reverse proxy (nginx, Apache) for production
- Implement proper CORS policies if needed

### 4. Logging Security

#### Safe Logging Practices
```javascript
// ✅ GOOD: Sanitize sensitive data in logs
logger.info('Authenticating with Bitbucket', { url: bitbucketUrl });

// ❌ BAD: Logging sensitive information
logger.info('Auth details', { token: bitbucketToken }); // Token exposed!
```

#### Log File Security
- Store logs in secure locations with restricted access
- Rotate logs regularly to prevent disk space issues
- Consider using structured logging with sensitive data filtering
- Never commit log files containing sensitive data

### 5. Container Security

#### Docker Best Practices
```dockerfile
# ✅ GOOD: Use non-root user
USER node

# ✅ GOOD: Use specific image versions
FROM node:18.20.0-alpine

# ✅ GOOD: Minimal attack surface
RUN apk add --no-cache dumb-init
```

#### Runtime Security
```bash
# ✅ GOOD: Run with restricted privileges
docker run --user 1000:1000 \
  --read-only \
  --tmpfs /tmp \
  mcp-bitbucket

# ✅ GOOD: Limit resources
docker run --memory="512m" \
  --cpus="1.0" \
  mcp-bitbucket
```

### 6. Network Security

#### Firewall Configuration
```bash
# ✅ GOOD: Only allow necessary ports
# For stdio transport: No network ports needed
# For HTTP transport: Only allow specific port and sources

# Example iptables rules for HTTP transport
iptables -A INPUT -p tcp --dport 3001 -s 192.168.1.0/24 -j ACCEPT
iptables -A INPUT -p tcp --dport 3001 -j DROP

# Example nginx configuration:
server {
    listen 443 ssl;
    server_name mcp-bitbucket.yourdomain.com;
    
    ssl_certificate /path/to/cert.pem;
    ssl_certificate_key /path/to/key.pem;
    
    location / {
        proxy_pass http://127.0.0.1:3001/mcp;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```