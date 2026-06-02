import {injectable} from "inversify";
import {McpServer} from "@modelcontextprotocol/sdk/server/mcp.js";
import {readFileSync} from "node:fs";
import {fileURLToPath} from "node:url";
import {dirname, resolve} from "node:path";
import type {IMcpServerFactory} from "../../application/factory/IMcpServerFactory.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const pkg = JSON.parse(
    readFileSync(resolve(__dirname, "../../../../package.json"), "utf-8")
) as { name: string; version: string };

@injectable()
export class McpServerFactory implements IMcpServerFactory {
    create(): McpServer {
        return new McpServer(
            {
                name: pkg.name,
                version: pkg.version,
            },
            {
                capabilities: {
                    tools: {},
                },
            }
        );
    }
}
