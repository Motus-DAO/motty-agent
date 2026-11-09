/**
 * MCP over HTTP (streamable transport, JSON responses).
 *
 *   POST /mcp   → JSON-RPC 2.0, one request per call
 *   GET  /mcp   → 405 (this server does not open an SSE stream)
 *
 * Stateless: every call is independent, so a load balancer can put it anywhere.
 */
import type { IncomingMessage, ServerResponse } from "node:http";
import { ensurePaymentsAdapter, handleMcpRequest } from "./protocol.js";

const CORS = {
  "access-control-allow-origin": "*",
  "access-control-allow-methods": "POST, GET, OPTIONS",
  "access-control-allow-headers":
    "content-type, mcp-session-id, mcp-protocol-version, accept",
};

function send(res: ServerResponse, status: number, body: unknown) {
  res.writeHead(status, { ...CORS, "content-type": "application/json" });
  res.end(JSON.stringify(body));
}

async function readBody(req: IncomingMessage): Promise<string> {
  const chunks: Buffer[] = [];
  for await (const chunk of req) chunks.push(chunk as Buffer);
  return Buffer.concat(chunks).toString("utf8");
}

/** Returns true when the request was an /mcp request and was handled here. */
export async function handleMcpHttp(
  req: IncomingMessage,
  res: ServerResponse,
): Promise<boolean> {
  const url = (req.url ?? "").split("?")[0];
  if (url !== "/mcp" && url !== "/mcp/") return false;

  ensurePaymentsAdapter();

  if (req.method === "OPTIONS") {
    res.writeHead(204, CORS);
    res.end();
    return true;
  }

  if (req.method !== "POST") {
    res.writeHead(405, { ...CORS, allow: "POST", "content-type": "application/json" });
    res.end(JSON.stringify({ error: "use POST with a JSON-RPC body" }));
    return true;
  }

  let message: { id?: string | number | null; method?: string; params?: unknown };
  try {
    message = JSON.parse(await readBody(req));
  } catch {
    send(res, 400, { jsonrpc: "2.0", id: null, error: { code: -32700, message: "parse error" } });
    return true;
  }

  if (typeof message?.method !== "string") {
    send(res, 400, { jsonrpc: "2.0", id: message?.id ?? null, error: { code: -32600, message: "invalid request" } });
    return true;
  }

  // Notifications carry no id and get no body back.
  if (message.id === undefined || message.id === null) {
    await handleMcpRequest(message.method, message.params);
    res.writeHead(202, CORS);
    res.end();
    return true;
  }

  try {
    const outcome = await handleMcpRequest(message.method, message.params);
    if (outcome.kind === "error") {
      send(res, 200, {
        jsonrpc: "2.0",
        id: message.id,
        error: { code: outcome.code, message: outcome.message },
      });
      return true;
    }
    if (outcome.kind === "notification") {
      res.writeHead(202, CORS);
      res.end();
      return true;
    }
    send(res, 200, { jsonrpc: "2.0", id: message.id, result: outcome.result });
  } catch (error) {
    send(res, 200, {
      jsonrpc: "2.0",
      id: message.id,
      error: {
        code: -32603,
        message: error instanceof Error ? error.message : "internal error",
      },
    });
  }

  return true;
}
