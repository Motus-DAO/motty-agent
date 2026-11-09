#!/usr/bin/env node
/**
 * Motty Pay — MCP server over stdio (JSON-RPC 2.0, newline-delimited).
 *
 *   MOTTY_ADAPTER=mock node dist/mcp/server.js
 *
 * Same tool layer as the in-process agent; the default adapter is the mock: no
 * database, no chain, no keys.
 */
import { createInterface } from "node:readline";
import { ensurePaymentsAdapter, handleMcpRequest } from "./protocol.js";

type JsonRpcId = string | number | null;

function write(payload: unknown) {
  process.stdout.write(JSON.stringify(payload) + "\n");
}

async function main() {
  ensurePaymentsAdapter();

  const rl = createInterface({ input: process.stdin, crlfDelay: Infinity });
  for await (const line of rl) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    let message: { id?: JsonRpcId; method?: string; params?: unknown };
    try {
      message = JSON.parse(trimmed);
    } catch {
      write({ jsonrpc: "2.0", id: null, error: { code: -32700, message: "parse error" } });
      continue;
    }

    if (typeof message.method !== "string") {
      write({ jsonrpc: "2.0", id: message.id ?? null, error: { code: -32600, message: "invalid request" } });
      continue;
    }

    const id = message.id ?? null;
    try {
      const outcome = await handleMcpRequest(message.method, message.params);
      if (outcome.kind === "notification") continue;
      if (outcome.kind === "error") {
        write({ jsonrpc: "2.0", id, error: { code: outcome.code, message: outcome.message } });
        continue;
      }
      write({ jsonrpc: "2.0", id, result: outcome.result });
    } catch (error) {
      write({
        jsonrpc: "2.0",
        id,
        error: { code: -32603, message: error instanceof Error ? error.message : "internal error" },
      });
    }
  }
}

void main();
