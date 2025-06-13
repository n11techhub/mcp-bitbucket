# SSE Transport for MCP Bitbucket Client

This implementation provides a Server-Sent Events (SSE) transport for the MCP Bitbucket client. It enables a request-response architecture while maintaining an open connection between the client and server, making it suitable for n8n MCP client tool integration.

## Architecture

The implementation follows DDD (Domain-Driven Design) Onion Architecture principles:

- The domain business logic and entities remain completely independent from the SSE transport mechanism
- The SSE transport is implemented in the infrastructure layer
- The transport adheres to interface contracts defined by the application layer

## Components

1. **McpSseTransport**: Implements the ServerTransport interface to provide SSE capabilities
   - Exposes `/sse` endpoint for SSE connections
   - Supports POST requests to the same endpoint for client-to-server communication
   - Properly handles connection lifecycle and client management

2. **McpSseServer**: Manages the SSE server lifecycle 
   - Follows dependency injection pattern for loose coupling
   - Controls server start/stop operations
   - Delegates actual communication to McpSseTransport

## Usage

### Starting the Server

Build and start the server with the SSE transport:

```bash
# First build the project
npm run build

# Start the server with SSE transport
npm run start:sse
```

By default, the server runs on port 9000. You can modify this by setting the `MCP_SSE_PORT` environment variable.

### Environment Configuration

```
MCP_SSE_PORT=9000  # Port for the SSE server (default: 9000)
```

### Connecting to the SSE Server

Clients can connect to the SSE transport through the `/sse` endpoint:

```javascript
// Client-side connection example
const eventSource = new EventSource('http://localhost:9000/sse?clientId=client123');

// Listen for messages from the server
eventSource.onmessage = (event) => {
  const data = JSON.parse(event.data);
  console.log('Received data:', data);
};

// Sending requests to the server
async function sendRequest(method, params) {
  const response = await fetch('http://localhost:9000/sse?clientId=client123', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      id: Date.now(),
      method,
      params
    }),
  });
  
  return await response.json();
}

// Example usage with n8n MCP client tools
sendRequest('list_tools', {})
  .then(tools => console.log('Available tools:', tools));
```

## Integration with n8n

To use this SSE transport with n8n MCP client tools:

1. Configure the n8n MCP client to connect to the SSE endpoint
2. Use the request-response pattern for tool invocation
3. Monitor the SSE stream for asynchronous updates or notifications

This implementation enables seamless integration while maintaining the architecture's integrity.
