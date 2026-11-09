# MCP surface

The same payment/booking tools the in-process agent uses are exposed over
**MCP** (Model Context Protocol), so any MCP client can call them: Claude
Desktop, Cursor, an orchestrator, or your own runtime.

## Run

```bash
npm run build
npm run mcp        # stdio, newline-delimited JSON-RPC 2.0
```

The server speaks MCP `2024-11-05` over **stdio**:

| Method | What it does |
| --- | --- |
| `initialize` | protocol version, `tools` capability, server info |
| `tools/list` | 11 tools with JSON Schema inputs |
| `tools/call` | executes one tool, returns the `ToolResult` as text |
| `ping` | liveness |

## Client config

```json
{
  "mcpServers": {
    "motty-pay": {
      "command": "node",
      "args": ["/opt/motty/dist/mcp/server.js"]
    }
  }
}
```

## Example (stdin)

```bash
printf '%s\n' \
  '{"jsonrpc":"2.0","id":1,"method":"initialize","params":{}}' \
  '{"jsonrpc":"2.0","id":2,"method":"tools/call","params":{"name":"quoteTherapyInWmxn","arguments":{}}}' \
  | npm run mcp
```

```json
{"jsonrpc":"2.0","id":2,"result":{"content":[{"type":"text","text":"{\"ok\":true,\"tool\":\"quoteTherapyInWmxn\",\"data\":{\"usd\":45,\"mxn\":832.5,...}}"}],"isError":false}}
```

## Adapter

Without a host, the server registers `createMockPaymentsAdapter()`: no database,
no chain, no keys. Set `MOTTY_ADAPTER=host` and call `configureMottyPayments()`
before importing the server to use real data — the MCP server never signs.

## Tools

`searchKnowledge`, the 6 funnel tools, and the 10 payment tools
(`getMyUpcomingSession`, `quoteTherapyInWmxn`, `getMyWalletBalance`,
`getMyPaymentStatus`, `createTherapyEscrowForMySession`, `getMyRipioRampLink`,
`prepareTransfer`, `getMyTherapistAvailability`, `bookTherapySession`,
`createProductPayment`).
