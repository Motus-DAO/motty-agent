import assert from "node:assert/strict";
import { test } from "node:test";
import { MCP_ENABLED_TOOLS, handleMcpRequest } from "./protocol.js";

test("tools/list exposes every enabled tool with a JSON schema", async () => {
  const outcome = await handleMcpRequest("tools/list", {});

  assert.equal(outcome.kind, "result");
  if (outcome.kind !== "result") return;

  const { tools } = outcome.result as {
    tools: Array<{ name: string; description: string; inputSchema: unknown }>;
  };

  assert.equal(tools.length, MCP_ENABLED_TOOLS.length);
  for (const tool of tools) {
    assert.ok(tool.name, "tool without name");
    assert.equal(typeof tool.description, "string");
    assert.ok(tool.inputSchema, `${tool.name} without inputSchema`);
  }
});

test("tools/call runs a payment tool against the mock adapter", async () => {
  const outcome = await handleMcpRequest("tools/call", {
    name: "quoteTherapyInWmxn",
    arguments: {},
  });

  assert.equal(outcome.kind, "result");
  if (outcome.kind !== "result") return;

  const { content, isError } = outcome.result as {
    content: Array<{ text: string }>;
    isError: boolean;
  };
  assert.equal(isError, false);
  const payload = JSON.parse(content[0].text) as { ok: boolean; data?: { usd: number } };
  assert.equal(payload.ok, true);
  assert.equal(payload.data?.usd, 45);
});

test("unknown tools fail without throwing", async () => {
  const outcome = await handleMcpRequest("tools/call", { name: "not_a_tool", arguments: {} });

  assert.equal(outcome.kind, "result");
  if (outcome.kind !== "result") return;

  const { isError } = outcome.result as { isError: boolean };
  assert.equal(isError, true);
});

test("unknown methods return a JSON-RPC error", async () => {
  const outcome = await handleMcpRequest("resources/list", {});
  assert.equal(outcome.kind, "error");
  if (outcome.kind !== "error") return;
  assert.equal(outcome.code, -32601);
});
