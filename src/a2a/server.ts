#!/usr/bin/env node
/**
 * Motty Pay — A2A (Agent-to-Agent) surface.
 *
 *   GET  /.well-known/agent-card.json   → agent card
 *   POST /                              → JSON-RPC 2.0, method `message/send`
 *
 * A tool call looks like:
 *   { "message": { "role": "user", "parts": [ { "kind": "text",
 *     "text": "/tool quoteTherapyInWmxn" } ] } }
 *
 * Without a `/tool` prefix the agent answers with its capability summary. This
 * is a reference implementation: wire a real `MottyPaymentsAdapter` and a model
 * provider for free-form turns.
 */
import { createServer, type IncomingMessage, type ServerResponse } from "node:http";
import { createEmptySession } from "../core/session.js";
import { configureMottyPayments, getMottyPaymentsAdapter } from "../core/payments.js";
import { createMockPaymentsAdapter } from "../adapters/mock.js";
import {
  DEFAULT_ENABLED_TOOLS,
  PAYMENT_ENABLED_TOOLS,
  enabledToolSchemas,
  executeMottyTool,
  type MottyToolName,
} from "../tools/index.js";
import { MOTTY_VERSION } from "../core/version.js";

const PORT = Number(process.env.PORT || 8080);
const PUBLIC_URL = process.env.MOTTY_PUBLIC_URL || `http://localhost:${PORT}/`;

const ENABLED: MottyToolName[] = [
  ...DEFAULT_ENABLED_TOOLS,
  ...PAYMENT_ENABLED_TOOLS,
];

if (!getMottyPaymentsAdapter()) configureMottyPayments(createMockPaymentsAdapter());

const SKILLS = [
  {
    id: "book-therapy",
    name: "Book a therapy session",
    description:
      "Reads real availability, picks a slot and creates the session with its escrow.",
    tags: ["booking", "therapy", "wmxn"],
    examples: ["book another session with my therapist"],
  },
  {
    id: "settle-escrow",
    name: "Charge and settle in wMXN",
    description:
      "Prepares the escrow deposit, then the 90/10 release on Celo mainnet.",
    tags: ["payments", "escrow", "celo", "wmxn"],
    examples: ["what is the status of my session payment?"],
  },
  {
    id: "pay-people",
    name: "Pay a person",
    description:
      "Resolves a .motus name, a Hub display name, 'my therapist' or an address, then builds the transfer.",
    tags: ["transfers", "motus-name"],
    examples: ["send 1 wMXN to John"],
  },
  {
    id: "ripio-ramp",
    name: "Ripio on-ramp",
    description: "Returns a prefilled Ripio ramp URL to buy wMXN with local money.",
    tags: ["ramp", "ripio", "wmxn"],
    examples: ["I want to buy wMXN with pesos"],
  },
];

const CARD = {
  protocolVersion: "0.2.0",
  name: "Motty Pay",
  description:
    "Installable payment agent for Latin America: books therapy, charges and settles in wMXN on Celo through a 90/10 escrow, pays people and the DAO treasury. Never signs, never custody.",
  url: PUBLIC_URL,
  preferredTransport: "JSONRPC",
  version: MOTTY_VERSION,
  capabilities: { streaming: false, pushNotifications: false },
  defaultInputModes: ["text/plain"],
  defaultOutputModes: ["text/plain"],
  skills: SKILLS,
  provider: { organization: "MotusDAO", url: "https://app.motusdao.org" },
};

function textOf(params: unknown): string {
  const parts = (params as { message?: { parts?: Array<{ text?: string }> } })?.message
    ?.parts;
  if (!Array.isArray(parts)) return "";
  return parts
    .map((part) => (typeof part?.text === "string" ? part.text : ""))
    .join(" ")
    .trim();
}

async function answer(text: string): Promise<string> {
  const toolMatch = /^\/tool\s+(\w+)\s*(.*)$/s.exec(text);
  if (!toolMatch) {
    const names = enabledToolSchemas(ENABLED)
      .map((tool) => tool.function.name)
      .join(", ");
    return `${CARD.name} is online. Skills: ${SKILLS.map((s) => s.id).join(", ")}. Tools: ${names}. Call one with "/tool <name> <json>".`;
  }

  const [, name, rawArgs = ""] = toolMatch;
  let args: Record<string, unknown> = {};
  if (rawArgs.trim()) {
    try {
      args = JSON.parse(rawArgs) as Record<string, unknown>;
    } catch {
      return `Invalid JSON arguments for ${name}.`;
    }
  }

  const session = createEmptySession({ locale: "es", userId: "mcp-client" });
  const { result } = await executeMottyTool(name as string, args, session, ENABLED);
  return JSON.stringify(result);
}

function sendJson(res: ServerResponse, status: number, body: unknown) {
  const payload = JSON.stringify(body);
  res.writeHead(status, {
    "content-type": "application/json",
    "access-control-allow-origin": "*",
  });
  res.end(payload);
}

async function readBody(req: IncomingMessage): Promise<string> {
  const chunks: Buffer[] = [];
  for await (const chunk of req) chunks.push(chunk as Buffer);
  return Buffer.concat(chunks).toString("utf8");
}

const server = createServer(async (req, res) => {
  if (req.method === "GET" && req.url === "/.well-known/agent-card.json") {
    return sendJson(res, 200, CARD);
  }
  if (req.method === "GET" && (req.url === "/" || req.url === "/health")) {
    return sendJson(res, 200, { ok: true, name: CARD.name, version: CARD.version });
  }
  if (req.method === "OPTIONS") {
    res.writeHead(204, {
      "access-control-allow-origin": "*",
      "access-control-allow-methods": "POST, GET, OPTIONS",
      "access-control-allow-headers": "content-type",
    });
    return res.end();
  }
  if (req.method !== "POST") return sendJson(res, 405, { error: "method_not_allowed" });

  let request: { id?: string | number | null; method?: string; params?: unknown };
  try {
    request = JSON.parse(await readBody(req));
  } catch {
    return sendJson(res, 400, { jsonrpc: "2.0", id: null, error: { code: -32700, message: "parse error" } });
  }

  if (request.method !== "message/send") {
    return sendJson(res, 200, {
      jsonrpc: "2.0",
      id: request.id ?? null,
      error: { code: -32601, message: `method not found: ${request.method}` },
    });
  }

  const text = textOf(request.params);
  const reply = await answer(text);

  return sendJson(res, 200, {
    jsonrpc: "2.0",
    id: request.id ?? null,
    result: {
      kind: "message",
      role: "agent",
      messageId: crypto.randomUUID(),
      parts: [{ kind: "text", text: reply }],
    },
  });
});

server.listen(PORT, () => {
  console.log(`motty-a2a listening on ${PORT} (${PUBLIC_URL})`);
});
