# Contributing to MCP Bitbucket

Thank you for your interest in contributing to the MCP Bitbucket project! This document provides guidelines and information for contributors.

## Table of Contents

- [Getting Started](#getting-started)
- [Development Setup](#development-setup)
- [Code Standards](#code-standards)
- [Testing](#testing)
- [Submitting Changes](#submitting-changes)
- [Reporting Issues](#reporting-issues)

## Getting Started

1. **Fork the repository** on GitHub
2. **Clone your fork** locally:
   ```bash
   git clone https://github.com/your-username/mcp-bitbucket.git
   cd mcp-bitbucket
   ```
3. **Add the upstream repository**:
   ```bash
   git remote add upstream https://github.com/original-repo/mcp-bitbucket.git
   ```

## Development Setup

### Prerequisites
- Node.js 18.x or higher
- npm or yarn
- Docker (optional, for containerized development)

### Installation
```bash
# Install dependencies
npm install

# Build the project
npm run build

# Run tests
npm test

# Start development mode
npm run dev
```

### Environment Setup
```bash
# Copy environment template
cp config.template.env .env

# Edit .env with your Bitbucket credentials
BITBUCKET_URL=https://your-bitbucket-server.com
BITBUCKET_TOKEN=your_personal_access_token
ENABLE_HTTP_TRANSPORT=true
MCP_HTTP_PORT=3001
MCP_HTTP_ENDPOINT=mcp
```

## Code Standards

### TypeScript Guidelines
- Use strict TypeScript configuration
- Implement proper typing for all functions and variables
- Use interfaces for complex object types
- Follow existing naming conventions

### Architecture Principles
- Follow clean architecture patterns (domain/application/infrastructure)
- Use dependency injection with Inversify
- Implement proper error handling and logging
- Write testable, modular code

### Code Style
- Use ESLint configuration provided in the project
- Follow existing code formatting and structure
- Use meaningful variable and function names
- Add JSDoc comments for public APIs

### Example Code Structure
```typescript
// Good: Clean interface definition
export interface IBitbucketService {
    createPullRequest(input: CreatePullRequestInput): Promise<PullRequest>;
}

// Good: Proper error handling
async function handleRequest(input: any): Promise<Result> {
    try {
        const validatedInput = schema.parse(input);
        return await service.process(validatedInput);
    } catch (error) {
        logger.error('Request processing failed', { error, input });
        throw new McpError(ErrorCode.InvalidRequest, error.message);
    }
}
```

## Testing

### Running Tests
```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage
```

### Writing Tests
- Write unit tests for all new functionality
- Use Jest testing framework
- Mock external dependencies appropriately
- Aim for high test coverage

### Test Structure
```typescript
describe('BitbucketService', () => {
    let service: BitbucketService;
    
    beforeEach(() => {
        service = new BitbucketService(mockDependencies);
    });
    
    it('should create pull request successfully', async () => {
        // Arrange
        const input = createMockInput();
        
        // Act
        const result = await service.createPullRequest(input);
        
        // Assert
        expect(result).toBeDefined();
        expect(result.id).toBeTruthy();
    });
});
```

## Submitting Changes

### Branch Naming
- `feature/description` - New features
- `bugfix/description` - Bug fixes
- `docs/description` - Documentation updates
- `refactor/description` - Code refactoring

### Commit Messages
Follow conventional commit format:
```
type(scope): brief description

Detailed explanation if needed

Fixes #issue-number
```

Examples:
- `feat(api): add pull request merge functionality`
- `fix(auth): resolve token validation issue`
- `docs(readme): update installation instructions`

### Pull Request Process

1. **Create a feature branch**:
   ```bash
   git checkout -b feature/my-new-feature
   ```

2. **Make your changes** following the code standards

3. **Run tests and linting**:
   ```bash
   npm test
   npm run lint
   ```

4. **Commit your changes**:
   ```bash
   git add .
   git commit -m "feat(scope): description of changes"
   ```

5. **Push to your fork**:
   ```bash
   git push origin feature/my-new-feature
   ```

6. **Create a Pull Request** on GitHub with:
   - Clear title and description
   - Reference to related issues
   - Screenshots or examples if applicable
   - Confirmation that tests pass

### PR Requirements
- [ ] Code follows project style guidelines
- [ ] Self-review of the code completed
- [ ] Tests added/updated for new functionality
- [ ] All tests pass
- [ ] Documentation updated if needed
- [ ] No new TypeScript errors or warnings

## Reporting Issues

### Bug Reports
When reporting bugs, please include:
- **Environment**: OS, Node.js version, package version
- **Steps to reproduce** the issue
- **Expected behavior** vs actual behavior
- **Error messages** or logs
- **Configuration** details (sanitized)

### Feature Requests
For feature requests, please include:
- **Use case** description
- **Proposed solution** or implementation approach
- **Alternatives considered**
- **Additional context** or examples

### Security Issues
Please refer to our [Security Policy](SECURITY.md) for reporting security vulnerabilities.

## Development Tips

### Debugging
```bash
# Enable debug logging
DEBUG=mcp:* npm start

# Use inspector for debugging
npm run inspector
```

### Docker Development
```bash
# Build development image
docker build -t mcp-bitbucket:dev .

# Run with development settings
docker run -it --rm \
  -e BITBUCKET_URL="$BITBUCKET_URL" \
  -e BITBUCKET_TOKEN="$BITBUCKET_TOKEN" \
  mcp-bitbucket:dev
```

## Questions?

If you have questions about contributing, please:
- Check existing issues and discussions
- Create a new issue with the `question` label
- Reach out to maintainers via GitHub

Thank you for contributing to MCP Bitbucket! 🚀 