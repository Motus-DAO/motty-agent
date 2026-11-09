# A2A surface

An **A2A** (Agent-to-Agent) endpoint, so another agent can discover Motty Pay and
send it work without a human in the loop.

```bash
npm run build
PORT=8080 MOTTY_PUBLIC_URL=https://motty.example.org/ npm run a2a
```

## Discovery

```bash
curl -s http://localhost:8080/.well-known/agent-card.json
```

```json
{
  "protocolVersion": "0.2.0",
  "name": "Motty Pay",
  "url": "https://motty.example.org/",
  "preferredTransport": "JSONRPC",
  "capabilities": { "streaming": false, "pushNotifications": false },
  "skills": [
    { "id": "book-therapy" },
    { "id": "settle-escrow" },
    { "id": "pay-people" },
    { "id": "ripio-ramp" }
  ]
}
```

## Message

`POST /` with JSON-RPC 2.0, method `message/send`:

```bash
curl -s -X POST http://localhost:8080/ \
  -H 'content-type: application/json' \
  -d '{"jsonrpc":"2.0","id":1,"method":"message/send","params":{"message":{"role":"user","parts":[{"kind":"text","text":"/tool quoteTherapyInWmxn"}]}}}'
```

```json
{"jsonrpc":"2.0","id":1,"result":{"kind":"message","role":"agent","parts":[{"kind":"text","text":"{\"ok\":true,\"tool\":\"quoteTherapyInWmxn\",\"data\":{\"usd\":45,...}}"}]}}
```

Without the `/tool <name> [json]` prefix the agent answers with its skill and
tool list, which is what an orchestrator uses to decide whether to delegate.

## Scope

This is a **reference surface**, not a hosted service: it runs the same tool
layer as the chat agent with the mock adapter by default. Free-form natural
language turns need a model provider (`VENICE_*` / `OPENAI_*`); the `/tool` path
works without one. It never signs and never holds keys — a payment is prepared as
a typed action and signed by the host.

## Deploy

Any container runtime works; there is no state on disk.

```bash
docker run -d --name motty-a2a --restart unless-stopped \
  -p 8088:8080 \
  -e MOTTY_PUBLIC_URL=https://motty.example.org/ \
  -v /opt/motty/dist:/app/dist:ro \
  -w /app node:20-alpine node dist/a2a/server.js
```

Put a TLS reverse proxy in front and point the agent card `url` at it.

## Live deployment (vps-brahma)

| Item | Value |
| --- | --- |
| Endpoint | <http://169.58.172.120:9088/> |
| Card | <http://169.58.172.120:9088/.well-known/agent-card.json> |
| Health | <http://169.58.172.120:9088/health> |
| Container | `motty-a2a` (node:20-alpine, `--restart unless-stopped`, port 9088 → 8080) |
| App dir | `/home/gerry/motty` (dist + package.json bind-mounted read-only) |

Redeploy after a build:

```bash
npm run build
tar czf - dist package.json | ssh vps-brahma 'tar xzf - -C ~/motty'
ssh vps-brahma 'docker restart motty-a2a'
```

Still plain HTTP on a raw port: put TLS in front (the host already runs Caddy on
80/443) and point `MOTTY_PUBLIC_URL` at the final URL.
