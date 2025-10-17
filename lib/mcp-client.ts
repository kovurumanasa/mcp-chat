/**
 * Helper to build extraHeaders for initializeMCPClients from a bearer token
 * @param token - The access token string
 * @returns Record<string, string> with Authorization header
 */
export function buildAuthHeaders(token?: string): Record<string, string> | undefined {
  if (!token) return undefined;
  return { authorization: `Bearer ${token}` };
}

// Example usage:
// import { buildAuthHeaders, initializeMCPClients } from './mcp-client';
// const extraHeaders = buildAuthHeaders(accessToken);
// await initializeMCPClients(mcpServers, abortSignal, extraHeaders);
import { experimental_createMCPClient as createMCPClient } from 'ai';
import { StreamableHTTPClientTransport } from '@modelcontextprotocol/sdk/client/streamableHttp.js';

export interface KeyValuePair {
  key: string;
  value: string;
}

export interface MCPServerConfig {
  url: string;
  type: 'sse' | 'http';
  headers?: KeyValuePair[];
}

export interface MCPClientManager {
  tools: Record<string, any>;
  clients: any[];
  cleanup: () => Promise<void>;
}

/**
 * Initialize MCP clients for API calls
 * This uses the already running persistent HTTP or SSE servers
 *
 * @param mcpServers - Array of MCP server configs
 * @param abortSignal - Optional AbortSignal for cleanup
 * @param extraHeaders - Optional extra headers (e.g., { Authorization: 'Bearer ...' }) to merge with each server's headers
 * @returns MCPClientManager with tools, clients, and cleanup
 */
export async function initializeMCPClients(
  mcpServers: MCPServerConfig[] = [],
  abortSignal?: AbortSignal,
  extraHeaders?: Record<string, string>
): Promise<MCPClientManager> {
  // Initialize tools
  let tools = {};
  const mcpClients: any[] = [];

  // Process each MCP server configuration
  for (const mcpServer of mcpServers) {
    try {
      // Merge per-server headers and extraHeaders (extraHeaders take precedence)
      const baseHeaders = mcpServer.headers?.reduce((acc, header) => {
        if (header.key) acc[header.key] = header.value || '';
        return acc;
      }, {} as Record<string, string>) || {};
      const headers = { ...baseHeaders, ...(extraHeaders || {}) };

      const transport = mcpServer.type === 'sse'
        ? {
          type: 'sse' as const,
          url: mcpServer.url,
          headers,
        }
        : new StreamableHTTPClientTransport(new URL(mcpServer.url), {
          requestInit: {
            headers,
          },
        });

      const mcpClient = await createMCPClient({ transport });
      mcpClients.push(mcpClient);

      const mcptools = await mcpClient.tools();

      console.log(`MCP tools from ${mcpServer.url}:`, Object.keys(mcptools));

      // Add MCP tools to tools object
      tools = { ...tools, ...mcptools };
    } catch (error) {
      console.error("Failed to initialize MCP client:", error);
      // Continue with other servers instead of failing the entire request
    }
  }

  // Register cleanup for all clients if an abort signal is provided
  if (abortSignal && mcpClients.length > 0) {
    abortSignal.addEventListener('abort', async () => {
      await cleanupMCPClients(mcpClients);
    });
  }

  return {
    tools,
    clients: mcpClients,
    cleanup: async () => await cleanupMCPClients(mcpClients)
  };
}

/**
 * Clean up MCP clients
 */
async function cleanupMCPClients(clients: any[]): Promise<void> {
  await Promise.all(
    clients.map(async (client) => {
      try {
        await client.disconnect?.();
      } catch (error) {
        console.error("Error during MCP client cleanup:", error);
      }
    })
  );
} 