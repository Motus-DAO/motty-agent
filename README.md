# @motusdao/motty

Reusable **Motty** agent for MotusDAO apps: lightweight in-process guide that answers from Motus Knowledge MCP, can run a conversion funnel (lead → offer → deep-link checkout → handoff), and supports **per-person auth + learning progress** via host adapters.

Extracted from the three near-copies in:

- `LandingMotus` — public ecosystem guide + funnel tools (stubbed)
- `PD-MD-LandingA` — Academia funnel via prompt
- `motusdao-hub` — authenticated Hub companion + Prisma progress

## What you get

| Layer | Import | Contents |
|-------|--------|----------|
| Core | `@motusdao/motty` | agent loop, MCP client, namespaces allowlist, HMAC session cookie, Venice provider, tools |
| Next | `@motusdao/motty/next` | `createMottyChatHandler()` for `POST /api/motty/chat` |
| React | `@motusdao/motty/react` | `MottyWidget`, `MottyAvatar`, `MottyMarkdown` |
| Assets | `assets/motty/` | gif + still — copy to host `public/motty/` |

Motty is **not** MotusAI / PsyChat / OpenClaw. Public runtime is always `in-process-loop`.

## Install

```bash
# from another Motus repo (path / git)
npm install ../Agents/motty-agent
# or
npm install git+ssh://git@github.com/MotusDAO/motty-agent.git
```

Peer deps (when using UI / Next route): `next`, `react`, `react-dom`, `react-markdown`, `lucide-react`.

Copy assets:

```bash
cp -R node_modules/@motusdao/motty/assets/motty public/motty
```

Env: see [`.env.example`](./.env.example).

## Public landing (anonymous)

```ts
// app/api/motty/chat/route.ts
import { cookies } from 'next/headers'
import { createMottyChatHandler } from '@motusdao/motty/next'

export const runtime = 'nodejs'
export const POST = createMottyChatHandler({
  config: { cookieName: 'motty_session', mcpClientName: 'motty-my-landing' },
  getCookieJar: async () => cookies(),
})
```

```tsx
// app/layout.tsx
import { MottyWidget } from '@motusdao/motty/react'
import '@motusdao/motty/styles.css'

<MottyWidget
  locale="es"
  delayedReveal
  copy={{
    title: 'Motty',
    subtitle: 'Guía del ecosistema MotusDAO',
    greeting: 'Hola — soy Motty. ¿Buscas Hub, Academia o Agents?',
    disclaimer: 'No soy terapeuta ni MotusAI.',
    crisis: 'Si estás en crisis, contacta emergencias locales.',
    placeholder: 'Escribe tu pregunta…',
    send: 'Enviar',
    close: 'Cerrar',
    fab: 'Abrir Motty',
    thinking: 'Pensando…',
    error: 'No pude responder. Intenta de nuevo.',
    rateLimit: 'Demasiados mensajes. Espera un momento.',
  }}
/>
```

## Authenticated + DB progress (Hub-style)

```ts
export const POST = createMottyChatHandler({
  config: { cookieName: 'motty_hub_apd_session', mcpClientName: 'motty-hub' },
  resolveAuth: async (request) => {
    const userId = await yourRequireSession(request) // server-verified
    return { mode: 'authenticated', userId }
  },
  loadLearningContext: async (userId) => {
    // Query YOUR DB; return { userId, currentRouteStage, summary }
    return yourLoadProgress(userId)
  },
  systemPrompt: (locale, { pagePath }) => hubCompanionPrompt(locale, { pagePath }),
  getCookieJar: async () => cookies(),
})
```

- Cookie is bound to `userId`; mismatch resets the session.
- Client body never supplies `userId`.
- Learning context is injected as a second system message; foreign `userId` is dropped.

## Funnel tools

Default enabled: `searchKnowledge` only.

Schemas for lead / offer / checkout / handoff ship in the package — enable without rewriting the loop:

```ts
createMottyChatHandler({
  enabledTools: [
    'searchKnowledge',
    'updateCurrentLead',
    'getRecommendedOffer',
    'createCheckout',
    'createAccount',
    'handoffToHuman',
  ],
  // …
})
```

Checkout v1 = **deep links**, not a payments API. Handoff via `MOTTY_HANDOFF_*` env.

## Knowledge allowlist

Server-side only: `brand`, `product`. Internal namespaces → `namespace_not_allowed` (never retried against MCP).

## Layout

```
src/
  core/       config, mcp, session, agent-loop, provider, …
  tools/      searchKnowledge + funnel tools
  presets/    public + hub system prompts
  next/       createMottyChatHandler
  react/      MottyWidget, Avatar, Markdown, CSS
assets/motty/
examples/
```

## Scripts

```bash
npm install
npm run build
npm test
```

## Sources

Canonical product notes: `LandingMotus/docs/MOTTY.md`.
