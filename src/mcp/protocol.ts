/**
 * Shared MCP request handling: one implementation for the stdio server and the
 * HTTP transport, so both expose exactly the same tools and semantics.
 */
import { createEmptySession } from "../core/session.js";
import { configureMottyPayments, getMottyPaymentsAdapter } from "../core/payments.js";
import { createMockPaymentsAdapter } from "../adapters/mock.js";
import {
  DEFAULT_ENABLED_TOOLS,
  PAYMENT_ENABLED_TOOLS,
  enabledToolSchemas,
  executeMottyTool,
  type MottyToolName,
  type OpenAiTool,
} from "../tools/index.js";
import { MOTTY_VERSION } from "../core/version.js";

export const MCP_PROTOCOL_VERSION = "2024-11-05";

export const MCP_ENABLED_TOOLS: MottyToolName[] = [
  ...DEFAULT_ENABLED_TOOLS,
  ...PAYMENT_ENABLED_TOOLS,
];

/** The mock adapter keeps the server usable with no DB, chain or keys. */
export function ensurePaymentsAdapter(): void {
  if (process.env.MOTTY_ADAPTER === "host" && getMottyPaymentsAdapter()) return;
  if (!getMottyPaymentsAdapter()) configureMottyPayments(createMockPaymentsAdapter());
}

export function toMcpTool(tool: OpenAiTool) {
  return {
    name: tool.function.name,
    description: tool.function.description,
    inputSchema: tool.function.parameters,
  };
}

export type McpOutcome =
  | { kind: "result"; result: unknown }
  | { kind: "error"; code: number; message: string }
  | { kind: "notification" };

export async function handleMcpRequest(
  method: string,
  params: unknown,
): Promise<McpOutcome> {
  ensurePaymentsAdapter();

  switch (method) {
    case "initialize":
      return {
        kind: "result",
        result: {
          protocolVersion: MCP_PROTOCOL_VERSION,
          capabilities: { tools: {} },
          serverInfo: { name: "motty-pay", version: MOTTY_VERSION },
        },
      };
    case "notifications/initialized":
    case "notifications/cancelled":
      return { kind: "notification" };
    case "ping":
      return { kind: "result", result: {} };
    case "tools/list":
      return {
        kind: "result",
        result: { tools: enabledToolSchemas(MCP_ENABLED_TOOLS).map(toMcpTool) },
      };
    case "tools/call": {
      const { name, arguments: args } = (params ?? {}) as {
        name?: string;
        arguments?: unknown;
      };
      if (!name) return { kind: "error", code: -32602, message: "missing tool name" };

      const session = createEmptySession({ locale: "es", userId: "mcp-client" });
      const { result } = await executeMottyTool(
        name,
        args ?? {},
        session,
        MCP_ENABLED_TOOLS,
      );
      return {
        kind: "result",
        result: {
          content: [{ type: "text", text: JSON.stringify(result) }],
          isError: result.ok === false,
        },
      };
    }
    default:
      return { kind: "error", code: -32601, message: `method not found: ${method}` };
  }
}
