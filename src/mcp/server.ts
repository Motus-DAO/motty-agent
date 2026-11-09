#!/usr/bin/env node
/**
 * Motty Pay — MCP server (stdio, JSON-RPC 2.0, newline-delimited).
 *
 * Exposes the same payment/booking tools the in-process agent uses, so any MCP
 * client (Claude Desktop, Cursor, an orchestrator) can call them.
 *
 *   MOTTY_ADAPTER=mock node dist/mcp/server.js
 *
 * The default adapter is the mock: no database, no chain, no keys. Wire a real
 * `MottyPaymentsAdapter` in your host if you want live payments.
 */
import { createInterface } from "node:readline";
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

const PROTOCOL_VERSION = "2024-11-05";
const ENABLED: MottyToolName[] = [
  ...DEFAULT_ENABLED_TOOLS,
  ...PAYMENT_ENABLED_TOOLS,
];

function ensureAdapter(): void {
  if (process.env.MOTTY_ADAPTER === "host") {
    // The host registers its adapter before importing this module.
    if (!getMottyPaymentsAdapter()) configureMottyPayments(createMockPaymentsAdapter());
    return;
  }
  configureMottyPayments(createMockPaymentsAdapter());
}

function toMcpTool(tool: OpenAiTool) {
  return {
    name: tool.function.name,
    description: tool.function.description,
    inputSchema: tool.function.parameters,
  };
}

type JsonRpcId = string | number | null;

function reply(id: JsonRpcId, result: unknown) {
  process.stdout.write(JSON.stringify({ jsonrpc: "2.0", id, result }) + "\n");
}

function fail(id: JsonRpcId, code: number, message: string) {
  process.stdout.write(JSON.stringify({ jsonrpc: "2.0", id, error: { code, message } }) + "\n");
}

async function handle(method: string, params: unknown, id: JsonRpcId) {
  switch (method) {
    case "initialize":
      return reply(id, {
        protocolVersion: PROTOCOL_VERSION,
        capabilities: { tools: {} },
        serverInfo: { name: "motty-pay", version: MOTTY_VERSION },
      });
    case "notifications/initialized":
    case "notifications/cancelled":
      return; // notifications never get a response
    case "ping":
      return reply(id, {});
    case "tools/list":
      return reply(id, { tools: enabledToolSchemas(ENABLED).map(toMcpTool) });
    case "tools/call": {
      const { name, arguments: args } = (params ?? {}) as {
        name?: string;
        arguments?: unknown;
      };
      if (!name) return fail(id, -32602, "missing tool name");

      const session = createEmptySession({ locale: "es", userId: "mcp-client" });
      const { result } = await executeMottyTool(name, args ?? {}, session, ENABLED);
      return reply(id, {
        content: [{ type: "text", text: JSON.stringify(result) }],
        isError: result.ok === false,
      });
    }
    default:
      return fail(id, -32601, `method not found: ${method}`);
  }
}

async function main() {
  ensureAdapter();

  const rl = createInterface({ input: process.stdin, crlfDelay: Infinity });
  for await (const line of rl) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    let message: { id?: JsonRpcId; method?: string; params?: unknown };
    try {
      message = JSON.parse(trimmed);
    } catch {
      fail(null, -32700, "parse error");
      continue;
    }

    if (typeof message.method !== "string") {
      fail(message.id ?? null, -32600, "invalid request");
      continue;
    }

    try {
      await handle(message.method, message.params, message.id ?? null);
    } catch (error) {
      fail(message.id ?? null, -32603, error instanceof Error ? error.message : "internal error");
    }
  }
}

void main();
