import type {McpServer} from "@modelcontextprotocol/sdk/server/mcp.js";

export interface IMcpServerFactory {
    create(): McpServer;
}